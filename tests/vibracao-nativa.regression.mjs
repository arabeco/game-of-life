import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TOQUE_DO_SINAL, decidirToqueDoArraste } from '../utils/hapticsMapa.ts';

/**
 * VIBRACAO NATIVA (15/10/2026, pedido do Afonso).
 *
 * O app vibrava pelo navigator.vibrate, fraco e sem definicao em muitos
 * Android. Agora o motor de feedback (useSensoryFeedback) usa o plugin nativo
 * @capacitor/haptics: toque leve, medio, sucesso, aviso, erro e o "tique" de
 * selecao. No arraste do planner: leve ao pegar, um tique a cada horario novo,
 * medio ao soltar num lugar, leve ao cancelar.
 */
const ler = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ---------------------------------------------------------------- cada sinal tem seu toque
assert.equal(TOQUE_DO_SINAL.click_soft, 'leve');
assert.equal(TOQUE_DO_SINAL.success, 'sucesso');
assert.equal(TOQUE_DO_SINAL.error, 'erro');
assert.equal(TOQUE_DO_SINAL.warning, 'aviso');
assert.equal(TOQUE_DO_SINAL.impact, 'medio');
assert.equal(TOQUE_DO_SINAL.drag_step, 'passo');
assert.equal(TOQUE_DO_SINAL.drop, 'medio');
assert.equal(TOQUE_DO_SINAL.drag_cancel, 'leve');
// os dois marcos raros mantem o desenho proprio (padrao longo), nao viram toque generico
assert.equal(TOQUE_DO_SINAL.level_up, null);
assert.equal(TOQUE_DO_SINAL.streak_milestone, null);
console.log('ok - cada sinal tem o seu toque nativo');

// ---------------------------------------------------------------- o arraste
const d = (anterior, atual) => decidirToqueDoArraste(anterior, atual);
const parado = { arrastando: false, alvo: null };
assert.equal(d(parado, { arrastando: true, alvo: null }), null, 'pegar ja vibra pelo onArm; aqui nao repete');
assert.equal(d({ arrastando: true, alvo: null }, { arrastando: true, alvo: 'd60' }), null, 'o primeiro horario nao e mudanca');
assert.equal(d({ arrastando: true, alvo: 'd60' }, { arrastando: true, alvo: 'd60' }), null, 'mesmo horario nao vibra');
assert.equal(d({ arrastando: true, alvo: 'd60' }, { arrastando: true, alvo: 'd65' }), 'drag_step', 'horario novo: tique');
assert.equal(d({ arrastando: true, alvo: 'd65' }, { arrastando: true, alvo: null }), null, 'saiu da grade: sem tique');
assert.equal(d({ arrastando: true, alvo: 'd65' }, { arrastando: false, alvo: null }), 'drop', 'soltou com alvo: toque medio');
assert.equal(d({ arrastando: true, alvo: null }, { arrastando: false, alvo: null }), 'drag_cancel', 'soltou fora: toque leve');
console.log('ok - tique a cada horario, medio ao soltar, leve ao cancelar');

// ---------------------------------------------------------------- ligado de verdade
assert.match(ler('package.json'), /"@capacitor\/haptics"/, 'o plugin nativo nao esta instalado');
assert.match(ler('android/capacitor.settings.gradle'), /capacitor-haptics/, 'o plugin nao esta registrado no Android');
const motor = ler('hooks/useSensoryFeedback.ts');
assert.match(motor, /vibrarNativo\(/, 'o motor de feedback ainda nao usa o toque nativo');
assert.match(ler('views/PlannerView.tsx'), /useVibracaoDoArraste\(/, 'o planner nao vibra no arraste');
console.log('Vibracao: nativa no app inteiro, e o arraste do planner com tique e toque ao soltar.');
