import { ISessionApi } from "@shapediver/viewer";
import { useEffect, useRef, useState } from "react";
import { useShapeDiverStoreViewer } from "store/useShapeDiverStoreViewer";
import { SessionCreateDto } from "types/store/shapediverStoreViewer";
import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { IAcceptRejectModeSelector } from "types/store/shapediverStoreParameters";

/**
 * DTO for use with {@link useSession} and {@link useSessions}. 
 * Extends {@link SessionCreateDto}. 
 */
export interface IUseSessionDto extends SessionCreateDto {
	/** 
	 * Set to true to register the session's parameters and exports as 
	 * abstracted parameters and exports managed by {@link useShapeDiverStoreParameters}. 
	 */
	registerParametersAndExports?: boolean;

	/**
	 * Set to true to require confirmation of the user to accept or reject changed parameter values.
	 */
	acceptRejectMode?: boolean | IAcceptRejectModeSelector;
}

/**
 * Hook for creating a session with a ShapeDiver model using the ShapeDiver 3D Viewer.
 * Optionally registers all parameters and exports defined by the model as abstracted 
 * parameters and exports for use by the UI components.
 * 
 * @see {@link useShapeDiverStoreViewer} to access the API of the session.
 * @see {@link useShapeDiverStoreParameters} to access the abstracted parameters and exports.
 *
 * @param props {@link IUseSessionDto}
 * @returns
 */
export function useSession(props: IUseSessionDto) {
	const { registerParametersAndExports = false, acceptRejectMode = false } = props;
	const { createSession, closeSession } = useShapeDiverStoreViewer();
	const { addSession: addSessionParameters, removeSession: removeSessionParameters } = useShapeDiverStoreParameters();
	const [sessionApi, setSessionApi] = useState<ISessionApi | undefined>(undefined);
	const promiseChain = useRef(Promise.resolve());

	useEffect(() => {
		promiseChain.current = promiseChain.current.then(async () => {
			const api = await createSession(props);
			setSessionApi(api);

			if (registerParametersAndExports && api) {
				/** execute changes immediately if the component is not running in accept/reject mode */
				addSessionParameters(api, acceptRejectMode);
			}
		});

		return () => {
			promiseChain.current = promiseChain.current.then(async () => {
				await closeSession(props.id);

				if (registerParametersAndExports) {
					removeSessionParameters(props.id);
				}
			});
		};
	}, [props.id]);

	return {
		sessionApi
	};
}
