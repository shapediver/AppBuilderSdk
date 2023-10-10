import React, { JSX } from "react";
import { useShapediverStoreParameters } from "store/parameterStore";
import { IExportStore, IParameterStore } from "types/store/shapediverStoreParameters";

interface Props {
	sessionId: string,
	parametersRenderComponent: (props: { parameters: IParameterStore[] }) => JSX.Element,
	exportsRenderComponent: (props: { exports: IExportStore[] }) => JSX.Element,
}

/**
 * Functional component that creates a parameter UI for a list of parameters.
 *
 * Parameters that are specified as "hidden" will be skipped.
 *
 * The grouping is done via the "group" property and the order of the elements is done via the "order" property.
 *
 * @returns
 */
export default function ParameterUiComponent({ sessionId, parametersRenderComponent, exportsRenderComponent }: Props): JSX.Element {
	const parameters = useShapediverStoreParameters((state) => {
		return state.parameterStores[sessionId] ? Object.values(state.parameterStores[sessionId]) : [];
	});

	const exports = useShapediverStoreParameters(state => {
		return state.exportStores[sessionId] ? Object.values(state.exportStores[sessionId]) : [];
	});

	return(
		<>
			{ parametersRenderComponent ? parametersRenderComponent({ parameters }) : <></> }
			{ exportsRenderComponent ? exportsRenderComponent({ exports }) : <></> }
		</>
	);
}
