import { 
	ShapeDiverResponseDto, 
	ShapeDiverResponseOutput, 
	ShapeDiverResponseOutputDefinition, 
	ShapeDiverSdk, 
	create 
} from "@shapediver/sdk.geometry-api-sdk-v2";
import { SessionCreationDefinition } from "@shapediver/viewer";
import { INSGA2Props, INSGA2Result, NSGA2 } from "./nsga2";

/**
 * Type for default parameter values (parameters not to be optimized)
 */
type DefaultParameterValueType = { [key: string]: string };

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
    defaultParameterValues: DefaultParameterValueType,
}

/**
 * Properties for optimizing a ShapeDiver model
 */
export interface IShapeDiverModelOptimizerProps<Tprops> {
    parameterIds: string[], 
    optimizerProps: Tprops,
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
export class ShapeDiverModelOptimizerNsga2 implements IShapeDiverModelOptimizer<INSGA2Props, INSGA2Result<ChromosomeType>> {

	objectiveOutput: ShapeDiverResponseOutputDefinition;
	initialObjectives: IObjectiveOutputData;
	objectiveSize: number;

	constructor(
        private sdk: ShapeDiverSdk, 
        private modelDto: ShapeDiverResponseDto, 
        private defaultParameterValues: DefaultParameterValueType
	) {

		const _objectiveOutput = Object.values(modelDto.outputs!).find(output => output.name === OBJECTIVE_OUTPUT_NAME);
		if (!_objectiveOutput) {
			throw new Error(`Output "${OBJECTIVE_OUTPUT_NAME}" not found in model`);
		}
		this.objectiveOutput = _objectiveOutput;
		
		const content = (_objectiveOutput as ShapeDiverResponseOutput).content;
		if (!content || content.length !== 1) {
			throw new Error(`Output "${OBJECTIVE_OUTPUT_NAME}" must have exactly one content item`);
		}

		this.initialObjectives = content[0].data as IObjectiveOutputData;
		this.objectiveSize = Object.keys(this.initialObjectives).length;
	}
	
	/**
     * Create an instance of the NSGA-II optimizer.
     * @param props 
     * @returns 
     */
	public static async create(props: IShapeDiverModelOptimizerCreateProps): Promise<IShapeDiverModelOptimizer<INSGA2Props, INSGA2Result<ChromosomeType>>> {
		
		const { sessionDto, defaultParameterValues } = props;
   
		const sdk = create(sessionDto.modelViewUrl, sessionDto.jwtToken);
		const modelDto = await sdk.session.init(sessionDto.ticket!);

		return new ShapeDiverModelOptimizerNsga2(sdk, modelDto, defaultParameterValues);
	}

	public async optimize(props: IShapeDiverModelOptimizerProps<INSGA2Props>): Promise<INSGA2Result<ChromosomeType>> {
		const { parameterIds, optimizerProps: optimizerOptions } = props;

		const chromosomeSize = parameterIds.length;
		const genomeFunction = (index: number): string => {
			const parameterId = parameterIds[index];
			const parameterDefinition = this.modelDto.parameters![parameterId];
			// TODO create random value for parameter

			return parameterDefinition.defval;
		};

		const nsga2 = new NSGA2({
			chromosomeSize, 
			genomeFunction, 
			objectiveSize: this.objectiveSize, 
			objectiveFunction: this.objectiveFunction.bind(this),
			...optimizerOptions});
        
		return await nsga2.optimize(true);
	}

	/**
     * Evaluate the objectives for a given chromosome
     * @param chromosome 
     * @returns 
     */
	async objectiveFunction(chromosome: string[]): Promise<number[]> {
		// TODO run ShapeDiver computation
		console.debug("Running ShapeDiver computation with chromosome", chromosome);
		
		return new Array(this.objectiveSize).fill(0);
	}



}    
