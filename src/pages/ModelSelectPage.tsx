import { useMantineTheme } from "@mantine/core";
import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import ViewportComponent from "components/shapediver/ViewportComponent";
import ModelSelect from "components/ui/ModelSelect";
import React from "react";
import ExamplePage from "pages/ExamplePage";

/**
 * Function that creates the model select page.
 * An AppShell is used with:
 * - the header specified as in HeaderBar
 * - the navigation (left side) specified as in NavigationBar
 * - the aside (right side) with a ModelSelect component
 * - and a viewport in the main component that is set to take the settings from the first session that was selected via the select component
 *
 * @returns
 */
export default function ModelSelectPage() {
	const theme = useMantineTheme();

	return (
		<ExamplePage aside={<ModelSelect />}>
			<ViewportComponent
				id='viewport_2'
				sessionSettingsMode={SESSION_SETTINGS_MODE.FIRST}
				showStatistics={true}
				branding={{
					backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
					logo: theme.colorScheme === "dark" ? undefined : "https://viewer.shapediver.com/v3/graphics/logo_animated_breath_inverted.svg"
				}}
			/>
		</ExamplePage>
	);
}
