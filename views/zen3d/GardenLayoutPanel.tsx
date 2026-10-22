import { useState } from 'react';
import { GARDEN_SIZES } from './gardenSizes';
import { useGardenAccount, ownsBase, GARDEN_UNLOCKS } from './gardenAccount';
import { BASES, type BaseId } from './gardenTemplates';
import { GARDEN_SHAPES, terrainDimensions, type GardenTerrain } from './gardenTerrain';
import { type AtmosphereId } from './AtmospherePanel';
import type { EnvironmentId } from './Sanctuary';
import { ValorIcon } from '../../components/ValorIcon';

export function GardenLayoutPanel({base,terrain,onTerrain,onModel,disabled,environment,onEnvironment,atmosphere,onAtmosphere,timeLabel}:{
  base:BaseId;terrain:GardenTerrain;onTerrain:(terrain:GardenTerrain)=>void;onModel:(id:BaseId)=>void;disabled:boolean;
  timeLabel:string;environment:EnvironmentId;onEnvironment:(id:EnvironmentId)=>void;atmosphere:AtmosphereId;onAtmosphere:(id:AtmosphereId)=>void;
}) {
  const account=useGardenAccount(),[tab,setTab]=useState('ground');
  const bounds=terrainDimensions(base,terrain),format=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:1});
  return <div className="garden-layout-panel">
    <div className="inventory-filters" aria-label="Opções do jardim">{[['ground','Formato e tamanho'],['models','Modelos prontos'],['scene','Céu vivo']].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</div>
    {tab==='ground'&&<div className="garden-ground-options">
      <p>Mais espaço para o jardim que você já montou. As peças ficam no lugar e o desenho é preservado.</p>
      <h3>Formato</h3><div className="garden-shapes">{GARDEN_SHAPES.map(s=><button key={s.id} disabled={disabled} aria-pressed={terrain.shape===s.id} onClick={()=>onTerrain({...terrain,shape:s.id})}><i className={`garden-shape-${s.id}`} aria-hidden="true"/>{s.name}</button>)}</div>
      <h3>Tamanho</h3><div className="garden-sizes">{GARDEN_SIZES.map(size=>{
        const owned=size.level<=(account?.expansionLevel??0),next=size.level===(account?.expansionLevel??0)+1,selected=terrain.size===size.id;
        const detail=size.level>0?`+${Math.round(((size.scale/1.25)**2-1)*100)}% sobre o Amplo`:size.id==='spacious'?'25% maior que o Original':'Tamanho original';
        return <article className={`garden-size-card ${selected?'is-current':''}`} key={size.id}><div><b>{size.name}</b><small>{detail}</small></div><div className="garden-size-actions">{owned?<button className="garden-secondary-button" disabled={disabled||selected} aria-pressed={selected} onClick={()=>onTerrain({...terrain,size:size.id as GardenTerrain['size']})}>{selected?'Em uso':'Usar'}</button>:next&&account?.expansionsAvailable?<button className="zen-luxe-button garden-buy-button" disabled={disabled} aria-label={`Desbloquear ${size.name} por ${size.price} fragmentos`} onClick={()=>account.buyExpansion?.(size.level)}><span>Desbloquear</span><ValorIcon valor="fragmento" tamanho={15} rotulo=""/><b>{size.price}</b></button>:<small className="garden-size-locked">Bloqueado</small>}</div></article>;
      })}</div>
      {account&&!account.expansionsAvailable&&<p>As compras de expansão ainda não estão disponíveis.</p>}
      <p className="garden-measurement">{format(bounds.x*2)} × {format(bounds.z*2)} m</p>
    </div>}
    {tab==='models'&&<div className="garden-model-options"><p>Escolha uma composição pronta. Você verá o que muda antes de aplicar.</p>{BASES.map(b=>{
      const owned=ownsBase(account,b.id),product=b.id!=='open'?account?.products.find(p=>p.id===GARDEN_UNLOCKS[b.id]):null;
      return <article className="garden-model-card" key={b.id}><span className={`base-mini base-${b.id}`} aria-hidden="true"><i/></span><span><b>{b.name}{base===b.id?' · atual':''}</b><small>{b.description}</small><em>{owned?'Disponível':product?'Disponível na loja':'Bloqueado'}</em>{owned?<button className="garden-secondary-button" disabled={disabled||base===b.id} onClick={()=>onModel(b.id)}>{base===b.id?'Em uso':'Ver composição'}</button>:product?<button className="zen-luxe-button garden-buy-button" disabled={disabled} aria-label={`Desbloquear ${b.name} por ${product.price} ouro`} onClick={()=>account?.buy(product.id)}><span>Desbloquear</span><ValorIcon valor="ouro" tamanho={15} rotulo=""/><b>{product.price}</b></button>:null}</span></article>;
    })}</div>}
    {tab==='scene'&&<div className="garden-sky-info"><span className="garden-sky-orbit" aria-hidden="true">☼</span><h3>{timeLabel} na sua ilha</h3><p>O sol, a lua e as estrelas acompanham o horário do seu aparelho, inclusive enquanto você fica aqui.</p><p>À noite, o luar e as lanternas mantêm a areia iluminada para desenhar.</p></div>}
  </div>;
}
