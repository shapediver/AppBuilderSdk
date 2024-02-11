import { IUseSessionDto, useSession } from "./useSession";
import { useOutputContent } from "./useOutputContent";
import { IWebApp } from "types/shapediver/webapp";
import WebAppContainerComponent from "components/shapediver/webapp/WebAppContainerComponent";

/** Prefix used to register custom parameters */
//const CUSTOM_SESSION_ID_POSTFIX = "_webappui";

/** Name of data output used to
 *  define the custom UI behavior */
const CUSTOM_DATA_OUTPUT_NAME = "WebAppUi";

/** Name of input (parameter of the Grasshopper model) used to consume the custom parameter values */
//const CUSTOM_DATA_INPUT_NAME = "WebAppUi";

/**
 * Hook for creating a session with a ShapeDiver model using the ShapeDiver 3D Viewer.
 * Registers all parameters and exports defined by the model as abstracted 
 * parameters and exports for use by the UI components. 
 * This hook also registers custom parameters and UI elements defined by a data output component 
 * of the model named "WebAppUi". 
 * Updates of the custom parameter values are fed back to the model as JSON into 
 * a text input named "WebAppUi".
 * 
 * @param props 
 * @returns 
 */
export function useSessionWithWebApp(props: IUseSessionDto | undefined) {
	
	// start session and register parameters and exports without acceptance mode
	const { sessionApi } = useSession(props ? {
		...props,
		acceptRejectMode: true,
	} : undefined);

	// get data output, parse it
	const { outputContent } = useOutputContent( props?.id ?? "", CUSTOM_DATA_OUTPUT_NAME );
	const webapp = outputContent?.[0]?.data as IWebApp | undefined; // TODO validation
	console.debug(CUSTOM_DATA_OUTPUT_NAME, webapp);

	// TODO register custom parameters

	// create UI elements
	const elements: { top?: JSX.Element, bottom?: JSX.Element, left?: JSX.Element, right?: JSX.Element } = {
		top: undefined,
		bottom: undefined,
		left: undefined,
		right: undefined,
	};

	if (props && webapp?.containers) {
		webapp.containers.forEach((container) => {
			elements[container.hint] = WebAppContainerComponent({...container, sessionId: props.id });
		});
	}

	return {
		sessionApi,
		...elements
	};
}
