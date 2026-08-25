import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ORACLE_PRESENCE,
  ORACLE_PRESENCE_ORDER,
  ORACLE_PRESENCE_RULES,
  getOraclePresenceRules,
  normalizeOraclePresence,
  allowsOracleReaction,
} from '../constants/oraclePresencePolicy.ts';

/**
 * A tabela do que o Oraculo faz em cada nivel.
 *
 * Estas regras viviam em tres lugares que nao se conheciam — o modal de ajustes,
 * o cron da edge function e o portao de push — cada um com o proprio numero
 * solto. O resultado era ninguem, nem quem escreveu, conseguir dizer o que cada
 * nivel fazia. Aqui a tabela e uma so e este teste e o contrato dela.
 *
 * A separacao que importa: PRESENCA decide O QUE ele fala; o interruptor de
 * avisos decide ONDE aquilo chega. Desligar aviso nunca cala o Oraculo.
 */

const silencioso = ORACLE_PRESENCE_RULES[ORACLE_PRESENCE.SILENCIOSO];
const equilibrado = ORACLE_PRESENCE_RULES[ORACLE_PRESENCE.EQUILIBRADO];
const presente = ORACLE_PRESENCE_RULES[ORACLE_PRESENCE.PRESENTE];

// --- silencioso: so o obrigatorio ----------------------------------------
assert.equal(silencioso.dailyCard, false, 'silencioso nao recebe card');
assert.equal(silencioso.openingLine, 'nunca', 'silencioso nao cumprimenta');
assert.equal(silencioso.reactions, 'nenhuma', 'silencioso nao comenta o que voce faz');

// --- equilibrado: card e uma fala por dia, sem comentar cada acao ---------
assert.equal(equilibrado.dailyCard, true, 'equilibrado recebe o card do dia');
assert.equal(equilibrado.openingLine, 'diaria', 'equilibrado fala uma vez por dia');
assert.equal(equilibrado.reactions, 'marcos', 'equilibrado celebra o que e grande, nao o cotidiano');

// --- presente: fala a cada abertura e reage -------------------------------
assert.equal(presente.dailyCard, true, 'presente recebe o card do dia');
assert.equal(presente.openingLine, 'sempre', 'presente fala a cada abertura');
assert.equal(presente.reactions, 'todas', 'o presente acompanha tambem o cotidiano');

// --- a escada sobe, nunca desce ------------------------------------------
const peso = { nunca: 0, diaria: 1, sempre: 2 };
const ordem = ORACLE_PRESENCE_ORDER.map((value) => ORACLE_PRESENCE_RULES[value]);
for (let i = 1; i < ordem.length; i += 1) {
  assert.ok(
    peso[ordem[i].openingLine] >= peso[ordem[i - 1].openingLine],
    'um nivel mais alto nao pode falar menos que o anterior',
  );
  assert.ok(
    Number(ordem[i].dailyCard) >= Number(ordem[i - 1].dailyCard),
    'um nivel mais alto nao pode receber menos card',
  );
  const pesoReacao = { nenhuma: 0, marcos: 1, todas: 2 };
  assert.ok(
    pesoReacao[ordem[i].reactions] >= pesoReacao[ordem[i - 1].reactions],
    'um nivel mais alto nao pode reagir menos',
  );
}

// --- valores gravados fora da tabela nao quebram --------------------------
// A lacuna do 1 e historica: os valores salvos sao 0, 2 e 3.
assert.equal(normalizeOraclePresence(1), ORACLE_PRESENCE.EQUILIBRADO, '1 aproxima para o meio');
assert.equal(normalizeOraclePresence(4), ORACLE_PRESENCE.PRESENTE, 'acima do topo vira topo');
assert.equal(normalizeOraclePresence(-2), ORACLE_PRESENCE.SILENCIOSO);
assert.equal(normalizeOraclePresence(null), ORACLE_PRESENCE.SILENCIOSO);
assert.equal(normalizeOraclePresence('3'), ORACLE_PRESENCE.PRESENTE, 'texto do banco tambem resolve');
assert.equal(getOraclePresenceRules(2).label, 'Equilibrado');

// --- todo nivel tem rotulo e explicacao ----------------------------------
for (const regra of ordem) {
  assert.ok(regra.label && regra.label.length <= 20, `rotulo ruim: ${regra.label}`);
  assert.ok(regra.caption && regra.caption.length <= 120, `legenda ruim: ${regra.caption}`);
}

// --- a reacao pesa: marco passa antes do cotidiano ----------------------
// Fechar arena acontece de vez em quando e merece palavra ja no Equilibrado;
// "voce fez 5 acoes hoje" dispara quase todo dia e so o Presente recebe.
assert.equal(allowsOracleReaction(silencioso, 'marco'), false);
assert.equal(allowsOracleReaction(silencioso, 'rotina'), false);
assert.equal(allowsOracleReaction(equilibrado, 'marco'), true, 'equilibrado celebra o que e grande');
assert.equal(allowsOracleReaction(equilibrado, 'rotina'), false, 'equilibrado nao comenta o cotidiano');
assert.equal(allowsOracleReaction(presente, 'marco'), true);
assert.equal(allowsOracleReaction(presente, 'rotina'), true);

// --- push nao depende mais da presenca -----------------------------------
// O portao do servidor exigia presenca 3: quem estava no Equilibrado recebia o
// card e nunca o aviso. Quem decide o aviso e o interruptor, nao o nivel.
const webPush = readFileSync(new URL('../supabase/functions/web-push/index.ts', import.meta.url), 'utf8');
const portao = webPush.slice(
  webPush.indexOf('const shouldPushOracleMessage'),
  webPush.indexOf('const buildOracleMessagePayload'),
);
assert.ok(portao.length > 0, 'o portao de push deve ser identificavel');
assert.doesNotMatch(
  portao,
  /presenceLevel\s*<\s*3/,
  'o push nao pode voltar a exigir presenca 3',
);
assert.match(portao, /presenceLevel\s*<=\s*0/, 'silencioso continua sem push');

// --- o painel respeita a frequencia --------------------------------------
const sitrep = readFileSync(new URL('../components/SitrepContent.tsx', import.meta.url), 'utf8');
assert.match(sitrep, /getOraclePresenceRules/, 'o painel le a politica, nao um numero solto');
assert.match(sitrep, /hasSpokenOpeningLineToday/, 'o nivel diario precisa lembrar se ja falou hoje');

// --- a reacao passa por um portao so -------------------------------------
const taskDomain = readFileSync(new URL('../contexts/gameDomains/taskDomain.ts', import.meta.url), 'utf8');
assert.match(taskDomain, /oracleReactions/, 'a reacao precisa ser controlavel');
assert.match(taskDomain, /allowsOracleReaction/, 'o portao da reacao fica num lugar so');
// Fechar arena/campanha e marco sao os dois pontos que valem no Equilibrado.
assert.equal(
  (taskDomain.match(/\}, 'marco'\);/g) || []).length,
  2,
  'exatamente dois pontos de reacao contam como marco',
);

console.log('Oracle presence policy: silencioso cala, equilibrado celebra o grande, presente acompanha tudo.');
