import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import { Center, MantineProvider } from "@mantine/core";
import React, { useEffect, useMemo } from "react";
import * as ShapeDiverViewerSession from "@shapediver/viewer.session";
import * as ShapeDiverViewerViewport from "@shapediver/viewer.viewport";
import { useCustomTheme } from "@AppBuilderShared/hooks/ui/useCustomTheme";
import LibraryPage from "@AppBuilderShared/pages/platform/LibraryPage";
import classes from "~/LibraryBase.module.css";
import useLibraryTabConfig from "hooks/useLibraryTabConfig";
import LoaderPage from "@AppBuilderShared/pages/misc/LoaderPage";
import AppBuilderPage from "@AppBuilderShared/pages/appbuilder/AppBuilderPage";
import { Notifications } from "@mantine/notifications";
import NotificationWrapper from "@AppBuilderShared/components/ui/NotificationWrapper";
import packagejson from "../package.json";

console.log(`ShapeDiver App Builder SDK v${packagejson.version}`);

declare global {
	interface Window {
		SDV: typeof ShapeDiverViewerSession & typeof ShapeDiverViewerViewport;
	}
}

const modelViewBaseUrl = `${window.location.origin}${window.location.pathname.split("/").slice(0, -1).join("/")}/`;

export default function LibraryBase() {

	useEffect(() => {
		window.SDV = Object.assign({}, ShapeDiverViewerSession, ShapeDiverViewerViewport);
	}, []);

	const parameters = useMemo<URLSearchParams>(() => new URLSearchParams(window.location.search), []);
	const hasSlug = useMemo(() => parameters.has("slug") || parameters.has("g"), [parameters]);

	const { tabs, loading } = useLibraryTabConfig({modelViewBaseUrl});

	const { theme, resolver } = useCustomTheme();

	return (
		<MantineProvider
			defaultColorScheme="auto"
			forceColorScheme={theme.other?.forceColorScheme}
			theme={theme}
			cssVariablesResolver={resolver}
		>
			<Notifications />
			<NotificationWrapper>
				{hasSlug ? <AppBuilderPage/> : loading ? <LoaderPage /> :
					<Center className={classes.root}>
						<LibraryPage w="62em" tabs={tabs}/>
					</Center>
				}
			</NotificationWrapper>
		</MantineProvider>
	);
}
