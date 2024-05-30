import { useEffect } from "react";
import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { IAcceptRejectModeSelector, IGenericParameterDefinition, IGenericParameterExecutor } from "types/store/shapediverStoreParameters";


/**
 * Hook for defining generic parameters to be displayed in the UI. 
 * Generic parameters are not based on parameters exposed by a ShapeDiver model. 
 * They allow you to add custom controls to your web app. 
 * CAUTION: Changes to the executor or acceptRejectMode are not reactive.
 * 
 * @see {@link useShapeDiverStoreParameters} to access the abstracted parameters and exports.
 *
 * @param sessionId The namespace to use for the parameters.
 * @param acceptRejectMode Set to true to require confirmation of the user to accept or reject changed parameter values
 * @param definitions Definitions of the parameters.
 * @param executor Executor of parameter changes.
 * @returns
 */
export function useDefineGenericParameters(sessionId: string, acceptRejectMode: boolean | IAcceptRejectModeSelector, 
	definitions: IGenericParameterDefinition | IGenericParameterDefinition[], 
	executor: IGenericParameterExecutor) {
	
	const { syncGeneric, removeSession } = useShapeDiverStoreParameters();
	
	// keep the generic parameters in sync
	useEffect(() => {
		syncGeneric(sessionId, acceptRejectMode, definitions, executor);
	}, [sessionId, definitions]);

	// in case the session id changes, remove the parameters for the previous session
	useEffect(() => {
		return () => {
			removeSession(sessionId);
		};
	}, [sessionId]);

	return {
		
	};
}
