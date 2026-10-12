/**
 * A BANCADA DO CONVITE: o bloco de verdade (ConviteDeAmigo) em tres momentos,
 * com um provedor de mentira — nada toca banco. `npm run bancada` e abra
 * http://localhost:3010/convite-bancada.html
 */
import '../index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { GameContext } from '../contexts/GameContext';
import { ConviteDeAmigo } from '../components/ConviteDeAmigo';
import type { MeusConvites } from '../utils/convites';

const CASOS: Array<[string, MeusConvites]> = [
    ['Comecando', { codigo: 'MISTERX-7K2', entraram: 0, completaram: 0, recebeu1: false, recebeu5: false, recebeu10: false }],
    ['Primeiro amigo: baú Comum disponível', { codigo: 'MISTERX-7K2', entraram: 1, completaram: 1, recebeu1: false, recebeu5: false, recebeu10: false }],
    ['Bolinha do 5 pronta', { codigo: 'MISTERX-7K2', entraram: 7, completaram: 6, recebeu1: false, recebeu5: false, recebeu10: false }],
    ['Tudo recebido', { codigo: 'MISTERX-7K2', entraram: 12, completaram: 10, recebeu1: true, recebeu5: true, recebeu10: true }],
];

const Caso: React.FC<{ titulo: string; dados: MeusConvites }> = ({ titulo, dados }) => (
    <GameContext.Provider value={{
        buscarMeusConvites: async () => dados,
        receberPremioDeConvite: async () => true,
        showToast: (m: string) => console.log('[bancada] toast:', m),
    } as never}>
        <section style={{ maxWidth: 384, marginBottom: 28 }}>
            <h2 style={{ fontSize: 12, opacity: 0.6, margin: '0 0 8px' }}>{titulo}</h2>
            <div className="rounded-3xl border border-white/10 bg-[#101216] p-5">
                <ConviteDeAmigo />
            </div>
        </section>
    </GameContext.Provider>
);

createRoot(document.getElementById('root')!).render(
    <main>{CASOS.map(([titulo, dados]) => <Caso key={titulo} titulo={titulo} dados={dados} />)}</main>,
);
