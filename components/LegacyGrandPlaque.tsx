import React from 'react';
import type { ReportIdentitySnapshot } from '../types';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { buildLegacyPlaqueSummary } from './LegacyPlaqueArtifact';
import { UserAvatar } from './UserAvatar';
import { getDisplayLevel } from '../constants/lifeAreas';
import { getLegacyPlaqueColor } from '../constants/legacyPlaqueColors';
import { gradienteMetalico, tintaMetalicaCom } from './MetalReportCard';

interface LegacyGrandPlaqueProps {
    eras: LegacyEraSummary[];
    sovereignName: string;
    identity?: ReportIdentitySnapshot;
    className?: string;
    compact?: boolean;
    banner?: boolean;
    hideSovereignName?: boolean;
    portrait?: boolean;
    /**
     * Cor escolhida no perfil, ou `auto`/ausente para acompanhar o patamar.
     * Ausente tambem cobre a placa de outra pessoa, que nao tem escolha nossa.
     */
    plaqueColorId?: string;
    /** Visits can show the current plaque without inventing private history totals. */
    metricsAvailable?: boolean;
    /** SVG foreignObject captures do not consistently preserve CSS border-image. */
    captureSafe?: boolean;
}

export const LegacyGrandPlaque: React.FC<LegacyGrandPlaqueProps> = ({
    eras,
    sovereignName,
    identity,
    className = '',
    compact = false,
    plaqueColorId,
    metricsAvailable = true,
    captureSafe = false,
}) => {
    const { totalCycles, totalHours, totalActions, activeDays, weightedAverageScore, averageGrade } = buildLegacyPlaqueSummary(eras);
    const nickname = identity?.nickname?.trim() || sovereignName || 'Usuario';
    const patent = identity?.nobilityRankName || identity?.title || 'Vagante';
    // O snapshot guarda a soma crua das areas; o numero que se mostra e o Indice
    // Glyph, o mesmo do cabecalho. A placa mostrava metade do que o cabecalho
    // mostrava para a mesma pessoa.
    const level = getDisplayLevel(identity?.level);
    /*
     * A COR DA PLACA E ESCOLHA, nao consequencia.
     *
     * Ela nao le patamar, nivel nem desempenho: e enfeite, e enfeite e escolha.
     * Ausente, cai no padrao.
     *
     * A paleta entra por valor e nao por classe: o desenho da placa e um
     * empilhamento de gradientes que precisa de VALORES, e trocar a cor por
     * classe exigiria uma copia do empilhamento inteiro por cor.
     */
    const cor = getLegacyPlaqueColor(plaqueColorId);
    const formattedHours = `${Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1)}h`;
    const titleSize = nickname.length > 22 ? 'text-[0.86rem]' : nickname.length > 16 ? 'text-[0.98rem]' : 'text-[1.12rem]';
    /*
     * A PATENTE NAO SE CORTA.
     *
     * Ela saia "ESCU..." na cena. Com as chapas nas pontas a coluna do meio tem
     * ~192px, e os dois fios decorativos ao lado dela eram `w-8 shrink-0`: 64px
     * cravados para enfeite, e o resto para a palavra. Cortar o nome do patamar
     * de alguem para caber um risco e a troca errada.
     *
     * Duas correcoes: o corpo cede ao comprimento, como ja fazia o apelido, e os
     * fios passam a encolher primeiro — enfeite cede antes de conteudo.
     */
    const patentSize = patent.length > 12 ? 'text-[0.58rem]' : patent.length > 9 ? 'text-[0.64rem]' : 'text-[0.72rem]';
    /*
     * A ORDEM E DE LEITURA, nao de importancia.
     *
     * Dois por linha: ciclos e acoes em cima, dias e carga embaixo. Quantidade
     * a esquerda, tempo a direita — o olho desce por uma coluna de contagens e
     * por uma de duracoes, em vez de alternar entre as duas a cada linha.
     */
    const metricItems = [
        { label: 'Ciclos', value: totalCycles },
        { label: 'Acoes', value: totalActions },
        { label: 'Dias', value: activeDays },
        { label: 'Carga', value: formattedHours },
    ];

    /*
     * O DESENHO E A P1 DA BANCADA (docs/drafts/placa-do-legado-lab.html).
     *
     * Campo de cor cheia, moldura DUPLA de cantos cortados, serif com tinta
     * metalica, e tres chapas menores dentro da grande: nivel, os quatro
     * numeros, patamar. Saiu o que so enchia altura — o rotulo "Placa do
     * Legado" no alto (o contexto ja diz o que e) e a linha solta do cla, que
     * agora entra junto da patente.
     *
     * A TINTA METALICA nao e cor de texto: e um gradiente recortado na forma
     * das letras (`background-clip: text`). So funciona em serif pesada, porque
     * o brilho precisa de area para atravessar — por isso o nome e a nota usam
     * Cinzel e os rotulos pequenos continuam em Inter.
     *
     * A placa e HORIZONTAL por encaixe, nao por gosto: ela mora no topo da cena
     * do legado, do quadro final e da tela de conclusao, sempre ocupando a
     * largura e cedendo a altura para o que vem abaixo.
     */
    const molduraCortada = (canto: number) => ({
        clipPath: `polygon(${canto}px 0, calc(100% - ${canto}px) 0, 100% ${canto}px, 100% calc(100% - ${canto}px), calc(100% - ${canto}px) 100%, ${canto}px 100%, 0 calc(100% - ${canto}px), 0 ${canto}px)`,
    });
    const tintaMetalica: React.CSSProperties = tintaMetalicaCom(
        gradienteMetalico(cor.metalMid, cor.metalLight),
        cor.metalLight,
    );
    /*
     * SO A PATENTE.
     *
     * O cla saiu da placa. Ela e o registro da JORNADA — ciclos, carga, dias,
     * patamar —, e cla e vinculo do momento: entra, sai, troca de nome. Numa
     * unica linha sob o titulo, ele disputava espaco com a unica coisa ali que
     * a pessoa construiu sozinha.
     */
    const subtitulo = patent;

    /*
     * OS ROTULOS TEM PISO DE 8px.
     *
     * Estavam em 6.5px: num palco de 390px de largura, num aparelho de verdade,
     * isso e textura e nao palavra — da para ver que ha algo escrito ali e nao
     * da para ler o que e. A placa e feita para ser olhada de perto e
     * compartilhada, entao o que esta escrito precisa sobreviver a uma captura
     * de tela reduzida.
     */
    const chapa = (rotulo: string, conteudo: React.ReactNode, extra?: React.ReactNode) => (
        <div
            className={`relative z-[3] flex shrink-0 flex-col items-center justify-center gap-0.5 ${compact ? 'px-2.5 py-2' : 'px-3.5 py-3'}`}
            style={{
                background: `radial-gradient(ellipse at 50% 0%, ${cor.glow}, transparent 70%), ${cor.plate}`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08)',
                ...molduraCortada(9),
            }}
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[4px]"
                style={{ border: `1px solid ${cor.trimSoft}`, ...molduraCortada(6) }}
            />
            <span className={`${compact ? 'text-[8px]' : 'text-[7.5px]'} font-semibold uppercase tracking-[0.2em]`} style={{ color: cor.label }}>
                {rotulo}
            </span>
            {conteudo}
            {extra}
        </div>
    );

    const chapaDoNivel = chapa(
        'Nível',
        <span
            className={`${compact ? 'text-[1.72rem]' : 'text-[2rem]'} font-bold leading-none tabular-nums`}
            style={{ fontFamily: 'Cinzel, Georgia, serif', ...tintaMetalica }}
        >
            {level}
        </span>,
    );

    /*
     * A DIREITA E A NOTA, SEMPRE.
     *
     * Havia aqui um `identityMode`: na cena do legado, enquanto se anda pelos
     * ciclos, esta chapa virava "Registro" e mostrava a data da captura. O
     * carimbo tomava o lugar da unica letra da placa — e ainda deixava as duas
     * pontas tortas, porque "16/09/2026" e tres vezes mais largo que "A".
     *
     * Nivel a esquerda, nota a direita: dois numeros do mesmo peso, um em cada
     * ponta. A data ja esta na regua do tempo da cena, que e onde data se le.
     */
    const chapaDaNota = chapa(
        'Patamar',
        <span
            className={`${compact ? 'text-[2.05rem]' : 'text-[2.4rem]'} font-bold leading-none`}
            style={{ fontFamily: 'Cinzel, Georgia, serif', ...tintaMetalica }}
        >
            {metricsAvailable ? averageGrade : '—'}
        </span>,
    );

    const bloqueDoNome = (
        <div className="min-w-0 max-w-full text-center">
            <h2
                className={`m-0 truncate font-bold leading-none ${compact ? titleSize : 'text-[1.9rem]'}`}
                style={{ fontFamily: 'Cinzel, Georgia, serif', letterSpacing: '.05em', ...tintaMetalica }}
                title={nickname}
            >
                {nickname}
            </h2>
            <div className={`flex items-center justify-center gap-2.5 ${compact ? 'mt-1.5' : 'mt-2'}`}>
                <span className="h-px w-8 min-w-0 flex-shrink" style={{ background: `linear-gradient(90deg, transparent, ${cor.trimSoft})` }} />
                <p
                    className={`m-0 shrink-0 whitespace-nowrap font-semibold uppercase ${compact ? patentSize : 'text-[0.82rem]'}`}
                    style={{ fontFamily: 'Cinzel, Georgia, serif', letterSpacing: '.2em', ...tintaMetalica }}
                    title={subtitulo}
                >
                    {subtitulo}
                </p>
                <span className="h-px w-8 min-w-0 flex-shrink" style={{ background: `linear-gradient(90deg, ${cor.trimSoft}, transparent)` }} />
            </div>
        </div>
    );

    /*
     * OS QUATRO NUMEROS EM DOIS PARES, E O SCORE POR BAIXO.
     *
     * Em quatro linhas de um so, o bloco ficava alto e estreito e empurrava a
     * placa para cima. Em dois pares ele fica largo e baixo, que e a forma da
     * placa.
     *
     * O SCORE desceu da chapa do patamar para ca, e cresceu. La ele era um
     * numero miudo debaixo da letra — legenda de um simbolo. A letra e o
     * resumo; o score e o dado, e dado mora com dado.
     */
    const grade = (
        <div
            className={`grid w-full min-w-0 items-baseline overflow-hidden ${compact ? 'gap-x-2 gap-y-1' : 'gap-x-3 gap-y-1.5'}`}
            /* minmax(0,auto) e o que deixa a coluna encolher: com `auto` puro
               ela trava no tamanho do conteudo, a grade transborda a faixa e os
               rotulos passam por baixo das chapas. */
            style={{ gridTemplateColumns: 'repeat(4, minmax(0, auto))', justifyContent: 'center' }}
        >
            {metricItems.map((item) => (
                <React.Fragment key={item.label}>
                    <span
                        className={`${compact ? 'text-[8px]' : 'text-[8px]'} truncate text-right font-semibold uppercase tracking-[0.1em]`}
                        style={{ color: cor.label }}
                    >
                        {item.label}
                    </span>
                    <span
                        className={`${compact ? 'text-[1.05rem]' : 'text-[1.08rem]'} whitespace-nowrap font-bold leading-tight tabular-nums`}
                        style={{ fontFamily: 'Cinzel, Georgia, serif', ...tintaMetalica }}
                    >
                        {metricsAvailable ? item.value : '—'}
                    </span>
                </React.Fragment>
            ))}

            <div
                className={`flex items-baseline justify-center gap-2 ${compact ? 'mt-1 pt-1' : 'mt-1.5 pt-1.5'}`}
                style={{ gridColumn: '1 / -1', borderTop: `1px solid ${cor.trimSoft}` }}
            >
                <span
                    className={`${compact ? 'text-[8.5px]' : 'text-[8.5px]'} font-semibold uppercase tracking-[0.2em]`}
                    style={{ color: cor.label }}
                >
                    Score
                </span>
                <span
                    className={`${compact ? 'text-[1.5rem]' : 'text-[1.7rem]'} font-bold leading-none tabular-nums`}
                    style={{ fontFamily: 'Cinzel, Georgia, serif', ...tintaMetalica }}
                >
                    {metricsAvailable ? weightedAverageScore : '—'}
                </span>
            </div>
        </div>
    );

    return (
        <section
            className={`legacy-plaque relative isolate w-full overflow-hidden text-white ${compact ? 'rounded-[6px] px-4 py-3' : 'rounded-[8px] px-5 py-4'} ${className}`}
            style={{
                background: [
                    'repeating-linear-gradient(118deg, rgba(255,255,255,.028) 0 1px, transparent 1px 7px)',
                    `radial-gradient(ellipse at 50% 0%, ${cor.glow}, transparent 62%)`,
                    cor.field,
                ].join(', '),
                boxShadow: '0 24px 50px rgba(0,0,0,.66), inset 0 1px 0 rgba(255,255,255,.07)',
            }}
        >
            {/*
              * A MOLDURA E A MESMA GRAMATICA DA PLACA DE CICLO.
              *
              * La (MetalReportCard) o chanfro e desenhado em SVG e a borda e um
              * gradiente que corre do escuro ao claro varias vezes — e o que faz
              * a moldura parecer metal torneado em vez de linha pintada. Aqui a
              * mesma sequencia de paradas entra por `border-image`, sobre o
              * mesmo recorte de cantos.
              *
              * Sem isso as duas placas do app pareciam de produtos diferentes: a
              * do ciclo com moldura viva, a do legado com um traco chapado.
              */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[4px] z-[5]"
                style={{
                    border: '2px solid transparent',
                    borderImageSource: `linear-gradient(135deg, ${cor.metalMid} 0%, ${cor.metalLight} 8%, ${cor.metalMid} 13%, ${cor.trim} 40%, ${cor.trim} 85%, ${cor.metalLight} 100%)`,
                    borderImageSlice: 1,
                    ...(captureSafe ? {borderImageSource:'none',borderColor:cor.trim} : {}),
                    ...molduraCortada(14),
                }}
            />
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[9px] z-[5]"
                style={{ border: `1px solid ${cor.trimSoft}`, ...molduraCortada(11) }}
            />
            {/*
              * DUAS ARRUMACOES, E O QUE MANDA E A LARGURA QUE SOBRA.
              *
              * COMPACTA (a cena): as pontas correm a altura inteira e o nome vai
              * para dentro da coluna do meio. Antes o nome ficava numa faixa por
              * cima e as chapas comecavam so abaixo dele — elas ocupavam o terco
              * de baixo, e o nivel e a nota, que sao os dois numeros grandes,
              * liam-se afundados, fora do centro da placa.
              *
              * CHEIA (o historico): o nome fica por cima, como sempre esteve. Ele
              * desenha a 1.9rem, e ladeado pelas duas chapas sobraria menos de
              * 210px para ele — um apelido de treze letras ja entraria cortado.
              * O ganho de centralizar os numeros nao paga cortar o nome de quem e
              * dono da placa.
              */}
            {compact ? (
                <div className="relative z-[2] flex w-full items-stretch justify-center gap-2.5">
                    {chapaDoNivel}
                    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2.5">
                        {bloqueDoNome}
                        {grade}
                    </div>
                    {chapaDaNota}
                </div>
            ) : (
                <div className="relative z-[2] flex flex-col items-center gap-3.5">
                    {bloqueDoNome}
                    <div className="flex w-full items-stretch justify-center gap-4">
                        {chapaDoNivel}
                        <div className="flex min-w-0 flex-1 items-center">{grade}</div>
                        {chapaDaNota}
                    </div>
                </div>
            )}
        </section>
    );
};
