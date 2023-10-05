import { Button, Loader } from "@mantine/core";
import { EXPORT_TYPE } from "@shapediver/viewer";
import { IconDownload, IconMailForward } from "@tabler/icons-react";
import React, { JSX, useState } from "react";
import ExportLabelComponent from "components/shapediver/exports/ExportLabelComponent";
import { ISdReactExport } from "types/shapediver/export";
import { fetchFileWithToken } from "utils/file";

interface Props {
	exp: ISdReactExport
}

/**
 * Functional component that creates a button that triggers an export.
 * If the export is downloadable, that file will be downloaded.
 *
 * @returns
 */
export default function ExportButtonComponent(props: Props): JSX.Element {
	const { exp } = props;
	const exportRequest = async () => {
		if (!exp) return;

		// request the export
		const response = await exp.request();

		// if the export is a download export, download it
		if (exp.definition.type === EXPORT_TYPE.DOWNLOAD) {
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
		if (!exp) return;
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
			{ exp && <div style={{
				display: "flex",
				justifyContent: "space-between",
			}}>
				<Button
					style={{
						width: "70%"
					}}
					fullWidth={true}
					leftIcon={exp.definition.type === EXPORT_TYPE.DOWNLOAD ? <IconDownload /> : <IconMailForward />}
					variant="default"
					onClick={onClick}
				>
					{exp.definition.type === EXPORT_TYPE.DOWNLOAD ? "Download File" : "Send Email"}
				</Button>
				{requestingExport && <Loader />}
			</div> }
		</>
	);
}
