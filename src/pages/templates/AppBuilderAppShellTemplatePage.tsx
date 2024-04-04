import React from "react";
import { AppShell, AppShellResponsiveSize, Burger, Group, MantineBreakpoint, MantineThemeComponent, useMantineTheme, useProps } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import classes from "./AppBuilderAppShellTemplatePage.module.css";
import { useIsLandscape } from "hooks/ui/useIsLandscape";
import { AppShellSize } from "@mantine/core/lib/components/AppShell/AppShell.types";
import AppBuilderHorizontalContainer from "./AppBuilderHorizontalContainer";
import AppBuilderVerticalContainer from "./AppBuilderVerticalContainer";

interface Props {
	top?: React.ReactNode;
	left?: React.ReactNode;
	children?: React.ReactNode;
	right?: React.ReactNode;
	bottom?: React.ReactNode;
}

interface StyleProps {
	/** Height of the header (responsive) */
	headerHeight: AppShellResponsiveSize | AppShellSize;
	/** Breakpoint below which to hide the navigation bar */
	navbarBreakpoint: MantineBreakpoint;
	/** Width of the navigation bar */
	navbarWidth: AppShellResponsiveSize | AppShellSize;
}

const defaultStyleProps: StyleProps = {
	headerHeight:{ base: "4em", md: "4em"},
	navbarBreakpoint: "md",
	navbarWidth: { md: 200, lg: 250 }
};

type AppBuilderAppShellTemplatePageThemePropsType = Partial<StyleProps>;

export function AppBuilderAppShellTemplatePageThemeProps(props: AppBuilderAppShellTemplatePageThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * AppShell layout template page for AppBuilder. 
 * This template is partially based on Mantine's AppShell component. 
 * Note that it does not make use of the aside feature of the AppShell component, 
 * but rather uses a 3 by 3 grid layout to divide the main area between the 
 * children (the viewport) and the right container if the device is in landscape mode.
 * In portrait mode the right container is shown below the main area, using a 
 * height of 300px. 
 * This template does not support the "bottom" AppBuilder container. In case there is no
 * "top" container and if a "bottom" container is defined, the "bottom" container 
 * is displayed on top.
 * @see https://mantine.dev/core/app-shell/
 * @param  
 * @returns 
 */
export default function AppBuilderAppShellTemplatePage(props: Props & Partial<StyleProps>) {

	let {
		top = undefined,
		bottom = undefined,
	} = props;

	const {
		left = undefined,
		children = undefined,
		right = undefined,
	} = props;
	
	if (bottom && !top) {
		console.debug("Displaying 'bottom' on 'top'.");
		top = bottom;
		bottom = undefined;
	}

	if (bottom) {
		console.debug("Container 'bottom' is not supported by the 'appshell' template.");
	}

	// style properties
	const { 
		headerHeight,
		navbarBreakpoint,
		navbarWidth,
	} = useProps("AppBuilderAppShellTemplatePage", defaultStyleProps, props);

	const [opened, { toggle }] = useDisclosure();
	const isLandscape = useIsLandscape();
	const theme = useMantineTheme();
	const aboveNavbarBreakpoint = useMediaQuery(`(min-width: ${theme.breakpoints[navbarBreakpoint]})`);

	return (
		<>
			<AppShell
				padding="0"
				className="viewer-fullscreen-area"
				// We hide the header in case there is no top and no left container content.
				// In case there left container content, we only show the header below the navbar breakpoint 
				// (see hiddenFrom prop of AppShell.Header).
				header={{ height: headerHeight, collapsed: !top && (!left || aboveNavbarBreakpoint) }}
				navbar={{ breakpoint: navbarBreakpoint, width: navbarWidth, collapsed: { mobile: !opened || !left, desktop: !left }  }}
				// We need to define the background color here, because the corresponding element
				// is used for fullscreen mode and would otherwise be transparent (show as black).
				style={{backgroundColor: "var(--mantine-color-body)"}}
			>
				<AppShell.Header>
					<Group h="100%" justify="space-between" wrap="nowrap" px="xs" >
						{ left ? <Burger opened={opened} onClick={toggle} hiddenFrom={navbarBreakpoint} size="sm" /> : undefined }
						<AppBuilderHorizontalContainer>
							{ top }
						</AppBuilderHorizontalContainer>
					</Group>
				</AppShell.Header>
				<AppShell.Navbar hidden={!opened} className={classes.appShellMainNavbar}>
					<AppBuilderVerticalContainer>
						{ left }
					</AppBuilderVerticalContainer>
				</AppShell.Navbar>
				<AppShell.Main
					className={`${classes.appShellMain} ${isLandscape ? classes.appShellMainLandscape : ""}`}
				>
					<section
						className={classes.appShellMainMain}
					>
						{ children }
					</section>
					<section
						className={`${classes.appShellMainAside} ${isLandscape ? classes.appShellMainAsideLandscape : ""}`}
					>
						<AppBuilderVerticalContainer>
							{ right }
						</AppBuilderVerticalContainer>
					</section>
				</AppShell.Main>
			</AppShell>
		</>
	);
}
