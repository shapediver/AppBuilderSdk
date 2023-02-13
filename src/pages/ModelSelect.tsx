import { AppShell, Aside } from '@mantine/core';
import { SESSION_SETTINGS_MODE, BUSY_MODE_DISPLAY } from '@shapediver/viewer';
import ViewportComponent from '../components/shapediver/ViewportComponent';
import HeaderBar from '../components/ui/HeaderBar';
import NavigationBar from '../components/ui/NavigationBar';
import TicketSelect from '../components/ui/TicketSelect';

function ModelSelect() {
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
                    <TicketSelect />
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
                            id='viewport_2'
                            sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
                            sessionSettingsId='selected_session_0'
                            branding={{
                                backgroundColor: "#141517",
                                busyModeDisplay: BUSY_MODE_DISPLAY.BLUR
                            }}
                        />
                    </div>
            </div >
        </AppShell >
    );
}

export default ModelSelect;