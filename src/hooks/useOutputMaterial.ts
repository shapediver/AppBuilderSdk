import { IGeometryData, IMaterialStandardDataProperties, IOutputApi, ITreeNode, MaterialStandardData } from "@shapediver/viewer";
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

		// update all geometry materials
		geometryData.forEach(data => {
			if (data.material && data instanceof MaterialStandardData) {
				// update existing material
				for ( const p in materialProps)
					(<any>data.material)[p as keyof MaterialStandardData] =
					materialProps[p as keyof IMaterialStandardDataProperties];
				data.material.updateVersion();
			} else {
				// no material found: define new material
				const material = new MaterialStandardData(materialProps);
				data.material = material;
			}
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

		// TODO ideally here we should return a cleanup function, which restores the original material
	}, [outputNode, materialProperties]);

	return {
		outputApi,
		outputNode
	};
}

