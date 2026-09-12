import React, { useEffect, useState } from 'react';
import { Portal } from './Portal';
import { AssetPentagon } from './AssetPentagon';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../supabaseClient';
import { LIFE_AREAS, PONTOS_POR_DEGRAU, getMasteryIndexFromLevels } from '../constants/lifeAreas';
import { DIRECOES, REWARD_PLATE_VIEWPORT_STYLE } from '../constants/rewardPlateStyles';

/**
 * O FECHO DA AVALIACAO.
 *
 * O quiz da maestria terminava em nada: a pessoa move cinco niveis, o app grava
 * e volta para Config. Cinco decisoes sobre a propria vida, e nenhum instante
 * para olhar o que elas formam juntas.
 *
 * A TELA USA A PLACA DOS OUTROS MODAIS — a mesma direcao B, o mesmo recorte de
 * botao, a mesma silhueta vertical. Um card generico no meio de um app que tem
 * gramatica visual propria le como tela de sistema, e nao como um momento; a
 * maestria e um momento. Ela nao vira modal de conquista por isso: nao ha video,
 * confete nem premio, porque o numero e AUTO-DECLARADO, e comemorar com a moeda
 * da conquista emprestaria a ele um credito que ele nao tem.
 *
 * O QUE MUDA E O TOM. Os acontecimentos tem cores de raridade — ambar, prata,
 * bronze, verde-agua, ouro. Este usa o azul-guia, o mesmo que o Oraculo reserva
 * para o que nao e vitoria nem cobranca. E exatamente o lugar da maestria: a
 * pessoa se olhou, e o numero pode ter subido ou caido.
 *
 * O QUE DA VALOR e a comparacao. "Ha tres meses voce se via em 52; hoje, 60" e
 * o unico fato que o app tem sobre essa pessoa e que ela nao ve em lugar nenhum
 * — nem no perfil, nem no historico. E vale nos DOIS sentidos: se caiu, tambem e
 * verdade, e aparece sem julgamento. Espelho que so mostra melhora e propaganda.
 */

/** Azul-guia: o tom que o Oraculo usa para orientacao, sem juizo de valor. */
const TOM_DA_MAESTRIA = '159,216,255';

type Retrato = { levels: Record<string, number>; mastery_index: number; taken_at: string };

const formatarData = (iso: string) => {
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(data);
};

/** "ha 3 meses", "ha 12 dias" — o tempo importa mais que a data exata. */
const desdeEntao = (iso: string) => {
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return '';
    const dias = Math.max(0, Math.round((Date.now() - data.getTime()) / 86400000));
    if (dias <= 1) return 'ontem';
    if (dias < 30) return `há ${dias} dias`;
    const meses = Math.round(dias / 30);
    return meses <= 1 ? 'há um mês' : `há ${meses} meses`;
};

