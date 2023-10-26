import { ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v2";
import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { PropsParameter } from "types/components/shapediver/propsParameter";

/**
 * Hook providing a shortcut to create parameter props for the ParametersAndExportsAccordionComponent 
 * component, for all parameters of a session.
 * @param sessionId 
 * @param filter optional filter for parameter definitions
 * @returns 
 */
export function useSessionPropsParameter(sessionId: string | string[], filter?: (param: ShapeDiverResponseParameter) => boolean) : PropsParameter[] {
	
	const _filter = filter || (() => true); 

	const propsParameters = useShapeDiverStoreParameters(state => (Array.isArray(sessionId) ? sessionId : [sessionId])
		.flatMap(sessionId => Object
			.values(state.getParameters(sessionId))
			.filter(store => _filter(store.getState().definition))
			.map(store => { return {sessionId, parameterId: store.getState().definition.id}; })
		)
	);

	return propsParameters;
}
