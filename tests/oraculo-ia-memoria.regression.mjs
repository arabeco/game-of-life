import assert from 'node:assert/strict';
import { separarMemoria, LIMITE_DA_MEMORIA } from '../supabase/functions/_shared/oraculo-ia-memoria.ts';

/**
 * A MEMORIA DO ORACULO COM IA (03/11/2026, com o Afonso).
 *
 * Na mesma chamada, a IA devolve a resposta e, na ultima linha, a memoria
 * atualizada do que a pessoa contou de si ("MEMÓRIA: ..."). A funcao tira
 * essa linha antes de mostrar e guarda a memoria. "=" mantem a anterior.
 */
{
  const r = separarMemoria('Eu deixaria a Meditação hoje.\nMEMÓRIA: não larga a Meditação; dormiu mal em 03/11', '');
  assert.equal(r.resposta, 'Eu deixaria a Meditação hoje.');
  assert.equal(r.memoria, 'não larga a Meditação; dormiu mal em 03/11');
}
{
  const r = separarMemoria('Resposta.\n\nMEMÓRIA: =', 'gosta de treinar cedo');
  assert.equal(r.resposta, 'Resposta.');
  assert.equal(r.memoria, 'gosta de treinar cedo', '"=" mantem a memoria anterior');
}
{
  const r = separarMemoria('Resposta sem a linha.', 'gosta de treinar cedo');
  assert.equal(r.resposta, 'Resposta sem a linha.');
  assert.equal(r.memoria, 'gosta de treinar cedo', 'sem a linha, nada muda');
}
{
  const r = separarMemoria('Resposta.\nMemoria: trabalha de noite', '');
  assert.equal(r.resposta, 'Resposta.');
  assert.equal(r.memoria, 'trabalha de noite', 'aceita sem acento e em minuscula');
}
{
  const r = separarMemoria(`Resposta.\nMEMÓRIA: ${'x'.repeat(900)}`, '');
  assert.ok(r.memoria.length <= LIMITE_DA_MEMORIA, 'memoria tem teto');
}
{
  const r = separarMemoria('MEMÓRIA: só a memória', 'antiga');
  assert.equal(r.resposta, '', 'sem resposta, a funcao trata como falha');
}
{
  const r = separarMemoria('Quem decide é você mesmo, e conversar com você mesma ajuda.\nMEMÓRIA: =', '');
  assert.equal(r.resposta, 'Quem decide é você, e conversar com você ajuda.', 'sem genero');
}
console.log('Memoria do Oraculo com IA: sai da resposta e fica guardada.');
{
  const r = separarMemoria('Isso ajuda a sua memória: dormir bem.', 'antiga');
  assert.equal(r.resposta, 'Isso ajuda a sua memória: dormir bem.', 'so a linha propria vira memoria');
  assert.equal(r.memoria, 'antiga');
}
