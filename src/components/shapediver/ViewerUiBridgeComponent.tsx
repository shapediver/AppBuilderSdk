import React, { JSX, useEffect } from "react";
import { IShapeDiverStoreViewerSessions } from "types/store/shapediverStoreViewer";
import { useShapeDiverStoreParameters } from "store/shapediverStoreParameters";

interface Props {
    sessionId: string,
	sessions: IShapeDiverStoreViewerSessions,
}

/**
 * Functional component that bridges between the viewer store and the UI store.
 * TODO replace by a hook
 *
 * @returns
 */
export default function ViewerUiBridgeComponent({ sessionId, sessions }: Props): JSX.Element {

	const session = sessions[sessionId];
	const { addSession, removeSession } = useShapeDiverStoreParameters();

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
