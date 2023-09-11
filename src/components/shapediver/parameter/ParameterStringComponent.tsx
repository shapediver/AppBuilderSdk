import { Skeleton, TextInput } from "@mantine/core";
import React, { useEffect, useRef, useState } from "react";
import { useShapediverViewerStore } from "../../../context/shapediverViewerStore";
import ParameterLabelComponent from "./ParameterLabelComponent";

interface Props {
    // The unique identifier to use to access the session.
    sessionId: string,
    // The unique identifier to use to access the parameter.
    parameterId: string
}

/**
 * Functional component that creates a string input component for a string parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterStringComponent({ sessionId, parameterId }: Props): JSX.Element {
	const activeSessionsRef = useRef(useShapediverViewerStore(state => state.activeSessions));
	const textInputRef = useRef<HTMLInputElement>(null);
	const [loading, setLoading] = useState(true);
	const [element, setElement] = useState(<></>);

	useEffect(() => {
		// search for the session with the specified id in the active sessions
		const activeSessions = activeSessionsRef.current;
		const activeSession = activeSessions[sessionId];

		// early return if the session is not it the store (yet)
		if (!activeSession) return;

		activeSession.then((session) => {
			if (!session) return;

			// deactivate the loading mode
			setLoading(false);

			const parameter = session.parameters[parameterId];

			// function to apply the value to the parameter and customize the scene
			const handleChange = (value: string) => {
				activeSessions[sessionId].then((session) => {
					if (!session) return;

					// set the value and customize the session
					parameter.value = value;
					session.customize();
				});
			};

			let zoomResizeTimeout: NodeJS.Timeout;
			// callback for when the text value has been changed
			// instead of applying the value directly, set a timeout to wait on further input
			// if this input does not happen within 500ms, execute the handleChange-callback
			const handleChangeDelay = () => {
				clearTimeout(zoomResizeTimeout);
				zoomResizeTimeout = setTimeout(() => {
					if (textInputRef.current)
						handleChange(textInputRef.current.value);
				}, 500);
			};

			// set the element with the label and a text input component that triggers the handleChangeDelay-callback
			setElement(
				<>
					<ParameterLabelComponent sessionId={sessionId} parameterId={parameterId} />
					<TextInput
						ref={textInputRef}
						style={{
							flexGrow: 0.9
						}}
						defaultValue={parameter.value}
						onChange={handleChangeDelay}
					/>
				</>
			);
		});
	}, [sessionId, parameterId]);

	return (
		<>
			{loading && <Skeleton height={8} mt={6} radius="xl" />}
			{!loading && element}
		</>
	);
}
