import assert from 'node:assert/strict';
import {
  getOracleFeedQuotaStatus,
  resolveOracleAutoDailyTarget,
} from '../utils/oracleFeedUtils.ts';

const categories = [
  'frases_inspiradoras',
  'reflexoes_filosoficas',
  'fragmentos_sabedoria',
  'rituais_lifestyle',
  'sussurros_maestria',
];

const preferences = (presenceLevel) => ({
  enabledCategories: categories,
  presenceLevel,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
});

const message = ({ id, category, triggerType, createdAt }) => ({
  id,
  userId: 'user-1',
  category,
  content: 'Conteudo de teste',
  mode: 'neutro',
  deliveryType: 'feed',
  contextSnapshot: { triggerType },
  read: false,
  createdAt,
});

assert.equal(resolveOracleAutoDailyTarget(preferences(0)), 0, 'silencioso nao gera card automatico');
assert.equal(resolveOracleAutoDailyTarget(preferences(1)), 1, 'preferencia antiga leve migra para um card');
assert.equal(resolveOracleAutoDailyTarget(preferences(2)), 1, 'equilibrado limita a um card');
assert.equal(resolveOracleAutoDailyTarget(preferences(3)), 1, 'presente tambem limita a um card');
assert.equal(resolveOracleAutoDailyTarget({ ...preferences(3), enabledCategories: [] }), 0, 'sem tema nao existe entrega automatica');

const now = new Date('2026-08-11T15:00:00.000Z');
const afterAutomatic = getOracleFeedQuotaStatus([
  message({
    id: 'auto-1',
    category: categories[0],
    triggerType: 'cron',
    createdAt: '2026-08-11T14:00:00.000Z',
  }),
], preferences(3), now);

assert.equal(afterAutomatic.autoRemainingToday, 0, 'uma entrega automatica encerra a cota automatica');
assert.equal(afterAutomatic.manualRemainingToday, 4, 'outros quatro temas continuam disponiveis por pedido');

const afterManual = getOracleFeedQuotaStatus([
  message({
    id: 'manual-1',
    category: categories[0],
    triggerType: 'manual',
    createdAt: '2026-08-11T14:00:00.000Z',
  }),
], preferences(2), now);

assert.equal(afterManual.autoRemainingToday, 1, 'um pedido manual nao apaga a unica entrega automatica de outro tema');
assert.equal(afterManual.manualRemainingToday, 4, 'o pedido manual consome somente o tema usado');

console.log('Oracle presence regression: 9 assertions passed.');
