import { 
	ShapeDiverResponseDto, 
	ShapeDiverResponseOutput, 
	ShapeDiverResponseParameterType, 
	ShapeDiverSdk, 
	create 
} from "@shapediver/sdk.geometry-api-sdk-v2";
import { SessionCreationDefinition } from "@shapediver/viewer";
import { INSGA2Props, INSGA2Result, NSGA2 } from "./nsga2";

/**
 * Type for default parameter values (parameters not to be optimized)
 */
export type ParameterValuesType = { [key: string]: string };

/**
 * Type used for Chromosomes
 */
type ChromosomeType = string;

/**
 * Properties for creating a ShapeDiverModelOptimizer
 */
export interface IShapeDiverModelOptimizerCreateProps {
    /**
     * Definition of the session to create
     */
    sessionDto: SessionCreationDefinition,
    /**
     * Default values for the parameters which should not be optimized
     */
    defaultParameterValues: ParameterValuesType,
}

/**
 * Type of the generation callback. "individuals" is the current population.
 */
export type GenerationCallbackTypeExt<Tchromosome> = (generation: INSGA2ResultExt<Tchromosome>) => void;

/**
 * Properties for optimizing a ShapeDiver model
 */
export interface IShapeDiverModelOptimizerProps<Tprops> {
	/**
	 * Ids of the parameters to be included in the optimization. If not set, all parameters are included.
	 */
    parameterIds?: string[], 
	/**
	 * Optimizer-specific properties
	 */
    optimizerProps: Tprops,
	/**
	 * Callback function to be called after each generation.
	 */
	generationCallback?: GenerationCallbackTypeExt<ChromosomeType>,
}

/**
 * Interface for a ShapeDiver model optimizer
 */
export interface IShapeDiverModelOptimizer<Tprops, Tresult> {
    /**
     * Run the optimization
     * @param options 
     * @returns 
     */
    optimize: (options: IShapeDiverModelOptimizerProps<Tprops>) => Promise<Tresult>;
	/**
	 * Request the cancellation of the optimization
	 */
	requestCancellation: () => void;
}

export interface INSGA2ResultExt<T> extends INSGA2Result<T> {
	/**
	 * Parameter values corresponding to the individuals
	 */
	parameterValues: ParameterValuesType[];
}

/**
 * Name of the data output which defines the objectives
 */
export const OBJECTIVE_OUTPUT_NAME = "Objectives";

/**
 * Interface for the data output of the objectives
 */
export interface IObjectiveOutputData { [key: string]: number }

/**
 * ShapeDiver model optimizer using NSGA2
 */
export class ShapeDiverModelOptimizerNsga2 implements IShapeDiverModelOptimizer<INSGA2Props, INSGA2ResultExt<ChromosomeType>> {

	initialObjectives: IObjectiveOutputData;
	objectiveSize: number;

	constructor(
        private sdk: ShapeDiverSdk, 
        private modelDto: ShapeDiverResponseDto, 
        private defaultParameterValues: ParameterValuesType,
		private nsga2?: NSGA2<ChromosomeType>
	) {
		this.initialObjectives = this.getObjectives(modelDto);
		this.objectiveSize = Object.keys(this.initialObjectives).length;
	}
	
	requestCancellation() {
		if (this.nsga2) {
			this.nsga2.requestCancellation();
		}
	}
	
	getObjectives(response: ShapeDiverResponseDto): IObjectiveOutputData {
		const _objectiveOutput = Object.values(response.outputs!).find(output => output.name === OBJECTIVE_OUTPUT_NAME);
		if (!_objectiveOutput) {
			throw new Error(`Output "${OBJECTIVE_OUTPUT_NAME}" not found in model`);
		}

		const objectiveOutput = _objectiveOutput as ShapeDiverResponseOutput;
		if (objectiveOutput.status_computation !== "success" || objectiveOutput.status_collect !== "success") {
			throw new Error(`Output "${OBJECTIVE_OUTPUT_NAME}" not successfully computed`);
		}
		
		const content = objectiveOutput.content;
		if (!content || content.length !== 1) {
			throw new Error(`Output "${OBJECTIVE_OUTPUT_NAME}" must have exactly one content item`);
		}

		return content[0].data as IObjectiveOutputData;
	}
	
	/**
     * Create an instance of the NSGA-II optimizer.
     * @param props 
     * @returns 
     */
	public static async create(props: IShapeDiverModelOptimizerCreateProps): Promise<IShapeDiverModelOptimizer<INSGA2Props, INSGA2ResultExt<ChromosomeType>>> {
		
		const { sessionDto, defaultParameterValues } = props;
   
		const sdk = create(sessionDto.modelViewUrl, sessionDto.jwtToken);
		const modelDto = await sdk.session.init(sessionDto.ticket!);

		return new ShapeDiverModelOptimizerNsga2(sdk, modelDto, defaultParameterValues);
	}

