import React from "react";
import { AppShell, Burger, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useIsMobile } from "hooks/ui/useIsMobile";
import classes from "./AppBuilderAppShellTemplatePage.module.css";
import { useIsLandscape } from "hooks/ui/useIsLandscape";

/**
 * Function that creates the view page.
 * An AppShell is used with:
 * - the header specified as in HeaderBar
 * - the navigation (left side) specified as in NavigationBar
 *
 * @returns
 */

interface Props {
	top?: React.ReactNode;
	left?: React.ReactNode;
	children?: React.ReactNode;
	right?: React.ReactNode;
	bottom?: React.ReactNode;
}


/**
 * Appshell layout template page for AppBuilder
 * @see https://mantine.dev/core/app-shell/
 * @param  
 * @returns 
 */
export default function AppBuilderAppShellTemplatePage(props: Props) {

	const {
		top = undefined,
		left = undefined,
		children = undefined,
		right = undefined,
		bottom = undefined,
	} = props;
	
	if (bottom) {
		console.debug("Container 'bottom' is not supported by the 'appshell' template.");
	}

	const [opened, { toggle }] = useDisclosure();
	const isMobile = useIsMobile();
	const isLandscape = useIsLandscape();

	return (
		<>
			<AppShell
				padding={{ base: 0}}
				className="viewer-fullscreen-area"
				header={{ height: 60 }}
				navbar={{ breakpoint: "md", width: { md: 150, lg: 200 }, collapsed: { mobile: !opened }  }}
				// We need to define the background color here, because the corresponding element
				// is used for fullscreen mode and would otherwise be transparent (show as black).
				style={{backgroundColor: "var(--mantine-color-body)"}}
			>
				<AppShell.Header>
					<Group h="100%" px="md" justify="space-between" wrap="nowrap">
						<Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
						{ top }
					</Group>
				</AppShell.Header>
				<AppShell.Navbar p={{base: "0", lg: "md"}} hidden={!opened} zIndex={20}>
					{ left }
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
						className={`${classes.appShellMainAside} ${isLandscape ? classes.appShellMainAsideLandscape : ""} ${isLandscape && !isMobile ? classes.appShellMainAsideLandscapeLg : ""}`}
					>
						{ right }
					</section>
				</AppShell.Main>
			</AppShell>
		</>
	);
}
