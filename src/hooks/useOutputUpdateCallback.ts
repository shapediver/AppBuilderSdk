import { IOutputApi, ITreeNode } from "@shapediver/viewer";
import { useEffect } from "react";
import { useOutput } from "./useOutput";

/**
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html#updateCallback
 */
type UpdateCallback = (newNode?: ITreeNode, oldNode?: ITreeNode) => Promise<void> | void;

/**
 * Output update callbacks by (session id and output id or name), and callback id.
 */
type OutputUpdateCallbacks = { [key: string]: { [key: string]: UpdateCallback } };

/** 
 * Callbacks to use for IOutputApi.updateCallback
 */
const updateCallbacks : OutputUpdateCallbacks = {};
	
/**
 * Hook providing access to outputs by id or name, and allowing to register a callback for updates.
 * 
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
 * 
 * Makes use of {@link useOutput}.
 * 
 * @param sessionId 
 * @param outputIdOrName 
 * @returns 
 */
export function useOutputUpdateCallback(sessionId: string, outputIdOrName: string, callbackId: string, updateCallback: UpdateCallback) : {
	/**
	 * API of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
	 */
	outputApi: IOutputApi | undefined,
} {
	const { outputApi } = useOutput(sessionId, outputIdOrName);

	// manage callbacks
	useEffect(() => {
		const key = `${sessionId}_${outputIdOrName}`;
		if (!updateCallbacks[key]) {
			updateCallbacks[key] = {};
		}
		updateCallbacks[key][callbackId] = updateCallback;
				
		return () => {
			delete updateCallbacks[key][callbackId];
		};
	}, [sessionId, outputIdOrName, callbackId, updateCallback]);

	// register the single callback which will call all registered callbacks
	useEffect(() => {
		if (outputApi) {
			const key = `${sessionId}_${outputIdOrName}`;
			outputApi.updateCallback = async (newNode?: ITreeNode, oldNode?: ITreeNode) => {
				await Promise.all(Object.values(updateCallbacks[key]).map(cb => cb(newNode, oldNode)));
			};
		}

		return () => {
			if (outputApi) {
				outputApi.updateCallback = null;
			}
		};
	}, [outputApi]);
	
	return {
		outputApi,
	};
}
