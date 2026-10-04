import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * LIMPAR PENDENCIA ESQUECIDA E TRABALHO DE ABERTURA, NAO DE CADA TOQUE.
 *
 * A varredura que devolve tarefa esquecida para a Bay vivia num efeito com
 * `tasks` nas dependencias. Disparava a cada tarefa criada, movida ou
 * concluida — e o efeito pratico, relatado em 04/10/2026, era este:
 *
 *   "acoes que eu quero completar 2 dias atras volta direto pra bay, nem deixa"
 *
 * Mover a tarefa mudava `tasks`; o efeito reavaliava; aquela data ja estava
 * dentro da janela de esquecimento; a tarefa era arrancada no mesmo instante.
 * Nao era "ela volta depois" — era o app desfazendo a acao enquanto a pessoa a
 * fazia, sem nada na tela explicando por que.
 *
 * Com a guarda, ela roda uma vez por sessao: arruma o estado de quem chegou e
 * sai da frente. Se a pendencia continuar, a proxima abertura a recolhe.
 */

const contexto = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');

const trecho = contexto.slice(
    contexto.indexOf('PENDENCIA ESQUECIDA'),
    contexto.indexOf('esquecidas voltaram para a Bay') + 200,
);
assert.ok(trecho.length > 200, 'a varredura de pendencia esquecida sumiu do GameContext');

// --------------------------------------------- 1. a guarda existe
assert.match(trecho, /varreuPendenciasRef\.current/,
    'a varredura voltou a rodar sem guarda — ela desfaz o que a pessoa acabou de fazer');
assert.match(
    trecho,
    /if \(varreuPendenciasRef\.current\) return;\s*\n\s*varreuPendenciasRef\.current = true;/,
    'a guarda precisa marcar ANTES de varrer, senao duas passadas correm juntas',
);
console.log('ok - a varredura roda uma vez por sessao');

// ------------------------------- 2. a janela continua sendo D-2
//
// Dois dias de folga: o dia seguinte ainda e razoavel para concluir algo
// atrasado. Isto nao e o defeito — o defeito era QUANDO a regra era aplicada.
assert.match(trecho, /shiftLocalDateString\(todayString, -2\)/,
    'a janela de esquecimento mudou sem combinar');
console.log('ok - a janela continua em dois dias');

// ------------------------- 3. ciclo selado continua intocado
assert.match(trecho, /!sealedTaskIds\.has\(task\.id\)/,
    'a varredura voltou a poder mexer em tarefa de ciclo ja selado');
console.log('ok - ciclo selado nao e tocado');

console.log('Pendencia esquecida: varrida na abertura, nunca durante o uso.');
