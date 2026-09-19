import { useState } from 'react';
import { useGardenAccount, ownsBase, GARDEN_UNLOCKS } from './gardenAccount';
import { BASES, type BaseId } from './gardenTemplates';
import { GARDEN_SHAPES, terrainDimensions, type GardenTerrain } from './gardenTerrain';
import { type AtmosphereId } from './AtmospherePanel';
import type { EnvironmentId } from './Sanctuary';

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
      <h3>Tamanho</h3><div className="garden-sizes">{[['standard','Original'],['spacious','Amplo · +56% de área']].map(([id,label])=><button key={id} disabled={disabled} aria-pressed={terrain.size===id} onClick={()=>onTerrain({...terrain,size:id as GardenTerrain['size']})}>{label}</button>)}</div>
      <p className="garden-measurement">{format(bounds.x*2)} × {format(bounds.z*2)} m <span>· {terrain.size==='spacious'?'Terreno ampliado':'Tamanho original'}</span></p>
    </div>}
    {tab==='models'&&<div className="garden-model-options"><p>Escolha uma composição pronta. Você verá o que muda antes de aplicar.</p>{BASES.map(b=>{
      const owned=ownsBase(account,b.id),product=b.id!=='open'?account?.products.find(p=>p.id===GARDEN_UNLOCKS[b.id]):null;
      return <button className="garden-model-card" key={b.id} disabled={disabled||(!owned&&!product)} onClick={()=>owned?onModel(b.id):product&&account?.buy(product.id)}>
        <span className={`base-mini base-${b.id}`} aria-hidden="true"><i/></span><span><b>{b.name}{base===b.id?' · atual':''}</b><small>{b.description}</small><em>{owned?'Ver composição':product?`Desbloquear · ${product.price} ouro`:'Bloqueado'}</em></span>
      </button>;
    })}</div>}
    {tab==='scene'&&<div className="garden-sky-info"><span className="garden-sky-orbit" aria-hidden="true">☼</span><h3>{timeLabel} na sua ilha</h3><p>O sol, a lua e as estrelas acompanham o horário do seu aparelho, inclusive enquanto você fica aqui.</p><p>À noite, o luar e as lanternas mantêm a areia iluminada para desenhar.</p></div>}
  </div>;
}
