import { Accordion, AppShellResponsiveSize, Button, CSSVariablesResolver, ColorInput, DEFAULT_THEME, Group, MantineSize, MantineSpacing, Paper, Stack, StyleProp, Switch, Tabs, createTheme, mergeThemeOverrides } from "@mantine/core";
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

/**
 * Helper function for defining CSS variables for the AppBuilderAppShellTemplate
 * @param size 
 * @param breakpoint 
 * @param defval 
 * @returns 
 */
const getAppShellSize = (size: AppShellResponsiveSize | AppShellSize, breakpoint: MantineSize | "base", defval: string): string => {
	if (!size)
		return defval;

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

/**
 * Hook for getting our custom theme. 
 * Theme overrides can be set in a global store using the hook useThemeOverrideStore.
 * @returns 
 */
export const useCustomTheme = () => {

	/** 
	 * Padding value used in various places. 
	 * Note that there is no need to use this global value, this is 
	 * just used for convenience. In case you need different paddings,
	 * feel free to set individual values.
	 */
	const padding: StyleProp<MantineSpacing> = "xs";

	/**
	 * Mantine theme object: @see https://mantine.dev/theming/theme-object/
	 * The theme can be used to set global default properties, and 
	 * properties of individual components. 
	 * 
	 * Default properties for Mantine components and custom components: 
	 * @see https://mantine.dev/theming/default-props/
	 * 
	 * Mantine components: See the Mantine documentation for available properties. 
	 * 
	 * Custom components: See their implementation for available properties.
	 */
	const defaultTheme = createTheme({
		defaultRadius: "md",
		components: {
			/**
			 * Default properties of Mantine components
			 */

			/**
             * Accordion
			 * @see https://mantine.dev/core/accordion/?t=props
             */
			Accordion: Accordion.extend({
				defaultProps: {
					variant: "contained",
				},
				styles: {
					content: { padding: "0" }
				}
			}),
			/**
             * Accordion
			 * @see https://mantine.dev/core/accordion/?t=props
             */
			AccordionPanel: Accordion.Panel.extend({
				defaultProps: {
					pl: padding,
					pr: padding,
					pb: padding,
				}
			}),
			/**
			 * Button
			 * @see https://mantine.dev/core/button/?t=props
			 */
			Button: Button.extend({
				defaultProps: {
					variant: "default",
				}
			}),
			/** 
			 * ColorInput
			 * @see https://mantine.dev/core/color-input/?t=props
			 */
			ColorInput: ColorInput.extend({
				styles: {
					input: { cursor: "pointer" }
				}
			}),
			/**
			 * Group
			 * @see https://mantine.dev/core/group/?t=props
			 */
			Group: Group.extend({
				defaultProps: {
					gap: padding,
				}
			}),
			/**
			 * Paper
			 * @see https://mantine.dev/core/paper/?t=props
			 */
			Paper: Paper.extend({
				defaultProps: {
					px: padding,
					py: padding,
					//shadow: "xs",
					withBorder: true,
				},
			}),
			/**
			 * Stack
			 * @see https://mantine.dev/core/stack/?t=props
			 */
			Stack: Stack.extend({
				defaultProps: {
					gap: "xs",
				}
			}),
			/**
			 * Switch
			 * @see https://mantine.dev/core/switch/?t=props
			 */
			Switch: Switch.extend({
				defaultProps: {
					size: "md",
				},
				styles: {
					track: { cursor: "pointer" }
				}
			}),
			/**
			 * Tabs
			 * @see https://mantine.dev/core/tabs/?t=props
			 */
			Tabs: Tabs.extend({
			}),
			/**
			 * Tabs
			 * @see https://mantine.dev/core/tabs/?t=props
			 */
			TabsPanel: Tabs.Panel.extend({
				defaultProps: {
					pt: padding,
				}
			}),

			/** 
             * Below here - custom components implemented by ShapeDiver 
             */

			/**
			 * AppBuilderImage
			 * 
			 * Used to display AppBuilder image widgets.
			 */
			AppBuilderImage: AppBuilderImageThemeProps({
				// radius: "md",
				// fit: "contain",
			}),
			/**
			 * AppBuilderAppShellTemplatePage
			 * 
			 * AppShell template for AppBuilder.
			 * 
			 * based to some extent on the Mantine AppShell component
			 */
			AppBuilderAppShellTemplatePage: AppBuilderAppShellTemplatePageThemeProps({
				// headerHeight: "4em",
				// headerHeight: { base: "4em", md: "6em"},
				// navbarBreakpoint: "md",
				// navbarWidth: { md: 200, lg: 250 }
			}),
			/**
			 * AppBuilderGridTemplatePage
			 * 
			 * Grid layout template for AppBuilder.
			 */
			AppBuilderGridTemplatePage: AppBuilderGridTemplatePageThemeProps({
				// bgTop: "transparent", 
				// bgLeft: "transparent", 
				// bgRight: "transparent", 
				// bgBottom: "transparent", 
				// showContainerButtons: true,
				// columns: 5,
				// rows: 4,
				// leftColumns: 1,
				// rightColumns: 1,
				// topRows: 1,
				// bottomRows: 1,
			}),
			/**
			 * AppBuilderHorizontalContainer
			 * 
			 * Used for horizontal AppBuilder containers.
			 */
			AppBuilderHorizontalContainer: AppBuilderHorizontalContainerThemeProps({
				// w: "100%",
				// h: "100%",
				// justify: "center",
				// wrap: "nowrap",
				// p: "xs",
			}),
			/**
			 * AppBuilderTemplateSelector
			 * 
			 * Used for selecting the AppBuilder template.
			 */
			AppBuilderTemplateSelector: AppBuilderTemplateSelectorThemeProps({
				// template: "appshell"
				// template: "grid" // default
			}),
			/**
			 * AppBuilderVerticalContainer
			 * 
			 * Used for vertical AppBuilder containers.
			 */
			AppBuilderVerticalContainer: AppBuilderVerticalContainerThemeProps({
				// p: "md",
			}),
			/**
			 * DefaultSession
			 * 
			 * Default session to use in case none is defined.
			 */
			DefaultSession: DefaultSessionThemeProps({
				// see Props of useDefaultSessionDto
				// example: "AR Cube",
				// slug: "",
				// platformUrl: "",
				// id: "",
				// ticket: "",
				// modelViewUrl: "",
				// initialParameterValues: {},
				// acceptRejectMode: true
			}),
			/**
			 * Icon
			 * 
			 * Icon component used by AppBuilder.
			 */
			Icon: IconThemeProps({
				// size: 14,
				// stroke: 1,
			}),
			/**
			 * ParametersAndExportsAccordionComponent
			 * 
			 * Defaults for parameter and export widgets.
			 */
			ParametersAndExportsAccordionComponent: ParametersAndExportsAccordionComponentThemeProps({
				//avoidSingleComponentGroups: true,
				//mergeAccordions: false,
				//pbSlider: "md",
			}),
			/**
			 * ParameterSliderComponent
			 * 
			 * Defaults for sliders.
			 */
			ParameterSliderComponent: ParameterSliderComponentThemeProps({
				//sliderWidth: "60%",
				//numberWidth: "35%",
			}),
			/**
			 * ViewportBranding
			 *  
			 * Define viewport branding for dark and light color scheme.
			 */
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
			/**
			 * ViewportComponent
			 * 
			 * Default settings for the viewport component. 
			 */
			ViewportComponent: ViewportComponentThemeProps({
				// sessionSettingsMode: SESSION_SETTINGS_MODE.FIRST,
				// showStatistics: true,
			}),
			/**
			 * ViewportIcons
			 * 
			 * Which viewport icons to display.
			 */
			ViewportIcons: ViewportIconsThemeProps({
				// color: "black",
				// colorDisabled: "grey",
				// enableArBtn: false,
				// enableCamerasBtn: false,
				// enableFullscreenBtn: false,
				// enableZoomBtn: false,
				// fullscreenId: "viewer-fullscreen-area",
				// iconStyle: { m: "3px" },
				// size: 32,
				// style: { display: "flex"},
				// variant: "subtle",
				// variantDisabled: "transparent",
			}),
			/**
			 * ViewportOverlayWrapper
			 * 
			 * Where to position viewport icons and other overlays.
			 */
			ViewportOverlayWrapper: ViewportOverlayWrapperThemeProps({
				// position: "bottom-right" // "top-left" | "top-right" | "bottom-left" | "bottom-right"
			}),
		},
	});

	const themeOverride = useThemeOverrideStore(state => state.themeOverride);
	const theme = mergeThemeOverrides(defaultTheme, themeOverride);
	console.debug("Theme", theme);
	
	/** 
	 * @see https://mantine.dev/styles/css-variables/#css-variables-resolver
	 */
	const resolver: CSSVariablesResolver = (theme) => ({
		variables: {
			/** CSS variables used by the AppBuilderAppShellTemplate */
			"--appbuilder-appshelltemplate-headerheight-base": getAppShellSize(theme.components.AppBuilderAppShellTemplatePage.defaultProps.headerHeight, "base", "4em"),
			"--appbuilder-appshelltemplate-headerheight-xs": getAppShellSize(theme.components.AppBuilderAppShellTemplatePage.defaultProps.headerHeight, "xs", "4em"),
			"--appbuilder-appshelltemplate-headerheight-sm": getAppShellSize(theme.components.AppBuilderAppShellTemplatePage.defaultProps.headerHeight, "sm", "4em"),
			"--appbuilder-appshelltemplate-headerheight-md": getAppShellSize(theme.components.AppBuilderAppShellTemplatePage.defaultProps.headerHeight, "md", "4em"),
			"--appbuilder-appshelltemplate-headerheight-lg": getAppShellSize(theme.components.AppBuilderAppShellTemplatePage.defaultProps.headerHeight, "lg", "4em"),
			"--appbuilder-appshelltemplate-headerheight-xl": getAppShellSize(theme.components.AppBuilderAppShellTemplatePage.defaultProps.headerHeight, "xl", "4em"),
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