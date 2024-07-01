import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React, { useCallback, useEffect, useState } from "react";
import ParametersAndExportsAccordionComponent from "components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useSession } from "hooks/shapediver/useSession";
import ExamplePage from "pages/templates/ExampleTemplatePage";
import ViewportOverlayWrapper from "../../components/shapediver/viewport/ViewportOverlayWrapper";
import ViewportIcons from "../../components/shapediver/viewport/ViewportIcons";
import { useSessionPropsParameter } from "hooks/shapediver/parameters/useSessionPropsParameter";
import AcceptRejectButtons from "../../components/shapediver/ui/AcceptRejectButtons";
import useAppBuilderSettings from "hooks/shapediver/useAppBuilderSettings";
import TabsComponent, { ITabsComponentProps } from "components/ui/TabsComponent";
import { IconTypeEnum } from "types/shapediver/icons";
import { IAppBuilderSettingsSession } from "types/shapediver/appbuilder";
import useDefaultSessionDto from "hooks/shapediver/useDefaultSessionDto";
import { useDefineGenericParameters } from "hooks/shapediver/parameters/useDefineGenericParameters";
import { ShapeDiverResponseParameterType } from "@shapediver/api.geometry-api-dto-v2";
import { IGenericParameterDefinition } from "types/store/shapediverStoreParameters";
import { CustomizationProperties, PlaneRestrictionApi } from "@shapediver/viewer.features.drawing-tools";
import { useDrawingTools } from "hooks/shapediver/viewer/useDrawingTools";
import { useDrawingToolsApiStore } from "store/useDrawingToolsApiStore";
import { IGeometryData } from "@shapediver/viewer";
import { useParameterStateless } from "hooks/shapediver/parameters/useParameterStateless";
import { useOutputContent } from "hooks/shapediver/viewer/useOutputContent";

const VIEWPORT_ID = "viewport_1";

interface Props extends IAppBuilderSettingsSession {
	/** Name of example model */
	example?: string;
}

/**
 * Function that creates the drawing tools page.
 * The aside (right side) tabs with a ParameterUiComponent
 * and a viewport and session in the main component. The session is connected via its id to the ParameterUiComponent.
 *
 * @returns
 */
