/**
 * A BANCADA DA ABERTURA: o SplashScreen de verdade com um carregamento de
 * mentira. `?carrega=8000` diz quantos ms o app "demora" (padrao 8000).
 * A pagina anota em window.__abertura quando a abertura sumiu.
 *
 *   npm run bancada  ->  http://localhost:3010/abertura-bancada.html
 */
import '../index.css';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SplashScreen } from '../components/SplashScreen';

const carrega = Number(new URLSearchParams(location.search).get('carrega') || 8000);
const inicio = performance.now();
(window as any).__abertura = { carrega, sumiuEm: null as number | null };

const Bancada = () => {
    const [carregando, setCarregando] = useState(true);
    const [fim, setFim] = useState(false);
    useEffect(() => { const t = window.setTimeout(() => setCarregando(false), carrega); return () => window.clearTimeout(t); }, []);
    return (
        <>
            <p style={{ color: '#fff', font: '14px sans-serif', padding: 16 }}>{carregando ? 'APP AINDA CARREGANDO (nao devia aparecer)' : 'App pronto'}</p>
            {!fim && <SplashScreen isLoading={carregando} onComplete={() => { (window as any).__abertura.sumiuEm = Math.round(performance.now() - inicio); setFim(true); }} />}
        </>
    );
};

createRoot(document.getElementById('root')!).render(<Bancada />);
