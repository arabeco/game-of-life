import { terrainDimensions, type GardenTerrain } from './gardenTerrain';
import { useEffect, useRef } from 'react';
import { BASES, type BaseId } from './gardenTemplates';
export function ModelChangeDialog({id,terrain,onCancel,onApply}:{id:BaseId;terrain:GardenTerrain;onCancel:()=>void;onApply:()=>void}){
 const ref=useRef<HTMLDialogElement>(null),model=BASES.find(b=>b.id===id)!;
 useEffect(()=>{ref.current?.showModal();},[]);
 const bounds=terrainDimensions(id,terrain);
 return <dialog ref={ref} className="kit-detail-dialog" aria-label="Trocar modelo do jardim" onCancel={onCancel}>
  <header><div><small>NOVA COMPOSIÇÃO</small><h2>{model.name}</h2></div><button aria-label="Cancelar troca de modelo" onClick={onCancel}>×</button></header>
  <div className={`model-plan model-plan-${model.id}`}><span className={`base-mini base-${model.id}`}><i/></span></div>
  <p>Terreno escolhido · {(bounds.x*2).toLocaleString('pt-BR',{maximumFractionDigits:1})} × {(bounds.z*2).toLocaleString('pt-BR',{maximumFractionDigits:1})} m</p>
  <p><b>Aplicar limpa os desenhos na areia e substitui árvores, pedras, caminhos e outros objetos pela composição inicial deste modelo.</b></p>
  <p>Legado, artefatos e insígnias permanecem na área pessoal. Para mudar só o formato ou ampliar sem refazer, use Formato e tamanho.</p>
  <div className="model-dialog-actions"><button onClick={onCancel}>Manter meu jardim</button><button className="zen-luxe-button" onClick={onApply}>Aplicar modelo</button></div>
 </dialog>;
}
