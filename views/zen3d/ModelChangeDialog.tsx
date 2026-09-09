import { useEffect, useRef } from 'react';
import { BASES, type BaseId } from './gardenTemplates';
export function ModelChangeDialog({id,onCancel,onApply}:{id:BaseId;onCancel:()=>void;onApply:()=>void}){
 const ref=useRef<HTMLDialogElement>(null),model=BASES.find(b=>b.id===id)!;
 useEffect(()=>{ref.current?.showModal();},[]);
 return <dialog ref={ref} className="kit-detail-dialog" aria-label="Trocar modelo do jardim" onCancel={onCancel}>
  <header><div><small>NOVO TERRENO</small><h2>{model.name}</h2></div><button aria-label="Cancelar troca de modelo" onClick={onCancel}>×</button></header>
  <div className={`model-plan model-plan-${model.id}`}><span className={`base-mini base-${model.id}`}><i/></span></div>
  <p>{model.format} · {model.width.toLocaleString('pt-BR')} × {model.depth.toLocaleString('pt-BR')} m</p>
  <p><b>Aplicar limpa os desenhos na areia e substitui árvores, pedras, caminhos e outros objetos pela composição inicial deste modelo.</b></p>
  <p>Legado, artefatos e insígnias permanecem na área pessoal. Essa troca não pode ser desfeita neste protótipo.</p>
  <div className="model-dialog-actions"><button onClick={onCancel}>Manter meu jardim</button><button className="zen-luxe-button" onClick={onApply}>Aplicar modelo</button></div>
 </dialog>;
}
