import AppBuilderImage from "@AppBuilderShared/components/shapediver/appbuilder/AppBuilderImage";
import AppBuilderTextWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderTextWidgetComponent";
import AcceptRejectButtons from "@AppBuilderShared/components/shapediver/ui/AcceptRejectButtons";
import ParametersAndExportsAccordionComponent from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import ViewportComponent from "@AppBuilderShared/components/shapediver/viewport/ViewportComponent";
import ViewportIcons from "@AppBuilderShared/components/shapediver/viewport/ViewportIcons";
import ViewportOverlayWrapper from "@AppBuilderShared/components/shapediver/viewport/ViewportOverlayWrapper";
import useAppBuilderSettings from "@AppBuilderShared/hooks/shapediver/appbuilder/useAppBuilderSettings";
import {useDefineGenericParameters} from "@AppBuilderShared/hooks/shapediver/parameters/useDefineGenericParameters";
import {useSessionPropsParameter} from "@AppBuilderShared/hooks/shapediver/parameters/useSessionPropsParameter";
import useDefaultSessionDto from "@AppBuilderShared/hooks/shapediver/useDefaultSessionDto";
import {useSession} from "@AppBuilderShared/hooks/shapediver/useSession";
import {useOutputMaterial} from "@AppBuilderShared/hooks/shapediver/viewer/useOutputMaterial";
import AppBuilderTemplateSelector from "@AppBuilderShared/pages/templates/AppBuilderTemplateSelector";
import {IAppBuilderSettingsSession} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	IGenericParameterDefinition,
	IGenericParameterExecutor,
} from "@AppBuilderShared/types/store/shapediverStoreParameters";
import {
	IMaterialStandardDataProperties,
	MATERIAL_TYPE,
	PARAMETER_TYPE,
} from "@shapediver/viewer.session";
import {MaterialEngine} from "@shapediver/viewer.viewport";
import React, {useCallback, useEffect, useState} from "react";

interface Props extends IAppBuilderSettingsSession {
	/** Name of example model */
	example?: string;
}

// define the parameter names for the custom material
const enum PARAMETER_NAMES {
	COLOR = "color",
	MAP = "map",
	ROUGHNESS = "roughness",
	APPLY_TO_SHELF = "applyToShelf",
	APPLY_TO_PLANE = "applyToPlane",
}

// define parameters for the custom material
const materialDefinitions: IGenericParameterDefinition[] = [
	{
		definition: {
			id: PARAMETER_NAMES.COLOR,
			name: "Custom color",
			defval: "0x0d44f0ff",
			type: PARAMETER_TYPE.COLOR,
			hidden: false,
		},
	},
	{
		definition: {
			id: PARAMETER_NAMES.MAP,
			name: "Custom map",
			defval: "",
			type: PARAMETER_TYPE.STRING,
			hidden: false,
		},
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
			hidden: false,
		},
	},
	{
		definition: {
			id: PARAMETER_NAMES.APPLY_TO_SHELF,
			name: "Apply to shelf",
			defval: "false",
			type: PARAMETER_TYPE.BOOL,
			hidden: false,
		},
	},
	{
		definition: {
			id: PARAMETER_NAMES.APPLY_TO_PLANE,
			name: "Apply to plane",
			defval: "false",
			type: PARAMETER_TYPE.BOOL,
			hidden: false,
		},
	},
];

