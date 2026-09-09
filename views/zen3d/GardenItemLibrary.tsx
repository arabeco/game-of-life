import { collectionPieces, collectionCategory } from './collections';
import { useGardenAccount, ownsKit } from './gardenAccount';
import { ARTIFACTS } from './artifactCatalog';
import { artifactUrl } from './ArtifactStands';
import { ItemPreview } from './ItemPreview';
import { KITS } from './kits';
import type { KitId } from './kits';
import { placementFits } from './placement';
import { useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { CATALOG, CATEGORIES, type GardenObject, type ObjectKind } from './model';
export function useDecoration(objects:GardenObject[],setObjects:(v:GardenObject[])=>void,protectedItems:GardenObject[],activeKit:KitId,onArtifact:(id:string)=>void,onObject:()=>void){
 const account=useGardenAccount();
 const [shelf,setShelf]=useState<'items'|'kits'>('items');
 const [category,setCategory]=useState('Todos'),[search,setSearch]=useState(''),[pieceKit,setPieceKit]=useState<KitId|'all'>('all');
 const pieces=collectionPieces(!account).filter(o=>ownsKit(account,o.kit)&&(pieceKit==='all'||o.kit===pieceKit));
 const visiblePieces=pieces.filter(o=>(category==='Todos'||collectionCategory(o.category)===category)&&o.name.toLocaleLowerCase('pt').includes(search.toLocaleLowerCase('pt')));
 const [selected,setSelected]=useState<string|null>(null),[draft,setDraft]=useState<GardenObject|null>(null),[kit,setKit]=useState(false),[notice,setNotice]=useState('Toque em um objeto para editar ou escolha uma peça.');
 const active=draft??objects.find(o=>o.id===selected),valid=!!draft&&placementFits([draft],[...objects.filter(o=>o.id!==draft.id),...protectedItems]);
 const fits=(item:GardenObject)=>placementFits([item],[...objects.filter(o=>o.id!==item.id),...protectedItems]);
 const drop=(item:GardenObject|null)=>{if(item&&fits(item)){setObjects([...objects.filter(o=>o.id!==item.id),item]);setSelected(item.id);setNotice('Posição aplicada. Arraste para ajustar.');}else setNotice('Sem espaço livre; posição anterior mantida.');setDraft(null);};
 const cancel=()=>{setDraft(null);setSelected(null);setKit(false);};
 const select=(id:string,e:ThreeEvent<MouseEvent>)=>{if(e.delta>7)return;e.stopPropagation();if(draft)return;setSelected(id);setKit(false);setNotice('Selecionado: arraste pelo círculo ou use Mover.');};
 const add=(type:ObjectKind,chosenKit:KitId='starter')=>{if(!ownsKit(account,chosenKit))return;onObject();setDraft({id:`decor-${Date.now()}`,type,kit:chosenKit,position:[0,0,2],rotation:0,variant:Math.floor(Math.random()*6)});setSelected(null);setKit(false);};
 const moveKit=(dx:number,dz:number)=>{
  const group=objects.filter(o=>o.fixed),others=[...objects.filter(o=>!o.fixed),...protectedItems];
  const moved=group.map(o=>({...o,position:[o.position[0]+dx,0,o.position[2]+dz] as [number,number,number]}));
  if(!placementFits(moved,others)){setNotice('O conjunto não cabe aqui. Tente outra direção.');return;}
  setObjects([...moved,...objects.filter(o=>!o.fixed)]);setNotice('Conjunto movido; água, ponte e caminhos acompanham.');
 };
 return {move:()=>{if(active)setDraft(active);},rotate:()=>{if(active){const next={...active,rotation:active.rotation+Math.PI/4};if(objects.some(o=>o.id===active.id))drop(next);else setDraft(next);}},remove:()=>{if(active)setObjects(objects.filter(o=>o.id!==active.id));cancel();},repeat:()=>{if(active)add(active.type,active.kit??'starter');},previewKit:pieceKit==='all'?'starter':pieceKit,selected,draft,kit,active,valid,cancel,select,setDraft,fits,drop, panel:<div className="decoration-editor">
  <div className="artifact-heading"><b>{active&&<span className="selected-preview"><ItemPreview type={active.type} kit={active.kit??activeKit}/></span>}{active?CATALOG.find(c=>c.type===active.type)?.name??'Elemento da base':kit?'Base selecionada':'Sua coleção'}</b><button onClick={()=>{setKit(!kit);setDraft(null);setSelected(null);}}>Mover base</button></div>
  {kit?<div className="artifact-actions">{([[-.25,0,'←'],[0,-.25,'↑'],[0,.25,'↓'],[.25,0,'→']] as const).map(([x,z,l])=><button key={l} aria-label={`Mover conjunto ${l}`} onClick={()=>moveKit(x,z)}>{l}</button>)}<button onClick={cancel}>Concluir</button></div>:active?<><div className="artifact-actions">
   <button onClick={()=>{const rotated={...active,rotation:active.rotation+Math.PI/4};if(objects.some(o=>o.id===active.id))drop(rotated);else setDraft(rotated);}}>Girar</button>
   <button onClick={()=>setDraft(active)}>Mover</button>
   <button onClick={()=>{setObjects(objects.filter(o=>o.id!==active.id));cancel();}}>Remover</button>
   <button onClick={cancel}>Concluir</button>
  </div></>:<div className="zen-inventory">
   <div className="inventory-filters" aria-label="Filtrar objetos">{['Todos','Pedras','Plantas','Ornamentos','Artefatos','Insígnias'].map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
   <div className="inventory-search"><input aria-label="Buscar item" placeholder="Buscar item…" value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Filtrar coleção" value={pieceKit} onChange={e=>setPieceKit(e.target.value as KitId|'all')}><option value="all">Todas as coleções</option>{KITS.filter(k=>ownsKit(account,k.id)).map(k=><option key={k.id} value={k.id}>{k.name}</option>)}</select></div>
   <div className="inventory-cards">{visiblePieces.map(o=><button className={`inventory-card theme-${o.kit}`} disabled={objects.length>=64} key={`${o.kit}:${o.type}`} onClick={()=>add(o.type,o.kit)}><ItemPreview type={o.type} kit={o.kit}/><b>{o.name}</b><span className="inventory-dot"/></button>)}{ARTIFACTS.filter(a=>(category==='Todos'||category===((a.category==='insignia'||a.category==='insignias'||a.id.startsWith('insignia'))?'Insígnias':'Artefatos'))&&a.name.toLocaleLowerCase('pt').includes(search.toLocaleLowerCase('pt'))).map(a=><button key={a.id} className="inventory-card theme-collection" onClick={()=>onArtifact(a.id)}><img src={artifactUrl(a.file)} alt="" loading="lazy"/><b>{a.name}</b><span className="inventory-dot"/></button>)}</div>
   {!ARTIFACTS.some(a=>(category==='Todos'||category===((a.category==='insignia'||a.category==='insignias'||a.id.startsWith('insignia'))?'Insígnias':'Artefatos'))&&a.name.toLocaleLowerCase('pt').includes(search.toLocaleLowerCase('pt')))&&visiblePieces.length===0&&<p className="inventory-empty">Nenhuma peça encontrada. Tente outro nome ou categoria.</p>}
  </div>}

  <p className="artifact-tip">{draft?valid?'Arraste e solte, ou toque no lugar desejado.':'Sem espaço livre: afaste das peças e da área pessoal.':notice}</p>
 </div>};
}
