import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const funcao = readFileSync(new URL('../supabase/functions/mercadopago/index.ts', import.meta.url), 'utf8');
const cliente = readFileSync(new URL('../components/Store/MercadoPagoBrick.tsx', import.meta.url), 'utf8');
const catalogoApp = readFileSync(new URL('../constants/goldCatalog.ts', import.meta.url), 'utf8');
const config = readFileSync(new URL('../supabase/config.toml', import.meta.url), 'utf8');

/* ==========================================================================
 * O CAMINHO DO DINHEIRO NA WEB.
 *
 * Em 22/09/2026 esta funcao aceitava `amount`, `goldAmount` e `userId` do CORPO
 * da requisicao. Quanto se paga e quanto se recebe eram dois campos livres, e a
 * funcao roda com `verify_jwt = false` — entao qualquer um, sem app e sem
 * login, pagava um centavo, escolhia quanto receber e escolhia em QUAL conta
 * cair. Com `purchaseKind: "membership"` comprava Platinum pelo mesmo centavo,
 * entrando pelo caminho legitimo com service_role, onde o guard de 14/09 (que
 * proibe o cliente de escrever `is_premium`) nao tem como ver.
 *
 * Ninguem tinha usado: o app so tinha o dono e uma amiga. Mas a funcao estava
 * publicada e respondendo — o `x-deno-execution-id` provou.
 *
 * Este teste guarda as tres trancas. Elas nao sao opinioes de estilo: cada uma
 * corresponde a um jeito conhecido de tirar dinheiro ou privilegio daqui.
 * ========================================================================== */

// ---------------------------------------------------------------------------
// 1. O CORPO DA REQUISICAO NAO DECIDE PRECO, PREMIO NEM DONO.
// ---------------------------------------------------------------------------

const rota = funcao.slice(funcao.indexOf('/process_payment'), funcao.indexOf('ENDPOINT DE WEBHOOK'));

for (const proibido of ['corpo?.amount', 'corpo?.goldAmount', 'corpo?.userId', 'corpo?.membershipTier', 'corpo?.purchaseKind']) {
  assert.ok(
    !rota.includes(proibido),
    `o pagamento voltou a ler ${proibido} do corpo — preco, premio e dono saem do catalogo e do token`,
  );
}

assert.match(
  rota,
  /const userId = await usuarioDoToken\(req\)/,
  'o dono da compra tem de sair do token, nunca do corpo',
);
assert.match(rota, /const amount = produto\.priceBrl;/, 'o valor cobrado sai do catalogo');
assert.match(rota, /const produto = CATALOGO\[productId\];/, 'o produto e resolvido pelo catalogo do servidor');

// A anon key identifica o PROJETO, nao a pessoa. Aceita-la e nao ter login.
assert.match(
  funcao,
  /token === Deno\.env\.get\("SUPABASE_ANON_KEY"\)/,
  'a funcao precisa recusar a anon key como se fosse sessao',
);
assert.ok(
  !cliente.includes('Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`'),
  'o cliente voltou a mandar a anon key como Authorization — tem de mandar a sessao',
);
assert.match(cliente, /Authorization: `Bearer \$\{token\}`/, 'o cliente manda o access_token da sessao');

// ---------------------------------------------------------------------------
// 2. O CATALOGO DO SERVIDOR BATE COM O DO APP.
//
// Sao duas copias porque edge function nao importa do app. Duas copias sem
// teste viram dois precos: a loja cobra um valor e o servidor cobra outro.
// ---------------------------------------------------------------------------

const doApp = [...catalogoApp.matchAll(/id: '(pack_gold_\d)'[^}]*?priceBrl: ([\d.]+)[^}]*?totalGold: (\d+)/g)]
  .map(([, id, preco, ouro]) => ({ id, preco: Number(preco), ouro: Number(ouro) }));
assert.equal(doApp.length, 5, `esperava 5 pacotes de ouro no app, achei ${doApp.length}`);

