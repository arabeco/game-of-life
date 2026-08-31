import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * O livro-caixa da experiencia.
 *
 * Regra de dinheiro nao pode voltar por descuido, e este arquivo existe porque
 * duas regras aqui sao invisiveis lendo o codigo de cima:
 *
 *   1. O DIA DEPOSITA, O FECHO PAGA. Julgar um dia grava exp_deposited e soma
 *      no recipiente — rodada ou ciclo. Quem credita em nobility.exp e o fecho.
 *      Isso e o que da a TODO MUNDO a janela de corrigir um dia julgado: nada
 *      foi pago ainda. Antes, sem ciclo, o dia creditava direto, e como credito
 *      nao volta — devolver rebaixaria patente — quem jogava sem ciclo era o
 *      unico sem direito de errar.
 *
 *   2. O FECHO DO CICLO NAO RECALCULA A BASE. cycleExpBonus ja e a soma dos
 *      exp_deposited daqueles dias. Somar cycleBaseExp por cima pagava a mesma
 *      base duas vezes, com o bonus premium incidindo junto: fechar um ciclo
 *      pagava perto do dobro do que foi ganho.
 */

const gameContext = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');

const trecho = (de, ate, rotulo) => {
  const inicio = gameContext.indexOf(de);
  assert.ok(inicio > 0, `ancora nao encontrada: ${rotulo}`);
  const fim = gameContext.indexOf(ate, inicio);
  assert.ok(fim > inicio, `fim nao encontrado: ${rotulo}`);
  return gameContext.slice(inicio, fim);
};

// --- 1. o dia deposita, nunca paga ------------------------------------------

const fechoDoDia = trecho(
  'const shouldDepositIntoCycle = Boolean(',
  'const supabaseUserId = getSupabaseUserId();',
  'fecho do dia',
);

assert.match(fechoDoDia, /setCycleExpBonus\(prev => prev \+ expDeposited\)/, 'com ciclo, deposita no ciclo');
assert.match(fechoDoDia, /setRoundExpBonus\(prev => prev \+ expDeposited\)/, 'sem ciclo, deposita na rodada');
// Sem os comentarios: o proprio comentario que explica a regra cita
// `nobility.exp`, e a guarda leria a explicacao como se fosse a violacao.
assert.doesNotMatch(
  fechoDoDia.replace(/\/\/[^\n]*/g, ''),
  /nobility/,
  'o fecho do DIA nao pode creditar no perfil: credito nao volta, e isso tiraria a janela de corrigir o dia',
);

// --- 2. o fecho da rodada paga, e e o unico lugar sem ciclo que paga --------

const fechoDaRodada = trecho(
  'const concludeFreeRound =',
  'const resetFreeProgress =',
  'fecho da rodada',
);

assert.match(fechoDaRodada, /nobility/, 'concluir a rodada credita o acumulado');
assert.match(fechoDaRodada, /setRoundExpBonus\(0\)/, 'e zera o acumulado, para nao pagar duas vezes');
assert.match(fechoDaRodada, /setFreeProgressResetMarker/, 'e marca o inicio da rodada seguinte');

// --- 3. abrir ciclo fecha a rodada ------------------------------------------
// Absorver o acumulado para dentro do ciclo faria a experiencia de antes entrar
// num relatorio que nao mediu aqueles dias.

const inicioDoCiclo = trecho('const startCycle = (', 'const trimmedName', 'inicio do ciclo');
assert.match(inicioDoCiclo, /concludeFreeRound\('ciclo'\)/, 'abrir ciclo fecha e paga a rodada');

// --- 4. o fecho do ciclo nao recalcula a base -------------------------------

const contaDoCiclo = trecho('const premiumBonusExp = Math.round(cycleBaseExp', 'const expBoostBonus', 'conta do ciclo');
assert.match(contaDoCiclo, /const rawExp = cycleExpBonus \+ premiumBonusExp;/, 'a conta e acumulado + bonus');
assert.doesNotMatch(
  contaDoCiclo.replace(/\/\/[^\n]*/g, ''),
  /rawExp = [^;]*cycleBaseExp/,
  'cycleBaseExp recalcula a base ja somada em cycleExpBonus: somar os dois paga em dobro',
);

// --- 5. o acumulado da rodada sobrevive a um reload -------------------------
// A verdade mora em daily_commitments.exp_deposited; o estado local e cache.

const rehidratacao = trecho('const refreshRoundExpBonus = useCallback', '}, [activeCycle', 'rehidratacao');
assert.match(rehidratacao, /from\('daily_commitments'\)/, 'a rodada le do banco, nao so da memoria');
assert.match(rehidratacao, /eq\('stage', 'judgment'\)/, 'so dias julgados contam');
assert.match(rehidratacao, /getFreeProgressResetAt/, 'a rodada comeca no ultimo fecho de rodada');

// --- 6. editar um dia julgado reconcilia com e sem ciclo --------------------
// Sem isto, uma edicao sem ciclo deixaria a rodada pagar um valor velho.

const reconciliador = trecho(
  'const reconcileJudgedDayTaskMutation = useCallback',
  'const sitrepPayload',
  'reconciliador',
);
assert.doesNotMatch(
  reconciliador,
  /if \(!userId \|\| !activeCycle \|\| !operationalDate\) return;/,
  'a guarda de ciclo nao pode voltar: ela tirava a reconciliacao de quem joga sem ciclo',
);
assert.match(reconciliador, /if \(!activeCycle\) \{/, 'sem ciclo ele atualiza o registro e sai antes do sitrep');
assert.match(reconciliador, /refreshRoundExpBonus\(\)/, 'e recalcula o acumulado da rodada');

console.log('Exp ledger: o dia deposita, o fecho paga, e ninguem paga duas vezes.');
