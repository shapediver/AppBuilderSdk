import {ShapeDiverResponseParameter} from "@shapediver/api.geometry-api-dto-v2"

/**
 * The static definition of a parameter. 
 * We reuse the definition of the parameter on the Geometry Backend here. 
 */
export type SdReactParameterDefinition = ShapeDiverResponseParameter;

/**
 * The dynamic properties of a parameter.
 */
export interface SdReactParameterState<T> {

    /**
     * The current value according to the user interface. 
     * This value can be assumed to be valid according to the definition of the parameter. 
     */
    readonly uiValue: T | string;

    /**
     * The value corresponding to the latest successful execution, in case the parameter 
     * makes use of background executions like customization calls to ShapeDiver. 
     * This corresponds to the sessionValue property of parameters defined by the ShapeDiver viewer. 
     */
    readonly execValue: T | string;

    /**
     * Whether the parameter shall appear locked in the user interface. 
     * This might be the case during background executions. 
     */
    readonly locked: boolean;
}

/**
 * A parameter including its definition (static properties) and its state.
 */
export interface SdReactParameter<T> {

    /** The static definition of a parameter. */
    readonly definition: SdReactParameterDefinition;

    /** 
     * The dynamic properties (aka the "state") of a parameter. 
     * Reactive components can react to this state, but not update it.
    */
    readonly state: SdReactParameterState<T>;

    /**
     * Set the ui value of the parameter. 
     * The provided value must be valid, otherwise this function will return false.
     * 
     * @param value the value to use for setting state.uiValue
     */
    setUiValue(value: T | string): boolean;

    /**
     * Run background executions, and update state.execValue on success. 
     */
    execute(): boolean;

    /**
     * Evaluates if a given value is valid for this parameter.
     * 
     * @param value the value to evaluate
     * @param throwError if true, an error is thrown if validation does not pass (default: false)
     */
    isValid(value: any, throwError?: boolean): boolean;

    /**
     * Resets the value to the default value.
     */
    resetToDefaultValue(): void;

    /**
     * Resets the value to sessionValue.
     */
    resetToSessionValue(): void;
    
    /**
     * Returns the current value as a string
     */
    stringify(): string;


}

