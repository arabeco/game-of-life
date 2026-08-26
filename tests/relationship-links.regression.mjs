import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  RELATIONSHIP_LINK_BASE_PRICE,
  RELATIONSHIP_LINK_DURATION_DAYS,
  getRelationshipDaysLeft,
  getRelationshipLifecycle,
  getRelationshipLinkPrice,
  getRelationshipRenewalPrice,
} from '../constants/relationshipLinks.ts';

/**
 * O vinculo virou o produto, e este teste guarda a promessa.
 *
 * O modelo antigo cobrava por ACAO dentro de um vinculo gratuito, e a unica tela
 * que falava de dinheiro falava do preco errado: os convites tinham sido zerados
 * numa migracao de agosto e o texto continuou, imprimindo literalmente "cobra 0
 * no envio, o reembolso acontece se a pessoa recusar". Quem pagava, pagava
 * depois, num momento sobre o qual nada avisava.
 *
 * O que precisa continuar verdade:
 *   1. o preco que a tela MOSTRA e o mesmo que o banco COBRA;
 *   2. renovar custa menos que criar;
 *   3. vencer congela o vinculo, nao apaga;
 *   4. nenhuma tela volta a falar de reembolso de convite.
 */

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const migration = read('supabase/migrations/20260826120000_relationship_link_as_timed_product.sql');
const hub = read('components/RelationshipHubModal.tsx');

// --- o preco exibido e o preco cobrado ------------------------------------
// Sao dois arquivos porque um roda no navegador e o outro no Postgres. Nada
// impede que divirjam, exceto isto aqui.
const precoNoBanco = migration.slice(
  migration.indexOf('create or replace function public.relationship_link_price'),
  migration.indexOf('create or replace function public.relationship_link_default_slots'),
);
assert.ok(precoNoBanco.length > 0, 'a funcao de preco do banco deve ser identificavel');

for (const [tipo, preco] of Object.entries(RELATIONSHIP_LINK_BASE_PRICE)) {
  assert.match(
    precoNoBanco,
    new RegExp(`when '${tipo}' then ${preco}\\b`),
    `${tipo} custa ${preco} no cliente; o banco tem de cobrar o mesmo`,
  );
}

// --- so a mentoria escala por vaga ----------------------------------------
// Vaga extra em parceria e competicao nao significaria nada: uma tem forma fixa
// de uma arena por lado, a outra e o par espelhado.
assert.equal(getRelationshipLinkPrice('mentoria', 1), 100);
assert.equal(getRelationshipLinkPrice('mentoria', 3), 200, 'duas vagas extras a 50 cada');
assert.equal(getRelationshipLinkPrice('parceria', 3), 50, 'parceria nao escala por vaga');
assert.equal(getRelationshipLinkPrice('competicao', 3), 50, 'competicao nao escala por vaga');

// --- renovar sempre custa menos que criar ---------------------------------
// Cobrar cheio de novo puniria exatamente a dupla que deu certo.
for (const tipo of Object.keys(RELATIONSHIP_LINK_BASE_PRICE)) {
  assert.ok(
    getRelationshipRenewalPrice(tipo) < getRelationshipLinkPrice(tipo),
    `renovar ${tipo} nao pode custar o mesmo que criar`,
  );
  assert.ok(getRelationshipRenewalPrice(tipo) >= 1, 'renovacao nunca e de graca');
}

// --- vencer congela, nao apaga --------------------------------------------
const agora = new Date('2026-08-26T12:00:00Z');
const daqui = (dias) => new Date(agora.getTime() + dias * 86400000).toISOString();

assert.equal(getRelationshipLifecycle({ expiresAt: daqui(10) }, agora), 'ativo');
assert.equal(getRelationshipLifecycle({ expiresAt: daqui(-1) }, agora), 'expirado');
assert.equal(
  getRelationshipLifecycle({ expiresAt: daqui(-1), endedAt: daqui(-2) }, agora),
  'encerrado',
  'encerrado a mao e decisao, nao vencimento',
);
assert.equal(
  getRelationshipLifecycle({ expiresAt: null }, agora),
  'ativo',
  'vinculo antigo sem prazo gravado nao pode aparecer como vencido',
);

// --- a contagem de dias arredonda para cima -------------------------------
// Faltando 4 horas ainda e "1d": mostrar "0d" com o vinculo funcionando seria
// mentira, e mostrar negativo nao existe.
assert.equal(getRelationshipDaysLeft({ expiresAt: daqui(29) }, agora), 29);
assert.equal(getRelationshipDaysLeft({ expiresAt: new Date(agora.getTime() + 4 * 3600000).toISOString() }, agora), 1);
assert.equal(getRelationshipDaysLeft({ expiresAt: daqui(-5) }, agora), 0, 'vencido para de contar');
assert.equal(getRelationshipDaysLeft({ expiresAt: null }, agora), null);

