import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import ModelSelect from "components/ui/ModelSelect";
import React from "react";
import ExamplePage from "pages/ExamplePage";
import { useMantineBranding } from "hooks/useMantineBranding";
import ViewportAdditionalUIWrapper, { Positions } from "components/shapediver/viewport/ViewportAdditionalUIWrapper";
import ViewportIcons from "components/shapediver/viewport/ViewportIcons";

/**
 * Function that creates the model select page.
 * The aside (right side) with a ModelSelect component
 * and a viewport in the main component that is set to take the settings from the first session that was selected via the select component
 *
 * @returns
 */
export default function ModelSelectPage() {
	const { branding } = useMantineBranding();

	const viewportId = "viewport_2";
	const fullscreenId = "viewer-fullscreen-area";

	return (
		<ExamplePage className={fullscreenId} aside={<ModelSelect />}>
			<ViewportComponent
				id={viewportId}
				sessionSettingsMode={SESSION_SETTINGS_MODE.FIRST}
				showStatistics={true}
				branding={branding}
			>
				<ViewportAdditionalUIWrapper position={Positions.TOP_RIGHT}>
					<ViewportIcons
						viewportId={viewportId}
						enableArBtn
						enableFullscreenBtn
						enableZoomBtn
						enableCamerasBtn
					/>
				</ViewportAdditionalUIWrapper>
			</ViewportComponent>
		</ExamplePage>
	);
}
