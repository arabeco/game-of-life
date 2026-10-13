import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { primeiroNome, validarNickname, NICKNAME_MAX } from '../utils/nickname.ts';

/**
 * NICKNAME UNICO (12/10/2026), como o Afonso pediu:
 *   - no primeiro acesso o nome ja vem so com o PRIMEIRO nome (o Google manda o completo);
 *   - se alguem ja tem o nome, texto vermelho e o Proximo trava;
 *   - limite de caracteres;
 *   - o banco garante: nome unico sem diferenciar maiuscula/minuscula e espacos nas pontas.
 *     Conta nova com nome repetido (cadastro automatico) ganha um numero no fim, para
 *     o cadastro nunca quebrar; trocar para um nome em uso e recusado.
 */
const ler = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ============================== 1. regras do app
assert.equal(primeiroNome('João Pedro da Silva'), 'João');
assert.equal(primeiroNome('  ana  '), 'ana');
assert.equal(primeiroNome(''), '');
assert.equal(NICKNAME_MAX, 20);
assert.equal(validarNickname('   '), 'vazio');
assert.equal(validarNickname('x'.repeat(21)), 'longo');
assert.equal(validarNickname('Mister X'), null);
console.log('ok - primeiro nome, vazio e longo');

// ============================== 2. o banco
const db = await PGlite.create();
await db.exec(ler('scripts/sql-andaime.sql'));
await db.exec(`create or replace function auth.uid() returns uuid language sql stable as $f$
  select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid $f$;`);
const A = '00000000-0000-0000-0000-00000000000a', B = '00000000-0000-0000-0000-00000000000b', C = '00000000-0000-0000-0000-00000000000c';
await db.exec(`insert into public.user_profiles (id, nickname) values ('${A}', 'Mister X')`);
await db.exec(ler('supabase/migrations/20261012210000_nickname_unico.sql'));
const como = async (u, sql) => {
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ sub: u })]);
  return db.query(sql);
};
assert.equal((await como(B, `select public.nickname_disponivel('mister x') as ok`)).rows[0].ok, false, 'nome em uso (outra caixa) aparecia livre');
assert.equal((await como(B, `select public.nickname_disponivel('  MISTER X ') as ok`)).rows[0].ok, false);
assert.equal((await como(A, `select public.nickname_disponivel('Mister X') as ok`)).rows[0].ok, true, 'o proprio nome aparecia como ocupado');
assert.equal((await como(B, `select public.nickname_disponivel('Luna') as ok`)).rows[0].ok, true);
// cadastro automatico com nome repetido: ganha numero, nunca quebra
await db.exec(`insert into public.user_profiles (id, nickname) values ('${B}', 'mister x')`);
assert.equal((await db.query(`select nickname from public.user_profiles where id = '${B}'`)).rows[0].nickname, 'mister x 2');
// trocar para nome em uso: recusado
await db.exec(`insert into public.user_profiles (id, nickname) values ('${C}', 'Luna')`);
await assert.rejects(db.query(`update public.user_profiles set nickname = 'MISTER X' where id = '${C}'`), /NICKNAME_EM_USO/);
await assert.rejects(db.query(`update public.user_profiles set nickname = '${'y'.repeat(21)}' where id = '${C}'`), /NICKNAME_LONGO/);
await db.query(`update public.user_profiles set nickname = 'Lua' where id = '${C}'`);
console.log('ok - o banco diz se o nome esta livre, numera cadastro repetido e recusa troca para nome em uso ou longo');

// ============================== 3. a tela do primeiro acesso
const tela = ler('components/OnboardingIdentity.tsx');
assert.match(tela, /useState\(\(\) => primeiroNome\(nickname\)\)/, 'o nome do Google entrava completo');
assert.match(tela, /maxLength=\{NICKNAME_MAX\}/, 'sem limite de caracteres');
assert.match(tela, /Esse nome já é de alguém/, 'sem o aviso de nome em uso');
assert.match(tela, /text-red-/, 'o aviso tinha de ser vermelho');
assert.match(tela, /disabled=\{[^}]*nomeOcupado/, 'o Proximo nao trava com nome em uso');
const app = ler('components/FirstUseOnboardingOverlay.tsx');
assert.match(app, /nickname_disponivel/, 'a tela nao pergunta ao servidor se o nome esta livre');
const ajustes = ler('views/SettingsView.tsx');
assert.match(ajustes, /handleSave = async[\s\S]{0,700}nickname_disponivel[\s\S]{0,300}updateUserProfile\(\{ nickname: nome \}\)/, 'Configuracoes trocava o nome sem perguntar se esta livre');
console.log('Nickname: primeiro nome, aviso vermelho, limite de 20 e o banco garantindo.');
