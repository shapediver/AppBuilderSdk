import { IExportApi } from "@shapediver/viewer";
import { IParameterApi } from "@shapediver/viewer/src/interfaces/session/IParameterApi";
import { StateCreator, StoreMutatorIdentifier } from "zustand/esm";
import {
	SessionCreationDefinition
} from "@shapediver/viewer.main.creation-control-center/src/interfaces/ICreationControlCenter";

export interface SessionCreateDto extends SessionCreationDefinition {
	id: string,
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
