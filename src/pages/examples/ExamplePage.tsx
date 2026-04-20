import HeaderBar from "@AppBuilderLib/shared/ui/header/HeaderBar";
import NavigationBar from "@AppBuilderLib/shared/ui/navigation/NavigationBar";
import AppBuilderAppShellTemplatePage from "@AppBuilderShared/pages/templates/AppBuilderAppShellTemplatePage";
import React from "react";

/**
 * Template for example pages.
 * An AppShell is used with:
 * - the header specified as in HeaderBar
 * - the navigation (left side) specified as in NavigationBar
 *
 * @returns
 */

interface Props {
	children: React.ReactNode;
	aside?: React.ReactNode;
}

export default function ExamplePage({children = <></>, aside = <></>}: Props) {
	return (
		<AppBuilderAppShellTemplatePage
			top={{node: <HeaderBar />}}
			left={{node: <NavigationBar />}}
			right={{node: aside}}
		>
			{children}
		</AppBuilderAppShellTemplatePage>
	);
}
