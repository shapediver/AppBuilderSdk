import { IExportApi } from "@shapediver/viewer";
import { IParameterApi } from "@shapediver/viewer/src/interfaces/session/IParameterApi";
import { StateCreator, StoreMutatorIdentifier } from "zustand/esm";

export type SessionCreateDto = {
	// The ticket for direct embedding of the model to create a session for. This identifies the model on the Geometry Backend.
	ticket: string,
	// The modelViewUrl of the ShapeDiver Geometry Backend hosting the model.
	modelViewUrl: string,
	// The JWT to use for authorizing the API calls to the Geometry Backend.
	jwtToken?: string,
	// The unique identifier to use for the session.
	id: string,
	// Option to wait for the outputs to be loaded, or return immediately after creation of the session. (default: true)
	waitForOutputs?: boolean,
	// Option to load the outputs, or not load them until the first call of customize. (default: true)
	loadOutputs?: boolean,
	// Option to exclude some viewports from the start.
	excludeViewports?: string[],
	// The initial set of parameter values to use. Map from parameter id to parameter value. The default value will be used for any parameter not specified.
	initialParameterValues?: { [key: string]: string }
}

export type SetterFn<T> = (state: T) => T | Partial<T>;

export type IParameters = { [sessionId: string]: { [parameterId: string]: IParameterApi<any> } };

export type IExports = { [sessionId: string]: { [exportId: string]: IExportApi } };

export type IMiddlewareMutate<S> = <
	T extends S,
	Mps extends [StoreMutatorIdentifier, unknown][] = [],
	Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
	stateCreator: StateCreator<T, Mps, Mcs>
) => StateCreator<T, Mps, Mcs>

export type IMiddlewareMutateImpl<S> = <T extends S>(
	stateCreator: StateCreator<T, [], []>
) => StateCreator<T, [], []>
