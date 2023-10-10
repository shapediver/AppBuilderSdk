import { PropsParameterOrExport } from "./propsCommon";

/**
 * Props of a parameter.
 */
export interface PropsParameter extends PropsParameterOrExport {
	
	/**
     * Id of the parameter.
     */
    readonly parameterId: string;

}

