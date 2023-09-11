import { ActionIcon, FileInput, Skeleton } from "@mantine/core";
import { IconUpload, IconX } from "@tabler/icons-react";
import React, { useEffect, useRef, useState } from "react";
import { useShapediverViewerStore } from "../../../context/shapediverViewerStore";
import { mapMimeTypeToFileEndings, extendMimeTypes } from "@shapediver/viewer.utils.mime-type";
import ParameterLabelComponent from "./ParameterLabelComponent";

interface Props {
    // The unique identifier to use to access the session.
    sessionId: string,
    // The unique identifier to use to access the parameter.
    parameterId: string
}

/**
 * Functional component that creates a file input for a file parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterFileInputComponent({ sessionId, parameterId }: Props): JSX.Element {
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

			// create the file endings from all the formats that are specified in the parameter
			const fileEndings = [...mapMimeTypeToFileEndings(extendMimeTypes(parameter.format!))];

			// callback for when the value was changed
			const handleChange = (value: File | null) => {
				activeSessions[sessionId].then((session) => {
					if (!session) return;

					// set the value and customize the session
					// setting the value of a file parameter to an empty string removes the file
					parameter.value = value || "";
					session.customize();
				});
			};

			// set the element with the label and a FileInput that triggers the handleChange-callback
			// a button is added to the right to remove the file
			setElement(
				<>
					<ParameterLabelComponent sessionId={sessionId} parameterId={parameterId} />
					<FileInput
						placeholder="File Upload"
						accept={fileEndings.join(",")}
						onChange={handleChange}
						icon={<IconUpload size={14} />}
						rightSection={
							<ActionIcon onClick={() => {
								handleChange(null);
							}}>
								<IconX size={16} />
							</ActionIcon>
						}
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
