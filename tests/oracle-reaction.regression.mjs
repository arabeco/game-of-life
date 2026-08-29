import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  pickOracleReaction,
  resolveReactionSignificance,
  PAUSA_MINIMA_PARA_VOLTA,
} from '../utils/oracleReaction.ts';
import { ORACLE_SPEECH_LIBRARY } from '../constants/oracleSpeechLibrary.ts';
import { resolveScreenIntroTip, SCREEN_INTRO_TIPS } from '../utils/screenIntroTips.ts';

/**
 * Reacoes e dicas de tela.
 *
 * Toda a inteligencia construida — arbitro, trend, memoria, cooldown — vivia so
 * na fala de ABERTURA. A reacao, que dispara muito mais vezes por dia, continuou
 * sendo sorteio puro sobre tres linhas, sem memoria e sem saber o que a coisa
 * significou. E a dica de tela dava conselho sem olhar a tela.
 */

const HOJE = '2026-08-28';

// --- a reacao sabe o que a entrega significou -------------------------------
// Fechar uma acao e banal. Fechar a PRIMEIRA depois de oito dias parados e outra
// coisa completamente — e as duas recebiam a mesma frase.

const voltou = resolveReactionSignificance({
  previousProofDate: '2026-08-20', proofDate: HOJE, hourOfDay: 10, streakAfter: 1,
});
assert.equal(voltou.event, 'first_after_pause', 'oito dias parados e uma entrega hoje e uma volta');
assert.equal(voltou.vars.dias, 8, 'a frase precisa do numero de dias');

// Fim de semana nao e volta — o mesmo corte de quatro dias usado no trend.
assert.equal(
  resolveReactionSignificance({ previousProofDate: '2026-08-26', proofDate: HOJE, hourOfDay: 10, streakAfter: 4 }),
  null,
  'dois dias de pausa e um dia comum',
);
assert.equal(PAUSA_MINIMA_PARA_VOLTA, 4, 'o corte de pausa e o mesmo do trend');

// A acao que salva a sequencia no fim do dia.
const salvou = resolveReactionSignificance({
  previousProofDate: '2026-08-27', proofDate: HOJE, hourOfDay: 22, streakAfter: 23,
});
assert.equal(salvou.event, 'streak_saved');
assert.equal(salvou.vars.streak, 23);

// Voltar depois de uma pausa longa E fechar tarde: a VOLTA e a noticia maior, e
// a hora e detalhe dela.
assert.equal(
  resolveReactionSignificance({ previousProofDate: '2026-08-18', proofDate: HOJE, hourOfDay: 23, streakAfter: 1 }).event,
  'first_after_pause',
  'quando os dois valem, ter voltado ganha',
);

// O dia comum continua sendo dia comum. Se estes disparassem sempre, deixariam
// de significar coisa alguma e roubariam a vez das reacoes de rotina.
assert.equal(
  resolveReactionSignificance({ previousProofDate: '2026-08-27', proofDate: HOJE, hourOfDay: 11, streakAfter: 9 }),
  null,
  'entregar de manha no dia seguinte e rotina, e rotina ja tem reacao propria',
);

// Streak curto nao merece o alarde de salvamento.
assert.equal(
  resolveReactionSignificance({ previousProofDate: '2026-08-27', proofDate: HOJE, hourOfDay: 22, streakAfter: 2 }),
  null,
  'salvar uma sequencia de 2 nao e salvar nada',
);

// --- a reacao lembra da anterior --------------------------------------------
// Com tres variantes e sorteio sem memoria, fechar duas arenas seguidas devolvia
// a mesma frase uma vez em cada tres.

const primeira = pickOracleReaction('arena_completed', 'neutro', { arena: 'Saude' }, {});
assert.ok(primeira.message, 'a reacao precisa sair');
assert.equal(primeira.memory.arena_completed, primeira.message, 'a escolhida fica guardada');

// Repetido muitas vezes: a anterior nunca deve sair de novo em seguida.
let memoria = primeira.memory;
for (let i = 0; i < 40; i += 1) {
  const anterior = memoria.arena_completed;
  const proxima = pickOracleReaction('arena_completed', 'neutro', { arena: 'Saude' }, memoria);
  assert.notEqual(proxima.message, anterior, 'a reacao nao repete a frase imediatamente anterior');
  memoria = proxima.memory;
}

