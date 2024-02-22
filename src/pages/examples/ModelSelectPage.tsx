import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import ModelSelect from "components/ui/ModelSelect";
import React from "react";
import ExamplePage from "pages/templates/ExampleTemplatePage";
import ViewportOverlayWrapper from "components/shapediver/viewport/ViewportOverlayWrapper";
import ViewportIcons from "components/shapediver/viewport/ViewportIcons";

/**
 * Function that creates the model select page.
 * The aside (right side) with a ModelSelect component
 * and a viewport in the main component that is set to take the settings from the first session that was selected via the select component
 *
 * @returns
 */
export default function ModelSelectPage() {

	const viewportId = "viewport_2";
	
	return (
		<ExamplePage aside={<ModelSelect />}>
			<ViewportComponent
				id={viewportId}
			>
				<ViewportOverlayWrapper>
					<ViewportIcons
						viewportId={viewportId}
					/>
				</ViewportOverlayWrapper>
			</ViewportComponent>
		</ExamplePage>
	);
}