// --- o prazo do banco e o mesmo que a tela promete ------------------------
assert.equal(RELATIONSHIP_LINK_DURATION_DAYS, 30);
assert.match(migration, /now\(\) \+ interval '1 month'/, 'o banco tem de dar o mesmo mes que a tela promete');

// --- o duelo nunca sobrevive ao vinculo -----------------------------------
// Um vinculo de um mes com duelo de 45 dias venceria com duelo em voo, e nao ha
// resposta boa: anular pune quem estava jogando, esticar faz o prazo nao
// significar nada.
assert.match(
  migration,
  /v_duration_days := least\(v_duration_days, v_max_days\)/,
  'o duelo precisa de teto amarrado ao vencimento do vinculo',
);

// --- vinculo vencido congela de verdade -----------------------------------
// Sem recusar acao nova, o prazo nao significaria nada.
assert.ok(
  (migration.match(/RELATIONSHIP_LINK_EXPIRED/g) || []).length >= 2,
  'expor arena e forjar duelo precisam recusar vinculo vencido',
);

// --- as acoes de dentro nao cobram mais -----------------------------------
assert.match(migration, /'price_gold', 0/, 'expor arena passa a ser incluso');

// --- e a cobranca fica no ENVIO, nao no aceite ----------------------------
// Cobrar no aceite deixava a cobranca falhar na pior hora: o remetente gasta o
// saldo enquanto espera resposta, o outro aceita, e nao ha como pagar.
const criaVinculo = migration.slice(
  migration.indexOf('create or replace function public._relationship_start_link'),
);
assert.doesNotMatch(
  criaVinculo.slice(0, criaVinculo.indexOf('$fn$;')),
  /_codex_debit_gold/,
  'criar o vinculo no aceite nao pode mexer em ouro: quem pagou pagou no envio',
);
assert.match(
  migration,
  /return public\.relationship_link_price\(p_link_type, 1\);/,
  'o custo do convite tem de sair da mesma tabela de precos do vinculo',
);
const forjarDueloInteiro = migration.slice(
  migration.indexOf('create or replace function public.create_competition_challenge'),
);
const forjarDuelo = forjarDueloInteiro.slice(0, forjarDueloInteiro.indexOf('\n$$;'));
assert.ok(forjarDuelo.length > 0, 'o corpo de create_competition_challenge deve ser identificavel');

assert.doesNotMatch(
  forjarDuelo,
  /_codex_debit_gold/,
  'forjar duelo nao pode voltar a cobrar: o vinculo ja foi pago',
);

// Um por vez tambem no servidor. O cliente dizia 3, esta funcao dizia 3, e o
// indice unico relationship_competition_challenges_active_link_idx aceitava 1
// desde marco — o segundo forjar passava pelas duas checagens e morria na
// constraint. Contando coisas diferentes: aqui sealed_at, la completed_at.
assert.match(
  forjarDuelo,
  /\) >= 1 then/,
  'o servidor tambem precisa recusar a partir do primeiro duelo aberto',
);

// --- a devolucao acontece, mas nenhuma tela a explica --------------------
// Recusar devolve o ouro de verdade — e por isso que cobrar no envio e seguro.
// O que nao volta e o PARAGRAFO: o texto antigo descrevia a politica inteira
// numa tela onde a cobranca era de zero. O ouro simplesmente volta.
const semComentarios = hub.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '');
assert.doesNotMatch(semComentarios, /reembolso/i, 'o texto de reembolso de convite nao volta');
assert.doesNotMatch(semComentarios, /mentoria basica/i, '"basica" era sobra de um modo que nao existe mais');

// --- o cliente nao promete mais duelos do que o banco aceita --------------
// Havia indice unico (relationship_link_id where completed_at is null) desde
// marco, e a tela dizia 3: o segundo forjar morria com erro do servidor.
assert.match(
  hub,
  /const competitionCanLaunch = openCompetitionChallenges\.length === 0;/,
  'um duelo por vez, que e o que o banco impoe',
);
assert.doesNotMatch(semComentarios, /3 duelos abertos/, 'o limite de 3 nunca existiu no banco');

console.log('Vinculo como produto: um preco, um prazo, renovacao pela metade, e nada cobrando por dentro.');
