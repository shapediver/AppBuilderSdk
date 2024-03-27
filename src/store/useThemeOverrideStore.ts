import { MantineThemeOverride } from "@mantine/core";
import { create } from "zustand";

interface IThemeOverrideStore {
    themeOverride: MantineThemeOverride;
    setThemeOverride: (theme: MantineThemeOverride | undefined) => void;
}

/**
 * Store for theme overrides.
 */
export const useThemeOverrideStore = create<IThemeOverrideStore>((set) => ({
	themeOverride: {},
	setThemeOverride: (theme) => {
		if (!theme) return;
		set((state) => ({
			...state,
			themeOverride: theme,
		}));
	}
}));
