import { useEffect } from "react";
import { useShapeDiverStoreParameters } from "store/shapediverStoreParameters";
import { ISessionApi } from "@shapediver/viewer";

/**
 * Hook for registering all parameters and exports defined by a 
 * ShapeDiver 3D Viewer session with the store of abstracted
 * parameters and exports. 
 * @see {@link useShapeDiverStoreParameters}
 */
export function useRegisterSessionParameters(session: ISessionApi | undefined) {

	const { addSession, removeSession } = useShapeDiverStoreParameters();

	useEffect(() => {
		if (session) {
			addSession(session);
			
			return () => removeSession(session.id);
		}
	}, [session]);

}
