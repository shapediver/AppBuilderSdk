import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import React, { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import HomePage from "pages/HomePage";
import ModelSelectPage from "pages/ModelSelectPage";
import NoMatchPage from "pages/NoMatchPage";
import ViewPage from "pages/ViewPage";
import MultipleViewportPage from "pages/MultipleViewportPage";
import * as ShapeDiverViewer from "@shapediver/viewer";

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
					<Route path="modelSelect" element={<ModelSelectPage />} />
					<Route path="multipleViewport" element={<MultipleViewportPage />} />
					<Route path="*" element={<NoMatchPage />} />
				</Routes>
			</HashRouter>
		</MantineProvider>
	);
}
