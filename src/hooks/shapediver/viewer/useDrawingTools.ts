import { useEffect } from "react";
import { Callbacks, CustomizationProperties, createDrawingTools } from "@shapediver/viewer.features.drawing-tools";
import { useShapeDiverStoreViewer } from "store/useShapeDiverStoreViewer";
import { useDrawingToolsApiStore } from "store/useDrawingToolsApiStore";

/**
 * Hook allowing to create the drawing tools.
 * 
 * @param viewportId 
 */
export function useDrawingTools(viewportId: string, customizationProperties?: CustomizationProperties, callbacks?: Callbacks): void {

	// get the viewport API
	const viewportApi = useShapeDiverStoreViewer(state => { return state.viewports[viewportId]; });

	// create a state for the drawing tools API
	const setDrawingToolsApi = useDrawingToolsApiStore((state) => state.setDrawingToolsApi);

	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
		const drawingToolsApi = useDrawingToolsApiStore.getState().drawingToolsApi;
		
		// close the drawing tools if they are open
		if (drawingToolsApi) {
			drawingToolsApi.close();
			setDrawingToolsApi(undefined);
		}

		if(viewportApi && customizationProperties && callbacks) {
			// whenever this output node changes, we want to create the drawing tools
			setDrawingToolsApi(createDrawingTools(viewportApi, callbacks, customizationProperties)); 
		}

		return () => {
			// clean up the drawing tools
			const drawingToolsApi = useDrawingToolsApiStore.getState().drawingToolsApi;
			if (drawingToolsApi) {
				drawingToolsApi.close();
				setDrawingToolsApi(undefined);
			}
		};

	}, [viewportApi, customizationProperties]);
}

