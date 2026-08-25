import React, { useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { OracleSpeakerMark } from './OracleSpeakerMark';
import { EmojiGlyph } from './EmojiGlyph';
import type { ArenaPact, ArenaPactDifficulty } from '../utils/arenaPacts';

/**
 * A missao do Oraculo: uma missao individual amarrada a uma arena que a pessoa
 * JA TEM, em vez de criar arena nova como as outras missoes individuais fazem.
 *
 * Para quem joga NAO e um conceito novo — e a missao individual escolhida, e
 * aparece junto das outras em "Sua escolha". O nome interno (`pact`, e as
 * colunas arena_pact_* no perfil) ficou de um rascunho anterior e nao vaza para
 * a tela; renomear coluna exigiria migracao sem ganho nenhum para quem usa.
 *
 * Uma de cada vez, de proposito: tres missoes abertas viram lista de tarefas, e
 * o app ja tem lista de tarefas. A forca disso e ter UMA coisa pendente.
 *
 * A proposta e PEDIDA, nunca empurrada: so aparece depois de a pessoa clicar em
 * "Pedir uma missao ao Oraculo". Num app de disciplina, o app oferecendo missao
 * sozinho vira interrupcao — a pessoa procurando, nao.
 *
 * Dentro da proposta ha dois caminhos, que servem a momentos diferentes: as tres
 * sugestoes prontas para quem abriu sem alvo, e "eu escolho a arena" para quem ja
 * sabe o que quer mover. No segundo, as opcoes saem da arena escolhida, entao
 * tudo na tela e uma opcao que existe — nada de escolher e cair em lista vazia.
 */

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
                    <p className="text-[12px] font-black leading-tight text-white">{pact.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-white/60">{pact.description}</p>
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

/** A missao em curso. Sem missao aberta nao renderiza nada — nunca propoe. */
export const ArenaPactBalloon: React.FC = () => {
    const { activeArenaPact, arenaPactProgress, abandonArenaPact, claimArenaPact } = useGame();
    const [busy, setBusy] = useState(false);

    if (!activeArenaPact || !arenaPactProgress) return null;

    const { current, goal, percent, completed } = arenaPactProgress;

    const run = async (fn: () => Promise<void>) => {
        setBusy(true);
        try {
            await fn();
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="sitrep-neutral-panel flex items-start gap-3 rounded-2xl border border-[var(--skin-accent-color)]/16 p-3 text-left">
            <OracleSpeakerMark tone={completed ? 'success' : 'guide'} size="sm" className="mt-0.5 shrink-0" pulse={completed} />
            <div className="min-w-0 flex-1">
                <p className="core-label text-[var(--skin-accent-color)]">
                    {completed ? 'Missao cumprida' : 'Missao em curso'}
                </p>
                <p className="mt-1 text-[12px] font-black leading-tight text-white">{activeArenaPact.title}</p>

                {completed ? (
                    <p className="mt-1 text-[11px] leading-relaxed text-white/70">
                        Voce fez o que combinou. Pegue o que e seu.
                    </p>
                ) : (
                    <>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-[var(--skin-accent-color)] transition-all"
                                style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                            />
                        </div>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/50 tabular-nums">
                            {activeArenaPact.kind === 'constancia' ? `${current} de ${goal} dias` : `${percent}%`}
                        </p>
                    </>
                )}

                <RewardLine pact={activeArenaPact} />

                <div className="mt-2 flex flex-wrap gap-2">
                    {completed ? (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void run(claimArenaPact)}
                            className="luxe-skin-button px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] disabled:opacity-50"
                        >
                            Receber
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void run(abandonArenaPact)}
                            className="rounded-full border border-white/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/50 transition-colors hover:text-white/80 disabled:opacity-50"
                        >
                            Abandonar missao
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * A proposta, aberta a pedido. Renderiza null quando ja ha missao aberta ou
 * quando nenhuma arena rende proposta — assim quem chama nao precisa saber a
 * regra, so montar o componente.
 */
export const ArenaPactProposal: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const {
        activeArenaPact,
        arenaPactCandidates,
        getArenaPactOptionsForArena,
        acceptArenaPact,
        getArenas,
    } = useGame();

    const [busy, setBusy] = useState(false);
    const [escolhendoArena, setEscolhendoArena] = useState(false);
    const [arenaEscolhida, setArenaEscolhida] = useState<string | null>(null);

    // So arenas que rendem alguma proposta entram na escolha: oferecer uma arena
    // e nao ter missao para ela seria beco sem saida.
    const arenasComPacto = useMemo(() => {
        if (activeArenaPact) return [];
        return getArenas()
            .map((arena) => ({ arena, options: getArenaPactOptionsForArena(arena.id) }))
            .filter((entry) => entry.options.length > 0);
    }, [activeArenaPact, getArenas, getArenaPactOptionsForArena]);

    const opcoesDaArena = useMemo(
        () => (arenaEscolhida ? getArenaPactOptionsForArena(arenaEscolhida) : []),
        [arenaEscolhida, getArenaPactOptionsForArena],
    );

    if (activeArenaPact || arenaPactCandidates.length === 0) return null;

    const handleAccept = (pact: ArenaPact) => {
        setBusy(true);
        void (async () => {
            try {
                await acceptArenaPact(pact);
                setEscolhendoArena(false);
                setArenaEscolhida(null);
                onClose?.();
            } finally {
                setBusy(false);
            }
        })();
    };

    const mostrandoEscolha = escolhendoArena && arenasComPacto.length > 0;

    return (
        <div className="sitrep-neutral-panel flex items-start gap-3 rounded-2xl border border-[var(--skin-accent-color)]/16 p-3 text-left">
            <OracleSpeakerMark tone="guide" size="sm" className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="core-label text-[var(--skin-accent-color)]">Proposta do Oraculo</p>

                {!mostrandoEscolha && (
                    <>
                        <p className="mt-1 text-[11px] leading-relaxed text-white/78">
                            Estas usam arenas que voce ja tem. Uma missao de cada vez.
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
                        <p className="mt-1 text-[11px] leading-relaxed text-white/78">Qual arena voce quer mover?</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {arenasComPacto.map(({ arena }) => (
                                <button
                                    key={arena.id}
                                    type="button"
                                    onClick={() => setArenaEscolhida(arena.id)}
                                    className="flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-white/70 transition-colors hover:border-[var(--skin-accent-color)]/40 hover:text-white"
                                >
                                    <EmojiGlyph value={arena.icon} className="text-xs" />
                                    <span className="max-w-[9rem] truncate">{arena.name}</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {mostrandoEscolha && arenaEscolhida && (
                    <>
                        <p className="mt-1 text-[11px] leading-relaxed text-white/78">O que voce quer combinar?</p>
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
                            Eu escolho a arena
                        </button>
                    )}
                    {mostrandoEscolha && (
                        <button
                            type="button"
                            onClick={() => {
                                if (arenaEscolhida) setArenaEscolhida(null);
                                else setEscolhendoArena(false);
                            }}
                            className="rounded-full border border-white/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/60 transition-colors hover:text-white/90"
                        >
                            Voltar
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
