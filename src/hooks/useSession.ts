import { ISessionApi } from "@shapediver/viewer";
import { useEffect, useRef, useState } from "react";
import { useShapediverStoreViewer } from "store/shapediverStoreViewer";
import { SessionCreateDto } from "types/store/shapediverStoreViewer";

export function useSession(props: SessionCreateDto) {
	const { createSession, closeSession } = useShapediverStoreViewer();
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
