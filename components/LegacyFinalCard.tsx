import { getLegacyCycleGrade } from '../utils/cycleGrade.js';
﻿import React, { useMemo } from 'react';
import type { ReportIdentitySnapshot } from '../types';
import { getScoreGrade } from '../utils/dateUtils';
import { getEraRibbonSkin } from './EraRibbon';
import { getMetalRankPalette } from './MetalReportCard';
import { LegacyGrandPlaque } from './LegacyGrandPlaque';
import type { LegacyEraSummary } from './LegacyExportDocument';
import './legacy-ui.css';

/**
 * O QUADRO FINAL: TODOS OS CICLOS DE UMA VEZ.
 *
 * A projecao mostra um ciclo por vez, e por isso nao serve como imagem para
 * compartilhar: quem recebe ve um recorte. A cena panoramica que era exportada
 * ate agora enfileirava os cards lado a lado em 1720px e, passando de umas nove
 * voltas, simplesmente CORTAVA o resto — o legado de quem mais tem era o que
 * menos aparecia.
 *
 * Aqui cada ciclo e uma BARRA: altura pelo score, cor pelo metal do patamar,
 * agrupadas pela era. Isso resolve o "e se tiver varios" de um jeito que
 * enfileirar cards nunca resolve — o desenho muda de DENSIDADE, nao de tamanho.
 * Tres ciclos viram tres colunas largas; quarenta viram uma serra fina, que e
 * exatamente o que quarenta ciclos sao: uma forma, com altos e baixos, e nao
 * quarenta fichas para ler uma a uma.
 *
 * O que nao cabe em barra — nome, datas, arena — ja esta no historico. Este
 * quadro e a vista de cima.
 */

const LARGURA_DA_FITA = 326;
const ALTURA_DA_FITA = 96;
const PISO_DA_BARRA = 0.16;
const LARGURA_MAXIMA_DA_BARRA = 44;

const espacamentoDaFita = (quantidade: number) => {
    if (quantidade <= 1) return 0;
    const desejado = quantidade > 28 ? 1 : quantidade > 14 ? 2 : 4;
    // Com muitos ciclos o vao chega a comer mais largura que as proprias barras.
    return Math.min(desejado, LARGURA_DA_FITA / (quantidade * 4));
};

