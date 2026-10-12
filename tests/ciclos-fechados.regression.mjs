import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { carregarCiclosFechados, copiaNoCelular } from '../utils/ciclosFechados.ts';

/**
 * OS CICLOS FECHADOS, GUARDADOS NO CELULAR (12/10/2026) — passo 1 do egress de abertura.
 *
 * O pedido do Afonso foi "adiantar, mas nao pode dar erro". O que este teste
 * guarda: o app recebe as MESMAS linhas, na mesma ordem, que a consulta antiga
 * devolvia; so desce o relatorio novo ou mudado; e qualquer falha cai na
 * consulta antiga, inteira — nunca numa lista pela metade.
 */

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const esperar = () => new Promise((resolver) => setTimeout(resolver, 10));

const linha = (id, versao = 1) => ({ id, user_id: 'u1', name: `Ciclo ${id}`, report_data: { cycle_name: `Ciclo ${id}`, versao, metrics: { weekly_atlas: [{ week_index: 0 }] } } });
const hash = (id, versao = 1) => `h-${id}-${versao}`;

// Um banco de mentira: conta o que foi pedido.
const banco = (linhas, { impressoesFalham = false, linhasFalham = false } = {}) => {
  const pedidos = { impressoes: 0, linhas: [], tudo: 0 };
  return {
    pedidos,
    fontes: {
      impressoes: async () => {
        pedidos.impressoes += 1;
        if (impressoesFalham) return { data: null, error: { message: 'column cycles.report_hash does not exist' } };
        return { data: linhas.map((l) => ({ id: l.id, report_hash: hash(l.id, l.report_data.versao) })), error: null };
      },
      linhas: async (ids) => {
        pedidos.linhas.push([...ids]);
        if (linhasFalham) return { data: null, error: { message: 'rede' } };
        return { data: linhas.filter((l) => ids.includes(l.id)).reverse(), error: null };
      },
      tudo: async () => {
        pedidos.tudo += 1;
        return { data: linhas, error: null };
      },
    },
  };
};

const copiaDeMentira = (inicial = null, { lerFalha = false, gravarFalha = false } = {}) => {
  const estado = { guardado: inicial, gravacoes: 0 };
  return {
    estado,
    copia: {
      ler: async () => { if (lerFalha) throw new Error('ilegivel'); return estado.guardado; },
      gravar: async (_userId, guardados) => { if (gravarFalha) throw new Error('cheio'); estado.gravacoes += 1; estado.guardado = guardados; },
    },
  };
};

const servidor = [linha('c3'), linha('c2'), linha('c1')]; // ordem da consulta: end_date desc

// ============================== 1. primeira abertura: desce tudo, uma vez, e guarda
{
  const { fontes, pedidos } = banco(servidor);
  const { copia, estado } = copiaDeMentira();
  const r = await carregarCiclosFechados('u1', fontes, copia);
  assert.deepEqual(r.data, servidor, 'o app recebeu linhas diferentes (ou em outra ordem) da consulta antiga');
  assert.equal(r.error, null);
  assert.deepEqual(pedidos.linhas, [['c3', 'c2', 'c1']]);
  assert.equal(pedidos.tudo, 0);
  await esperar();
  assert.deepEqual(Object.keys(estado.guardado).sort(), ['c1', 'c2', 'c3'], 'a copia nao guardou os relatorios');
  assert.equal(estado.guardado.c2.hash, hash('c2'));
  console.log('ok - sem copia, desce cada relatorio uma vez, na ordem da consulta antiga, e guarda');
}

// ============================== 2. abertura seguinte: nada desce
{
  const { fontes, pedidos } = banco(servidor);
  const guardado = Object.fromEntries(servidor.map((l) => [l.id, { hash: hash(l.id), row: l }]));
  const { copia } = copiaDeMentira(guardado);
  const r = await carregarCiclosFechados('u1', fontes, copia);
  assert.deepEqual(r.data, servidor, 'pela copia, o app recebeu outra coisa');
  assert.deepEqual(r.data.map((l) => l.report_data.metrics.weekly_atlas.length), [1, 1, 1], 'o atlas tem de vir junto — a nota e as pendencias dependem dele');
  assert.deepEqual(pedidos.linhas, [], 'relatorio igual ao guardado desceu de novo');
  assert.equal(pedidos.tudo, 0);
  console.log('ok - com a copia em dia, so as impressoes descem, e o app recebe o relatorio inteiro, atlas inclusive');
}

// ============================== 3. so o novo e o mudado descem; o que saiu da lista sai da copia
{
  const agora = [linha('c4'), linha('c3', 2), linha('c2')];
  const { fontes, pedidos } = banco(agora);
  const guardado = Object.fromEntries(servidor.map((l) => [l.id, { hash: hash(l.id), row: l }]));
  const { copia, estado } = copiaDeMentira(guardado);
  const r = await carregarCiclosFechados('u1', fontes, copia);
  assert.deepEqual(r.data, agora);
  assert.equal(r.data[1].report_data.versao, 2, 'o relatorio mudado no servidor ficou na versao velha da copia');
  assert.deepEqual(pedidos.linhas, [['c4', 'c3']], 'desceu relatorio que nao mudou');
  await esperar();
  assert.deepEqual(Object.keys(estado.guardado).sort(), ['c2', 'c3', 'c4'], 'ciclo que saiu da lista continuou na copia');
  console.log('ok - desce so o ciclo novo e o relatorio mudado (recalculo da nota, SQL na mao), e a copia acompanha');
}

