import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * PRIMEIRA IMPRESSAO (22/11/2026, com o Afonso).
 *
 *  1. Termos: era "segure" e travava (tocar nao fazia nada, mexer 10px
 *     cancelava). Agora e um gesto so, que se explica: arrastar a bolinha ate o
 *     fim. Tocar nao aceita, mostra o caminho.
 *  2. Abertura: uma tela so ate o app estar pronto, sem "Preparando o
 *     ambiente", "Carregando" ou "Retomando" depois do video.
 *  3. Widget do dia: encolhe ate 2 colunas.
 */
const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

// 1. Termos
const termos = ler('components/AppRuntimeOverlays.tsx');
const overlay = termos.slice(termos.indexOf('export const TermsOverlay'), termos.indexOf('export const', termos.indexOf('export const TermsOverlay') + 10));
assert.doesNotMatch(overlay, /useLongPress|SEGURE|isHolding/, 'os termos voltaram a pedir para segurar');
assert.match(overlay, /Arraste até o fim para aceitar/, 'o trilho tem de dizer o gesto');
assert.doesNotMatch(overlay, /Toque ou arraste/, 'um modo so: arrastar');
assert.match(overlay, /if \(fracao >= 0\.9\) \{ arrasteRef\.current = null; setPuxado\(1\); handleAccept\(\); \}/, 'chegar ao fim aceita');
assert.match(overlay, /const soltarArraste = \(\) => \{[\s\S]{0,300}?setPuxado\(0\);\s*if \(!arraste\.arrastou\) mostrarOCaminho\(\);/, 'soltar antes volta; tocar mostra o caminho e nao aceita');
assert.doesNotMatch(overlay.slice(overlay.indexOf('const soltarArraste'), overlay.indexOf('const cancelarArraste')), /handleAccept/, 'soltar no meio nao pode aceitar');
assert.match(overlay, /setPointerCapture/, 'o dedo saindo do trilho nao pode perder o arraste');

// 2. Abertura
const abertura = ler('components/SplashScreen.tsx');
assert.match(abertura, /if \(!safetyCapReached && \(!aberturaTerminou \|\| isLoading\)\) return;/, 'a abertura tem de esperar o app ficar pronto');
assert.match(abertura, /const splashSafetyCap = 20000;/, 'sem rede de seguranca, uma falha prenderia a pessoa na abertura');
assert.doesNotMatch(abertura, /Retomando|Voltando direto para o app/);
assert.match(abertura, /preferQuietResume \|\| \(videoEnded && isLoading\) \?/, 'depois do video, a logo fica no lugar enquanto carrega');

// 3. Widget do dia
const widget = ler('android/app/src/main/res/xml/glyph_day_widget_info.xml');
assert.match(widget, /android:minResizeWidth="110dp"/, 'o widget do dia tem de encolher ate 2 colunas');
const provedor = ler('android/app/src/main/java/life/glyph/app/GlyphDayWidgetProvider.java');
assert.match(provedor, /boolean estreito = largura < Math\.round\(170 \* d\);/);

console.log('primeira-impressao: ok');
