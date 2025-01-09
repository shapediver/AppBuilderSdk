import React, { useCallback } from "react";
import { Button, Group } from "@mantine/core";
import { useEditorStore } from "../store";

export default function DownloadFile() {
	const { schema } = useEditorStore();

	const handleDownload = useCallback(() => {
		const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(schema, null, 2));
		const downloadAnchorNode = document.createElement("a");
		downloadAnchorNode.setAttribute("href", dataStr);
		downloadAnchorNode.setAttribute("download", "app-builder-schema.json");
		document.body.appendChild(downloadAnchorNode);
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
	}, [schema]);

	return (
		<Group justify="center" m="md">
			<Button onClick={handleDownload} fullWidth>
        Download App Builder Schema
			</Button>
		</Group>
	);
} 