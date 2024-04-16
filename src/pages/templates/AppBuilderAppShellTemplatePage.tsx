import React, { useEffect, useState } from "react";
import { AppShell, AppShellResponsiveSize, Burger, Group, MantineBreakpoint, MantineThemeComponent, useMantineTheme, useProps } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import classes from "./AppBuilderAppShellTemplatePage.module.css";
import { useIsLandscape } from "hooks/ui/useIsLandscape";
import { AppShellSize } from "@mantine/core/lib/components/AppShell/AppShell.types";
import AppBuilderContainerWrapper from "./AppBuilderContainerWrapper";
import { createGridLayout } from "utils/layout";

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
	navbarWidth: { md: 250, lg: 300 }
};

type AppBuilderAppShellTemplatePageThemePropsType = Partial<StyleProps>;

export function AppBuilderAppShellTemplatePageThemeProps(props: AppBuilderAppShellTemplatePageThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

const COLUMNS = 3;
const ROWS = 3;

/**
 * AppShell layout template page for AppBuilder. 
 * This template is partially based on Mantine's AppShell component. 
 * Note that it does not make use of the aside feature of the AppShell component, 
 * but rather uses a 3 by 3 grid layout to divide the main area between the 
 * children (the viewport) and the right container if the device is in landscape mode.
 * In portrait mode the right container is shown below the main area, using a 
 * height of 300px. 
 * The bottom container is shown at the bottom of the grid layout if and only if
 * the device is in landscape mode and the width is above the navbar breakpoint.
 * Otherwise the bottom container is shown as part of the navigation bar area, 
 * using vertical layout.
 * @see https://mantine.dev/core/app-shell/
 * @param  
 * @returns 
 */
export default function AppBuilderAppShellTemplatePage(props: Props & Partial<StyleProps>) {

	const {
		top = undefined,
		bottom = undefined,
		left = undefined,
		children = undefined,
		right = undefined,
	} = props;
	
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
	const showBottomInGrid = !!bottom && aboveNavbarBreakpoint && isLandscape;
	const hasNavbarContent = !!left || (!!bottom && !showBottomInGrid);
	const showHeader = !!top || (!!left && !aboveNavbarBreakpoint) || (!!bottom && !showBottomInGrid && !aboveNavbarBreakpoint); 

	const [rootStyle, setRootStyle] = useState<React.CSSProperties>({
		...(createGridLayout({
			hasRight: !!right && isLandscape,
			hasBottom: (!!right && !isLandscape) || (!!bottom && showBottomInGrid),
			rows: ROWS,
			columns: COLUMNS
		}))
	});

	useEffect(() => {
		setRootStyle({
			...rootStyle,
			...(createGridLayout({
				hasRight: !!right && isLandscape,
				hasBottom: (!!right && !isLandscape) || (!!bottom && showBottomInGrid),
				rows: ROWS,
				columns: COLUMNS
			}))
		});
	}, [right, isLandscape, bottom, showBottomInGrid]);

	return (
		<>
			<AppShell
				padding="0"
				className="viewer-fullscreen-area"
				// We hide the header in case there is no top and no left container content.
				// In case there left container content, we only show the header below the navbar breakpoint 
				// (see hiddenFrom prop of AppShell.Header).
				header={{ height: headerHeight, collapsed: !showHeader }}
				navbar={{ breakpoint: navbarBreakpoint, width: navbarWidth, collapsed: { mobile: !opened || !hasNavbarContent, desktop: !hasNavbarContent }  }}
				// We need to define the background color here, because the corresponding element
				// is used for fullscreen mode and would otherwise be transparent (show as black).
				style={{backgroundColor: "var(--mantine-color-body)"}}
			>
				<AppShell.Header>
					<Group h="100%" justify="space-between" wrap="nowrap" px="xs" >
						{ hasNavbarContent ? <Burger opened={opened} onClick={toggle} hiddenFrom={navbarBreakpoint} size="sm" /> : undefined }
						<AppBuilderContainerWrapper orientation="horizontal" name="top">
							{ top }
						</AppBuilderContainerWrapper>
					</Group>
				</AppShell.Header>
				<AppShell.Navbar hidden={!opened} className={classes.appShellMainNavbar}>
					<AppBuilderContainerWrapper orientation="vertical" name="left">
						{ left }
					</AppBuilderContainerWrapper>
					{
						!bottom ? undefined : showBottomInGrid ? undefined : <AppBuilderContainerWrapper orientation="vertical" name="bottom">
							{ bottom }
						</AppBuilderContainerWrapper>
					}
				</AppShell.Navbar>
				<AppShell.Main
					className={`${classes.appShellMain} ${showHeader ? classes.appShellMaxHeightBelowHeader : classes.appShellMaxHeight}`} style={rootStyle}
				>
					<section
						className={classes.appShellGridAreaMain}
					>
						{ children }
					</section>
					<section
						className={`${isLandscape ? classes.appShellGridAreaRight : classes.appShellGridAreaBottomPortrait}`}
					>
						<AppBuilderContainerWrapper orientation="vertical" name="right">
							{ right }
						</AppBuilderContainerWrapper>
					</section>
					{ bottom && showBottomInGrid ? <section
						className={classes.appShellGridAreaBottom}
					>
						<AppBuilderContainerWrapper orientation="horizontal" name="bottom">
							{ bottom }
						</AppBuilderContainerWrapper>
					</section> : undefined
					}
				</AppShell.Main>
			</AppShell>
		</>
	);
}
