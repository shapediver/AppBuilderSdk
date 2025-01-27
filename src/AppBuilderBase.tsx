import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import {MantineProvider} from "@mantine/core";
import React, {useEffect} from "react";
import * as ShapeDiverViewerSession from "@shapediver/viewer.session";
import * as ShapeDiverViewerViewport from "@shapediver/viewer.viewport";
import AppBuilderPage from "@AppBuilderShared/pages/appbuilder/AppBuilderPage";
import {useCustomTheme} from "@AppBuilderShared/hooks/ui/useCustomTheme";
import packagejson from "../package.json";
import {Notifications} from "@mantine/notifications";
import "AppBuilderBase.css";
import NotificationWrapper from "@AppBuilderShared/components/ui/NotificationWrapper";

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
