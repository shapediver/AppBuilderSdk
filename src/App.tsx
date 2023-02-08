import { SESSION_SETTINGS_MODE } from '@shapediver/viewer';
import './App.css';
import SessionComponent from './components/shapediver/SessionComponent';
import ViewportComponent from './components/shapediver/ViewportComponent'


function App() {
  return (
    <div className="App">
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
          sessionSettingsId='session_2'
        />
      </div>
      <SessionComponent
        id='session_1'
        ticket='340ff308354b56f5cd0a631f668d48d934a38187c50ff049a19fd3565d316307cb042aaebfdccde871a81f5552c58c04907686e51cada8e8ea7878cfde011ff9d494a54acd68ccf39d9ecfac98bb6a9a2521fc9711294949c1557365b64bbce9e44d420d1b0a64-e5fb4e0ba6c4d6e047685318325f3704'
        modelViewUrl='https://sdr7euc1.eu-central-1.shapediver.com'
        excludeViewports={["viewport_2"]}
      />
      <SessionComponent
        id='session_2'
        ticket='b6b127d7e06588addc43443617c1eeea7ea316bef7ad1273cdd0c82d67f89b8dd4a67a327037b0a3ba2f52377c7d0e1b2a5657dd245603b0a3771d650ea4fbdd76e8187dc21ed1824063e4041b60a28747ed5a51e48c5e77d0c683bee53fb01fa53255e24a74ae-3a01cf3d24f8366dd64a0e2dfce4d4fc'
        modelViewUrl='https://sdeuc1.eu-central-1.shapediver.com'
        excludeViewports={["viewport_1"]}
      />
    </div >
  );
}

export default App;
