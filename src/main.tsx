import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- GOOGLE PLAY STORE SECURITY POLICY COMPLIANCE ENFORCEMENT ---

// 1. Strict HTTPS-only protocol injection for web views and web-app targets
if (
  typeof window !== 'undefined' &&
  window.location.protocol === 'http:' &&
  !window.location.hostname.includes('localhost') &&
  !window.location.hostname.includes('127.0.0.1')
) {
  window.location.replace(window.location.href.replace('http:', 'https:'));
}

// 2. Automated Production-Level Client Log Stripping to safeguard memory scrapers from runtime details
if ((import.meta as any).env?.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
  // Keeping console.error active solely for critical platform diagnostic fail safes, ensuring zero debug pollution.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
