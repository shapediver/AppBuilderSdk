import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { IShapeDiverExport } from "types/shapediver/export";

/**
 * Hook providing a shortcut to abstracted exports managed by {@link useShapeDiverStoreParameters}. 
 * 
 * @see {@link IShapeDiverExport}
 * 
 * @param sessionId 
 * @param exportId Id, name, or displayname of the export
 * @returns 
 */
export function useExport(sessionId: string, exportId: string) {
	
	const parametersStore = useShapeDiverStoreParameters();
	const parameter = parametersStore.getExport(sessionId, exportId)!(state => state as IShapeDiverExport);

	return parameter;
}
