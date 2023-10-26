import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { PropsExport } from "types/components/shapediver/propsExport";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { IShapeDiverParamOrExportDefinition } from "types/shapediver/common";

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
	sortedParamsAndExports = sortedParamsAndExports.concat((parameters || []).map(p => {
		const definition = parameterStores[p.sessionId][p.parameterId].getState().definition;

		return { parameter: p, definition };
	}));

	sortedParamsAndExports = sortedParamsAndExports.concat((exports || []).map(e => {
		const definition = exportStores[e.sessionId][e.exportId].getState().definition;

		return { export: e, definition };
	}));

	// sort the parameters
	sortedParamsAndExports.sort((a, b) => (a.definition.order || Infinity) - (b.definition.order || Infinity));

	return sortedParamsAndExports;
}
