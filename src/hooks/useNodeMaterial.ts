import { IGeometryData, IMaterialAbstractData, IMaterialStandardDataProperties, ITreeNode, MaterialStandardData } from "@shapediver/viewer";
import { useEffect } from "react";


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
 * Hook allowing to update the material of a node.
 * @param node 
 * @param materialProperties 
 */
export function useNodeMaterial(node: ITreeNode | undefined, materialProperties: IMaterialStandardDataProperties) {
	
	useEffect(() => {
		console.debug("Executing useNodeMaterial", node, materialProperties);
		if (!node)
			return;

		// get all geometry and materials below the node
		const geometryData = getGeometryData(node);
		const materials = getMaterials(geometryData);
	
		if (materials.length > 0) {
			// update existing materials
			materials.forEach((m) => {
				for ( const p in materialProperties)
					(<any>m)[p as keyof MaterialStandardData] =
					materialProperties[p as keyof IMaterialStandardDataProperties];
				m.updateVersion();
			});
		}
		else
		{
			// no material found: define new material
			const material = new MaterialStandardData(materialProperties);
			geometryData.forEach(data => data.material = material);
		}

		node.updateVersion();
		
	}, [node, materialProperties]);
	
}
