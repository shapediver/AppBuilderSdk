import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import React, { useEffect } from "react";
import * as ShapeDiverViewer from "@shapediver/viewer";
import AppBuilderPage from "pages/appbuilder/AppBuilderPage";

declare global {
	interface Window {
		SDV: typeof ShapeDiverViewer,
	}
}

export default function AppIframe() {

	useEffect(() => {
		window.SDV = ShapeDiverViewer;
	}, []);

	return (
		<MantineProvider defaultColorScheme="auto">
			<AppBuilderPage />
		</MantineProvider>
	);
}
