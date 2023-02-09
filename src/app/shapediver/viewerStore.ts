import { ISessionApi, IViewportApi } from '@shapediver/viewer';
import { create } from 'zustand'

export interface SessionState {
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

export const useShapeDiverViewerStore = create<SessionState>((set) => ({
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