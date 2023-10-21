import { Tabs } from "@mantine/core";
import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import { IconFileDownload, IconReplace } from "@tabler/icons-react";
import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React from "react";
import ParametersAndExportsAccordionComponent from "components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { useSession } from "hooks/useSession";
import ExamplePage from "pages/ExamplePage";
import { useMantineBranding } from "hooks/useMantineBranding";
import ViewportAdditionalUIWrapper, { Positions } from "../components/shapediver/viewport/ViewportAdditionalUIWrapper";
import ViewportIcons from "../components/shapediver/viewport/ViewportIcons";
import { useShapeDiverStoreViewer } from "../store/useShapeDiverStoreViewer";

/**
 * Function that creates the view page.
 * The aside (right side) two tabs, one with a ParameterUiComponent and another with an ExportUiComponent
 * and a viewport and session in the main component. The session is connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function ViewPage() {
	const viewportId = "viewport_1";
	const sessionId = "session_1";
	const sessionCreateDto = {
		id: sessionId,
		ticket: "340ff308354b56f5cd0a631f668d48d934a38187c50ff049a19fd3565d316307cb042aaebfdccde871a81f5552c58c04907686e51cada8e8ea7878cfde011ff9d494a54acd68ccf39d9ecfac98bb6a9a2521fc9711294949c1557365b64bbce9e44d420d1b0a64-e5fb4e0ba6c4d6e047685318325f3704",
		modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
		excludeViewports: ["viewport_2"],
	};
	const viewport = useShapeDiverStoreViewer(state => state.viewports[viewportId]);

	const { branding } = useMantineBranding();

	useSession({
		...sessionCreateDto,
		registerParametersAndExports: true,
	});

	const parameterProps = useShapeDiverStoreParameters(state => Object.keys(state.useParameters(sessionId)).map(id => {
		return {sessionId, parameterId: id};
	}));

	const exportProps = useShapeDiverStoreParameters(state => Object.keys(state.useExports(sessionId)).map(id => {
		return {sessionId, exportId: id};
	}));

	const fullscreenId = "viewer-fullscreen-area";

	const aside = <Tabs defaultValue="parameters" style={{ height: "100%"}}>
		<Tabs.List>
			<Tabs.Tab value="parameters" icon={<IconReplace size={14} />}>Parameters</Tabs.Tab>
			<Tabs.Tab value="exports" icon={<IconFileDownload size={14} />}>Exports</Tabs.Tab>
		</Tabs.List>

		<Tabs.Panel value="parameters" pt="xs"  style={{ position: "relative", height: "100%"}}>
			<div style={{ height: "calc(100% - 40px)", overflowY: "auto"}}>
				<ParametersAndExportsAccordionComponent parameters={parameterProps} exports={exportProps} disableIfDirty={true} defaultGroupName="Exports" />
			</div>
		</Tabs.Panel>

		<Tabs.Panel value="exports" pt="xs">
			<div style={{ height: "calc(100% - 40px)", overflowY: "auto"}}>
				<ParametersAndExportsAccordionComponent exports={exportProps} defaultGroupName="Exports" />
			</div>
		</Tabs.Panel>
	</Tabs>;

	return (
		<>
			<ExamplePage className={fullscreenId} aside={aside}>
				<ViewportComponent
					id={viewportId}
					sessionSettingsMode={SESSION_SETTINGS_MODE.FIRST}
					showStatistics={true}
					branding={branding}
				>
					<ViewportAdditionalUIWrapper position={Positions.TOP_RIGHT}>
						<ViewportIcons
							viewport={viewport}
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
