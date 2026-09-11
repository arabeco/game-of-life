import React, { useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { OracleSpeakerMark } from './OracleSpeakerMark';
import { EmojiGlyph } from './EmojiGlyph';
import type { Arena } from '../types';
import { missionObjective, missionTime } from '../utils/missionPresentation';
import { getOperationalDateString } from '../utils/operationalDay.js';
import { ESCOPO_APP } from '../utils/arenaPacts';
import type { ArenaPact, ArenaPactDifficulty } from '../utils/arenaPacts';

// Pacto voluntário sobre uma arena existente. Um ativo por vez.

const DIFFICULTY_LABEL: Record<ArenaPactDifficulty, string> = {
    leve: 'Leve',
    media: 'Media',
    alta: 'Alta',
};

const DIFFICULTY_CLASS: Record<ArenaPactDifficulty, string> = {
    leve: 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100',
    media: 'border-amber-300/35 bg-amber-300/10 text-amber-100',
    alta: 'border-rose-300/35 bg-rose-300/10 text-rose-100',
};

const RewardLine: React.FC<{ pact: ArenaPact }> = ({ pact }) => (
    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--skin-accent-color)]/80">
        {pact.reward.gold} ouro · {pact.reward.xp} XP
        {pact.reward.chest ? ` · baú ${pact.reward.chest}` : ''}
    </p>
);

