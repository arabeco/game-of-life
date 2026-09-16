import React from 'react';
import { Action, Arena } from '../types';
import { useGame } from '../contexts/GameContext';

interface CampaignArenaStackProps {
    arenas: Arena[];
    size?: 'xs' | 'sm' | 'md';
    actions?: Action[];
}

const MEDIDAS = {
    xs: { visiveis: 3, icone: 'text-base', nome: 'text-[8px]', altura: 'min-h-[3.25rem]', vao: 'gap-1.5', recheio: 'px-1 py-1' },
    sm: { visiveis: 4, icone: 'text-lg', nome: 'text-[9px]', altura: 'min-h-[4rem]', vao: 'gap-2', recheio: 'px-1.5 py-1.5' },
    md: { visiveis: 6, icone: 'text-xl', nome: 'text-[10px]', altura: 'min-h-[4.5rem]', vao: 'gap-2', recheio: 'px-2 py-2' },
} as const;

/**
 * AS ARENAS DA CAMPANHA, COM NOME.
 *
 * Isto desenhava, nos tamanhos `sm` e `md`, uma PILHA: `ArenaCard` de verdade
 * cravados em 176x79, reduzidos por `transform: scale` e sobrepostos com
 * `left: indice * passo`, feito leque de cartas. O resultado era uma miniatura
 * esticada — um card inteiro, com a diagramacao dele, espremido num tamanho para
 * o qual nao foi desenhado — e com os nomes escondidos uns atras dos outros.
 *
 * Preview de campanha serve para responder UMA pergunta: que arenas eu estou
 * levando? A resposta e o nome delas. Entao os tres tamanhos passam a usar a
 * mesma grade que o `xs` ja usava — icone, nome e quantas acoes —, que e o unico
 * dos tres que respondia.
 *
 * `md` mostra mais arenas e com mais corpo, em vez de mostrar a mesma coisa
 * maior: quem tem mais espaco ganha mais informacao.
 */
export const CampaignArenaStack: React.FC<CampaignArenaStackProps> = ({ arenas, size = 'sm', actions: actionsOverride }) => {
    const { actions } = useGame();
    const medida = MEDIDAS[size];
    const visiveis = arenas.slice(0, medida.visiveis);
    const escondidas = Math.max(0, arenas.length - visiveis.length);
    const fonteDeAcoes = actionsOverride || actions;

    if (visiveis.length === 0) {
        return (
            <div className={`flex ${medida.altura} w-full items-center justify-center rounded-lg border border-white/8 text-[8px] font-black uppercase tracking-[0.14em] text-white/35`}>
                Sem arenas
            </div>
        );
    }

    /*
     * AS COLUNAS ACOMPANHAM QUANTAS ARENAS HA.
     *
     * Eram tres fixas. Uma campanha de duas arenas desenhava dois quadradinhos de
     * um terco da largura e deixava o terceiro terco vazio — e o nome, que e a
     * unica coisa que este preview tem para dizer, saia cortado em "ALQUIM...".
     * Com a grade cedendo, as mesmas duas arenas ganham metade da largura cada.
     *
     * As classes estao escritas por extenso de proposito: o Tailwind so gera o CSS
     * das que ele LE no codigo, e `grid-cols-${n}` montado em tempo de execucao
     * nunca chega ao arquivo final — a grade cairia para uma coluna so.
     */
    const colunas = visiveis.length === 1 ? 'grid-cols-1' : visiveis.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

    return (
        <div className={`relative grid w-full ${colunas} ${medida.vao} ${medida.altura}`}>
            {visiveis.map((arena) => {
                const quantasAcoes = fonteDeAcoes.filter((action) => action.arenaId === arena.id).length;

                return (
                    /* O quadradinho tentou, um dia, caber icone + nome + "4 acoes" lado
                       a lado em um terco da largura. Nao cabia: a palavra era cortada e
                       levava o nome da arena junto. O numero vira marcador no canto —
                       numero nao precisa de rotulo quando esta sobre um icone de arena. */
                    <div
                        key={arena.id}
                        className={`relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-white/10 bg-black/30 ${medida.recheio}`}
                    >
                        <span className={`${medida.icone} leading-none`} aria-hidden>{arena.icon || '◇'}</span>
                        <span className={`w-full truncate px-0.5 text-center ${medida.nome} font-black uppercase leading-tight tracking-[0.04em] text-white/85`}>
                            {arena.name}
                        </span>
                        {quantasAcoes > 0 && (
                            <span className="absolute right-0.5 top-0.5 flex h-3 min-w-3 items-center justify-center rounded-full bg-white/15 px-1 text-[7px] font-black leading-none text-white/80">
                                {quantasAcoes}
                            </span>
                        )}
                    </div>
                );
            })}

            {escondidas > 0 && (
                <div className="absolute bottom-0 right-0 rounded-full border border-white/15 bg-black/85 px-1.5 py-0.5 text-[7px] font-black text-white/75">
                    +{escondidas}
                </div>
            )}
        </div>
    );
};
