import React from "react";
import { MantineProvider, MantineTheme } from "@mantine/core";
import AppBuilderPage from "shared/pages/appbuilder/AppBuilderPage"; 
import { Notifications } from "@mantine/notifications";
import NotificationWrapper from "shared/components/ui/NotificationWrapper";
import SettingsDrawer from "./SettingsDrawer";
import { useEditorStore } from "./store";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import "./global.css";

export default function AppBuilderEditor() {
	const { schema } = useEditorStore();

	return (
		<MantineProvider theme={schema.themeOverrides as MantineTheme} defaultColorScheme="auto"> 
			<SettingsDrawer  />
			<Notifications />
			<NotificationWrapper>
				<AppBuilderPage />
			</NotificationWrapper>
		</MantineProvider>
	);
}
