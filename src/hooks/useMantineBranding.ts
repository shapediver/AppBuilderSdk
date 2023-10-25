import { useMantineTheme } from "@mantine/core";
import { useColorScheme } from "@mantine/hooks";

export function useMantineBranding() {
	const scheme = useColorScheme();
	const theme = useMantineTheme();

	return {
		branding: {
			backgroundColor: scheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
			logo: scheme === "dark" ? undefined : "https://viewer.shapediver.com/v3/graphics/logo_animated_breath_inverted.svg"
		}
	};
}
