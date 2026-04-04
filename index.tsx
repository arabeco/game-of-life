
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { shouldUseBrowserServiceWorker } from './utils/runtimePlatform';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (shouldUseBrowserServiceWorker()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => registration.update().catch(() => undefined))
      .catch(() => {
        return;
      });
  });
}
