const assetSamples=[['Trabalho & Estudos','#b28a35','178,138,53','#ffe0a0'],['Saúde','#a6424f','166,66,79','#ffc0c8'],['Relações','#3f8069','63,128,105','#b9f1d5'],['Propósito & Espiritualidade','#3f70a4','63,112,164','#badfff'],['Lazer & Bem-estar','#b9684b','185,104,75','#ffd2b8']];
let assetSample=0;
const renderBeforeArenaList=render;
render=function(){renderBeforeArenaList();if(mode.includes('arena')||mode==='thumbnails'){const [label,color,rgb,light]=assetSamples[assetSample];const plate=document.querySelector('.plate');plate.style.setProperty('--asset',color);plate.style.setProperty('--asset-rgb',rgb);plate.style.setProperty('--asset-light',light);if(mode.includes('arena')){document.querySelector('.top .eyebrow').textContent=mode==='newarena'?'Nova arena':label;document.querySelector('.top .context').textContent='Arena · seu espaço de desenvolvimento';}const mini=document.querySelector('.mini-area');if(mini)mini.textContent=label.toUpperCase();document.getElementById('idea').textContent='Arena com a cor forte do ativo. Ações em lista: quadradinho à esquerda, nome e informações ao lado.';document.getElementById('trade').textContent='A moldura e o cabeçalho identificam a arena. Cada ação ocupa uma linha, com progresso visível e sem repetir o formato do modal.';let chooser=document.getElementById('asset-preview');if(!chooser){chooser=document.createElement('div');chooser.id='asset-preview';chooser.className='asset-preview';document.querySelector('.notes').appendChild(chooser);}chooser.innerHTML=`<span>Comparar cor do ativo · prévia</span><div class="asset-swatches">${assetSamples.map((a,i)=>`<button data-asset-sample="${i}" style="--sample:${a[1]}" aria-label="${a[0]}" aria-pressed="${assetSample===i}"></button>`).join('')}</div><div class="asset-caption">${label}</div>`;}else document.getElementById('asset-preview')?.remove();};
document.addEventListener('click',e=>{const button=e.target.closest('[data-asset-sample]');if(button){assetSample=+button.dataset.assetSample;render();}});render();

const renderBeforeCompactArena=render;
render=function(){renderBeforeCompactArena();if(mode.includes('arena')||mode==='thumbnails'){
 const ids=['trabalho','saude','relacoes','proposito','lazer'];
 const overrides={trabalho:'linear-gradient(135deg, #4d4d1a 0%, #7a7a2c 100%)',proposito:'linear-gradient(135deg, #1a1a4d 0%, #2c2c7a 100%)'};
 const accent=assetSamples[assetSample][1];
 const gradient=overrides[ids[assetSample]]||`linear-gradient(135deg, color-mix(in srgb, ${accent} 50%, #10141b) 0%, color-mix(in srgb, ${accent} 72%, #111827) 100%)`;
 document.querySelector('.plate').style.setProperty('--planner-gradient',gradient);
 if(mode==='arena') {document.querySelector('.footer').innerHTML='<button class="edit-link" data-edit>Editar arena</button>';}
 document.getElementById('idea').textContent='Arena mais baixa e larga, com o mesmo fundo de cor usado no Planner. Ações em lista com quadradinho e texto ao lado.';
 document.getElementById('trade').textContent='O quadradinho + fica abaixo das ações. O resumo mostra repetições. Nova ação 01 continua vertical e preservada.';
 }};render();
