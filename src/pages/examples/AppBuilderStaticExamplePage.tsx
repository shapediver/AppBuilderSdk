import { IMaterialStandardDataProperties, MaterialEngine, MATERIAL_TYPE, PARAMETER_TYPE } from "@shapediver/viewer";
import ViewportComponent from "shared/components/shapediver/viewport/ViewportComponent";
import React, { useEffect, useState } from "react";
import { useSession } from "shared/hooks/shapediver/useSession";
import ViewportOverlayWrapper from "../../shared/components/shapediver/viewport/ViewportOverlayWrapper";
import ViewportIcons from "../../shared/components/shapediver/viewport/ViewportIcons";
import { IGenericParameterDefinition } from "shared/types/store/shapediverStoreParameters";
import { useDefineGenericParameters } from "shared/hooks/shapediver/parameters/useDefineGenericParameters";
import { useOutputMaterial } from "shared/hooks/shapediver/viewer/useOutputMaterial";
import AppBuilderImage from "../../shared/components/shapediver/appbuilder/AppBuilderImage";
import ParametersAndExportsAccordionComponent from "../../shared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useSessionPropsParameter } from "../../shared/hooks/shapediver/parameters/useSessionPropsParameter";
import AcceptRejectButtons from "../../shared/components/shapediver/ui/AcceptRejectButtons";
import useAppBuilderSettings from "shared/hooks/shapediver/appbuilder/useAppBuilderSettings";
import { IAppBuilderSettingsSession } from "shared/types/shapediver/appbuilder";
import useDefaultSessionDto from "shared/hooks/shapediver/useDefaultSessionDto";
import AppBuilderTextWidgetComponent from "shared/components/shapediver/appbuilder/AppBuilderTextWidgetComponent";
import AppBuilderTemplateSelector from "shared/pages/templates/AppBuilderTemplateSelector";

interface Props extends IAppBuilderSettingsSession {
	/** Name of example model */
	example?: string;
}

/**
 * Function that creates the view page.
 * The aside (right side) two tabs, one with a ParameterUiComponent and another with an ExportUiComponent
 * and a viewport and session in the main component. The session is connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function AppBuilderStaticExamplePage(props: Partial<Props>) {

	const { defaultSessionDto } = useDefaultSessionDto(props);
	const { settings } = useAppBuilderSettings(defaultSessionDto);
	const sessionDto = settings ? settings.sessions[0] : undefined;
	const sessionId = sessionDto?.id ?? "";

	// use a session with a ShapeDiver model and register its parameters
	const { sessionApi } = useSession(sessionDto);

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
				type: PARAMETER_TYPE.COLOR,
				hidden: false
			}
		},
		{
			definition: {
				id: PARAMETER_NAMES.MAP,
				name: "Custom map",
				defval: "",
				type: PARAMETER_TYPE.STRING,
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
## :span[Heading level 2]{color="lightgreen"}
### Heading level 3

:span[This shows]{color="blue"} **:span[bold text]{color="#ff00ff"}** mixed with *:span[italic]{color="gray"}* and normal text.

Italicized text is the *cat's meow*.

*:span[This is italic text.]{color="green"}*

My favorite search engine is [Duck Duck Go](https://duckduckgo.com "The best search engine for privacy").

* :span[Bullet in an unordered list]{color="blue"}.
* Bullet in an unordered list.

| Month    | Savings |
| -------- | ------- |
| January  | $250    |
| February | $80     |
| March    | $420    |

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
		<AppBuilderTemplateSelector

			top={{node: <>
				<AppBuilderTextWidgetComponent text="Top secret" />
				<AppBuilderImage
					src="https://img2.storyblok.com/1536x0/filters:format(webp)/f/92524/712x699/7a500f3a9a/sync-your-favorite-design-software-with-shapediver.png"
				/>
				<AppBuilderTextWidgetComponent text="Top secret" />
			</>
			}}

			left={{node: <>
				<AppBuilderTextWidgetComponent markdown={markdown} />
				<AppBuilderImage
					src="https://img2.storyblok.com/1536x0/filters:format(webp)/f/92524/712x699/7a500f3a9a/sync-your-favorite-design-software-with-shapediver.png"
				/>
			</>}}

			right={{node: parameterTabs}}

			bottom={{node: 
				<AppBuilderImage
					src="https://img2.storyblok.com/1536x0/filters:format(webp)/f/92524/712x699/7a500f3a9a/sync-your-favorite-design-software-with-shapediver.png"
				/>
			}}
		>

			<ViewportComponent>
				<ViewportOverlayWrapper>
					<ViewportIcons/>
				</ViewportOverlayWrapper>
			</ViewportComponent>
		</AppBuilderTemplateSelector>
	);
}
