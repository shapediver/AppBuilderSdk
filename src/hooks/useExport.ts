import { useShapeDiverStoreParameters } from "store/shapediverStoreParameters";
import { IShapeDiverExport } from "types/shapediver/export";

export function useExport(sessionId: string, exportId: string) {
	
	const parametersStore = useShapeDiverStoreParameters();
	const parameter = parametersStore.useExport(sessionId, exportId)(state => state as IShapeDiverExport);

	return parameter;
}
