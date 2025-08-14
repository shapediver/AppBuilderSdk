import AcceptRejectButtons from "@AppBuilderShared/components/shapediver/ui/AcceptRejectButtons";
import ParametersAndExportsAccordionComponent from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import ViewportComponent from "@AppBuilderShared/components/shapediver/viewport/ViewportComponent";
import ViewportIcons from "@AppBuilderShared/components/shapediver/viewport/ViewportIcons";
import ViewportOverlayWrapper from "@AppBuilderShared/components/shapediver/viewport/ViewportOverlayWrapper";
import TabsComponent, {
	ITabsComponentProps,
} from "@AppBuilderShared/components/ui/TabsComponent";
import {useSessionWithAppBuilder} from "@AppBuilderShared/hooks/shapediver/appbuilder/useSessionWithAppBuilder";
import {useDefineGenericParameters} from "@AppBuilderShared/hooks/shapediver/parameters/useDefineGenericParameters";
import {useSessionPropsExport} from "@AppBuilderShared/hooks/shapediver/parameters/useSessionPropsExport";
import {useSessionPropsParameter} from "@AppBuilderShared/hooks/shapediver/parameters/useSessionPropsParameter";
import {useOutputMaterial} from "@AppBuilderShared/hooks/shapediver/viewer/useOutputMaterial";
import {IAppBuilderSettingsSession} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	IGenericParameterDefinition,
	IGenericParameterExecutor,
} from "@AppBuilderShared/types/store/shapediverStoreParameters";
import {
	IMaterialStandardDataProperties,
	MATERIAL_TYPE,
	PARAMETER_TYPE,
	SESSION_SETTINGS_MODE,
} from "@shapediver/viewer.session";
import {MaterialEngine} from "@shapediver/viewer.viewport";
import ExamplePage from "pages/examples/ExamplePage";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {ExampleModels} from "~/tickets";

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
export default function ViewPage(props: Partial<Props>) {
	const sessionSideboardKey = "Sideboard";
	const sessionCreateDto = {
		id: "default",
		ticket: ExampleModels[sessionSideboardKey].ticket,
		modelViewUrl: ExampleModels[sessionSideboardKey].modelViewUrl,
	};
	const sessionId = sessionCreateDto?.id ?? "";

	// use a session with a ShapeDiver model and register its parameters
	const {sessionApi} = useSessionWithAppBuilder(sessionCreateDto);
	useEffect(() => {
		if (sessionApi)
			console.debug(
				`Available output names: ${Object.values(sessionApi.outputs).map((o) => o.name)}`,
			);
	}, [sessionApi]);

	// get parameters that don't have a group or whose group name includes "export"
	const parameterProps = useSessionPropsParameter(
		sessionId,
		(param) =>
			!param.group || !param.group.name.toLowerCase().includes("export"),
	);
	// get parameters whose group name includes "export"
	const exportParameterProps = useSessionPropsParameter(
		sessionId,
		(param) => param.group?.name.toLowerCase().includes("export") ?? false,
	);
	const exportProps = useSessionPropsExport(sessionId);

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
			)!.definition.defval!,
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

	const tabProps: ITabsComponentProps = useMemo(() => {
		return {
			defaultValue: "Parameters",
			tabs: [
				{
					name: "Parameters",
					icon: "tabler:adjustments-horizontal",
					children: [
						<ParametersAndExportsAccordionComponent
							key={0}
							parameters={
								parameterProps.length > 0
									? parameterProps.concat(myParameterProps)
									: []
							}
							defaultGroupName="Custom material"
							topSection={
								<AcceptRejectButtons
									parameters={parameterProps}
								/>
							}
						/>,
					],
				},
				{
					name: "Exports",
					icon: "tabler:download",
					children: [
						<ParametersAndExportsAccordionComponent
							key={0}
							parameters={exportParameterProps}
							exports={exportProps}
							defaultGroupName="Exports"
							topSection={
								<AcceptRejectButtons
									parameters={exportParameterProps}
								/>
							}
						/>,
					],
				},
			],
		};
	}, [parameterProps, exportParameterProps, exportProps, myParameterProps]);

	const parameterTabs = <TabsComponent {...tabProps} />;

	return (
		<>
			<ExamplePage aside={parameterTabs}>
				<ViewportComponent
					sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
					sessionSettingsId={sessionId}
				>
					<ViewportOverlayWrapper>
						<ViewportIcons />
					</ViewportOverlayWrapper>
				</ViewportComponent>
			</ExamplePage>
		</>
	);
}
