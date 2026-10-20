import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initTauriBridge } from './lib/tauriBridge';
import { initAccent, initTheme } from './ui/theme';
import './styles.css';

initTheme();
initAccent();
void initTauriBridge();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
