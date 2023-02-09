import { AppShell, Aside, Header, Image, Navbar, Tabs } from '@mantine/core';
import { BUSY_MODE_DISPLAY, SESSION_SETTINGS_MODE } from '@shapediver/viewer';
import { IconFileDownload, IconReplace } from '@tabler/icons-react';
import './App.css';
import SessionComponent from './components/shapediver/SessionComponent';
import ViewportComponent from './components/shapediver/ViewportComponent'
import ExportUiComponent from './components/ui/ExportUiComponent';
import ParameterUiComponent from './components/ui/ParameterUiComponent';
import TicketSelect from './components/ui/TicketSelect';

function App() {
  return (
    <AppShell
      padding="md"
      navbar={
        <Navbar width={{ sm: 200, lg: 300 }} p="xs">
          <Navbar.Section grow mx="-xs" px="xs">
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
          </Navbar.Section>
        </Navbar>
      }
      header={
        <Header height={60} p="xs">
          <Image
            style={{
              filter: "invert(1)"
            }}
            width={300}
            fit="contain"
            radius="md"
            src="https://shapediver.com/app/imgs/sd-logo-white-600x84.webp"
            alt="ShapeDiver Logo"
          />
        </Header>
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
          display: "flex",
          justifyContent: "center",
          height: "100%"
        }}>
          <div style={{
            display: "inline-block",
            width: "50%",
            height: "100%"
          }}>
            <ViewportComponent
              id='viewport_1'
              sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
              sessionSettingsId='session_1'
              branding={{
                busyModeDisplay: BUSY_MODE_DISPLAY.BLUR
              }}
            />
          </div>
          <div style={{
            display: "inline-block",
            width: "50%",
            height: "100%"
          }}>
            <ViewportComponent
              id='viewport_2'
              sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
              sessionSettingsId='selected_session_0'
            />
          </div>
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

export default App;
