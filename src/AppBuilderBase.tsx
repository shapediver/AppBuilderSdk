import NotificationWrapper from "@AppBuilderShared/components/ui/NotificationWrapper";
import {useCustomTheme} from "@AppBuilderShared/hooks/ui/useCustomTheme";
import AppBuilderPage from "@AppBuilderShared/pages/appbuilder/AppBuilderPage";
import "@mantine/charts/styles.css";
import {MantineProvider} from "@mantine/core";
import "@mantine/core/styles.css";
import {Notifications} from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import * as ShapeDiverViewerSession from "@shapediver/viewer.session";
import * as ShapeDiverViewerViewport from "@shapediver/viewer.viewport";
import "AppBuilderBase.css";
import React, {useEffect} from "react";
import packagejson from "../package.json";

// log the SDK version directly to the console
// this is independent of the logger settings within the app
console.log(`ShapeDiver App Builder SDK v${packagejson.version}`);

declare global {
	interface Window {
		SDV: typeof ShapeDiverViewerSession & typeof ShapeDiverViewerViewport;
	}
}

export default function AppBuilderBase() {
	useEffect(() => {
		window.SDV = Object.assign(
			{},
			ShapeDiverViewerSession,
			ShapeDiverViewerViewport,
		);
	}, []);

	const {theme, resolver} = useCustomTheme();

	return (
		<MantineProvider
			defaultColorScheme="auto"
			forceColorScheme={theme.other?.forceColorScheme}
			theme={theme}
			cssVariablesResolver={resolver}
		>
			<Notifications />
			<NotificationWrapper>
				<AppBuilderPage />
			</NotificationWrapper>
		</MantineProvider>
	);
}
