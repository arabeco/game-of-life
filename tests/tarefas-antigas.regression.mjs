import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { carregarTarefasDaAbertura, DIAS_POR_PEDIDO } from '../utils/tarefasAntigas.ts';

/**
 * AS TAREFAS ANTIGAS VEM DA COPIA DO CELULAR (26/11/2026).
 *
 * 247 dos ~495 KB de cada abertura eram tarefas de 3 meses, baixadas inteiras.
 * A parte com mais de 14 dias passa a vir da copia, dia a dia, e so desce o dia
 * cuja impressao mudou. O app tem de receber as MESMAS linhas de antes; e
 * qualquer duvida cai na consulta antiga, inteira.
 */

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const tarefa = (id, date, extra = {}) => ({ id, date, action_id: 'a1', completed: false, ...extra });
const banco = {
  '2026-09-01': [tarefa('t1', '2026-09-01'), tarefa('t2', '2026-09-01')],
  '2026-10-10': [tarefa('t3', '2026-10-10', { completed: true })],
};
const recentes = [tarefa('t9', '2026-11-20', { user_id: 'u1' })];
const impressoesDe = (b) => Object.keys(b).sort().map((dia) => ({ dia, impressao: JSON.stringify(b[dia]) }));

const montar = (b, contagem, extra = {}) => ({
  recentes: async () => { contagem.recentes += 1; return { data: recentes, error: null }; },
  impressoes: async () => { contagem.impressoes += 1; return { data: impressoesDe(b), error: null }; },
  dias: async (dias) => { contagem.dias.push([...dias]); return { data: dias.flatMap((d) => b[d] || []), error: null }; },
  tudo: async () => { contagem.tudo += 1; return { data: ['CONSULTA ANTIGA'], error: null }; },
  ...extra,
});
const novaContagem = () => ({ recentes: 0, impressoes: 0, dias: [], tudo: 0 });
const copiaEmMemoria = () => {
  const guardado = new Map();
  return {
    guardado,
    ler: async (u) => guardado.get(u) ?? null,
    gravar: async (u, g) => { guardado.set(u, structuredClone(g)); },
  };
};
const ids = (r) => r.data.map((t) => t.id).sort();
const esperar = () => new Promise((r) => setTimeout(r, 0));

// 1. Primeira abertura: sem copia, baixa os dias antigos e guarda.
{
  const copia = copiaEmMemoria();
  const c = novaContagem();
  const r = await carregarTarefasDaAbertura('u1', montar(banco, c), copia);
  assert.deepEqual(ids(r), ['t1', 't2', 't3', 't9'], 'as linhas sao as mesmas da consulta antiga');
  assert.ok(r.data.every((t) => t.user_id === 'u1'), 'o user_id volta em toda linha');
  assert.deepEqual(c.dias, [['2026-09-01', '2026-10-10']]);
  await esperar();
  assert.deepEqual(Object.keys(copia.guardado.get('u1')).sort(), ['2026-09-01', '2026-10-10']);

  // 2. Segunda abertura sem mudanca: nenhum dia antigo desce.
  const c2 = novaContagem();
  const r2 = await carregarTarefasDaAbertura('u1', montar(banco, c2), copia);
  assert.deepEqual(ids(r2), ['t1', 't2', 't3', 't9']);
  assert.deepEqual(c2.dias, [], 'com a copia em dia, o passado nao desce');
  assert.equal(c2.tudo, 0);

  // 3. Uma tarefa antiga foi concluida, outra apagada num dia, um dia sumiu.
  const mudado = {
    '2026-09-01': [tarefa('t1', '2026-09-01', { completed: true })],
    '2026-10-11': [tarefa('t4', '2026-10-11')],
  };
  const c3 = novaContagem();
  const r3 = await carregarTarefasDaAbertura('u1', montar(mudado, c3), copia);
  assert.deepEqual(ids(r3), ['t1', 't4', 't9'], 'apagada sai, nova entra, dia vazio some');
  assert.equal(r3.data.find((t) => t.id === 't1').completed, true, 'a versao nova do dia mudado');
  assert.deepEqual(c3.dias, [['2026-09-01', '2026-10-11']], 'so os dias que mudaram descem');
  await esperar();
  assert.deepEqual(Object.keys(copia.guardado.get('u1')).sort(), ['2026-09-01', '2026-10-11'], 'a copia esquece o dia que saiu');
}

