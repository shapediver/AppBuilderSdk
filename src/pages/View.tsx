import { AppShell, Tabs, Aside } from '@mantine/core';
import { SESSION_SETTINGS_MODE, BUSY_MODE_DISPLAY } from '@shapediver/viewer';
import { IconReplace, IconFileDownload } from '@tabler/icons-react';
import SessionComponent from '../components/shapediver/SessionComponent';
import ViewportComponent from '../components/shapediver/ViewportComponent';
import ExportUiComponent from '../components/ui/ExportUiComponent';
import HeaderBar from '../components/ui/HeaderBar';
import NavigationBar from '../components/ui/NavigationBar';
import ParameterUiComponent from '../components/ui/ParameterUiComponent';

function View() {
    return (
        <AppShell
            padding="md"
            navbar={
                <NavigationBar />
            }
            header={
                <HeaderBar />
            }
            aside={
                <Aside p="md" hiddenBreakpoint="sm" width={{ sm: 200, lg: 300 }}>
                    <Tabs defaultValue="parameters">
                        <Tabs.List>
                            <Tabs.Tab value="parameters" icon={<IconReplace size={14} />}>Parameters</Tabs.Tab>
                            <Tabs.Tab value="exports" icon={<IconFileDownload size={14} />}>Exports</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="parameters" pt="xs">
                            <ParameterUiComponent id="session_1" />
                        </Tabs.Panel>

                        <Tabs.Panel value="exports" pt="xs">
                            <ExportUiComponent id="session_1" />
                        </Tabs.Panel>
                    </Tabs>
                </Aside>
            }
            styles={(theme) => ({
                main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] },
            })}
        >
            <div className="App" style={{
                height: "100%"
            }}>
                <div style={{
                    width: "100%",
                    height: "100%"
                }}>
                    <ViewportComponent
                        id='viewport_1'
                        sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
                        sessionSettingsId='session_1'
                        branding={{
                            backgroundColor: "#141517",
                            busyModeDisplay: BUSY_MODE_DISPLAY.BLUR
                        }}
                    />
                </div>

                <SessionComponent
                    id='session_1'
                    ticket='340ff308354b56f5cd0a631f668d48d934a38187c50ff049a19fd3565d316307cb042aaebfdccde871a81f5552c58c04907686e51cada8e8ea7878cfde011ff9d494a54acd68ccf39d9ecfac98bb6a9a2521fc9711294949c1557365b64bbce9e44d420d1b0a64-e5fb4e0ba6c4d6e047685318325f3704'
                    modelViewUrl='https://sdr7euc1.eu-central-1.shapediver.com'
                    excludeViewports={["viewport_2"]}
                />
            </div >
        </AppShell >
    );
}

export default View;