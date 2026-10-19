import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * VIBRACAO DESLIGADA NAO VIBRA (19/10/2026, Afonso).
 *
 * Com "Vibracao" desligada no menu, arrastar no planner ainda vibrava. O app
 * respeita a chave (todo toque passa por useSensoryFeedback), mas segurar um
 * cartao e um toque longo no WebView, e o Android da a vibracao de toque longo
 * do sistema por conta propria. O WebView passa a nao dar vibracao de sistema;
 * as do app saem pelo @capacitor/haptics (motor de vibracao direto), so quando
 * a pessoa deixou ligado.
 */
const main = readFileSync(new URL('../android/app/src/main/java/life/glyph/app/MainActivity.java', import.meta.url), 'utf8');
assert.match(main, /getWebView\(\)\.setHapticFeedbackEnabled\(false\)/, 'o WebView ainda da a vibracao de toque longo do sistema');
assert.ok(main.indexOf('setHapticFeedbackEnabled') > main.indexOf('super.onCreate'), 'o WebView so existe depois do super.onCreate');

// Nenhum caminho do app vibra sem passar pela chave.
const arquivos = [];
const andar = (pasta) => { for (const nome of readdirSync(pasta)) { const p = join(pasta, nome); if (statSync(p).isDirectory()) andar(p); else if (/\.(ts|tsx)$/.test(nome)) arquivos.push(p); } };
['components', 'views', 'hooks', 'contexts'].forEach((p) => andar(p));
// A roda da Maestria vibra por conta propria (degraus finos), mas so com a prop
// `hapticos`, que a tela liga pela mesma chave — conferido logo abaixo.
const furam = arquivos.filter((p) => !p.endsWith('useSensoryFeedback.ts') && !p.endsWith('MasteryWheel.tsx'))
  .filter((p) => /navigator\.vibrate|safeVibrate\(|vibrarNativo\(|Haptics\.(impact|vibrate|notification|selection)/.test(readFileSync(p, 'utf8')));
assert.deepEqual(furam, [], `vibram sem olhar a configuracao: ${furam.join(', ')}`);
const sensorial = readFileSync(new URL('../hooks/useSensoryFeedback.ts', import.meta.url), 'utf8');
assert.match(sensorial, /getHapticsEnabled\(\) && toqueNativo !== null && vibrarNativo/, 'o toque nativo saiu da chave');

const roda = readFileSync(new URL('../components/MasteryWheel.tsx', import.meta.url), 'utf8');
assert.match(roda, /!hapticosRef\.current/, 'a roda da Maestria vibra sem olhar a prop hapticos');
const maestria = readFileSync(new URL('../views/MasteryView.tsx', import.meta.url), 'utf8');
assert.match(maestria, /hapticos=\{Boolean\(oraclePreferences\?\.hapticsEnabled\)\}/, 'a Maestria liga a vibracao quando a preferencia ainda nao carregou');

console.log('Vibracao: desligada no menu, nada vibra — nem o toque longo do sistema.');
