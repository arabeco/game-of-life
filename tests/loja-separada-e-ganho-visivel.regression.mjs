import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

const topBar = ler('components/Store/StoreTopBar.tsx');
const storeView = ler('views/StoreView.tsx');
const goldStore = ler('components/Store/GoldStore.tsx');
const membershipStore = ler('components/Store/MembershipStore.tsx');
const brick = ler('components/Store/MercadoPagoBrick.tsx');
const gate = ler('components/Store/BillingCheckoutGate.tsx');
const gameContext = ler('contexts/GameContext.tsx');

// --- 1. Ouro e plano nao dividem aba -----------------------------------------
//
// Para as lojas, ouro e CONSUMIVEL e plano e ASSINATURA: tipo de produto
// diferente, regra de reembolso diferente, restauracao diferente. E quem chega
// pelo link de "faltam 40 moedas" nao pode aterrissar ao lado de um pitch de
// assinatura, que le como isca.
assert.match(topBar, /'membership'/, 'a aba de planos precisa existir no tipo');
assert.match(storeView, /activeTab === 'membership'/, 'StoreView precisa montar a aba de planos');
assert.match(storeView, /'membership'/, 'membership precisa estar em ALLOWED_TABS');

for (const proibido of ['GOLD_PREMIUM_PRODUCT', 'GOLD_PLATINUM_PRODUCT', 'gold-store-premium', 'gold-store-platinum']) {
    assert.doesNotMatch(goldStore, new RegExp(proibido), `a aba de ouro nao pode mais conter ${proibido}`);
}
for (const exigido of ['GOLD_PREMIUM_PRODUCT', 'GOLD_PLATINUM_PRODUCT']) {
    assert.match(membershipStore, new RegExp(exigido), `a aba de planos precisa conter ${exigido}`);
}
// Os boosts ficam com o ouro: sao pagos EM ouro, entao quem esta ali ja tem a moeda.
assert.match(goldStore, /gold-store-boosts/, 'os boosts continuam na aba de ouro');
assert.doesNotMatch(membershipStore, /GOLD_BOOST_PRODUCTS/, 'boost nao e assinatura');

// --- 2. O tipo da aba tem um dono so -----------------------------------------
//
// A uniao estava copiada em dois arquivos, e quando 'membership' nasceu so um
// soube. Copia de uniao envelhece em silencio: o TypeScript nao reclama de um
// valor que o outro lado passou a aceitar.
assert.match(gameContext, /storeTab\?: StoreTab/, 'o prompt de ouro usa o tipo real da aba');
assert.doesNotMatch(
    gameContext,
    /storeTab\?: 'store' \| 'codexes' \| 'items'/,
    'a uniao de abas nao pode voltar a ser escrita a mao aqui',
);

// --- 3. Nenhum beco sem saida quando falta moeda ------------------------------
//
// Quem clica em comprar disse exatamente o que queria. Responder "nao da" e
// parar ali perde a venda com a intencao ja declarada.
assert.match(
    gameContext,
    /Ouro insuficiente para abrir outro espaço[\s\S]{0,400}promptGoldShortage/,
    'o slot de relacionamento precisa oferecer a compra, nao so avisar',
);

// Fragmento NAO se compra: mandar pra loja de ouro seria pior que o beco, porque
// a pessoa chegaria numa tela de pacotes procurando fragmento. O que falta ali e
// dizer de onde ele vem.
assert.match(gameContext, /fragmentos para \$\{catalogItem\.title\}[\s\S]{0,120}Arsenal/, 'fragmento diz de onde vem');

// O bloco que varria todos os <button> procurando o texto "LOJA" era inalcancavel
// e quebraria no primeiro rename.
assert.doesNotMatch(
    gameContext,
    /querySelectorAll\('button'\)[\s\S]{0,120}LOJA/,
    'navegacao por texto de botao nao pode voltar',
);

// --- 4. O ganho de ouro e anunciado DEPOIS do fechamento ----------------------
//
// Este e o ponto que regride em silencio. O credito acontece com o modal de
// pagamento ainda aberto: a barra de moedas fica atras dele e o numero sobe
// escondido. Anunciar junto do credito volta a animar no escuro — e ninguem
// percebe, porque o saldo final fica certo de qualquer jeito.
for (const [nome, fonte] of [['MercadoPagoBrick', brick], ['BillingCheckoutGate', gate]]) {
    assert.match(fonte, /anunciarGanhoDeOuro/, `${nome} precisa anunciar o ganho`);
    const posClose = fonte.search(/onClose\(\)/);
    const posAnuncio = fonte.search(/anunciarGanhoDeOuro\(/);
    assert.ok(posClose >= 0 && posAnuncio > posClose, `${nome}: o anuncio vem depois do fechamento`);
}
assert.doesNotMatch(
    brick,
    /showToast\(`\$\{gainedGold\}[\s\S]{0,200}anunciarGanhoDeOuro/,
    'o anuncio nao pode voltar para junto do credito',
);

// A barra precisa escutar, senao o evento cai no vazio.
assert.match(topBar, /GOLD_GAIN_EVENT/, 'a barra escuta o ganho');
assert.match(topBar, /goldNaTela/, 'a barra mostra a contagem, nao so o saldo');

console.log('Loja separada e ganho visivel: ouro e plano em abas diferentes, nenhum beco sem saida, e o "+N" sobe com a barra a vista.');
