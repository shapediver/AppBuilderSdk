import { ShapeDiverResponseParameter } from "@shapediver/sdk.geometry-api-sdk-v2";
import { AppBuilderSettingsContext } from "context/AppBuilderContext";
import { Paper, Title, List, Button} from "@mantine/core";
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

	const [result, setResult] = useState<string>();

	const runOptimizer = async () => {
		const optimizer = await ShapeDiverModelOptimizerNsga2.create({sessionDto, defaultParameterValues: defaultValues});
		const result = await optimizer.optimize({
			parameterIds: undefined,
			optimizerProps: {
				populationSize: 3,
				maxGenerations: 3,
			}
		});
		console.debug("result", result);
		setResult(JSON.stringify(result, null, 2));
		customize(result.parameterValues[0]);
	};


	return <>
	
		<Paper>
			<Title order={2}>Goals to optimize</Title>

			<List>
				{Object.entries(objectives).map(([key, value], index) => (
					<List.Item key={index}>
						{key}: {value}
					</List.Item>
				))}
			</List>

			<Button onClick={runOptimizer} variant="filled">Run Optimization</Button>

			{result}
		</Paper>
	</>;
		
}