const formatarPeriodo = (iso?: string | null) => {
    const data = iso ? new Date(`${String(iso).slice(0, 10)}T12:00:00`) : null;
    if (!data || Number.isNaN(data.getTime())) return '';
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[data.getMonth()]} ${data.getFullYear()}`;
};

interface LegacyFinalCardProps {
    id?: string;
    eras: LegacyEraSummary[];
    sovereignName: string;
    identity?: ReportIdentitySnapshot;
    /** Largura do quadro. O padrao acompanha o palco da cena. */
    width?: number;
    /** Cor da placa escolhida no perfil. */
    plaqueColorId?: string;
}

export const LegacyFinalCard: React.FC<LegacyFinalCardProps> = ({
    id,
    eras,
    sovereignName,
    identity,
    width = 390,
    plaqueColorId,
}) => {
    const ciclos = useMemo(
        () => eras.flatMap((era) => (era.cycles || []).map((cycle) => ({ era, cycle }))),
        [eras],
    );

    const resumo = useMemo(() => {
        if (!ciclos.length) return null;
        const scores = ciclos.map(({ cycle }) => Math.max(0, Number(cycle.score) || 0));
        const melhor = ciclos.reduce((alto, atual) => (
            (Number(atual.cycle.score) || 0) > (Number(alto.cycle.score) || 0) ? atual : alto
        ), ciclos[0]);
        return {
            medio: Math.round(scores.reduce((soma, valor) => soma + valor, 0) / scores.length),
            melhor,
            inicio: ciclos[0].cycle.startDate,
            fim: ciclos[ciclos.length - 1].cycle.endDate,
            sequencia: eras.reduce((maior, era) => Math.max(maior, Number(era.bestStreak) || 0), 0),
        };
    }, [ciclos, eras]);

    if (!ciclos.length || !resumo) return null;

    const vao = espacamentoDaFita(ciclos.length);
    // Teto na barra: com um ou dois ciclos, dividir a fita inteira entre eles
    // produz lajes, e a laje nao le como ciclo. Passando de sete ciclos o teto
    // deixa de valer sozinho, porque a divisao ja da menos que isso.
    const larguraDaBarra = Math.min(
        LARGURA_MAXIMA_DA_BARRA,
        (LARGURA_DA_FITA - (vao * (ciclos.length - 1))) / ciclos.length,
    );
    const larguraOcupada = (larguraDaBarra * ciclos.length) + (vao * (ciclos.length - 1));
    const recuo = Math.max(0, (LARGURA_DA_FITA - larguraOcupada) / 2);
    const mostraPatamar = larguraDaBarra >= 15;

    /*
     * AS MARCAS DE TEMPO DA FITA.
     *
     * Sem elas a fita diz a forma do legado mas nao diz QUANDO — quarenta barras
     * podem ser quarenta meses ou quatro anos. Rotular todas e impossivel a
     * partir de meia duzia de ciclos, entao ficam as que situam: o comeco, o fim,
     * e cada virada de ano no meio.
     *
     * A folga minima entre marcas evita que duas viradas proximas se escrevam por
     * cima uma da outra; quando isso acontece, some a do meio — o comeco e o fim
     * nunca somem, porque sao eles que dao a escala.
     */
    const FOLGA_ENTRE_MARCAS = 52;
    const marcas: { x: number; texto: string; ancora: 'inicio' | 'centro' | 'fim' }[] = [];
    ciclos.forEach(({ cycle }, index) => {
        if (index === 0) return;
        const anoAtual = new Date(`${String(cycle.startDate).slice(0, 10)}T12:00:00`).getFullYear();
        const anoAnterior = new Date(`${String(ciclos[index - 1].cycle.startDate).slice(0, 10)}T12:00:00`).getFullYear();
        if (!Number.isFinite(anoAtual) || anoAtual === anoAnterior) return;
        const x = recuo + (index * (larguraDaBarra + vao)) + (larguraDaBarra / 2);
        const anterior = marcas[marcas.length - 1];
        if (anterior && x - anterior.x < FOLGA_ENTRE_MARCAS) return;
        marcas.push({ x, texto: formatarPeriodo(cycle.startDate), ancora: 'centro' });
    });
    const marcaInicial = { x: recuo, texto: formatarPeriodo(resumo.inicio), ancora: 'inicio' as const };
    const marcaFinal = { x: recuo + larguraOcupada, texto: formatarPeriodo(resumo.fim), ancora: 'fim' as const };
    const marcasVisiveis = [
        marcaInicial,
        ...marcas.filter((marca) => (
            marca.x - marcaInicial.x >= FOLGA_ENTRE_MARCAS
            && marcaFinal.x - marca.x >= FOLGA_ENTRE_MARCAS
        )),
        ...(marcaFinal.x - marcaInicial.x >= FOLGA_ENTRE_MARCAS ? [marcaFinal] : []),
    ];

    // Onde cada era comeca e termina dentro da fita, para a faixa embaixo cobrir
    // exatamente os ciclos daquele periodo.
    const faixas: { era: LegacyEraSummary; inicio: number; largura: number; ciclos: number }[] = [];
    ciclos.forEach(({ era }, index) => {
        const anterior = faixas[faixas.length - 1];
        const x = recuo + (index * (larguraDaBarra + vao));
        if (anterior && anterior.era.key === era.key) {
            anterior.largura = x + larguraDaBarra - anterior.inicio;
            anterior.ciclos += 1;
            return;
        }
        faixas.push({ era, inicio: x, largura: larguraDaBarra, ciclos: 1 });
    });

    return (
        <div
            id={id}
            className="legacy-final-card relative overflow-hidden text-white"
            style={{ width: `${width}px` }}
        >
            <div className="relative z-10 flex flex-col items-center px-5 pb-6 pt-6">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--skin-accent-color)]">
                    Legado
                </p>
                <h2 className="mt-1.5 text-center text-[1.4rem] font-black leading-none tracking-tight text-white">
                    {identity?.nickname?.trim() || sovereignName}
                </h2>
                {/* O periodo saiu daqui: ele agora e o eixo da fita, onde tem
                    contexto. Escrito duas vezes, o de cima era so enfeite. */}
                <div className="mt-5 w-full">
                    <LegacyGrandPlaque
                        eras={eras}
                        sovereignName={sovereignName}
                        identity={identity}
                        plaqueColorId={plaqueColorId}
                        compact
                        portrait
                    />
                </div>

                {/* A FITA */}
                <div className="mt-5 w-full rounded-[20px] border border-white/10 bg-black/35 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <div className="flex items-baseline justify-between">
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45">
                            {ciclos.length} {ciclos.length === 1 ? 'ciclo' : 'ciclos'}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45">
                            {faixas.length} {faixas.length === 1 ? 'era' : 'eras'}
                        </p>
                    </div>

                    <div
                        className="relative mt-2.5"
                        style={{ width: `${LARGURA_DA_FITA}px`, height: `${ALTURA_DA_FITA}px` }}
                    >
                        {/* Linha de base: sem ela as barras baixas flutuam. */}
                        <div className="absolute inset-x-0 bottom-0 h-px bg-white/12" />

                        {ciclos.map(({ era, cycle }, index) => {
                            const score = Math.max(0, Math.min(100, Number(cycle.score) || 0));
                            const grade = getLegacyCycleGrade(cycle).grade;
                            const metal = getMetalRankPalette(grade);
                            const skin = getEraRibbonSkin(era.skinId);
                            // O piso existe para o ciclo ruim continuar existindo no
                            // desenho: barra de altura zero le como ciclo que nao houve.
                            const altura = (PISO_DA_BARRA + ((score / 100) * (1 - PISO_DA_BARRA))) * ALTURA_DA_FITA;

                            return (
                                <div
                                    key={cycle.id || `${era.key}-${index}`}
                                    className="absolute bottom-0 overflow-hidden rounded-t-[3px]"
                                    style={{
                                        left: `${recuo + (index * (larguraDaBarra + vao))}px`,
                                        width: `${larguraDaBarra}px`,
                                        height: `${altura}px`,
                                        background: `linear-gradient(180deg, ${metal.highlight} 0%, ${metal.base} 42%, ${metal.baseDeep} 100%)`,
                                        boxShadow: `inset 0 1px 0 ${metal.trim}55, 0 0 10px ${skin.edge}1f`,
                                    }}
                                    title={`${cycle.name || 'Ciclo'} · ${grade} · ${score}`}
                                >
                                    {mostraPatamar && (
                                        <span
                                            className="absolute inset-x-0 top-[3px] text-center text-[8px] font-black leading-none"
                                            style={{ color: metal.text, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                                        >
                                            {grade}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* As eras por baixo, cobrindo exatamente os ciclos do periodo. */}
                    <div className="relative mt-1.5 h-[15px]" style={{ width: `${LARGURA_DA_FITA}px` }}>
                        {faixas.map((faixa, index) => {
                            const skin = getEraRibbonSkin(faixa.era.skinId);
                            // Era unica ocupa a fita toda: ela nao esta dividindo o
                            // periodo com ninguem, e uma faixa da largura de uma barra
                            // so serviria para cortar o proprio nome.
                            const sozinha = faixas.length === 1;
                            const esquerda = sozinha ? 0 : faixa.inicio;
                            const largura = sozinha ? LARGURA_DA_FITA : faixa.largura;
                            // Abaixo disto o nome sai truncado, e "FUND..." e pior que
                            // faixa sem nome — o titulo continua no title do elemento.
                            const cabeORotulo = largura >= 50;
                            return (
                                <div
                                    key={faixa.era.key || `${faixa.era.label}-${index}`}
                                    className="absolute top-0 flex h-full items-center justify-center overflow-hidden rounded-[4px]"
                                    style={{
                                        left: `${esquerda}px`,
                                        width: `${largura}px`,
                                        background: `linear-gradient(180deg, ${skin.edge}2e, ${skin.edge}12)`,
                                        boxShadow: `inset 0 0 0 1px ${skin.edge}33`,
                                    }}
                                    title={`${faixa.era.label} · ${faixa.ciclos} ${faixa.ciclos === 1 ? 'ciclo' : 'ciclos'}`}
                                >
                                    {cabeORotulo && (
                                        <span
                                            className="truncate px-1 text-[7.5px] font-black uppercase"
                                            // Com a era curta o espacamento entre letras e a
                                            // primeira coisa a sacrificar: ele custa largura e
                                            // nao carrega informacao.
                                            style={{ color: skin.edge, letterSpacing: largura >= 64 ? '0.16em' : '0.04em' }}
                                        >
                                            {faixa.era.label}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="relative mt-1.5 h-[11px]" style={{ width: `${LARGURA_DA_FITA}px` }}>
                        {marcasVisiveis.map((marca) => (
                            <span
                                key={`${marca.ancora}-${marca.x}-${marca.texto}`}
                                className="absolute top-0 whitespace-nowrap text-[8px] font-black uppercase leading-none tracking-[0.12em] text-white/40"
                                style={{
                                    left: `${marca.x}px`,
                                    transform: marca.ancora === 'inicio'
                                        ? 'none'
                                        : marca.ancora === 'fim'
                                            ? 'translateX(-100%)'
                                            : 'translateX(-50%)',
                                }}
                            >
                                {marca.texto}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="mt-3 grid w-full grid-cols-3 gap-2">
                    {[
                        { rotulo: 'Score médio', valor: String(resumo.medio) },
                        { rotulo: 'Melhor ciclo', valor: String(Math.round(Number(resumo.melhor.cycle.score) || 0)) },
                        { rotulo: 'Sequencia', valor: `${resumo.sequencia}d` },
                    ].map((item) => (
                        <div
                            key={item.rotulo}
                            className="rounded-[14px] border border-white/10 bg-black/30 px-2 py-2 text-center"
                        >
                            <p className="text-[7.5px] font-black uppercase tracking-[0.16em] text-white/40">{item.rotulo}</p>
                            <p className="mt-0.5 text-[1rem] font-black leading-none text-white">{item.valor}</p>
                        </div>
                    ))}
                </div>

                <p className="mt-4 text-[8px] font-black uppercase tracking-[0.42em] text-white/25">Glyph</p>
            </div>
        </div>
    );
};
