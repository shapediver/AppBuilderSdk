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
import classes from "./ViewPage.module.css";
import ParametersAndExportsAccordionTab from "../components/shapediver/ui/ParametersAndExportsAccordionTab";

/**
 * Function that creates the view page.
 * The aside (right side) two tabs, one with a ParameterUiComponent and another with an ExportUiComponent
 * and a viewport and session in the main component. The session is connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function ViewPage() {
	const viewportId = "viewport_1";
	const modelName = "Sideboard";
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

	// get parameters that don't have a group or whose group name includes "export"
	const parameterProps = useSessionPropsParameter(sessionId, param => !param.group || !param.group.name.toLowerCase().includes("export"));
	// get parameters whose group name includes "export"
	const exportParameterProps = useSessionPropsParameter(sessionId, param => param.group!.name.toLowerCase().includes("export"));
	const exportProps = useSessionPropsExport(sessionId);

	// Example on how to access an output and react to its changes
	const outputNameOrId = "Shelf";
	const { outputApi, outputNode } = useOutput(sessionId, outputNameOrId);
	useEffect(() => {
		if (outputApi)
			console.debug(`Output ${outputApi?.id} (${outputApi?.displayname ? outputApi?.displayname : outputApi?.name}) version ${outputApi?.version}`, outputNode);
		else
			console.debug(`Output with name "${outputNameOrId}" could not be found, check the available output names`);
	}, [outputNode, outputApi]);

	// define a generic parameter which influences a custom material definition
	// const [materialProperties, setMaterialProperties] = useState<IMaterialStandardDataProperties>({});
	// useDefineGenericParameters("mysession", !acceptRejectMode,
	// 	{
	// 		definition: {
	// 			id: "myparam",
	// 			name: "Custom color",
	// 			defval: "0xffffffff",
	// 			type: "Color",
	// 			hidden: false
	// 		}
	// 	},
	// 	(values) => new Promise(resolve => {
	// 		if ("myparam" in values)
	// 			setMaterialProperties({ color: values["myparam"] });

	// 		resolve(values);
	// 	})
	// );

	// apply the custom material
	// useNodeMaterial(outputNode, materialProperties);

	const myParameterProps = useSessionPropsParameter("mysession");

	const fullscreenId = "viewer-fullscreen-area";

	const parameterTabs = <Tabs defaultValue="parameters" className={classes.tabs}>
		<Tabs.List>
			<Tabs.Tab value="parameters" leftSection={<IconReplace size={14} />}>Parameters</Tabs.Tab>
			<Tabs.Tab value="exports" leftSection={<IconFileDownload size={14} />}>Exports</Tabs.Tab>
		</Tabs.List>

		<ParametersAndExportsAccordionTab value="parameters" pt={isMobile ? "" : "xs"}>
			<ParametersAndExportsAccordionComponent
				parameters={parameterProps.length > 0 ? parameterProps.concat(myParameterProps) : []}
				defaultGroupName="My parameters"
			/>
		</ParametersAndExportsAccordionTab>

		<ParametersAndExportsAccordionTab  value="exports" pt={isMobile ? "" : "xs"}>
			<ParametersAndExportsAccordionComponent parameters={exportParameterProps} exports={exportProps} defaultGroupName="Exports" />
		</ParametersAndExportsAccordionTab>
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
