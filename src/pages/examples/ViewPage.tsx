import { IMaterialStandardDataProperties, MaterialEngine, PARAMETER_TYPE, SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React, { useEffect, useState } from "react";
import ParametersAndExportsAccordionComponent from "components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useSession } from "hooks/shapediver/useSession";
import ExamplePage from "pages/templates/ExampleTemplatePage";
import { useViewerBranding } from "hooks/shapediver/useViewerBranding";
import ViewportAdditionalUIWrapper, { Positions } from "../../components/shapediver/viewport/ViewportAdditionalUIWrapper";
import ViewportIcons from "../../components/shapediver/viewport/ViewportIcons";
import { useSessionPropsParameter } from "hooks/shapediver/useSessionPropsParameter";
import { useSessionPropsExport } from "hooks/shapediver/useSessionPropsExport";
import { ShapeDiverExampleModels } from "tickets";
import { IGenericParameterDefinition } from "types/store/shapediverStoreParameters";
import { useDefineGenericParameters } from "hooks/shapediver/useDefineGenericParameters";
import { MaterialType, useOutputMaterial } from "hooks/shapediver/useOutputMaterial";
import AcceptRejectButtons from "../../components/shapediver/ui/AcceptRejectButtons";
import useAppBuilderSettings from "hooks/shapediver/useAppBuilderSettings";
import TabsComponent, { ITabsComponentProps } from "components/ui/TabsComponent";
import { IconTypeEnum } from "types/shapediver/icons";

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
	
	const { settings } = useAppBuilderSettings({
		id: ShapeDiverExampleModels[modelName].slug,
		ticket: ShapeDiverExampleModels[modelName].ticket,
		modelViewUrl: ShapeDiverExampleModels[modelName].modelViewUrl,
		acceptRejectMode: true
	});

	const sessionCreateDto = settings ? settings.sessions[0] : undefined;
	const sessionId = sessionCreateDto?.id ?? "";

	// use a session with a ShapeDiver model and register its parameters
	const { sessionApi } = useSession(sessionCreateDto);
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

	// define the parameter names for the custom material
	const enum PARAMETER_NAMES {
		COLOR = "color",
		MAP = "map",
		ROUGHNESS = "roughness",
		APPLY_TO_SHELF = "applyToShelf",
		APPLY_TO_PLANE = "applyToPlane"
	}

	// define parameters for the custom material
	const materialDefinitions: IGenericParameterDefinition[] = [
		{
			definition: {
				id: PARAMETER_NAMES.COLOR,
				name: "Custom color",
				defval: "0x0d44f0ff",
				type: "Color",
				hidden: false
			}
		},
		{
			definition: {
				id: PARAMETER_NAMES.MAP,
				name: "Custom map",
				defval: "",
				type: "String",
				hidden: false
			}
		},
		{
			definition: {
				id: PARAMETER_NAMES.ROUGHNESS,
				name: "Custom roughness",
				defval: "0",
				type: PARAMETER_TYPE.FLOAT,
				min: 0,
				max: 1,
				decimalplaces: 4,
				hidden: false
			}
		},
		{
			definition: {
				id: PARAMETER_NAMES.APPLY_TO_SHELF,
				name: "Apply to shelf",
				defval: "false",
				type: PARAMETER_TYPE.BOOL,
				hidden: false
			}
		},
		{
			definition: {
				id: PARAMETER_NAMES.APPLY_TO_PLANE,
				name: "Apply to plane",
				defval: "false",
				type: PARAMETER_TYPE.BOOL,
				hidden: false
			}
		}
	];
	const [materialParameters] = useState<IGenericParameterDefinition[]>(materialDefinitions);

	// state for the custom material properties
	const [materialProperties, setMaterialProperties] = useState<IMaterialStandardDataProperties>({
		color: materialParameters.find(d => d.definition.id === PARAMETER_NAMES.COLOR)!.definition.defval,
		map: undefined,
		roughness: +materialParameters.find(d => d.definition.id === PARAMETER_NAMES.ROUGHNESS)!.definition.defval
	});

	// state for the custom material application
	const [outputNameShelf, setOutputNameShelf] = useState<string>("");
	const [outputNamePlane, setOutputNamePlane] = useState<string>("");

	// define the custom material parameters and a handler for the parameter changes
	const customSessionId = "mysession";
	useDefineGenericParameters(customSessionId, false /* acceptRejectMode */,
		materialParameters,
		async (values) => {
			if (PARAMETER_NAMES.COLOR in values)
				setMaterialProperties({ ...materialProperties, color: values[PARAMETER_NAMES.COLOR] });

			if (PARAMETER_NAMES.ROUGHNESS in values)
				setMaterialProperties({ ...materialProperties, roughness: values[PARAMETER_NAMES.ROUGHNESS] });

			// due to the asynchronous nature of loading a map, we need to wait for the map to be loaded before we can set the material properties
			// this also means that we resolve the promise only after the map has been loaded or if no map is specified
			if (PARAMETER_NAMES.MAP in values) {
				const mapParam = values[PARAMETER_NAMES.MAP];
				if (mapParam !== "") {
					try {
						const map = await MaterialEngine.instance.loadMap(mapParam);
						if (map) {
							setMaterialProperties({ ...materialProperties, map: map });
						} else {
							setMaterialProperties({ ...materialProperties, map: undefined });
							console.warn(`Could not load map ${mapParam}`);
						}
					} catch (e) {
						setMaterialProperties({ ...materialProperties, map: undefined });
						console.warn(`Could not load map ${mapParam}: ${e}`);
					}
				} else {
					setMaterialProperties({ ...materialProperties, map: undefined });
				}
			}

			if (PARAMETER_NAMES.APPLY_TO_SHELF in values)
				setOutputNameShelf(""+values[PARAMETER_NAMES.APPLY_TO_SHELF] === "true" ? "Shelf" : "");

			if (PARAMETER_NAMES.APPLY_TO_PLANE in values)
				setOutputNamePlane(""+values[PARAMETER_NAMES.APPLY_TO_PLANE] === "true" ? "Image Plane" : "");

			return values;
		}
	);
	const myParameterProps = useSessionPropsParameter(customSessionId);

	// apply the custom material
	useOutputMaterial(sessionId, outputNameShelf, materialProperties, MaterialType.Standard);
	useOutputMaterial(sessionId, outputNamePlane, materialProperties, MaterialType.Standard);

	/////
	// END - Example on how to apply a custom material to an output
	/////

	const fullscreenId = "viewer-fullscreen-area";
	const { branding } = useViewerBranding();

	const tabProps: ITabsComponentProps = {
		defaultValue: "Parameters",
		tabs: [
			{
				name: "Parameters",
				icon: IconTypeEnum.AdjustmentsHorizontal,
				children: [
					<ParametersAndExportsAccordionComponent key={0}
						parameters={parameterProps.length > 0 ? parameterProps.concat(myParameterProps) : []}
						defaultGroupName="Custom material"
						topSection={<AcceptRejectButtons parameters={parameterProps}/>}
					/>
				]
			},
			{
				name: "Exports",
				icon: IconTypeEnum.Download,
				children: [
					<ParametersAndExportsAccordionComponent key={0}
						parameters={exportParameterProps}
						exports={exportProps}
						defaultGroupName="Exports"
						topSection={<AcceptRejectButtons parameters={exportParameterProps}/>}
					/>
				]
			}
		]
	};

	const parameterTabs = <TabsComponent {...tabProps} />;

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
