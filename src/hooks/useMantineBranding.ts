import { useMantineTheme } from "@mantine/core";

export function useMantineBranding() {
	const theme = useMantineTheme();

	return {
		branding: {
			backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
			logo: theme.colorScheme === "dark" ? undefined : "https://viewer.shapediver.com/v3/graphics/logo_animated_breath_inverted.svg"
		}
	};
}
