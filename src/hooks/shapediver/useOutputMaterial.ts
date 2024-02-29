import { 
	GeometryData, 
	IGeometryData, 
	IMaterialAbstractData,
	IMaterialAbstractDataProperties, 
	MaterialEngine,
	IOutputApi, 
	ITreeNode
} from "@shapediver/viewer";
import { useCallback, useEffect, useRef } from "react";
import { useOutputNode } from "./useOutputNode";

/**
 * We traverse the node and all its children, and collect all geometry data.
 * Within the geometry data, the material property can then be updated.
 * 
 * @param node 
 * @returns 
 */
const getGeometryData = (
	node: ITreeNode
): IGeometryData[] => {
	const geometryData: IGeometryData[] = [];
	node.traverseData(data => {
		if (data instanceof GeometryData) {
			geometryData.push(data);
		}
	});
	
	return geometryData;
};

/**
 * We keep track of the original materials, so that we can restore them if the node to
 * which the material is applied changes.
 * This object is keyed by ITreeNode.id and IGeometryData.id
 */
const originalMaterials: { [key: string]: { [key: string]: IMaterialAbstractData | null } } = {};

/**
 * Hook allowing to update the material of an output.
 * 
 * Makes use of {@link useOutputNode}.
 * 
 * @param sessionId 
 * @param outputIdOrName 
 * @param materialProperties 
 */
export function useOutputMaterial(sessionId: string, outputIdOrName: string, materialProperties: IMaterialAbstractDataProperties) : {
	/**
	 * API of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
	 */
	outputApi: IOutputApi | undefined,
	/**
	 * Scene tree node of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html#node
	 */
	outputNode: ITreeNode | undefined
} {
	const materialRef = useRef<IMaterialAbstractData | null>(null);
	
	// callback which will be executed on update of the output node
	const callback = useCallback( (newNode?: ITreeNode, oldNode?: ITreeNode) => {
	
		// restore original materials if there is an old node (a node to be replaced)
		// TODO test this again once https://shapediver.atlassian.net/browse/SS-7366 is fixed
		if (oldNode && originalMaterials[oldNode.id]) {
			const geometryData = getGeometryData(oldNode);
		
			geometryData.forEach(data => {
				const originalMaterial = originalMaterials[oldNode.id][data.id];
				if (originalMaterial) {
					data.material = originalMaterial;
					data.updateVersion();
				}
			});

			delete originalMaterials[oldNode.id];
		
			oldNode.updateVersion();
		}

		// create and set the new material if there is a new node
		if (newNode) {
			const geometryData = getGeometryData(newNode);

			// backup original materials
			if (!originalMaterials[newNode.id]) {
				originalMaterials[newNode.id] = {};
				geometryData.forEach(data => {
					originalMaterials[newNode.id][data.id] = data.material;
				});
			}

			geometryData.forEach(data => {
				data.material = materialRef.current;
				data.updateVersion();
			});

			newNode.updateVersion();
		}
		
	}, []);

	// define the node update callback
	const { outputApi, outputNode } = useOutputNode(sessionId, outputIdOrName, callback);
	
	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
	
		if (materialProperties) {
			materialRef.current = MaterialEngine.instance.createMaterialData(materialProperties);
		}
		else {
			materialRef.current = null;
		}
		callback(outputNode);
		
	}, [materialProperties]);

	return {
		outputApi,
		outputNode
	};
}

