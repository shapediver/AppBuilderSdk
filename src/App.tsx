import { ColorScheme, ColorSchemeProvider, MantineProvider } from '@mantine/core';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { useGlobalUiStore } from './context/globalUiStore';
import HomePage from './pages/HomePage';
import ModelSelectPage from './pages/ModelSelectPage';
import NoMatchPage from './pages/NoMatchPage';
import ViewPage from './pages/ViewPage';

function App() {
  const colorScheme = useGlobalUiStore(state => state.colorScheme);

  const toggleColorScheme = (value?: ColorScheme) => {
    useGlobalUiStore.setState({ colorScheme: (value || (colorScheme === 'dark' ? 'light' : 'dark')) })
  }

  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider theme={{ colorScheme: colorScheme }} withGlobalStyles withNormalizeCSS>
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="view" element={<ViewPage />} />
            <Route path="modelSelect" element={<ModelSelectPage />} />
            <Route path="*" element={<NoMatchPage />} />
          </Routes>
        </HashRouter>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

export default App;
