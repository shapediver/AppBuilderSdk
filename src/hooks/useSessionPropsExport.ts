import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { PropsExport } from "types/components/shapediver/propsExport";

/**
 * Hook providing a shortcut to create export props for the ParametersAndExportsAccordionComponent 
 * component, for all exports of a session.
 * @param sessionId 
 * @returns 
 */
export function useSessionPropsExport(sessionId: string) : PropsExport[] {
	
	const propsParameters = useShapeDiverStoreParameters(state => Object.keys(state.useExports(sessionId)).map(id => {
		return {sessionId, exportId: id};
	}));

	return propsParameters;
}
