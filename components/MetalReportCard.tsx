import React, { useId } from 'react';
import './metal-report-card.css';

export type MetalReportRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'SS';

interface MetalMetric {
  label: string;
  value: string;
}

interface MetalBadge {
  label: string;
  value?: string;
}

interface MetalDualProgress {
  progress: number;
  time: number;
  progressLabel?: string;
  progressValue?: string;
  timeLabel?: string;
  timeValue?: string;
}

export interface MetalRankPalette {
  rank: MetalReportRank;
  label: string;
  base: string;
  baseDeep: string;
  highlight: string;
  edge: string;
  trim: string;
  glow: string;
  text: string;
}

interface MetalReportCardProps {
  rank: string;
  score?: number;
  title: string;
  subtitle?: string;
  dateRange?: string;
  summary?: string;
  dualProgress?: MetalDualProgress;
  metrics?: MetalMetric[];
  badges?: MetalBadge[];
  compact?: boolean;
  captureId?: string;
  entryFlash?: boolean;
  className?: string;
}

const METAL_RANKS: Record<MetalReportRank, MetalRankPalette> = {
  SS: {
    rank: 'SS',
    label: 'Rubi imperial',
    base: '#9f1738',
    baseDeep: '#240610',
    highlight: '#f09aaf',
    edge: '#ffd86b',
    trim: '#fff5d0',
    glow: 'rgba(180, 35, 65, 0.32)',
    text: '#fbf2ff',
  },
  S: {
    rank: 'S',
    label: 'Violeta imperial',
    base: '#5c2d8f',
    baseDeep: '#100617',
    highlight: '#b785ff',
    edge: '#f1c45b',
    trim: '#fff0c2',
    glow: 'rgba(183, 133, 255, 0.36)',
    text: '#faf0ff',
  },
  A: {
    rank: 'A',
    label: 'Ouro selado',
    base: '#c49b27',
    baseDeep: '#231a07',
    highlight: '#f1cb68',
    edge: '#ffe29a',
    trim: '#fff5d2',
    glow: 'rgba(241, 203, 104, 0.34)',
    text: '#fff7de',
  },
  B: {
    rank: 'B',
    label: 'Prata fria',
    base: '#6d7f97',
    baseDeep: '#0d131b',
    highlight: '#dce6f5',
    edge: '#f7fbff',
    trim: '#ffffff',
    glow: 'rgba(220, 230, 245, 0.28)',
    text: '#f3f8ff',
  },
  C: {
    rank: 'C',
    label: 'Bronze EDC',
    base: '#8e4b24',
    baseDeep: '#1a0d06',
    highlight: '#e0a05f',
    edge: '#f5c18e',
    trim: '#fbe0c2',
    glow: 'rgba(224, 160, 95, 0.28)',
    text: '#fde8d7',
  },
  D: {
    rank: 'D',
    label: 'Aco azulado',
    base: '#3d5265',
    baseDeep: '#071019',
    highlight: '#83aac7',
    edge: '#d6e7f2',
    trim: '#f2f8fc',
    glow: 'rgba(131, 170, 199, 0.24)',
    text: '#edf5fb',
  },
  E: {
    rank: 'E',
    label: 'Ferro carbonico',
    base: '#47403a',
    baseDeep: '#090807',
    highlight: '#8f7b68',
    edge: '#d2c1af',
    trim: '#efe6dc',
    glow: 'rgba(143, 123, 104, 0.2)',
    text: '#f0e7dd',
  },
};

export const getMetalRankPalette = (rank: string): MetalRankPalette => {
  const normalized = (rank || 'D').toUpperCase() as MetalReportRank;
  return METAL_RANKS[normalized] || METAL_RANKS.D;
};

// Finishes belong to the plate; the shared rank palette also serves other legacy UI.
export interface PlateFinish { mid: string; pale: string; dark: string; face: string; filter: string }

