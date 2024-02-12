import "@mantine/core/styles.css";
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
import WebAppExampleOnePage from "./pages/webapp/WebAppExampleOnePage";
import WebAppPage from "pages/webapp/WebAppPage";

declare global {
	interface Window {
		SDV: typeof ShapeDiverViewer,
	}
}

export default function App() {

	useEffect(() => {
		window.SDV = ShapeDiverViewer;
	}, []);

	return (
		<MantineProvider defaultColorScheme="auto">
			<HashRouter>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="view" element={<ViewPage />} />
					<Route path="webApp" element={<WebAppPage example="WebAppDiagrid" acceptRejectMode={true} showContainerButtons={true} />} />
					<Route path="webAppTest" element={<WebAppExampleOnePage />} />
					<Route path="modelSelect" element={<ModelSelectPage />} />
					<Route path="multipleViewport" element={<MultipleViewportPage />} />
					<Route path="customui" element={<CustomUiPage />} />
					<Route path="*" element={<NoMatchPage />} />
				</Routes>
			</HashRouter>
		</MantineProvider>
	);
}
