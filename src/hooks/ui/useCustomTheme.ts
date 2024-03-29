import { Accordion, AppShellResponsiveSize, Button, CSSVariablesResolver, ColorInput, DEFAULT_THEME, Group, MantineSize, Paper, Stack, Switch, Tabs, createTheme, mergeThemeOverrides } from "@mantine/core";
import { ViewportIconsThemeProps } from "components/shapediver/viewport/ViewportIcons";
import { ViewportBrandingThemeProps, ViewportComponentThemeProps } from "components/shapediver/viewport/ViewportComponent";
import { ViewportOverlayWrapperThemeProps } from "components/shapediver/viewport/ViewportOverlayWrapper";
import { ParameterSliderComponentThemeProps } from "components/shapediver/parameter/ParameterSliderComponent";
import { ParametersAndExportsAccordionComponentThemeProps } from "components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { IconThemeProps } from "components/ui/Icon";
import { DefaultSessionThemeProps } from "hooks/shapediver/useDefaultSessionDto";
import { AppBuilderGridTemplatePageThemeProps } from "pages/templates/AppBuilderGridTemplatePage";
import { AppBuilderImageThemeProps } from "components/shapediver/appbuilder/AppBuilderImage";
import { useThemeOverrideStore } from "store/useThemeOverrideStore";
import { AppBuilderTemplateSelectorThemeProps } from "pages/templates/AppBuilderTemplateSelector";
import { AppBuilderAppShellTemplatePageThemeProps } from "pages/templates/AppBuilderAppShellTemplatePage";
import { AppShellSize } from "@mantine/core/lib/components/AppShell/AppShell.types";
import { AppBuilderVerticalContainerThemeProps } from "pages/templates/AppBuilderVerticalContainer";
import { AppBuilderHorizontalContainerThemeProps } from "pages/templates/AppBuilderHorizontalContainer";

const getAppShellSize = (size: AppShellResponsiveSize | AppShellSize, breakpoint: MantineSize | "base", defval: string): string => {
	if (typeof size === "object") {
		switch (breakpoint) {
		case "base":
			return ""+(size.base ?? defval);
		case "xs":	
			return ""+(size.xs ?? size.base ?? defval);
		case "sm":
			return ""+(size.sm ?? size.xs ?? size.base ?? defval);
		case "md":
			return ""+(size.md ?? size.sm ?? size.xs ?? size.base ?? defval);
		case "lg":
			return ""+(size.lg ?? size.md ?? size.sm ?? size.xs ?? size.base ?? defval);
		case "xl":
			return ""+(size.xl ?? size.lg ?? size.md ?? size.sm ?? size.xs ?? size.base ?? defval);
		}
	}

	return ""+size;
};


