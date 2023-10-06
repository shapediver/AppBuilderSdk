import React, { JSX, useEffect } from "react";
import { createSdReactParameter } from "shapediver/parameter";
import { useShapediverStoreUI } from "store/shapediverStoreUI";
import { ISdReactParameter } from "types/shapediver/parameter";
import { IShapeDiverStoreViewerSessions } from "types/store/shapediverStoreViewer";
import { ISdReactExport } from "types/shapediver/export";
import { createSdReactExport } from "shapediver/exports";
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
	const { addSession: addSessionToUi, removeSession: removeSessionFromUi} = useShapediverStoreUI();
	const parameterStore = useShapediverStoreParameters();
	
	useEffect(() => {
		if (session) {
			// session exists, add parameter to the UI store
			const parametersParsed: { [id: string]: ISdReactParameter<any> } = {};
			Object.keys(session.parameters || {}).forEach(id => {
				if (!session.parameters[id])
					return;
				parametersParsed[id] = createSdReactParameter(session, id);
			});
			
			// session exists, add export to the UI store
			const exportsParsed: { [id: string]: ISdReactExport } = {};
			Object.keys(session.exports || {}).forEach(id => {
				if (!session.exports[id])
					return;
				exportsParsed[id] = createSdReactExport(session, id);
			});

			addSessionToUi(sessionId, parametersParsed, exportsParsed);

			parameterStore.addSession(session);
		} else {
			// session does not exist, remove from the UI store
			removeSessionFromUi(sessionId);

			parameterStore.removeSession(sessionId);
		}

		return () => removeSessionFromUi(sessionId);

	}, [session]);

	return (<></>);
}
