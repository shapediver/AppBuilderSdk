import { Button, Loader } from "@mantine/core";
import { EXPORT_TYPE } from "@shapediver/viewer";
import { IconDownload, IconMailForward } from "@tabler/icons-react";
import React, { useState } from "react";
import ExportLabelComponent from "components/shapediver/exports/ExportLabelComponent";
import { fetchFileWithToken } from "utils/file";
import { PropsExport } from "types/components/shapediver/propsExport";
import { useExport } from "hooks/useExport";
import classes from "./ExportButtonComponent.module.css";

/**
 * Functional component that creates a button that triggers an export.
 * If the export is downloadable, that file will be downloaded.
 *
 * @returns
 */
export default function ExportButtonComponent(props: PropsExport) {
	const { sessionId, exportId } = props;
	const { definition, actions } = useExport(sessionId, exportId);

	const exportRequest = async () => {
		// request the export
		const response = await actions.request();

		// if the export is a download export, download it
		if (definition.type === EXPORT_TYPE.DOWNLOAD) {
			if (
				response.content &&
				response.content[0] &&
				response.content[0].href
			) {
				await fetchFileWithToken(response.content[0].href, `${response.filename}.${response.content[0].format}`);
			}
		}
	};

	// callback for when the export button has been clicked
	const onClick = async () => {
		// set the requestingExport true to display a loading icon
		setRequestingExport(true);

		await exportRequest();

		// set the requestingExport false to remove the loading icon
		setRequestingExport(false);
	};

	const [requestingExport, setRequestingExport] = useState(false);

	return (
		<>
			<ExportLabelComponent { ...props } />
			{ definition && <div className={classes.container}>
				<Button
					className={classes.button}
					fullWidth={true}
					leftSection={definition.type === EXPORT_TYPE.DOWNLOAD ? <IconDownload /> : <IconMailForward />}
					variant="default"
					onClick={onClick}
				>
					{definition.type === EXPORT_TYPE.DOWNLOAD ? "Download File" : "Send Email"}
				</Button>
				{requestingExport && <Loader />}
			</div> }
		</>
	);
}
