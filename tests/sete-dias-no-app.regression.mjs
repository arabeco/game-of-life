import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * SETE DIAS NO GLYPH.
 *
 * Decidido pelo Afonso em 10/10/2026: uma missao inicial que paga 10 de ouro,
 * uma vez, para quem abrir o app em 7 dias diferentes. Conta ENTRADA, e nao
 * acao concluida, e faltar um dia nao zera nada — a missao existe para criar o
 * costume, e nao para cobrar sequencia.
 *
 * Quem conta os dias e o servidor: o app so marca o dia e mostra o numero.
 */

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const missoes = ler('constants/systemChallenges.ts');
const contexto = ler('contexts/GameContext.tsx');
const tela = ler('views/SeasonView.tsx');
const migracao = ler('supabase/migrations/20261010120000_sete_dias_no_app.sql');

// ============================== 1. a missao e inicial e paga 10 de ouro
assert.match(missoes, /export const SEVEN_DAYS_IN_APP_ID = 'system-seven-days-in-app';/);
assert.match(missoes, /export const SEVEN_DAYS_IN_APP_GOAL = 7;/);
const missao = missoes.slice(missoes.indexOf('id: SEVEN_DAYS_IN_APP_ID'), missoes.indexOf('rewardGold: 10') + 20);
assert.ok(missao.length > 100, 'a missao dos sete dias sumiu do catalogo');
assert.match(missao, /inicial: true/, 'a missao dos sete dias deixou de ser inicial — passaria a ocupar o slot');
assert.match(missao, /Os dias não precisam ser seguidos/, 'a descricao deixou de dizer que faltar um dia nao zera');
assert.match(missao, /rewardGold: 10/);
console.log('ok - a missao e inicial, explica que os dias nao precisam ser seguidos e paga 10 de ouro');

// ============================== 2. o servidor conta e paga
assert.match(migracao, /create table if not exists public\.dias_no_app/);
assert.match(migracao, /primary key \(user_id, dia\)/, 'sem a chave por dia, abrir duas vezes no mesmo dia contaria dois');
assert.match(migracao, /p_dia < v_hoje - 1 or p_dia > v_hoje \+ 1/, 'o servidor deixou de recusar dia fora da janela');
assert.match(migracao, /revoke insert, update, delete on public\.dias_no_app from anon, authenticated/,
  'a tabela de dias voltou a aceitar escrita direta do cliente');
assert.match(migracao, /elsif p_reward_id = 'system-seven-days-in-app' then\s*v_reward := 10;\s*select count\(\*\) >= 7/,
  'o resgate deixou de conferir os sete dias no servidor');
assert.match(migracao, /if p_reward_id <> 'system-seven-days-in-app' and not exists/,
  'a missao inicial voltou a exigir aceite, e o resgate recusaria com MISSION_NOT_ACCEPTED');
// Nada de sequencia: a contagem e de dias distintos, sem "seguidos".
assert.doesNotMatch(migracao.slice(migracao.indexOf("elsif p_reward_id = 'system-seven-days-in-app'")), /lag\(|consecut|seguid/i);
console.log('ok - o servidor guarda um dia por linha, recusa dia fora da janela e paga com 7 dias, seguidos ou nao');

// ============================== 3. o app marca o dia, conclui e mostra
assert.match(contexto, /supabase\.rpc\('marcar_dia_no_app', \{ p_dia: hoje \}\)/);
assert.match(contexto, /document\.addEventListener\('visibilitychange', marcar\)/,
  'o app deixou de marcar o dia ao voltar para a frente — quem deixa aberto de um dia para o outro nao contaria');
assert.match(contexto, /if \(challenge\.id === SEVEN_DAYS_IN_APP_ID\) return diasNoApp >= SEVEN_DAYS_IN_APP_GOAL;/);
assert.match(tela, /progressLabel=\{`\$\{Math\.min\(diasNoApp, SEVEN_DAYS_IN_APP_GOAL\)\}\/\$\{SEVEN_DAYS_IN_APP_GOAL\} dias`\}/,
  'a tela deixou de mostrar quantos dias ja contaram');
assert.match(tela, /onAbandon=\{selectedQuestIsActive && selectedQuest\.id !== SEVEN_DAYS_IN_APP_ID/,
  'a missao inicial dos sete dias ganhou um botao de abandonar');
console.log('ok - o app marca o dia ao abrir e ao voltar, conclui sozinho com 7 e mostra x/7 dias em Missoes');

console.log('Sete dias no Glyph: entrar conta, faltar nao zera, o servidor paga 10 de ouro uma vez.');
