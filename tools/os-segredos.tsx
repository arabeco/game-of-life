/**
 * OS SEGREDOS — A SECAO DE MISSOES E O MODAL DE CONQUISTA SECRETA.
 *
 * Monta o SegredosSection e o AchievementModal DE VERDADE, com um GameContext de
 * mentira: nada toca banco, rede ou conta. O perfil de mentira ja descobriu
 * Disciplinado e Veterano — o que a conta principal ganha no primeiro dia.
 *
 * Suba com `npm run bancada` e abra /os-segredos.html
 */
import '../index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GameContext } from '../contexts/GameContext';
import { SegredosSection } from '../components/SegredosSection';
import { AchievementModal } from '../components/AchievementModal';
import { REGRAS_DE_DESBLOQUEIO } from '../constants/desbloqueiosPorRegra';
import { montarModalDeSegredos } from '../utils/medidorDeSegredos';

const regra = (id: string) => REGRAS_DE_DESBLOQUEIO.find((r) => r.id === id)!;

const contexto = {
    userProfile: {
        id: 'bancada',
        completedSeasonMissions: ['free_progress_reset_at:2026-09-01', 'segredo:disciplinado', 'segredo:veterano'],
    },
    addFeedEvent: (evento: unknown) => console.log('[bancada] addFeedEvent', evento),
    showToast: (mensagem: string) => console.log('[bancada] toast:', mensagem),
    oraclePreferences: { animationsEnabled: true, celebrationScreensEnabled: true },
    updateOraclePreferences: (p: unknown) => console.log('[bancada] preferencias', p),
    assets: [],
} as never;

function Bancada() {
    const [modal, setModal] = useState<ReturnType<typeof montarModalDeSegredos> | null>(null);
    return (
        <GameContext.Provider value={contexto}>
            <header>
                <h1>Os segredos</h1>
                <p>
                    A seção <strong>Segredos</strong> de Missões e o modal de recompensa com o título
                    <strong> Conquista secreta</strong>. O perfil de mentira já achou Disciplinado e
                    Veterano.
                </p>
                <div className="botoes">
                    <button type="button" onClick={() => setModal(montarModalDeSegredos([regra('disciplinado')]))}>Modal · um segredo</button>
                    <button type="button" onClick={() => setModal(montarModalDeSegredos([regra('disciplinado'), regra('veterano')]))}>Modal · dois de uma vez</button>
                </div>
            </header>
            <div className="telefone">
                <div className="tela">
                    <SegredosSection />
                </div>
            </div>
            {modal && (
                <AchievementModal
                    achievement={{ type: 'QUEST_COMPLETED', data: modal }}
                    onClose={() => setModal(null)}
                />
            )}
        </GameContext.Provider>
    );
}

createRoot(document.getElementById('raiz')!).render(<Bancada />);
