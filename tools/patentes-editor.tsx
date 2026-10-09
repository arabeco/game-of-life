import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import './patentes-editor.css';
import appHtml from '../index.html?raw';
import { GameContext } from '../contexts/GameContext';
import { NobilityLadder } from '../components/NobilityLadder';
import { AchievementModal } from '../components/AchievementModal';
import { NOBILITY_RANKS, RANK_REWARDS } from '../constants/nobility';
import { ITEMS_DB } from '../constants/items';
import { getRankBackgroundToken, getProfileBackgroundPrimarySource } from '../utils/profileBackgrounds';
import { ArtContext, Crop, DEFAULT_CROP, ProfileBackgroundSurface } from './patentes-surface';

// Reuse the app's actual inline skin/button definitions without running app scripts.
const sourceDoc = new DOMParser().parseFromString(appHtml, 'text/html');
sourceDoc.querySelectorAll('style').forEach(original => {
  const style = document.createElement('style'); style.textContent = original.textContent; document.head.append(style);
});
document.body.className = 'mode-game theme-dark patentes-bench';
document.documentElement.dataset.skin = 'GOLD';
document.body.dataset.skin = 'GOLD';
const urls = Object.fromEntries(NOBILITY_RANKS.map(rank => [rank.id, getProfileBackgroundPrimarySource(getRankBackgroundToken(rank.id))]));
const border = ITEMS_DB.find(item => item.id === 'item_border_4_002')?.imageUrl;
const KEY = 'glyph-patentes-crops-v1';
const validate = (value: unknown): Record<string, Crop> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Arquivo de ajustes inválido.');
  const result: Record<string, Crop> = {};
  for (const rank of NOBILITY_RANKS) {
    const c = (value as Record<string, Crop>)[rank.id]; if (!c) continue;
    if (![c.x,c.y,c.zoom,c.light].every(Number.isFinite) || c.x < 0 || c.x > 100 || c.y < 0 || c.y > 100 || c.zoom < 1 || c.zoom > 2.5 || c.light < .3 || c.light > 1.5) throw new Error('Valores de enquadramento fora do intervalo.');
    result[rank.id] = { x:c.x, y:c.y, zoom:c.zoom, light:c.light };
  }
  return result;
};
function App() {
  const [settings, setSettings] = useState<Record<string, Crop>>(() => { try { return validate(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { return {}; } });
  const [rankId, setRankId] = useState('vagante');
  const [view, setView] = useState('ladder');
  const [width, setWidth] = useState(390);
  const [modal, setModal] = useState(false);
  const [status, setStatus] = useState('Ajustes salvos só neste navegador.');
  const [overlay, setOverlay] = useState(false);
  const rank = NOBILITY_RANKS.find(r => r.id === rankId)!;
  const crop = settings[rankId] || DEFAULT_CROP;
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { setStatus('Não foi possível salvar no navegador. Exporte os ajustes.'); } }, [settings]);
  const update = (key: keyof Crop, value: number) => setSettings(previous => ({ ...previous, [rankId]: { ...(previous[rankId] || DEFAULT_CROP), [key]: value } }));
  const mockGame = { nobilityRanks: NOBILITY_RANKS, userProfile: { id: 'art-preview', nobility: { rankId, exp: rank.expTotalRequired } }, oraclePreferences: { soundsEnabled: false, hapticsEnabled: false, animationsEnabled: false }, addFeedEvent: () => setStatus('Prévia: nenhuma publicação foi enviada.'), showToast: (text: string) => setStatus(text), updateOraclePreferences: () => {} } as never;
  const exportSettings = () => {
    const blob = new Blob([JSON.stringify({ version: 1, collection: 'patentes-2026-10-06', rendering: 'object-fit:cover; object-position:x% y%; scale(zoom); transform-origin:x% y%; brightness(light)', settings }, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = href; a.download = 'ajustes-fundos-patentes.json'; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
    setStatus('Arquivo exportado. Ele guarda os ajustes das dez patentes.');
  };
  const importSettings = async (file?: File) => { if (!file) return; try { const json = JSON.parse(await file.text()); if (json.version !== 1) throw new Error('Versão do arquivo não reconhecida.'); setSettings(validate(json.settings)); setStatus('Ajustes importados.'); } catch (e) { setStatus(e instanceof Error ? e.message : 'Arquivo inválido.'); } };
  return <GameContext.Provider value={mockGame}><ArtContext.Provider value={{ settings, urls }}>
    <main className="pe-shell"><aside className="pe-controls">
      <h1>Fundos de patente</h1><p>Escolha uma patente e ajuste sua arte. As mudanças aparecem na prévia e ficam guardadas aqui.</p>
      <label>Patente<select value={rankId} onChange={e => setRankId(e.target.value)}>{NOBILITY_RANKS.map(r => <option value={r.id} key={r.id}>{r.name}</option>)}</select></label>
      <div className="pe-original"><img src={urls[rankId]} alt={`Original ${rank.name}`} /><div style={{ top: `${crop.y}%`, left: `${crop.x}%` }}>+</div></div>
      {([['x','Posição horizontal',0,100,1,'%'],['y','Posição vertical',0,100,1,'%'],['zoom','Zoom',1,2.5,.01,'×'],['light','Luminosidade',.3,1.5,.01,'×']] as const).map(([key,label,min,max,step,unit]) => <label key={key}>{label}<output>{crop[key].toFixed(step === 1 ? 0 : 2)}{unit}</output><input aria-label={label} type="range" min={min} max={max} step={step} value={crop[key]} onChange={e => update(key,Number(e.target.value))} /></label>)}
      <p className="pe-hint">Sem zoom, a posição horizontal só muda quando há sobra lateral para recortar. O mesmo ajuste é usado em todas as proporções.</p>
      <button onClick={() => setSettings(s => ({ ...s, [rankId]: { ...DEFAULT_CROP } }))}>Restaurar esta patente</button>
      <div className="pe-actions"><button onClick={exportSettings}>Exportar ajustes</button><label className="pe-import">Importar<input type="file" accept=".json,application/json" onChange={e => { void importSettings(e.target.files?.[0]); e.target.value = ''; }} /></label></div>
      <p role="status">{status}</p><p className="pe-hint">Nada altera sua conta ou os arquivos originais. Para aplicar no app depois, envie o JSON exportado.</p>
    </aside><section className="pe-work">
      <div className="pe-toolbar"><label>Prévia<select value={view} onChange={e => setView(e.target.value)}><option value="ladder">Escada real do app</option><option value="crops">Comparar recortes</option><option value="border">Borda Soberano</option></select></label><label>Largura<select value={width} onChange={e => setWidth(Number(e.target.value))}><option value={360}>360 px</option><option value={390}>390 px</option><option value={430}>430 px</option></select></label><button onClick={() => setModal(true)}>Ver modal de subida</button></div>
      <p className="pe-caption">{view === 'ladder' ? 'Componente real da escada, com EXP fictícia. Toque nas patentes para abrir as recompensas. A patente escolhida à esquerda fica como a atual.' : 'Simulação dos recortes do handoff. Perfil e Mundo abaixo não são telas reais do app.'}</p>
      {view !== 'border' && <label className="pe-check"><input type="checkbox" checked={overlay} onChange={e=>setOverlay(e.target.checked)} /> Comparar com máscara escura</label>}
      {view === 'ladder' && <div className="pe-phone" style={{ width }}><NobilityLadder unfilteredBackgrounds={!overlay} /></div>}
      {view === 'crops' && <><div className="pe-crops">{[['Escada','4/1'],['Cartão atual','2.5/1'],['Mundo','5/1'],['Seletor','16/9'],['Perfil','10/17']].map(([name,ratio])=><figure key={name} style={{width}}><figcaption>{name} · {ratio}</figcaption><div className="pe-crop" style={{aspectRatio:ratio}}><ProfileBackgroundSurface value={rankId} className="pe-fill" />{overlay && ['Escada','Mundo','Cartão atual'].includes(name) && <div className="pe-veil" />}<span className="pe-sample">{rank.name}</span></div></figure>)}</div></>}
      {view === 'border' && <div className="pe-borders">{[240,96,48].map(size=><figure key={size}><div className="pe-avatar" style={{width:size,height:size}}><span>👤</span><img src={border} alt={`Borda Soberano ${size}px`} /></div><figcaption>{size} px · avatar ilustrativo</figcaption></figure>)}</div>}
    </section></main>
    {modal && <><div className="pe-modal-note">Modal real · dados fictícios · o fundo é anunciado em texto.<button onClick={()=>setModal(false)}>Fechar prévia</button></div><AchievementModal achievement={{type:'PLAYER_RANK_UP',data:{...rank,semVideo:true,reward:{items:(RANK_REWARDS[rankId] || []).map(r=>r.itemId),rewardDetails:RANK_REWARDS[rankId] || []}}}} onClose={()=>setModal(false)} /></>}
  </ArtContext.Provider></GameContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<App />);
