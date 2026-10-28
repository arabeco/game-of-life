import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * A LUZ DA RARIDADE E A PLACA DO ARTEFATO.
 *
 * Duas coisas da area do soberano que pareciam defeito, relatadas juntas:
 *
 *   "no meu inventario alguns items tao com luzinha atras na area do soberano
 *    outros nao / e o fundo da placa nao ta funcionando no slot do artefato,
 *    o slot de artefato tem q ser quadrado nao retangular"
 *
 * Os comentarios sao tirados antes de procurar, para um trecho citado num
 * comentario nao passar por codigo vivo.
 */
const semComentarios = (codigo) => codigo
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\s*\}/g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

// ===================================== 1. todo item tem a luz da sua raridade
//
// So o tier 4 em diante brilhava, e o equipado trocava a propria luz por um
// verde quase apagado. Na aba Soberano, que mistura tiers, metade da grade
// tinha luz e metade nao.
const inventario = semComentarios(readFileSync(new URL('../components/Store/Inventory.tsx', import.meta.url), 'utf8'));

assert.doesNotMatch(inventario, /shadow:\s*tier\s*>=?\s*\d\s*\?/,
    'a luz do card voltou a depender do tier — metade da grade acende e metade nao');

const tabela = inventario.match(/const LUZ_DO_TIER[^=]*=\s*\{([\s\S]*?)\n\};/);
assert.ok(tabela, 'a tabela de luz por tier sumiu do inventario');
const degraus = [...tabela[1].matchAll(/(\d+):\s*\{\s*raio:\s*(\d+),\s*alfa:\s*([\d.]+)\s*\}/g)]
    .map(([, tier, raio, alfa]) => ({ tier: Number(tier), raio: Number(raio), alfa: Number(alfa) }));
assert.deepEqual(degraus.map(d => d.tier), [1, 2, 3, 4, 5, 6],
    'todo tier de 1 a 6 precisa de luz propria');
for (let i = 1; i < degraus.length; i++) {
    assert.ok(degraus[i].alfa > degraus[i - 1].alfa && degraus[i].raio >= degraus[i - 1].raio,
        `a luz do tier ${degraus[i].tier} nao e maior que a do ${degraus[i - 1].tier} — a raridade deixa de crescer`);
}
assert.ok(degraus[0].alfa >= 0.2,
    'a luz do comum ficou fraca demais: luz que quase some volta a parecer que falta');
console.log('ok - todo tier tem luz, e ela cresce com a raridade');

assert.doesNotMatch(inventario, /boxShadow:\s*equipped\s*\?/,
    'o item equipado voltou a trocar a luz da raridade por outra');
assert.match(inventario, /boxShadow:\s*styles\.shadow\s*\}/,
    'o card deixou de usar a luz da raridade');
console.log('ok - equipado mantem a luz do proprio tier; o selo verde diz que esta vestido');

// ========================== 2. o slot do artefato e quadrado, como a placa
//
// Sobrou da coluna antiga um slot de 96x184. A placa e um PNG quadrado: em
// `contain` ela boiava no meio como um selo, com faixas vazias em cima e
// embaixo — parecia que nao tinha carregado.
const editor = readFileSync(new URL('../components/SovereignCustomizer.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
// Desde a vitrine (tres vagas de artefato abaixo do soberano), cada vaga e um
// quadrado que recorta a placa compartilhada por baixo do artefato.
const inicioDoSlot = editor.indexOf('aria-label="Artefatos equipados"');
assert.ok(inicioDoSlot > 0, 'as vagas de artefato sumiram do editor');
const slot = editor.slice(inicioDoSlot, editor.indexOf('</div>', editor.indexOf('</button>', inicioDoSlot)));

const caixa = slot.match(/className="relative[^"]*"/);
assert.ok(caixa, 'a caixa da vaga do artefato sumiu');
const largura = caixa[0].match(/\bw-\[([\d.]+rem)\]/);
const altura = caixa[0].match(/\bh-\[([\d.]+rem)\]/);
assert.ok(largura && altura, 'a vaga do artefato perdeu a medida fixa');
assert.equal(largura[1], altura[1], `a vaga do artefato voltou a ser retangular (${largura[1]} x ${altura[1]})`);
assert.match(caixa[0], /overflow-hidden/, 'sem overflow-hidden a placa vaza pelos cantos arredondados');
console.log('ok - cada vaga de artefato e quadrada e recorta a placa');

assert.match(slot, /equippedSharedPlate\.url[\s\S]*?object-cover/,
    'a placa deixou de cobrir a vaga: em contain ela vira um selo boiando no meio');
assert.match(slot, /imgClassName="h-full w-full object-contain"/, 'o artefato deixou de ocupar a vaga');
console.log('ok - a placa e o fundo da vaga inteira, e o artefato ocupa a vaga');

console.log('Luz e placa do soberano: a raridade acende todo card; o artefato mora num quadrado.');
