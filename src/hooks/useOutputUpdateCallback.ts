import { IOutputApi, ITreeNode } from "@shapediver/viewer";
import { useEffect } from "react";
import { useOutput } from "./useOutput";

type UpdateCallback = (newNode?: ITreeNode, oldNode?: ITreeNode) => Promise<void> | void;

type OutputUpdateCallbacks = { [key: string]: UpdateCallback};

/** 
 * Callbacks to use for IOutputApi.updateCallback
 */
const updateCallbacks : OutputUpdateCallbacks = {};
	
/**
 * Hook providing access to outputs by id or name, and allowing to register a callback for updates.
 * 
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
 * 
 * Makes use of @see {@link useOutput}.
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

	useEffect(() => {
		const key = `${sessionId}_${outputIdOrName}_${callbackId}`;
		updateCallbacks[key] = updateCallback;
				
		return () => {
			delete updateCallbacks[key];
		};
	}, [sessionId, outputIdOrName, callbackId, updateCallback]);

	useEffect(() => {
		if (outputApi) {
			outputApi.updateCallback = async (newNode?: ITreeNode, oldNode?: ITreeNode) => {
				await Promise.all(Object.values(updateCallbacks).map(cb => cb(newNode, oldNode)));
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
