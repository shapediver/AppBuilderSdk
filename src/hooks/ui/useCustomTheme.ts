import { Accordion, Button, ColorInput, DEFAULT_THEME, Group, Paper, Stack, Switch, Tabs, createTheme } from "@mantine/core";
import { useIsMobile } from "./useIsMobile";

export const useCustomTheme = () => {

	const isMobile = useIsMobile();

	const theme = createTheme({
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
					pt: isMobile ? "" : "xs",
				}
			}),
			/** 
             * Below here - custom components implemented by ShapeDiver 
             */
			AppBuilderImage: {
				defaultProps: {
					// radius: "md",
					// fit: "contain",
				}
			},
			AppBuilderGridTemplatePage: {
				defaultProps: {
					bgTop: "inherit", 
					bgLeft: "inherit", 
					bgRight: "inherit", 
					bgBottom: "inherit", 
					// showContainerButtons: true,
					// columns: 5,
					// rows: 4,
					// leftColumns: 1,
					// rightColumns: 1,
					// topRows: 1,
					// bottomRows: 1,
				}
			},
			DefaultSession: {
				defaultProps: {
					// see Props of useDefaultSessionDto
					// example: "AR Cube",
					// slug: "",
					// platformUrl: "",
					// id: "",
					// ticket: "",
					// modelViewUrl: "",
					// initialParameterValues: {},
					acceptRejectMode: true
				}
			},
			Icon: {
				defaultProps: {
					// size: 14,
					// stroke: 1,
				}
			},
			ParametersAndExportsAccordionComponent: {
				defaultProps: {
					//avoidSingleComponentGroups: true,
					//mergeAccordions: false,
					//pbSlider: "md",
				}
			},
			ParameterSliderComponent: {
				defaultProps: {
					//sliderWidth: "60%",
					//numberWidth: "35%",
				}
			},
			/** Define viewport branding for dark and light color scheme */
			ViewportBranding: {
				defaultProps: {
					light: {
						backgroundColor: DEFAULT_THEME.colors.gray[0],
						logo: "https://viewer.shapediver.com/v3/graphics/logo_animated_breath_inverted.svg"
					},
					dark: {
						backgroundColor: DEFAULT_THEME.colors.dark[8],
						logo: undefined
					}
				}
			},
			ViewportComponent: {
				defaultProps: {
					// sessionSettingsMode: SESSION_SETTINGS_MODE.FIRST,
					// showStatistics: true,
				}
			},
			ViewportIcons: {
				defaultProps: {
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
				}
			},
			ViewportOverlayWrapper: {
				defaultProps: {
					// position: "bottom-right" // "top-left" | "top-right" | "bottom-left" | "bottom-right"
				}
			},
		},
	});

	return {
		theme
	};
};