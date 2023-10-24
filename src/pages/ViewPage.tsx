import { Tabs } from "@mantine/core";
import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import { IconFileDownload, IconReplace } from "@tabler/icons-react";
import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React from "react";
import ParametersAndExportsAccordionComponent from "components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useSession } from "hooks/useSession";
import ExamplePage from "pages/ExamplePage";
import { useMantineBranding } from "hooks/useMantineBranding";
import ViewportAdditionalUIWrapper, { Positions } from "../components/shapediver/viewport/ViewportAdditionalUIWrapper";
import ViewportIcons from "../components/shapediver/viewport/ViewportIcons";
import { useSessionPropsParameter } from "hooks/useSessionPropsParameter";
import { useSessionPropsExport } from "hooks/useSessionPropsExport";

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
	const acceptRejectMode = true;
	
	const { branding } = useMantineBranding();

	useSession({
		...sessionCreateDto,
		registerParametersAndExports: true,
		acceptRejectMode: acceptRejectMode,
	});

	const parameterProps = useSessionPropsParameter(sessionId);
	const exportProps = useSessionPropsExport(sessionId);

	const fullscreenId = "viewer-fullscreen-area";

	const aside = <Tabs defaultValue="parameters">
		<Tabs.List>
			<Tabs.Tab value="parameters" leftSection={<IconReplace size={14} />}>Parameters</Tabs.Tab>
			<Tabs.Tab value="exports" leftSection={<IconFileDownload size={14} />}>Exports</Tabs.Tab>
		</Tabs.List>

		<Tabs.Panel value="parameters" pt="xs">
			<div>
				<ParametersAndExportsAccordionComponent parameters={parameterProps} exports={exportProps} acceptRejectMode={acceptRejectMode} defaultGroupName="Exports" />
			</div>
		</Tabs.Panel>

		<Tabs.Panel value="exports" pt="xs">
			<div>
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
							viewportId={viewportId}
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
