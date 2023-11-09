import { useEffect, useRef, useState } from "react";
import { SessionCreateDto } from "types/store/shapediverStoreViewer";
import { useSession } from "./useSession";
import { useSessionPropsParameter } from "./useSessionPropsParameter";
import { IGenericParameterDefinition } from "types/store/shapediverStoreParameters";
import { useSessionPropsExport } from "./useSessionPropsExport";
import { useDefineGenericParameters } from "./useDefineGenericParameters";
import { useOutput } from "./useOutput";
import { ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v2";
import { useParameterStateless } from "./useParameterStateless";

interface Props {
	sessionDto: SessionCreateDto,
	acceptRejectMode: boolean,
}

const CUSTOM_SESSION_ID = "mysession";
const CUSTOM_DATA_OUTPUT_NAME = "CustomUI";

interface ICustomUiData {
	hidden?: string[],
	parameters?: ShapeDiverResponseParameter[]
}

interface ICustomUiState {
	hidden: string[],
	parameters: IGenericParameterDefinition[]
}

export function useSessionWithCustomUi(props: Props) {
	const { sessionDto, acceptRejectMode } = props;
	const sessionId = sessionDto.id;

	// use a session with a ShapeDiver model and register its parameters and exports
	const { sessionApi } = useSession({
		...sessionDto,
		registerParametersAndExports: true,
		// the custom UI input parameter shall always execute immediately
		acceptRejectMode: param => param.name === CUSTOM_DATA_OUTPUT_NAME ? false : acceptRejectMode,
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
	const customUiParam = useParameterStateless<string>(sessionId, CUSTOM_DATA_OUTPUT_NAME);

	// define custom parameters
	useDefineGenericParameters(CUSTOM_SESSION_ID, acceptRejectMode, 
		customUiState.parameters,
		(values) => new Promise((resolve, reject) => {
			Object.keys(values).forEach(key => customParameterValues.current[key] = values[key]);
			console.debug("Custom parameter values changes", values, "New state", customParameterValues.current);
			if (customUiParam && customUiParam.definition.type === "String") {
				customUiParam.actions.setUiValue(JSON.stringify(customParameterValues.current));
				customUiParam.actions.execute(true).then(resolve).catch(reject);
			}
			else {
				console.warn(`Could not find a string input named ${CUSTOM_DATA_OUTPUT_NAME}`);
				resolve(values);
			}
		})			
	);

	// get output "CUSTOM_DATA_OUTPUT_NAME", react to its changes, and set the custom UI state
	const { outputApi, outputNode } = useOutput(sessionId, CUSTOM_DATA_OUTPUT_NAME);
	useEffect(() => {
		if (outputApi) {
			if ( outputApi.content && outputApi.content.length > 0 && outputApi.content[0].data ) {
				const customUiData = outputApi.content[0].data as ICustomUiData;
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
	}, [outputNode, outputApi]);

	// get parameters that should not be hidden
	const sessionParameterProps = useSessionPropsParameter(sessionId, param => {

		if ( customUiState.hidden.find(v => param.name === v
			|| param.displayname === v
			|| `parameter:${param.name}` === v
			|| `parameter:${param.displayname}` === v
			|| param.group?.name === v
			|| `group:${param.group?.name}` === v
			// we hide the custom UI input parameter
			|| param.name.toLowerCase() === CUSTOM_DATA_OUTPUT_NAME.toLowerCase()
		) )
			return false;
	
		return true;
	});

	// get exports that should not be hidden
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

	// get custom parameters
	const customParameterProps = useSessionPropsParameter(CUSTOM_SESSION_ID);

	return {
		parameterProps: customParameterProps.concat(sessionParameterProps),
		exportProps
	};
}
