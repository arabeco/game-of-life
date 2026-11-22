/**
 * A BANCADA DOS TERMOS: o TermsOverlay de verdade, para testar o arrastar
 * sem criar conta. `?ultima=1` nao muda nada: as clausulas avancam no toque.
 *
 *   npm run bancada  ->  http://localhost:3010/termos-bancada.html
 */
import '../index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TermsOverlay } from '../components/AppRuntimeOverlays';

const Bancada = () => {
    const [aceitou, setAceitou] = useState(0);
    return (
        <>
            <p id="aceites" style={{ position: 'fixed', top: 4, left: 8, zIndex: 30000, color: '#fff', font: '12px sans-serif' }}>aceites: {aceitou}</p>
            <TermsOverlay open onAccept={() => setAceitou((n) => n + 1)} />
        </>
    );
};

createRoot(document.getElementById('root')!).render(<Bancada />);
