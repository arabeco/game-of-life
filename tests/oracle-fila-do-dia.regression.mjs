import assert from 'node:assert/strict';
import { filaDoDia } from '../supabase/functions/_shared/oracle-fila-do-dia.ts';

/**
 * A FILA DO DIA (04/11/2026, com o Afonso). A rotina dos cards sorteava 25 contas
 * a cada 10 minutos: gastava consultas com quem ja tinha recebido e, com muita
 * gente, deixava outros sem card. Agora so entra quem ainda precisa de algo.
 */
const conta = (userId, temSabedoria = true) => ({ userId, temSabedoria });
const entrega = (userId, purpose, createdAt) => ({ userId, purpose, createdAt });

// Recebeu as duas entregas: nao gera nenhuma consulta.
assert.deepEqual(filaDoDia([conta('a')], [entrega('a', 'cycle_insight', '2026-11-04T10:00:00Z'), entrega('a', 'premium_content_card', '2026-11-04T12:00:00Z')], 25), []);
// Sem temas de Sabedoria, so a leitura do ciclo conta.
assert.deepEqual(filaDoDia([conta('b', false)], [entrega('b', 'cycle_insight', '2026-11-04T10:00:00Z')], 25), []);
// Falta uma das duas: continua na fila.
assert.deepEqual(filaDoDia([conta('c')], [entrega('c', 'cycle_insight', '2026-11-04T10:00:00Z')], 25), ['c']);
// Quem nao recebeu nada vem antes; depois, quem recebeu ha mais tempo.
assert.deepEqual(
  filaDoDia([conta('tarde'), conta('cedo'), conta('nada')], [entrega('tarde', 'cycle_insight', '2026-11-04T12:00:00Z'), entrega('cedo', 'cycle_insight', '2026-11-04T08:00:00Z')], 25),
  ['nada', 'cedo', 'tarde'],
);
// O teto da rodada corta o fim da fila, sem sorteio.
assert.deepEqual(filaDoDia([conta('1'), conta('2'), conta('3')], [], 2), ['1', '2']);
console.log('Fila do dia: so entra quem ainda precisa de card, sem sorteio.');
