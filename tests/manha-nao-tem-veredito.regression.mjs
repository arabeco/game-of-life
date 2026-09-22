import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deriveOracleHostOperationalState } from '../supabase/functions/_shared/oracle-host-voice.ts';
import { buildContextualOracleLine } from '../supabase/functions/_shared/oracle-lines.ts';

/* ==========================================================================
 * "O DIA ESTA SEM TRILHO" — AS SETE DA MANHA.
 *
 * Chegou assim em 22/09/2026, e duas coisas estavam erradas na mesma frase.
 *
 * A PRIMEIRA e que nao havia dia ainda. A pessoa tinha acabado de acordar e o
 * app ja tinha um veredito sobre um dia que nao comecou. Acordando as sete, as
 * oito ou as dez, receberia a mesma sentenca.
 *
 * E o mesmo defeito que o ciclo tinha em 21/09 — "salve o que puder" no dia 1 —,
 * um nivel abaixo: ler o PLANO como se fosse resultado. Quatro acoes marcadas de
 * manha nao sao dispersao; sao uma agenda.
 *
 * A SEGUNDA e que a frase falava de outra coisa. Para quem ja tem arena, este
 * estado dispara por `criar_meta_minima`: uma arena cujas acoes sao livres ou
 * sem contador, entao o avanco dela nao tem como ser medido. Isso e sobre a
 * ARENA. A frase transformava num diagnostico do dia da pessoa.
 *
 * E ainda prometia: "uma acao curta ja resolve". Resolve o que? Uma acao nao
 * conserta um dia — e prometer isso diz de quebra que o resto nao importa.
 * ========================================================================== */

const base = {
  currentTime: '2026-09-22T10:00:00Z',
  activeMode: 'neutro',
  hasCycle: true,
  cycleRisk: 'baixo',
  staleArenas: [],
  overdueActions: 0,
  pendingChests: 0,
  dailyProofStreakCurrent: 0,
  dailyProofLastClosedDate: null,
  needsFirstArena: false,
  needsFirstAction: false,
  needsFirstTask: false,
  totalArenas: 5,
  priorityArenaName: 'Rituais',
};

const estadoEm = (hora, extra) => deriveOracleHostOperationalState(
  { ...base, ...extra, timeOfDay: hora },
  { operationalDate: '2026-09-22' },
);

// ---------------------------------------------------------------------------
// 1. DE MANHA, O PLANO NAO E DIAGNOSTICO.
// ---------------------------------------------------------------------------

for (const hora of ['madrugada', 'manha']) {
  assert.notEqual(
    estadoEm(hora, { pendingActionsToday: 4 }),
    'disperso',
    `${hora}: quatro acoes marcadas e uma agenda, nao dispersao.`,
  );
  assert.notEqual(
    estadoEm(hora, { pendingActionsToday: 9 }),
    'escopo_pesado',
    `${hora}: o dia inteiro pela frente nao e escopo estourado.`,
  );
}

// ---------------------------------------------------------------------------
// 2. DEPOIS QUE O DIA ANDOU, O DIAGNOSTICO VOLTA INTEIRO.
//
// O conserto e sobre CEDO DEMAIS, e nao sobre nunca avisar.
// ---------------------------------------------------------------------------

for (const hora of ['tarde', 'noite']) {
  assert.equal(estadoEm(hora, { pendingActionsToday: 4 }), 'disperso', `${hora}: aqui a leitura e honesta.`);
  assert.equal(estadoEm(hora, { pendingActionsToday: 9 }), 'escopo_pesado', `${hora}: idem.`);
}

// Sem a hora informada, nada muda em relacao ao comportamento antigo: a ausencia
// de um campo opcional nao pode calar um diagnostico legitimo.
assert.equal(
  deriveOracleHostOperationalState({ ...base, pendingActionsToday: 4 }, { operationalDate: '2026-09-22' }),
  'disperso',
  'sem timeOfDay, segue como antes',
);

// ---------------------------------------------------------------------------
// 3. A FRASE DIZ O QUE ACONTECEU, E NAO PROMETE SALVACAO.
// ---------------------------------------------------------------------------

const arenaSemMeta = {
  pendingActionsToday: 1,
  focusArenaSignal: {
    arenaName: 'Rituais',
    progressPercent: null,
    expectedProgressPercent: null,
    pace: 'sem_medida',
    pendingActions: 2,
    pendingActionsToday: 1,
    suggestedAdjustment: 'criar_meta_minima',
    reason: '',
  },
};

for (const hora of ['madrugada', 'manha', 'tarde', 'noite']) {
  const contexto = { ...base, ...arenaSemMeta, timeOfDay: hora };
  const estado = deriveOracleHostOperationalState(contexto, { operationalDate: '2026-09-22' });
  assert.equal(estado, 'sem_direcao', `${hora}: arena sem medida continua sendo apontada`);

  const frase = buildContextualOracleLine({ state: estado, context: contexto, recentLines: [] });
  assert.ok(frase, `${hora}: o banco nao pode ficar mudo neste caso`);
  assert.ok(
    frase.includes('Rituais'),
    `${hora}: a frase tem de nomear a arena, que e do que ela fala: "${frase}"`,
  );
  assert.doesNotMatch(
    frase,
    /o dia est[aá]/i,
    `${hora}: isto e sobre a arena, e nao um veredito sobre o dia: "${frase}"`,
  );
}

// ---------------------------------------------------------------------------
// 4. NENHUMA FRASE PROMETE QUE UMA ACAO RESOLVE O DIA.
//
// "Uma acao curta ja resolve" e falso e condescendente ao mesmo tempo: nao
// resolve, e dizer que resolve avisa que o resto do dia era dispensavel.
// ---------------------------------------------------------------------------

const banco = readFileSync(
  new URL('../supabase/functions/_shared/oracle-lines.ts', import.meta.url),
  'utf8',
);

// Os comentarios saem antes da busca: a nota que explica por que a promessa foi
// removida cita a promessa, e sem isto a unica coisa acusada seria ela.
const bancoSemComentarios = banco
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

assert.doesNotMatch(
  bancoSemComentarios,
  /(uma a[cç][aã]o[^"']{0,40})(j[aá] resolve|j[aá] salva|resolve o dia|salva o dia)/i,
  'voltou uma frase prometendo que uma acao resolve o dia',
);

// E as frases que AFIRMAM sobre o dia tem de declarar que esperam o dia andar.
const afirmacoesSobreODia = bancoSemComentarios
  .split('\n')
  .filter((linha) => /"O dia est[aá]/.test(linha));
for (const linha of afirmacoesSobreODia) {
  assert.match(
    linha,
    /requires: depoisQueODiaAndou/,
    `frase que julga o dia sem esperar o dia acontecer: ${linha.trim()}`,
  );
}

console.log('[manha-nao-tem-veredito] ok');
