import React from "react";
import { AppShell, Burger, Group, useMantineTheme } from "@mantine/core";
import NavigationBar from "components/ui/NavigationBar";
import HeaderBar from "components/ui/HeaderBar";
import { useColorScheme, useDisclosure } from "@mantine/hooks";
import { useIsMobile } from "hooks/useIsMobile";
import classes from "./ExamplePage.module.css";
import { useIsLandscape } from "hooks/useIsLandscape";

/**
 * Function that creates the view page.
 * An AppShell is used with:
 * - the header specified as in HeaderBar
 * - the navigation (left side) specified as in NavigationBar
 *
 * @returns
 */

interface Props {
	children: React.ReactNode;
	aside?: React.ReactNode;
	className?: string;
}

export default function ExamplePage({ children = <></>, aside = <></>, className = "" }: Props) {
	const scheme = useColorScheme();
	const theme = useMantineTheme();
	const [opened, { toggle }] = useDisclosure();
	const isMobile = useIsMobile();
	const isLandscape = useIsLandscape();

	//styles={{ top: "calc(100% - 300px);", paddingTop: 0, paddingBottom: 0, height: 300 }}
	return (
		<>
			<AppShell
				padding={{ base: 0}}
				className={className}
				header={{ height: 60 }}
				navbar={{ breakpoint: "md", width: { md: 150, lg: 200 }, collapsed: { mobile: !opened }  }}
			>
				<AppShell.Header>
					<Group h="100%" px="md" justify="space-between" wrap="nowrap">
						<Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
						<HeaderBar />
					</Group>
				</AppShell.Header>
				<AppShell.Navbar p={{base: "0", lg: "md"}} hidden={!opened} zIndex={20}>
					<NavigationBar />
				</AppShell.Navbar>
				<AppShell.Main
					className={`${classes.appShellMain} ${isLandscape ? classes.appShellMainLandscape : ""}`}
				>
					<section
						className={classes.appShellMainMain}
						style={{ backgroundColor: scheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0]}}
					>
						{ children }
					</section>
					<section
						className={`${classes.appShellMainAside} ${isLandscape ? classes.appShellMainAsideLandscape : ""} ${isLandscape && !isMobile ? classes.appShellMainAsideLandscapeLg : ""}`}
					>
						{ aside }
					</section>
				</AppShell.Main>
			</AppShell>
		</>
	);
}
