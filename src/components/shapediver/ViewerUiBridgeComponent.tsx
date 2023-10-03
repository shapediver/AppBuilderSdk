import React, { JSX, useEffect } from "react";
import { createSdReactParameter } from "shapediver/parameter";
import { useShapediverStoreUI } from "store/shapediverStoreUI";
import { ISdReactParameter } from "types/shapediver/parameter";
import { IShapeDiverStoreViewerSessions } from "types/store/shapediverStoreViewer";

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
	const addSessionToUi = useShapediverStoreUI(state => state.addSession);
	const removeSessionFromUi = useShapediverStoreUI(state => state.removeSession);
	
	useEffect(() => {
		if (session) {
			// session exists, add parameter to the UI store
			const parametersParsed: { [id: string]: ISdReactParameter<any> } = {};
			Object.keys(session.parameters || {}).forEach(id => {
				if (!session.parameters[id]) 
					return;
				parametersParsed[id] = createSdReactParameter(session, id);
			});
			// TODO SS-7076 extend this by exports
			addSessionToUi(sessionId, parametersParsed);
		} else {
			// session does not exist, remove from the UI store
			removeSessionFromUi(sessionId);
		}

		return () => removeSessionFromUi(sessionId);
	
	}, [session]);
	
	return (<></>);
}
