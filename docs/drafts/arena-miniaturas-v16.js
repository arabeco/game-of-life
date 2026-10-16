// Static preview of ArenaCard's overview composition; app code stays unchanged.
function compactArenaSample(name, icon, accent, progress, old) {
  return `<button class="compact-arena-sample ${old?'current':''}" data-show-arena style="--sample-accent:${accent}"><span class="compact-sample-head"><i>${icon}</i><strong>${escape(name)}</strong></span><span class="compact-sample-actions"><i>📖</i><i>✍️</i><i>🎯</i></span><span class="compact-sample-count">${progress}%</span><span class="compact-sample-progress"><i style="width:${progress}%"></i></span></button>`;
}
function compactArenaGrid(old) {
  return `<div class="compact-arena-grid">${compactArenaSample(values.arena,'📚','#b28a35',50,old)}${compactArenaSample('Movimento','💪','#a6424f',25,old)}${compactArenaSample('Meditação','🧘','#3f70a4',75,old)}</div>`;
}
const renderBeforeCompactArenaPreview=render;
render=function(){
  renderBeforeCompactArenaPreview();
  if(mode!=='thumbnails')return;
  document.getElementById('stage').innerHTML=`<section class="compact-arena-preview"><h2>Miniaturas de arena</h2><p>Estrutura compacta da tela de arenas.</p><h3>Arredondamento atual</h3>${compactArenaGrid(true)}<h3>Cantos mais discretos</h3>${compactArenaGrid(false)}<p>Mesma altura de 76 px, título, ações e progresso. Borda de 8 para 4 px; faixas internas com 4 px.</p></section>`;
};
mode='thumbnails';render();
