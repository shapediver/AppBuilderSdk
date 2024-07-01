import { IGeometryData, IOutputApi, ISessionApi, ITreeNode, IViewportApi } from "@shapediver/viewer";
import { useCallback, useEffect, useRef } from "react";
import { IDrawingToolsApi, PlaneRestrictionProperties, RESTRICTION_TYPE, createDrawingTools } from "@shapediver/viewer.features.drawing-tools";
import { useShapeDiverStoreViewer } from "store/useShapeDiverStoreViewer";
import { CustomizationPropertiesOptional } from "@shapediver/viewer.features.drawing-tools/dist/business/implementation/DrawingToolsManager";
import { useOutputNode } from "./useOutputNode";

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
	outputApi: IOutputApi | undefined
} {

	/**
	 * Create the callbacks for the drawing tools
	 */
	const onFinish = async (geometryData: IGeometryData) => {
		if(!sessionApiRef.current) return;
		console.log("onFinish"); 
        
		const positionArray = geometryData.primitive.attributes["POSITION"].array;

		// get all points
		const points = [];
		for (let i = 0; i < positionArray.length; i += 3) {
			points.push([positionArray[i], positionArray[i + 1], positionArray[i + 2]]);
		}

		sessionApiRef.current.getParameterByName("points")[0].value = JSON.stringify({ points: points });
		await sessionApiRef.current.customize();
	};
	const onCancel = () => { console.log("onCancel"); };


	// callback which will be executed on update of the output node
	// @ALEX: it seems like sometimes this update is not triggered when the node changed, I probably have to investigate this further
	const callback = useCallback( (newNode?: ITreeNode) => {
		if(!newNode) return;
		if(drawingToolsApiRef.current) drawingToolsApiRef.current.close();
		customizationPropertiesRef.current = outputApiRef.current?.content![0].data as CustomizationPropertiesOptional;

		if(viewportApiRef.current && customizationPropertiesRef.current && outputApiRef.current) {
			// whenever this output node changes, we want to create the drawing tools
			// @ALEX: I currently pass the customization properties here directly, there seems to be a bug in the drawing tools when parsing the incoming JSON from the output
			drawingToolsApiRef.current = createDrawingTools(viewportApiRef.current, {onFinish, onCancel}, { geometry: { mode: "lines", parentNode: "Outline", minPoints: 4, maxPoints: 12, origin: [523, 389, 0], close: true, autoClose: true }, restrictions: [ { type: RESTRICTION_TYPE.PLANE, gridSnapRestriction: { priority: 0, gridUnit: 1 }, gridSize: 100, normal: [0, 0, 1], angularSnapRestriction: { priority: 0, angleStep: 0.39269908169 } } as PlaneRestrictionProperties ] });
		}
	}, []);
	

	/**
	 * Define the references 
	 * @ALEX: is this the right way to do it?
	 */
	const drawingToolsApiRef = useRef<IDrawingToolsApi | null>(null);
	const customizationPropertiesRef = useRef<CustomizationPropertiesOptional | undefined>();

	const { outputApi, outputNode } = useOutputNode(sessionId, outputIdOrName, callback);
	const outputApiRef = useRef<IOutputApi | undefined>();
	outputApiRef.current = outputApi;

	const viewportApi = useShapeDiverStoreViewer(state => {
		return state.viewports[viewportId];
	});
	const viewportApiRef = useRef<IViewportApi | undefined>();
	viewportApiRef.current = viewportApi;

	const sessionApi = useShapeDiverStoreViewer(state => {
		return state.sessions[sessionId];
	});
	const sessionApiRef = useRef<ISessionApi | undefined>();
	sessionApiRef.current = sessionApi;

	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
		customizationPropertiesRef.current = outputApi?.content![0].data as CustomizationPropertiesOptional;
		outputApiRef.current = outputApi;
		callback(outputNode);
	}, []);

	return {
		outputApi
	};
}

