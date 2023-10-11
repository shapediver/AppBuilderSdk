import { useShapeDiverStoreParameters } from "store/shapediverStoreParameters";
import { IShapeDiverParameter } from "types/shapediver/parameter";

export function useParameter<T>(sessionId: string, parameterId: string) {
	
	const parametersStore = useShapeDiverStoreParameters();
	const parameter = parametersStore.useParameter(sessionId, parameterId)(state => state as IShapeDiverParameter<T>);

	return parameter;
}
