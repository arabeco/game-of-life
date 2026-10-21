import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * O PLANNER TREMIA COM O CELULAR (21/10/2026, achado do Afonso).
 *
 * O App escutava o sensor de movimento (deviceorientation) o tempo todo e, a
 * cada leitura — dezenas por segundo —, reescrevia --tilt-x e --tilt-y no <html>.
 * Variavel CSS no topo e herdada pela pagina inteira: cada mexida do celular
 * recalculava o estilo de tudo, e o planner, cheio de cartoes, tremia. Ninguem
 * lia essas variaveis: o efeito de inclinacao ja tinha sido desligado (ArenaCard
 * com transform none), so a escuta tinha ficado.
 */
const arquivos = ['App.tsx'];
const andar = (pasta) => { for (const nome of readdirSync(pasta)) { const p = join(pasta, nome); if (statSync(p).isDirectory()) andar(p); else if (/\.(ts|tsx|css)$/.test(nome)) arquivos.push(p); } };
['components', 'views', 'hooks', 'utils', 'contexts'].forEach(andar);
arquivos.push('index.css');

const escutam = arquivos.filter((p) => /addEventListener\(\s*['"](deviceorientation|devicemotion)['"]/.test(readFileSync(p, 'utf8')));
assert.deepEqual(escutam, [], `escutando o sensor de movimento: ${escutam.join(', ')}`);
const escrevem = arquivos.filter((p) => /setProperty\(\s*['"]--tilt-/.test(readFileSync(p, 'utf8')));
assert.deepEqual(escrevem, [], `reescrevendo --tilt no <html>: ${escrevem.join(', ')}`);
console.log('Sensor de movimento: ninguem escuta, e nada se recalcula quando o celular mexe.');
