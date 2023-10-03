import { AppShell, Tabs, Aside, MediaQuery, Navbar, Header, Burger, useMantineTheme } from "@mantine/core";
import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import { IconReplace, IconFileDownload } from "@tabler/icons-react";
import ViewportComponent from "components/shapediver/ViewportComponent";
import ExportUiComponent from "components/shapediver/ExportUiComponent";
import HeaderBar from "components/ui/HeaderBar";
import NavigationBar from "components/ui/NavigationBar";
import ParameterUiComponent from "components/shapediver/ParameterUiComponent";
import React, { useEffect, useState } from "react";
import { useShapediverStoreUI } from "store/shapediverStoreUI";
import { useShapediverStoreViewer } from "store/shapediverStoreViewer";
import ViewerUiBridgeComponent from "components/shapediver/ViewerUiBridgeComponent";

/**
 * Function that creates the view page.
 * An AppShell is used with:
 * - the header specified as in HeaderBar
 * - the navigation (left side) specified as in NavigationBar
 * - the aside (right side) two tabs, one with a ParameterUiComponent and another with an ExportUiComponent
 * - and a viewport and session in the main component. The session is connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function ViewPage() {
	const theme = useMantineTheme();
	const [opened, setOpened] = useState(false);
	const [loading, setLoading] = useState(false);
	const { createSession, closeSession, sessions } = useShapediverStoreViewer();
	
	const sessionCreateDto = {
		id: "session_1",
		ticket: "340ff308354b56f5cd0a631f668d48d934a38187c50ff049a19fd3565d316307cb042aaebfdccde871a81f5552c58c04907686e51cada8e8ea7878cfde011ff9d494a54acd68ccf39d9ecfac98bb6a9a2521fc9711294949c1557365b64bbce9e44d420d1b0a64-e5fb4e0ba6c4d6e047685318325f3704",
		modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
		excludeViewports: ["viewport_2"],
	};

	const parameters = useShapediverStoreUI(state => state.parameters[sessionCreateDto.id]);
	
	useEffect(() => {
		setLoading(true);
		// if there is already a session with the same unique id registered
		// we wait until that session is closed until we create this session anew
		// the closing of the session is done on unmount
		// this can happen in development mode due to the duplicate calls of react
		// read about that here: https://reactjs.org/docs/strict-mode.html#ensuring-reusable-state
		createSession(sessionCreateDto).finally(() => {
			setLoading(false);
		});

		return () => {
			// when the ViewPage gets destroyed, we close the session
			closeSession(sessionCreateDto.id);
		};
	}, []);

	return (
		<>
			<ViewerUiBridgeComponent sessionId={sessionCreateDto.id} sessions={sessions}></ViewerUiBridgeComponent>
			<AppShell
				padding="md"
				navbarOffsetBreakpoint="sm"
				asideOffsetBreakpoint="sm"
				navbar={
					<Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 200, lg: 300 }}>
						<NavigationBar />
					</Navbar>
				}
				header={
					<Header height={60} p="xs">
						<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}>
							<MediaQuery largerThan="sm" styles={{ display: "none" }}>
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
						<Aside p="md" hiddenBreakpoint="sm" width={{ sm: 200, lg: 300 }}>
							<Tabs defaultValue="parameters">
								<Tabs.List>
									<Tabs.Tab value="parameters" icon={<IconReplace size={14} />}>Parameters</Tabs.Tab>
									<Tabs.Tab value="exports" icon={<IconFileDownload size={14} />}>Exports</Tabs.Tab>
								</Tabs.List>

								<Tabs.Panel value="parameters" pt="xs">
									{ !loading && parameters && <ParameterUiComponent parameters={parameters} /> }
								</Tabs.Panel>

								<Tabs.Panel value="exports" pt="xs">
									{ !loading && <ExportUiComponent sessionId="session_1" /> }
								</Tabs.Panel>
							</Tabs>

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
					<div style={{
						textAlign: "center",
						height: "100%"
					}}>
						<div style={{
							position: "relative",
							width: "100%",
							height: "100%",
							overflow: "hidden"
						}}>
							<ViewportComponent
								id='viewport_1'
								sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
								sessionSettingsId='session_1'
								branding={{
									backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
									logo: theme.colorScheme === "dark" ? undefined : "https://viewer.shapediver.com/v3/graphics/logo_animated_breath_inverted.svg"
								}}
							/>
						</div>
					</div >

				</MediaQuery>
			</AppShell >
		</>
	);
}
