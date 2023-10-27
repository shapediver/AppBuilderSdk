import { PropsParameterOrExport } from "./propsCommon";

/**
 * Props of a parameter.
 */
export interface PropsParameter extends PropsParameterOrExport {
	
	/**
     * Id of the parameter.
     */
    readonly parameterId: string;

    /**
     * Disable the parameter component if it's in dirty state.
     */
    readonly disableIfDirty?: boolean;

    /** 
     * If true, the component can assume that changes are not executed immediately.
     */
	readonly acceptRejectMode: boolean,
}

