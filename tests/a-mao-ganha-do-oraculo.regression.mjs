import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fala = readFileSync(new URL('../utils/oracleSpeech.ts', import.meta.url), 'utf8');
const gesto = readFileSync(new URL('../hooks/useLongPress.ts', import.meta.url), 'utf8');

/* ==========================================================================
 * O ORACULO FALAVA POR CIMA DA MAO.
 *
 * Concluir uma tarefa arrastando dispara uma reacao, e ela entrava no ar
 * enquanto o dedo ainda estava na tela — disputando com o gesto seguinte.
 *
 * Quem arrasta esta FAZENDO; quem fala esta comentando. Comentario espera.
 * ========================================================================== */

// ---------------------------------------------------------------------------
// 1. COM A MAO NA TELA, A FALA ESPERA.
// ---------------------------------------------------------------------------

assert.match(
  fala,
  /if \(maosNaTela > 0\) \{\s*\n\s*falaGuardada = payload;\s*\n\s*return;/,
  'emitOracleSpeech precisa guardar a fala enquanto houver gesto em curso',
);

// Guardar a ULTIMA, e nao empilhar: tres conclusoes num mesmo arrasto rendem
// tres reacoes, e solta-las em fila viraria fila de balao.
assert.ok(
  !/falaGuardada\.push|falaGuardada = \[/.test(fala),
  'a espera virou fila; tres conclusoes seguidas soltariam tres baloes',
);

// ---------------------------------------------------------------------------
// 2. E SAI QUANDO SOLTAR — MAS NAO NO INSTANTE.
// ---------------------------------------------------------------------------

// Sem o respiro, a fala aparece no milissegundo em que o dedo levanta, bem na
// hora de comecar o proximo arrasto. O timer existe para o gesto seguinte
// conseguir adia-la de novo.
assert.match(fala, /RESPIRO_APOS_SOLTAR_MS/, 'soltar precisa de um respiro antes de falar');
assert.match(
  fala,
  /export const maoEntrouNaTela = \(\) => \{\s*\n\s*maosNaTela \+= 1;\s*\n\s*cancelarSaida\(\);/,
  'um gesto novo tem de cancelar a saida agendada pelo anterior',
);

// Depois do respiro, confere de novo: o gesto pode ter recomecado no meio dele.
assert.match(
  fala,
  /if \(pendente && maosNaTela === 0\) despachar\(pendente\)/,
  'a fala so sai se a mao ainda estiver fora quando o respiro terminar',
);

// ---------------------------------------------------------------------------
// 3. A CONTAGEM NAO PODE FICAR PRESA.
// ---------------------------------------------------------------------------

/*
 * Se um gesto marcasse a entrada e nunca a saida, `maosNaTela` ficaria em 1
 * para sempre e o Oraculo calaria pelo resto da sessao. Por isso a saida mora
 * no `cleanup`, que o hook roda em TODA saida — fim de gesto, cancelamento e
 * desmontagem do componente.
 */
assert.match(gesto, /maoEntrouNaTela\(\);/, 'o gesto precisa avisar que comecou');
assert.match(
  gesto,
  /const cleanup = useCallback\(\(\) => \{\s*\n\s*if \(maoNaTelaRef\.current\) \{[\s\S]{0,120}?maoSaiuDaTela\(\);/,
  'a saida tem de estar no cleanup, que roda em todo caminho de termino',
);
assert.match(
  gesto,
  /useEffect\(\(\) => \{\s*\n\s*return cleanup;/,
  'sem cleanup na desmontagem, um componente que some no meio do gesto cala o Oraculo para sempre',
);

console.log('[ok] a mao ganha do oraculo');
