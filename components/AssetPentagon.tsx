import React from 'react';
import { Asset } from '../types';
import {
  LIFE_AREAS,
  MASTERY_AREA_MAX_LEVEL,
  MASTERY_INDEX_BASE,
  MASTERY_RAW_TOTAL_MAX_LEVEL,
  MASTERY_TOTAL_MAX_LEVEL,
  PONTOS_POR_DEGRAU,
  getMasteryIndexFromLevels,
} from '../constants/lifeAreas';
import { SvgRadarChart } from './SvgRadarChart';
import { getMasteryBadgeTier } from '../constants/masteryBadgeTiers';
import { getPlateFinish, tintaMetalicaDo } from './MetalReportCard';
import './mastery-badge.css';

interface AssetPentagonProps {
  assets: Asset[];
  tempLevels?: Record<string, number>;
  size?: number | string;
  showCentralLevel?: boolean;
  centralStyle?: 'badge' | 'plain';
  /**
   * Destaca o numero de cada ponta.
   *
   * No perfil o pentagono e um resumo e os numeros sao apoio. Na tela que fecha
   * a avaliacao eles sao o ASSUNTO — a pessoa acabou de escolher os cinco, um a
   * um, e e neles que ela quer se reconhecer.
   */
  destacarPontas?: boolean;
  activeAreaId?: string;
}

