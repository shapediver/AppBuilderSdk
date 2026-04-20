import ViewportComponent from "@AppBuilderLib/entities/viewport/ui/ViewportComponent";
import ViewportIcons from "@AppBuilderLib/entities/viewport/ui/ViewportIcons";
import ViewportOverlayWrapper from "@AppBuilderLib/entities/viewport/ui/ViewportOverlayWrapper";
import ModelSelect from "@AppBuilderLib/features/model-select/ui/ModelSelect";
import React from "react";
import {ExampleModels} from "tickets";
import ExamplePage from "~/pages/examples/ExamplePage";

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
		<ExamplePage aside={<ModelSelect exampleModels={ExampleModels} />}>
			<ViewportComponent id={viewportId}>
				<ViewportOverlayWrapper>
					<ViewportIcons viewportId={viewportId} />
				</ViewportOverlayWrapper>
			</ViewportComponent>
		</ExamplePage>
	);
}
