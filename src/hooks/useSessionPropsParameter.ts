import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { PropsParameter } from "types/components/shapediver/propsParameter";

/**
 * Hook providing a shortcut to create parameter props for the ParametersAndExportsAccordionComponent 
 * component, for all parameters of a session.
 * @param sessionId 
 * @returns 
 */
export function useSessionPropsParameter(sessionId: string) : PropsParameter[] {
	
	const propsParameters = useShapeDiverStoreParameters(state => Object.keys(state.useParameters(sessionId)).map(id => {
		return {sessionId, parameterId: id};
	}));

	return propsParameters;
}
