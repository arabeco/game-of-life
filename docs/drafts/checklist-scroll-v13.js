const renderBeforeChecklistScroll=render;
render=function(){renderBeforeChecklistScroll();if((mode!=='action'&&mode!=='newaction')||activeSection!=='note')return;
 const body=document.querySelector('.plate .body');body.classList.add('note-checklist-body');
 const headings=body.querySelectorAll('.combined-section>.section-title');if(headings.length>1){headings[1].textContent='Checklist · '+headings[1].textContent;headings[0].remove();}
 const rows=[...body.querySelectorAll('.checkrow')];
 if(rows.length){const list=document.createElement('div');list.className='checklist-scroll';list.tabIndex=0;list.setAttribute('role','region');list.setAttribute('aria-label','Itens do checklist');rows[0].before(list);rows.forEach(row=>list.appendChild(row));}
 const reading=body.querySelector('.view-note');if(reading){reading.tabIndex=0;reading.setAttribute('role','region');reading.setAttribute('aria-label','Anotação da ação');}
};
mode='newaction';activeSection='note';render();
