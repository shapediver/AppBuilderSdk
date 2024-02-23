import { IMaterialStandardDataProperties, MaterialEngine, MATERIAL_TYPE } from "@shapediver/viewer";
import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React, { useEffect, useState } from "react";
import { useSession } from "hooks/shapediver/useSession";
import ViewportOverlayWrapper from "../../components/shapediver/viewport/ViewportOverlayWrapper";
import ViewportIcons from "../../components/shapediver/viewport/ViewportIcons";
import { ShapeDiverExampleModels } from "tickets";
import { IGenericParameterDefinition } from "types/store/shapediverStoreParameters";
import { useDefineGenericParameters } from "hooks/shapediver/useDefineGenericParameters";
import { useOutputMaterial } from "hooks/shapediver/useOutputMaterial";
import AppBuilderGridTemplatePage from "../templates/AppBuilderGridTemplatePage";
import MarkdownWidgetComponent from "../../components/shapediver/ui/MarkdownWidgetComponent";
import AppBuilderImage from "../../components/shapediver/appbuilder/AppBuilderImage";
import ParametersAndExportsAccordionComponent from "../../components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useSessionPropsParameter } from "../../hooks/shapediver/useSessionPropsParameter";
import AcceptRejectButtons from "../../components/shapediver/ui/AcceptRejectButtons";
import useUrlSearchParamSettings from "hooks/shapediver/useUrlSearchParamSettings";
import { ShapeDiverResponseParameterType } from "@shapediver/api.geometry-api-dto-v2";
import { AppBuilderContainerTypeEnum } from "types/shapediver/appbuilder";

const VIEWPORT_ID = "viewport_1";
const MODEL_NAME = "Sideboard";
const SESSION_ID = ShapeDiverExampleModels[MODEL_NAME].slug;
const SESSION_DTO = {
	id: SESSION_ID,
	ticket: ShapeDiverExampleModels[MODEL_NAME].ticket,
	modelViewUrl: ShapeDiverExampleModels[MODEL_NAME].modelViewUrl,
	excludeViewports: ["viewport_2"],
};
const ACCEPT_REJECT_MODE = true;

/**
 * Function that creates the view page.
 * The aside (right side) two tabs, one with a ParameterUiComponent and another with an ExportUiComponent
 * and a viewport and session in the main component. The session is connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function AppBuilderStaticExamplePage() {

	const { settings } = useUrlSearchParamSettings(SESSION_DTO);
	const sessionDto = settings ? settings.sessions[0] : undefined;
	const sessionId = sessionDto?.id ?? "";

	// use a session with a ShapeDiver model and register its parameters
	const { sessionApi } = useSession(sessionDto ? {
		...sessionDto,
		acceptRejectMode: ACCEPT_REJECT_MODE,
	} : undefined);

	useEffect(() => {
		if (sessionApi)
			console.debug(`Available output names: ${Object.values(sessionApi.outputs).map(o => o.name)}`);
	}, [sessionApi]);

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
				type: ShapeDiverResponseParameterType.COLOR,
				hidden: false
			}
		},
		{
			definition: {
				id: PARAMETER_NAMES.MAP,
				name: "Custom map",
				defval: "",
				type: ShapeDiverResponseParameterType.STRING,
				hidden: false
			}
		},
		{
			definition: {
				id: PARAMETER_NAMES.ROUGHNESS,
				name: "Custom roughness",
				defval: "0",
				type: ShapeDiverResponseParameterType.FLOAT,
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
				type: ShapeDiverResponseParameterType.BOOL,
				hidden: false
			}
		},
		{
			definition: {
				id: PARAMETER_NAMES.APPLY_TO_PLANE,
				name: "Apply to plane",
				defval: "false",
				type: ShapeDiverResponseParameterType.BOOL,
				hidden: false
			}
		}
	];
	const [materialParameters] = useState<IGenericParameterDefinition[]>(materialDefinitions);

	// state for the custom material properties
	const [materialProperties, setMaterialProperties] = useState<IMaterialStandardDataProperties>({
		type: MATERIAL_TYPE.STANDARD,
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
	useOutputMaterial(sessionId, outputNameShelf, materialProperties);
	useOutputMaterial(sessionId, outputNamePlane, materialProperties);

	/////
	// END - Example on how to apply a custom material to an output
	/////

	const markdown = `
# Heading level 1
## Heading level 2
### Heading level 3

**bold text**.

Italicized text is the *cat's meow*.

My favorite search engine is [Duck Duck Go](https://duckduckgo.com "The best search engine for privacy").

* Bullet in an unordered list.
`;

	// get parameters that don't have a group or whose group name includes "export"
	const parameterProps = useSessionPropsParameter(sessionId, param => !param.group || !param.group.name.toLowerCase().includes("export"))
		.concat(myParameterProps);

	const parameterTabs = <ParametersAndExportsAccordionComponent
		parameters={parameterProps.length > 0 ? parameterProps : []	}
		defaultGroupName="Custom material"
		topSection={<AcceptRejectButtons parameters={parameterProps}/>}
	/>;

	return (
		<AppBuilderGridTemplatePage

			top={<>
				<MarkdownWidgetComponent>Top secret</MarkdownWidgetComponent>
				<AppBuilderImage
					src="https://img2.storyblok.com/1536x0/filters:format(webp)/f/92524/712x699/7a500f3a9a/sync-your-favorite-design-software-with-shapediver.png"
					containerType={AppBuilderContainerTypeEnum.Row}
				/>
				<MarkdownWidgetComponent>Top secret</MarkdownWidgetComponent>
			</>
			}

			left={<>
				<MarkdownWidgetComponent>{markdown}</MarkdownWidgetComponent>
				<AppBuilderImage
					src="https://img2.storyblok.com/1536x0/filters:format(webp)/f/92524/712x699/7a500f3a9a/sync-your-favorite-design-software-with-shapediver.png"
					containerType={AppBuilderContainerTypeEnum.Column}
				/>
			</>}

			right={parameterTabs}

			bottom={
				<AppBuilderImage
					src="https://img2.storyblok.com/1536x0/filters:format(webp)/f/92524/712x699/7a500f3a9a/sync-your-favorite-design-software-with-shapediver.png"
					containerType={AppBuilderContainerTypeEnum.Row}
				/>
			}
		>

			<ViewportComponent
				id={VIEWPORT_ID}
			>
				<ViewportOverlayWrapper>
					<ViewportIcons
						viewportId={VIEWPORT_ID}
					/>
				</ViewportOverlayWrapper>
			</ViewportComponent>
		</AppBuilderGridTemplatePage>
	);
}
