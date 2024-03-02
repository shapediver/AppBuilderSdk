import { ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v2";
import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { PropsParameter } from "types/components/shapediver/propsParameter";

/**
 * Hook providing a shortcut to create parameter props for the {@link ParametersAndExportsAccordionComponent} 
 * component, for all parameters of one or several sessions, using an optional filter.
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
			.map(store => { 
				const pstate = store.getState();
				
				return { sessionId, parameterId: pstate.definition.id, acceptRejectMode: pstate.acceptRejectMode}; 
			})
		)
	);

	return propsParameters;
}
