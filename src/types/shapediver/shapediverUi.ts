import {ShapeDiverResponseParameter} from "@shapediver/api.geometry-api-dto-v2";
import { SessionCreateDto } from "../store/shapediverStoreViewer";
import { IOutputApi, IParameterApi, ViewportCreationDefinition } from "@shapediver/viewer";

/**
 * The static definition of a parameter.
 * We reuse the definition of the parameter on the Geometry Backend here.
 */
export type ISdReactParameterDefinition = ShapeDiverResponseParameter;

/**
 * The dynamic properties of a parameter.
 */
export interface ISdReactParameterState<T> {

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
export interface ISdReactParameter<T> extends Pick<IParameterApi<T>, "isValid" | "resetToDefaultValue" | "resetToSessionValue" | "stringify">{

    /** The static definition of a parameter. */
    readonly definition: ISdReactParameterDefinition;

    /**
     * The dynamic properties (aka the "state") of a parameter.
     * Reactive components can react to this state, but not update it.
    */
    readonly state: ISdReactParameterState<T>;

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
    execute(): Promise<boolean>;
}

export interface ShapediverUIConfig {
    sessions: {
        [id: string]: {
            data: SessionCreateDto,
        };
    }
    viewports: {
        [id: string]: {
            data?: Pick<ViewportCreationDefinition, "id">,
        };
    }
    parameters?: {
        [id: string]: {
            data?: ISdReactParameter<any>,
        };
    }
    outputs?: {
        [id: string]: {
            data?: Pick<IOutputApi, "id">,
        };
    }
}

