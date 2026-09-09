import { collectionPieces } from './collections';
import { useGardenAccount, ownsKit, ownsBase, GARDEN_UNLOCKS } from './gardenAccount';
import { BASES, type BaseId } from './gardenTemplates';
import { useEffect, useRef, useState } from 'react';
import { KITS, kitInfo, type KitId } from './kits';
import { ItemPreview } from './ItemPreview';


export function KitShop({onModel}:{onModel:(id:BaseId)=>void}){
 const account=useGardenAccount();
 const purchase=(id:string)=>{const product=account?.products.find(p=>p.id===id);return product?<button className="zen-luxe-button" onClick={()=>account?.buy(id)}>Comprar · {product.price} ouro</button>:null;};
 const [section,setSection]=useState('kits');
 const [selected,setSelected]=useState<KitId|null>(null),dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(selected)dialog.current?.showModal();},[selected]);
 const kit=selected?kitInfo(selected):null;
 return <><div className="standalone-shop"><div className="inventory-filters"><button aria-pressed={section==='kits'} onClick={()=>setSection('kits')}>Kits de peças</button><button aria-pressed={section==='models'} onClick={()=>setSection('models')}>Modelos de jardim</button></div>{section==='kits'?<><p>Coleções para seu jardim</p>{KITS.map(k=><article className={`compact-kit theme-${k.id}`} key={k.id}>
  <div className="compact-kit-art"><ItemPreview type={k.id==="genesis"?"maple":"pine"} kit={k.id}/></div><div><h3>{k.name}</h3><small>{k.id==='starter'?'Gratuito':ownsKit(account,k.id)?'Disponível':'Lendário · bloqueado'} · {collectionPieces(!account).filter(p=>p.kit===k.id).length} peças</small><button className="zen-luxe-button" onClick={()=>setSelected(k.id)}>Ver peças</button>{k.id!=='starter'&&!ownsKit(account,k.id)&&purchase(GARDEN_UNLOCKS[k.id])}</div>
 </article>)}</>:<><p>Quatro bases: areia livre, lago, riacho e caminho.</p>{BASES.map(b=><article className="compact-kit" key={b.id}><div className={`model-plan model-plan-${b.id}`}><span className={`base-mini base-${b.id}`}><i/></span></div><div><h3>{b.name}</h3><small>{b.tier} · {b.width.toLocaleString('pt-BR')} × {b.depth.toLocaleString('pt-BR')} m</small><small>{b.format}</small><p className="model-description">{b.description}</p>{ownsBase(account,b.id)?<button className="zen-luxe-button" onClick={()=>onModel(b.id)}>Ver modelo</button>:purchase(GARDEN_UNLOCKS[b.id as 'pond'|'river'|'path'])}</div></article>)}</>}<small>{account?'Kits e modelos desbloqueiam pelo inventário.':'Vitrine experimental, sem compras reais.'}</small></div>
 {kit&&<dialog ref={dialog} className="kit-detail-dialog" aria-label={`Peças do kit ${kit.name}`} onCancel={()=>setSelected(null)} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)setSelected(null);}}}>
  <header><div><small>CONTEÚDO DO KIT</small><h2>{kit.name}</h2></div><button aria-label="Fechar peças do kit" onClick={()=>setSelected(null)}>×</button></header>
  <p>{kit.description}</p><div className="kit-detail-grid">{collectionPieces(!account).filter(p=>p.kit===kit.id).map(p=><div key={p.type}><ItemPreview type={p.type} kit={kit.id}/><span>{p.name}</span></div>)}</div>
  <footer>{ownsKit(account,kit.id)?'Disponível em Itens.':'Adquira este kit na loja ou encontre-o em um baú lendário.'}</footer>
 </dialog>}
 </>;
}
