import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const shop = readFileSync(new URL('../views/zen3d/KitShop.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../views/zen3d/GardenLayoutPanel.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../views/zen3d/glyphMenu.css', import.meta.url), 'utf8');

assert.match(shop, /ValorIcon valor="ouro" tamanho=\{15\}/, 'compras em ouro precisam mostrar o símbolo de ouro');
assert.match(shop, /garden-shop-actions[\s\S]{0,220}garden-secondary-button[\s\S]{0,180}purchase\(GARDEN_UNLOCKS\[k\.id\]\)/, 'Ver peças precisa ser secundário e a compra precisa continuar no mesmo card');
assert.match(shop, /<span>Comprar<\/span><ValorIcon valor="ouro"[\s\S]{0,100}<b>\{product\.price\}<\/b>/, 'o preço deve aparecer no botão dourado');
assert.match(layout, /ValorIcon valor="fragmento" tamanho=\{15\}/, 'expansões precisam identificar fragmentos no botão');
assert.match(layout, /garden-size-card[\s\S]{0,900}garden-buy-button/, 'o próximo tamanho precisa ter ação de compra destacada');
assert.match(layout, /ValorIcon valor="ouro" tamanho=\{15\}/, 'modelos pagos também precisam usar o símbolo de ouro');
assert.match(css, /garden-secondary-button[\s\S]{0,200}background:transparent/, 'Ver peças precisa permanecer uma ação discreta');
assert.match(css, /garden-buy-button[\s\S]{0,180}display:inline-flex/, 'o botão pago precisa manter preço e ícone alinhados');
console.log('Loja do jardim: preço destacado com moeda e visualização secundária.');