export default function DrawingToolsPage(props: Partial<Props>) {

	const { defaultSessionDto } = useDefaultSessionDto(props);
	const { settings } = useAppBuilderSettings(defaultSessionDto);
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

	/////
	// START - Example on how to apply the drawing tools
	/////

	// state for the drawing tools application
	const [outputNameDrawingTools, setOutputNameDrawingTools] = useState<string>("");

	// get the parameter API
	const parameter = useParameterStateless<string>(sessionId, "points");

	// get the output API and output content for the customization properties
	const { outputContent } = useOutputContent(sessionId, outputNameDrawingTools);
	const customizationProperties = outputContent ? outputContent[0].data as CustomizationProperties : undefined;

	/**
     * The callback to be executed once the drawing tools are finished.
     * 
     * @param geometryData 
     */
	const onUpdate = useCallback(async (geometryData: IGeometryData) => {
		console.log("onUpdate");
		if (!parameter) return;

		const positionArray = geometryData.primitive.attributes["POSITION"].array;

		// get all points
		const points = [];
		for (let i = 0; i < positionArray.length; i += 3) {
			points.push([positionArray[i], positionArray[i + 1], positionArray[i + 2]]);
		}

		parameter.actions.setUiValue(JSON.stringify({ points: points }));
		await parameter.actions.execute(true);
	}, [parameter]);

	/**
     * The callback to be executed once the drawing tools are canceled.
     */
	const onCancel = useCallback(() => { 
		console.log("onCancel"); 
		setOutputNameDrawingTools("");
	}, []);

	/**
	 * The callback to be executed once the drawing tools are finished.
     * 
     * @param geometryData 
     */
	const onFinish = useCallback(async (geometryData: IGeometryData) => {
		console.log("onFinish");
		onUpdate(geometryData);
		setOutputNameDrawingTools("");
	}, [onUpdate]);


	// define the drawing tools inputs
	useDrawingTools(VIEWPORT_ID, customizationProperties, { onCancel, onFinish, onUpdate });
	const { drawingToolsApi, setDrawingToolsApi } = useDrawingToolsApiStore();
	
	// define the parameter names for the custom material
	const enum PARAMETER_NAMES {
		START_DRAWING = "startDrawing",
		SHOW_POINT_LABELS = "showPointLabels",
		SHOW_DISTANCE_LABELS = "showDistanceLabels",
		GRID_SNAPPING = "gridSnapping",
		GRID_UNIT = "gridUnit",
		ANGULAR_SNAPPING = "angularSnapping",
		ANGULAR_SECTIONS = "angularSections",
	}

	const [materialParameters, setMaterialParameters] = useState<IGenericParameterDefinition[]>([]);

	useEffect(() => {
		const drawingToolsApi = useDrawingToolsApiStore.getState().drawingToolsApi;
		let planeRestrictionApi: PlaneRestrictionApi | undefined;
		if(drawingToolsApi)
			planeRestrictionApi = Object.values(drawingToolsApi.restrictions).find(restriction => restriction instanceof PlaneRestrictionApi) as PlaneRestrictionApi | undefined;

		setMaterialParameters(
			[
				{
					definition: {
						id: PARAMETER_NAMES.START_DRAWING,
						name: "Start Drawing",
						defval: (drawingToolsApi !== undefined) + "",
						type: ShapeDiverResponseParameterType.BOOL,
						hidden: false
					},
				},
				{
					definition: {
						id: PARAMETER_NAMES.SHOW_POINT_LABELS,
						name: "Show Point Labels",
						defval: (drawingToolsApi?.showPointLabels ?? false) + "",
						type: ShapeDiverResponseParameterType.BOOL,
						hidden: !outputNameDrawingTools
					}
				},
				{
					definition: {
						id: PARAMETER_NAMES.SHOW_DISTANCE_LABELS,
						name: "Show Distance Labels",
						defval: (drawingToolsApi?.showDistanceLabels ?? false) + "",
						type: ShapeDiverResponseParameterType.BOOL,
						hidden: !outputNameDrawingTools
					}
				},
				{
					definition: {
						id: PARAMETER_NAMES.GRID_SNAPPING,
						name: "Grid Snapping",
						defval: (planeRestrictionApi?.gridRestrictionApi.enabled ?? false) + "",
						type: ShapeDiverResponseParameterType.BOOL,
						hidden: !outputNameDrawingTools
					}
				},
				{
					definition: {
						id: PARAMETER_NAMES.GRID_UNIT,
						name: "Grid Unit",
						defval: (planeRestrictionApi?.gridRestrictionApi.gridUnit ?? 1) + "",
						min: 1,
						max: 10,
						type: ShapeDiverResponseParameterType.INT,
						hidden: !outputNameDrawingTools
					}
				},
				{
					definition: {
						id: PARAMETER_NAMES.ANGULAR_SNAPPING,
						name: "Angular Snapping",
						defval: (planeRestrictionApi?.angularRestrictionApi.enabled ?? false) + "",
						type: ShapeDiverResponseParameterType.BOOL,
						hidden: !outputNameDrawingTools
					}
				},
				{
					definition: {
						id: PARAMETER_NAMES.ANGULAR_SECTIONS,
						name: "Angular Sections",
						defval: (planeRestrictionApi?.angularRestrictionApi.angleStep ?? 8 / Math.PI) * Math.PI + "",
						min: 2,
						max: 24,
						type: ShapeDiverResponseParameterType.INT,
						hidden: !outputNameDrawingTools
					}
				}
			]
		);
	}, [drawingToolsApi, setDrawingToolsApi, outputNameDrawingTools]);


	// define the custom drawing tools parameters and a handler for changes
	const customSessionId = "mysession";
	useDefineGenericParameters(customSessionId, false /* acceptRejectMode */,
		materialParameters,
		async (values) => {
			if (PARAMETER_NAMES.START_DRAWING in values)
				setOutputNameDrawingTools(""+values[PARAMETER_NAMES.START_DRAWING] === "true" ? "DrawingToolsOptions" : "");

			const drawingToolsApi = useDrawingToolsApiStore.getState().drawingToolsApi;
			if(drawingToolsApi !== undefined) {
				const planeRestrictionApi = Object.values(drawingToolsApi.restrictions).find(restriction => restriction instanceof PlaneRestrictionApi)! as PlaneRestrictionApi;

				if (PARAMETER_NAMES.SHOW_POINT_LABELS in values)
					drawingToolsApi.showPointLabels = "" + values[PARAMETER_NAMES.SHOW_POINT_LABELS] === "true";

				if (PARAMETER_NAMES.SHOW_DISTANCE_LABELS in values)
					drawingToolsApi.showDistanceLabels = "" + values[PARAMETER_NAMES.SHOW_DISTANCE_LABELS] === "true";

				if (PARAMETER_NAMES.GRID_SNAPPING in values)
					planeRestrictionApi.gridRestrictionApi.enabled = "" + values[PARAMETER_NAMES.GRID_SNAPPING] === "true";
				
				if (PARAMETER_NAMES.GRID_UNIT in values)
					planeRestrictionApi.gridRestrictionApi.gridUnit = values[PARAMETER_NAMES.GRID_UNIT];
				
				if (PARAMETER_NAMES.ANGULAR_SNAPPING in values)
					planeRestrictionApi.angularRestrictionApi.enabled = "" + values[PARAMETER_NAMES.ANGULAR_SNAPPING] === "true";
				
				if (PARAMETER_NAMES.ANGULAR_SECTIONS in values)
					planeRestrictionApi.angularRestrictionApi.angleStep = Math.PI / values[PARAMETER_NAMES.ANGULAR_SECTIONS];
			}

			return values;
		}
	);
	const myParameterProps = useSessionPropsParameter(customSessionId);


	/////
	// END - Example on how to apply the drawing tools
	/////

	const tabProps: ITabsComponentProps = {
		defaultValue: "Parameters",
		tabs: [
			{
				name: "Parameters",
				icon: IconTypeEnum.AdjustmentsHorizontal,
				children: [
					<ParametersAndExportsAccordionComponent key={0}
						parameters={parameterProps.length > 0 ? parameterProps.concat(myParameterProps) : []}
						defaultGroupName="Drawing Tools"
						topSection={<AcceptRejectButtons parameters={parameterProps} />}
					/>
				]
			}
		]
	};

	const parameterTabs = <TabsComponent {...tabProps} />;

	return (
		<>
			<ExamplePage aside={parameterTabs}>
				<ViewportComponent
					id={VIEWPORT_ID}
				>
					<ViewportOverlayWrapper>
						<ViewportIcons
							viewportId={VIEWPORT_ID}
						/>
					</ViewportOverlayWrapper>
				</ViewportComponent>
			</ExamplePage>
		</>
	);
}
