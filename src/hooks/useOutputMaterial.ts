import { 
	GeometryData, 
	IGeometryData, 
	IMaterialAbstractData, 
	IMaterialGemDataProperties, 
	IMaterialSpecularGlossinessDataProperties, 
	IMaterialStandardDataProperties, 
	IMaterialUnlitDataProperties, 
	IOutputApi, 
	ITreeNode,
	MaterialGemData, 
	MaterialSpecularGlossinessData, 
	MaterialStandardData, 
	MaterialUnlitData 
} from "@shapediver/viewer";
import { useCallback, useEffect, useRef } from "react";
import { useOutputNode } from "./useOutputNode";

export enum MaterialType {
	Standard = "Standard",
	SpecularGlossiness = "SpecularGlossiness",
	Unlit = "Unlit",
	Gem = "Gem"
}

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
 * We keep track of the original materials, so that we can restore them in the end.
 */
const originalMaterials: { [key: string]: { [key: string]: IMaterialAbstractData | null } } = {};

/**
 * TODO remove this once IMaterialAbstractDataProperties is exported from the viewer in a future release.
 */
type IMaterialAbstractDataProperties = IMaterialStandardDataProperties | IMaterialSpecularGlossinessDataProperties | IMaterialUnlitDataProperties | IMaterialGemDataProperties;

const createMaterial = (materialProperties: IMaterialAbstractDataProperties, materialType: MaterialType) : IMaterialAbstractData => {
	switch (materialType) {
	case MaterialType.SpecularGlossiness:
		return new MaterialSpecularGlossinessData(materialProperties);
	case MaterialType.Unlit:
		return new MaterialUnlitData(materialProperties);
	case MaterialType.Gem:
		return new MaterialGemData(materialProperties);
	default:
		return new MaterialStandardData(materialProperties);
	}
};

/**
 * Hook allowing to update the material of an output.
 * 
 * Makes use of {@link useOutputNode}.
 * 
 * @param sessionId 
 * @param outputIdOrName 
 * @param materialProperties 
 */
export function useOutputMaterial(sessionId: string, outputIdOrName: string, materialProperties: IMaterialAbstractDataProperties, materialType: MaterialType = MaterialType.Standard ) : {
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
	const materialPropertiesRef = useRef<IMaterialAbstractDataProperties | undefined>(undefined);
	const materialTypeRef = useRef<MaterialType | undefined>(undefined);
	
	// callback which will be executed on update of the output node
	const callback = useCallback( (newNode?: ITreeNode, oldNode?: ITreeNode) => {
	
		// restore original materials
		// TODO there seems to be a bug, oldNode.id should not be a new id
		console.debug("newNode.id", newNode?.id, "oldNode?.id", oldNode?.id, originalMaterials);
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
			// TODO remove this
			console.debug("restore oldNode", Object.keys(originalMaterials));

			oldNode.updateVersion();
		}

		// create and set the new material
		if (newNode && materialPropertiesRef.current && materialTypeRef.current) {
			const geometryData = getGeometryData(newNode);

			// backup original materials
			if (!originalMaterials[newNode.id]) {
				originalMaterials[newNode.id] = {};
				geometryData.forEach(data => {
					originalMaterials[newNode.id][data.id] = data.material;
				});
			}

			// TODO do we need to newly create the material on every update?
			const newMaterial = createMaterial(materialPropertiesRef.current, materialTypeRef.current);
			geometryData.forEach(data => {
				data.material = newMaterial;
				data.updateVersion();
			});

			// TODO remove this
			console.debug("backup newNode", Object.keys(originalMaterials), originalMaterials[newNode.id]);

			newNode.updateVersion();
		}
		
	}, []);

	// define the node update callback
	const { outputApi, outputNode } = useOutputNode(sessionId, outputIdOrName, callback);
	
	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
		
		// TODO remove this
		console.debug("Applying material change", outputIdOrName, materialProperties);
	
		materialPropertiesRef.current = materialProperties;
		materialTypeRef.current = materialType;
		callback(outputNode);
		
	}, [materialProperties, materialType]);

	return {
		outputApi,
		outputNode
	};
}

