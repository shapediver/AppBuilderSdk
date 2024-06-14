import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider } from "@mantine/core";
import React, { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import HomePage from "pages/HomePage";
import ModelSelectPage from "pages/examples/ModelSelectPage";
import NoMatchPage from "pages/misc/NoMatchPage";
import ViewPage from "pages/examples/ViewPage";
import MultipleViewportPage from "pages/examples/MultipleViewportPage";
import * as ShapeDiverViewer from "@shapediver/viewer";
import CustomUiPage from "pages/examples/CustomUiPage";
import AppBuilderStaticExamplePage from "./pages/appbuilder/AppBuilderStaticExamplePage";
import AppBuilderPage from "pages/appbuilder/AppBuilderPage";
import { useCustomTheme } from "hooks/ui/useCustomTheme";
import { Notifications } from "@mantine/notifications";
import DrawingToolsPage from "pages/examples/DrawingToolsPage";

declare global {
	interface Window {
		SDV: typeof ShapeDiverViewer,
	}
}

export default function App() {

	useEffect(() => {
		window.SDV = ShapeDiverViewer;
	}, []);

	const { theme, resolver } = useCustomTheme();

	return (
		<MantineProvider defaultColorScheme="auto" theme={theme} cssVariablesResolver={resolver}>
			<Notifications />
			<HashRouter>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="view" element={<ViewPage example="PointLineDrawingDemo" />} />
					<Route path="drawingTools" element={<DrawingToolsPage example="PointLineDrawingDemo" />} />
					<Route path="appBuilder" element={<AppBuilderPage example="AppBuilderExampleDiagrid" />} />
					<Route path="appBuilderTest" element={<AppBuilderStaticExamplePage example="AR Cube" />} />
					<Route path="modelSelect" element={<ModelSelectPage />} />
					<Route path="multipleViewport" element={<MultipleViewportPage />} />
					<Route path="customui" element={<CustomUiPage example="CustomUiBookshelf" />} />
					<Route path="*" element={<NoMatchPage />} />
				</Routes>
			</HashRouter>
		</MantineProvider>
	);
}
