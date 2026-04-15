
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

const clearWebWorkerCaches = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)));
  }

  if ('caches' in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey).catch(() => false)));
  }
};

window.addEventListener('load', () => {
  if (shouldUseBrowserServiceWorker()) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => registration.update().catch(() => undefined))
      .catch(() => {
        return;
      });
    return;
  }

  void clearWebWorkerCaches().catch(() => undefined);
});
