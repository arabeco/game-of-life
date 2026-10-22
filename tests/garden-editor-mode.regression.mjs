import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../views/zen3d/SandExperiment.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../views/zen3d/glyphMenu.css', import.meta.url), 'utf8');

assert.match(source, /useState<GardenMode>\('explore'\)/,
  'o jardim do dono precisa abrir para observar, sem entrar direto na edição');
assert.match(source, /enterGarden=.*setMode\('explore'\)/,
  'o botão Entrar precisa voltar à cena limpa');
assert.match(source, /enterEdit=.*setMode\('build'\).*setTool\('decor'\).*setDrawerCollapsed\(true\)/,
  'Editar deve permitir selecionar itens, mas começar com o painel recolhido');
assert.match(source, />Entrar<\/button>/, 'o atalho para entrar precisa permanecer disponível');
assert.match(source, /className="zen3d-edit"[\s\S]{0,300}>Editar/, 'Editar precisa ficar ao lado de Entrar');
assert.match(source, /drawerCollapsed\?'⌃ Expandir edição':'⌄ Recolher edição'/,
  'o painel só pode abrir pelo controle Expandir edição');
assert.doesNotMatch(source, /decor\.cancel\(\);setDrawerCollapsed\(false\);/,
  'clicar na cena não deve expandir o painel');
assert.match(css, /sand-tools\.is-collapsed \.garden-editor-actions,.glyph-garden \.sand-tools\.is-collapsed \.sand-modes\{display:none\}/,
  'o painel recolhido não pode manter as abas de edição ocupando a tela');
console.log('Modo do jardim: cena limpa, edição explícita e painel expandido só por comando.');
