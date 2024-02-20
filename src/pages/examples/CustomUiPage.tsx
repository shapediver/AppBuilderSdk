import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React, { } from "react";
import ParametersAndExportsAccordionComponent from "components/shapediver/ui/ParametersAndExportsAccordionComponent";
import ExamplePage from "pages/templates/ExampleTemplatePage";
import ViewportOverlayWrapper from "../../components/shapediver/viewport/ViewportOverlayWrapper";
import ViewportIcons from "../../components/shapediver/viewport/ViewportIcons";
import { ShapeDiverExampleModels } from "tickets";
import { useSessionWithCustomUi } from "hooks/shapediver/useSessionWithCustomUi";
import AcceptRejectButtons from "../../components/shapediver/ui/AcceptRejectButtons";
import useUrlSearchParamSettings from "hooks/shapediver/useUrlSearchParamSettings";
import TabsComponent, { ITabsComponentProps } from "components/ui/TabsComponent";
import { IconTypeEnum } from "types/shapediver/icons";

const VIEWPORT_ID = "viewport_1";
const MODEL_NAME = "CustomUiBookshelf";
const SESSION_ID = ShapeDiverExampleModels[MODEL_NAME].slug;
const SESSION_DTO = {
	id: SESSION_ID,
	ticket: ShapeDiverExampleModels[MODEL_NAME].ticket,
	modelViewUrl: ShapeDiverExampleModels[MODEL_NAME].modelViewUrl,
	excludeViewports: ["viewport_2"],
	acceptRejectMode: true
};

/**
 * Function that creates the view page.
 * The aside (right side) two tabs, one with a ParameterUiComponent and another with an ExportUiComponent
 * and a viewport and session in the main component. The session is connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function ViewPage() {

	const { settings } = useUrlSearchParamSettings(SESSION_DTO);
	const sessionDto = settings ? settings.sessions[0] : undefined;
	const { parameterProps, exportProps } = useSessionWithCustomUi(sessionDto);

	const tabProps: ITabsComponentProps = {
		defaultValue: "Parameters",
		tabs: [
			{
				name: "Parameters",
				icon: IconTypeEnum.AdjustmentsHorizontal,
				children: [
					<ParametersAndExportsAccordionComponent key={0}
						parameters={parameterProps}
						defaultGroupName="My parameters"
						topSection={<AcceptRejectButtons parameters={parameterProps}/>}
					/>
				]
			},
			{
				name: "Exports",
				icon: IconTypeEnum.Download,
				children: [
					<ParametersAndExportsAccordionComponent key={0}
						exports={exportProps}
						defaultGroupName="Exports"
					/>
				]
			}
		]
	};

	const parameterTabs = <TabsComponent {...tabProps} />;

	return (
		<>
			<ExamplePage aside={parameterTabs}>
				<ViewportComponent
					id={VIEWPORT_ID}
				>
					<ViewportOverlayWrapper>
						<ViewportIcons
							viewportId={VIEWPORT_ID}
						/>
					</ViewportOverlayWrapper>
				</ViewportComponent>
			</ExamplePage>
		</>
	);
}
