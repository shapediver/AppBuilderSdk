import { ISessionApi } from "@shapediver/viewer";
import { useEffect, useRef, useState } from "react";
import { useShapeDiverStoreViewer } from "store/shapediverStoreViewer";
import { SessionCreateDto } from "types/store/shapediverStoreViewer";
import { useShapeDiverStoreParameters } from "store/shapediverStoreParameters";

interface Props extends SessionCreateDto {
	isParametersRegister?: boolean;
}

/**
 * Hook for creating a session with a ShapeDiver model using the ShapeDiver 3D Viewer.
 * @see {@link useShapeDiverStoreViewer} to access the API of the session.
 * @param props
 * @returns
 */
export function useSession(props: Props) {
	const { isParametersRegister = false } = props;
	const { createSession, closeSession } = useShapeDiverStoreViewer();
	const { addSession: addSessionParameters, removeSession: removeSessionParameters } = useShapeDiverStoreParameters();
	const [sessionApi, setSessionApi] = useState<ISessionApi | undefined>(undefined);
	const promiseChain = useRef(Promise.resolve());

	useEffect(() => {
		promiseChain.current = promiseChain.current.then(async () => {
			const api = await createSession(props);
			setSessionApi(api);

			if (isParametersRegister && api) {
				addSessionParameters(api);
			}
		});

		return () => {
			promiseChain.current = promiseChain.current.then(async () => {
				await closeSession(props.id);

				if (isParametersRegister) {
					removeSessionParameters(props.id);
				}
			});
		};
	}, [props.id]);

	return {
		sessionApi
	};
}
