import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * A TROCA DE EXPERIENCIA TOCA O VIDEO, SEMPRE (02/11/2026).
 *
 * A splash tem um modo silencioso (so o logo, 1,2 s) para a volta do fundo:
 * ele liga quando ha uma acao rodando na tela de descanso ou um aviso de
 * "voltou do fundo" pendente. Na troca Imersivo/Essencial isso fazia o video
 * nao tocar as vezes. A troca pede o video e nao consome o aviso de volta.
 */
const splash = readFileSync(new URL('../components/SplashScreen.tsx', import.meta.url), 'utf8');
assert.match(splash, /sempreComVideo\?: boolean/, 'a splash aceita pedir o video sempre');
assert.match(splash, /useState\(\(\) => !sempreComVideo && \(consumeNativeBackgroundSplashHint\(\) \|\| hasActivePersistedRestScreenActionSession\(\)\)\)/,
  'com o video pedido, nao entra no modo silencioso nem consome o aviso de volta do fundo');

const app = readFileSync(new URL('../components/AuthenticatedApp.tsx', import.meta.url), 'utf8');
assert.match(app, /trocaDeExperiencia && <SplashScreen sempreComVideo onComplete=\{terminarTrocaDeExperiencia\} \/>/,
  'a troca de experiencia pede o video');
console.log('Troca de experiencia: o video toca sempre.');
