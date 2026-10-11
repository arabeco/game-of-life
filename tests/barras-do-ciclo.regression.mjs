import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BARRA_OURO, BARRA_PRATA, REFLEXO_DA_BARRA } from '../constants/barrasDoCiclo.ts';

/**
 * AS BARRAS DO CICLO SAO IGUAIS NO APP E NO WIDGET (11/10/2026).
 *
 * Pedido do Afonso: "dourada e prata, so que brilhante, e igual nos dois". Eram
 * duas receitas — no app a barra de progresso seguia a nota do ciclo; no widget
 * era ouro com o gradiente espalhado pela largura toda — e o cartao da Ativos
 * calculava os numeros por um caminho diferente do da Arenas e do widget.
 */

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const java = ler('android/app/src/main/java/life/glyph/app/GlyphWidgetPaint.java');
const cartao = ler('components/CycleSummaryCard.tsx');

// ============================== 1. as mesmas cores dos dois lados
const coresJava = (nome) => {
  const linha = java.match(new RegExp(`static final int\\[\\] ${nome} = \\{([^}]*)\\}`));
  assert.ok(linha, `${nome} sumiu do GlyphWidgetPaint`);
  return [...linha[1].matchAll(/"(#[0-9a-fA-F]{6})"/g)].map((m) => m[1].toLowerCase());
};
assert.deepEqual(coresJava('BARRA_OURO'), [BARRA_OURO.escuro, BARRA_OURO.meio, BARRA_OURO.claro], 'o ouro do widget e o do app se separaram');
assert.deepEqual(coresJava('BARRA_PRATA'), [BARRA_PRATA.escuro, BARRA_PRATA.meio, BARRA_PRATA.claro], 'a prata do widget e a do app se separaram');
const alfa = Number(java.match(/REFLEXO_DA_BARRA_ALFA = (0x[0-9A-Fa-f]+);/)?.[1]);
assert.equal(alfa, Math.round(REFLEXO_DA_BARRA * 255), 'o reflexo do widget e o do app tem brilhos diferentes');
console.log('ok - ouro, prata e reflexo tem os mesmos valores no app e no widget');

// ============================== 2. a mesma receita dos dois lados
assert.match(java, /int\[\] cores = forte \? BARRA_OURO : BARRA_PRATA;/, 'a barra do widget voltou a escolher metal por outro caminho');
assert.match(java, /new LinearGradient\(\s*0f, 0f, cheio, 0f,\s*cores,/, 'o gradiente do widget voltou a cobrir a largura toda em vez do pedaco preenchido');
assert.match(cartao, /const cycleWidgetProgressBackground = fundoDaBarra\(BARRA_OURO\);/, 'a barra de progresso do app voltou a seguir a nota do ciclo');
assert.match(cartao, /const cycleWidgetTimeBackground = fundoDaBarra\(BARRA_PRATA\);/);
console.log('ok - progresso em ouro e tempo em prata, com o gradiente no pedaco preenchido, nos dois');

// ============================== 3. os mesmos numeros nos tres lugares
assert.match(ler('components/MiniCycleHUD.tsx'), /const cartao = useCartaoDoCiclo\(cycle\);/, 'o cartao das Arenas saiu da fonte unica');
assert.match(ler('views/AssetsView.tsx'), /<CycleSummaryCard cycleSummary=\{cartaoDoCiclo\?\.cycleSummary \?\? null\}/, 'o cartao da Ativos voltou a montar os numeros por conta propria');
assert.match(ler('hooks/useCartaoDoCiclo.ts'), /buildCycleWidgetSnapshot\(\{ cycle, tasks, actions, arenas, todayDate \}\)/, 'a fonte unica deixou de ser o retrato do widget');
console.log('ok - Ativos, Arenas e widget saem do mesmo retrato do ciclo');

console.log('Barras do ciclo: uma receita, uma fonte, igual no app e no widget.');
