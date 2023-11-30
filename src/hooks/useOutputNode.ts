import { IOutputApi, ITreeNode } from "@shapediver/viewer";
import { useCallback, useEffect, useId, useState } from "react";
import { useOutputUpdateCallback } from "./useOutputUpdateCallback";
import { useOutput } from "./useOutput";

type UpdateCallback = (newNode?: ITreeNode, oldNode?: ITreeNode) => Promise<void> | void;

/**
 * Hook providing access to outputs by id or name, 
 * allowing to register a callback for updates, 
 * and providing the scene tree node of the output.
 * 
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
 * 
 * Makes use of {@link useOutputUpdateCallback} and {@link useOutput}.
 * 
 * @param sessionId 
 * @param outputIdOrName 
 * @returns 
 */
export function useOutputNode(sessionId: string, outputIdOrName: string, callback?: UpdateCallback) : {
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
	const { outputApi } = useOutput(sessionId, outputIdOrName);

	const [node, setNode] = useState<ITreeNode | undefined>(outputApi?.node);

	// combine the optional user-defined callback with setting the current node
	const cb = useCallback( (node?: ITreeNode) => {
		setNode(node);
		
		return callback && callback(node);
	}, [callback] );

	const callbackId = useId();
	useOutputUpdateCallback(sessionId, outputIdOrName, callbackId, cb);
	
	// use an effect to set the initial node
	const [ initialNodeSet, setInitialNode ] = useState(false);
	useEffect(() => {
		if (!initialNodeSet && outputApi?.node) {
			if (node !== outputApi.node)
				setNode(outputApi.node);
			setInitialNode(true);
		}
	}, [outputApi, initialNodeSet]);

	return {
		outputApi,
		outputNode: node
	};
}
