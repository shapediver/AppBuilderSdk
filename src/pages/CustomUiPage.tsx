import { Tabs } from "@mantine/core";
import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import { IconFileDownload, IconReplace } from "@tabler/icons-react";
import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React, { } from "react";
import ParametersAndExportsAccordionComponent from "components/shapediver/ui/ParametersAndExportsAccordionComponent";
import ExamplePage from "pages/ExamplePage";
import { useMantineBranding } from "hooks/useMantineBranding";
import ViewportAdditionalUIWrapper, { Positions } from "../components/shapediver/viewport/ViewportAdditionalUIWrapper";
import ViewportIcons from "../components/shapediver/viewport/ViewportIcons";
import { ShapeDiverExampleModels } from "tickets";
import { useIsMobile } from "hooks/useIsMobile";
import { useSessionWithCustomUi } from "hooks/useSessionWithCustomUi";

const VIEWPORT_ID = "viewport_1";
const MODEL_NAME = "CustomUiBookshelf";
const SESSION_ID = ShapeDiverExampleModels[MODEL_NAME].slug;
const SESSION_DTO = {
	id: SESSION_ID,
	ticket: ShapeDiverExampleModels[MODEL_NAME].ticket,
	modelViewUrl: ShapeDiverExampleModels[MODEL_NAME].modelViewUrl,
	excludeViewports: ["viewport_2"],
};
const ACCEPT_REJECT_MODE = true;

const VIEWER_FULLSCREEN_ID = "viewer-fullscreen-area";

/**
 * Function that creates the view page.
 * The aside (right side) two tabs, one with a ParameterUiComponent and another with an ExportUiComponent
 * and a viewport and session in the main component. The session is connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function ViewPage() {

	const isMobile = useIsMobile();
	const { branding } = useMantineBranding();
	const { parameterProps, exportProps } = useSessionWithCustomUi({sessionDto: SESSION_DTO, acceptRejectMode: ACCEPT_REJECT_MODE});
	
	const parameterTabs = <Tabs defaultValue="parameters" style={{display: "flex", flexDirection: "column", maxHeight: "100%"}}>
		<Tabs.List>
			<Tabs.Tab value="parameters" leftSection={<IconReplace size={14} />}>Parameters</Tabs.Tab>
			<Tabs.Tab value="exports" leftSection={<IconFileDownload size={14} />}>Exports</Tabs.Tab>
		</Tabs.List>

		<Tabs.Panel value="parameters" pt={isMobile ? "" : "xs"} style={{ flexGrow: "1", overflow: "auto", maxHeight: "100%" }}>
			<ParametersAndExportsAccordionComponent 
				parameters={parameterProps}
				defaultGroupName="My parameters"
			/>
		</Tabs.Panel>

		<Tabs.Panel value="exports" pt={isMobile ? "" : "xs"} style={{ flexGrow: "1", overflow: "auto", maxHeight: "100%" }}>
			<ParametersAndExportsAccordionComponent 
				exports={exportProps} 
				defaultGroupName="Exports" 
			/>
		</Tabs.Panel>
	</Tabs>;

	return (
		<>
			<ExamplePage className={VIEWER_FULLSCREEN_ID} aside={parameterTabs}>
				<ViewportComponent
					id={VIEWPORT_ID}
					sessionSettingsMode={SESSION_SETTINGS_MODE.FIRST}
					showStatistics={true}
					branding={branding}
				>
					<ViewportAdditionalUIWrapper position={Positions.TOP_RIGHT}>
						<ViewportIcons
							viewportId={VIEWPORT_ID}
							enableArBtn
							enableFullscreenBtn
							enableZoomBtn
							enableCamerasBtn
						/>
					</ViewportAdditionalUIWrapper>
				</ViewportComponent>
			</ExamplePage>
		</>
	);
}
