import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * O que so quebra no aparelho.
 *
 * Duas coisas deste arquivo tem a mesma assinatura: funcionam no navegador e
 * falham no APK, porque dependem de algo que o navegador nao tem.
 *
 * 1. AS BARRAS DO SISTEMA. O Capacitor 8 com targetSdk 36 desenha a WebView
 *    edge-to-edge: a pagina ocupa a tela inteira, por baixo da barra de status
 *    em cima e da barra de gestos embaixo. Antes ele encostava a WebView abaixo
 *    da barra de status, e o cabecalho em `top: 0` caia no lugar certo por
 *    acidente. Hoje a faixa de 64px do cabecalho nasce por baixo da barra de
 *    status, e a fileira de atalhos da tela de descanso cai dentro da barra de
 *    gestos. No navegador nao existe barra de sistema, entao nada disso aparece.
 *
 * 2. O DADO QUE AINDA NAO CHEGOU. `oraclePreferences` vem do banco depois da
 *    primeira renderizacao. Num navegador que ja abriu o app varias vezes, ele
 *    ja esta la quando se chega em Ajustes; num aparelho recem-instalado, nao.
 *    Quem desiste de desenhar nesse intervalo vira um botao que nao responde.
 */

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

const indexCss = read('index.css');
const headerCss = read('components/global-header.css');
const authenticatedApp = read('components/AuthenticatedApp.tsx');
const restScreen = read('components/RestScreen.tsx');

// --- a variavel do app le as duas fontes ----------------------------------
// O Capacitor grava `--safe-area-inset-top` inline no <html>; o `env()` so
// responde em WebView recente e no iOS. Ler uma so das duas deixa a margem em
// zero justamente no aparelho onde ela importa.
for (const lado of ['top', 'right', 'bottom', 'left']) {
  assert.match(
    indexCss,
    new RegExp(`--safe-area-inset-${lado}:\\s*env\\(safe-area-inset-${lado}`),
    `--safe-area-inset-${lado} precisa cair no env() quando nao ha Capacitor`,
  );
  assert.match(
    indexCss,
    new RegExp(`--safe-area-${lado}:\\s*var\\(--safe-area-inset-${lado}`),
    `--safe-area-${lado} precisa passar por --safe-area-inset-${lado}, que e o nome que o Capacitor grava`,
  );
}

// A forma antiga lia o env() direto e ignorava o que o Capacitor injeta.
assert.doesNotMatch(
  indexCss,
  /--safe-area-top:\s*env\(/,
  'ler o env() direto em --safe-area-top volta a ignorar a injecao do Capacitor',
);

// --- o cabecalho comeca abaixo da barra de status --------------------------
assert.match(
  headerCss,
  /\.shell-header\s*\{[^}]*padding-top:\s*var\(--safe-area-top\)/,
  'sem padding no topo os botoes do cabecalho nascem por baixo da barra de status',
);

// --- e o conteudo desce junto com ele --------------------------------------
// O cabecalho e fixo: se o conteudo nao acompanhar, as primeiras linhas de cada
// tela ficam por baixo dele. Em Ajustes eram justamente "Interface & Som" e
// "Oraculo & Alertas" — as duas que pararam de abrir.
assert.match(
  authenticatedApp,
  /const mainPaddingTop = `calc\(\$\{baseTopPadding\}px \+ var\(--safe-area-top\)\)`/,
  'o padding do conteudo tem de somar a barra de status',
);

// --- a tela de descanso cobre a tela toda, entao respeita as duas -----------
const restRoot = restScreen.slice(
  restScreen.indexOf('restscreen-root fixed inset-0'),
  restScreen.indexOf('Sephirot Fog Background'),
);
assert.ok(restRoot.length > 0, 'a raiz da tela de descanso deve ser identificavel');
assert.match(restRoot, /paddingTop: 'var\(--safe-area-top\)'/, 'a tela de descanso comeca abaixo da barra de status');
assert.match(
  restRoot,
  /paddingBottom: 'var\(--safe-area-bottom\)'/,
  'sem isto a fileira de atalhos (jardim, checklist, humor) cai dentro da barra de gestos',
);

// --- o atalho do jardim mora num lugar so ---------------------------------
// Ele existia em Ativos e na tela de descanso ao mesmo tempo. Duas portas para
// a mesma coisa, e a de Ativos nao era a que fazia sentido.
const assetsView = read('views/AssetsView.tsx');
assert.doesNotMatch(assetsView, /GardenZenModal/, 'o jardim sai da aba Ativos');
assert.match(restScreen, /GardenZenModal/, 'o jardim continua na tela de descanso');

// --- o X da dica inicial precisa capturar o toque --------------------------
// O corpo do card e pointer-events-none para nao cobrir os botoes atras dele;
// quem estiver dentro dele e for clicavel tem de reativar por conta propria.
const tipOverlay = read('components/ScreenIntroTipOverlay.tsx');
const fecharDica = tipOverlay.slice(
  tipOverlay.indexOf('aria-label="Fechar dica inicial"') - 400,
  tipOverlay.indexOf('aria-label="Fechar dica inicial"'),
);
assert.match(fecharDica, /pointer-events-auto/, 'o X da dica ficava sem clique dentro do card pointer-events-none');


// --- o modal de preferencias nao pode desistir antes dos hooks -------------
// `oraclePreferences` chega do banco depois da primeira renderizacao. O modal
// tinha um `if (!oraclePreferences) return null;` ACIMA do useEffect, o que
// fazia duas coisas erradas: mudava a contagem de hooks entre renderizacoes, e
// — o que se via — desenhava nada. Tocar em "Oraculo & Alertas" marcava o modal
// como aberto e a tela nao mudava, entao o botao parecia morto. So aparecia em
// aparelho recem-instalado, porque no navegador as preferencias ja estao
// carregadas quando se chega em Ajustes.
const oracleSettings = read('components/OracleSettingsModal.tsx');
const corpo = oracleSettings.slice(oracleSettings.indexOf('export const OracleSettingsModal'));
const posSaida = corpo.indexOf('if (!oraclePreferences)');
const posEfeito = corpo.indexOf('useEffect(');
assert.ok(posSaida > 0 && posEfeito > 0, 'a saida e o efeito devem existir');
assert.ok(
  posSaida > posEfeito,
  'o return por preferencias ausentes tem de vir DEPOIS dos hooks, senao a contagem de hooks muda entre renderizacoes',
);
assert.doesNotMatch(
  corpo.slice(posSaida, posSaida + 200),
  /return null/,
  'devolver vazio faz o toque parecer que nao aconteceu; a espera precisa de rosto',
);

console.log('Safe area: o cabecalho desce a barra de status, o conteudo acompanha, e a tela de descanso respeita as duas barras.');