// A memoria e por evento: fechar arena nao bloqueia a fala de campanha.
const campanha = pickOracleReaction('campaign_completed', 'neutro', { campaign: 'X' }, memoria);
assert.ok(campanha.message, 'evento diferente tem memoria propria');

// --- os dois eventos novos existem nas quatro vozes -------------------------
for (const evento of ['first_after_pause', 'streak_saved']) {
  const banco = ORACLE_SPEECH_LIBRARY[evento];
  assert.ok(banco, `${evento} precisa existir no banco`);
  for (const tom of ['neutro', 'coach', 'reflexivo', 'calmo']) {
    assert.ok(banco[tom]?.length >= 3, `${evento}.${tom} precisa de pelo menos tres variantes`);
  }
}

// --- toda reacao passa pela memoria -----------------------------------------
// Um unico ponto de escolha; sorteio direto em qualquer outro lugar reabriria o
// buraco sem que nada acusasse.
const taskDomain = readFileSync(new URL('../contexts/gameDomains/taskDomain.ts', import.meta.url), 'utf8');
const corpo = taskDomain.slice(taskDomain.indexOf('const falarReacao'));
assert.doesNotMatch(corpo, /pickOracleSpeech\(/, 'nenhuma reacao pode sortear sem passar pela memoria');

// --- a dica de tela olha a tela ---------------------------------------------
// "crie uma arena simples" era dito a quem chegava com seis, e "puxa uma acao"
// a quem nao tinha ciclo — e ali o Planner esta vazio.

const cheio = { arenasCount: 6, hasActiveCycle: true, hasClosedCycle: true };
const vazio = { arenasCount: 0, hasActiveCycle: false, hasClosedCycle: false };

assert.notEqual(
  resolveScreenIntroTip('arenas', cheio).summary,
  resolveScreenIntroTip('arenas', vazio).summary,
  'quem ja tem arenas nao precisa ouvir para criar a primeira',
);
assert.match(resolveScreenIntroTip('arenas', cheio).summary, /6/, 'a dica conta quantas existem');

assert.notEqual(
  resolveScreenIntroTip('planner', vazio).title,
  resolveScreenIntroTip('planner', cheio).title,
  'sem ciclo o Planner esta vazio, e a dica tem de dizer isso',
);

// Sem variante, a dica base continua valendo — a maioria das telas nao depende
// de estado e uma dica so continua sendo a resposta certa.
assert.equal(
  resolveScreenIntroTip('assets', vazio).summary,
  SCREEN_INTRO_TIPS.assets.summary,
  'tela sem variante devolve a dica base',
);

// A variante nao pode perder campo: ela e mesclada por cima da base.
for (const id of ['arenas', 'planner', 'reports']) {
  for (const estado of [cheio, vazio]) {
    const dica = resolveScreenIntroTip(id, estado);
    for (const campo of ['id', 'label', 'title', 'summary', 'items']) {
      assert.ok(dica[campo], `${id} perdeu o campo ${campo} numa das variantes`);
    }
  }
}


// --- o banco de reacoes tambem e escrito em portugues -----------------------
// Mesma regra do banco de aberturas: 144 frases que a pessoa le, e nenhuma pode
// voltar a ser digitada sem acento.

const LINHAS_DE_REACAO = Object.values(ORACLE_SPEECH_LIBRARY)
  .flatMap((porTom) => Object.values(porTom).flat());

assert.ok(LINHAS_DE_REACAO.length >= 140, 'o banco de reacoes nao pode encolher sem alguem notar');

for (const linha of LINHAS_DE_REACAO) {
  assert.doesNotMatch(
    linha,
    /(nao|voce|acao|acoes|sequencia|amanha|numero|proxima|proximo|periodo|tambem|ate|so|ja|ha|atras|dificil|facil|historico|maximo|minimo|pe)/,
    `sem acento: ${linha}`,
  );
  assert.match(linha, /^[A-ZÀ-Ý0-9{"]/, `sem maiuscula inicial: ${linha}`);
  assert.match(linha, /[.?!]$/, `sem pontuacao final: ${linha}`);
  // Marcador acentuado nunca preenche: fillOracleSpeech procura {acoes}, e
  // {ações} deixaria a chave crua na tela da pessoa.
  assert.doesNotMatch(linha, /\{[^}]*[À-ÿ][^}]*\}/, `marcador acentuado: ${linha}`);
}

console.log('Oracle reaction: a reacao lembra, sabe o que aconteceu, e a dica olha a tela.');
