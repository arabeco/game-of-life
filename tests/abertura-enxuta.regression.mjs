import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { COLUNAS_DA_TAREFA, COLUNAS_DO_INVENTARIO, perfilDeAbertura, semODono } from '../utils/aberturaEnxuta.ts';

/**
 * A ABERTURA ENXUTA (12/10/2026) — passo 2 do egress de abertura.
 *
 * Tarefas e inventario descem sem o `user_id` repetido em cada linha, e o perfil
 * sem o `garden_state` do jardim 2D aposentado. O que este teste guarda: o app
 * recebe os mesmos objetos, toda falha cai na consulta antiga, e nenhuma coluna
 * que o app usa ficou de fora da lista.
 */

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const contexto = ler('contexts/GameContext.tsx');

const contador = () => {
  const vezes = { enxuta: 0, completa: 0 };
  return vezes;
};

// ============================== 1. sem o dono: o user_id volta, igual ao de quem pediu
{
  const vezes = contador();
  const r = await semODono('u1',
    async () => { vezes.enxuta += 1; return { data: [{ id: 't1', action_id: 'a1' }], error: null, status: 200 }; },
    async () => { vezes.completa += 1; return { data: [], error: null }; });
  assert.deepEqual(r.data, [{ id: 't1', action_id: 'a1', user_id: 'u1' }], 'a linha voltou diferente da do select *');
  assert.equal(r.error, null);
  assert.deepEqual(vezes, { enxuta: 1, completa: 0 });

  const completa = { data: [{ id: 't1', user_id: 'u1', action_id: 'a1' }], error: null };
  const comErro = await semODono('u1', async () => ({ data: null, error: { message: 'column scheduled_tasks.foo does not exist' } }), async () => completa);
  assert.equal(comErro, completa, 'com erro na consulta enxuta, tinha de valer a consulta antiga');
  const estourou = await semODono('u1', () => { throw new Error('rede'); }, async () => completa);
  assert.equal(estourou, completa);
  const erroDasDuas = { data: null, error: { message: 'offline' } };
  assert.equal(await semODono('u1', async () => erroDasDuas, async () => erroDasDuas), erroDasDuas, 'o erro da consulta antiga tem de chegar ao app como antes');
  console.log('ok - tarefas e inventario sem user_id na rede; ele volta no app, e qualquer falha usa a consulta antiga');
}

// ============================== 2. o perfil sem o jardim
{
  const vezes = contador();
  const perfil = { id: 'u1', nickname: 'mister x', wallet: { gold: 10 } };
  const r = await perfilDeAbertura('u1',
    async () => { vezes.enxuta += 1; return { data: perfil, error: null }; },
    async () => { vezes.completa += 1; return { data: null, error: null }; });
  assert.deepEqual(r, { data: perfil, error: null });
  assert.deepEqual(vezes, { enxuta: 1, completa: 0 });

  const antigo = { data: { id: 'u1', nickname: 'mister x', garden_state: {} }, error: null };
  const casos = [
    ['funcao nao criada', async () => ({ data: null, error: { code: 'PGRST202' } })],
    ['sem perfil (confere antes de a abertura criar um)', async () => ({ data: null, error: null })],
    ['perfil de outra conta', async () => ({ data: { id: 'u2' }, error: null })],
    ['resposta estranha', async () => ({ data: [perfil], error: null })],
    ['rede', () => { throw new Error('rede'); }],
  ];
  for (const [nome, enxuta] of casos) {
    assert.equal(await perfilDeAbertura('u1', enxuta, async () => antigo), antigo, `${nome}: tinha de valer a consulta antiga`);
  }
  console.log('ok - o perfil desce sem garden_state; funcao ausente, perfil vazio ou estranho conferem na consulta antiga');
}

