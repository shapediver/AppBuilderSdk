import { create } from "zustand";

interface ModelSelectState {
    selectedModels: {
        id: string,
        ticket: string,
        modelViewUrl: string
    }[];
    setSelectedModels: (selectedModels: {
				id: string,
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
