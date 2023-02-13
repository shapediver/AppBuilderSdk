import { ColorScheme } from '@mantine/core';
import { create } from 'zustand'

interface uiState {
    colorScheme: ColorScheme;
    setColorScheme: (colorScheme: ColorScheme) => void;
}

export const useUiStore = create<uiState>((set) => ({
    colorScheme: "dark",
    setColorScheme: (colorScheme) =>
        set((state) => ({
            ...state,
            colorScheme
        }))
}));