import { ISdReactParameterActions, ISdReactParameterDefinition, ISdReactParameterState } from "types/shapediver/parameter";
import { PropsParameterOrExport } from "./propsCommon";

/**
 * Props of a parameter.
 */
export interface PropsParameters<T> extends PropsParameterOrExport {
	
	/**
	 * Definition of the parameter.
	 */
	readonly definition: ISdReactParameterDefinition;

	/**
	 * State of the parameter.
	 */
	state: ISdReactParameterState<T>;

	/**
     * Actions which can be taken on the parameter.
     */
    actions: ISdReactParameterActions<T>;

}

