import { create } from "zustand";
import { IDrawingToolsApi } from "@shapediver/viewer.features.drawing-tools";

interface IDrawingToolsApiState {
    drawingToolsApi: IDrawingToolsApi | undefined;
    setDrawingToolsApi: (drawingToolsApi: IDrawingToolsApi | undefined) => void;
}

/**
 * State store for the drawing tools API.
 */
export const useDrawingToolsApiStore = create<IDrawingToolsApiState>((set) => ({
	drawingToolsApi: undefined,
	setDrawingToolsApi: (api) => set({ drawingToolsApi: api }),
}));
