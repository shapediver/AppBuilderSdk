import { Button, Loader, Skeleton } from "@mantine/core";
import { EXPORT_TYPE } from "@shapediver/viewer";
import { IconDownload, IconMailForward } from "@tabler/icons-react";
import React, { useEffect, useRef, useState, JSX } from "react";
import ExportLabelComponent from "components/shapediver/exports/ExportLabelComponent";
import { useShapediverStoreUI } from "../../../store/shapediverStoreUI";

interface Props {
    // The unique identifier to use to access the session.
    sessionId: string,
    // The unique identifier to use to access the export.
    exportId: string
}

/**
 * Functional component that creates a button that triggers an export.
 * If the export is downloadable, that file will be downloaded.
 *
 * @returns
 */
export default function ExportButtonComponent({ sessionId, exportId }: Props): JSX.Element {
	const sessionExports = useRef(useShapediverStoreUI(state => state.exports[sessionId]));
	const exportRequest = useShapediverStoreUI((state) => state.exportRequest);

	const [loading, setLoading] = useState(true);
	const [element, setElement] = useState(<></>);
	const [requestingExport, setRequestingExport] = useState(false);

	useEffect(() => {
		const exp = sessionExports.current ? sessionExports.current[exportId] : undefined;

		// early return if the export is not it the store (yet)
		if (!exp) return;

		// deactivate the loading mode
		setLoading(false);

		// Depending on the type of export, use a download or email icon
		const leftIcon = exp.type === EXPORT_TYPE.DOWNLOAD ? <IconDownload /> : <IconMailForward />;

		// callback for when the export button has been clicked
		const onClick = async () => {
			if (!exp) return;
			// set the requestingExport true to display a loading icon
			setRequestingExport(true);

			await exportRequest(sessionId, exportId);

			// set the requestingExport false to remove the loading icon
			setRequestingExport(false);
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
	}, [sessionId, exportId, requestingExport]);

	return (
		<>
			{loading && <Skeleton height={8} mt={6} radius="xl" />}
			{!loading && element}
		</>
	);
}
