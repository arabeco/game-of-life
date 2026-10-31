import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const widget = readFileSync(
  new URL('../android/app/src/main/java/life/glyph/app/GlyphWidgetProvider.java', import.meta.url),
  'utf8',
);
const datas = readFileSync(new URL('../utils/dateUtils.ts', import.meta.url), 'utf8');
const snapshots = readFileSync(new URL('../utils/widgetSnapshots.ts', import.meta.url), 'utf8');

/* ==========================================================================
 * "DIA 2" E "DIA 3" AO MESMO TEMPO, NA MESMA HORA.
 *
 * Num ciclo comecado em 21/09, no dia 23 o app mostrava "Dia 3/7" e o widget
 * mostrava "Dia 2/7". Nenhum dos dois estava com a data errada: eles estavam
 * exibindo NUMEROS DIFERENTES com o mesmo nome.
 *
 * `elapsedDays` e quantos dias se passaram — no dia 23 de um ciclo que comecou
 * no 21, isso e 2. O numero do dia e outra coisa: o 21 e o dia 1, entao o 23 e
 * o dia 3. O app calcula `displayDay = elapsedDays + 1` e monta a frase certa;
 * o widget pegava `elapsedDays` cru e escrevia "Dia " na frente.
 *
 * O conserto nao foi somar 1 no widget. Isso arrumaria o numero e deixaria o
 * defeito de pe: duas contas do mesmo rotulo, em dois runtimes, livres para
 * divergir de novo na proxima mudanca. A frase ja vinha pronta no snapshot —
 * faltava so usa-la.
 * ========================================================================== */

// O comentario do proprio conserto cita a forma do bug. O que vale aqui e o
// CODIGO, entao os comentarios saem antes de qualquer verificacao.
const codigo = widget.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

// ---------------------------------------------------------------------------
// 1. O APP CONTINUA SENDO QUEM CALCULA A FRASE.
// ---------------------------------------------------------------------------

assert.match(
  datas,
  /const displayDay = isUpcoming \? 0 : Math\.max\(1, Math\.min\(totalDays, elapsedDays \+ 1\)\)/,
  'o numero do dia e elapsedDays + 1; sem isso o dia 1 de um ciclo apareceria como dia 0',
);

assert.match(
  datas,
  /statusLabel: isUpcoming[\s\S]{0,200}?Dia \$\{displayDay\}\/\$\{totalDays\}/,
  'o rotulo do dia tem de sair do displayDay, e nao do elapsedDays',
);

// ---------------------------------------------------------------------------
// 2. O SNAPSHOT TEM DE LEVAR A FRASE ATE O WIDGET.
// ---------------------------------------------------------------------------

assert.match(snapshots, /timingLabel: timing\.statusLabel/, 'o snapshot de ciclo precisa levar o rotulo pronto');
assert.match(snapshots, /cycleDayLabel: cycleTiming\.statusLabel/, 'o snapshot diario precisa levar o rotulo pronto');

// ---------------------------------------------------------------------------
// 3. O WIDGET USA A FRASE, EM VEZ DE REMONTAR.
// ---------------------------------------------------------------------------

assert.ok(
  !/"Dia " \+ elapsedDays\b/.test(codigo),
  'o widget voltou a escrever o rotulo com elapsedDays cru — esse numero e dias decorridos, nao o numero do dia',
);

// 19/10/2026: a frase pronta envelhecia — sem abrir o app no domingo, o widget
// seguia no "Dia 13/14" de sabado. O widget passou a calcular o dia na hora
// (CicloDoWidget.java). Sao duas contas de novo, mas o medo deste teste (as duas
// divergirem) agora e guardado por tempo-do-ciclo-widget-e-cartao, que roda o
// Java e compara com o app dia a dia. A frase do app fica como reserva.
assert.match(
  codigo,
  /String day = tempoAoVivo != null\s*\n\s*\? CicloDoWidget\.rotulo\(tempoAoVivo\)\s*\n\s*: !dayLabel\.isEmpty\(\)\s*\n\s*\? dayLabel/,
  'o widget tem de calcular o dia na hora e so cair na frase do app como reserva',
);

// O caminho de tras so vale para snapshot velho, e mesmo ele precisa do +1.
assert.match(
  codigo,
  /"Dia " \+ \(elapsedDays \+ 1\) \+ "\/" \+ totalDays/,
  'a remontagem de ultimo recurso tambem precisa do +1',
);

// ---------------------------------------------------------------------------
// 4. TEMPO USA O MESMO ROTULO DO DIA E A BARRA INCLUI HOJE.
// ---------------------------------------------------------------------------
assert.match(codigo, /"Tempo",\s*day,\s*progressPercent,\s*timeProgress/);
assert.match(datas, /const timeProgress = isUpcoming \? 0 : Math\.min\(100, \(elapsedDays \/ totalDays\) \* 100\)/);

console.log('[ok] o widget e o app contam o mesmo dia');
