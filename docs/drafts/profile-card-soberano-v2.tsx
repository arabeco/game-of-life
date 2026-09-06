import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../../index.css';
import { GlassCard } from '../../components/GlassCard';
import { ProfileBackgroundSurface } from '../../components/ProfileBackgroundSurface';
import { EditIcon, ShareIcon, StarIcon } from '../../components/Icons';
import { AssetPentagon } from '../../components/AssetPentagon';
import { buildUiSkinTokens } from '../../utils/uiSkinTokens';
import type { Asset } from '../../types';
import { REWARD_PLATE_VIEWPORT_STYLE } from '../../constants/rewardPlateStyles';

const avatarDeProva = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs><radialGradient id="g" cx="50%" cy="24%"><stop stop-color="#5d4b22"/><stop offset=".55" stop-color="#191a1d"/><stop offset="1" stop-color="#050607"/></radialGradient></defs>
    <rect width="512" height="512" fill="url(#g)"/><circle cx="256" cy="256" r="190" fill="none" stroke="#d1ad54" stroke-opacity=".2" stroke-width="3"/>
    <text x="256" y="305" text-anchor="middle" fill="#f5f0e3" font-family="Georgia,serif" font-size="142" font-weight="700">AF</text>
  </svg>
`)}`;

const area = (id: string, name: string, level: number, arenaCount: number, actionCount: number) => ({
  id, name, level, levelDescriptions: {},
  arenas: Array.from({ length: arenaCount }, (_, index) => ({ id: `${id}-${index + 1}`, actionIds: Array.from({ length: actionCount }, (__, actionIndex) => `${id}-acao-${actionIndex + 1}`) })),
  slots: [],
}) as unknown as Asset;

const assets = [
  area('proposito', 'Propósito', 10, 4, 3), area('relacoes', 'Relações', 9, 5, 2), area('trabalho', 'Trabalho', 9, 6, 4), area('lazer', 'Lazer', 9, 4, 2), area('saude', 'Saúde', 8, 5, 3),
];

const badges = [
  { id: 'soberano', name: 'Soberano', src: '/assets/catalog/interface/insignia_rank_10_soberano.webp', count: 1 },
  { id: 'genesis', name: 'Gênesis', src: '/assets/catalog/interface/insignia_season_genesis.webp', count: 1 },
  { id: 'ciclos', name: 'Ciclos concluídos', src: '/assets/catalog/interface/insignia_ciclo_bronze.webp', count: 12 },
  { id: 'missoes', name: 'Missões concluídas', src: '/assets/catalog/interface/insignia_missao_prata.webp', count: 2 },
];

type Tab = 'widgets' | 'summary' | 'mastery';
const metalEdge = 'color-mix(in srgb,var(--skin-accent-color) 24%,#9b8050)';
const BadgeStrip = () => <div className="mt-2 flex items-end justify-center gap-1" aria-label="Insígnias do perfil">{badges.map((badge) => <div key={badge.id} className="relative h-10 w-10" title={badge.name}><img src={badge.src} alt={badge.name} className="h-full w-full object-contain drop-shadow-[0_5px_9px_rgba(0,0,0,.95)]" />{badge.count > 1 && <span className="absolute -bottom-0.5 -right-0.5 font-serif text-[8px] font-black leading-none text-white [text-shadow:0_1px_2px_#000,0_0_5px_#000]">×{badge.count}</span>}</div>)}</div>;

