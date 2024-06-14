import React, { useCallback, useEffect, useRef, useState } from "react";
import { IAppBuilderWidgetPropsDrawingTools } from "types/shapediver/appbuilder";
import { ShapeDiverResponseParameterType } from "@shapediver/sdk.geometry-api-sdk-v2";
import { PointsData } from "@shapediver/viewer.features.drawing-tools";
import { useDefineGenericParameters } from "hooks/shapediver/parameters/useDefineGenericParameters";
import { useParameterStateless } from "hooks/shapediver/parameters/useParameterStateless";
import { useSessionPropsParameter } from "hooks/shapediver/parameters/useSessionPropsParameter";
import { useDrawingTools } from "hooks/shapediver/viewer/useDrawingTools";
import { IGenericParameterDefinition } from "types/store/shapediverStoreParameters";
import ParametersAndExportsAccordionComponent from "../ui/ParametersAndExportsAccordionComponent";
import { useId } from "@mantine/hooks";

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
		if(drawingToolsSettings?.general?.closeOnUpdate === true) setDrawingToolsActive(false);
	}, []);

	/**
	 * The callback to be executed once the drawing tools are canceled.
	 */
	const onCancel = useCallback(() => {
		console.log("onCancel");
		setDrawingToolsActive(false);
	}, []);

	const drawingToolsApi = useDrawingTools(viewportId || VIEWPORT_ID, drawingToolsActive ? drawingToolsSettings : undefined, onUpdate, onCancel);

	// define the parameter names for the drawing tools
	const enum PARAMETER_NAMES {
		START_DRAWING = "startDrawing",
		SHOW_POINT_LABELS = "showPointLabels",
		SHOW_DISTANCE_LABELS = "showDistanceLabels"
	}

	const [parameters, setParameters] = useState<IGenericParameterDefinition[]>([]);

	useEffect(() => {
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
				if (PARAMETER_NAMES.SHOW_POINT_LABELS in values)
					drawingToolsApi.showPointLabels = "" + values[PARAMETER_NAMES.SHOW_POINT_LABELS] === "true";

				if (PARAMETER_NAMES.SHOW_DISTANCE_LABELS in values)
					drawingToolsApi.showDistanceLabels = "" + values[PARAMETER_NAMES.SHOW_DISTANCE_LABELS] === "true";
			}

			return values;
		}
	);
	const parameterProps = useSessionPropsParameter(customSessionId);

	if (parameterName !== undefined)
		return <ParametersAndExportsAccordionComponent key={uuid}
			parameters={parameterProps}
			defaultGroupName="Drawing Tools"
		/>;
	else
		return <></>;
}
