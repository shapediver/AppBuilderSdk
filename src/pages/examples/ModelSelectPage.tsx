import ViewportComponent from "shared/components/shapediver/viewport/ViewportComponent";
import ModelSelect from "shared/components/ui/ModelSelect";
import React from "react";
import ExamplePage from "pages/examples/ExamplePage";
import ViewportOverlayWrapper from "shared/components/shapediver/viewport/ViewportOverlayWrapper";
import ViewportIcons from "shared/components/shapediver/viewport/ViewportIcons";
import { ExampleModels } from "tickets"; 

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
		<ExamplePage aside={<ModelSelect exampleModels={ExampleModels}/>}>
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