const LiveProfileProof = () => {
  const [tab, setTab] = useState<Tab>('mastery');
  const embedded = new URLSearchParams(window.location.search).has('embed');
  const totalArenas = assets.reduce((sum, asset) => sum + asset.arenas.length, 0);
  const totalActions = assets.reduce((sum, asset) => sum + asset.arenas.reduce((arenaSum, arena) => arenaSum + (arena.actionIds?.length || 0), 0), 0);
  return <div data-skin="GOLD" className={`${embedded ? 'flex min-h-screen items-center justify-center' : 'min-h-screen p-4'} bg-[#08090b] text-white`} style={buildUiSkinTokens('GOLD') as React.CSSProperties}>
    {!embedded && <div className="mx-auto mb-3 max-w-[720px] text-center"><p className="text-[9px] font-black uppercase tracking-[0.28em] text-[var(--skin-accent-color)]">Perfil vivo · composição final</p><h1 className="mt-1 font-serif text-2xl font-black uppercase tracking-[0.07em]">Soberano equipado</h1><p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-white/45">Identidade no topo, dados no centro e insígnias discretas logo abaixo.</p></div>}
    <div className="relative mx-auto" style={embedded ? { width: '100vw', height: '100vh' } : REWARD_PLATE_VIEWPORT_STYLE}><GlassCard variant="neutral" className="relative h-full w-full overflow-hidden border p-0 shadow-2xl" style={{ height: '100%', borderColor: 'color-mix(in srgb,var(--skin-accent-color) 18%,rgba(255,255,255,.13))', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.025),0 28px 80px rgba(0,0,0,.72)' }}>
      <div className="absolute inset-0 z-0"><ProfileBackgroundSurface value="radial-gradient(circle at 50% 6%, rgba(184,146,82,.34), transparent 30%), linear-gradient(160deg,#24231f,#08090b 54%,#17140d)" className="h-full w-full" alt="" /></div>
      <div className="absolute inset-0 z-10 overflow-hidden px-4 pb-24 pt-4">
        <div className="absolute left-4 right-4 top-4 z-30 flex items-start justify-between"><div className="flex flex-col space-y-2"><button className="rounded-full border border-white/20 bg-black/50 p-2" aria-label="Editar"><EditIcon className="h-5 w-5 text-gray-300" /></button><button className="rounded-full border border-white/20 bg-black/50 p-2" aria-label="Compartilhar"><ShareIcon className="h-5 w-5 text-gray-300" /></button></div><div className="flex flex-col items-end gap-2"><button className="luxe-skin-button rounded-lg border-2 px-4 py-1.5 text-xs font-bold">OK</button><button className="flex h-10 w-10 items-center justify-center rounded-full border bg-black/55 text-white/75" style={{ borderColor: metalEdge }} title="Ver feitos"><StarIcon className="h-5 w-5" /></button></div></div>
        <div className="-mt-3 flex flex-col items-center text-center"><div className="relative h-36 w-36"><div className="absolute left-1/2 top-1/2 z-30 h-[82%] w-[82%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full"><img src={avatarDeProva} alt="Perfil" className="h-full w-full object-cover" /></div><img src="/assets/catalog/interface/borda_t4_celestial.png" alt="Borda Celestial" className="pointer-events-none absolute -inset-1 z-40 h-[calc(100%+8px)] w-[calc(100%+8px)] object-contain" /></div><div className="mt-2 flex flex-col items-center"><div className="border bg-black/55 px-4 py-0.5" style={{ borderColor: metalEdge, borderBottomWidth: 2 }}><h2 className="luxe-title-shadow text-2xl font-bold">Afonso</h2></div><div className="mt-1.5 flex items-baseline gap-2 text-[11px]"><span className="font-bold text-white/88">Ordem Primeva</span><span className="text-white/36">·</span><span className="text-white/48">Regente</span></div></div></div>
        <div className="mt-2 w-full pt-1"><div className="relative -my-1 flex items-center justify-center px-4"><img src="/assets/catalog/interface/banner_t4_celestial.png" alt="Banner" className="mx-auto h-[52px] max-w-[94%] object-contain" /></div><div className="mx-3 mt-5 space-y-1.5 rounded-[18px] border bg-black/[.16] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.025)]" style={{ borderColor: 'color-mix(in srgb,var(--skin-accent-color) 11%,rgba(255,255,255,.075))' }}><div className="relative z-20 mb-2 flex rounded-xl border border-white/5 bg-black/30 p-0.5">{(['widgets', 'summary', 'mastery'] as Tab[]).map((key) => <button key={key} onClick={() => setTab(key)} className={`flex-1 rounded-lg py-1 text-[10px] font-bold uppercase tracking-wider ${tab === key ? 'bg-white/10 text-white' : 'text-gray-500'}`}>{key === 'widgets' ? 'Widgets' : key === 'summary' ? 'Resumo' : 'Maestria'}</button>)}</div>
          {tab === 'widgets' && <div className="w-full rounded-2xl border border-white/5 bg-black/30 p-1.5"><div className="grid grid-cols-2 gap-1.5"><div className="rounded-2xl border border-white/8 bg-black/24 p-3"><div className="text-[8px] font-black uppercase tracking-[.18em] text-gray-400">Propósito</div><div className="mt-2 text-sm font-bold">Construir legado</div></div><div className="rounded-2xl border border-white/8 bg-black/24 p-3"><div className="text-[8px] font-black uppercase tracking-[.18em] text-gray-400">Trabalho</div><div className="mt-2 text-sm font-bold">Projeto principal</div></div></div></div>}
          {tab === 'summary' && <div className="w-full space-y-2 rounded-2xl border border-white/5 bg-black/30 p-1.5"><div className="grid grid-cols-3 gap-2">{[['Nível Geral','90'],['Ativos','5'],['Arenas',String(totalArenas)]].map(([label,value]) => <div key={label} className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><div className="text-[8px] uppercase tracking-[.22em] text-gray-500">{label}</div><div className="text-2xl font-bold">{value}</div></div>)}</div><div className="grid grid-cols-2 gap-2"><div className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><div className="text-[8px] uppercase tracking-[.22em] text-gray-500">Ações</div><div className="text-2xl font-bold">{totalActions}</div></div><div className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><div className="text-[8px] uppercase tracking-[.22em] text-gray-500">Maestria</div><div className="text-2xl font-bold">9,0</div></div></div></div>}
          {tab === 'mastery' && <div className="relative flex w-full items-center justify-center overflow-hidden py-1 before:absolute before:inset-x-7 before:top-1/2 before:h-32 before:-translate-y-1/2 before:bg-[radial-gradient(ellipse,rgba(190,155,77,.10),transparent_70%)]"><AssetPentagon assets={assets} size={210} /></div>}
        </div><BadgeStrip /></div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between bg-gradient-to-t from-[#090909] via-[#090909]/94 to-transparent px-4 pb-4 pt-9"><button className="grid h-16 w-16 place-items-center rounded-full border bg-black/65 p-1" style={{ borderColor: metalEdge }} title="Ver ativos" aria-label="Ver ativos"><div className="relative flex h-14 w-14 items-center justify-center rounded-full"><img src="/assets/catalog/gold.png" alt="Skin UI Gold" className="pointer-events-none absolute inset-0 h-full w-full scale-[1.14] object-contain" /><span className="relative z-10 text-[1.15rem] font-black" style={{ color: 'var(--sephirot-text-color)', WebkitTextStroke: '1.2px rgba(8,8,10,.98)', textShadow: '0 2px 5px #000' }}>90</span></div></button><button className="flex h-16 w-16 items-center justify-center rounded-full border bg-black/65 text-2xl" style={{ borderColor: metalEdge }} title="Meu jardim" aria-label="Meu jardim">🪴</button></div>
      <button className="absolute right-4 top-[60px] z-30 h-[95px] w-[70px] overflow-hidden rounded-lg border-2 bg-[#1a1a1a] shadow-[0_4px_20px_rgba(0,0,0,.8)]" style={{ borderColor: metalEdge }} title="Ver Soberano"><span className="absolute inset-x-0 top-0 z-20 block bg-black/70 px-1 py-0.5 text-[7px] font-black uppercase tracking-[.12em] text-white/45">Soberano</span><span className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black opacity-80" /><img src="/assets/catalog/avatars/SKIN_T4_ARMADURA_PLACA.png" alt="Soberano" className="relative z-10 h-full w-full scale-[1.62] object-contain" /></button>
    </GlassCard></div>
  </div>;
};

ReactDOM.createRoot(document.getElementById('root')!).render(<LiveProfileProof />);
