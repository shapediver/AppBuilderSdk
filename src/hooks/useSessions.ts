import { ISessionApi } from "@shapediver/viewer";
import { useEffect, useRef, useState } from "react";
import { useShapeDiverStoreViewer } from "store/useShapeDiverStoreViewer";
import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { IUseSessionDto } from "./useSession";

/**
 * Hook for creating multiple sessions with ShapeDiver models using the ShapeDiver 3D Viewer. 
 * Optionally registers all parameters and exports defined by the models as abstracted 
 * parameters and exports for use by the UI components.
 * 
 * @see {@link useShapeDiverStoreViewer} to access the API of the session.
 * @see {@link useShapeDiverStoreParameters} to access the abstracted parameters and exports.
 * 
 * @param props {@link IUseSessionDto}
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
					addSessionParameters(api, !!dto.acceptRejectMode);
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
