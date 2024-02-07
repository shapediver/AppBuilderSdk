import { useEffect, useRef, useState } from "react";
import { SessionCreateDto } from "types/store/shapediverStoreViewer";
import { useSession } from "./useSession";
import { useSessionPropsParameter } from "./useSessionPropsParameter";
import { IGenericParameterDefinition } from "types/store/shapediverStoreParameters";
import { useSessionPropsExport } from "./useSessionPropsExport";
import { useDefineGenericParameters } from "./useDefineGenericParameters";
import { ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v2";
import { useParameterStateless } from "./useParameterStateless";
import { useOutputContent } from "./useOutputContent";

interface Props {
	/**
	 * Data of session to create.
	 */
	sessionDto: SessionCreateDto,

	/**
	 * Set to true to require confirmation of the user to accept or reject changed parameter values.
	 */
	acceptRejectMode: boolean,
}

/** Prefix used to register custom parameters */
const CUSTOM_SESSION_ID_POSTFIX = "_customui";

/** Name of data output used to define the custom UI behavior */
const CUSTOM_DATA_OUTPUT_NAME = "CustomUI";

/** Name of input (parameter of the Grasshopper model) used to consume the customp parameter values */
const CUSTOM_DATA_INPUT_NAME = "CustomUI";

/**
 * Data structured used by the custom UI output.
 */
interface ICustomUiData {

	/**
	 * List of hidden parameters, exports, and groups.
	 */
	hidden?: string[],

	/**
	 * List of custom parameters.
	 */
	parameters?: ShapeDiverResponseParameter[]
}

/**
 * State of the custom UI.
 */
interface ICustomUiState {

	/**
	 * List of hidden parameters, exports, and groups.
	 */
	hidden: string[],

	/**
	 * List of custom parameters.
	 */
	parameters: IGenericParameterDefinition[]
}

/**
 * Hook for creating a session with a ShapeDiver model using the ShapeDiver 3D Viewer.
 * Registers all parameters and exports defined by the model as abstracted 
 * parameters and exports for use by the UI components. 
 * This hook also registers custom parameters defined by a data output component 
 * of the model named "CustomUI". 
 * Updates of the custom parameter values are fed back to the model as JSON into 
 * a text input named "CustomUI".
 * 
 * @param props 
 * @returns 
 */
export function useSessionWithCustomUi(props: Props) {
	const { sessionDto, acceptRejectMode } = props;
	const sessionId = sessionDto.id;
	const sessionIdCustomUi = sessionId + CUSTOM_SESSION_ID_POSTFIX;

	// use a session with a ShapeDiver model and register its parameters and exports
	const { sessionApi } = useSession({
		...sessionDto,
		registerParametersAndExports: true,
		// the custom UI input parameter shall always execute immediately
		acceptRejectMode: param => param.name === CUSTOM_DATA_INPUT_NAME ? false : acceptRejectMode,
	});

	useEffect(() => {
		if (sessionApi)
			console.debug(`Available output names for session ${sessionDto.id}: ${Object.values(sessionApi.outputs).map(o => o.name)}`);
	}, [sessionApi]);
	
	// values of the custom parameters
	const customParameterValues = useRef<{ [key: string]: any }>({});

	// custom UI state
	const [customUiState, setCustomUiState] = useState<ICustomUiState>({hidden: [], parameters: []});

	// custom UI parameter
	const customUiParam = useParameterStateless<string>(sessionId, CUSTOM_DATA_INPUT_NAME);

	// define custom parameters and an execution callback for them
	useDefineGenericParameters(sessionIdCustomUi, acceptRejectMode, 
		customUiState.parameters,
		(values) => new Promise((resolve, reject) => {
			Object.keys(values).forEach(key => customParameterValues.current[key] = values[key]);
			console.debug("Custom parameter value changes", values, "New state", customParameterValues.current);
			if (customUiParam && customUiParam.definition.type === "String") {
				customUiParam.actions.setUiValue(JSON.stringify(customParameterValues.current));
				customUiParam.actions.execute(true).then(resolve).catch(reject);
			}
			else {
				console.warn(`Could not find a string input named ${CUSTOM_DATA_INPUT_NAME}`);
				resolve(values);
			}
		})			
	);

	// get output "CUSTOM_DATA_OUTPUT_NAME", react to its changes, and set the custom UI state
	const { outputApi, outputContent } = useOutputContent(sessionId, CUSTOM_DATA_OUTPUT_NAME);
	useEffect(() => {
		if (outputApi) {
			if ( outputContent && outputContent.length > 0 && outputContent[0].data ) {
				// TODO here we need to validate the data, instead of just casting it to ICustomUiData
				const customUiData = outputContent[0].data as ICustomUiData;
				console.debug(`Output ${outputApi?.id} (${outputApi?.displayname ? outputApi?.displayname : outputApi?.name}) version ${outputApi?.version}`, customUiData);
				
				customParameterValues.current = {};
				customUiData.parameters?.forEach(p => customParameterValues.current[p.id] = p.defval);
				setCustomUiState({ 
					hidden: customUiData.hidden || [],
					parameters: (customUiData.parameters || []).map(p => { return { definition: p }; })
				});
			} else
				console.debug(`Output with name "${CUSTOM_DATA_OUTPUT_NAME}" does not contain expected custom UI data`);
		} else
			console.debug(`Output with name "${CUSTOM_DATA_OUTPUT_NAME}" could not be found, check the available output names`);
	}, [outputApi, outputContent]);

	// get props for parameters that should not be hidden
	const sessionParameterProps = useSessionPropsParameter(sessionId, param => {

		if ( customUiState.hidden.find(v => param.name === v
			|| param.displayname === v
			|| `parameter:${param.name}` === v
			|| `parameter:${param.displayname}` === v
			|| param.group?.name === v
			|| `group:${param.group?.name}` === v
		) )
			return false;

		// we always hide the custom UI input parameter
		if (param.name.toLowerCase() === CUSTOM_DATA_INPUT_NAME.toLowerCase())
			return false;
	
		return true;
	});

	// get props for exports that should not be hidden
	const exportProps = useSessionPropsExport(sessionId, exp => {

		if ( customUiState.hidden.find(v => exp.name === v
			|| exp.displayname === v
			|| `export:${exp.name}` === v
			|| `export:${exp.displayname}` === v
			|| exp.group?.name === v
			|| `group:${exp.group?.name}` === v
		) )
			return false;
	
		return true;
	});

	// get props for custom parameters
	const customParameterProps = useSessionPropsParameter(sessionIdCustomUi);

	return {
		parameterProps: customParameterProps.concat(sessionParameterProps),
		exportProps
	};
}