/*
 * O ACABAMENTO POR PATAMAR E PUBLICO.
 *
 * Ele nasceu dentro desta placa, mas nao e dela: e a cor do RESULTADO. A
 * apresentacao do ciclo usa o mesmo acabamento para pintar o numero de cada
 * slide, para que os quadros e a placa do fim sejam a mesma peca — e nao duas
 * coisas parecidas feitas por pessoas diferentes.
 */
const PLATE_FINISHES: Record<MetalReportRank, PlateFinish> = {
  E: { mid: '#81756b', pale: '#d0c7bd', dark: '#302c29', face: '#191613', filter: 'sepia(.3) saturate(.6) brightness(.8)' },
  D: { mid: '#68899e', pale: '#c1dce9', dark: '#283d4d', face: '#101f2c', filter: 'sepia(.3) saturate(1.2) hue-rotate(155deg)' },
  C: { mid: '#b07c54', pale: '#f2c39b', dark: '#4b3223', face: '#291a13', filter: 'sepia(.8) saturate(1.7) hue-rotate(340deg) brightness(.9)' },
  B: { mid: '#859ea9', pale: '#e4eff4', dark: '#293c48', face: '#152a36', filter: 'brightness(1)' },
  A: { mid: '#d8ae42', pale: '#fff1b8', dark: '#725620', face: '#705513', filter: 'sepia(.85) saturate(1.45) hue-rotate(355deg)' },
  S: { mid: '#c6a05c', pale: '#ffe5ab', dark: '#604421', face: '#4a2169', filter: 'sepia(.85) saturate(1.45) hue-rotate(355deg)' },
  // O rubi do SS lia mais claro que todos os outros acabamentos: o vermelho e a
  // cor mais luminosa da familia em igualdade de luminancia, entao #68122b
  // saltava ao lado do violeta do S (#4a2169) mesmo com valor parecido. Escurecido
  // para o topo da escada parecer profundo, e nao aceso.
  SS: { mid: '#c39a51', pale: '#ffe4a2', dark: '#64401f', face: '#3f0a18', filter: 'sepia(.85) saturate(1.45) hue-rotate(355deg)' },
};
export const getPlateFinish = (rank: string): PlateFinish => PLATE_FINISHES[getMetalRankPalette(rank).rank];

/**
 * A TINTA METALICA DO APP, NUM LUGAR SO.
 *
 * O gradiente de 103 graus preso ao texto por `background-clip`. Ela sobrevive a
 * captura de imagem da tela de compartilhamento porque a lib e `html-to-image`,
 * que renderiza CSS de verdade.
 *
 * A PROFUNDIDADE VEM DE `text-shadow`, E NAO DE `filter`.
 *
 * Era `filter: drop-shadow(...)` no mesmo elemento do `background-clip: text`, e
 * essa dupla e frágil: o filtro joga o elemento numa superficie de composicao
 * propria, e em algumas maquinas o recorte pelo texto se perde na rasterizacao.
 * Quando isso acontece nao sobra texto ilegivel — sobra o RETANGULO do gradiente
 * inteiro, um tijolo dourado no lugar do numero.
 *
 * Em 22/09/2026 chegou a tela assim: os seis quadros do relatorio com todo
 * numero virado bloco, e legiveis exatamente os valores que levam `tom` — que
 * sao os unicos que NAO passam por aqui. Nao reproduz em toda maquina, e por
 * isso mesmo nao da para deixar: falha de compositor depende de GPU e driver, e
 * o app nao escolhe nenhum dos dois.
 *
 * `text-shadow` desenha a partir da propria forma da letra, entao ele convive
 * com o fill transparente e nao cria superficie nenhuma.
 *
 * A sombra ficou MAIS FRACA que a do filtro, e por um motivo que so aparece
 * olhando. O drop-shadow sombreava o RESULTADO ja composto, entao a sombra caia
 * limpa atras do glifo cheio. A text-shadow desenha antes, a partir da forma da
 * letra, e o gradiente pinta por cima: nas bordas suavizadas, onde o glifo e
 * meio transparente, a sombra atravessa e acinzenta o ouro. Quanto mais forte a
 * sombra, mais cinza o numero — que e o oposto do que ela existe para fazer.
 *
 * `0 2px 3px` a 50% ainda descola a letra do fundo escuro e nao suja mais nada.
 */
