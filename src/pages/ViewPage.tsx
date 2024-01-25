import { Tabs } from "@mantine/core";
import { IMaterialStandardDataProperties, MaterialEngine, PARAMETER_TYPE, SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import { IconFileDownload, IconAdjustmentsHorizontal } from "@tabler/icons-react";
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
import { ShapeDiverExampleModels } from "tickets";
import { useIsMobile } from "hooks/useIsMobile";
import classes from "./ViewPage.module.css";
import ParametersAndExportsAccordionTab from "../components/shapediver/ui/ParametersAndExportsAccordionTab";
import { IGenericParameterDefinition } from "types/store/shapediverStoreParameters";
import { useDefineGenericParameters } from "hooks/useDefineGenericParameters";
import { MaterialType, useOutputMaterial } from "hooks/useOutputMaterial";

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

	/////	
	// START - Example on how to apply a custom material to an output
	/////	
	const outputNameOrId = "Shelf";

	// create parameter definitions for the custom material
	const definitions: { [key: string]: IGenericParameterDefinition } = {
		color: {
			definition: {
				id: "colorParam",
				name: "Custom color",
				defval: "0x0d44f0ff",
				type: "Color",
				hidden: false
			}
		},
		map: {
			definition: {
				id: "mapParam",
				name: "Custom map",
				defval: "",
				type: "String",
				hidden: false
			}
		},
		roughness: {
			definition: {
				id: "roughnessParam",
				name: "Custom roughness",
				defval: "0",
				type: PARAMETER_TYPE.FLOAT,
				min: 0,
				max: 1,
				decimalplaces: 4,
				hidden: false
			}
		}
	};
	
	// define a generic parameter which influences a custom material definition
	const [materialParameters] = useState<IGenericParameterDefinition[]>(Object.values(definitions));

	const [materialProperties, setMaterialProperties] = useState<IMaterialStandardDataProperties>({ 
		color: definitions.color.definition.defval, 
		map: undefined, 
		roughness: +definitions.roughness.definition.defval
	});

	useDefineGenericParameters("mysession", !acceptRejectMode,
		materialParameters,
		async (values) => {
			if ("colorParam" in values)
				setMaterialProperties({ color: values["colorParam"] });

			if ("roughnessParam" in values)
				setMaterialProperties({ roughness: values["roughnessParam"] });

			// due to the asynchronous nature of loading a map, we need to wait for the map to be loaded before we can set the material properties
			// this also means that we resolve the promise only after the map has been loaded or if no map is specified
			if ("mapParam" in values) {
				const mapParam = values["mapParam"];
				if (mapParam !== "") {
					try {
						const map = await MaterialEngine.instance.loadMap(mapParam);
						if (map) {
							setMaterialProperties({ map: map });
						} else {
							setMaterialProperties({ map: undefined });
							console.warn(`Could not load map ${mapParam}`);
						}
					} catch (e) {
						setMaterialProperties({ map: undefined });
						console.warn(`Could not load map ${mapParam}: ${e}`);
					}
				} else {
					setMaterialProperties({ map: undefined });
				}
			}

			return values;
		}
	);
	const myParameterProps = useSessionPropsParameter("mysession");

	// apply the custom material
	useOutputMaterial(sessionId, outputNameOrId, materialProperties, MaterialType.Unlit);
	
	/////	
	// END - Example on how to apply a custom material to an output
	/////	

	const fullscreenId = "viewer-fullscreen-area";

	const parameterTabs = <Tabs defaultValue="parameters" className={classes.tabs}>
		<Tabs.List>
			<Tabs.Tab value="parameters" leftSection={<IconAdjustmentsHorizontal size={14} />}>Parameters</Tabs.Tab>
			<Tabs.Tab value="exports" leftSection={<IconFileDownload size={14} />}>Exports</Tabs.Tab>
		</Tabs.List>

		<ParametersAndExportsAccordionTab value="parameters" pt={isMobile ? "" : "xs"}>
			<ParametersAndExportsAccordionComponent
				parameters={parameterProps.length > 0 ? parameterProps.concat(myParameterProps) : []}
				defaultGroupName="Custom material"
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
