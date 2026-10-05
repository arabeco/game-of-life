/**
 * A TELA DE MAESTRIA, MONTADA COMO OS AJUSTES A MONTAM.
 *
 * A MasteryView le cinco coisas do GameContext — os ativos, o salvar, o toast,
 * o perfil e as preferencias. Aqui elas vem de um provedor de mentira: nada
 * toca banco, rede ou conta. O que a pagina mostra e o componente de verdade.
 *
 * O perfil decide a trava de tres dias por `lastLevelUpdate`. Por isso sao dois
 * telefones: um que nunca avaliou (livre) e um que avaliou ontem (travado).
 */
import '../index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { GameContext } from '../contexts/GameContext';
import { MasteryView } from '../views/MasteryView';

const ATIVOS = [
    { id: 'proposito', name: 'PROPÓSITO', level: 7, levelDescriptions: {}, arenas: [], slots: [] },
    { id: 'relacoes', name: 'RELAÇÕES', level: 6, levelDescriptions: {}, arenas: [], slots: [] },
    { id: 'trabalho', name: 'TRABALHO', level: 7, levelDescriptions: {}, arenas: [], slots: [] },
    { id: 'lazer', name: 'LAZER', level: 9, levelDescriptions: {}, arenas: [], slots: [] },
    { id: 'saude', name: 'SAÚDE', level: 7, levelDescriptions: {}, arenas: [], slots: [] },
];

const UM_DIA = 24 * 60 * 60 * 1000;

const contextoCom = (lastLevelUpdate: number) => ({
    assets: ATIVOS,
    updateAllAssetLevels: async (niveis: unknown) => console.log('[bancada] salvar niveis', niveis),
    showToast: (mensagem: string) => console.log('[bancada] toast:', mensagem),
    userProfile: { id: 'bancada', role: 'player', lastLevelUpdate, tutorialCompletedAt: 0 },
    oraclePreferences: { hapticsEnabled: false, animationsEnabled: true },
}) as never;

const Telefone: React.FC<{ titulo: string; lastLevelUpdate: number }> = ({ titulo, lastLevelUpdate }) => (
    <div className="telefone">
        <h2>{titulo}</h2>
        <div className="tela">
            <GameContext.Provider value={contextoCom(lastLevelUpdate)}>
                <MasteryView embedded onClose={() => console.log('[bancada] fechar')} />
            </GameContext.Provider>
        </div>
    </div>
);

function Bancada() {
    return (
        <>
            <header>
                <h1>A maestria</h1>
                <p>
                    A <code>MasteryView</code> de verdade, <code>embedded</code> como os Ajustes a
                    chamam. À esquerda, quem pode avaliar agora; à direita, quem avaliou ontem e
                    está na trava de três dias. Tocar no pentágono à esquerda abre a roda; à
                    direita, o toque só avisa quando libera (no console). O botão
                    <strong> Avaliar</strong> mora ANTES desta tela, no card de Maestria do Perfil.
                </p>
            </header>
            <div className="telefones">
                <Telefone titulo="Livre — nunca avaliou" lastLevelUpdate={0} />
                <Telefone titulo="Travada — avaliou ontem" lastLevelUpdate={Date.now() - UM_DIA} />
            </div>
        </>
    );
}

createRoot(document.getElementById('raiz')!).render(<Bancada />);
