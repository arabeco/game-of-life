import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

/**
 * A FILA DO DIARIO (18/10/2026, pedido do Afonso depois do teste do Luigi).
 *
 * Sem internet, a entrada do diario nao se perde nem fica presa no campo: vai
 * para uma fila no aparelho e e enviada sozinha quando a conexao volta, na
 * ordem em que foi escrita.
 */
const saida = await build({ entryPoints: ['utils/diarioPendente.ts'], bundle: true, write: false, platform: 'node', format: 'esm' });
const fila = await import('data:text/javascript;base64,' + Buffer.from(saida.outputFiles[0].text).toString('base64'));

const memoria = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const entrada = (texto) => ({ cabecalho: '18/10/2026 · Coragem', texto, destino: 'ultima', humor: 60 });

// Guardar e ler, por conta.
let s = memoria();
fila.guardarPendente('u1', entrada('primeira'), s);
fila.guardarPendente('u1', entrada('segunda'), s);
fila.guardarPendente('u2', entrada('de outra conta'), s);
assert.deepEqual(fila.lerPendentes('u1', s).map((e) => e.texto), ['primeira', 'segunda'], 'a fila nao guarda na ordem');
assert.equal(fila.lerPendentes('u2', s).length, 1, 'uma conta ve a fila da outra');

// Envia na ordem e para na primeira falha, sem pular nem perder.
const enviadas = [];
let rede = false;
const enviar = async (e) => { if (!rede) return false; enviadas.push(e.texto); return true; };
assert.equal(await fila.enviarPendentes('u1', enviar, s), 0);
assert.equal(fila.lerPendentes('u1', s).length, 2, 'sem rede, a fila perdeu entradas');
rede = true;
assert.equal(await fila.enviarPendentes('u1', enviar, s), 2);
assert.deepEqual(enviadas, ['primeira', 'segunda'], 'a fila nao enviou na ordem');
assert.equal(fila.lerPendentes('u1', s).length, 0, 'entrada enviada continuou na fila');

// A segunda entrada falha: a primeira sai, a segunda fica.
s = memoria();
fila.guardarPendente('u1', entrada('a'), s);
fila.guardarPendente('u1', entrada('b'), s);
let chamadas = 0;
assert.equal(await fila.enviarPendentes('u1', async () => (++chamadas === 1), s), 1);
assert.deepEqual(fila.lerPendentes('u1', s).map((e) => e.texto), ['b'], 'a falha no meio perdeu ou duplicou entradas');

// Duas chamadas ao mesmo tempo nao enviam a mesma entrada duas vezes.
s = memoria();
fila.guardarPendente('u1', entrada('unica'), s);
const vezes = [];
const devagar = async (e) => { vezes.push(e.texto); await new Promise((r) => setTimeout(r, 20)); return true; };
await Promise.all([fila.enviarPendentes('u1', devagar, s), fila.enviarPendentes('u1', devagar, s)]);
assert.deepEqual(vezes, ['unica'], 'duas aberturas do app enviaram a mesma entrada duas vezes');

// Armazenamento quebrado (modo privado, cheio) nao derruba nada.
const quebrado = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); }, removeItem: () => {} };
assert.equal(fila.guardarPendente('u1', entrada('z'), quebrado), false, 'sem armazenamento, a fila diz que guardou');
assert.deepEqual(fila.lerPendentes('u1', quebrado), []);

// Integracao: o humor manda para a fila na falha, e o app esvazia a fila.
const humor = readFileSync(new URL('../components/MoodModal.tsx', import.meta.url), 'utf8');
assert.match(humor, /guardarPendente\(/, 'a falha ao gravar nao manda a entrada para a fila');
const app = readFileSync(new URL('../components/AuthenticatedApp.tsx', import.meta.url), 'utf8');
assert.match(app, /useEnviarDiarioPendente\(/, 'nada envia a fila quando a conexao volta');

console.log('Diario: sem rede a entrada vai para a fila e sai sozinha, na ordem, uma vez.');
