import { IOutputApi } from "@shapediver/viewer";
import { useShapeDiverStoreViewer } from "store/useShapeDiverStoreViewer";

/**
 * Hook providing access to outputs by id or name. 
 * 
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
 * 
 * @param sessionId 
 * @param outputIdOrName 
 * @returns 
 */
export function useOutput(sessionId: string, outputIdOrName: string) : {
	/**
	 * API of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
	 */
	outputApi: IOutputApi | undefined,
} {
	
	const outputApi = useShapeDiverStoreViewer(state => {
		const sessionApi = state.sessions[sessionId];
		if (!sessionApi || !sessionApi.outputs)
			return;
		if (outputIdOrName in sessionApi.outputs)
			return sessionApi.outputs[outputIdOrName];
		const outputs = sessionApi.getOutputByName(outputIdOrName);
		
		return outputs.length > 0 ? outputs[0] : undefined;
	});

	return {
		outputApi
	};
}
