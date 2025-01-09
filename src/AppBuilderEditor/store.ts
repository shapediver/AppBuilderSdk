import { create } from "zustand";
import { defaultSchema } from "./constants";
import { MantineTheme } from "@mantine/core";

type Session = {
    id: string;
    _description?: string;
    _slug?: string;
    ticket?: string;
    modelViewUrl?: string;
    initialParameterValues?: Record<string, string>;
};

type AppBuilderSchema = {
    themeOverrides: Partial<MantineTheme>;
    sessions: Session[];
};

type ThemeState = {
  schema: AppBuilderSchema;
  setSchema: (schema: AppBuilderSchema) => void;
};

export const useEditorStore = create<ThemeState>((set) => ({
	schema: defaultSchema as any,
	setSchema: (schema) => set({ schema }),
})); 