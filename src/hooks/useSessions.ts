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
	const { syncSessions } = useShapeDiverStoreViewer();
	const { addSession: addSessionParameters, removeSession: removeSessionParameters } = useShapeDiverStoreParameters();
	const [sessionApis, setSessionApis] = useState<(ISessionApi | undefined)[]>([]);
	const promiseChain = useRef(Promise.resolve());

	useEffect(() => {
		promiseChain.current = promiseChain.current.then(async () => {
			const apis = await syncSessions(props);
			setSessionApis(apis);

			apis.map(( api, index ) => {
				const dto = props[index];
				if (dto.registerParametersAndExports && api) {
					/** execute changes immediately if the component is not running in accept/reject mode */
					addSessionParameters(api, !dto.acceptRejectMode);
				}
			});
		});

		return () => {
			promiseChain.current = promiseChain.current.then(async () => {
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
