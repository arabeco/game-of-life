const durationLabel=n=>n<60?`${n} min`:`${Math.floor(n/60)}h${n%60?` ${n%60} min`:''}`;
function updateDurationLabel(){const label=document.querySelector('.duration-equivalent');if(label)label.textContent=durationLabel(values.duration);}
const durationStops=[15,30,45,60,75,90,105,120,150,180,210,240,300,360,420,480];
const closestDurationIndex=value=>durationStops.reduce((best,n,i)=>Math.abs(n-value)<Math.abs(durationStops[best]-value)?i:best,0);
const originalVisibleTabs=visibleTabs;
visibleTabs=function(){if(mode!=='action'&&mode!=='newaction')return originalVisibleTabs();const editing=mode==='newaction';return [['general','Geral'],...(editing||schedule||contextText.trim()?[['context','Contexto']]:[]),...(editing||note.trim()||checks.length?[['note','Checklist']]:[]),...(editing||imageUrl||mediaLink.trim()?[['media','Mídia']]:[])];};
const originalSectionContent=sectionContent;
sectionContent=function(){if(mode!=='action'&&mode!=='newaction')return originalSectionContent();const selected=activeSection;const editing=mode==='newaction';const part=id=>{activeSection=id;const html=originalSectionContent();activeSection=selected;return html;};
 if(selected==='context')return part('context')+(editing||schedule?'<section class="combined-section">'+part('schedule')+'</section>':'');
 if(selected==='note')return (editing||note.trim()?part('note'):'')+(editing||checks.length?'<section class="combined-section"><div class="section-title">Checklist</div>'+part('checklist')+'</section>':'');
 return originalSectionContent();};
const renderBeforeControls=render;
render=function(){renderBeforeControls();if(mode!=='newaction'&&mode!=='action')return;
 const navItems=visibleTabs();
 document.querySelector('.tabs').innerHTML=navItems.map(([id,label])=>`<button data-main-section="${id}" class="${id===activeSection?'active':''}" aria-pressed="${id===activeSection}">${label}</button>`).join('');
 document.querySelector('.tabs').classList.add('four-tabs');
 const typeGroup=document.querySelector('.type');if(typeGroup){for(const type of ['Recorrente','Livre','Marco']){const button=typeGroup.querySelector(`[data-action-type="${type}"]`);if(button)typeGroup.appendChild(button);}}
 const slider=document.querySelector('[data-range="duration"]');
 if(slider){slider.min=0;slider.max=durationStops.length-1;slider.step=1;slider.value=closestDurationIndex(values.duration);slider.setAttribute('aria-valuetext',values.duration+' minutos');const scale=slider.nextElementSibling;scale.innerHTML='<span>15 min</span><output class="duration-equivalent" aria-label="Duração em horas e minutos"></output><span>8h</span>';updateDurationLabel();}
 const repetitions=document.querySelector('[data-range="repetitions"]');if(repetitions)repetitions.step=1;
 document.querySelectorAll('[data-number]').forEach(n=>{n.step=1;n.inputMode='numeric';});
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-main-section]');if(!b)return;e.stopImmediatePropagation();activeSection=b.dataset.mainSection;render();},true);
document.addEventListener('input',e=>{const el=e.target;
 if(el.dataset.range==='duration'){e.stopImmediatePropagation();values.duration=durationStops[Number(el.value)];document.querySelector('[data-number="duration"]').value=values.duration;el.setAttribute('aria-valuetext',values.duration+' minutos');}
 else if(el.dataset.number){e.stopImmediatePropagation();if(el.value==='')return;const value=Number(el.value);if(!Number.isFinite(value))return;const key=el.dataset.number;values[key]=Math.round(Math.min(+el.max,Math.max(+el.min,value)));const slider=document.querySelector(`[data-range="${key}"]`);if(slider){slider.value=key==='duration'?closestDurationIndex(values[key]):values[key];slider.setAttribute('aria-valuetext',values[key]+(key==='duration'?' minutos':' repetições'));}}
 updateDurationLabel();
},true);
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.number)el.value=values[el.dataset.number];updateDurationLabel();},true);
mode='newaction';activeSection='general';render();
