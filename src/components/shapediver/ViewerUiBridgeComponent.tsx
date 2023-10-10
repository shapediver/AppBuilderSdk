import React, { JSX, useEffect } from "react";
import { IShapeDiverStoreViewerSessions } from "types/store/shapediverStoreViewer";
import { useShapediverStoreParameters } from "store/parameterStore";

interface Props {
    sessionId: string,
	sessions: IShapeDiverStoreViewerSessions,
}

/**
 * Functional component that bridges between the viewer store and the UI store.
 *
 * @returns
 */
export default function ViewerUiBridgeComponent({ sessionId, sessions }: Props): JSX.Element {

	const session = sessions[sessionId];
	const { addSession, removeSession } = useShapediverStoreParameters();

	useEffect(() => {
		if (session) {
			addSession(session);
		} else {
			removeSession(sessionId);
		}

		return () => removeSession(sessionId);
	}, [session]);

	return (<></>);
}
