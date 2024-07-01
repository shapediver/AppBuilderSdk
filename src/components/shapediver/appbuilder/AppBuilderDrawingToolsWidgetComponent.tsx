import React, { useCallback, useEffect, useRef, useState } from "react";
import { IAppBuilderWidgetPropsDrawingTools } from "types/shapediver/appbuilder";
import { ShapeDiverResponseParameterType } from "@shapediver/sdk.geometry-api-sdk-v2";
import { PointsData, PlaneRestrictionApi } from "@shapediver/viewer.features.drawing-tools";
import { useDefineGenericParameters } from "hooks/shapediver/parameters/useDefineGenericParameters";
import { useParameterStateless } from "hooks/shapediver/parameters/useParameterStateless";
import { useSessionPropsParameter } from "hooks/shapediver/parameters/useSessionPropsParameter";
import { useDrawingTools } from "hooks/shapediver/viewer/useDrawingTools";
import { IGenericParameterDefinition } from "types/store/shapediverStoreParameters";
import ParametersAndExportsAccordionComponent from "../ui/ParametersAndExportsAccordionComponent";
import { useId } from "@mantine/hooks";
import { Image } from "@mantine/core";

const VIEWPORT_ID = "viewport_1";

interface Props extends IAppBuilderWidgetPropsDrawingTools {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string,
	/**
	 * Default viewport id to use for the widgets that do not specify a viewport id.
	 */
	viewportId?: string,
}

/**
 * Widget component for the drawing tools.
 * 
 * @param param0 
 * @returns 
 */
export default function AppBuilderDrawingToolsWidgetComponent({ drawingToolsSettings, parameterName, sessionId, viewportId }: Props) {
	// generate a unique id for the widget
	const uuid = useId();

	// state for the drawing tools application
	const [drawingToolsActive, setDrawingToolsActive] = useState<boolean>(false);

	// get the parameter API
	const parameter = useParameterStateless<string>(sessionId, parameterName || "");
	const parameterRef = useRef(parameter);

	// update the parameter reference when the parameter changes
	useEffect(() => {
		parameterRef.current = parameter;
	}, [parameter]);

	/**
	 * The callback to be executed once the drawing tools are finished.
	 * 
	 * @param pointsData 
	 */
	const onUpdate = useCallback(async (pointsData: PointsData) => {
		console.log("onUpdate");
		if (!parameterRef.current) return;

		parameterRef.current.actions.setUiValue(JSON.stringify({ points: pointsData }));
		await parameterRef.current.actions.execute(true);
	}, []);

	/**
	 * The callback to be executed once the drawing tools are canceled.
	 */
	const onCancel = useCallback(() => {
		console.log("onCancel");
		setDrawingToolsActive(false);
	}, []);

	/**
	 * The callback to be executed once the drawing tools are finished.
	 * 
	 * @param pointsData 
	 */
	const onFinish = useCallback(async (pointsData: PointsData) => {
		console.log("onFinish");
		onUpdate(pointsData);
		setDrawingToolsActive(false);
	}, []);

	const drawingToolsApi = useDrawingTools(viewportId || VIEWPORT_ID, drawingToolsActive ? drawingToolsSettings : undefined, onUpdate, onFinish, onCancel);

	// define the parameter names for the drawing tools
	const enum PARAMETER_NAMES {
		START_DRAWING = "startDrawing",
		SHOW_POINT_LABELS = "showPointLabels",
		SHOW_DISTANCE_LABELS = "showDistanceLabels",
		GRID_SNAPPING = "gridSnapping",
		GRID_UNIT = "gridUnit",
		ANGULAR_SNAPPING = "angularSnapping",
		ANGULAR_SECTIONS = "angularSections",
	}

	const [parameters, setParameters] = useState<IGenericParameterDefinition[]>([]);

	useEffect(() => {
		let planeRestrictionApi: PlaneRestrictionApi | undefined;
		if (drawingToolsApi)
			planeRestrictionApi = Object.values(drawingToolsApi.restrictions).find(restriction => restriction instanceof PlaneRestrictionApi) as PlaneRestrictionApi | undefined;

		setParameters(
			[
				{
					definition: {
						id: PARAMETER_NAMES.START_DRAWING,
						name: "Start Drawing",
						defval: drawingToolsActive + "",
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
						hidden: drawingToolsActive === false
					}
				},
				{
					definition: {
						id: PARAMETER_NAMES.SHOW_DISTANCE_LABELS,
						name: "Show Distance Labels",
						defval: (drawingToolsApi?.showDistanceLabels ?? false) + "",
						type: ShapeDiverResponseParameterType.BOOL,
						hidden: drawingToolsActive === false
					}
				},
				{
					definition: {
						id: PARAMETER_NAMES.GRID_SNAPPING,
						name: "Grid Snapping",
						defval: (planeRestrictionApi?.gridRestrictionApi.enabled ?? false) + "",
						type: ShapeDiverResponseParameterType.BOOL,
						hidden: drawingToolsActive === false || planeRestrictionApi?.gridRestrictionApi.enabledEditable === false
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
						hidden: drawingToolsActive === false || planeRestrictionApi?.gridRestrictionApi.gridUnitEditable === false
					}
				},
				{
					definition: {
						id: PARAMETER_NAMES.ANGULAR_SNAPPING,
						name: "Angular Snapping",
						defval: (planeRestrictionApi?.angularRestrictionApi.enabled ?? false) + "",
						type: ShapeDiverResponseParameterType.BOOL,
						hidden: drawingToolsActive === false || planeRestrictionApi?.angularRestrictionApi.enabledEditable === false
					}
				},
				{
					definition: {
						id: PARAMETER_NAMES.ANGULAR_SECTIONS,
						name: "Angular Sections",
						defval: Math.PI / (planeRestrictionApi?.angularRestrictionApi.angleStep ?? Math.PI / 8) + "",
						min: 2,
						max: 24,
						type: ShapeDiverResponseParameterType.INT,
						hidden: drawingToolsActive === false || planeRestrictionApi?.angularRestrictionApi.angleStepEditable === false
					}
				}
			]
		);
	}, [drawingToolsApi, drawingToolsActive]);


	// define the custom drawing tools parameters and a handler for changes
	const customSessionId = "mysession";
	useDefineGenericParameters(customSessionId, false /* acceptRejectMode */,
		parameters,
		async (values) => {
			if (PARAMETER_NAMES.START_DRAWING in values)
				setDrawingToolsActive("" + values[PARAMETER_NAMES.START_DRAWING] === "true");

			if (drawingToolsApi !== undefined) {
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
	const parameterProps = useSessionPropsParameter(customSessionId);

	if (parameterName !== undefined)
		return <>
			<div style={{ display: "flex", justifyContent: "flex-end" }}>
				<Image
					radius="md"
					width={35}
					height={35}
					src="https://viewer.shapediver.com/v3/graphics/undo.svg"
					onClick={() => {
						if(drawingToolsApi === undefined) return;
						drawingToolsApi.undo();
					}}
				/>
				<Image
					radius="md"
					width={35}
					height={35}
					src="https://viewer.shapediver.com/v3/graphics/redo.svg"
					onClick={() => {
						if(drawingToolsApi === undefined) return;
						drawingToolsApi.redo();
					}}
				/>
			</div>
			<ParametersAndExportsAccordionComponent key={uuid}
				parameters={parameterProps}
				defaultGroupName="Drawing Tools"
			/>
		</>;
	else
		return <></>;
}
