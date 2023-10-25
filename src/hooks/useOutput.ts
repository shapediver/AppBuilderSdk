import { IOutputApi, ITreeNode } from "@shapediver/viewer";
import { useEffect, useState } from "react";
import { useShapeDiverStoreViewer } from "store/useShapeDiverStoreViewer";

/**
 * Hook providing access to outputs by id or name. 
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
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
	/**
	 * Scene tree node of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html#node
	 */
	outputNode: ITreeNode | undefined
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

	const [node, setNode] = useState<ITreeNode | undefined>(outputApi?.node);

	useEffect(() => {
		if (outputApi) {
			outputApi.updateCallback = (newNode?: ITreeNode /*, oldNode?: ITreeNode*/) => {
				setNode(newNode);
			};
		}	
	}, [outputApi]);
	
	return {
		outputApi,
		outputNode: node
	};
}
