import { ColorScheme, ColorSchemeProvider, MantineProvider } from '@mantine/core';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { useUiStore } from './app/shapediver/uiStore';
import Home from './pages/Home';
import ModelSelect from './pages/ModelSelect';
import NoMatch from './pages/NoMatch';
import View from './pages/View';

function App() {
  const colorScheme = useUiStore(state => state.colorScheme);

  const toggleColorScheme = (value?: ColorScheme) => {
    useUiStore.setState({ colorScheme: (value || (colorScheme === 'dark' ? 'light' : 'dark')) })
  }

  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider theme={{ colorScheme: colorScheme }} withGlobalStyles withNormalizeCSS>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="view" element={<View />} />
            <Route path="modelSelect" element={<ModelSelect />} />
            <Route path="*" element={<NoMatch />} />
          </Routes>
        </BrowserRouter>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

export default App;
