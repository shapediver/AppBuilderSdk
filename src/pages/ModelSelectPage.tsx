import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import ModelSelect from "components/ui/ModelSelect";
import React from "react";
import ExamplePage from "pages/ExamplePage";
import { useMantineBranding } from "hooks/useMantineBranding";

/**
 * Function that creates the model select page.
 * The aside (right side) with a ModelSelect component
 * and a viewport in the main component that is set to take the settings from the first session that was selected via the select component
 *
 * @returns
 */
export default function ModelSelectPage() {
	const { branding } = useMantineBranding();

	return (
		<ExamplePage aside={<ModelSelect />}>
			<ViewportComponent
				id='viewport_2'
				sessionSettingsMode={SESSION_SETTINGS_MODE.FIRST}
				showStatistics={true}
				branding={branding}
			/>
		</ExamplePage>
	);
}
