import { validateAppBuilder } from "types/shapediver/appbuildertypecheck";
import { IUseSessionDto, useSession } from "./useSession";
import { useOutputContent } from "./viewer/useOutputContent";
import { IAppBuilder } from "types/shapediver/appbuilder";
import { useEffect, useMemo } from "react";

/** Prefix used to register custom parameters */
//const CUSTOM_SESSION_ID_POSTFIX = "_appbuilder";

/** Name of data output used to
 *  define the custom UI behavior */
const CUSTOM_DATA_OUTPUT_NAME = "AppBuilder";

/** Name of input (parameter of the Grasshopper model) used to consume the custom parameter values */
//const CUSTOM_DATA_INPUT_NAME = "AppBuilder";

/**
 * Hook for creating a session with a ShapeDiver model using the ShapeDiver 3D Viewer.
 * Registers all parameters and exports defined by the model as abstracted 
 * parameters and exports for use by the UI components. 
 * This hook also registers custom parameters and UI elements defined by a data output component 
 * of the model named "AppBuilder". 
 * Updates of the custom parameter values are fed back to the model as JSON into 
 * a text input named "AppBuilder".
 * 
 * @param props 
 * @returns 
 */
export function useSessionWithAppBuilder(props: IUseSessionDto | undefined) {
	
	const sessionId = props?.id ?? "";

	// start session and register parameters and exports without acceptance mode
	const { sessionApi } = useSession(props ? {
		...props,
		acceptRejectMode: true,
	} : undefined);

	// get data output, parse it
	const { outputApi, outputContent } = useOutputContent( sessionId, CUSTOM_DATA_OUTPUT_NAME );

	const validate = (data: any) : IAppBuilder | undefined | Error => {
		const result = validateAppBuilder(data);
		if (result.success) {
			return result.data;
		}
		else {
			return new Error(`Parsing AppBuilder data failed: ${result.error.message}`);
		}
	};

	const outputData = outputContent?.[0]?.data as IAppBuilder | string | undefined;
	const parsedData = useMemo(() => ((data : IAppBuilder | string | undefined) => { 
		if (!data) return undefined;
		if (typeof data === "string") {
			let parsedJson : string;
			try {
				parsedJson = JSON.parse(data);
			} catch (e : any) {
				return new Error(`Parsing AppBuilder JSON data failed: ${e?.message ?? "unknown error"}`);
			}

			return validate(parsedJson);
		}
		
		return validate(data);
	})(outputData), [outputData]);

	useEffect(() => console.debug(CUSTOM_DATA_OUTPUT_NAME, parsedData), [parsedData]);

	const error = parsedData instanceof Error ? parsedData : undefined;
	const appBuilderData = parsedData instanceof Error ? undefined : parsedData;
	const hasAppBuilderOutput = !!outputApi;

	// TODO register custom parameters

	return {
		sessionApi,
		sessionId,
		error,
		appBuilderData,
		hasAppBuilderOutput
	};
}
