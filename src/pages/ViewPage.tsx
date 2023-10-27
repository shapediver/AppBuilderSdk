import { Tabs } from "@mantine/core";
import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import { IconFileDownload, IconReplace } from "@tabler/icons-react";
import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React, { useEffect } from "react";
import ParametersAndExportsAccordionComponent from "components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useSession } from "hooks/useSession";
import ExamplePage from "pages/ExamplePage";
import { useMantineBranding } from "hooks/useMantineBranding";
import ViewportAdditionalUIWrapper, { Positions } from "../components/shapediver/viewport/ViewportAdditionalUIWrapper";
import ViewportIcons from "../components/shapediver/viewport/ViewportIcons";
import { useSessionPropsParameter } from "hooks/useSessionPropsParameter";
import { useSessionPropsExport } from "hooks/useSessionPropsExport";
import { useOutput } from "hooks/useOutput";
import { ShapeDiverExampleModels } from "tickets";
import { useIsMobile } from "hooks/useIsMobile";

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
		ticket: ShapeDiverExampleModels["Sideboard"].ticket,
		modelViewUrl: ShapeDiverExampleModels["Sideboard"].modelViewUrl,
		excludeViewports: ["viewport_2"],
	};
	const acceptRejectMode = true;
	const isMobile = useIsMobile();

	const { branding } = useMantineBranding();

	// use a session with a ShapeDiver model and register its parameters
	useSession({
		...sessionCreateDto,
		registerParametersAndExports: true,
		acceptRejectMode: acceptRejectMode,
	});

	// get parameters that don't have a group or whose group name includes "export"
	const parameterProps = useSessionPropsParameter(sessionId, param => !param.group || !param.group.name.toLowerCase().includes("export"));
	// get parameters whose group name includes "export"
	const exportParameterProps = useSessionPropsParameter(sessionId, param => param.group!.name.toLowerCase().includes("export"));
	const exportProps = useSessionPropsExport(sessionId);

	// define a generic parameter
	// useDefineGenericParameters("mysession", !acceptRejectMode, 
	// 	{
	// 		definition: {
	// 			id: "myparam", 
	// 			name: "Test", 
	// 			defval: "", 
	// 			type: "String", 
	// 			hidden: false 
	// 		}, 
	// 		isValid: () => true
	// 	}, 
	// 	(values) => Promise.resolve(console.log(values))
	// );

	// Example on how to access an output and react to its changes
	const { outputApi, outputNode } = useOutput(sessionId, "Shelf");
	useEffect(() => {
		console.debug(`Output ${outputApi?.id} version ${outputApi?.version}`, outputNode);
	}, [outputNode, outputApi]);

	const myParameterProps = useSessionPropsParameter("mysession");

	const fullscreenId = "viewer-fullscreen-area";

	const parameterTabs = <Tabs defaultValue="parameters" style={{display: "flex", flexDirection: "column", maxHeight: "100%"}}>
		<Tabs.List>
			<Tabs.Tab value="parameters" leftSection={<IconReplace size={14} />}>Parameters</Tabs.Tab>
			<Tabs.Tab value="exports" leftSection={<IconFileDownload size={14} />}>Exports</Tabs.Tab>
		</Tabs.List>

		<Tabs.Panel value="parameters" pt={isMobile ? "" : "xs"} style={{ flexGrow: "1", overflow: "auto", maxHeight: "100%" }}>
			<ParametersAndExportsAccordionComponent 
				parameters={parameterProps.length > 0 ? parameterProps.concat(myParameterProps) : []}
				defaultGroupName="My parameters"
			/>
		</Tabs.Panel>

		<Tabs.Panel value="exports" pt={isMobile ? "" : "xs"} style={{ flexGrow: "1", overflow: "auto", maxHeight: "100%" }}>
			<ParametersAndExportsAccordionComponent parameters={exportParameterProps} exports={exportProps} defaultGroupName="Exports" />
		</Tabs.Panel>
	</Tabs>;

	return (
		<>
			<ExamplePage className={fullscreenId} aside={parameterTabs}>
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