export const useCustomTheme = () => {

	const defaultTheme = createTheme({
		defaultRadius: "md",
		components: {
			/**
             * Default mantine components
             */
			Accordion: Accordion.extend({
				defaultProps: {
					variant: "contained",
				},
				styles: {
					content: { padding: "0" }
				}
			}),
			AccordionPanel: Accordion.Panel.extend({
				defaultProps: {
					pl: "xs",
					pr: "xs",
					pb: "xs",
				}
			}),
			Button: Button.extend({
				defaultProps: {
					variant: "default",
				}
			}),
			ColorInput: ColorInput.extend({
				styles: {
					input: { cursor: "pointer" }
				}
			}),
			Group: Group.extend({
				defaultProps: {
					gap: "xs",
				}
			}),
			Paper: Paper.extend({
				defaultProps: {
					px: "xs",
					py: "xs",
					//shadow: "xs",
					withBorder: true,
				},
			}),
			Stack: Stack.extend({
				defaultProps: {
					gap: "xs",
				}
			}),
			Switch: Switch.extend({
				defaultProps: {
					size: "md",
				},
				styles: {
					track: { cursor: "pointer" }
				}
			}),
			Tabs: Tabs.extend({
			}),
			TabsPanel: Tabs.Panel.extend({
				defaultProps: {
					pt: {
						base: "xs",
						sm: "xs"
					}
				}
			}),
			/** 
             * Below here - custom components implemented by ShapeDiver 
             */
			AppBuilderImage: AppBuilderImageThemeProps({
				// radius: "md",
				// fit: "contain",
			}),
			AppBuilderAppShellTemplatePage: AppBuilderAppShellTemplatePageThemeProps({
				// headerHeight: "4em",
				headerHeight: { base: "4em", md: "6em"},
				// navbarBreakpoint: "md",
				// navbarWidth: { md: 200, lg: 250 }
			}),
			AppBuilderGridTemplatePage: AppBuilderGridTemplatePageThemeProps({
				bgTop: "transparent", 
				bgLeft: "transparent", 
				bgRight: "transparent", 
				bgBottom: "transparent", 
				// showContainerButtons: true,
				// columns: 5,
				// rows: 4,
				// leftColumns: 1,
				// rightColumns: 1,
				// topRows: 1,
				// bottomRows: 1,
			}),
			AppBuilderHorizontalContainer: AppBuilderHorizontalContainerThemeProps({
				// w: "100%",
				// h: "100%",
				// justify: "center",
				// wrap: "nowrap",
				// p: "xs",
			}),
			AppBuilderTemplateSelector: AppBuilderTemplateSelectorThemeProps({
				// template: "appshell"
				// template: "grid" // default
			}),
			AppBuilderVerticalContainer: AppBuilderVerticalContainerThemeProps({
				// p: "md",
			}),
			DefaultSession: DefaultSessionThemeProps({
				// see Props of useDefaultSessionDto
				// example: "AR Cube",
				// slug: "",
				// platformUrl: "",
				// id: "",
				// ticket: "",
				// modelViewUrl: "",
				// initialParameterValues: {},
				acceptRejectMode: true
			}),
			Icon: IconThemeProps({
				// size: 14,
				// stroke: 1,
			}),
			ParametersAndExportsAccordionComponent: ParametersAndExportsAccordionComponentThemeProps({
				//avoidSingleComponentGroups: true,
				//mergeAccordions: false,
				//pbSlider: "md",
			}),
			ParameterSliderComponent: ParameterSliderComponentThemeProps({
				//sliderWidth: "60%",
				//numberWidth: "35%",
			}),
			/** Define viewport branding for dark and light color scheme */
			ViewportBranding: ViewportBrandingThemeProps({
				light: {
					backgroundColor: DEFAULT_THEME.colors.gray[0],
					logo: "https://viewer.shapediver.com/v3/graphics/logo_animated_breath_inverted.svg"
				},
				dark: {
					backgroundColor: DEFAULT_THEME.colors.dark[8],
					logo: undefined
				}
			}),
			ViewportComponent: ViewportComponentThemeProps({
				// sessionSettingsMode: SESSION_SETTINGS_MODE.FIRST,
				// showStatistics: true,
			}),
			ViewportIcons: ViewportIconsThemeProps({
				// color: "black",
				// colorDisabled: "grey",
				enableArBtn: true,
				enableCamerasBtn: true,
				enableFullscreenBtn: true,
				enableZoomBtn: true,
				// fullscreenId: "viewer-fullscreen-area",
				// iconStyle: { m: "3px" },
				// size: 32,
				// style: { display: "flex"},
				// variant: "subtle",
				// variantDisabled: "transparent",
			}),
			ViewportOverlayWrapper: ViewportOverlayWrapperThemeProps({
				// position: "bottom-right" // "top-left" | "top-right" | "bottom-left" | "bottom-right"
			}),
		},
	});

	const themeOverride = useThemeOverrideStore(state => state.themeOverride);
	const theme = mergeThemeOverrides(defaultTheme, themeOverride);
	console.debug("Theme", theme);
	
	/** @see https://mantine.dev/styles/css-variables/#css-variables-resolver */
	const resolver: CSSVariablesResolver = (theme) => ({
		variables: {
			"--appbuilder-appshelltemplate-headerheight-base": getAppShellSize(theme.components.AppBuilderAppShellTemplatePage.defaultProps.headerHeight, "base", ""),
			"--appbuilder-appshelltemplate-headerheight-xs": getAppShellSize(theme.components.AppBuilderAppShellTemplatePage.defaultProps.headerHeight, "xs", ""),
			"--appbuilder-appshelltemplate-headerheight-sm": getAppShellSize(theme.components.AppBuilderAppShellTemplatePage.defaultProps.headerHeight, "sm", ""),
			"--appbuilder-appshelltemplate-headerheight-md": getAppShellSize(theme.components.AppBuilderAppShellTemplatePage.defaultProps.headerHeight, "md", ""),
			"--appbuilder-appshelltemplate-headerheight-lg": getAppShellSize(theme.components.AppBuilderAppShellTemplatePage.defaultProps.headerHeight, "lg", ""),
			"--appbuilder-appshelltemplate-headerheight-xl": getAppShellSize(theme.components.AppBuilderAppShellTemplatePage.defaultProps.headerHeight, "xl", ""),
		},
		light: {
			// variables for light theme
		},
		dark: {
			// variables for dark theme
		},
	});

	return {
		theme,
		resolver
	};
};