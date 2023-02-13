import { ColorScheme } from '@mantine/core';
import { create } from 'zustand'

interface globalUiState {
    colorScheme: ColorScheme;
    setColorScheme: (colorScheme: ColorScheme) => void;
}

export const useGlobalUiStore = create<globalUiState>((set) => ({
    colorScheme: "dark",
    setColorScheme: (colorScheme) =>
        set((state) => ({
            ...state,
            colorScheme
        }))
}));