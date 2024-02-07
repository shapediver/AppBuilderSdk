import { useEffect } from "react";
import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { IGenericParameterDefinition, IGenericParameterExecutor } from "types/store/shapediverStoreParameters";


/**
 * Hook for defining generic parameters to be displayed in the UI. 
 * Generic parameters are not based on parameters exposed by a ShapeDiver model. 
 * They allow you to add custom controls to your web app.  
 * 
 * @see {@link useShapeDiverStoreParameters} to access the abstracted parameters and exports.
 *
 * @param sessionId The namespace to use for the parameters.
 * @param acceptRejectMode Set to true to require confirmation of the user to accept or reject changed parameter values
 * @param definitions Definitions of the parameters.
 * @param executor Executor of parameter changes.
 * @returns
 */
export function useDefineGenericParameters(sessionId: string, acceptRejectMode: boolean, 
	definitions: IGenericParameterDefinition | IGenericParameterDefinition[], 
	executor: IGenericParameterExecutor) {
	
	const { addGeneric, removeSession } = useShapeDiverStoreParameters();
	
	useEffect(() => {
		/** execute changes immediately if the component is not running in accept/reject mode */
		addGeneric(sessionId, acceptRejectMode, definitions, executor);
	
		return () => {
			removeSession(sessionId);
		};
	}, [sessionId, definitions]);

	return {
		
	};
}
