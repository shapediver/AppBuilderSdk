import NotificationWrapper from "@AppBuilderLib/features/notifications/ui/NotificationWrapper";
import {useCustomTheme} from "@AppBuilderLib/shared/ui/theme/useCustomTheme";
import AppBuilderPage from "@AppBuilderShared/pages/appbuilder/AppBuilderPage";
import NoMatchPage from "@AppBuilderShared/pages/misc/NoMatchPage";
import "@mantine/charts/styles.css";
import {MantineProvider} from "@mantine/core";
import "@mantine/core/styles.css";
import {Notifications} from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import * as ShapeDiverViewerSession from "@shapediver/viewer.session";
import * as ShapeDiverViewerViewport from "@shapediver/viewer.viewport";
import {useEffect, useState} from "react";
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

function getHashPathname() {
	const pathname = window.location.hash.slice(1).split(/[?#]/, 1)[0];

	if (!pathname) return "/";
	return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function useHashPathname() {
	const [pathname, setPathname] = useState(getHashPathname);

	useEffect(() => {
		const updatePathname = () => setPathname(getHashPathname());
		window.addEventListener("hashchange", updatePathname);
		return () => window.removeEventListener("hashchange", updatePathname);
	}, []);

	return pathname;
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
	const pathname = useHashPathname();

	const page = (() => {
		switch (pathname) {
			case "/":
				return <HomePage />;
			case "/view":
				return <ViewPage example="Sideboard" />;
			case "/appBuilder":
				return <AppBuilderPage example="AppBuilderExampleDiagrid" />;
			case "/appBuilderTest":
				return <AppBuilderStaticExamplePage example="AR Cube" />;
			case "/modelSelect":
				return <ModelSelectPage />;
			case "/multipleViewport":
				return <MultipleViewportPage />;
			default:
				return <NoMatchPage />;
		}
	})();

	return (
		<MantineProvider
			defaultColorScheme="auto"
			theme={theme}
			cssVariablesResolver={resolver}
		>
			<Notifications
				notificationMaxHeight={1000}
				pauseResetOnHover="notification"
			/>
			<NotificationWrapper>{page}</NotificationWrapper>
		</MantineProvider>
	);
}
