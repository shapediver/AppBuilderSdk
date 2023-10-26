import { create } from "zustand";

interface SelectedModel {
    slug: string,
    ticket: string,
    modelViewUrl: string
}

interface ModelSelectState {
    selectedModels: SelectedModel[];
    setSelectedModels: (selectedModels: SelectedModel[]) => void;
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
