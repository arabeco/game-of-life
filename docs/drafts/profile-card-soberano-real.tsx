import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../../index.css';
import { GlassCard } from '../../components/GlassCard';
import { ProfileBackgroundSurface } from '../../components/ProfileBackgroundSurface';
import { EditIcon, ShareIcon, StarIcon } from '../../components/Icons';
import { AssetPentagon } from '../../components/AssetPentagon';
import { buildUiSkinTokens } from '../../utils/uiSkinTokens';
import type { Asset } from '../../types';

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

type Tab = 'widgets' | 'summary' | 'mastery';

const LiveProfileProof = () => {
  const [tab, setTab] = useState<Tab>('mastery');
  const totalArenas = assets.reduce((sum, asset) => sum + asset.arenas.length, 0);
  const totalActions = assets.reduce((sum, asset) => sum + asset.arenas.reduce((arenaSum, arena) => arenaSum + (arena.actionIds?.length || 0), 0), 0);
  return (
    <div data-skin="GOLD" className="min-h-screen bg-[#08090b] p-4 text-white" style={buildUiSkinTokens('GOLD') as React.CSSProperties}>
      <div className="mx-auto mb-3 max-w-[720px] text-center"><p className="text-[9px] font-black uppercase tracking-[0.28em] text-[var(--skin-accent-color)]">Perfil vivo atual · não é o card de compartilhar</p><h1 className="mt-1 font-serif text-2xl font-black uppercase tracking-[0.07em]">Soberano equipado</h1></div>
      <div className="relative mx-auto w-full max-w-[420px]" style={{ height: 760 }}>
        <GlassCard variant="neutral" className="relative h-full w-full overflow-hidden border border-white/10 p-0 shadow-2xl" style={{ height: '100%' }}>
          <div className="absolute inset-0 z-0 h-full w-full"><ProfileBackgroundSurface value="radial-gradient(circle at 50% 6%, rgba(184,146,82,.34), transparent 30%), linear-gradient(160deg,#24231f,#08090b 54%,#17140d)" className="h-full w-full" alt="" /></div>
          <div className="absolute inset-0 z-10 space-y-2 overflow-y-auto p-4">
            <div className="absolute left-4 right-4 top-4 z-30 flex items-start justify-between">
              <div className="flex flex-col space-y-2"><button className="rounded-full border border-white/20 bg-black/50 p-2 backdrop-blur-sm" aria-label="Editar"><EditIcon className="h-5 w-5 text-gray-300" /></button><button className="rounded-full border border-white/20 bg-black/50 p-2 backdrop-blur-sm" aria-label="Compartilhar"><ShareIcon className="h-5 w-5 text-gray-300" /></button></div>
              <div className="flex flex-col items-end gap-2"><button className="luxe-skin-button rounded-lg px-4 py-1.5 text-xs font-bold">OK</button><button className="group flex h-10 w-10 items-center justify-center rounded-full border border-amber-200/30 bg-black/55 text-amber-100 shadow-[0_10px_26px_rgba(0,0,0,0.36),0_0_16px_rgba(251,191,36,0.12)] backdrop-blur-sm" title="Ver feitos"><StarIcon className="h-5 w-5 fill-amber-200/15" /></button></div>
            </div>
            <div className="flex flex-col items-center pt-4 text-center">
              <div className="relative h-32 w-32"><div className="absolute left-1/2 top-1/2 z-30 h-[75%] w-[75%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full"><img src={avatarDeProva} alt="Perfil" className="h-full w-full object-cover" /></div><div className="pointer-events-none absolute -inset-1 z-40 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: 'url(/assets/catalog/interface/borda_t4_celestial.png)' }} /><div className="absolute -bottom-1 -right-1 z-50 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-gray-800" style={{ borderColor: 'var(--skin-accent-color)' }}><span className="text-lg font-black text-white">90</span></div></div>
              <div className="relative mt-1 flex flex-col items-center"><div className="inline-block rounded-xl border bg-black/50 px-4 py-1 backdrop-blur-sm" style={{ borderColor: 'var(--skin-accent-color)' }}><h2 className="luxe-title-shadow text-3xl font-bold text-white">Afonso</h2></div><div className="mt-0.5 inline-flex flex-col items-center rounded-xl border border-white/10 bg-black/50 px-4 py-1.5 backdrop-blur-sm"><span className="text-sm font-bold text-white">Ordem Primeva</span><span className="text-xs text-gray-400">Regente</span></div></div>
            </div>
            <div className="w-full px-4 pb-0">
              <div className="relative -my-1 mb-0 flex items-center justify-center px-4"><img src="/assets/catalog/interface/banner_t4_celestial.png" alt="Banner" className="mx-auto h-16 scale-115 object-contain" /></div>
              <div className="space-y-1">
                <div className="relative z-20 mb-1 flex rounded-xl border border-white/5 bg-black/30 p-0.5 backdrop-blur-sm">{(['widgets', 'summary', 'mastery'] as Tab[]).map((key) => <button key={key} onClick={() => setTab(key)} className={`flex-1 rounded-lg py-1 text-[10px] font-bold uppercase tracking-wider ${tab === key ? 'bg-white/10 text-white' : 'text-gray-500'}`}>{key === 'widgets' ? 'Widgets' : key === 'summary' ? 'Resumo' : 'Maestria'}</button>)}</div>
                {tab === 'widgets' && <div className="w-full space-y-2 rounded-2xl border border-white/5 bg-black/30 p-1.5 backdrop-blur-sm"><div className="grid grid-cols-2 gap-1.5"><div className="rounded-2xl border border-white/8 bg-black/24 p-3"><div className="text-[8px] font-black uppercase tracking-[.18em] text-gray-400">Propósito</div><div className="mt-2 text-sm font-bold">Construir legado</div></div><div className="rounded-2xl border border-white/8 bg-black/24 p-3"><div className="text-[8px] font-black uppercase tracking-[.18em] text-gray-400">Trabalho</div><div className="mt-2 text-sm font-bold">Projeto principal</div></div></div></div>}
                {tab === 'summary' && <div className="w-full space-y-2 rounded-2xl border border-white/5 bg-black/30 p-1.5 backdrop-blur-sm"><div className="grid grid-cols-3 gap-2">{[['Nível Geral','90'],['Ativos','5'],['Arenas',String(totalArenas)]].map(([label,value]) => <div key={label} className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><div className="text-[8px] uppercase tracking-[.22em] text-gray-500">{label}</div><div className="text-2xl font-bold text-white">{value}</div></div>)}</div><div className="grid grid-cols-2 gap-2"><div className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><div className="text-[8px] uppercase tracking-[.22em] text-gray-500">Ações</div><div className="text-2xl font-bold">{totalActions}</div></div><div className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><div className="text-[8px] uppercase tracking-[.22em] text-gray-500">Maestria</div><div className="text-2xl font-bold">9,0</div></div></div></div>}
                {tab === 'mastery' && <div className="flex w-full items-center justify-center rounded-2xl border border-white/5 bg-black/30 p-1 backdrop-blur-sm"><AssetPentagon assets={assets} size={220} /></div>}
              </div>
            </div>
          </div>
          <button className="group absolute bottom-4 left-4 z-30 rounded-full border border-white/10 bg-black/55 p-1.5 backdrop-blur-sm" style={{ borderColor: 'var(--skin-accent-color)' }} title="Ver ativos"><div className="relative flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundImage: 'var(--sephirot-bg-image), var(--sephirot-base-fill), var(--sephirot-bg-gradient)', boxShadow: '0 0 9px rgba(0,0,0,.35), inset 0 0 0 var(--sephirot-ring-width,.8px) var(--sephirot-border-color)' }}><span className="text-[1.15rem] font-black" style={{ color: 'var(--sephirot-text-color)', WebkitTextStroke: '1.2px rgba(8,8,10,.98)' }}>90</span></div></button>
          <button className="group absolute bottom-4 left-[5.35rem] z-30 flex h-12 w-12 items-center justify-center rounded-full border border-amber-200/35 bg-black/55 text-xl shadow-[0_14px_30px_rgba(0,0,0,.42),0_0_18px_rgba(244,205,130,.16)] backdrop-blur-sm" title="Meu jardim"><span className="-translate-y-px">🪴</span></button>
          <div className="absolute right-4 top-[60px] z-30 h-[95px] w-[70px] overflow-hidden rounded-lg border-2 bg-[#1a1a1a] shadow-[0_4px_20px_rgba(0,0,0,.8)]" style={{ borderColor: 'var(--skin-accent-color)' }}><div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black opacity-80" /><img src="/assets/catalog/avatars/SKIN_T4_ARMADURA_PLACA.png" alt="Soberano" className="relative z-10 h-full w-full scale-[1.65] object-contain" /></div>
        </GlassCard>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<LiveProfileProof />);
