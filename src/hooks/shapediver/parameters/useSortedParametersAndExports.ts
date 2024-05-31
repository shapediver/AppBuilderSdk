import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { PropsExport } from "types/components/shapediver/propsExport";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { IShapeDiverParamOrExportDefinition } from "types/shapediver/common";

/**
 * The definition of a parameter or export, and the corresponding parameter or export properties.
 */
interface ParamOrExportDefinition {
	parameter?: PropsParameter,
	export?: PropsExport,
	definition: IShapeDiverParamOrExportDefinition,
}

/**
 * Hook providing a sorted list of definitions of parameters and exports, used
 * by {@link ParametersAndExportsAccordionComponent} for creating parameter and export UI components. 
 * @param parameters 
 * @param exports 
 * @returns 
 */
export function useSortedParametersAndExports(parameters?: PropsParameter[], exports?: PropsExport[]) : ParamOrExportDefinition[] {
	
	const {parameterStores, exportStores} = useShapeDiverStoreParameters();

	// collect definitions of parameters and exports for sorting and grouping
	let sortedParamsAndExports : ParamOrExportDefinition[] = [];
	sortedParamsAndExports = sortedParamsAndExports.concat((parameters ?? []).flatMap(p => {
		const stores = Object.values(parameterStores[p.sessionId]);
		for (const store of stores) {
			const definition = store.getState().definition;
			if (definition.id === p.parameterId || definition.name === p.parameterId || definition.displayname === p.parameterId)
				return { parameter: p, definition: {...definition, ...p.overrides} };
		}

		return [];
	}));

	sortedParamsAndExports = sortedParamsAndExports.concat((exports ?? []).flatMap(e => {
		const stores = Object.values(exportStores[e.sessionId]);
		for (const store of stores) {
			const definition = store.getState().definition;
			if (definition.id === e.exportId || definition.name === e.exportId  || definition.displayname === e.exportId )
				return { export: e, definition: {...definition, ...e.overrides} };
		}
		
		return [];
	}));

	// sort the parameters
	sortedParamsAndExports.sort((a, b) => 
		(typeof a.definition.order === "number" ? a.definition.order : Infinity) 
		- (typeof b.definition.order === "number" ? b.definition.order : Infinity)
	);

	return sortedParamsAndExports;
}
