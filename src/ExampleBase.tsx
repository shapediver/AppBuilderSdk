import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import { MantineProvider } from "@mantine/core";
import React, { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import HomePage from "~/pages/HomePage";
import ModelSelectPage from "~/pages/examples/ModelSelectPage";
import NoMatchPage from "@AppBuilderShared/pages/misc/NoMatchPage";
import ViewPage from "~/pages/examples/ViewPage";
import MultipleViewportPage from "~/pages/examples/MultipleViewportPage";
import * as ShapeDiverViewerSession from "@shapediver/viewer.session";
import * as ShapeDiverViewerViewport from "@shapediver/viewer.viewport";
import CustomUiPage from "~/pages/examples/CustomUiPage";
import AppBuilderStaticExamplePage from "~/pages/examples/AppBuilderStaticExamplePage";
import AppBuilderPage from "@AppBuilderShared/pages/appbuilder/AppBuilderPage";
import { useCustomTheme } from "@AppBuilderShared/hooks/ui/useCustomTheme";
import { Notifications } from "@mantine/notifications";
import NotificationWrapper from "@AppBuilderShared/components/ui/NotificationWrapper";

declare global {
	interface Window {
		SDV: typeof ShapeDiverViewerSession & typeof ShapeDiverViewerViewport;
	}
}

export default function App() {

	useEffect(() => {
		window.SDV = Object.assign({}, ShapeDiverViewerSession, ShapeDiverViewerViewport);
	}, []);

	const { theme, resolver } = useCustomTheme();

	return (
		<MantineProvider defaultColorScheme="auto" theme={theme} cssVariablesResolver={resolver}>
			<Notifications />
			<NotificationWrapper>
				<HashRouter>
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="view" element={<ViewPage example="Sideboard" />} />
						<Route path="appBuilder" element={<AppBuilderPage example="AppBuilderExampleDiagrid" />} />
						<Route path="appBuilderTest" element={<AppBuilderStaticExamplePage example="AR Cube" />} />
						<Route path="modelSelect" element={<ModelSelectPage />} />
						<Route path="multipleViewport" element={<MultipleViewportPage />} />
						<Route path="customui" element={<CustomUiPage example="CustomUiBookshelf" />} />
						<Route path="*" element={<NoMatchPage />} />
					</Routes>
				</HashRouter>
			</NotificationWrapper>
		</MantineProvider>
	);
}
