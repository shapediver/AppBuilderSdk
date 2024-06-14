import { useEffect, useRef, useState } from "react";
import { Callbacks, CustomizationProperties, IDrawingToolsApi, createDrawingTools } from "@shapediver/viewer.features.drawing-tools";
import { useShapeDiverStoreViewer } from "store/useShapeDiverStoreViewer";

/**
 * Hook allowing to create the drawing tools.
 * 
 * @param viewportId 
 */
export function useDrawingTools(viewportId: string, customizationProperties?: CustomizationProperties, callbacks?: Callbacks) {
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewer(state => { return state.viewports[viewportId]; });

	// create a state for the drawing tools API
	const [drawingToolsApi, setDrawingToolsApi] = useState<IDrawingToolsApi | undefined>(undefined);
	// create a reference for the drawing tools API
	const drawingToolsApiRef = useRef<IDrawingToolsApi | undefined>(undefined);

	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
		if(viewportApi && customizationProperties && callbacks) {
			// whenever this output node changes, we want to create the drawing tools
			drawingToolsApiRef.current = createDrawingTools(viewportApi, callbacks, customizationProperties); 
			setDrawingToolsApi(drawingToolsApiRef.current);
		}

		return () => {
			// clean up the drawing tools
			if (drawingToolsApiRef.current) {
				drawingToolsApiRef.current.close();
				drawingToolsApiRef.current = undefined;
				setDrawingToolsApi(undefined);
			}
		};
	}, [viewportApi, customizationProperties]);

	return drawingToolsApi;
}

