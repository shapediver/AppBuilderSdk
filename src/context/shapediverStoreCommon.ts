import { create } from "zustand";
import {
	IMiddlewareMutate,
	IMiddlewareMutateImpl,
	SetterFn
} from "types/context/shapediverStoreCommon";
import { createShapediverSliceViewer } from "./shapediverSliceViewer";
import { ShapediverSliceUIState } from "../types/context/shapediverSliceUI";
import { ShapediverSliceViewerState } from "../types/context/shapediverSliceViewer";
import { createShapediverSliceUI, shapediverSliceUIMiddleware } from "./shapediverSliceUI";

const isSetterFunction = function <T>(setter: T | Partial<T> | SetterFn<T>): setter is SetterFn<T> {
	return (setter as SetterFn<T>).apply !== undefined;
};

type ShapediverStoreCommonState = ShapediverSliceViewerState & ShapediverSliceUIState;

/**
 * Middleware for the parse input store data.
 */
const middlewareImpl: IMiddlewareMutateImpl<ShapediverStoreCommonState> = (stateCreator) => (set, get, store) => {
	const parsedSet: typeof set = (...args) => {
		let newState = args[0];
		// Support zustand setter options
		if (isSetterFunction(newState)) {
			newState = newState(get()) ;
		}

		const parsedUIState = shapediverSliceUIMiddleware(newState);

		newState = {
			...newState,
			...parsedUIState,
		};

		set(newState, args[1]);
	};

	store.setState = parsedSet;

	return stateCreator(parsedSet, get, store);
};

export const middleware = middlewareImpl as unknown as IMiddlewareMutate<ShapediverStoreCommonState>;

/**
 * State store for all created viewports and sessions.
 */
export const useShapediverStoreCommon = create<ShapediverStoreCommonState>(middleware(
	(...context) => ({
		...createShapediverSliceViewer(...context),
		...createShapediverSliceUI(...context),
	})));
