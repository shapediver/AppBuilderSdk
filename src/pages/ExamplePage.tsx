import React, { } from "react";
import { AppShell, Burger, Container, Group, useMantineTheme } from "@mantine/core";
import NavigationBar from "components/ui/NavigationBar";
import HeaderBar from "components/ui/HeaderBar";
import { useColorScheme, useDisclosure, useMediaQuery } from "@mantine/hooks";

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
	const isMobile = useMediaQuery("(max-width: 765px)");
	
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
					h={{ base: 300, sm: "100%"}}
					style={isMobile ? { top: "calc(100% - 300px)"} : {} }
				>
					{ aside }
				</AppShell.Aside>
				{/** TODO Michael positioning in mobile mode does not work yet */}
				<AppShell.Main 
					bg={scheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0]}
					style={isMobile ? { top: "60px", left: "0px", right: "0px", bottom: "300px", position: "absolute"} : { height: "100%", width: "100%", position: "absolute"} }
				>
					<Container
						h="100%"
						w="100%"
						p={0}
						pos="relative"
						maw={1200}
					>
						{ children }
					</Container>
				</AppShell.Main>
			</AppShell>
		</>
	);
}
