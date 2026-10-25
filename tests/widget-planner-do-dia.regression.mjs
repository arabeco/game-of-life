import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { montarPlannerDoWidget, misturarCor } from '../utils/widgetPlanner.ts';

/**
 * O WIDGET DO DIA VIRA VITRINE (13/10/2026, decidido com o Afonso).
 *
 * Duas abas: RESUMO (feitas/planejadas, %, tempo registrado e EXP) e PLANNER
 * (o planner do app, igualzinho, na escala do zoom 1 novo). Tocar abre o
 * planner no app. Nao conclui mais nada pelo widget: a aba FAZER saiu, e com
 * ela o login que o widget guardava no celular.
 */
const ler = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ---------------------------------------------------------------- a mistura de cor
assert.equal(misturarCor('#ffffff', 50, '#000000'), '#808080');
assert.equal(misturarCor('#a6424f', 100, '#10141b'), '#a6424f');
console.log('ok - mistura de cor igual ao color-mix do app');

// ---------------------------------------------------------------- o planner do dia
const HOJE = '2026-10-13';
const actions = [
  { id: 'a-treino', name: 'Treino de força', icon: '🏋️', arenaId: 'ar-corpo', actionType: 'Rotina' },
  { id: 'a-marco', name: 'Fechar capítulo', icon: '🏁', arenaId: 'ar-corpo', actionType: 'Marco' },
  { id: 'a-temporada', name: 'Socializar', icon: '🤝', arenaId: 'ar-season', actionType: 'Rotina' },
];
const arenas = [
  { id: 'ar-corpo', name: 'Corpo', assetId: 'saude' },
  { id: 'ar-season', name: 'Quests - Season Genesis', assetId: 'relacoes' },
];
const tasks = [
  { id: 't2', actionId: 'a-temporada', date: HOJE, startTime: 20 * 60, duration: 30, completed: false },
  { id: 't1', actionId: 'a-treino', date: HOJE, startTime: 7 * 60, duration: 60, completed: true },
  { id: 't3', actionId: 'a-marco', date: HOJE, startTime: 12 * 60, duration: 15, completed: false },
  { id: 't-madrugada', actionId: 'a-treino', date: '2026-10-14', startTime: 60, duration: 30, completed: false }, // 01:00 do dia seguinte = ainda hoje
  { id: 't-sem-hora', actionId: 'a-treino', date: HOJE, startTime: -1, duration: 30, completed: false },
  { id: 't-ontem', actionId: 'a-treino', date: '2026-10-12', startTime: 9 * 60, duration: 30, completed: true },
];
const { blocos, tempoRegistradoMin, diaComecaEm } = montarPlannerDoWidget({ tasks, actions, arenas, dataOperacional: HOJE });

assert.equal(diaComecaEm, 4 * 60, 'o dia do planner comeca as 04:00');
assert.deepEqual(blocos.map((b) => b.nome), ['Treino de força', 'Fechar capítulo', 'Socializar', 'Treino de força']);
assert.deepEqual(blocos.map((b) => b.arena), ['Corpo', 'Corpo', 'Quests - Season Genesis', 'Corpo']);
assert.deepEqual(blocos.map((b) => b.inicio), [3 * 60, 8 * 60, 16 * 60, 21 * 60], 'inicio em minutos desde as 04:00; a 01:00 do dia seguinte fica no fim');
assert.deepEqual(blocos.map((b) => b.duracao), [60, 15, 30, 30]);
assert.deepEqual(blocos.map((b) => b.feita), [true, false, false, false]);
assert.deepEqual(blocos.map((b) => b.marco), [false, true, false, false]);
assert.equal(blocos[0].icone, '🏋️');
assert.equal(blocos[0].cores.length, 2, 'o bloco leva as duas cores do degrade da area');
assert.match(blocos[0].cores[0], /^#[0-9a-f]{6}$/);
assert.notDeepEqual(blocos[2].cores, blocos[0].cores, 'missao de temporada tem o degrade proprio');
assert.equal(tempoRegistradoMin, 60, 'tempo registrado = duracao do que foi feito hoje');
console.log('ok - o planner do dia vai pro widget com horario, duracao, cor e estado');

// ---------------------------------------------------------------- o app nao manda mais o login
const contexto = ler('contexts/GameContext.tsx');
const publicacao = contexto.slice(contexto.indexOf('void publishGlyphAndroidWidgetSnapshot({'), contexto.indexOf('void publishGlyphAndroidWidgetSnapshot({') + 600);
assert.doesNotMatch(publicacao, /accessToken|refreshToken/, 'o app ainda manda o login para o widget');
assert.doesNotMatch(ler('utils/androidWidget.ts'), /refreshToken/, 'o tipo do snapshot ainda tem o login');
const snapshots = ler('utils/widgetSnapshots.ts');
assert.match(snapshots, /plannerDoDia/, 'o snapshot do dia nao leva o planner');
assert.match(snapshots, /tempoRegistradoMin/, 'o snapshot do dia nao leva o tempo registrado');

// ---------------------------------------------------------------- o widget
const provedor = ler('android/app/src/main/java/life/glyph/app/GlyphDayWidgetProvider.java');
assert.doesNotMatch(provedor, /HttpURLConnection|refreshSession|widget-action|ACTION_COMPLETE/, 'o widget ainda conclui pelo servidor');
const layout = ler('android/app/src/main/res/layout/glyph_day_widget.xml');
assert.match(layout, /android:text="RESUMO"/);
assert.match(layout, /android:text="PLANNER"/);
assert.match(provedor, /ACTION_TAB_RESUMO/);
assert.match(provedor, /ACTION_TAB_PLANNER/);
assert.match(provedor, /life\.glyph\.app:\/\/widget\/planner/, 'tocar nao abre o planner');
assert.match(provedor, /onAppWidgetOptionsChanged/, 'o widget nao redesenha ao mudar de tamanho');
assert.match(provedor, /ATUALIZADO ÀS/);
const pincel = ler('android/app/src/main/java/life/glyph/app/GlyphDayPaint.java');
assert.match(pincel, /PX_POR_MINUTO = 0\.35f/, 'o planner do widget nao usa a escala do zoom 1');
assert.match(pincel, /static Bitmap resumo\(/);
assert.match(pincel, /static Bitmap planner\(/);
assert.match(provedor, /b\.optString\("arena", "Sem arena"\)/, 'o snapshot do widget deixou de levar a arena da ação');
assert.match(pincel, /float topo = \(bloco\.inicio - inicio\) \* porMinuto/, 'o widget deixou de posicionar blocos pelo horário proporcional');
assert.match(pincel, /Math\.max\(34 \* porMinuto, bloco\.duracao \* porMinuto\)/, 'ações curtas perderam o piso mínimo para emoji e nome');
assert.match(pincel, /if \(caixa\.height\(\) < 9 \* d\) return/, 'ações curtas voltaram a perder texto cedo demais');
assert.doesNotMatch(pincel, /desenharAgenda/, 'o widget voltou para a lista fixa em vez da timeline');
const manifesto = ler('android/app/src/main/AndroidManifest.xml');
assert.doesNotMatch(manifesto, /GlyphBayWidgetService/, 'o servico da lista de concluir ainda esta no manifesto');
console.log('Widget do dia: vitrine com Resumo e Planner, sem concluir e sem login.');
