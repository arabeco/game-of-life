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
                eyebrow: 'Painel diário',
                title: 'Dia encerrado',
                message: 'Seu painel diário foi fechado. Quer abrir o SITREP para revisar o resultado agora?',
            };
        }

        return {
            eyebrow: 'Ritual diário',
            title: 'SITREP selado',
            message: 'O julgamento do dia foi concluído. Quer abrir o SITREP para ver o resultado completo agora?',
        };
    }

    if (mode === 'BASIC') {
        return {
            eyebrow: 'Progresso',
            title: 'Tarefa concluída',
            message: payload.actionName
                ? `"${payload.actionName}" foi concluída. Quer abrir o SITREP agora?`
                : 'Uma tarefa foi concluída. Quer abrir o SITREP agora?',
        };
    }

    return {
        eyebrow: 'Execução',
        title: 'Ação concluída',
        message: payload.actionName
            ? `"${payload.actionName}" entrou no seu dia. Quer abrir o SITREP agora?`
            : 'Uma ação foi concluída. Quer abrir o SITREP agora?',
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
            <div
                className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/72 p-4 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            >
                <div
                    onClick={(event) => event.stopPropagation()}
                    className={`w-full max-w-sm overflow-hidden ${
                        isGame
                            ? 'rounded-[2rem] border border-[var(--skin-accent-color)]/30 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,rgba(18,18,22,0.96),rgba(6,6,8,0.98))] shadow-[0_24px_64px_rgba(0,0,0,0.48)]'
                            : 'rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,20,24,0.96),rgba(10,12,16,0.98))] shadow-[0_20px_48px_rgba(0,0,0,0.42)]'
                    }`}
                >
                    <div className="px-5 pb-5 pt-4">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--skin-accent-color)]/30 bg-[var(--skin-accent-color)]/12 text-[var(--skin-accent-color)] shadow-[0_0_18px_rgba(0,0,0,0.25)]">
                            <span className="text-xl">{payload.kind === 'sitrep' ? '◎' : '✓'}</span>
                        </div>

                        <div className="space-y-2 text-center">
                            <p className={`text-[10px] font-black uppercase tracking-[0.28em] ${isGame ? 'text-[var(--skin-accent-color)]' : 'text-white/58'}`}>
                                {copy.eyebrow}
                            </p>
                            <h2 className={`font-black uppercase tracking-[0.12em] ${isGame ? 'text-xl text-white luxe-title-shadow' : 'text-lg text-white'}`}>
                                {copy.title}
                            </h2>
                            <p className={`mx-auto max-w-[18rem] text-sm leading-relaxed ${isGame ? 'text-white/80' : 'text-white/72'}`}>
                                {copy.message}
                            </p>
                        </div>

                        {payload.kind === 'sitrep' && (typeof payload.score === 'number' || typeof payload.expDeposited === 'number') && (
                            <div className="mt-4 grid grid-cols-2 gap-2">
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

                        <div className="mt-5 flex gap-2">
                            <button
                                onClick={onClose}
                                className={`flex-1 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
                                    isGame
                                        ? 'luxe-button-secondary'
                                        : 'border border-white/10 bg-white/6 text-white/84 hover:bg-white/10'
                                }`}
                            >
                                OK
                            </button>
                            <button
                                onClick={onOpenSitrep}
                                className={`flex-1 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
                                    isGame
                                        ? 'luxe-skin-button'
                                        : 'border border-[var(--skin-accent-color)]/22 bg-[var(--skin-accent-color)]/14 text-white hover:bg-[var(--skin-accent-color)]/20'
                                }`}
                            >
                                Abrir SITREP
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default DailyCompletionPromptModal;
