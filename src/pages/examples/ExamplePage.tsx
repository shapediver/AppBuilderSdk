import React from "react";
import NavigationBar from "components/ui/NavigationBar";
import HeaderBar from "components/ui/HeaderBar";
import AppBuilderAppShellTemplatePage from "pages/templates/AppBuilderAppShellTemplatePage";

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

export default function ExamplePage({ children = <></>, aside = <></>}: Props) {

	return (
		<AppBuilderAppShellTemplatePage
			top={<HeaderBar />}
			left={<NavigationBar />}
			right={aside}
		>
			{ children }
		</AppBuilderAppShellTemplatePage>
	);
}
