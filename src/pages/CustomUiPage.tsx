import { Tabs } from "@mantine/core";
import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import { IconFileDownload, IconReplace } from "@tabler/icons-react";
import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React, { useEffect, useState } from "react";
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
import { ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v2";
import { useDefineGenericParameters } from "hooks/useDefineGenericParameters";
import { IGenericParameterDefinition } from "types/store/shapediverStoreParameters";

interface ICustomUiData {
	hidden?: string[],
	parameters?: ShapeDiverResponseParameter[]
}

/**
 * Function that creates the view page.
 * The aside (right side) two tabs, one with a ParameterUiComponent and another with an ExportUiComponent
 * and a viewport and session in the main component. The session is connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function ViewPage() {
	const viewportId = "viewport_1";
	const modelName = "CustomUiBookshelf";
	const sessionId = ShapeDiverExampleModels[modelName].slug;
	const sessionCreateDto = {
		id: sessionId,
		ticket: ShapeDiverExampleModels[modelName].ticket,
		modelViewUrl: ShapeDiverExampleModels[modelName].modelViewUrl,
		excludeViewports: ["viewport_2"],
	};
	const acceptRejectMode = true;
	const isMobile = useIsMobile();

	const { branding } = useMantineBranding();

	// use a session with a ShapeDiver model and register its parameters
	const { sessionApi } = useSession({
		...sessionCreateDto,
		registerParametersAndExports: true,
		acceptRejectMode: acceptRejectMode,
	});
	useEffect(() => {
		if (sessionApi)
			console.debug(`Available output names: ${Object.values(sessionApi.outputs).map(o => o.name)}`);
	}, [sessionApi]);
	
	// set state of hidden parameters
	const [hiddenParameters, setHiddenParameters] = useState<string[]>([]);

	// get parameters that don't have a group or whose group name includes "export"
	const parameterProps = useSessionPropsParameter(sessionId, param => !hiddenParameters.includes(param.name) && (!param.group || !param.group.name.toLowerCase().includes("export")));
	// get parameters whose group name includes "export"
	const exportParameterProps = useSessionPropsParameter(sessionId, param => param.group!.name.toLowerCase().includes("export"));
	const exportProps = useSessionPropsExport(sessionId);

	// set state of custom parameters
	const [customParameters, setCustomParameters] = useState<IGenericParameterDefinition[]>([]);

	useDefineGenericParameters("mysession", false, 
		customParameters,
		(values) => new Promise(resolve => {
			console.log(values);

			resolve(values);
		})			
	);

	const myParameterProps = useSessionPropsParameter("mysession");
	
	// Example on how to access an output and react to its changes
	const outputNameOrId = "CustomUI";
	const { outputApi, outputNode } = useOutput(sessionId, outputNameOrId);
	useEffect(() => {
		if (outputApi) {
			const customUiData = outputApi.content![0].data as ICustomUiData;
			console.debug(`Output ${outputApi?.id} (${outputApi?.displayname ? outputApi?.displayname : outputApi?.name}) version ${outputApi?.version}`, customUiData);
			setHiddenParameters(customUiData.hidden || []);
			setCustomParameters((customUiData.parameters || []).map(p => { return { definition: p }; }));
		} else
			console.debug(`Output with name "${outputNameOrId}" could not be found, check the available output names`);
	}, [outputNode, outputApi]);

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
