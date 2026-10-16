const renderBeforeActionLight=render;
render=function(){renderBeforeActionLight();if(mode==='action'||mode==='newaction'){
 const plate=document.querySelector('.plate');plate.classList.add('action-light-plate');
 const accent=assetSamples[assetSample][1];
 const gradient=assetSample===0?'linear-gradient(135deg,#4d4d1a 0%,#7a7a2c 100%)':assetSample===3?'linear-gradient(135deg,#1a1a4d 0%,#2c2c7a 100%)':`linear-gradient(135deg,color-mix(in srgb,${accent} 50%,#10141b),color-mix(in srgb,${accent} 72%,#111827))`;
 plate.style.setProperty('--action-color',gradient);
 plate.style.setProperty('--action-accent',accent);
 document.getElementById('idea').textContent='Ação com a placa preta anterior. A cor do ativo aparece no quadradinho, no filete e na aba selecionada.';
 document.getElementById('trade').textContent='Estrutura vertical e abas preservadas. A arena mantém o cabeçalho colorido amplo; a ação tem só um sinal de cor.';
 }};
mode='action';activeSection='general';render();
