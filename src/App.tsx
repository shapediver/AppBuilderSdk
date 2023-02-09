import { SESSION_SETTINGS_MODE } from '@shapediver/viewer';
import './App.css';
import SessionComponent from './components/shapediver/SessionComponent';
import ViewportComponent from './components/shapediver/ViewportComponent'
import TicketSelect from './components/ui/TicketSelect';

function App() {
  return (
    <div className="App">
      <TicketSelect />
      <div style={{
        position: "absolute",
        width: "50%",
        height: "100%"
      }}>
        <ViewportComponent
          id='viewport_1'
          sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
          sessionSettingsId='session_1'
        />
      </div>
      <div style={{
        position: "absolute",
        left: "50%",
        width: "50%",
        height: "100%"
      }}>
        <ViewportComponent
          id='viewport_2'
          sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
          sessionSettingsId='selected_session_0'
        />
      </div>
      <SessionComponent
        id='session_1'
        ticket='340ff308354b56f5cd0a631f668d48d934a38187c50ff049a19fd3565d316307cb042aaebfdccde871a81f5552c58c04907686e51cada8e8ea7878cfde011ff9d494a54acd68ccf39d9ecfac98bb6a9a2521fc9711294949c1557365b64bbce9e44d420d1b0a64-e5fb4e0ba6c4d6e047685318325f3704'
        modelViewUrl='https://sdr7euc1.eu-central-1.shapediver.com'
        excludeViewports={["viewport_2"]}
      />
    </div >
  );
}

export default App;
