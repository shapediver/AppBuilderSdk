import { IAppBuilder } from "types/shapediver/appbuilder";
import { useCallback, useRef } from "react";
import { useParameterStateless } from "../parameters/useParameterStateless";
import { useDefineGenericParameters } from "../parameters/useDefineGenericParameters";
import { ShapeDiverResponseParameterType } from "@shapediver/api.geometry-api-dto-v2";
import { ISessionApi } from "@shapediver/viewer";
import { IAcceptRejectModeSelector } from "types/store/shapediverStoreParameters";

/** Prefix used to register custom parameters */
const CUSTOM_SESSION_ID_POSTFIX = "_appbuilder";

/** Name of input (parameter of the Grasshopper model) used to consume the custom parameter values */
const CUSTOM_DATA_INPUT_NAME = "AppBuilder";

interface Props {
	sessionApi: ISessionApi | undefined, 
	appBuilderData: IAppBuilder | undefined, 
	acceptRejectMode: IAcceptRejectModeSelector | boolean | undefined,
}

/**
 * This hook registers custom parameters and UI elements defined by a data output component 
 * of the model named "AppBuilder". Updates of the custom parameter values are fed back to the model as JSON into 
 * a text input named "AppBuilder".
 * 
 * @param sessionApi
 * @param appBuilderData
 * @returns 
 */
export function useAppBuilderCustomParameters(props: Props) {
	
	const { sessionApi, appBuilderData, acceptRejectMode } = props;
	const sessionId = sessionApi?.id ?? "";
	const sessionIdAppBuilder = sessionId + CUSTOM_SESSION_ID_POSTFIX;

	// values of the custom parameters
	const customParameterValues = useRef<{ [key: string]: any }>({});
	
	// App Builder parameter (used for sending values of custom parameters to the model)
	const appBuilderParam = useParameterStateless<string>(sessionId, CUSTOM_DATA_INPUT_NAME);

	// executor function for changes of custom parameter values
	const executor = useCallback((values: { [key: string]: any }) => new Promise((resolve, reject) => {
		Object.keys(values).forEach(key => customParameterValues.current[key] = values[key]);
		console.debug("Custom parameter value changes", values, "New state", customParameterValues.current);
		if (appBuilderParam && appBuilderParam.definition.type === ShapeDiverResponseParameterType.STRING) {
			appBuilderParam.actions.setUiValue(JSON.stringify(customParameterValues.current));
			appBuilderParam.actions.execute().then(resolve).catch(reject);
		}
		else {
			console.warn(`Parameter "${CUSTOM_DATA_INPUT_NAME}" not found or not of type 'String'!`);
			resolve(values);
		}
	}), [appBuilderParam]);

	// define custom parameters and an execution callback for them
	useDefineGenericParameters(sessionIdAppBuilder, 
		acceptRejectMode ?? false, 
		(appBuilderData?.parameters ?? []).map(p => ({definition: p})),
		executor,
	);
	
	return {
		
	};
}
