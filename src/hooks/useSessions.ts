import { ISessionApi } from "@shapediver/viewer";
import { useEffect, useRef, useState } from "react";
import { useShapeDiverStoreViewer } from "store/useShapeDiverStoreViewer";
import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { IUseSessionDto } from "./useSession";

/**
 * Hook for creating multiple sessions with a ShapeDiver model using the ShapeDiver 3D Viewer.
 * @see {@link useShapeDiverStoreViewer} to access the API of the session.
 * @param props
 * @returns
 */
export function useSessions(props: IUseSessionDto[]) {
	const { createSession, closeSession } = useShapeDiverStoreViewer();
	const { addSession: addSessionParameters, removeSession: removeSessionParameters } = useShapeDiverStoreParameters();
	const [sessionApis, setSessionApis] = useState<(ISessionApi | undefined)[]>([]);
	const promiseChain = useRef(Promise.resolve());

	useEffect(() => {
		promiseChain.current = promiseChain.current.then(async () => {
			const results = await Promise.all( props.map(async p => { return { api: await createSession(p), p }; } ) );
			setSessionApis(results.map(p => p.api));

			results.map(result => {
				if (result.p.registerParametersAndExports && result.api) {
					/** execute changes immediately if the component is not running in accept/reject mode */
					addSessionParameters(result.api, !result.p.acceptRejectMode);
				}
			});
		});

		return () => {
			promiseChain.current = promiseChain.current.then(async () => {
				await Promise.all( props.map( p => closeSession(p.id) ));

				props.map(p => {
					if (p.registerParametersAndExports) {
						removeSessionParameters(p.id);
					}
				});
			});
		};
	}, [props]);

	return {
		sessionApis
	};
}
