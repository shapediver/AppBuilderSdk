import { IGeometryData, IMaterialAbstractData, IMaterialStandardDataProperties, IOutputApi, ITreeNode, MaterialStandardData } from "@shapediver/viewer";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOutputNode } from "./useOutputNode";


const isGeometryData = (data: any): data is IGeometryData =>
	"mode" in data && "primitive" in data && "material" in data;

const getGeometryData = (
	node: ITreeNode
): IGeometryData[] => {
	const geometryData: IGeometryData[] = [];
	node.traverseData(data => {
		if (isGeometryData(data)) {
			geometryData.push(data);
		}
	});
	
	return geometryData;
};

const getMaterials = (
	geometryData: IGeometryData[]
): IMaterialAbstractData[] => {
	const materials: { [id: string]: IMaterialAbstractData } = {};
	geometryData.forEach(data => {
		if (data.material && !(data.material.id in materials))
			materials[data.material.id] = data.material;
	});

	return Object.values(materials);
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
export function useOutputMaterial(sessionId: string, outputIdOrName: string, materialProperties: IMaterialStandardDataProperties) : {
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
		const materials = getMaterials(geometryData);
	
		if (materials.length > 0) {
			// update existing materials
			materials.forEach((m) => {
				for ( const p in materialProps)
					(<any>m)[p as keyof MaterialStandardData] =
					materialProps[p as keyof IMaterialStandardDataProperties];
				m.updateVersion();
			});
		}
		else
		{
			// no material found: define new material
			const material = new MaterialStandardData(materialProps);
			geometryData.forEach(data => data.material = material);
		}

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

		// TODO ideally here we should return a cleanup function, which restores the original material
	}, [outputNode, materialProperties]);

	return {
		outputApi,
		outputNode
	};
}

