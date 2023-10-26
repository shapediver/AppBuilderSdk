import { ShapeDiverResponseExportDefinition } from "@shapediver/api.geometry-api-dto-v2";
import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { PropsExport } from "types/components/shapediver/propsExport";

/**
 * Hook providing a shortcut to create export props for the {@link ParametersAndExportsAccordionComponent}
 * component, for all exports of one or several sessions, using an optional filter. 
 * @param sessionId 
 * @param filter optional filter for export definitions
 * @returns 
 */
export function useSessionPropsExport(sessionId: string | string[], filter?: (param: ShapeDiverResponseExportDefinition) => boolean) : PropsExport[] {
	
	const _filter = filter || (() => true); 

	const propsExports = useShapeDiverStoreParameters(state => (Array.isArray(sessionId) ? sessionId : [sessionId])
		.flatMap(sessionId => Object
			.values(state.getExports(sessionId))
			.filter(store => _filter(store.getState().definition))
			.map(store => { return {sessionId, exportId: store.getState().definition.id}; })
		)
	);

	return propsExports;
}