const PactOption: React.FC<{ pact: ArenaPact; onAccept: (pact: ArenaPact) => void; busy: boolean }> = ({
    pact,
    onAccept,
    busy,
}) => (
    <button
        type="button"
        disabled={busy}
        onClick={() => onAccept(pact)}
        className="w-full rounded-2xl border border-white/[0.08] bg-black/40 p-3 text-left transition-colors hover:border-[var(--skin-accent-color)]/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
        <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2">
                <EmojiGlyph value={pact.arenaIcon} className="mt-0.5 shrink-0 text-base" />
                <div className="min-w-0">
                    <p className="text-[12px] font-black leading-tight text-white">{missionObjective(pact)}</p>
                    {/* O motivo vem do mesmo numero que gerou a proposta. Sem ele a
                        oferta enuncia a regra e nao diz por que ESTA, para VOCE, agora. */}
                    {pact.motivo && (
                        <p className="mt-1 text-[10.5px] leading-relaxed text-[var(--skin-accent-color)]/75">{pact.motivo}</p>
                    )}
                    <RewardLine pact={pact} />
                </div>
            </div>
            <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] ${DIFFICULTY_CLASS[pact.difficulty]}`}
            >
                {DIFFICULTY_LABEL[pact.difficulty]}
            </span>
        </div>
    </button>
);

/** O pacto em curso. Sem pacto aberto nao renderiza nada — nunca propoe. */
export const ArenaPactBalloon: React.FC = () => {
    const { activeArenaPact, arenaPactProgress, abandonArenaPact, claimArenaPact } = useGame();
    const [busy, setBusy] = useState(false);

    if (!activeArenaPact || !arenaPactProgress) return null;

    const { current, goal, percent, completed } = arenaPactProgress;
    const time = missionTime(activeArenaPact, getOperationalDateString());

    const run = async (fn: () => Promise<void>) => {
        setBusy(true);
        try {
            await fn();
        } catch (error) {
            console.error('Pact operation failed', error);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="daily-panel-neutral rounded-2xl border border-[var(--skin-accent-color)]/20 p-4 text-left">
            <div className="flex items-center gap-2">
                <OracleSpeakerMark tone={completed ? 'success' : 'guide'} size="sm" pulse={completed} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--skin-accent-color)]">{completed ? 'Missão cumprida' : 'Sua missão'}</span>
            </div>
            <h3 className="mt-3 text-base font-bold leading-snug text-white">{missionObjective(activeArenaPact)}</h3>
            <div className="mt-4 space-y-3">
                <div>
                    <div className="mb-1.5 flex justify-between text-[11px] text-white/65"><span>Progresso</span><strong className="text-[var(--skin-accent-color)] tabular-nums">{activeArenaPact.kind === 'conclusao' ? `${Math.round(percent)}%` : `${current}/${goal} ${activeArenaPact.kind === 'constancia' ? 'dias' : 'ações'}`}</strong></div>
                    <div role="progressbar" aria-label="Progresso da missão" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.max(0,Math.min(100,percent)))} className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--skin-accent-color)] transition-all" style={{width:`${Math.max(0,Math.min(100,percent))}%`}} /></div>
                </div>
                {time && !completed && <div>
                    <div className="mb-1.5 flex justify-between text-[11px] text-white/55"><span>Tempo</span><span>{time.label}</span></div>
                    <div role="progressbar" aria-label="Tempo decorrido da missão" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(time.percent)} aria-valuetext={time.label} className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-sky-300/60" style={{width:`${time.percent}%`}} /></div>
                </div>}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                <RewardLine pact={activeArenaPact} />
                <button type="button" disabled={busy} onClick={() => void run(completed ? claimArenaPact : abandonArenaPact)} className={completed ? 'luxe-skin-button min-h-11 px-4 text-xs font-bold disabled:opacity-50' : 'min-h-11 rounded-full px-3 text-xs text-white/50 hover:text-white disabled:opacity-50'}>{completed ? 'Receber' : 'Encerrar'}</button>
            </div>
        </div>
    );
};

/**
 * A proposta, aberta a pedido. Renderiza null quando ja ha missao aberta ou
 * quando nenhuma arena rende proposta — assim quem chama nao precisa saber a
 * regra, so montar o componente.
 */
export const ArenaPactProposal: React.FC<{ onClose?: () => void; substituindo?: boolean }> = ({ onClose, substituindo }) => {
    const {
        activeArenaPact,
        arenaPactProgress,
        arenaPactCandidates,
        getArenaPactOptionsForArena,
        acceptArenaPact,
        getArenas,
    } = useGame();

    const [busy, setBusy] = useState(false);
    /**
     * A primeira pergunta e "qual arena", nao "qual destas tres".
     *
     * O fluxo existia, mas atras de um botao: a tela abria com tres propostas de
     * arenas diferentes e a escolha por arena era o caminho secundario. Ficava ao
     * contrario — a pessoa sabe qual frente da vida dela quer mover, e nao qual
     * das tres combinacoes o app sorteou.
     *
     * Agora escolhe a arena, depois ve o que da para combinar NELA. A sugestao
     * automatica continua ali, um toque adiante, para quem nao quer decidir.
     */
    const [escolhendoArena, setEscolhendoArena] = useState(true);
    const [arenaEscolhida, setArenaEscolhida] = useState<string | null>(null);

    // So arenas que rendem alguma proposta entram na escolha: oferecer uma arena
    // e nao ter missao para ela seria beco sem saida.
    const arenasComPacto = useMemo(() => {
        if (activeArenaPact && !substituindo) return [];
        const porArena = getArenas()
            .map((arena) => ({ arena, options: getArenaPactOptionsForArena(arena.id) }))
            .filter((entry) => entry.options.length > 0);

        // "Tudo junto" fecha a lista: e a missao que nao e de uma frente so, e vem
        // por ultimo porque quem abre isto costuma ter uma arena em mente.
        const doApp = getArenaPactOptionsForArena(ESCOPO_APP);
        return doApp.length > 0
            ? [...porArena, { arena: { id: ESCOPO_APP, name: 'Tudo junto', icon: '\u2B21' } as Arena, options: doApp }]
            : porArena;
    }, [activeArenaPact, substituindo, getArenas, getArenaPactOptionsForArena]);

    const opcoesDaArena = useMemo(
        () => (arenaEscolhida ? getArenaPactOptionsForArena(arenaEscolhida) : []),
        [arenaEscolhida, getArenaPactOptionsForArena],
    );

    if (substituindo ? !activeArenaPact : activeArenaPact) return null;
    if (!substituindo && arenaPactCandidates.length === 0) return null;

    const handleAccept = (pact: ArenaPact) => {
        setBusy(true);
        void (async () => {
            try {
                await acceptArenaPact(pact, Boolean(substituindo));
                setEscolhendoArena(false);
                setArenaEscolhida(null);
                onClose?.();
            } catch (error) {
                console.error('Pact acceptance failed', error);
            } finally {
                setBusy(false);
            }
        })();
    };

    // Sem arena elegivel a escolha nao tem o que mostrar: cai na sugestao, que e
    // o outro caminho, em vez de abrir uma tela vazia.
    const mostrandoEscolha = escolhendoArena && arenasComPacto.length > 0;

    return (
        <div className="daily-panel-neutral flex items-start gap-3 rounded-2xl border border-[var(--skin-accent-color)]/16 p-3 text-left">
            <OracleSpeakerMark tone="guide" size="sm" className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="core-label text-[var(--skin-accent-color)]">
                    {substituindo ? 'Trocar de missão' : 'Proposta do Oráculo'}
                </p>

                {/* Duas frases porque sao duas coisas: a CONTAGEM do pacto
                    recomeca (ela conta a partir do aceite), mas o trabalho
                    continua valendo. Dizer so a segunda faria a pessoa voltar
                    achando que foi roubada. */}
                {substituindo && activeArenaPact && (
                    <p className="mt-1 text-[11px] leading-relaxed text-white/78">
                        O novo vai substituir <span className="text-white">"{activeArenaPact.title}"</span>
                        {arenaPactProgress && !arenaPactProgress.completed
                            ? `, e a contagem de ${arenaPactProgress.current} de ${arenaPactProgress.goal} recomeça.`
                            : '.'}
                        {' '}Nada do que você já fez é perdido.
                    </p>
                )}

                {!mostrandoEscolha && (
                    <>
                        <p className="mt-1 text-[11px] leading-relaxed text-white/78">
                            Sugestões do Oráculo, das arenas que mais precisam. Uma missão individual de cada vez.
                        </p>
                        <div className="mt-2 space-y-2">
                            {arenaPactCandidates.map((pact) => (
                                <PactOption key={pact.id} pact={pact} onAccept={handleAccept} busy={busy} />
                            ))}
                        </div>
                    </>
                )}

                {mostrandoEscolha && !arenaEscolhida && (
                    <>
                        <p className="mt-1 text-[11px] leading-relaxed text-white/78">O que você quer mover?</p>
                        {/* Cada arena vem com o ESTADO dela embaixo — o mesmo motivo
                            que a proposta usaria. Escolher sem saber como a arena
                            esta e escolher no escuro, e o dado ja esta calculado. */}
                        <div className="mt-2 space-y-1.5">
                            {arenasComPacto.map(({ arena, options }) => (
                                <button
                                    key={arena.id}
                                    type="button"
                                    onClick={() => setArenaEscolhida(arena.id)}
                                    className="flex w-full items-start gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-left transition-colors hover:border-[var(--skin-accent-color)]/40 hover:bg-black/40"
                                >
                                    <EmojiGlyph value={arena.icon} className="mt-0.5 shrink-0 text-sm" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[11px] font-black text-white">{arena.name}</span>
                                        {options[0]?.motivo && (
                                            <span className="mt-0.5 block truncate text-[10px] text-white/50">{options[0].motivo}</span>
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {mostrandoEscolha && arenaEscolhida && (
                    <>
                        <p className="mt-1 text-[11px] leading-relaxed text-white/78">O que você quer combinar em {arenasComPacto.find((entry) => entry.arena.id === arenaEscolhida)?.arena.name || 'nesta arena'}?</p>
                        <div className="mt-2 space-y-2">
                            {opcoesDaArena.map((pact) => (
                                <PactOption key={pact.id} pact={pact} onAccept={handleAccept} busy={busy} />
                            ))}
                        </div>
                    </>
                )}

                <div className="mt-2 flex flex-wrap gap-2">
                    {!mostrandoEscolha && arenasComPacto.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setEscolhendoArena(true)}
                            className="rounded-full border border-white/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/60 transition-colors hover:text-white/90"
                        >
                            Escolher a arena
                        </button>
                    )}
                    {mostrandoEscolha && arenaEscolhida && (
                        <button
                            type="button"
                            onClick={() => setArenaEscolhida(null)}
                            className="rounded-full border border-white/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/60 transition-colors hover:text-white/90"
                        >
                            Voltar
                        </button>
                    )}
                    {/* A sugestao automatica continua a um toque, para quem nao quer
                        decidir qual frente mover. Ela deixou de ser a porta de
                        entrada, nao deixou de existir. */}
                    {mostrandoEscolha && !arenaEscolhida && arenaPactCandidates.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setEscolhendoArena(false)}
                            className="rounded-full border border-white/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/60 transition-colors hover:text-white/90"
                        >
                            Sugerir pra mim
                        </button>
                    )}
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/35 transition-colors hover:text-white/60"
                        >
                            Nenhuma delas
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
