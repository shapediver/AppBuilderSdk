import React, { } from "react";
import { AppShell, Burger, Container, Group, useMantineTheme } from "@mantine/core";
import NavigationBar from "components/ui/NavigationBar";
import HeaderBar from "components/ui/HeaderBar";
import { useColorScheme, useDisclosure } from "@mantine/hooks";
import { useIsMobile } from "hooks/useIsMobile";

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
	
	//styles={{ top: "calc(100% - 300px);", paddingTop: 0, paddingBottom: 0, height: 300 }}
	return (
		<>
			<AppShell
				padding={{ base: 0, sm: "sm"}}
				className={className}
				header={{ height: 60 }}
				navbar={{ breakpoint: "md", width: { md: 150, lg: 200 }, collapsed: { mobile: !opened }  }}
				aside={{ breakpoint: "sm", width: { sm: 300, lg: 300 } }}
			>
				<AppShell.Header>
					<Group h="100%" px="md" justify="space-between" wrap="nowrap">
						<Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
						<HeaderBar />
					</Group>
				</AppShell.Header>
				<AppShell.Navbar p={{base: "0", lg: "md"}} hidden={!opened}>
					<NavigationBar />
				</AppShell.Navbar>
				<AppShell.Aside 
					p={{ base: 0, sm: "sm", md: "md"}}
					style={isMobile ? { top: "calc(100% - 300px)", height: "300px", maxHeight: "100%" } : { } }
				>
					{ aside }
				</AppShell.Aside>
				<AppShell.Main 
					bg={scheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0]}
					style={isMobile ? { top: "60px", left: "0px", right: "0px", bottom: "300px", minHeight: "0", position: "absolute"} : { height: "100%", width: "100%", position: "absolute"} }
				>
					<Container
						h="100%"
						w="100%"
						p={0}
						pos="relative"
						maw="100%"
					>
						{ children }
					</Container>
				</AppShell.Main>
			</AppShell>
		</>
	);
}