export const AssetPentagon: React.FC<AssetPentagonProps> = ({
  assets,
  tempLevels,
  size = 280,
  showCentralLevel = true,
  centralStyle = 'badge',
  destacarPontas = false,
  activeAreaId,
}) => {
  const chartAreas = LIFE_AREAS
    .map((area) => ({ area, asset: assets.find((asset) => asset.id === area.id) }))
    .filter((entry): entry is { area: typeof LIFE_AREAS[number]; asset: Asset } => Boolean(entry.asset));
  const levels = chartAreas.map(({ asset }) => tempLevels?.[asset.id] ?? Math.max(0, asset.level || 0));
  const masteryIndex = getMasteryIndexFromLevels(levels);
  /**
   * A MAESTRIA CRUA, que e a soma das cinco pontas.
   *
   * Ela aparece ESCRITA embaixo do nivel porque o nivel e o dobro dela. Esse
   * dobro ja existiu sozinho e produziu o cabecalho dizendo 72 com a placa do
   * legado dizendo 36 — nao porque a conta estivesse errada, mas porque nada na
   * tela dizia que eram duas grandezas. Com `23/50` logo abaixo do 46, a relacao
   * fica dita em vez de deduzida.
   */
  const maestriaCrua = levels.reduce((soma, nivel) => soma + Math.max(0, nivel), 0);

  /**
   * O ACABAMENTO DA BOLINHA, pela faixa do indice.
   *
   * O metal vem de `getPlateFinish`, a mesma tabela da placa de ciclo — nao ha
   * paleta propria aqui. A faixa escolhe QUAL metal; nenhuma cor e inventada.
   *
   * Vai por variavel CSS em vez de classe por faixa porque sao seis estados
   * vezes quatro cores: como classes seriam vinte e quatro regras dizendo a
   * mesma coisa com valores diferentes.
   */
  const tier = getMasteryBadgeTier(masteryIndex);
  const metal = getPlateFinish(tier.finish);
  const estiloDoMetal = { '--badge-brilho': String(tier.brilho) } as React.CSSProperties;
  /**
   * A tinta do numero e a MESMA de `.metal-report-card__score`.
   *
   * Nao e "parecida com a da placa": e a declaracao da placa, pelo helper que
   * existe para isso. Inventar um dourado proprio aqui seria o terceiro jeito
   * de fazer metal no app.
   */
  const tintaDoNumero = tintaMetalicaDo(metal);
  const labels = chartAreas.map(({ area }) => area.shortName);

  const goldBright = '#d6c38e';
  const goldFill = '#6f5d2f';

  /**
   * A PONTA DE CADA AREA SOBE SOZINHA — E TODA ELA E OURO.
   *
   * Cada vertice chegou a usar o metal da propria faixa: ferro, bronze, prata.
   * Cinco cores diferentes no mesmo desenho faziam o pentagono parecer um
   * grafico categorico, e nao uma insignia. A identidade da peca e o ouro.
   *
   * Entao o que sobe com a faixa e a FORMA: a ponta engorda de leve, o fio
   * fica mais firme, e a partir da metade ganha um halo. A escada continua
   * sendo a mesma do numero do meio, lida sobre a area — nivel 0 a 10 vira 0 a
   * 100 multiplicando por dez, com os cortes caindo em 2,5 / 5 / 7,5 / 9 / 10.
   */
  const pontaDaArea = (_valor: number, index: number) => {
    const nivelDaArea = Math.max(0, Math.min(MASTERY_AREA_MAX_LEVEL, levels[index] ?? 0));
    const faixa = getMasteryBadgeTier(nivelDaArea * 10);
    return {
      r: 3.1 + faixa.borda * 0.22,
      fill: '#0c0d0f',
      stroke: goldBright,
      strokeWidth: 0.4 + faixa.borda * 0.16,
      halo: faixa.anelDuplo ? goldBright : undefined,
      haloR: faixa.coroado ? 1.8 : 1.2,
    };
  };

  /**
   * O PENTAGONO MOSTRA O DEGRAU: de 0 a 10, como a avaliacao pergunta.
   *
   * Houve uma versao com 0 a 20, para as cinco pontas somarem o numero do meio.
   * A conta fechava, mas "estou no vinte em Saude" e um numero que o modelo nao
   * tem. As pontas somam 50 e o centro diz 100 — sao o nivel de uma area e o
   * indice do conjunto, duas coisas, e o `23/50` sob o numero diz isso.
   */
  const pontos = levels.map((nivel) => nivel * PONTOS_POR_DEGRAU);

  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-visible" style={{ height: size }}>
      <SvgRadarChart
        labels={labels}
        maxValue={MASTERY_AREA_MAX_LEVEL * PONTOS_POR_DEGRAU}
        /* SEM BASE INTERNA: o Indice nao parte mais de 50.
           O anel de dentro desenhava o piso que ninguem conquistava. Agora o
           nivel comeca em 0, entao uma area em zero puxa a ponta ate o centro —
           e esta certo: ali nao ha nada mesmo. A figura mordida passou a ser
           informacao em vez de defeito. */
        baseInterna={MASTERY_INDEX_BASE / MASTERY_TOTAL_MAX_LEVEL}
        levels={3}
        height="100%"
        className="drop-shadow-[0_10px_22px_rgba(0,0,0,.46)]"
        /* OS NOMES SAO DOURADOS, e num tom so.
           Chegaram a ter a cor de cada area, e cinco cores diferentes brigavam
           com o ouro do resto da peca: o pentagono virava um grafico categorico
           em vez de uma insignia. A identidade do desenho e o ouro — o que
           distingue as areas e a posicao, que nao muda nunca.

           Um pouco abaixo do `goldBright` das pontas de proposito: o nome e
           moldura, e competir em brilho com o numero do meio tiraria dele a
           hierarquia que ele tem por ser o maior. */
        labelColor="rgba(206,184,131,0.9)"
        /* O contorno assenta a letra. Sem ele o dourado pequeno se perde
           justamente onde cruza uma linha da grade. */
        labelHalo="rgba(6,7,9,0.82)"
        labelSize={3.6}
        labelOffset={destacarPontas ? 13 : 8}
        series={[{
          id: 'area-levels',
          activeIndex: activeAreaId ? chartAreas.findIndex(({ area }) => area.id === activeAreaId) : undefined,
          values: pontos,
          stroke: goldBright,
          fill: goldFill,
          fillOpacity: 0.28,
          strokeWidth: 1.35,
          showDots: true,
          dotRadius: destacarPontas ? 1.5 : 1.8,
          dotFill: '#11110f',
          dotStroke: goldBright,
          pontaDe: pontaDaArea,
          valueLabel: (value) => String(Math.round(value)),
          valueLabelColor: destacarPontas ? '#fff6dd' : '#eee4c8',
          /* 3,6 e nao 2,75: o numero mora DENTRO da ponta, e a 2,75 ele era um
             risco. O nivel de cada area e a informacao que a pessoa vem buscar
             no pentagono — precisa dar pra ler sem aproximar o rosto. */
          valueLabelSize: destacarPontas ? 4.2 : 3.6,
          /* 11 unidades de viewBox, e cada ponto a mais custa caro.
             Este recuo AFASTA o numero da propria bolinha dele: o ponto fica
             onde o valor manda, e so o rotulo e empurrado. Medido no SVG, o
             afastamento e `minimo - 3,4 x nivel da area`, entao com 17 um
             degrau 1 jogava o numero a 13,6 unidades do ponto — numero
             solto, longe da bolinha a que pertence, que foi o que apareceu na
             tela.

             Sem peca nenhuma no centro, o que ocupa o meio e so o numero: 13cqw
             de corpo, e "100" com cerca de 10 de meia-largura. Onze cobre o pior
             caso, que e um vertice na horizontal, e nao mais que isso.

             So vale para area BAIXA: do degrau 4 pra cima o vertice ja passa
             disso por conta propria, e o numero fica colado no ponto. */
          valueLabelMinMagnitude: 11,
          valueLabelWeight: 900,
          valueLabelOffset: destacarPontas ? 6 : 0,
        }]}
      />

      {showCentralLevel ? (
        <div className="mastery-badge-camada pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            /* O NUMERO DEIXA DE TAPAR O DESENHO.
               Era um disco de 62px com fundo 88% opaco, plantado exatamente onde
               as cinco linhas do pentagono se encontram — ou seja, escondia a
               parte que da forma a figura. Agora e um anel: menor, quase
               transparente e desfocado, entao o grafico atravessa por baixo e o
               numero continua legivel.

               E o acabamento dele sobe com a faixa: em 25, 50, 75, 90 e 100 o
               metal troca e a borda ganha anel. O numero sozinho nao marcava
               passagem — 46 e 54 tinham a mesma cara, e subir acontecia sem
               nada acontecer na tela. */
            className={centralStyle === 'plain'
              ? 'flex items-center justify-center'
              /* `--anel` saiu junto com a peca: nao ha mais aro para ligar.
                 `anelDuplo` continua vivo e util, mas agora so nas PONTAS, onde
                 ele decide o halo de cada area. */
              : `mastery-badge${tier.coroado ? ' mastery-badge--coroado' : ''}`}
            style={estiloDoMetal}
          >
            {/* Os DOIS numeros, um debaixo do outro: o nivel e o dobro da
                maestria, e dizer isso custa uma linha de 8px. */}
            <span className="flex flex-col items-center leading-none">
              <span className="mastery-badge-numero" style={tintaDoNumero}>{masteryIndex}</span>
              <span className="mastery-badge-maestria">
                {maestriaCrua}/{MASTERY_RAW_TOTAL_MAX_LEVEL}
              </span>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
