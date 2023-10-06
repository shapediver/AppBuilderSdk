import { ISdReactExportActions, ISdReactExportDefinition } from "types/shapediver/export";
import { PropsParameterOrExport } from "./propsCommon";

/** Props of an export. */
export interface PropsExport extends PropsParameterOrExport {
	
	/** The static definition of the export. */
    readonly definition: ISdReactExportDefinition;
	
	/**
     * Actions which can be taken on the export.
     */
	actions: ISdReactExportActions;
}

