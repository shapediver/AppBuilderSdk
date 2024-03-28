import React from "react";
import { AppShell, AppShellResponsiveSize, Burger, Group, MantineBreakpoint, MantineThemeComponent, Stack, useProps } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "./AppBuilderAppShellTemplatePage.module.css";
import { useIsLandscape } from "hooks/ui/useIsLandscape";
import { AppShellSize } from "@mantine/core/lib/components/AppShell/AppShell.types";

interface Props {
	top?: React.ReactNode;
	left?: React.ReactNode;
	children?: React.ReactNode;
	right?: React.ReactNode;
	bottom?: React.ReactNode;
}

interface StyleProps {
	/** top background color */
	headerHeight: AppShellResponsiveSize | AppShellSize;
	/** breakpoint below which to hide the navigation bar */
	navbarBreakpoint: MantineBreakpoint;
	/** width of the navigation bar */
	navbarWidth: AppShellResponsiveSize | AppShellSize;
}

const defaultStyleProps: StyleProps = {
	headerHeight: "4em",
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
 * Appshell layout template page for AppBuilder
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

	return (
		<>
			<AppShell
				padding="0"
				className="viewer-fullscreen-area"
				header={{ height: headerHeight}}
				navbar={{ breakpoint: navbarBreakpoint, width: navbarWidth, collapsed: { mobile: !opened }  }}
				// We need to define the background color here, because the corresponding element
				// is used for fullscreen mode and would otherwise be transparent (show as black).
				style={{backgroundColor: "var(--mantine-color-body)"}}
			>
				<AppShell.Header>
					<Group h="100%" justify="space-between" wrap="nowrap" px="xs" >
						<Burger opened={opened} onClick={toggle} hiddenFrom={navbarBreakpoint} size="sm" />
						<Group w="100%" h="100%" justify="center" wrap="nowrap" p="xs">
							{ top }
						</Group>
					</Group>
				</AppShell.Header>
				<AppShell.Navbar hidden={!opened} className={classes.appShellMainNavbar}>
					<Stack p="xs" >
						{ left }
					</Stack>
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
						<Stack p="xs">
							{ right }
						</Stack>
					</section>
				</AppShell.Main>
			</AppShell>
		</>
	);
}