// ============================== 4. sem a migracao: a consulta antiga, inteira
{
  const { fontes, pedidos } = banco(servidor, { impressoesFalham: true });
  const { copia } = copiaDeMentira();
  const r = await carregarCiclosFechados('u1', fontes, copia);
  assert.deepEqual(r.data, servidor);
  assert.equal(pedidos.tudo, 1);
  assert.deepEqual(pedidos.linhas, []);
  console.log('ok - sem report_hash no banco (SQL nao rodado), o app baixa como antes');
}

// ============================== 5. qualquer outra falha: a consulta antiga, uma vez so
{
  const { fontes, pedidos } = banco(servidor, { linhasFalham: true });
  const r = await carregarCiclosFechados('u1', fontes, copiaDeMentira().copia);
  assert.deepEqual(r.data, servidor);
  assert.equal(pedidos.tudo, 1, 'a falha no meio tem de cair na consulta antiga exatamente uma vez');

  // copia ilegivel = sem copia
  const b2 = banco(servidor);
  const r2 = await carregarCiclosFechados('u1', b2.fontes, copiaDeMentira(null, { lerFalha: true }).copia);
  assert.deepEqual(r2.data, servidor);
  assert.deepEqual(b2.pedidos.linhas, [['c3', 'c2', 'c1']]);

  // copia que nao grava: o app segue com os dados
  const b3 = banco(servidor);
  const r3 = await carregarCiclosFechados('u1', b3.fontes, copiaDeMentira(null, { gravarFalha: true }).copia);
  assert.deepEqual(r3.data, servidor);
  await esperar();

  // linha guardada estragada (sem report_data, ou de outro id): desce de novo, nao some
  const b4 = banco(servidor);
  const estragada = { c3: { hash: hash('c3'), row: { id: 'c3' } }, c2: { hash: hash('c2'), row: linha('c1') }, c1: { hash: hash('c1'), row: linha('c1') } };
  const r4 = await carregarCiclosFechados('u1', b4.fontes, copiaDeMentira(estragada).copia);
  assert.deepEqual(r4.data, servidor, 'um relatorio estragado na copia sumiu ou trocou de lugar');
  assert.deepEqual(b4.pedidos.linhas, [['c3', 'c2']]);

  // o servidor nao devolveu uma das linhas pedidas: lista pela metade nunca
  const b5 = banco(servidor);
  b5.fontes.linhas = async () => ({ data: [linha('c3')], error: null });
  const r5 = await carregarCiclosFechados('u1', b5.fontes, copiaDeMentira().copia);
  assert.deepEqual(r5.data, servidor);
  assert.equal(b5.pedidos.tudo, 1);

  // sem ciclo fechado: lista vazia, como antes
  const b6 = banco([]);
  const r6 = await carregarCiclosFechados('u1', b6.fontes, copiaDeMentira().copia);
  assert.deepEqual(r6.data, []);
  assert.equal(b6.pedidos.tudo, 0);
  console.log('ok - rede, copia ilegivel, copia cheia, linha estragada ou faltando: nunca uma lista pela metade');
}

// ============================== 6. sem IndexedDB (node, WebView estranha): recusa, nao quebra
await assert.rejects(copiaNoCelular.ler('u1'));
{
  const { fontes } = banco(servidor);
  const r = await carregarCiclosFechados('u1', fontes);
  assert.deepEqual(r.data, servidor);
}
console.log('ok - sem IndexedDB, a copia recusa e o app baixa normalmente');

// ============================== 7. o app e o banco
const contexto = ler('contexts/GameContext.tsx');
const migracao = ler('supabase/migrations/20261012170000_impressao_do_relatorio.sql');
const chamada = contexto.slice(contexto.indexOf('() => carregarCiclosFechados(userId, {'), contexto.indexOf("() => supabase.from('campaigns')"));
const consultaAntiga = ".eq('user_id', userId).not('report_data', 'is', null).order('end_date', { ascending: false }).limit(100)";
assert.ok(chamada.includes(`select('id, report_hash')${consultaAntiga}`), 'as impressoes deixaram de seguir o filtro, a ordem e o limite da consulta antiga');
assert.ok(chamada.includes(`tudo: () => supabase.from('cycles').select('*')${consultaAntiga}`), 'a consulta de reserva deixou de ser a antiga');
assert.doesNotMatch(contexto, /from\('cycles'\)\.select\('\*'\)\.eq\('user_id', userId\)\.not\('report_data', 'is', null\)[^\n]*,\n\s*\(\) => supabase\.from\('campaigns'\)/,
  'a abertura voltou a baixar todos os relatorios direto');
assert.match(migracao, /create or replace function public\.report_hash\(c public\.cycles\)/);
assert.doesNotMatch(migracao, /alter table|create trigger|update public\.cycles/i,
  'a impressao virou coluna guardada ou gatilho — o select * passaria a traze-la e um save de ciclo poderia manda-la de volta');
console.log('ok - a abertura usa a copia com a mesma consulta de antes como reserva, e a impressao e calculada, nao guardada');

console.log('Ciclos fechados: o app recebe o mesmo, so desce o que mudou, e qualquer falha baixa como antes.');
