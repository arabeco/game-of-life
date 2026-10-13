import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PLANNER_ZOOMS, PLANNER_ZOOM_FACTORS, PLANNER_ZOOM_DIA_INTEIRO, lerZoomSalvo } from '../utils/plannerZoom.ts';

/**
 * O ZOOM QUE MOSTRA O DIA INTEIRO (13/10/2026, pedido do Afonso).
 *
 * Um zoom novo, mais afastado que o antigo 1x: 0,7 da escala dele (0,5 -> 0,35
 * px por minuto), para as 24 horas caberem (~500 px). E a mesma escala do
 * planner do widget. Os zooms antigos ficam iguais e andam um numero: quem
 * tinha 2x (0,75) continua em 0,75, agora chamado 3x.
 */
assert.deepEqual([...PLANNER_ZOOMS], [1, 2, 3, 4, 5]);
assert.deepEqual(PLANNER_ZOOM_FACTORS, { 1: 0.35, 2: 0.5, 3: 0.75, 4: 1, 5: 1.4 });
assert.equal(PLANNER_ZOOM_DIA_INTEIRO, 0.35);
assert.ok(24 * 60 * PLANNER_ZOOM_FACTORS[1] <= 520, 'o zoom 1 nao cabe o dia inteiro');
console.log('ok - zoom 1 cabe o dia inteiro');

const guardado = (dados) => ({ getItem: (k) => (k in dados ? dados[k] : null) });
assert.equal(lerZoomSalvo(guardado({ planner_zoom_v4: '1' })), 1);
assert.equal(lerZoomSalvo(guardado({ planner_zoom_v3: '2' })), 3, 'o 2x antigo (0,75) vira o 3x novo, mesma escala');
assert.equal(lerZoomSalvo(guardado({ planner_zoom_v3: '4' })), 5);
assert.equal(lerZoomSalvo(guardado({})), 3, 'padrao continua 0,75');
assert.equal(lerZoomSalvo(guardado({ planner_zoom_v4: 'x' })), 3);
assert.equal(lerZoomSalvo({ getItem: () => { throw new Error('bloqueado'); } }), 3);
console.log('ok - quem ja tinha zoom salvo continua na mesma escala');

const tela = readFileSync(new URL('../views/PlannerView.tsx', import.meta.url), 'utf8');
assert.match(tela, /from '\.\.\/utils\/plannerZoom'/, 'o planner nao usa a regua de zoom compartilhada');
assert.match(tela, /localStorage\.setItem\('planner_zoom_v4'/, 'o zoom novo nao e guardado na chave nova');
console.log('Zoom: dia inteiro no 1x.');
