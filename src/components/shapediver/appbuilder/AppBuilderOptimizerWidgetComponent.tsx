import { ShapeDiverResponseParameter } from "@shapediver/sdk.geometry-api-sdk-v2";
import { AppBuilderSettingsContext } from "context/AppBuilderContext";
import { useSessionPropsParameter } from "hooks/shapediver/parameters/useSessionPropsParameter";
import { useSortedParametersAndExports } from "hooks/shapediver/parameters/useSortedParametersAndExports";
import { useOutputContent } from "hooks/shapediver/viewer/useOutputContent";
import { IObjectiveOutputData, OBJECTIVE_OUTPUT_NAME, ShapeDiverModelOptimizerNsga2 } from "optimization/optimizer";
import AlertPage from "pages/misc/AlertPage";
import React, { useContext } from "react";
import { IAppBuilderWidgetPropsOptimizer } from "types/shapediver/appbuilder";


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


	// get the parameters of the model
	const parameterProps = useSessionPropsParameter(sessionId);
	const sortedParamsAndExports = useSortedParametersAndExports(parameterProps);

	// get default values for the parameters
	const defaultValues: { [key: string]: string } = {};
	sortedParamsAndExports.forEach(p => {
		defaultValues[p.definition.id] = (p.definition as ShapeDiverResponseParameter).defval;
	});

	const runOptimizer = async () => {
		const optimizer = await ShapeDiverModelOptimizerNsga2.create({sessionDto, defaultParameterValues: defaultValues});
		optimizer.optimize({
			parameterIds: [],
			optimizerProps: {
				populationSize: 10,
				maxGenerations: 10,
			}
		});
	};


	return <></>;
		
}
