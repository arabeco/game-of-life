// Prototype only: no scheduled_tasks writes or notification requests.
const demoCycleEnd='2026-11-15';
const weekdayLabels=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
let scheduleConfig=null,scheduleDraft=null,schedulePanel=false;
const calendarDate=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d,12);};
const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const shortDate=s=>calendarDate(s).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
function distribution(config,type=actionType,count=values.repetitions){
 if(!config?.start||!/^\d{4}-\d{2}-\d{2}$/.test(config.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(config.time||''))return {dates:[],error:'Informe a data de início e o horário.'};
 const start=calendarDate(config.start);if(!Number.isFinite(start.getTime())||dateKey(start)!==config.start)return {dates:[],error:'Informe uma data válida.'};
 if(type!=='Recorrente'&&type!=='Compromisso')return {dates:[],error:'Este tipo não usa agendamento fixo.'};
 if(type==='Recorrente'&&!config.days.length)return {dates:[],error:'Escolha ao menos um dia da semana.'};
 const target=type==='Compromisso'?1:count,dates=[];
 for(let d=new Date(start);dateKey(d)<=demoCycleEnd&&dates.length<target;d.setDate(d.getDate()+1))if(type==='Compromisso'||config.days.includes(d.getDay()))dates.push(dateKey(d));
 return {dates,target,missing:target-dates.length,error:dates.length?'':'Nenhuma data cabe no ciclo de exemplo.'};
}
function scheduleSummary(config){if(!config)return 'Não definido';const result=distribution(config);if(result.error)return result.error;return `${result.dates.length} ${result.dates.length===1?'vez':'vezes'} · ${config.time} · ${shortDate(result.dates[0])}–${shortDate(result.dates.at(-1))}`;}
function schedulePreviewMarkup(){const result=distribution(scheduleDraft);return `<div class="schedule-preview" aria-live="polite">${result.error?(result.error==='Informe a data de início e o horário.'?'':`<p>${result.error}</p>`):`<strong>${result.dates.length} de ${result.target} ${result.target===1?'repetição':'repetições'} · ${scheduleDraft.time}</strong><p>${shortDate(result.dates[0])} a ${shortDate(result.dates.at(-1))}${result.missing?` · ${result.missing} não ${result.missing===1?'cabe':'cabem'} no ciclo.`:'.'}</p><details><summary>Conferir datas</summary><div class="schedule-dates">${result.dates.map(d=>`<span>${shortDate(d)} · ${weekdayLabels[calendarDate(d).getDay()]}</span>`).join('')}</div></details>`}</div>`;}
function updateSchedulePreview(){const target=document.querySelector('.schedule-preview');if(target)target.outerHTML=schedulePreviewMarkup();const result=distribution(scheduleDraft);const confirm=document.querySelector('[data-save-schedule]');if(confirm){confirm.disabled=!!result.error;confirm.textContent=result.missing>0?`Agendar ${result.dates.length} de ${result.target}`:'Confirmar agendamento';}}
function renderSchedulePanel(){const body=document.querySelector('.plate .body');body.className='body compact-context schedule-panel';const recurring=actionType==='Recorrente';body.innerHTML=`<button class="schedule-back" data-back-schedule>← Contexto</button><div class="schedule-heading">${recurring?'Distribuir repetições':'Agendar compromisso'}</div><div class="schedule-fields"><label> ${recurring?'A partir de':'Data'}<input type="date" aria-label="Data de início" data-schedule-start value="${scheduleDraft.start}" max="${demoCycleEnd}"></label><label>Horário<input type="time" aria-label="Horário obrigatório" data-schedule-time value="${scheduleDraft.time}" required></label></div>${recurring?`<div class="weekdays" aria-label="Dias da semana">${[1,2,3,4,5,6,0].map(d=>`<button data-weekday="${d}" aria-pressed="${scheduleDraft.days.includes(d)}">${weekdayLabels[d]}</button>`).join('')}</div>`:''}<div class="cycle-example">Ciclo de exemplo · até ${shortDate(demoCycleEnd)}</div>${schedulePreviewMarkup()}<label class="schedule-reminder"><input type="checkbox" data-schedule-reminder ${scheduleDraft.reminder?'checked':''}><span>Lembrar 15 min antes <small>Opcional · não altera a agenda</small></span></label>`;
document.querySelector('.footer').innerHTML='<button class="primary" data-save-schedule>Confirmar agendamento</button>';updateSchedulePreview();}
const renderBeforeScheduling=render;
render=function(){renderBeforeScheduling();if(mode!=='action'&&mode!=='newaction')return;
 const editing=mode==='newaction';
 const types=document.querySelector('.type');if(types){if(!types.querySelector('[data-action-type="Compromisso"]'))types.insertAdjacentHTML('beforeend',`<button data-action-type="Compromisso" class="${actionType==='Compromisso'?'selected':''}">Compromisso</button>`);}
 if(activeSection!=='context')return;
 if(schedulePanel&&editing){renderSchedulePanel();return;}
 const allowed=actionType==='Recorrente'||actionType==='Compromisso';
 const body=document.querySelector('.plate .body');body.className='body compact-context';
 body.innerHTML=editing?`${range('Dificuldade','difficulty',0,3,'/ 3')}<label class="field"><span>Contexto</span><textarea data-content="contextText" placeholder="Onde ou em que situação?">${escape(contextText)}</textarea></label>${allowed?`<button class="schedule-entry" data-open-schedule><span><strong>Agendamento</strong><small>${escape(scheduleSummary(scheduleConfig))}</small></span><span>›</span></button>${scheduleConfig?'<button class="schedule-clear" data-remove-schedule>Remover agendamento</button>':''}`:'<div class="schedule-unavailable">Sem agenda fixa para este tipo.</div>'}`:`${contextText.trim()?`<p class="view-note">${escape(contextText)}</p>`:''}${scheduleConfig?`<div class="schedule-entry"><span><strong>Agendamento</strong><small>${escape(scheduleSummary(scheduleConfig))}</small></span></div><p class="cycle-example">${scheduleConfig.reminder?'Lembrete: 15 min antes':'Sem lembrete'}</p>`:''}`;
};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-open-schedule')){e.stopImmediatePropagation();scheduleDraft=scheduleConfig?{...scheduleConfig,days:[...scheduleConfig.days]}:{start:'2026-10-19',time:'',days:[1,3,5],reminder:false};schedulePanel=true;render();}
 else if(b.dataset.weekday!==undefined){e.stopImmediatePropagation();const day=+b.dataset.weekday;scheduleDraft.days=scheduleDraft.days.includes(day)?scheduleDraft.days.filter(d=>d!==day):[...scheduleDraft.days,day];b.setAttribute('aria-pressed',String(scheduleDraft.days.includes(day)));updateSchedulePreview();}
 else if(b.hasAttribute('data-back-schedule')){e.stopImmediatePropagation();schedulePanel=false;render();}
 else if(b.hasAttribute('data-save-schedule')){e.stopImmediatePropagation();const result=distribution(scheduleDraft);if(result.error)return;scheduleConfig={...scheduleDraft,days:[...scheduleDraft.days]};schedule=result.dates[0]+'T'+scheduleConfig.time;schedulePanel=false;render();message('Agendamento somente na prévia. Nada foi criado no Planner.');}
 else if(b.hasAttribute('data-remove-schedule')){e.stopImmediatePropagation();scheduleConfig=null;schedule='';render();}
 else if(b.dataset.mainSection||b.dataset.mode){schedulePanel=false;}
 else if(b.dataset.actionType&&b.dataset.actionType!==actionType){scheduleConfig=null;schedule='';schedulePanel=false;}
},true);
document.addEventListener('input',e=>{if(e.target.hasAttribute('data-schedule-start')){scheduleDraft.start=e.target.value;updateSchedulePreview();}if(e.target.hasAttribute('data-schedule-time')){scheduleDraft.time=e.target.value;updateSchedulePreview();}});
document.addEventListener('change',e=>{if(e.target.hasAttribute('data-schedule-reminder'))scheduleDraft.reminder=e.target.checked;});
mode='newaction';activeSection='context';render();
