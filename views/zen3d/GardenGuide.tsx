import { useEffect, useRef, useState } from 'react';
import { GUIDE_PAGES } from './gardenGuideContent';

export function GardenGuide({pages,news,onClose}:{pages:readonly (typeof GUIDE_PAGES)[number][];news:boolean;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const [index,setIndex]=useState(0);
  useEffect(()=>{const previous=document.activeElement;dialog.current?.showModal();return()=>{dialog.current?.close();if(previous instanceof HTMLElement)previous.focus();};},[]);
  const page=pages[index];
  return <dialog ref={dialog} className="garden-guide" aria-labelledby="garden-guide-title" onCancel={e=>{e.preventDefault();onClose();}} onKeyDown={e=>{e.stopPropagation();}}>
    <header><span>{news?'Novidade no jardim':'Conheça seu jardim'}</span><button onClick={onClose} aria-label="Fechar guia">×</button></header>
    <img className="garden-guide-image" src={`guia/${page.id}.webp`} alt={page.alt}/>
    <section aria-live="polite"><span className="garden-guide-count">{index+1} / {pages.length}</span><h2 id="garden-guide-title">{page.title}</h2><p>{page.text}</p></section>
    <nav aria-label="Páginas do guia">{pages.map((p,i)=><button key={p.id} aria-label={`Página ${i+1}: ${p.title}`} aria-current={i===index?'step':undefined} onClick={()=>setIndex(i)}><span/></button>)}</nav>
    <footer><button className="garden-guide-skip" onClick={onClose}>Pular</button><button disabled={index===0} onClick={()=>setIndex(i=>i-1)} aria-label="Página anterior">←</button><button className="garden-guide-next" onClick={()=>index===pages.length-1?onClose():setIndex(i=>i+1)}>{index===pages.length-1?'Começar':'Próximo →'}</button></footer>
  </dialog>;
}
