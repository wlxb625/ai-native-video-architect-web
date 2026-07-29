import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { StudioChromeOverlay } from './components/StudioChromeOverlay';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <StudioChromeOverlay />
  </StrictMode>,
);
