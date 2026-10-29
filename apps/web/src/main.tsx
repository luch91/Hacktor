import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/syne/latin-400.css';
import '@fontsource/syne/latin-700.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@hacktor/ui/tokens.css';
import './styles.css';
import { App } from './App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Hacktor root element is missing');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