	public async optimize(props: IShapeDiverModelOptimizerProps<INSGA2Props>): Promise<INSGA2ResultExt<ChromosomeType>> {
		const { 
			parameterIds: _parameterIds, 
			optimizerProps,
			generationCallback: _generationCallback,
		} = props;
		
		const parameterIds = _parameterIds ?? Object.keys(this.modelDto.parameters!);
		const chromosomeSize = parameterIds.length;
		
		const genomeFunction = (index: number): string => {
			const parameterId = parameterIds[index];
			const parameterDefinition = this.modelDto.parameters![parameterId];
			if (parameterDefinition.type === ShapeDiverResponseParameterType.BOOL)
			{
				return Math.random() < 0.5 ? "true" : "false";
			}
			else if (parameterDefinition.type === ShapeDiverResponseParameterType.INT)
			{
				const min = parameterDefinition.min as number;
				const max = parameterDefinition.max as number;
				const range = max - min;
				const value = Math.floor(Math.random() * (range + 1)) + min;
				
				return (value >= max ? max : value).toString();
			}
			else if (parameterDefinition.type === ShapeDiverResponseParameterType.FLOAT)
			{
				const min = parameterDefinition.min as number;
				const max = parameterDefinition.max as number;
				const range = max - min;
				
				return (Math.random() * range + min).toFixed(parameterDefinition.decimalplaces).toString();
			}
			else if (parameterDefinition.type === ShapeDiverResponseParameterType.ODD || parameterDefinition.type === ShapeDiverResponseParameterType.EVEN)
			{
				const min = parameterDefinition.min as number;
				const max = parameterDefinition.max as number;
				const range = Math.round((max - min) / 2);
				const value = 2 * Math.floor(Math.random() * (range + 1)) + min;
				
				return (value >= max ? max : value).toString();
			}
			else if (parameterDefinition.type === ShapeDiverResponseParameterType.STRINGLIST)
			{
				const choices = parameterDefinition.choices as string[];
				const index = Math.floor(Math.random() * choices.length);
				
				return choices[index >= choices.length ? choices.length - 1 : index];
			}
			else {
				throw new Error(`Unsupported parameter type: ${parameterDefinition.type}`);
			}
		};

		const objectiveFunction = async (chromosome: string[]): Promise<number[]> => {
			// run ShapeDiver computation
			//console.debug("Running ShapeDiver computation with chromosome", chromosome);
	
			const body: { [key: string]: string } = { ...this.defaultParameterValues };
			chromosome.forEach((value, index) => {
				const parameterId = parameterIds[index];
				body[parameterId] = value;
			});
	
			const result = await this.sdk.output.customize(this.modelDto.sessionId!, body);
			const objectives =  this.getObjectives(result);

			if (Object.keys(objectives).length !== this.objectiveSize) {
				throw new Error(`Expected ${this.objectiveSize} objectives, but got ${Object.keys(objectives).length}`);
			}

			for (const key in this.initialObjectives) {
				if (!(key in objectives)) {
					throw new Error(`Objective "${key}" not found in result`);
				}
			}

			const objectiveValues: number[] = [];
			Object.keys(this.initialObjectives).sort().forEach(key => {
				objectiveValues.push(objectives[key]);
			});

			return objectiveValues;
		};

		const generationCallback = _generationCallback ? 
			(generation: INSGA2Result<ChromosomeType>) => {
				_generationCallback(this.mapResult(generation, parameterIds));
			} : undefined;
	
		this.nsga2 = new NSGA2({
			chromosomeSize, 
			genomeFunction, 
			objectiveSize: this.objectiveSize, 
			objectiveFunction,
			generationCallback,
			...optimizerProps});
        
		const result = await this.nsga2.optimize(true);
		this.nsga2 = undefined;
		
		return this.mapResult(result, parameterIds);
	}

	mapResult(result: INSGA2Result<ChromosomeType>, parameterIds: string[]): INSGA2ResultExt<ChromosomeType> {
		const { individuals } = result;
		const resultExt = {
			individuals,
			parameterValues: individuals.map(individual => { 
				const parameterValues = { ...this.defaultParameterValues};
				individual.chromosome.forEach((value, index) => {
					parameterValues[parameterIds[index]] = value;
				});

				return parameterValues;
			})
		};

		return resultExt;
	}

}    
