import React, { useEffect, useRef, useState, JSX } from "react";
import { Divider, Loader, MediaQuery, ScrollArea } from "@mantine/core";
import ExportButtonComponent from "components/shapediver/exports/ExportButtonComponent";
import { useShapediverStoreViewer } from "store/shapediverStoreViewer";

interface Props {
    // The unique identifier to use to access the session.
    sessionId: string
}

/**
 * Functional component that create an export UI for the session which id was provided.
 *
 * First, the resolve of the session promise is awaited after which the UI elements are created.
 * Elements that are specified as "hidden" will be skipped.
 *
 * @returns
 */
export default function ExportUiComponent({ sessionId }: Props): JSX.Element {
	const activeSessionsRef = useRef(useShapediverStoreViewer.getState().activeSessions);
	const [loading, setLoading] = useState(true);
	const [element, setElement] = useState(<></>);

	useEffect(() => {
		const createExportUi = () => {
			// search for the session with the specified id in the active sessions
			const activeSessions = activeSessionsRef.current;
			const session = activeSessions[sessionId];

			// activate the loading to show the Loader
			setLoading(true);

			// early return if the session is not it the store (yet)
			if (!session) return;

			// deactivate the loading mode
			setLoading(false);

			const elements: JSX.Element[] = [];
			const exports = Object.values(session.exports);
			// loop through the exports and store the created elements
			for (let i = 0; i < exports.length; i++) {
				const exp = exports[i];

				// if an export is hidden, skip it
				if (exp.hidden) continue;
				elements.push(<div key={exp.id}><ExportButtonComponent sessionId={sessionId} exportId={exp.id} /></div>);
				// create dividers between the elements
				if (i !== exports.length - 1) elements.push(<Divider key={exp.id + "_divider"} my="sm" />);
			}

			// finally, set the element
			setElement(
				<MediaQuery smallerThan="sm" styles={{
					// minus tab height (34) and two times margin (2 x 10)
					height: "calc(300px - 54px)"
				}}>
					<ScrollArea>
						{elements}
					</ScrollArea>
				</MediaQuery>
			);
		};

		const unsubscribe = useShapediverStoreViewer.subscribe(state => {
			activeSessionsRef.current = state.activeSessions;
			createExportUi();
		});

		createExportUi();

		return () => {
			unsubscribe();
		};
	}, [sessionId]);

	return (
		<>
			{loading && <Loader style={{ width: "100%" }} mt="xl" size="xl" variant="dots" />}
			{!loading && element}
		</>
	);
}
