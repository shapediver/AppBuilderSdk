import { ColorScheme, ColorSchemeProvider, MantineProvider } from "@mantine/core";
import React, { useEffect, useState } from "react";
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
	const [colorScheme, setColorScheme] = useState<ColorScheme>("dark");
	const toggleColorScheme = (value?: ColorScheme) => setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

	useEffect(() => {
		window.SDV = ShapeDiverViewer;
	}, []);

	return (
		<ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
			<MantineProvider theme={{ colorScheme: colorScheme }} withGlobalStyles withNormalizeCSS>
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
		</ColorSchemeProvider>
	);
}
