import React from 'react';
import { Portal } from './Portal';
import type { DailyCompletionPromptPayload } from '../utils/dailyCompletionPrompt';

interface DailyCompletionPromptModalProps {
    mode: 'GAME' | 'BASIC';
    payload: DailyCompletionPromptPayload;
    onOpenSitrep: () => void;
    onClose: () => void;
}

const buildPromptCopy = (
    mode: 'GAME' | 'BASIC',
    payload: DailyCompletionPromptPayload,
) => {
    if (payload.kind === 'sitrep') {
        if (mode === 'BASIC') {
            return {
                eyebrow: 'Resumo Diario',
                title: 'Resumo atualizado',
                message: 'Seu resumo do dia foi atualizado. Quer abrir a leitura do progresso agora?',
            };
        }

        return {
            eyebrow: 'Resumo Diario',
            title: 'Progresso consolidado',
            message: 'O resumo do dia foi atualizado com as acoes registradas. Quer ver os detalhes agora?',
        };
    }

    return {
        eyebrow: 'Progresso',
        title: 'Tarefa concluida',
        message: payload.actionName
            ? `"${payload.actionName}" foi concluida.`
            : 'Uma tarefa foi concluida.',
    };
};

export const DailyCompletionPromptModal: React.FC<DailyCompletionPromptModalProps> = ({
    mode,
    payload,
    onOpenSitrep,
    onClose,
}) => {
    const copy = buildPromptCopy(mode, payload);
    const isGame = mode === 'GAME';

    return (
        <Portal>
            <div className="ui-modal-backdrop" onClick={onClose}>
                <div
                    onClick={(event) => event.stopPropagation()}
                    className={`ui-modal-panel max-w-sm ${isGame ? '' : 'border-white/12'}`}
                >
                    <div className="ui-modal-panel-content ui-modal-stack">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--skin-accent-color)]/30 bg-[var(--skin-accent-color)]/12 text-[var(--skin-accent-color)] shadow-[0_0_18px_rgba(0,0,0,0.25)]">
                            <span className="text-xl">{payload.kind === 'sitrep' ? 'O' : 'V'}</span>
                        </div>

                        <div className="ui-modal-header">
                            <p className={`ui-modal-eyebrow ${isGame ? '' : 'text-white/58'}`}>
                                {copy.eyebrow}
                            </p>
                            <h2 className={`ui-modal-title ${isGame ? 'luxe-title-shadow' : ''}`}>
                                {copy.title}
                            </h2>
                            <p className="ui-modal-copy max-w-[18rem]">
                                {copy.message}
                            </p>
                        </div>

                        {payload.kind === 'sitrep' && (typeof payload.score === 'number' || typeof payload.expDeposited === 'number') && (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-2xl border border-white/8 bg-black/24 px-3 py-2 text-center">
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/44">Score</div>
                                    <div className="mt-1 text-lg font-black text-white">
                                        {typeof payload.score === 'number' ? `${payload.score}%` : '--'}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/24 px-3 py-2 text-center">
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/44">EXP</div>
                                    <div className="mt-1 text-lg font-black text-[var(--skin-accent-color)]">
                                        {typeof payload.expDeposited === 'number' ? `+${payload.expDeposited}` : '--'}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="ui-modal-actions">
                            <button
                                onClick={onClose}
                                className={`ui-modal-button ${
                                    isGame
                                        ? 'luxe-button-secondary'
                                        : 'border border-white/10 bg-white/6 text-white/84 hover:bg-white/10'
                                }`}
                            >
                                OK
                            </button>
                            {payload.kind === 'sitrep' && (
                                <button
                                    onClick={onOpenSitrep}
                                    className={`ui-modal-button ${
                                        isGame
                                            ? 'luxe-skin-button'
                                            : 'border border-[var(--skin-accent-color)]/22 bg-[var(--skin-accent-color)]/14 text-white hover:bg-[var(--skin-accent-color)]/20'
                                    }`}
                                >
                                    Abrir resumo
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default DailyCompletionPromptModal;