export const SOMBRA_DA_TINTA_METALICA = '0 2px 3px rgba(0,0,0,.5)';

/** A tinta a partir de um gradiente qualquer — a placa, o codex, a loja. */
export const tintaMetalicaCom = (gradiente: string): React.CSSProperties => ({
  background: gradiente,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: SOMBRA_DA_TINTA_METALICA,
});

export const tintaMetalicaDo = (finish: PlateFinish): React.CSSProperties => tintaMetalicaCom(
  `linear-gradient(103deg, ${finish.mid} 2%, ${finish.pale} 26%, #fff8ea 44%, ${finish.pale} 62%, ${finish.mid} 88%, ${finish.pale} 100%)`,
);

const plateOutline = (i: number) => `${18+i},${i} ${302-i},${i} ${320-i},${18+i} ${320-i},${512-i} ${302-i},${530-i} ${18+i},${530-i} ${i},${512-i} ${i},${18+i}`;

export const MetalReportCard: React.FC<MetalReportCardProps> = ({
  rank,
  score,
  title,
  subtitle,
  dateRange,
  summary,
  dualProgress,
  metrics = [],
  badges = [],
  compact = false,
  captureId,
  entryFlash = false,
  className = '',
}) => {
  const palette = getMetalRankPalette(rank);
  const finish = PLATE_FINISHES[palette.rank];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const frameId = `metal-frame-${uid}`;
  const faceId = `metal-face-${uid}`;
  const glintId = `metal-glint-${uid}`;
  const visibleMetrics = metrics.slice(0, 4);
  const visibleBadges = badges.slice(0, compact ? 2 : 4);
  // Older callers put the date in subtitle. Never manufacture a cycle number.
  const dateLabel = dateRange || subtitle;

  return (
    <div
      id={captureId}
      data-rank={palette.rank}
      className={`metal-report-card ${compact ? 'metal-report-card--compact' : ''} ${entryFlash ? 'metal-report-card--entry-flash' : ''} ${className}`.trim()}
      style={{
        ['--metal-base' as string]: palette.base,
        ['--metal-base-deep' as string]: palette.baseDeep,
        ['--metal-highlight' as string]: palette.highlight,
        ['--metal-edge' as string]: palette.edge,
        ['--metal-trim' as string]: palette.trim,
        ['--metal-glow' as string]: palette.glow,
        ['--metal-text' as string]: palette.text,
        ['--plate-mid' as string]: finish.mid,
        ['--plate-pale' as string]: finish.pale,
        ['--plate-dark' as string]: finish.dark,
        ['--plate-face' as string]: finish.face,
        ['--laurel-filter' as string]: finish.filter,
      }}
    >
      <svg className="metal-report-card__svg" viewBox="0 0 320 530" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={frameId} x1="0" y1="0" x2="1" y2=".8">
            <stop stopColor={finish.dark}/><stop offset=".08" stopColor={finish.pale}/>
            <stop offset=".13" stopColor={finish.dark}/><stop offset=".4" stopColor={finish.mid}/>
            <stop offset=".51" stopColor={finish.pale}/><stop offset=".56" stopColor={finish.dark}/>
            <stop offset=".85" stopColor={finish.mid}/><stop offset="1" stopColor={finish.pale}/>
          </linearGradient>
          <radialGradient id={faceId} cx=".45" cy=".22" r=".85">
            <stop stopColor={finish.face}/><stop offset=".7" stopColor={palette.baseDeep}/><stop offset="1" stopColor="#070a0e"/>
          </radialGradient>
          <radialGradient id={glintId}>
            <stop stopColor="#fff" stopOpacity=".95"/><stop offset=".15" stopColor={finish.pale} stopOpacity=".7"/>
            <stop offset="1" stopColor={finish.pale} stopOpacity="0"/>
          </radialGradient>
        </defs>
        <polygon points={plateOutline(1)} fill="#05080c" stroke={finish.dark} strokeWidth="2"/>
        <polygon points={plateOutline(4)} fill={`url(#${frameId})`}/>
        <polygon points={plateOutline(9)} fill="#060a10" stroke={finish.dark} strokeWidth="2"/>
        <polygon points={plateOutline(14)} fill={`url(#${faceId})`} stroke={`url(#${frameId})`} strokeWidth="2"/>
        <polygon points={plateOutline(19)} fill="none" stroke={finish.mid} strokeOpacity=".22"/>
        <ellipse cx="157" cy="6" rx="57" ry="9" fill={`url(#${glintId})`}/>
        <ellipse cx="175" cy="518" rx="72" ry="9" fill={`url(#${glintId})`} opacity=".5"/>
        <path d="M7 30V112 M313 360V500" stroke={finish.pale} opacity=".4"/>
      </svg>

      <div className="metal-report-card__content">
        {dateLabel ? <div className="metal-report-card__rail">{dateLabel}</div> : null}
        <div className="metal-report-card__hero">
          <img className="metal-report-card__laurel" src="/assets/cycles/laurel-silver.png" alt="" width="1254" height="1254" />
          <div className="metal-report-card__rank-cluster">
            <div className="metal-report-card__rank">{palette.rank}</div>
            {typeof score === 'number' ? (
              <div className="metal-report-card__score">
                <span className="metal-report-card__score-label">Nota</span>
                <span className="metal-report-card__score-value">{score}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="metal-report-card__title-stack">
          <h3 className="metal-report-card__title">{title}</h3>
          {summary ? <p className="metal-report-card__summary">{summary}</p> : null}
        </div>

        {dualProgress ? (
          <div className="metal-report-card__dual-progress">
            <div className="metal-report-card__dual-progress-row">
              <div className="metal-report-card__dual-progress-meta">
                <span className="metal-report-card__dual-progress-label">{dualProgress.progressLabel || 'Progresso'}</span>
                <span className="metal-report-card__dual-progress-value">{dualProgress.progressValue || `${Math.round(dualProgress.progress)}%`}</span>
              </div>
              <div className="metal-report-card__dual-progress-track">
                <div
                  className="metal-report-card__dual-progress-fill metal-report-card__dual-progress-fill--progress"
                  style={{ width: `${Math.max(0, Math.min(100, dualProgress.progress))}%` }}
                />
              </div>
            </div>
            <div className="metal-report-card__dual-progress-row">
              <div className="metal-report-card__dual-progress-meta">
                <span className="metal-report-card__dual-progress-label">{dualProgress.timeLabel || 'Tempo'}</span>
                <span className="metal-report-card__dual-progress-value">{dualProgress.timeValue || `${Math.round(dualProgress.time)}%`}</span>
              </div>
              <div className="metal-report-card__dual-progress-track">
                <div
                  className="metal-report-card__dual-progress-fill metal-report-card__dual-progress-fill--time"
                  style={{ width: `${Math.max(0, Math.min(100, dualProgress.time))}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {visibleMetrics.length > 0 && (
          <div className="metal-report-card__metrics">
            {visibleMetrics.map((metric) => (
              <div key={`${metric.label}-${metric.value}`} className="metal-report-card__metric">
                <span className="metal-report-card__metric-label">{metric.label}</span>
                <span className={`metal-report-card__metric-value ${metric.value.length > 12 ? 'metal-report-card__metric-value--long' : ''}`}>{metric.value}</span>
              </div>
            ))}
          </div>
        )}

        {visibleBadges.length > 0 && (
          <div className="metal-report-card__badges">
            {visibleBadges.map((badge) => (
              <span key={`${badge.label}-${badge.value || ''}`} className="metal-report-card__badge">
                <span className="metal-report-card__badge-label">{badge.label}</span>
                {badge.value ? <span className="metal-report-card__badge-value">{badge.value}</span> : null}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