export const MasteryResultModal: React.FC<{
    onClose: () => void;
    /**
     * Retrato anterior injetado — existe para a BANCADA. Sem isto so da para
     * olhar o estado de primeira avaliacao, que e metade da tela: a outra metade
     * so aparece para quem ja avaliou antes, e ninguem projeta o que nao ve.
     */
    retratoAnteriorDaBancada?: Retrato;
}> = ({ onClose, retratoAnteriorDaBancada }) => {
    const { assets, userProfile } = useGame();
    const [anterior, setAnterior] = useState<Retrato | null>(null);
    const [carregando, setCarregando] = useState(true);
    const estiloDaPlaca = DIRECOES.B;

    const areas = LIFE_AREAS.filter((area) => assets.some((asset) => asset.id === area.id));
    const niveisAgora = areas.map((area) => Math.max(0, assets.find((a) => a.id === area.id)?.level || 0));
    const indiceAgora = getMasteryIndexFromLevels(niveisAgora);

    useEffect(() => {
        if (retratoAnteriorDaBancada) {
            setAnterior(retratoAnteriorDaBancada);
            setCarregando(false);
            return;
        }
        let parado = false;
        // Os DOIS ultimos: o primeiro e o retrato que acabou de ser gravado, o
        // segundo e com quem ele se compara.
        supabase
            .from('mastery_snapshots')
            .select('levels,mastery_index,taken_at')
            .eq('user_id', userProfile.id)
            .order('taken_at', { ascending: false })
            .limit(2)
            .then(({ data, error }) => {
                if (parado) return;
                setCarregando(false);
                if (error || !data || data.length < 2) return;
                setAnterior(data[1] as Retrato);
            });
        return () => { parado = true; };
    }, [userProfile.id, retratoAnteriorDaBancada]);

    const delta = anterior ? indiceAgora - anterior.mastery_index : 0;

    /**
     * O que mudou, area por area, na escala que a pessoa ve.
     *
     * O Indice pode ficar igual e ainda assim ter havido mudanca: subir dois em
     * Saude e cair dois em Lazer da o mesmo numero no centro. Por isso o titulo
     * nao pode olhar so o delta — dizer "sua maestria mudou" quando nada mudou,
     * ou "e assim que voce se ve hoje" quando duas areas trocaram de lugar, sao
     * os dois jeitos de a tela mentir sobre o proprio assunto.
     */
    const mudancasPorArea = areas
        .map((area) => {
            const agora = Math.max(0, assets.find((a) => a.id === area.id)?.level || 0);
            // `?? agora` e nao `|| agora`: com o zero valendo, um retrato que
            // gravou 0 naquela area e um dado de verdade, e nao ausencia dele.
            const antes = anterior ? Math.max(0, Number(anterior.levels?.[area.id] ?? agora)) : agora;
            return { area, diferenca: (agora - antes) * PONTOS_POR_DEGRAU };
        })
        .filter((entrada) => entrada.diferenca !== 0);

    const houveMudanca = Boolean(anterior) && (delta !== 0 || mudancasPorArea.length > 0);

    return (
        <Portal>
            <div
                className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/92 p-4 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            >
                <div
                    className={`relative flex flex-col overflow-hidden text-[#f5f3ed] ${estiloDaPlaca.respiro}`}
                    style={{ ...REWARD_PLATE_VIEWPORT_STYLE, ...estiloDaPlaca.placa(TOM_DA_MAESTRIA) }}
                    onClick={(event) => event.stopPropagation()}
                >
                    {/* A luz do tom, no topo, como nas outras placas. */}
                    <div
                        className="pointer-events-none absolute left-0 top-0 h-1/2 w-full opacity-25"
                        style={{ background: `radial-gradient(circle at 50% 0%, rgba(${TOM_DA_MAESTRIA},.82) 0%, transparent 70%)` }}
                    />

                    <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center text-center">
                        <p
                            className="text-[9px] font-black uppercase tracking-[0.32em]"
                            style={{ color: `rgba(${TOM_DA_MAESTRIA},.72)` }}
                        >
                            Avaliação de maestria
                        </p>
                        <h2 className="mt-2 text-[22px] font-black uppercase leading-[1.1] tracking-[0.06em] text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.8)]">
                            {houveMudanca ? 'Sua maestria mudou' : 'É assim que você se vê hoje'}
                        </h2>

                        <div className="mt-7 flex justify-center">
                            {/* A placa encolhe em aparelho baixo (o maxHeight do
                                viewport da placa manda). Um pentagono de altura
                                fixa nao encolhe junto e vaza pelo recorte, que
                                corta sem avisar — o svh amarra os dois. */}
                            <AssetPentagon assets={assets} size="min(232px, 30svh)" destacarPontas />
                        </div>

                        {/* ALTURA RESERVADA: a comparacao vem do banco e chega
                            depois do resto. Sem isto o botao nasce logo abaixo do
                            pentagono e desce um instante depois, embaixo do dedo
                            de quem ja estava indo tocar. */}
                        <div className="mt-2 min-h-[92px]">
                            {/* O ANTES, quando existe. Uma linha, sem adjetivo: o
                                numero anterior, o de agora e a diferenca —
                                inclusive negativa. */}
                            {!carregando && anterior && (
                                <p className="text-[12.5px] leading-snug text-white/70">
                                    {desdeEntao(anterior.taken_at)} você se via em{' '}
                                    <span className="font-black text-white">{anterior.mastery_index}</span>. Hoje,{' '}
                                    <span className="font-black text-white">{indiceAgora}</span>
                                    {delta !== 0 && (
                                        <span className={delta > 0 ? 'text-emerald-300' : 'text-amber-300'}>
                                            {' '}({delta > 0 ? '+' : ''}{delta})
                                        </span>
                                    )}
                                    .
                                </p>
                            )}

                            {/* Area por area, so o que MUDOU. Listar as cinco com
                                "0" ao lado de tres delas vira tabela. */}
                            {!carregando && anterior && mudancasPorArea.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
                                    {mudancasPorArea.map(({ area, diferenca }) => (
                                        <span
                                            key={area.id}
                                            className="border border-white/12 bg-black/35 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/72"
                                        >
                                            {area.shortName}{' '}
                                            <span className={diferenca > 0 ? 'font-black text-emerald-300' : 'font-black text-amber-300'}>
                                                {diferenca > 0 ? '+' : ''}{diferenca}
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {!carregando && !anterior && (
                                <p className="text-[12.5px] leading-snug text-white/62">
                                    Este é o seu primeiro retrato. Na próxima avaliação ele vira comparação —
                                    e aí dá para ver o que mudou em você, e não só onde você está.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="relative z-10 mt-auto pt-4">
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={onClose}
                                className="luxe-skin-button luxe-brilho flex min-w-[13rem] items-center justify-center px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl transition-transform active:scale-[0.97]"
                                style={{ ...estiloDaPlaca.botao, borderWidth: 2 }}
                            >
                                OK
                            </button>
                        </div>

                        {anterior && (
                            <p className="mt-2.5 text-center text-[9px] tracking-[0.05em] text-white/30">
                                avaliação anterior · {formatarData(anterior.taken_at)}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Portal>
    );
};
