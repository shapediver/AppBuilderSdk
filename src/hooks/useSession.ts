import { ISessionApi } from "@shapediver/viewer";
import { useEffect, useRef, useState } from "react";
import { useShapeDiverStoreViewer } from "store/shapediverStoreViewer";
import { SessionCreateDto } from "types/store/shapediverStoreViewer";

/**
 * Hook for creating a session with a ShapeDiver model using the ShapeDiver 3D Viewer. 
 * @see {@link useShapeDiverStoreViewer} to access the API of the session. 
 * @see {@link useRegisterSessionParameters}
 * @param props 
 * @returns 
 */
export function useSession(props: SessionCreateDto) {
	const { createSession, closeSession } = useShapeDiverStoreViewer();
	const promiseChain = useRef(Promise.resolve());
	const [sessionApi, setSessionApi] = useState(undefined as ISessionApi | undefined);
	
	useEffect(() => {
		promiseChain.current = promiseChain.current.then(async () => {
			const api = await createSession(props);
			setSessionApi(api);
		});

		return () => {
			promiseChain.current = promiseChain.current.then(() => closeSession(props.id));
		};
	}, [props.id]);

	return {
		sessionApi
	};
}
