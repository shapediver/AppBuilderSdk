import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import React, { useEffect } from "react";
import * as ShapeDiverViewer from "@shapediver/viewer";
import AppBuilderPage from "pages/appbuilder/AppBuilderPage";
import { useCustomTheme } from "hooks/ui/useCustomTheme";

declare global {
	interface Window {
		SDV: typeof ShapeDiverViewer,
	}
}

export default function AppIframe() {

	useEffect(() => {
		window.SDV = ShapeDiverViewer;
	}, []);

	const { theme } = useCustomTheme();

	return (
		<MantineProvider defaultColorScheme="auto" theme={theme}>
			<AppBuilderPage />
		</MantineProvider>
	);
}
