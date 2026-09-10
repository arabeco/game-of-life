import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useSensoryFeedback } from '../hooks/useSensoryFeedback';
import { ITEMS_DB } from '../constants/items';
import { RANK_REWARDS } from '../constants/nobility';
import { ProfileBackgroundSurface } from './ProfileBackgroundSurface';
import { getRankBackgroundToken } from '../utils/profileBackgrounds';

/**
 * A ESCALADA DO SOBERANO.
 *
 * O que existia antes listava as dez patentes e, em cada cartao, imprimia o
 * mesmo numero de XP duas vezes. Nao mostrava a insignia, nao dizia o que cada
 * degrau entrega e nao havia como ver o que espera la em cima — uma escada de
 * dez andares apresentada como tabela de precos sem produto.
 *
 * TRES DECISOES DE DESENHO, porque a escada e uma so coisa e precisa parecer:
 *
 * 1. O TRILHO. Uma linha de 2px a esquerda, passando pelo centro de cada
 *    medalhao. Ele e desenhado em PEDACOS, um por degrau, e nao como uma barra
 *    unica atras de tudo: assim ele acompanha cartao que cresce ao abrir, sem
 *    depender de medir altura. Aceso ate onde voce chegou, apagado acima.
 *
 * 2. O MEDALHAO e a insignia daquele degrau, que ja existia como item e so
 *    aparecia depois de conquistada. Ver a proxima e metade do motivo de subir,
 *    entao ela aparece antes — em cinza.
 *
 * 3. O FUNDO DA PATENTE e o fundo do proprio cartao, coberto por um degrade que
 *    escurece a esquerda para o texto ler. E o unico premio da escada que da
 *    para MOSTRAR numa lista, e e o que faz a tela parecer uma escada de verdade
 *    em vez de dez linhas de texto.
 *
 * Os limiares sao ditos em EXP. A regua do jogo e ~1 EXP por minuto executado,
 * entao da vontade de traduzir para horas — mas o bonus de assinatura entra no
 * fecho e desfaz essa equivalencia justamente para quem paga. Ver a nota sobre
 * `num` no corpo do componente.
 */

const RAIL_LEFT = 27;
const MEDAL_CENTER = 40;

