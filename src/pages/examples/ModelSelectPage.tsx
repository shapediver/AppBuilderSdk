import ViewportComponent from "@AppBuilderLib/entities/viewport/ui/ViewportComponent";
import ViewportOverlayWrapper from "@AppBuilderLib/entities/viewport/ui/ViewportOverlayWrapper";
import AppBuilderToolbarLayer from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarLayer";
import ModelSelect from "@AppBuilderLib/features/model-select/ui/ModelSelect";
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
					<AppBuilderToolbarLayer namespace="" viewportId={viewportId} />
				</ViewportOverlayWrapper>
			</ViewportComponent>
		</ExamplePage>
	);
}
