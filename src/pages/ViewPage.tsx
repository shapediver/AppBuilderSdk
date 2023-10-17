import { Tabs } from "@mantine/core";
import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import { IconFileDownload, IconReplace } from "@tabler/icons-react";
import ViewportComponent from "components/shapediver/ViewportComponent";
import React from "react";
import ParametersAndExportsAccordionComponent from "components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useShapeDiverStoreParameters } from "store/shapediverStoreParameters";
import { useSession } from "hooks/useSession";
import ExamplePage from "pages/ExamplePage";
import { useBranding } from "hooks/useViewport";

/**
 * Function that creates the view page.
 * The aside (right side) two tabs, one with a ParameterUiComponent and another with an ExportUiComponent
 * and a viewport and session in the main component. The session is connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function ViewPage() {
	const sessionId = "session_1";
	const sessionCreateDto = {
		id: sessionId,
		ticket: "340ff308354b56f5cd0a631f668d48d934a38187c50ff049a19fd3565d316307cb042aaebfdccde871a81f5552c58c04907686e51cada8e8ea7878cfde011ff9d494a54acd68ccf39d9ecfac98bb6a9a2521fc9711294949c1557365b64bbce9e44d420d1b0a64-e5fb4e0ba6c4d6e047685318325f3704",
		modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
		excludeViewports: ["viewport_2"],
	};

	const { branding } = useBranding();

	useSession({
		...sessionCreateDto,
		isParametersRegister: true,
	});

	const parameterProps = useShapeDiverStoreParameters(state => Object.keys(state.useParameters(sessionId)).map(id => {
		return {sessionId, parameterId: id};
	}));
	const exportProps = useShapeDiverStoreParameters(state => Object.keys(state.useExports(sessionId)).map(id => {
		return {sessionId, exportId: id};
	}));

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
			<ExamplePage aside={aside}>
				<ViewportComponent
					id='viewport_1'
					sessionSettingsMode={SESSION_SETTINGS_MODE.FIRST}
					showStatistics={true}
					branding={branding}
				/>
			</ExamplePage>
		</>
	);
}
