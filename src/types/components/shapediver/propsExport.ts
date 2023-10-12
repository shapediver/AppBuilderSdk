import { PropsParameterOrExport } from "./propsCommon";

/** Props of an export. */
export interface PropsExport extends PropsParameterOrExport {
	
	/**
     * Id of the export.
     */
	readonly exportId: string;
}

