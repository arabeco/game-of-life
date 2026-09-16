import type React from 'react';

/**
 * AS CORES DA PLACA DO LEGADO.
 *
 * A cor da placa era derivada: quem estava em D via placa cinza e nao podia
 * fazer nada a respeito, num objeto que existe justamente para ser mostrado.
 * Agora e escolha, e o patamar virou apenas o PADRAO — quem nao escolhe nada
 * continua vendo a cor do proprio degrau.
 *
 * Cada paleta traz o conjunto inteiro: campo, chapa, brilho de topo, moldura,
 * cor dos rotulos e o par metalico do texto. Nao e filtro de cor por cima da
 * placa dourada; e outra liga. Por isso `metalClaro`/`metalMedio` andam junto —
 * o nome em serif e preenchido com um gradiente recortado na forma das letras,
 * e ele precisa ser da mesma familia do metal da moldura para nao brigar.
 */
export interface LegacyPlaqueColor {
  id: string;
  name: string;
  /** Fundo do corpo da placa. */
  field: string;
  /** Fundo das chapas menores (nivel, patamar). */
  plate: string;
  /** Luz que nasce no topo, por dentro. */
  glow: string;
  /** Moldura externa, a linha grossa. */
  trim: string;
  /** Moldura interna e divisorias, a linha fina. */
  trimSoft: string;
  /** Cor dos rotulos pequenos. */
  label: string;
  metalLight: string;
  metalMid: string;
}

export const LEGACY_PLAQUE_COLORS: LegacyPlaqueColor[] = [
  {
    id: 'vinho', name: 'Vinho',
    field: 'linear-gradient(168deg,#2e1020 0%,#1b0813 55%,#0b0308 100%)',
    plate: 'linear-gradient(168deg,#3a1428,#170710)',
    glow: 'rgba(255,196,150,.12)',
    trim: 'rgba(226,182,120,.75)', trimSoft: 'rgba(226,182,120,.38)', label: 'rgba(233,199,146,.78)',
    metalLight: '#f3ddb2', metalMid: '#b9873f',
  },
  {
    id: 'ouro', name: 'Ouro',
    field: 'linear-gradient(168deg,#2a2110 0%,#171105 55%,#080501 100%)',
    plate: 'linear-gradient(168deg,#3a2d13,#171105)',
    glow: 'rgba(255,220,140,.14)',
    trim: 'rgba(240,208,132,.8)', trimSoft: 'rgba(240,208,132,.4)', label: 'rgba(244,215,150,.8)',
    metalLight: '#fbeec6', metalMid: '#c8a04e',
  },
  {
    id: 'violeta', name: 'Violeta',
    field: 'linear-gradient(168deg,#241433 0%,#150b20 55%,#07040c 100%)',
    plate: 'linear-gradient(168deg,#301a45,#150b20)',
    glow: 'rgba(214,180,255,.14)',
    trim: 'rgba(214,184,250,.7)', trimSoft: 'rgba(214,184,250,.34)', label: 'rgba(214,184,250,.76)',
    metalLight: '#f0e2ff', metalMid: '#a87fdd',
  },
  {
    id: 'esmeralda', name: 'Esmeralda',
    field: 'linear-gradient(168deg,#0d2a20 0%,#071a13 55%,#020806 100%)',
    plate: 'linear-gradient(168deg,#123829,#071a13)',
    glow: 'rgba(150,255,206,.13)',
    trim: 'rgba(150,226,186,.7)', trimSoft: 'rgba(150,226,186,.34)', label: 'rgba(160,232,194,.76)',
    metalLight: '#dcf7e9', metalMid: '#5aa885',
  },
  {
    id: 'safira', name: 'Safira',
    field: 'linear-gradient(168deg,#0e1f3a 0%,#071228 55%,#020510 100%)',
    plate: 'linear-gradient(168deg,#152b4e,#071228)',
    glow: 'rgba(150,196,255,.14)',
    trim: 'rgba(150,190,246,.7)', trimSoft: 'rgba(150,190,246,.34)', label: 'rgba(162,198,250,.78)',
    metalLight: '#dbe9ff', metalMid: '#5d86c8',
  },
  {
    id: 'rubi', name: 'Rubi',
    field: 'linear-gradient(168deg,#331016 0%,#1e070c 55%,#0b0204 100%)',
    plate: 'linear-gradient(168deg,#43151d,#1e070c)',
    glow: 'rgba(255,164,164,.13)',
    trim: 'rgba(236,158,152,.72)', trimSoft: 'rgba(236,158,152,.35)', label: 'rgba(240,170,164,.78)',
    metalLight: '#ffe0da', metalMid: '#c06a62',
  },
  {
    id: 'ferro', name: 'Ferro',
    field: 'linear-gradient(168deg,#191b20 0%,#0d0f12 58%,#050607 100%)',
    plate: 'linear-gradient(168deg,#23262c,#101215)',
    glow: 'rgba(210,218,228,.1)',
    trim: 'rgba(206,214,224,.62)', trimSoft: 'rgba(206,214,224,.3)', label: 'rgba(206,214,224,.66)',
    metalLight: '#dfe6ee', metalMid: '#8d97a3',
  },
  {
    id: 'onix', name: 'Ônix',
    field: 'linear-gradient(168deg,#16181c 0%,#0a0b0d 55%,#030304 100%)',
    plate: 'linear-gradient(168deg,#1e2126,#0a0b0d)',
    glow: 'rgba(255,255,255,.07)',
    trim: 'rgba(236,238,242,.5)', trimSoft: 'rgba(236,238,242,.22)', label: 'rgba(236,238,242,.6)',
    metalLight: '#f2f4f8', metalMid: '#7d838c',
  },
];

