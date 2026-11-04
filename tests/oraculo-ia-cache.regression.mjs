import assert from 'node:assert/strict';
import { guardarPadroes, padroesGuardados } from '../supabase/functions/_shared/oraculo-ia-cache.ts';

/**
 * OS PADROES GUARDADOS (04/11/2026, com o Afonso). A 2a e a 3a mensagem seguidas
 * nao releem o banco: os padroes valem 5 minutos, por conta, na memoria da funcao.
 */
guardarPadroes('a', 'padroes de a', 1000);
assert.equal(padroesGuardados('a', 1000 + 4 * 60_000), 'padroes de a', 'dentro dos 5 minutos');
assert.equal(padroesGuardados('b', 1000), null, 'cada conta com os seus');
assert.equal(padroesGuardados('a', 1000 + 5 * 60_000 + 1), null, 'depois de 5 minutos le de novo');
for (let i = 0; i < 300; i += 1) guardarPadroes(`u${i}`, 'x', 2000 + i);
assert.equal(padroesGuardados('u0', 3000), null, 'a mais antiga sai: a memoria nao cresce sem fim');
assert.equal(padroesGuardados('u299', 3000), 'x');
console.log('Cache do Oraculo com IA: 5 minutos, por conta, com teto.');
