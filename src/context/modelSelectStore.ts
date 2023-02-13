import { create } from 'zustand'

interface ModelSelectState {
    selectedModels: {
        ticket: string,
        modelViewUrl: string
    }[];
    setSelectedModels: (selectedModels: {
        ticket: string,
        modelViewUrl: string
    }[]) => void;
}

export const useModelSelectStore = create<ModelSelectState>((set) => ({
    selectedModels: [],
    setSelectedModels: (selectedModels) =>
        set((state) => ({
            ...state,
            selectedModels
        }))
}));