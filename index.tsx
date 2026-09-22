
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { shouldUseBrowserServiceWorker } from './utils/runtimePlatform';
import { iniciarRelatorioDeErros } from './utils/relatorioDeErros';

/*
 * ANTES DE QUALQUER COISA, INCLUSIVE DO REACT.
 *
 * Um erro no arranque — import que nao resolve, variavel de ambiente faltando —
 * e justamente o que deixa a tela branca e nao deixa rastro. Se o relatorio
 * subir depois do React, esse e o erro que ele nunca vai ver.
 *
 * Sem `VITE_SENTRY_DSN` a funcao sai na primeira linha e nada acontece.
 */
void iniciarRelatorioDeErros();

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
