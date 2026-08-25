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

// --- saudacao de abertura --------------------------------------------------
// O painel abria mudo: o Oraculo so falava reagindo a algo ja feito. A saudacao
// e o cumprimento ao abrir, e ela SO existe na presenca 3. Em silencioso e
// equilibrado o painel continua calado — cumprimento nao pedido vira ruido, e
// essa e a linha que separa "aparece mais" de "aparece sempre".
const {
  pickOracleGreeting,
  pickOracleOpeningLine,
  resolveGreetingPeriod,
  ORACLE_GREETINGS,
  ORACLE_GAME_TIPS,
  ORACLE_SUGGESTIONS,
  ORACLE_LORE,
} = await import('../constants/oracleSpeechLibrary.ts');

const meioDia = new Date('2026-08-24T13:00:00');

assert.equal(pickOracleGreeting(0, 'neutro', meioDia), null, 'silencioso nao cumprimenta');
assert.ok(pickOracleGreeting(2, 'neutro', meioDia), 'equilibrado cumprimenta');
assert.ok(pickOracleGreeting(3, 'neutro', meioDia), 'presente cumprimenta');

// faixa horaria
assert.equal(resolveGreetingPeriod(7), 'manha');
assert.equal(resolveGreetingPeriod(11), 'manha');
assert.equal(resolveGreetingPeriod(12), 'tarde');
assert.equal(resolveGreetingPeriod(17), 'tarde');
assert.equal(resolveGreetingPeriod(18), 'noite');
assert.equal(resolveGreetingPeriod(23), 'noite');

// os quatro tons falam em todas as faixas
for (const periodo of ['manha', 'tarde', 'noite']) {
  for (const tom of ['neutro', 'coach', 'reflexivo', 'calmo']) {
    const linhas = ORACLE_GREETINGS[periodo][tom];
    assert.ok(Array.isArray(linhas) && linhas.length > 0, `${periodo}/${tom} precisa de saudacao`);
    for (const linha of linhas) {
      assert.ok(linha.length <= 60, `saudacao longa demais em ${periodo}/${tom}: "${linha}"`);
    }
  }
}

// tom desconhecido cai no gratuito em vez de quebrar
assert.ok(pickOracleGreeting(3, 'inexistente', meioDia), 'tom desconhecido cai no neutro');

// a saudacao nao cobra nem mede: quem quer numero tem a leitura logo abaixo
const todas = ['manha', 'tarde', 'noite'].flatMap((periodo) =>
  Object.values(ORACLE_GREETINGS[periodo]).flat());
for (const linha of todas) {
  assert.doesNotMatch(linha, /\d/, `saudacao nao carrega numero: "${linha}"`);
  assert.doesNotMatch(linha, /falh|atras|deveria|precisa fazer/i, `saudacao nao cobra: "${linha}"`);
}

// --- o leque completo da fala espontanea ---------------------------------
// So saudacao viraria papel de parede: a fala de abertura mistura cumprimento,
// dica de como o jogo funciona, sugestao e curiosidade. So o silencioso cala.
assert.equal(pickOracleOpeningLine(0, 'neutro', meioDia), null, 'silencioso nao fala do nada');
assert.ok(pickOracleOpeningLine(2, 'coach', meioDia), 'equilibrado fala do nada');

const tipos = new Set();
for (let i = 0; i < 400; i += 1) {
  const linha = pickOracleOpeningLine(3, 'coach', meioDia);
  assert.ok(linha && linha.text, 'presenca 3 sempre devolve fala');
  tipos.add(linha.kind);
}
assert.deepEqual([...tipos].sort(), ['curiosidade', 'dica', 'saudacao', 'sugestao'], 'os quatro tipos entram no sorteio');

// dica e fato sobre o app, entao nao varia por tom: mesma lista para todos.
assert.ok(ORACLE_GAME_TIPS.length >= 10, 'o leque de dicas precisa dar folego');
for (const tom of ['neutro', 'coach', 'reflexivo', 'calmo']) {
  assert.ok(ORACLE_SUGGESTIONS[tom]?.length >= 3, `${tom} precisa de sugestoes`);
}

// nenhuma fala de abertura cobra ou mede
const espontaneas = [
  ...ORACLE_GAME_TIPS,
  ...ORACLE_LORE,
  ...Object.values(ORACLE_SUGGESTIONS).flat(),
];
for (const linha of espontaneas) {
  assert.doesNotMatch(linha, /falh|fracass|preguic|deveria ter/i, `fala espontanea nao cobra: "${linha}"`);
  assert.ok(linha.length <= 100, `fala longa demais: "${linha}"`);
}

// tom desconhecido nao quebra o sorteio
assert.ok(pickOracleOpeningLine(3, 'inexistente', meioDia), 'tom desconhecido cai no neutro');

// A curiosidade nao pode citar temporada por nome: a ativa muda a cada poucos
// meses e frase com nome proprio apodrece sozinha na virada.
for (const linha of ORACLE_LORE) {
  assert.doesNotMatch(linha, /Genesis|Aurora|Zenite|Eclipse|Egide/i,
    `curiosidade nao pode nomear temporada: "${linha}"`);
}

console.log(`Oracle opening: ${todas.length + espontaneas.length} falas espontaneas em quatro tipos.`);

// O padrao do app e presenca 2. Exigir 3 fazia a saudacao existir so para quem
// tivesse mexido no ajuste — que foi exatamente o bug relatado.
const { DEFAULT_ORACLE_PRESENCE_LEVEL: padrao } = await import('../utils/oracleFeedUtils.ts');
assert.ok(
  pickOracleOpeningLine(padrao, 'neutro', meioDia),
  `a presenca padrao (${padrao}) precisa render fala de abertura`,
);

console.log(`Oracle greeting: ${todas.length} saudacoes, mudas so no silencioso, sem numero e sem cobranca.`);
