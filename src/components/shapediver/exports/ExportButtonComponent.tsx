import { Button, Loader, Skeleton } from "@mantine/core";
import { EXPORT_TYPE } from "@shapediver/viewer";
import { IconDownload, IconMailForward } from "@tabler/icons-react";
import React, { useEffect, useRef, useState } from "react";
import { useShapediverViewerStore } from "../../../context/shapediverViewerStore";
import ExportLabelComponent from "./ExportLabelComponent";

interface Props {
    // The unique identifier to use to access the session.
    sessionId: string,
    // The unique identifier to use to access the export.
    exportId: string
}

/**
 * Download a blob with and use the specified filename.
 *
 * @param blob
 * @param filename
 */
export const downloadBlobFile = (blob: Blob, filename: string) => {
	const modelFile = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.style.display = "none";
	link.href = modelFile;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(link.href);
};

/**
 * Fetch and download a file.
 * If provided a token, use that token in the Authorization header.
 *
 * @param url
 * @param filename
 * @param token
 */
export const fetchFileWithToken = async (url: string, filename: string, token: string | null = null) => {
	const res = await fetch(url, {
		...(token ? { headers: { Authorization: token } } : {}),
	});
	const blob = await res.blob();
	downloadBlobFile(blob, filename);
};

/**
 * Functional component that creates a button that triggers an export.
 * If the export is downloadable, that file will be downloaded.
 *
 * @returns
 */
export default function ExportButtonComponent({ sessionId, exportId }: Props): JSX.Element {
	const activeSessionsRef = useRef(useShapediverViewerStore(state => state.activeSessions));
	const [loading, setLoading] = useState(true);
	const [element, setElement] = useState(<></>);
	const [requestingExport, setRequestingExport] = useState(false);

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

			const exp = session.exports[exportId];

			// Depending on the type of export, use a download or email icon
			const leftIcon = exp.type === EXPORT_TYPE.DOWNLOAD ? <IconDownload /> : <IconMailForward />;

			// callback for when the export button has been clicked
			const onClick = () => {
				activeSessions[sessionId].then((session) => {
					if (!session) return;

					// set the requestingExport to true to display a loading icon
					setRequestingExport(true);

					// request the export
					exp.request().then(async response => {
						// set the requestingExport to false to remove the loading icon
						setRequestingExport(false);

						// if the export is a download export, download it
						if (exp.type === EXPORT_TYPE.DOWNLOAD) {
							if (
								response.content &&
                                response.content[0] &&
                                response.content[0].href
							) {
								await fetchFileWithToken(response.content[0].href, `${response.filename}.${response.content[0].format}`);
							}
						}
					});
				});
			};

			// set the element with the label, a button and a loader that is shown when requestingExport is enabled
			setElement(
				<>
					<ExportLabelComponent sessionId={sessionId} exportId={exportId} />
					<div style={{
						display: "flex",
						justifyContent: "space-between",
					}}>
						<Button
							style={{
								width: "70%"
							}}
							fullWidth={true}
							leftIcon={leftIcon}
							variant="default"
							onClick={onClick}
						>
							{exp.type === EXPORT_TYPE.DOWNLOAD ? "Download File" : "Send Email"}
						</Button>
						{requestingExport && <Loader />}
					</div>
				</>
			);
		});
	}, [sessionId, exportId, requestingExport]);

	return (
		<>
			{loading && <Skeleton height={8} mt={6} radius="xl" />}
			{!loading && element}
		</>
	);
}
