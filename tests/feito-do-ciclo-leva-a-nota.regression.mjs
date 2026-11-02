import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * O FEITO DO CICLO LEVA A NOTA, MESMO DE RELATORIO ANTIGO (02/11/2026).
 *
 * O card do ciclo nos Feitos pinta o fundo com a placa da nota (SSS..E). O post
 * mandava so `report.grade`, que relatorio antigo nao gravou: o card saia com o
 * fundo prata generico, igual para todos. Agora vai a mesma nota que o
 * carrossel do relatorio mostra (a gravada, ou a do score).
 */
const fonte = readFileSync(new URL('../views/ReportsView.tsx', import.meta.url), 'utf8');
const post = fonte.slice(fonte.indexOf('const handlePostToFeed'), fonte.indexOf('const buildCycleFinalizedNotificationContent'));
assert.match(post, /grade: report\.grade \|\| getScoreGrade\(report\.performanceScore, report\.metrics\?\.fairness\)\.grade/,
  'o post do ciclo precisa levar a nota do score quando o relatorio nao gravou a dele');
console.log('Feito do ciclo: leva a nota, e com ela o fundo da placa.');