// ============================== 3. nenhuma coluna usada ficou de fora
const tipos = ler('types.ts');
const tarefa = tipos.slice(tipos.indexOf('export interface ScheduledTask {'), tipos.indexOf('}', tipos.indexOf('export interface ScheduledTask {')));
const camposDaTarefa = [...tarefa.matchAll(/^\s+(\w+)\??:/gm)].map((m) => m[1]).filter((campo) => campo !== 'userId');
const snake = (campo) => campo.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`);
const colunasDaTarefa = COLUNAS_DA_TAREFA.split(',').map((c) => c.trim());
for (const campo of camposDaTarefa) {
  assert.ok(colunasDaTarefa.includes(snake(campo)), `ScheduledTask.${campo} existe e nao esta em COLUNAS_DA_TAREFA — a tarefa chegaria sem ele`);
}

const inventario = contexto.slice(contexto.indexOf('const fetchInventory = useCallback('), contexto.indexOf('setInventory(items);'));
const lidosDoInventario = new Set([...inventario.matchAll(/row\.(\w+)/g)].map((m) => m[1]));
const colunasDoInventario = COLUNAS_DO_INVENTARIO.split(',').map((c) => c.trim());
for (const coluna of lidosDoInventario) {
  assert.ok(colunasDoInventario.includes(coluna), `fetchInventory le row.${coluna}, que nao esta em COLUNAS_DO_INVENTARIO`);
}
console.log('ok - toda coluna que a tarefa e o inventario usam esta na lista enxuta');

// ============================== 4. o app usa as consultas enxutas, com as antigas de reserva
const filtrosDoBoot = ".eq('user_id', userId).gte('date', minDate).lte('date', maxDate)";
assert.ok(contexto.includes(`select(COLUNAS_DA_TAREFA)${filtrosDoBoot}`), 'as tarefas da abertura voltaram a vir com select *');
assert.ok(contexto.includes(`select('*')${filtrosDoBoot}`), 'a consulta antiga das tarefas deixou de ser a reserva');
assert.ok(contexto.includes("select(COLUNAS_DA_TAREFA).eq('user_id', userId).gt('date', horizon).lte('date', targetDate)"), 'o horizonte do planner voltou a baixar com select *');
assert.ok(contexto.includes("select(COLUNAS_DO_INVENTARIO).eq('user_id', userId)"), 'o inventario voltou a vir com select *');
assert.match(contexto, /perfilDeAbertura\(\s*userId,\s*\(\) => supabase\.rpc\('meu_perfil_de_abertura'\),\s*\(\) => supabase\.from\('user_profiles'\)\.select\('\*'\)\.eq\('id', userId\)\.maybeSingle\(\),/,
  'o perfil da abertura deixou de usar a funcao sem o jardim, com a consulta antiga de reserva');
console.log('ok - a abertura usa as consultas enxutas, e as antigas ficam de reserva');

// ============================== 5. o banco, e o jardim 2D continua sem leitor
const migracao = ler('supabase/migrations/20261012190000_perfil_de_abertura.sql');
assert.match(migracao, /select to_jsonb\(p\) - 'garden_state'\s+from public\.user_profiles p\s+where p\.id = auth\.uid\(\)/);
assert.doesNotMatch(migracao, /^\s*security definer/im, 'a funcao do perfil passou a ignorar a regra de acesso da tabela');

// A abertura nao traz mais o garden_state. Se uma tela voltar a ler o jardim 2D,
// ela precisa buscar o campo — senao mostra o jardim vazio, e quem salvar apaga o de verdade.
const leitores = [];
for (const pasta of ['components', 'views']) {
  for (const arquivo of readdirSync(new URL(`../${pasta}`, import.meta.url), { recursive: true })) {
    if (!/\.(tsx?|jsx?)$/.test(arquivo)) continue;
    if (/gardenState/.test(ler(`${pasta}/${arquivo}`))) leitores.push(`${pasta}/${String(arquivo).replace(/\\/g, '/')}`);
  }
}
assert.deepEqual(leitores, ['views/SettingsView.tsx'], `tela nova lendo gardenState: ${leitores.join(', ')} — a abertura nao traz mais esse campo`);
assert.match(ler('views/SettingsView.tsx'), /gardenState: row\.garden_state \?\? row\.gardenState \?\? undefined/);
console.log('ok - a funcao respeita a regra de acesso, e nenhuma tela le o jardim 2D que deixou de descer');

console.log('Abertura enxuta: tarefas e inventario sem user_id, perfil sem garden_state, e tudo com a consulta antiga de reserva.');
