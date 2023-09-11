import { ISessionApi, IViewportApi } from "@shapediver/viewer";
import { create } from "zustand";

export interface shapediverViewerState {
    activeViewports: {
        [key: string]: Promise<IViewportApi | void>
    }
    setActiveViewports: (activeViewports: {
        [key: string]: Promise<IViewportApi | void>
    }) => void;
    activeSessions: {
        [key: string]: Promise<ISessionApi | void>
    }
    setActiveSessions: (activeSessions: {
        [key: string]: Promise<ISessionApi | void>
    }) => void;
}

/**
 * State store for all created viewports and sessions.
 */
export const useShapediverViewerStore = create<shapediverViewerState>((set) => ({
	activeViewports: {},
	setActiveViewports: (activeViewports) =>
		set((state) => ({
			...state,
			activeViewports
		})),
	activeSessions: {},
	setActiveSessions: (activeSessions) =>
		set((state) => ({
			...state,
			activeSessions
		}))
}));
