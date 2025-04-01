import NotificationWrapper from "@AppBuilderShared/components/ui/NotificationWrapper";
import {useCustomTheme} from "@AppBuilderShared/hooks/ui/useCustomTheme";
import AppBuilderPage from "@AppBuilderShared/pages/appbuilder/AppBuilderPage";
import NoMatchPage from "@AppBuilderShared/pages/misc/NoMatchPage";
import "@mantine/charts/styles.css";
import {MantineProvider} from "@mantine/core";
import "@mantine/core/styles.css";
import {Notifications} from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import * as ShapeDiverViewerSession from "@shapediver/viewer.session";
import * as ShapeDiverViewerViewport from "@shapediver/viewer.viewport";
import React, {useEffect} from "react";
import {HashRouter, Route, Routes} from "react-router-dom";
import HomePage from "~/pages/HomePage";
import AppBuilderStaticExamplePage from "~/pages/examples/AppBuilderStaticExamplePage";
import ModelSelectPage from "~/pages/examples/ModelSelectPage";
import MultipleViewportPage from "~/pages/examples/MultipleViewportPage";
import ViewPage from "~/pages/examples/ViewPage";

declare global {
	interface Window {
		SDV: typeof ShapeDiverViewerSession & typeof ShapeDiverViewerViewport;
	}
}

export default function App() {
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
			theme={theme}
			cssVariablesResolver={resolver}
		>
			<Notifications />
			<NotificationWrapper>
				<HashRouter>
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route
							path="view"
							element={<ViewPage example="Sideboard" />}
						/>
						<Route
							path="appBuilder"
							element={
								<AppBuilderPage example="AppBuilderExampleDiagrid" />
							}
						/>
						<Route
							path="appBuilderTest"
							element={
								<AppBuilderStaticExamplePage example="AR Cube" />
							}
						/>
						<Route
							path="modelSelect"
							element={<ModelSelectPage />}
						/>
						<Route
							path="multipleViewport"
							element={<MultipleViewportPage />}
						/>
						<Route path="*" element={<NoMatchPage />} />
					</Routes>
				</HashRouter>
			</NotificationWrapper>
		</MantineProvider>
	);
}
