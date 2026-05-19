import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Load customized accent color theme if saved in localStorage
if (typeof window !== 'undefined') {
  const savedColor = localStorage.getItem('flixrate_accent_color');
  if (savedColor) {
    document.documentElement.style.setProperty('--color-primary-brand', savedColor);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
