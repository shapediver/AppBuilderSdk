import { useEffect, useRef, useState } from "react";
import { Settings, IDrawingToolsApi, createDrawingTools, PointsData, IDrawingToolsEvent } from "@shapediver/viewer.features.drawing-tools";
import { useShapeDiverStoreViewer } from "store/useShapeDiverStoreViewer";
import { EVENTTYPE, addListener, removeListener } from "@shapediver/viewer";
import { notifications } from "@mantine/notifications";

/**
 * Hook allowing to create the drawing tools.
 * 
 * @param viewportId 
 */
export function useDrawingTools(viewportId: string, settings?: Settings, onUpdate?: (pointsData: PointsData) => void, onCancel?: () => void): IDrawingToolsApi | undefined {
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewer(state => { return state.viewports[viewportId]; });

	// create a state for the drawing tools API
	const [drawingToolsApi, setDrawingToolsApi] = useState<IDrawingToolsApi | undefined>(undefined);
	// create a reference for the drawing tools API
	const drawingToolsApiRef = useRef<IDrawingToolsApi | undefined>(undefined);
	// create references for the event listeners
	const minimumPointsListenerTokenRef = useRef<string | undefined>(undefined);
	const maximumPointsListenerTokenRef = useRef<string | undefined>(undefined);

	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
		if(viewportApi && settings && onUpdate && onCancel) {
			minimumPointsListenerTokenRef.current = addListener(EVENTTYPE.DRAWING_TOOLS.MINIMUM_POINTS, (e) => {
				notifications.show({
					title: "The minimum number of points is not reached.",
					message: (e as IDrawingToolsEvent).message,
				});
			});

			maximumPointsListenerTokenRef.current = addListener(EVENTTYPE.DRAWING_TOOLS.MAXIMUM_POINTS, (e) => {
				notifications.show({
					title: "The maximum number of points is reached.",
					message: (e as IDrawingToolsEvent).message,
				});
			});

			// whenever this output node changes, we want to create the drawing tools
			drawingToolsApiRef.current = createDrawingTools(viewportApi, { onUpdate, onCancel }, settings); 
			setDrawingToolsApi(drawingToolsApiRef.current);
		}

		return () => {
			// clean up the drawing tools
			if (drawingToolsApiRef.current) {
				drawingToolsApiRef.current.close();
				drawingToolsApiRef.current = undefined;
				setDrawingToolsApi(undefined);
			}

			// remove the event listeners
			if(minimumPointsListenerTokenRef.current) {
				removeListener(minimumPointsListenerTokenRef.current);
				minimumPointsListenerTokenRef.current = undefined;
			}

			if(maximumPointsListenerTokenRef.current) {
				removeListener(maximumPointsListenerTokenRef.current);
				maximumPointsListenerTokenRef.current = undefined;
			}
		};
	}, [viewportApi, settings, onUpdate, onCancel]);

	return drawingToolsApi;
}

