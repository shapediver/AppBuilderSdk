import { ShapeDiverResponseParameter } from "@shapediver/sdk.geometry-api-sdk-v2";
import { AppBuilderSettingsContext } from "context/AppBuilderContext";
import { Paper, Title, Checkbox, Button, Switch, Slider, Text} from "@mantine/core";
import { useSessionPropsParameter } from "hooks/shapediver/parameters/useSessionPropsParameter";
import { useSortedParametersAndExports } from "hooks/shapediver/parameters/useSortedParametersAndExports";
import { useOutputContent } from "hooks/shapediver/viewer/useOutputContent";
import { IObjectiveOutputData, OBJECTIVE_OUTPUT_NAME, ParameterValuesType, ShapeDiverModelOptimizerNsga2 } from "optimization/optimizer";
import AlertPage from "pages/misc/AlertPage";
import React, { useContext, useEffect, useState } from "react";
import { IAppBuilderWidgetPropsOptimizer } from "types/shapediver/appbuilder";
import { useParametersStateless } from "hooks/shapediver/parameters/useParametersStateless";
import { useParameterChanges } from "hooks/shapediver/parameters/useParameterChanges";

interface Props extends IAppBuilderWidgetPropsOptimizer {
	/**
	 * Default session id to use for optimization.
	 */
	sessionId: string
}

export default function AppBuilderOptimizerWidgetComponent(props: Props) {
	const {
		sessionId,
	} = props;

	// get information about the AppBuilder settings (session, etc.)
	const { settings: appBuilderSettings } = useContext(AppBuilderSettingsContext);
	const sessionDto = appBuilderSettings!.sessions.find(s => s.id === sessionId)!;

	// get the objectives output
	const { outputContent } = useOutputContent( sessionId, OBJECTIVE_OUTPUT_NAME );
	const objectives = outputContent?.[0]?.data as IObjectiveOutputData | undefined;
	if (!objectives) return <AlertPage title="Error">An output named {OBJECTIVE_OUTPUT_NAME} could not be found or provides no data.</AlertPage>;

	const [solution, setSolution] = useState<ParameterValuesType>({});

	// get parameter stores
	const parameters = useParametersStateless(sessionId);
	const customize = (values: ParameterValuesType) => {
		Object.keys(values).forEach(id => {
			const actions = parameters[id].actions;
			if (actions.setUiValue(values[id])) {
				actions.execute(false);
			}
		});
		setSolution(values);
	};
	
	// get parameter changes
	const parameterProps = useSessionPropsParameter(sessionId);
	const parameterChanges = useParameterChanges(parameterProps);
	useEffect(() => {
		parameterChanges.forEach(c => c.accept());
	}, [solution]);
	
	// get default values for the parameters
	const defaultValues: ParameterValuesType = {};
	Object.keys(parameters).forEach(id => {
		defaultValues[id] = parameters[id].definition.defval;
	});

	const [populationSize, setPopulationSize] = useState(10);
	const [maxGenerations, setMaxGenerations] = useState(10);
	const [checkboxValues, setCheckboxValues] = useState([true, true]);

	const runOptimizer = async (values) => {
		const optimizer = await ShapeDiverModelOptimizerNsga2.create({sessionDto, defaultParameterValues: defaultValues});
		console.log("Running optimizer with values:", values);
		const result = await optimizer.optimize({
			parameterIds: undefined,
			optimizerProps: {
				populationSize: populationSize,
				maxGenerations: maxGenerations,
			}
		});
		
		customize(result.parameterValues[0]);
	};

	const [isVisible, setIsVisible] = useState(false);
	
	const handleToggle = (event) => {
		setIsVisible(event.currentTarget.checked);
	  };

	const handleCheckboxChange = (index) => {
		const newValues = [...checkboxValues];
		newValues[index] = !newValues[index];
		setCheckboxValues(newValues);
	};

	return <>

		<Paper>
			<Title order={2}>Goals to optimize</Title>


			{Object.entries(objectives).map(([key, value], index) => (

				<Checkbox
					defaultChecked
					label={key}
					onChange={() => handleCheckboxChange(index)}
				/>

			))}

			<Button onClick={() => runOptimizer(checkboxValues)} variant="filled">Run Optimization</Button>

			<Switch
				label="Avanced options"
				checked={isVisible}
				onChange={handleToggle}
			/>
		</Paper>

		{isVisible && (
			<Paper>
				<Title order={2}>Optimization options</Title>
				<Text>Population size</Text>
				<Slider
					label={populationSize}
					min={1}
					max={100}
					value={populationSize}
					onChange={setPopulationSize}
					showLabelOnHover={false}
					marks={[
					{ value: 1, label: '1' },
					{ value: 100, label: '100' }
					]}
				/>

				<Text>Maximum number of generations</Text>
				<Slider
					label={maxGenerations}
					min={1}
					max={100}
					value={maxGenerations}
					onChange={setMaxGenerations}
					showLabelOnHover={false}
					marks={[
					{ value: 1, label: '1' },
					{ value: 100, label: '100' }
					]}
				/>

			</Paper>
		)}
	</>;
		
}
