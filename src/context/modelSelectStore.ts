import { create } from "zustand";

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

/**
 * State store for the selected models of the ModelSelect component.
 */
export const useModelSelectStore = create<ModelSelectState>((set) => ({
	selectedModels: [],
	setSelectedModels: (selectedModels) =>
		set((state) => ({
			...state,
			selectedModels
		}))
}));
