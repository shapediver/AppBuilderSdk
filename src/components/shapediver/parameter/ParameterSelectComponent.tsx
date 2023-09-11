import { Select, Skeleton } from "@mantine/core";
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
 * Functional component that creates a dropdown select component for a string list parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterSelectComponent({ sessionId, parameterId }: Props): JSX.Element {
	const activeSessionsRef = useRef(useShapediverViewerStore(state => state.activeSessions));
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

			// callback for when the value was changed
			const handleChange = (value: string) => {
				activeSessions[sessionId].then((session) => {
					if (!session) return;

					// set the value and customize the session
					// the value for the parameter is the index of the element in the choices
					parameter.value = parameter.choices!.indexOf(value) + "";
					session.customize();
				});
			};

			// set the element with the label and a Select component that triggers the handleChange-callback
			setElement(
				<>
					<ParameterLabelComponent sessionId={sessionId} parameterId={parameterId} />
					<Select
						placeholder="Pick one"
						dropdownPosition="bottom"
						defaultValue={parameter.choices![+parameter.defval]}
						onChange={handleChange}
						data={parameter.choices!}
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
