import { EVENTTYPE, IGeometryData, IOutputApi, addListener, removeListener } from "@shapediver/viewer";
import { useEffect, useState } from "react";
import { CustomizationProperties, IDrawingToolsApi, createDrawingTools } from "@shapediver/viewer.features.drawing-tools";
import { useShapeDiverStoreViewer } from "store/useShapeDiverStoreViewer";
import { useParameterStateless } from "../parameters/useParameterStateless";
import { useOutputContent } from "./useOutputContent";

/**
 * Hook allowing to create the drawing tools.
 * 
 * Makes use of {@link useOutputNode}.
 * 
 * @param sessionId 
 * @param viewportId 
 * @param outputIdOrName 
 */
export function useOutputDrawingTools(sessionId: string, viewportId: string, outputIdOrName: string) : {
	/**
	 * API of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
	 */
	outputApiCustomizationProperties: IOutputApi | undefined,
	/**
	 * API of the drawing tools
	 */
	drawingToolsApi: IDrawingToolsApi | undefined
} {
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewer(state => { return state.viewports[viewportId]; });
	
	// get the parameter API
	const parameter = useParameterStateless<string>(sessionId, "points");

	// get the output API and output content for the customization properties
	const { outputApi: outputApiCustomizationProperties, outputContent: outputContentCustomizationProperties } = useOutputContent(sessionId, outputIdOrName);

	// create a state for the drawing tools API
	const [drawingToolsApi, setDrawingToolsApi] = useState<IDrawingToolsApi | undefined>();

	// create a state for the drawing tools API
	const [sessionCustomized, setSessionCustomized] = useState<number>(0);

	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
		// add a listener to the session customized event
		// we have to do this because the output content may not be updated, as the geometry is in a different output
		const token = addListener(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, () => {
			setSessionCustomized(sessionCustomized + 1);
		});

		// close the drawing tools if they are open
		if(drawingToolsApi) {
			drawingToolsApi.close();
			setDrawingToolsApi(undefined);
		}

		// if the output API or the output content is not available, return
		if(!outputContentCustomizationProperties) return;

		// get the customization properties from the output content
		const customizationProperties = outputContentCustomizationProperties[0].data as CustomizationProperties;

		/**
		 * The callback to be executed once the drawing tools are finished.
		 * 
		 * @param geometryData 
		 */
		const onFinish = async (geometryData: IGeometryData) => {
			console.log("onFinish"); 
			if(!parameter) return;
			
			const positionArray = geometryData.primitive.attributes["POSITION"].array;
	
			// get all points
			const points = [];
			for (let i = 0; i < positionArray.length; i += 3) {
				points.push([positionArray[i], positionArray[i + 1], positionArray[i + 2]]);
			}
	
			parameter.actions.setUiValue(JSON.stringify({ points: points }));
			await parameter.actions.execute(true);
		};

		/**
		 * The callback to be executed once the drawing tools are canceled.
		 */
		const onCancel = () => { console.log("onCancel"); };

		if(viewportApi && customizationProperties) {
			// whenever this output node changes, we want to create the drawing tools
			setDrawingToolsApi(createDrawingTools(viewportApi, {onFinish, onCancel}, customizationProperties));
		}

		return () => {
			// remove the listener
			removeListener(token);

			// clean up the drawing tools
			if(drawingToolsApi) {
				drawingToolsApi.close();
				setDrawingToolsApi(undefined);
			}
		};

	}, [viewportApi, outputContentCustomizationProperties, sessionCustomized]);

	return {
		outputApiCustomizationProperties,
		drawingToolsApi
	};
}

