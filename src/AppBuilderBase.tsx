import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import { MantineProvider } from "@mantine/core";
import React, { useEffect } from "react";
import * as ShapeDiverViewer from "@shapediver/viewer";
import AppBuilderPage from "shared/pages/appbuilder/AppBuilderPage";
import { useCustomTheme } from "shared/hooks/ui/useCustomTheme";
import packagejson from "../package.json";
import { Notifications, notifications } from "@mantine/notifications";
import { NotificationContext } from "shared/context/NotificationContext";

console.log(`ShapeDiver App Builder SDK v${packagejson.version}`);

declare global {
	interface Window {
		SDV: typeof ShapeDiverViewer,
	}
}

export default function AppBuilderBase() {

	useEffect(() => {
		window.SDV = ShapeDiverViewer;
	}, []);

	const { theme, resolver } = useCustomTheme();

	return (
		<MantineProvider defaultColorScheme="auto" theme={theme} cssVariablesResolver={resolver}>
			<Notifications />
			<NotificationContext.Provider value={notifications}>
				<AppBuilderPage />
			</NotificationContext.Provider>
		</MantineProvider>
	);
}
