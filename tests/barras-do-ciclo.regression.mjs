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

// ============================== 4. o resto da ficha tambem igual (11/10/2026: "tudo igual o maximo possivel")
const provedor = ler('android/app/src/main/java/life/glyph/app/GlyphWidgetProvider.java');
const layout = ler('android/app/src/main/res/layout/glyph_widget.xml');
// Moldura: o mesmo gradiente de 118 graus, com as mesmas paradas, dos dois lados.
assert.match(cartao, /linear-gradient\(118deg, \$\{cycleWidgetFinish\.dark\} 0%, \$\{cycleWidgetFinish\.pale\} 12%, \$\{cycleWidgetFinish\.mid\} 40%, \$\{cycleWidgetFinish\.pale\} 52%, \$\{cycleWidgetFinish\.dark\} 84%, \$\{cycleWidgetFinish\.pale\} 100%\)/);
assert.match(java, /gradienteCss\(118, 0f, 0f, largura, altura,\s*new int\[\] \{ metal\.dark, metal\.pale, metal\.mid, metal\.pale, metal\.dark, metal\.pale \},\s*new float\[\] \{ 0f, 0\.12f, 0\.40f, 0\.52f, 0\.84f, 1f \}\)/,
  'a moldura do widget deixou de ser a do cartao');
// O corte de canto do clip-path do cartao: 5% da largura, 20% da altura.
assert.match(cartao, /polygon\(5% 0, 95% 0, 100% 20%, 100% 80%, 95% 100%, 5% 100%, 0 80%, 0 20%\)/);
assert.match(java, /octogono\(0f, 0f, largura, altura, largura \* 0\.05f, altura \* 0\.20f\)/, 'o corte do canto do widget deixou de ser o do cartao');
// A pedra com o mesmo veu de 42% (rgba 6,8,12).
assert.match(cartao, /rgba\(6, 8, 12, 0\.42\)/);
assert.match(java, /veu\.setColor\(0x6B06080C\);/);
// Titulo: o claro do acabamento, 10 de corpo, as mesmas linhas a 72%.
assert.match(provedor, /views\.setTextColor\(R\.id\.glyph_widget_title, metal\.pale\);/, 'o titulo do widget deixou de usar o claro do acabamento, como o cartao');
assert.match(java, /static float tamanhoDoTitulo\(String titulo\) \{[\s\S]*?return 10f;/, 'o titulo do widget voltou a crescer alem dos 10 do cartao');
assert.match(java, /comAlfa\(claro, 0xB8\)/, 'as linhas do titulo do widget deixaram de ser as do cartao');
// Layout: so periodo, titulo, Progresso e Tempo com ciclo; as mesmas cores do cartao.
assert.match(provedor, /progressPercent,\s*timeProgress,\s*false,\s*false,\s*true,/, 'com ciclo, o widget voltou a mostrar as linhas de dia e de status a mais');
assert.match(layout, /android:textColor="#A8B6C9"\s*android:textSize="8sp"/, 'o periodo do widget saiu da cor do cartao');
console.log('ok - moldura, corte, pedra, titulo, linhas e textos do widget seguem o cartao do app');

console.log('Barras do ciclo: uma receita, uma fonte, igual no app e no widget.');
