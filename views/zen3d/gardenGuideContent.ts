export const GUIDE_VERSION = 2;
export const GUIDE_KEY = 'glyph.garden.guide.version';
export const GUIDE_PAGES = [
  { id:'inicio', version:1, title:'Sem tarefa, sem pressa', text:'Um lugar para respirar, desenhar e montar sua paisagem. Venha quando quiser; aqui não há obrigação diária.', alt:'Vista completa do jardim com árvores, pedras e areia' },
  { id:'areia', version:1, title:'Desenhar na areia', text:'Em Areia, arraste para desenhar e abra Opções para escolher garfo e cor. Alisar suaviza uma região; as setas ← e →, ao lado de Salvar, voltam e avançam o que você fez: traços e peças.', alt:'Traço na areia e controles Desenhar, Alisar e as setas de voltar e avançar' },
  { id:'pecas', version:1, title:'Cada peça no seu lugar', text:'Em Itens, escolha uma peça e posicione no jardim. Toque nas peças da paisagem para mover, girar ou remover.', alt:'Coleção de pedras, plantas e ornamentos do jardim' },
  { id:'passear', version:1, title:'Olhar e passear', text:'Recolha o painel e use dois dedos para girar e aproximar. Toque em Entrar para caminhar com o joystick; no computador, use WASD.', alt:'Passeio entre a árvore, o caminho de pedras e a placa do Legado' },
  { id:'presente', version:1, title:'Um presente de vez em quando', text:'O saquinho fica ao lado da placa do Legado. Suas ações podem render 5 a 15 fragmentos ou, raramente, um baú Comum. Toque nele para recolher, sem prazo para perder.', alt:'Saquinho com laço azul dentro do jardim, perto da placa do Legado' },
  { id:'salvar', version:2, title:'Personalizar e salvar', text:'Em Jardim, escolha formato e compre mais espaço com fragmentos. A Loja usa ouro; a forja do inventário usa fragmentos. Suas peças ficam no lugar. Ao terminar, toque em Concluir: ele salva e volta para a vista geral.', alt:'Opções de formato e tamanho com o botão Concluir' },
] as const;
let sessionSeen = 0;
export function readGuideVersion() {
  try { const n=Number(localStorage.getItem(GUIDE_KEY)); return Math.max(sessionSeen,Number.isInteger(n)&&n>0?n:0); }
  catch { return sessionSeen; }
}
export function markGuideSeen() {
  sessionSeen=Math.max(readGuideVersion(),GUIDE_VERSION);
  try { localStorage.setItem(GUIDE_KEY,String(sessionSeen)); } catch { /* Storage may be unavailable in embedded/private views. */ }
}
export function guidePagesFor(seen:number,readOnly:boolean,manual=false) {
  return readOnly?[]:GUIDE_PAGES.filter(page=>manual||page.version>seen);
}
