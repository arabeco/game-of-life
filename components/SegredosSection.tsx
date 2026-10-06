import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { REGRAS_DE_DESBLOQUEIO } from '../constants/desbloqueiosPorRegra';
import { resolveItemDef } from '../constants/items';
import { lerDescobertas } from '../utils/medidorDeSegredos';
import { ItemArt } from './ItemArt';
import { ChevronDownIcon } from './Icons';

/**
 * MISSOES → SEGREDOS.
 *
 * O que a pessoa achou, com a frase e o premio; o que falta, como ???. Sem dica
 * nenhuma: saber que existe mais, e nao saber como, e o que faz a regra secreta
 * ser secreta. Vale para a vida toda, por isso nao mora na lista da temporada.
 */
export const SegredosSection: React.FC = () => {
    const { userProfile } = useGame();
    const [aberto, setAberto] = useState(false);
    const descobertas = lerDescobertas(userProfile.completedSeasonMissions);
    const achadas = REGRAS_DE_DESBLOQUEIO.filter((regra) => descobertas.has(regra.id)).length;

    return (
        <div>
            <button
                type="button"
                onClick={() => setAberto((valor) => !valor)}
                aria-expanded={aberto}
                className="flex w-full items-baseline gap-2 px-1 py-1 text-left"
            >
                <span className="text-sm" aria-hidden="true">{'\u{1F512}'}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/62">Segredos</span>
                <span className="text-[9px] font-bold text-white/28">{achadas} de {REGRAS_DE_DESBLOQUEIO.length}</span>
                <ChevronDownIcon
                    className={`ml-auto h-3.5 w-3.5 shrink-0 translate-y-0.5 text-white/38 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
                />
            </button>
            {aberto && (
                <div className="mt-2 space-y-1">
                    {REGRAS_DE_DESBLOQUEIO.map((regra) => {
                        if (!descobertas.has(regra.id)) {
                            return (
                                <div key={regra.id} className="flex items-center gap-2.5 rounded-lg border border-white/6 bg-black/20 px-2.5 py-2">
                                    <span className="text-sm opacity-40" aria-hidden="true">{'\u{1F512}'}</span>
                                    <p className="text-[11px] font-bold tracking-[0.2em] text-white/28">{'???'}</p>
                                </div>
                            );
                        }
                        return (
                            <div key={regra.id} className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
                                <span className="text-sm" aria-hidden="true">{'\u{1F513}'}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[11px] font-bold text-white/82">{regra.nome}</p>
                                    {/* A frase quebra linha em vez de cortar: ela e o que a
                                        pessoa fez, e reticencias no meio dela apagam o feito. */}
                                    <p className="text-[9px] leading-snug text-white/48">{regra.frase}</p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    {regra.itens.map((itemId) => {
                                        const def = resolveItemDef(itemId);
                                        return (
                                            <ItemArt
                                                key={itemId}
                                                itemId={itemId}
                                                src={def?.imageUrl}
                                                alt={def?.name || itemId}
                                                icon={def?.icon}
                                                category={def?.category}
                                                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black/30"
                                                imgClassName="h-full w-full object-contain"
                                                iconClassName="text-base"
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
