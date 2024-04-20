import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { IShapeDiverParameter } from "types/shapediver/parameter";

/**
 * Hook providing a shortcut to all abstracted parameters of a session managed by {@link useShapeDiverStoreParameters}. 
 * 
 * @see {@link IShapeDiverParameter<T>}
 * 
 * @param sessionId 
 * @param parameterId Id, name, or displayname of the parameter
 * @returns 
 */
export function useParametersStateless(sessionId: string) {
	
	const parametersStore = useShapeDiverStoreParameters();
	const paramStores = parametersStore.getParameters(sessionId);
	const parameters: { [key: string]: IShapeDiverParameter<any> } = {};
	Object.keys(paramStores).forEach((id) => parameters[id] = paramStores[id].getState());
	
	return parameters;
}
