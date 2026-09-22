import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const servico = readFileSync(new URL('../services/JournalService.ts', import.meta.url), 'utf8');
const contexto = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
const aba = readFileSync(new URL('../components/JournalTab.tsx', import.meta.url), 'utf8');
const humor = readFileSync(new URL('../components/MoodModal.tsx', import.meta.url), 'utf8');
const migracao = readFileSync(
  new URL('../supabase/migrations/20260922240000_journal_por_paginas.sql', import.meta.url),
  'utf8',
);

/* ==========================================================================
 * O DIARIO NAO PODE ENTRAR NA FILA DE ABERTURA.
 *
 * Tudo o que o GameContext guarda, ele carrega quando o app abre — para todo
 * mundo, toda vez. Um diario e a unica coisa do app que SO CRESCE: colocar as
 * paginas nessa fila faria quem nunca escreve baixar meses de texto que nunca
 * leu, e a conta subiria sozinha com o tempo.
 *
 * A pagina e a unidade de tudo: de leitura, de gravacao e de cobranca. Abrir
 * uma pagina le uma linha; salvar grava a linha que mudou; o indice le so o
 * numero, a data e um pedaco curto.
 *
 * Este teste guarda essa separacao. Ela nao se defende sozinha — basta alguem
 * achar comodo ter o diario "ja carregado" no contexto.
 * ========================================================================== */

// ---------------------------------------------------------------------------
// 1. O CONTEXTO NAO CONHECE O DIARIO.
// ---------------------------------------------------------------------------

assert.ok(
  !/journal/i.test(contexto),
  'o GameContext passou a falar de journal — o diario tem de ser carregado pela tela, nao pela abertura do app',
);

// ---------------------------------------------------------------------------
// 2. QUEM LE E A TELA, E SO QUANDO ABRE.
// ---------------------------------------------------------------------------

assert.match(aba, /from '\.\.\/services\/JournalService'/, 'a aba do diario precisa falar com o servico');
// O diario mora no modal de Humor, e nao no de Checklist: "como estou" e "por
// que" sao a mesma frase partida ao meio. No Checklist ele estava por vizinhanca.
assert.match(humor, /import JournalTab from '\.\/JournalTab'/, 'o diario vive no modal de humor');
assert.match(
  aba,
  /useEffect\(\(\) => \{[\s\S]{0,260}?listarPaginas\(userId\)/,
  'o indice deve ser lido quando a aba monta, e nao antes',
);

// ---------------------------------------------------------------------------
// 3. O INDICE NAO TRAZ O TEXTO DAS PAGINAS.
//
// Ele traz o conteudo de uma coluna so para cortar 60 caracteres aqui; o que
// nao pode e o indice virar "carrega tudo" sem ninguem notar.
// ---------------------------------------------------------------------------

const indice = servico.slice(servico.indexOf('export const listarPaginas'), servico.indexOf('export const lerPagina'));
assert.match(indice, /\.slice\(0, PREVIA\)/, 'o indice precisa cortar a previa');
assert.ok(
  /select\('page_number, updated_at, content'\)/.test(indice),
  'o indice le colunas nomeadas; um select() aberto traria tudo',
);

// ---------------------------------------------------------------------------
// 4. LER E SALVAR SAO SEMPRE DE UMA PAGINA SO.
// ---------------------------------------------------------------------------

const leitura = servico.slice(servico.indexOf('export const lerPagina'), servico.indexOf('export const salvarPagina'));
assert.match(leitura, /\.eq\('page_number', pageNumber\)/, 'ler sem filtrar a pagina traria o diario inteiro');
assert.match(leitura, /\.maybeSingle\(\)/, 'a leitura e de uma linha');

const escrita = servico.slice(servico.indexOf('export const salvarPagina'), servico.indexOf('export const apagarPagina'));
assert.match(escrita, /onConflict: 'user_id,page_number'/, 'salvar tem de atualizar a linha daquela pagina');

// ---------------------------------------------------------------------------
// 5. O BANCO TEM TETO, E O DIARIO E SO DE QUEM ESCREVEU.
// ---------------------------------------------------------------------------

const sql = migracao.replace(/^\s*--.*$/gm, '');
assert.match(sql, /page_number between 1 and 99/, 'o teto de paginas da ao custo um limite conhecido');
assert.match(sql, /char_length\(content\) <= 10000/, 'o teto por pagina protege de um paste de megabytes');
assert.match(sql, /using \(user_id = auth\.uid\(\)\)/, 'so o dono le');
assert.match(sql, /with check \(user_id = auth\.uid\(\)\)/, 'so o dono escreve');
assert.ok(
  !/to anon/.test(sql.slice(sql.indexOf('create policy'))),
  'nenhuma politica do diario pode alcancar anonimo',
);

// O diario nao pode ganhar politica de leitura cruzada, como as outras tabelas
// tem para amigo e para membro de grupo.
assert.equal(
  (sql.match(/create policy/g) || []).length,
  1,
  'o diario tem UMA politica: a do dono. Qualquer outra e leitura de terceiro.',
);

console.log('[journal-egress] ok — a pagina e a unidade, e o contexto nao conhece o diario');