/**
 * Function that creates the view page.
 * The aside (right side) two tabs, one with a ParameterUiComponent and another with an ExportUiComponent
 * and a viewport and session in the main component. The session is connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function AppBuilderStaticExamplePage(props: Partial<Props>) {
	const {defaultSessionDto} = useDefaultSessionDto(props);
	const {settings} = useAppBuilderSettings(defaultSessionDto);
	const sessionDto = settings ? settings.sessions[0] : undefined;
	const sessionId = sessionDto?.id ?? "";

	// use a session with a ShapeDiver model and register its parameters
	const {sessionApi} = useSession(sessionDto);

	useEffect(() => {
		if (sessionApi)
			console.debug(
				`Available output names: ${Object.values(sessionApi.outputs).map((o) => o.name)}`,
			);
	}, [sessionApi]);

	/////
	// START - Example on how to apply a custom material to an output
	/////

	const [materialParameters] =
		useState<IGenericParameterDefinition[]>(materialDefinitions);

	// state for the custom material properties
	const [materialProperties, setMaterialProperties] =
		useState<IMaterialStandardDataProperties>({
			type: MATERIAL_TYPE.STANDARD,
			color: materialParameters.find(
				(d) => d.definition.id === PARAMETER_NAMES.COLOR,
			)!.definition.defval,
			map: undefined,
			roughness: +materialParameters.find(
				(d) => d.definition.id === PARAMETER_NAMES.ROUGHNESS,
			)!.definition.defval,
		});

	// state for the custom material application
	const [outputIdShelf, setOutputIdShelf] = useState<string>("");
	const [outputIdPlane, setOutputIdPlane] = useState<string>("");

	// executor function for changes of custom material parameters
	const executor = useCallback<IGenericParameterExecutor>(async (values) => {
		if (PARAMETER_NAMES.COLOR in values)
			setMaterialProperties((p) => ({
				...p,
				color: values[PARAMETER_NAMES.COLOR],
			}));

		if (PARAMETER_NAMES.ROUGHNESS in values)
			setMaterialProperties((p) => ({
				...p,
				roughness: values[PARAMETER_NAMES.ROUGHNESS],
			}));

		// due to the asynchronous nature of loading a map, we need to wait for the map to be loaded before we can set the material properties
		// this also means that we resolve the promise only after the map has been loaded or if no map is specified
		if (PARAMETER_NAMES.MAP in values) {
			const mapParam = values[PARAMETER_NAMES.MAP];
			if (mapParam !== "") {
				try {
					const map = await MaterialEngine.instance.loadMap(mapParam);
					if (map) {
						setMaterialProperties((p) => ({...p, map: map}));
					} else {
						setMaterialProperties((p) => ({...p, map: undefined}));
						console.warn(`Could not load map ${mapParam}`);
					}
				} catch (e) {
					setMaterialProperties((p) => ({...p, map: undefined}));
					console.warn(`Could not load map ${mapParam}: ${e}`);
				}
			} else {
				setMaterialProperties((p) => ({...p, map: undefined}));
			}
		}

		if (PARAMETER_NAMES.APPLY_TO_SHELF in values)
			setOutputIdShelf(
				values[PARAMETER_NAMES.APPLY_TO_SHELF]
					? (sessionApi
							?.getOutputByName("Shelf")
							.find((o) => !o.format.includes("material"))?.id ??
							"")
					: "",
			);

		if (PARAMETER_NAMES.APPLY_TO_PLANE in values)
			setOutputIdPlane(
				values[PARAMETER_NAMES.APPLY_TO_PLANE]
					? (sessionApi
							?.getOutputByName("Image Plane")
							.find((o) => !o.format.includes("material"))?.id ??
							"")
					: "",
			);

		return values;
	}, []);

	// define the custom material parameters and a handler for the parameter changes
	const customNamespace = "mysession";
	useDefineGenericParameters(
		customNamespace,
		false /* acceptRejectMode */,
		materialParameters,
		executor,
	);
	const myParameterProps = useSessionPropsParameter(customNamespace);

	// apply the custom material
	useOutputMaterial(sessionId, outputIdShelf, materialProperties);
	useOutputMaterial(sessionId, outputIdPlane, materialProperties);

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
	const parameterProps = useSessionPropsParameter(
		sessionId,
		(param) =>
			!param.group || !param.group.name.toLowerCase().includes("export"),
	).concat(myParameterProps);

	const parameterTabs = (
		<ParametersAndExportsAccordionComponent
			parameters={parameterProps.length > 0 ? parameterProps : []}
			defaultGroupName="Custom material"
			topSection={<AcceptRejectButtons parameters={parameterProps} />}
		/>
	);

	return (
		<AppBuilderTemplateSelector
			top={{
				node: (
					<>
						<AppBuilderTextWidgetComponent text="Top secret" />
						<AppBuilderImage src="https://img2.storyblok.com/1536x0/filters:format(webp)/f/92524/712x699/7a500f3a9a/sync-your-favorite-design-software-with-shapediver.png" />
						<AppBuilderTextWidgetComponent text="Top secret" />
					</>
				),
			}}
			left={{
				node: (
					<>
						<AppBuilderTextWidgetComponent markdown={markdown} />
						<AppBuilderImage src="https://img2.storyblok.com/1536x0/filters:format(webp)/f/92524/712x699/7a500f3a9a/sync-your-favorite-design-software-with-shapediver.png" />
					</>
				),
			}}
			right={{node: parameterTabs}}
			bottom={{
				node: (
					<AppBuilderImage src="https://img2.storyblok.com/1536x0/filters:format(webp)/f/92524/712x699/7a500f3a9a/sync-your-favorite-design-software-with-shapediver.png" />
				),
			}}
		>
			<ViewportComponent>
				<ViewportOverlayWrapper>
					<ViewportIcons namespace={sessionId} />
				</ViewportOverlayWrapper>
			</ViewportComponent>
		</AppBuilderTemplateSelector>
	);
}
