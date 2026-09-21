import React from 'react';
import { ReportAtlasWeek } from '../types';
import { getPlateFinish } from './MetalReportCard';

/**
 * O CICLO INTEIRO, UM DIA POR BARRA.
 *
 * O Atlas mostrava a AGENDA: colunas de dia com cada tarefa posicionada na hora
 * em que foi marcada, grade de horas ao lado. E a visao certa para planejar — e a
 * errada para um quadro de 190px de altura numa apresentacao que passa sozinha.
 * Ali aquilo vira textura ilegivel, e o slide que deveria responder "que forma
 * teve o ciclo?" nao respondia nada.
 *
 * Uma barra por dia responde de um golpe de vista: onde emendou, onde furou,
 * onde foi o pico. E o pico aparece SEM ROTULO de proposito — a Execucao ja
 * nomeia o melhor dia no rodape dela. Aqui ele e a barra mais alta, e a pessoa
 * acha sozinha. Um numero aparece uma vez; um FATO pode aparecer duas, desde que
 * de formas diferentes.
 *
 * O planejado fica como sombra atras do feito. Sem ele, um dia de 3/3 e um dia
 * de 3/9 desenham a mesma barra, e o grafico elogiaria os dois igual.
 */

interface GraficoDeDiasDoCicloProps {
    weeks: ReportAtlasWeek[];
    /** A nota do ciclo: e dela que vem o acabamento, como em todo quadro. */
    rank: string;
}

const ALTURA = 190;
/** Abaixo disto a barra some e o dia parece nao ter existido. */
const PISO_DO_FEITO = 3;

export const GraficoDeDiasDoCiclo: React.FC<GraficoDeDiasDoCicloProps> = ({ weeks, rank }) => {
    const acabamento = getPlateFinish(rank);

    const dias = (weeks || []).flatMap((semana, indiceDaSemana) => (
        (semana.days || []).map((dia) => ({
            date: dia.date,
            feito: Math.max(0, dia.completedCount || 0),
            planejado: Math.max(0, dia.plannedCount || 0),
            semana: indiceDaSemana,
        }))
    ));

    if (dias.length === 0) {
        return (
            <div
                className="flex w-full items-center justify-center text-[10px] font-black uppercase tracking-[0.2em]"
                style={{ height: ALTURA, color: `${acabamento.pale}44` }}
            >
                sem dias registrados
            </div>
        );
    }

    // A escala olha o planejado tambem: se so olhasse o feito, um ciclo cumprido
    // pela metade desenharia barras cheias e pareceria um ciclo inteiro.
    const teto = Math.max(1, ...dias.map((dia) => Math.max(dia.feito, dia.planejado)));
    const diasComEntrega = dias.filter((dia) => dia.feito > 0);
    const media = diasComEntrega.length > 0
        ? diasComEntrega.reduce((soma, dia) => soma + dia.feito, 0) / diasComEntrega.length
        : 0;
    const pico = Math.max(...dias.map((dia) => dia.feito));

    // Com muitos dias a barra fica fina demais para ter cantos; o arredondamento
    // some e sobra uma serra. Abaixo de 2px de raio nao vale o desenho.
    const finas = dias.length > 21;

    return (
        // A ALTURA MORA NAS BARRAS, E NAO NO INVOLUCRO.
        // Com ela aqui em cima, qualquer coisa desenhada abaixo das barras
        // vazava para fora da caixa e caia por cima do rotulo do cartaz.
        <div className="w-full select-none">
            <div className="relative flex items-end" style={{ height: ALTURA, gap: finas ? 1 : 2 }}>
                {/* A MEDIA DOS DIAS QUE TIVERAM ENTREGA.
                    Nao e meta nem cobranca: e a regua que faz a barra alta parecer
                    alta. Sem ela o grafico e so um contorno, e nenhum dia se
                    destaca de nada. */}
                {media > 0 && (
                    <div
                        className="pointer-events-none absolute left-0 right-0 z-[1]"
                        style={{
                            bottom: `${(media / teto) * 100}%`,
                            borderTop: `1px dashed ${acabamento.mid}3d`,
                        }}
                    />
                )}

                {dias.map((dia, indice) => {
                    const alturaFeito = dia.feito > 0
                        ? Math.max(PISO_DO_FEITO, (dia.feito / teto) * ALTURA)
                        : 0;
                    const alturaPlano = dia.planejado > 0 ? (dia.planejado / teto) * ALTURA : 0;
                    const ehPico = pico > 0 && dia.feito === pico;
                    // A virada de semana vira um respiro, e nao um risco: numa
                    // barra de 4px de largura um separador de 1px compete com o
                    // proprio dado.
                    const viradaDeSemana = indice > 0 && dia.semana !== dias[indice - 1].semana;

                    return (
                        <div
                            key={`${dia.date}-${indice}`}
                            className="relative flex-1"
                            style={{ height: ALTURA, marginLeft: viradaDeSemana ? (finas ? 3 : 5) : undefined }}
                        >
                            {/* O PLANEJADO, ATRAS. */}
                            {alturaPlano > 0 && (
                                <div
                                    className="absolute bottom-0 left-0 right-0"
                                    style={{
                                        height: alturaPlano,
                                        borderRadius: finas ? 1 : 2,
                                        background: `${acabamento.mid}1f`,
                                    }}
                                />
                            )}

                            {/* O DIA ZERADO NAO FICA VAZIO.
                                Um espaco em branco se le como "nao tinha nada
                                marcado". O tracinho no chao diz que o dia
                                existiu — e so quando havia plano, porque dia sem
                                plano nenhum nao e falha de ninguem. */}
                            {dia.feito === 0 && dia.planejado > 0 && (
                                <div
                                    className="absolute bottom-0 left-0 right-0"
                                    style={{ height: 2, background: `${acabamento.dark}`, opacity: 0.9 }}
                                />
                            )}

                            {/* O FEITO, NA FRENTE. */}
                            {alturaFeito > 0 && (
                                <div
                                    className="absolute bottom-0 left-0 right-0 z-[2] transition-[height] duration-700 ease-out"
                                    style={{
                                        height: alturaFeito,
                                        borderRadius: finas ? 1 : 2,
                                        background: ehPico
                                            ? `linear-gradient(180deg, #fff8ea, ${acabamento.pale})`
                                            : `linear-gradient(180deg, ${acabamento.pale}, ${acabamento.mid})`,
                                        boxShadow: ehPico ? `0 0 10px ${acabamento.pale}88` : undefined,
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* O CHAO DO GRAFICO.
                Sem ele as barras flutuam e o dia zerado nao tem de onde nao
                subir. Nao leva texto: o que o desenho quer dizer e o `rotulo` do
                proprio cartaz, que fica logo abaixo — duas legendas empilhadas
                dizendo a mesma coisa era o que havia aqui antes. */}
            <div className="mt-1.5" style={{ borderTop: `1px solid ${acabamento.mid}40` }} />
        </div>
    );
};
