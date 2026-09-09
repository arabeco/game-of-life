import { AccountGarden } from './AccountGarden';
import React from 'react';
import { createRoot } from 'react-dom/client';
import SandExperiment from '../views/zen3d/SandExperiment';
import '../views/zen3d/zen3d.css';
import '../views/zen3d/glyphMenu.css';

if (window.parent !== window) {
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !document.querySelector('dialog[open]')) {
      window.parent.postMessage({type:'glyph-garden-exit'}, window.location.origin);
    }
  });
}

const menuParams = new URLSearchParams(window.location.search);

const Garden = window.parent !== window ? AccountGarden : SandExperiment;

createRoot(document.getElementById('zen3d-root')!).render(
  <React.StrictMode><Garden skinId={menuParams.get('skin') || 'BASIC'} theme={menuParams.get('theme') === 'light' ? 'light' : 'dark'} /></React.StrictMode>,
);
