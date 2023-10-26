import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { IShapeDiverExport } from "types/shapediver/export";

/**
 * Hook providing a shortcut to abstracted exports managed by {@link useShapeDiverStoreParameters}. 
 * @param sessionId 
 * @param exportId 
 * @returns 
 */
export function useExport(sessionId: string, exportId: string) {
	
	const parametersStore = useShapeDiverStoreParameters();
	const parameter = parametersStore.getExport(sessionId, exportId)(state => state as IShapeDiverExport);

	return parameter;
}