export const NobilityLadder: React.FC = () => {
    const { userProfile, nobilityRanks } = useGame();
    const { trigger } = useSensoryFeedback();
    const [openRankId, setOpenRankId] = useState<string | null>(null);

    const currentIndex = Math.max(0, nobilityRanks.findIndex((rank) => rank.id === userProfile.nobility?.rankId));
    const currentRank = nobilityRanks[currentIndex];
    const nextRank = nobilityRanks[currentIndex + 1];
    const exp = Math.max(0, userProfile.nobility?.exp || 0);

    const expAtRank = currentRank?.expTotalRequired || 0;
    const expAtNext = nextRank?.expTotalRequired ?? expAtRank;
    const spanExp = Math.max(0, expAtNext - expAtRank);
    const doneExp = Math.max(0, exp - expAtRank);
    const progress = spanExp > 0 ? Math.min(100, (doneExp / spanExp) * 100) : 100;

    /**
     * A ESCADA FALA EM EXP, NAO EM HORAS.
     *
     * Ela dizia horas porque a regua do jogo e ~1 EXP por minuto executado, e
     * "4.000 horas" parece mais concreto que "240.000 XP". Duas coisas derrubam
     * isso:
     *
     *  1. QUEM ASSINA NAO BATE. O bonus de assinatura entra no fecho, sobre a
     *     base — entao a EXP acumulada de um assinante NAO corresponde ao tempo
     *     que ele executou. A conversao para horas mentiria justamente para quem
     *     paga.
     *  2. O NUMERO FINAL. O Soberano custa 1.000.000 de EXP. Esse numero e um
     *     marco; "16.667 horas" e uma conta.
     */
    const num = (value: number) => Math.round(value).toLocaleString('pt-BR');

    const handleToggle = (rankId: string, alcancada: boolean) => {
        const abrindo = openRankId !== rankId;
        // Degrau fechado responde diferente de degrau aberto, e degrau que ainda
        // nao e seu responde como parede. Tres estados, tres toques.
        trigger(abrindo ? (alcancada ? 'click_soft' : 'impact') : 'click_crisp');
        setOpenRankId(abrindo ? rankId : null);
    };

    return (
        <div className="space-y-4">
            {/* ------------------------------------------------ onde voce esta */}
            <div className="relative overflow-hidden rounded-3xl border border-white/12">
                <div className="absolute inset-0">
                    <ProfileBackgroundSurface
                        value={getRankBackgroundToken(currentRank?.id || 'vagante')}
                        className="h-full w-full object-cover"
                        alt=""
                    />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,7,10,0.62)_0%,rgba(6,7,10,0.88)_100%)]" />

                <div className="relative px-4 py-5 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/56">Sua patente</p>
                    <h2 className="mt-1 text-3xl font-black uppercase tracking-[0.04em] text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                        {currentRank?.name || 'Vagante'}
                    </h2>

                    <div className="mx-auto mt-4 h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-black/45">
                        <div
                            className="h-1.5 rounded-full bg-[var(--skin-accent-color)] transition-all duration-700"
                            style={{ width: progress + '%' }}
                        />
                    </div>

                    {/* Uma linha, tres fatos: onde voce esta, quanto falta, para onde.
                        Antes eram quatro linhas repetindo os mesmos dois numeros. */}
                    <p className="mt-2 text-[11px] font-bold text-white/70">
                        {nextRank
                            ? num(exp) + ' EXP · faltam ' + num(expAtNext - exp) + ' para ' + nextRank.name
                            : num(exp) + ' EXP · topo da escada'}
                    </p>
                </div>
            </div>

            {/* ------------------------------------------------------ a escada */}
            <ol className="relative">
                {nobilityRanks.map((rank, index) => {
                    const alcancada = index <= currentIndex;
                    const atual = index === currentIndex;
                    const aberta = openRankId === rank.id;
                    const proximaAlcancada = index + 1 <= currentIndex;
                    const insignia = ITEMS_DB.find((item) => item.id === 'insignia_rank_' + (index + 1) + '_' + rank.id);
                    const recompensas = RANK_REWARDS[rank.id] || [];
                    const aceso = 'var(--skin-accent-color)';
                    const apagado = 'rgba(255,255,255,0.10)';

                    return (
                        <li key={rank.id} className="relative pb-2 pl-[68px]">
                            {/* O trilho, em pedacos: do topo ate o centro do medalhao,
                                e do centro ate o fim do degrau. Cada pedaco acende
                                sozinho, entao a linha nunca descola do cartao. */}
                            {index > 0 && (
                                <span
                                    className="absolute w-[2px]"
                                    style={{ left: RAIL_LEFT, top: 0, height: MEDAL_CENTER, background: alcancada ? aceso : apagado }}
                                />
                            )}
                            {index < nobilityRanks.length - 1 && (
                                <span
                                    className="absolute bottom-0 w-[2px]"
                                    style={{ left: RAIL_LEFT, top: MEDAL_CENTER, background: proximaAlcancada ? aceso : apagado }}
                                />
                            )}

                            <div
                                className={'absolute left-0 top-3 h-14 w-14 overflow-hidden rounded-full border-2 bg-[#0a0c11] ' + (atual ? 'shadow-[0_0_0_4px_rgba(0,0,0,0.55)]' : '')}
                                style={{ borderColor: alcancada ? aceso : 'rgba(255,255,255,0.14)' }}
                            >
                                {insignia?.imageUrl ? (
                                    <img
                                        src={insignia.imageUrl}
                                        alt={insignia.name}
                                        className={'h-full w-full object-cover ' + (alcancada ? '' : 'opacity-45 grayscale')}
                                    />
                                ) : (
                                    <span className={'flex h-full w-full items-center justify-center text-xl ' + (alcancada ? '' : 'opacity-45 grayscale')}>
                                        {insignia?.icon || '🏅'}
                                    </span>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => handleToggle(rank.id, alcancada)}
                                aria-expanded={aberta}
                                className={'relative block w-full overflow-hidden rounded-2xl border text-left transition-colors ' + (atual ? 'border-[color:var(--skin-accent-color)]' : 'border-white/10')}
                            >
                                <div className="absolute inset-0">
                                    <ProfileBackgroundSurface
                                        value={getRankBackgroundToken(rank.id)}
                                        className={'h-full w-full object-cover ' + (alcancada ? '' : 'opacity-60 grayscale-[0.5]')}
                                        alt=""
                                    />
                                </div>
                                {/* Escurece forte a esquerda, onde o texto mora, e solta a
                                    direita, onde a imagem tem que aparecer. */}
                                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,7,10,0.94)_0%,rgba(6,7,10,0.82)_46%,rgba(6,7,10,0.42)_100%)]" />

                                <div className="relative px-3 py-3">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="truncate text-[15px] font-black uppercase tracking-[0.04em] text-white">
                                            {rank.name}
                                        </span>
                                        <span className="shrink-0 text-[11px] font-black tabular-nums text-white/72">
                                            {index === 0 ? 'início' : num(rank.expTotalRequired) + ' EXP'}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/50">
                                        {atual
                                            ? 'Você está aqui'
                                            : alcancada
                                                ? 'Conquistada'
                                                : 'faltam ' + num(Math.max(0, rank.expTotalRequired - exp)) + ' EXP'}
                                    </p>

                                    {aberta && (
                                        <div className="mt-2.5 border-t border-white/12 pt-2.5">
                                            <div className="flex flex-wrap gap-1.5">
                                                {recompensas.map((reward) => (
                                                    <span
                                                        key={reward.itemId}
                                                        className="rounded-full border border-white/14 bg-black/45 px-2 py-1 text-[10px] font-bold text-white/78"
                                                    >
                                                        {reward.name}
                                                    </span>
                                                ))}
                                                <span
                                                    className="rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em]"
                                                    style={{ borderColor: aceso, color: aceso }}
                                                >
                                                    Fundo {rank.name}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};
