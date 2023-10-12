import { AppShell, Aside, Burger, Header, MediaQuery, Navbar, useMantineTheme } from "@mantine/core";
import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import ViewportComponent from "components/shapediver/ViewportComponent";
import HeaderBar from "components/ui/HeaderBar";
import NavigationBar from "components/ui/NavigationBar";
import ModelSelect from "components/ui/ModelSelect";
import React, { useState } from "react";

/**
 * Function that creates the model select page.
 * An AppShell is used with:
 * - the header specified as in HeaderBar
 * - the navigation (left side) specified as in NavigationBar
 * - the aside (right side) with a ModelSelect component
 * - and a viewport in the main component that is set to take the settings from the first session that was selected via the select component
 *
 * @returns
 */
export default function ModelSelectPage() {
	const [opened, setOpened] = useState(false);
	const theme = useMantineTheme();

	return (
		<AppShell
			padding="md"
			navbar={
				<Navbar p="md" hiddenBreakpoint="md" hidden={!opened} width={{ md: 150, lg: 200 }}>
					<NavigationBar />
				</Navbar>
			}
			header={
				<Header height={60} p="xs">
					<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}>
						<MediaQuery largerThan="md" styles={{ display: "none" }}>
							<Burger
								opened={opened}
								onClick={() => setOpened((o) => !o)}
								size="sm"
								color={theme.colors.gray[6]}
							/>
						</MediaQuery>

						<HeaderBar />
					</div>
				</Header>
			}
			aside={
				<MediaQuery smallerThan="sm" styles={{ top: "calc(100% - 300px);", paddingTop: 0, paddingBottom: 0, height: 300 }}>
					<Aside p="md" hiddenBreakpoint="sm" width={{ sm: 300, lg: 300 }}>
						<ModelSelect />
					</Aside>
				</MediaQuery>
			}
			styles={(theme) => ({
				main: { backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0] },
			})}
		>
			<MediaQuery smallerThan="sm" styles={{
				margin: "-16px!important",
				// minus two times padding (2 x 16)
				maxHeight: "calc(100% - 268px);!important"
			}}>
				<ViewportComponent
					id='viewport_2'
					sessionSettingsMode={SESSION_SETTINGS_MODE.FIRST}
					showStatistics={true}
					branding={{
						backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
						logo: theme.colorScheme === "dark" ? undefined : "https://viewer.shapediver.com/v3/graphics/logo_animated_breath_inverted.svg"
					}}
				/>
			</MediaQuery>
		</AppShell >
	);
}
