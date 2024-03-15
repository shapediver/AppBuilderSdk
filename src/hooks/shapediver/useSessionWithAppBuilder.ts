import { validateAppBuilder } from "types/shapediver/appbuildertypecheck";
import { IUseSessionDto, useSession } from "./useSession";
import { useOutputContent } from "./viewer/useOutputContent";
import { IAppBuilder } from "types/shapediver/appbuilder";

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

	const validate = (data: any) : IAppBuilder | undefined => {
		const result = validateAppBuilder(data);
		if (result.success) {
			return result.data;
		}
		else {
			// TODO set error state
			console.error("AppBuilder data validation failed", result.error.message);

			return undefined;
		}
	};

	const appBuilderData = ((data : IAppBuilder | string | undefined) => { 
		if (!data) return undefined;
		if (typeof data === "string") {
			try {
				return validate(JSON.parse(data));
			} catch (e) {
				console.error("Error parsing AppBuilder data", e);
				
				return undefined;
			}
		}
		
		return validate(data);
	})(outputContent?.[0]?.data as IAppBuilder | string | undefined);
	console.debug(CUSTOM_DATA_OUTPUT_NAME, appBuilderData);
	const hasAppBuilderOutput = !!outputApi;

	// TODO register custom parameters

	return {
		sessionApi,
		sessionId,
		appBuilderData,
		hasAppBuilderOutput
	};
}