/**
 * A COR NAO TEM NADA A VER COM PATAMAR, NIVEL OU DESEMPENHO.
 *
 * Houve uma versao em que ela seguia o degrau — D cinza, A dourado, S violeta.
 * A ideia era que desse para ler o patamar de longe, e o efeito era outro: a
 * cor da placa deixava de ser da pessoa e virava um cracha do quanto ela estava
 * indo bem. Quem estivesse mal levava placa apagada, num objeto que existe
 * justamente para ser mostrado.
 *
 * Cor e enfeite, e enfeite e escolha. O padrao existe so para quem ainda nao
 * escolheu nada.
 */
export const DEFAULT_LEGACY_PLAQUE_COLOR_ID = 'vinho';

const byId = new Map(LEGACY_PLAQUE_COLORS.map((color) => [color.id, color]));

/**
 * A paleta a usar. Valor ausente ou desconhecido cai no padrao em vez de
 * quebrar: a lista vai crescer, e um perfil gravado com uma cor que ainda nao
 * existe neste aparelho (app desatualizado) precisa continuar desenhando.
 */
export const getLegacyPlaqueColor = (chosenId?: string | null): LegacyPlaqueColor =>
  byId.get(String(chosenId || '')) || byId.get(DEFAULT_LEGACY_PLAQUE_COLOR_ID) || LEGACY_PLAQUE_COLORS[0];

/** As variaveis CSS que a placa consome. Uma fonte so para as duas pontas. */
export const legacyPlaqueColorVars = (color: LegacyPlaqueColor): React.CSSProperties => ({
  ['--placa-campo' as string]: color.field,
  ['--placa-chapa' as string]: color.plate,
  ['--placa-brilho' as string]: color.glow,
  ['--placa-aro' as string]: color.trim,
  ['--placa-aro-fraco' as string]: color.trimSoft,
  ['--placa-rotulo' as string]: color.label,
  ['--placa-metal-claro' as string]: color.metalLight,
  ['--placa-metal-medio' as string]: color.metalMid,
});
