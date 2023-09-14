import React, { useEffect, JSX } from "react";
import { SessionCreateDto, useShapediverViewerStore } from "../../context/shapediverViewerStore";

/**
 * Functional component that creates a session with the specified properties.
 *
 * @returns
 */
export default function SessionComponent({ id, ticket, modelViewUrl, jwtToken, waitForOutputs, loadOutputs, excludeViewports, initialParameterValues }: SessionCreateDto): JSX.Element {
	const sessionCreate = useShapediverViewerStore(state => state.sessionCreate);
	const sessionClose = useShapediverViewerStore(state => state.sessionClose);

	useEffect(() => {
		// if there is already a session with the same unique id registered
		// we wait until that session is closed until we create this session anew
		// the closing of the session is done on unmount
		// this can happen in development mode due to the duplicate calls of react
		// read about that here: https://reactjs.org/docs/strict-mode.html#ensuring-reusable-state
		sessionCreate({
			id: id,
			ticket: ticket,
			modelViewUrl: modelViewUrl,
			jwtToken: jwtToken,
			waitForOutputs: waitForOutputs,
			loadOutputs: loadOutputs,
			excludeViewports: excludeViewports,
			initialParameterValues: initialParameterValues
		});

		return () => {
			// when the session is closed, we close the session
			sessionClose(id);
		};
	}, [id, ticket, modelViewUrl, jwtToken, waitForOutputs, loadOutputs, excludeViewports, initialParameterValues]);

	return (<></>);
}
