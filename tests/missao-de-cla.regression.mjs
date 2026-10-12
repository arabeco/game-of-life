import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lerStatusDaMissao, rotuloDaMissao, metaBatida, podeReceber, deveRecolher, mensagemDoErroDaMissao, assinaturaDaMissao } from '../utils/missaoDoCla.ts';

/** MISSAO DE CLA NO APP (12/10/2026). Desenho: docs/superpowers/specs/2026-10-12-missao-de-cla-design.md */
const ler = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ============================== 1. ler o status
const bruto = { quest_id: 'clan-genesis-socializar', goal: 20, total: 23, ends_on: '2026-12-31', expired: false, joined: true, claimed: false, has_clan: true,
  members: [{ user_id: 'a', nickname: 'Ana', done: 15 }, { user_id: 'b', nickname: 'Beto', done: 8 }] };
const s = lerStatusDaMissao(bruto);
assert.equal(rotuloDaMissao(s), '20/20', 'o rotulo passou da meta');
assert.equal(metaBatida(s), true);
assert.equal(podeReceber(s), true);
assert.equal(podeReceber({ ...s, recebi: true }), false);
assert.equal(podeReceber({ ...s, entrei: false }), false, 'quem nao entrou nao recebe');
assert.deepEqual(s.membros.map((m) => m.feito), [15, 8]);
assert.equal(lerStatusDaMissao(null), null);
assert.equal(lerStatusDaMissao({ goal: 20 }), null, 'sem quest_id nao e status');
console.log('ok - o status vira X/Y, e so quem entrou pode receber');

// ============================== 2. recolher so a vencida sem meta (risco 4)
assert.equal(deveRecolher({ ...s, vencida: true, total: 5 }), true);
assert.equal(deveRecolher({ ...s, vencida: true, total: 20 }), false, 'concluida fica no ArenasView');
assert.equal(deveRecolher({ ...s, vencida: false, total: 0 }), false);
assert.equal(deveRecolher({ ...s, temCla: false, vencida: false, total: 0 }), false, 'sem cla ainda nao recolhe nada');
assert.equal(mensagemDoErroDaMissao('MISSAO_VENCIDA'), 'Esta missão já venceu.');
assert.equal(mensagemDoErroDaMissao('SEM_CLA'), 'Entre num clã para participar da missão.');
const tarefas = [{ actionId: 'x', completed: true }, { actionId: 'x', completed: false }, { actionId: 'y', completed: true }];
assert.equal(assinaturaDaMissao(tarefas, new Set(['x'])), 'x:1');
assert.notEqual(assinaturaDaMissao([{ actionId: 'x', completed: true }, { actionId: 'x', completed: true }], new Set(['x'])), 'x:1', 'marcar mais uma nao mudou a assinatura');
console.log('ok - so a vencida sem meta se recolhe, e a assinatura muda quando a missao muda');

// ============================== 3. os dados da temporada e a chave
const temporada = ler('constants/seasonContent.ts');
const flags = ler('constants/featureFlags.ts');
assert.match(flags, /clanSeasonQuests: true/);
assert.match(flags, /clanMissions: false/, 'a prioridade do lider voltou a ligar');
const genesis = temporada.slice(temporada.indexOf("'season-genesis-0': {"), temporada.indexOf("'season-zenite-1-2026'"));
const missao = genesis.slice(genesis.indexOf("id: 'clan-genesis-socializar'"));
assert.ok(missao.length > 0, 'a missao de teste saiu da Genesis');
assert.match(missao, /type: 'clan'/);
assert.match(missao, /goal_value: 20/);
assert.match(missao, /reward_value: 'Raro'/);
assert.match(missao.slice(0, missao.indexOf('reward_value') + 30), /reward_value: 'Raro'/, 'missao de cla nao paga bau de temporada');
const sql = ler('supabase/migrations/20261012200000_missao_de_cla.sql');
assert.match(sql, /'clan-genesis-socializar', 'season-genesis-0', 20, date '2026-12-31', 'Raro'/, 'a meta ou o fim do app nao bate com o servidor');
console.log('ok - a missao de teste esta na Genesis, igual ao servidor, com bau Raro');
