let editingArena=false;
const pencilIcon='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 3 5 5-12 12-6 1 1-6Z"/><path d="m14 5 5 5"/></svg>';
const trashIcon='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>';
const renderBeforeRefinement=render;
render=function(){renderBeforeRefinement();if(!mode.includes('arena'))return;
 const top=document.querySelector('.top');
 if(mode==='arena'){
  top.insertAdjacentHTML('afterbegin',`<button class="arena-pencil" aria-label="Editar arena" data-arena-edit>${pencilIcon}</button>`);
  document.querySelector('.footer').innerHTML='';
 }else if(editingArena){
  top.querySelector('.eyebrow').textContent=assetSamples[assetSample][0];
  document.querySelector('.footer').innerHTML=`<div class="arena-edit-actions"><button class="arena-delete" data-arena-delete>${trashIcon}<span>Excluir arena</span></button><button class="arena-save" data-arena-save>Salvar</button></div>`;
  top.insertAdjacentHTML('afterbegin','<button class="arena-pencil" aria-label="Voltar à arena" data-arena-cancel>←</button>');
 }
 document.getElementById('trade').textContent='Quadradinhos arredondados, nome e área centralizados. O lápis abre a edição; excluir aparece apenas ali. Nova ação 01 permanece preservada.';
};
let arenaDraftBefore=null;
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-arena-edit')){e.stopImmediatePropagation();arenaDraftBefore={name:values.arena,description:values.description};editingArena=true;mode='newarena';activeSection='general';render();}
 else if(b.hasAttribute('data-arena-save')){e.stopImmediatePropagation();editingArena=false;mode='arena';activeSection='general';render();message('Alteração apenas nesta prévia. Nada foi salvo no app.');}
 else if(b.hasAttribute('data-arena-cancel')){e.stopImmediatePropagation();if(arenaDraftBefore){values.arena=arenaDraftBefore.name;values.description=arenaDraftBefore.description;}editingArena=false;mode='arena';activeSection='general';render();}
 else if(b.hasAttribute('data-arena-delete')){e.stopImmediatePropagation();const dialog=document.createElement('dialog');dialog.className='arena-delete-dialog';dialog.innerHTML='<form method="dialog"><div class="eyebrow">Exclusão · demonstração</div><h2>Excluir esta arena?</h2><p>Esta é uma prévia visual. Nenhum dado do Glyph será excluído.</p><div><button value="cancel">Cancelar</button><button value="delete" class="danger-confirm">Excluir</button></div></form>';document.body.appendChild(dialog);dialog.addEventListener('close',()=>{if(dialog.returnValue==='delete')message('Exclusão demonstrada. A arena do app permanece intacta.');dialog.remove();});dialog.showModal();}
 else if(b.dataset.mode){editingArena=false;}
},true);
render();
