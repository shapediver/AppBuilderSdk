import { create } from "zustand";
import { IUseSessionDto } from "hooks/useSession";

export interface ISelectedModel extends IUseSessionDto  {
	name: string,
    slug: string,
}

interface IModelSelectState {
    selectedModels: ISelectedModel[];
    setSelectedModels: (selectedModels: ISelectedModel[]) => void;
}

/**
 * State store for the selected models of the ModelSelect component.
 */
export const useModelSelectStore = create<IModelSelectState>((set) => ({
	selectedModels: [],
	setSelectedModels: (selectedModels) =>
		set((state) => ({
			...state,
			selectedModels
		}))
}));
