import { GeometryData, IGeometryData, IMaterialAbstractData, IMaterialGemDataProperties, IMaterialSpecularGlossinessDataProperties, IMaterialStandardDataProperties, IMaterialUnlitDataProperties, IOutputApi, ITreeNode, MaterialGemData, MaterialSpecularGlossinessData, MaterialStandardData, MaterialUnlitData } from "@shapediver/viewer";
import { useCallback, useEffect, useRef, useState } from "react";
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
const originalGeometryAndMaterialAssignment: { [key: string]: { geometry: IGeometryData, material: IMaterialAbstractData | null }} = {};

/**
 * Hook allowing to update the material of an output.
 * 
 * Makes use of {@link useOutputNode}.
 * 
 * @param sessionId 
 * @param outputIdOrName 
 * @param materialProperties 
 */
export function useOutputMaterial(sessionId: string, outputIdOrName: string, materialProperties: IMaterialStandardDataProperties | IMaterialSpecularGlossinessDataProperties | IMaterialUnlitDataProperties | IMaterialGemDataProperties, materialType: MaterialType = MaterialType.Standard ) : {
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

	const materialPropertiesRef = useRef(materialProperties);
	
	// callback which will be executed on output update, and once the node is available
	const callback = useCallback( (node?: ITreeNode) => {
		const materialProps = materialPropertiesRef.current;
		if (!node)
			return;

		// get all geometry and materials below the node
		const geometryData = getGeometryData(node);

		let newMaterial: MaterialStandardData | MaterialSpecularGlossinessData | MaterialUnlitData | MaterialGemData;
		switch (materialType) {
		case MaterialType.SpecularGlossiness:
			newMaterial = new MaterialSpecularGlossinessData(materialProps);
			break;
		case MaterialType.Unlit:
			newMaterial = new MaterialUnlitData(materialProps);
			break;
		case MaterialType.Gem:
			newMaterial = new MaterialGemData(materialProps);
			break;
		default:
			newMaterial = new MaterialStandardData(materialProps);
		}

		// update all geometry materials
		geometryData.forEach(data => {
			originalGeometryAndMaterialAssignment[data.id] = { geometry: data, material: data.material };
			data.material = newMaterial;
			data.updateVersion();
		});

		node.updateVersion();
	}, []);

	// define the node update callback
	const { outputApi, outputNode } = useOutputNode(sessionId, outputIdOrName, callback);

	// apply the callback once the node is available, or if the material definition changes
	const [ initialUpdateApplied, setInitialUpdateApplied ] = useState(false);

	useEffect(() => {
		// do not apply the callback if the material definition has not changed, and the initial update has already been applied
		if ( materialPropertiesRef.current === materialProperties && initialUpdateApplied )
			return;
	
		// the material definition has changed, or the initial update has not been applied yet --> apply the callback
		materialPropertiesRef.current = materialProperties;
		callback(outputNode);

		// remember that the initial update has been applied
		if (outputNode && !initialUpdateApplied)
			setInitialUpdateApplied(true);

		return () => {
			if(!outputNode) return;

			// get all geometry below the node
			const geometryData = getGeometryData(outputNode);

			// restore the original materials
			geometryData.forEach(data => {
				const originalAssignment = originalGeometryAndMaterialAssignment[data.id];
				if (originalAssignment) {
					data.material = originalAssignment.material;
					data.updateVersion();
				}

				// delete the entry
				delete originalGeometryAndMaterialAssignment[data.id];
			});

			// update the node
			outputNode.updateVersion();
		};
	}, [outputNode, materialProperties]);

	return {
		outputApi,
		outputNode
	};
}

