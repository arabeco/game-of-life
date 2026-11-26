import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { forcaDaSenha, senhaAceita, SENHA_MINIMA } from '../utils/forcaDaSenha.ts';

/**
 * UMA REGRA DE SENHA SO (26/11/2026).
 *
 * O cadastro pedia 8 caracteres com numero ou simbolo e a tela de redefinir
 * aceitava 6. Com as duas na mesma regra, o minimo do Supabase pode ser 8.
 */

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

assert.equal(SENHA_MINIMA, 8);
assert.equal(senhaAceita('abc123'), false, '6 caracteres nao passa mais');
assert.equal(senhaAceita('abcdefgh'), false, '8 letras sem numero nem simbolo e media');
assert.equal(senhaAceita('abcdefg1'), true);
assert.equal(senhaAceita('abcdefg!'), true);
assert.equal(forcaDaSenha('').score, 0);
assert.equal(forcaDaSenha('abcdefgh').label, 'MÉDIA');

const login = ler('views/LoginView.tsx');
assert.match(login, /const getPasswordStrength = forcaDaSenha;/, 'o cadastro usa a regra unica');
const redefinir = ler('components/AppRuntimeOverlays.tsx');
assert.match(redefinir, /if \(!senhaAceita\(newPassword\)\)/, 'redefinir senha usa a mesma regra');
assert.doesNotMatch(redefinir, /newPassword\.length < 6/);

console.log('ok - cadastro e redefinicao de senha pedem a mesma senha (8+, com numero ou simbolo)');