// 4. Qualquer duvida cai na consulta antiga, inteira.
const caiNaAntiga = async (nome, extra, copia = copiaEmMemoria()) => {
  const c = novaContagem();
  const r = await carregarTarefasDaAbertura('u1', montar(banco, c, extra), copia);
  assert.deepEqual(r.data, ['CONSULTA ANTIGA'], nome);
  assert.equal(c.tudo, 1, nome);
};
await caiNaAntiga('migracao nao rodada', { impressoes: async () => ({ data: null, error: { code: 'PGRST202' } }) });
await caiNaAntiga('recentes com erro', { recentes: async () => ({ data: null, error: { message: 'x' } }) });
await caiNaAntiga('rede caiu na impressao', { impressoes: () => { throw new Error('rede'); } });
await caiNaAntiga('impressao torta', { impressoes: async () => ({ data: [{ dia: '2026-09-01' }], error: null }) });
await caiNaAntiga('dia com impressao mas sem linha', { dias: async () => ({ data: [], error: null }) });
await caiNaAntiga('pedido dos dias falhou', { dias: async () => ({ data: null, error: { message: 'x' } }) });
await caiNaAntiga('resposta no teto da API (pode estar cortada)', {
  dias: async (dias) => ({ data: Array.from({ length: 1000 }, (_, i) => tarefa(`x${i}`, dias[0])), error: null }),
});
await caiNaAntiga('copia ilegivel e rede ruim ao mesmo tempo', { dias: async () => ({ data: null, error: {} }) },
  { ler: async () => { throw new Error('IndexedDB'); }, gravar: async () => {} });

// 5. Copia que nao abre nao derruba: so baixa tudo pelos dias.
{
  const c = novaContagem();
  const r = await carregarTarefasDaAbertura('u1', montar(banco, c), { ler: async () => { throw new Error('IndexedDB'); }, gravar: async () => { throw new Error('cheio'); } });
  assert.deepEqual(ids(r), ['t1', 't2', 't3', 't9']);
  assert.equal(c.tudo, 0);
}

// 6. Muitos dias: pedidos em lotes, para a API nao cortar em 1000 linhas.
{
  const grande = {};
  for (let d = 1; d <= 40; d += 1) grande[`2026-08-${String(d).padStart(2, '0')}`] = [tarefa(`g${d}`, `2026-08-${String(d).padStart(2, '0')}`)];
  const c = novaContagem();
  await carregarTarefasDaAbertura('u1', montar(grande, c), copiaEmMemoria());
  assert.ok(c.dias.every((lote) => lote.length <= DIAS_POR_PEDIDO));
  assert.equal(c.dias.flat().length, 40);
}

// 7. A abertura usa o carregador, com o corte de 14 dias, e a migracao existe.
const contexto = ler('contexts/GameContext.tsx');
assert.match(contexto, /carregarTarefasDaAbertura\(userId, \{[\s\S]{0,400}gte\('date', freshFloor\)/, 'os recentes descem do corte em diante');
assert.match(contexto, /rpc\('impressoes_das_tarefas', \{ p_de: minDate, p_ate: freshFloor \}\)/);
assert.match(contexto, /tudo: \(\) => semODono\([\s\S]{0,300}gte\('date', minDate\)\.lte\('date', maxDate\)/, 'a consulta antiga continua de reserva');
const migracao = ler('supabase/migrations/20261126120000_impressao_das_tarefas.sql');
assert.match(migracao, /s\.user_id = auth\.uid\(\)/, 'so as proprias tarefas');
for (const coluna of ['id', 'action_id', 'start_time', 'duration', 'completed', 'completed_at', 'created_at', 'execution_order', 'instance_note', 'reminder_enabled', 'reminder_minutes']) {
  assert.match(migracao, new RegExp(`s\\.${coluna}\\b`), `a impressao tem de cobrir ${coluna}`);
}
const colunasDoApp = ler('utils/aberturaEnxuta.ts').match(/COLUNAS_DA_TAREFA = '([^']+)'/)[1].split(',').map((c) => c.trim()).filter((c) => c !== 'date');
for (const coluna of colunasDoApp) assert.match(migracao, new RegExp(`s\\.${coluna}\\b`), `coluna lida pelo app fora da impressao: ${coluna}`);

console.log('ok - tarefas antigas vem da copia do celular, dia a dia; qualquer duvida cai na consulta antiga');
