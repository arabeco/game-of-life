import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transform } from 'esbuild';

const source = readFileSync(new URL('../utils/oracleSpeech.ts', import.meta.url), 'utf8');
const { code } = await transform(source, { loader: 'ts', format: 'esm' });
const { emitOracleSpeech, ORACLE_SPEECH_EVENT } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const events = [];
globalThis.window = { dispatchEvent: event => events.push(event) };
globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
for (const kind of ['abertura', 'reacao']) {
  for (const ephemeral of [true, false, undefined]) {
    emitOracleSpeech({ kind, ephemeral, message: 'Mensagem de momento.' });
  }
}
emitOracleSpeech({ message: '   ' });
assert.equal(events.length, 6);
assert.ok(events.every(event => event.type === ORACLE_SPEECH_EVENT));
assert.doesNotMatch(source, /supabase|fetch\(|record_oracle_speech/);
delete globalThis.window;
emitOracleSpeech({ message: 'Sem navegador.' });
console.log('Oracle: abertura e reação são temporárias, inclusive emissores antigos; texto vazio e SSR seguros.');
