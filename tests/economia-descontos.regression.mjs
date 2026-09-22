import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../utils/premiumAccess.ts', import.meta.url), 'utf8');
const banco = readFileSync(
  new URL('../supabase/migrations/20260922220000_platinum_paga_o_que_a_tela_mostra.sql', import.meta.url),
  'utf8',
);

/* ==========================================================================
 * A TELA E O BANCO TEM DE COBRAR O MESMO.
 *
 * Em 22/09/2026 nao cobravam. A cena do legado custa 50 de ouro; o desconto do
 * Platinum subiu de 50% para 70% no app, e a funcao no banco continuou com o
 * `v_cost := 25` de antes — o mesmo valor do Premium.
 *
 * Resultado: a tela mostrava 15, o banco debitava 25, a compra dava CERTO e
 * ninguem era avisado. Bug sem mensagem de erro, no beneficio de quem paga o
 * plano mais caro.
 *
 * O defeito so foi possivel porque o desconto era um numero solto nos dois
 * lados. Agora e tabela dos dois lados, e este teste compara as duas.
 * ========================================================================== */

// ---------------------------------------------------------------------------
// 1. O MESMO DESCONTO NOS DOIS LADOS.
// ---------------------------------------------------------------------------

/** So o bloco da tabela pedida. O arquivo tem tres tabelas por tier, e ler o
 *  resto sobrescrevia `premium` com o valor da tabela seguinte — foi o primeiro
 *  jeito que eu escrevi este teste, e ele acusou um erro que nao existia. */
const tabelaDoApp = (nome) => {
  const inicio = app.indexOf(`${nome}: Record<SubscriptionTier, number> = {`);
  assert.ok(inicio > 0, `${nome} sumiu de premiumAccess.ts`);
  const bloco = app.slice(inicio, app.indexOf('};', inicio));
  const lido = Object.fromEntries(
    [...bloco.matchAll(/(premium|platinum):\s*([A-Z_]+|[\d.]+)/g)]
      .map(([, tier, valor]) => [tier, /^[A-Z_]+$/.test(valor) ? valor : Number(valor)]),
  );
  for (const [tier, valor] of Object.entries(lido)) {
    if (typeof valor !== 'string') continue;
    // Sem regex de proposito: montar uma com o nome da constante dentro exige
    // escapar barra invertida dentro de template literal, e foi exatamente ali
    // que este teste se enganou sozinho da primeira vez.
    const marca = `${valor} = `;
    const posicao = app.indexOf(marca);
    assert.ok(posicao > 0, `${valor} nao tem valor em premiumAccess.ts`);
    lido[tier] = Number(app.slice(posicao + marca.length).split(';')[0].trim());
  }
  return lido;
};

const doApp = tabelaDoApp('LEGACY_PROJECTION_DISCOUNT_BY_TIER');

assert.equal(Object.keys(doApp).length, 2, `esperava premium e platinum, achei ${JSON.stringify(doApp)}`);
assert.ok(doApp.platinum > doApp.premium, 'o tier de cima tem de descontar MAIS que o de baixo');

const doBanco = Object.fromEntries(
  [...banco.slice(banco.indexOf('_desconto_da_cena_do_legado'))
    .matchAll(/when '(platinum|premium)'\s*then ([\d.]+)/g)]
    .map(([, tier, valor]) => [tier, Number(valor)]),
);

for (const tier of ['premium', 'platinum']) {
  assert.equal(
    doBanco[tier],
    doApp[tier],
    `${tier}: a tela desconta ${doApp[tier]} e o banco ${doBanco[tier]} — um dos dois vai cobrar errado`,
  );
}

// ---------------------------------------------------------------------------
// 2. O PRECO FINAL, EM OURO, BATE.
//
// Comparar a taxa nao basta: o app usa Math.round e o banco usa floor. Nos
// valores de hoje os dois dao inteiro exato, e este teste existe para o dia em
// que o preco base deixar de ser redondo.
// ---------------------------------------------------------------------------

const BASE = 50;
const precoNoApp = (desconto) => Math.max(0, Math.round(BASE * (1 - desconto)));
const precoNoBanco = (desconto) => Math.max(1, Math.floor(BASE * (1 - desconto)));

for (const tier of ['premium', 'platinum']) {
  assert.equal(
    precoNoBanco(doBanco[tier]),
    precoNoApp(doApp[tier]),
    `${tier}: tela cobra ${precoNoApp(doApp[tier])} e banco cobra ${precoNoBanco(doBanco[tier])}`,
  );
}

// Os numeros de hoje, escritos por extenso: se alguem mexer sem querer, o teste
// diz qual era o combinado.
assert.equal(precoNoApp(doApp.premium), 25, 'Premium deve pagar 25 pela cena do legado');
assert.equal(precoNoApp(doApp.platinum), 15, 'Platinum deve pagar 15 pela cena do legado');

// ---------------------------------------------------------------------------
// 3. O DEFEITO EXATO NAO VOLTA.
//
// O que quebrou foi um valor fixo para todo mundo com plano. Se ele reaparecer,
// o teste acima pode passar e a funcao cobrar errado mesmo assim.
// ---------------------------------------------------------------------------

// Comentarios fora: a nota no alto da migracao CITA o codigo velho, com o
// `v_cost := 25;` e tudo. Lendo o arquivo cru, o teste acusava o proprio
// texto que explica o conserto.
const sqlSemNota = banco.replace(/^\s*--.*$/gm, '');
const corpo = sqlSemNota.slice(
  sqlSemNota.indexOf('if v_is_premium then'),
  sqlSemNota.indexOf('if v_active_tier = \'platinum\''),
);
assert.ok(
  !/v_cost\s*:=\s*\d+\s*;/.test(corpo),
  'o custo com plano voltou a ser numero fixo — ele tem de sair do desconto por tier',
);
assert.match(
  corpo,
  /_desconto_da_cena_do_legado\(v_active_tier\)/,
  'o custo com plano tem de ser calculado pelo desconto do tier ativo',
);

// ---------------------------------------------------------------------------
// 4. O CREDITO ANTIGO CONTINUA HONRADO.
//
// Ele deixou de ser o beneficio anunciado, mas quem ja recebeu nao pode perder.
// ---------------------------------------------------------------------------

assert.match(
  banco,
  /legacy_projection_scene_credits, 0\) > 0/,
  'o caminho do credito gratis sumiu — quem tem saldo nao pode perder',
);
assert.match(app, /hasLegacyProjectionSceneCredit\(profile\)\) return 0/, 'a tela tem de continuar mostrando 0 para quem tem credito');

console.log('[economia-descontos] ok — tela e banco cobram o mesmo');