for (const { id, preco, ouro } of doApp) {
  const linha = funcao.match(new RegExp(`${id}: \\{ kind: "gold", priceBrl: ([\\d.]+), gold: (\\d+)`));
  assert.ok(linha, `${id} sumiu do catalogo do servidor`);
  assert.equal(Number(linha[1]), preco, `${id}: a loja cobra ${preco} e o servidor ${linha[1]}`);
  assert.equal(Number(linha[2]), ouro, `${id}: a loja promete ${ouro} de ouro e o servidor entrega ${linha[2]}`);
}

for (const [produto, chave] of [['GOLD_PREMIUM_PRODUCT', 'premium_30d'], ['GOLD_PLATINUM_PRODUCT', 'platinum_30d']]) {
  const noApp = catalogoApp.slice(catalogoApp.indexOf(produto)).match(/priceBrl: ([\d.]+)/);
  const noServidor = funcao.match(new RegExp(`${chave}: \\{ kind: "membership", priceBrl: ([\\d.]+)`));
  assert.ok(noApp && noServidor, `${chave} precisa existir nos dois lados`);
  assert.equal(Number(noServidor[1]), Number(noApp[1]), `${chave}: preco divergente entre app e servidor`);
}

// ---------------------------------------------------------------------------
// 3. O WEBHOOK NAO ACREDITA NA NOTIFICACAO.
//
// Ela diz qual pagamento olhar; quem responde e a API do Mercado Pago. E o que
// se credita sai do catalogo, nao do metadata — mesmo com o metadata sendo
// nosso hoje, ler valor de texto quando se tem a fonte e desnecessario.
// ---------------------------------------------------------------------------

const webhook = funcao.slice(funcao.indexOf('ENDPOINT DE WEBHOOK'));

assert.match(webhook, /await assinaturaConfere\(req, String\(paymentId\)\)/, 'a assinatura do Mercado Pago tem de ser conferida');
assert.match(webhook, /if \(!mpResponse\.ok\) \{[\s\S]{0,400}?return new Response\("Error fetching details"/,
  'falha ao consultar a API tem de desistir — nao existe processar "com o que temos"');
assert.ok(
  !webhook.includes('body.action === "payment.updated"'),
  'o webhook voltou a confiar no corpo da notificacao para decidir se processa',
);
assert.match(webhook, /if \(!mesmoValor\(paymentData\?\.transaction_amount, produto\.priceBrl\)\)/,
  'o valor cobrado tem de bater com o preco de tabela antes de creditar');
assert.match(webhook, /p_gold_amount: produto\.gold/, 'o ouro creditado sai do catalogo');
assert.match(webhook, /p_membership_tier: produto\.tier/, 'o plano ativado sai do catalogo');

// ---------------------------------------------------------------------------
// 4. O ENDPOINT MORTO NAO VOLTA.
//
// `/checkout` nao tinha chamador no app e criava preferencia com preco vindo do
// corpo. Endpoint de pagamento sem uso e superficie de ataque sem contrapartida.
// ---------------------------------------------------------------------------

assert.ok(!funcao.includes('path.endsWith("/checkout")'), 'o endpoint /checkout voltou — ele nao tem chamador');
assert.ok(!/EDGE_FUNCTION_URL\}\/checkout/.test(cliente), 'o app voltou a chamar /checkout');

// ---------------------------------------------------------------------------
// 5. UM LEMBRETE, E NAO UMA TRAVA.
//
// `verify_jwt = false` continua CERTO aqui: o webhook mora na mesma funcao e o
// Mercado Pago nao manda JWT. Por isso a conferencia de sessao e por rota, la
// dentro. Este teste so garante que a escolha esta consciente.
// ---------------------------------------------------------------------------

const trecho = config.slice(config.indexOf('[functions.mercadopago]'));
if (/verify_jwt = false/.test(trecho.split('[functions.')[1] || trecho)) {
  assert.match(
    funcao,
    /usuarioDoToken/,
    'com verify_jwt desligado, a funcao PRECISA conferir a sessao por conta propria',
  );
}

console.log('[pagamento-web] ok — preco, premio e dono saem do servidor');
