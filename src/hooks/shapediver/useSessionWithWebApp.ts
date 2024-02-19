import { IUseSessionDto, useSession } from "./useSession";
import { useOutputContent } from "./useOutputContent";
import { IAppBuilder } from "types/shapediver/webapp";
import AppBuilderContainerComponent from "components/shapediver/webapp/WebAppContainerComponent";
import AppBuilderFallbackContainerComponent from "components/shapediver/webapp/WebAppFallbackContainerComponent";
import { useSessionPropsParameter } from "./useSessionPropsParameter";
import { useSessionPropsExport } from "./useSessionPropsExport";

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
	const appbuilder = outputContent?.[0]?.data as IAppBuilder | undefined; // TODO validation
	console.debug(CUSTOM_DATA_OUTPUT_NAME, appbuilder);
	const hasAppBuilderOutput = !!outputApi;
	
	// get props for fallback parameters
	const parameterProps = useSessionPropsParameter(sessionId);
	const exportProps = useSessionPropsExport(sessionId);

	// TODO register custom parameters

	// create UI elements
	const elements: { top?: JSX.Element, bottom?: JSX.Element, left?: JSX.Element, right?: JSX.Element } = {
		top: undefined,
		bottom: undefined,
		left: undefined,
		right: undefined,
	};

	if (props) {
		if (appbuilder?.containers) {
			appbuilder.containers.forEach((container) => {
				elements[container.name] = AppBuilderContainerComponent({...container, sessionId: props.id });
			});
		}
		else if (!hasAppBuilderOutput)
		{
			elements.right = AppBuilderFallbackContainerComponent({parameters: parameterProps, exports: exportProps});
		}
	}
	
	return {
		sessionApi,
		show: Object.values(elements).some(e => e !== undefined),
		...elements
	};
}
