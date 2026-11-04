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
// A ESTIMATIVA ESCONDIDA (03/11/2026): antes de responder sobre maestria, a IA
// estima o degrau de cada area numa primeira linha que a pessoa nao ve.
{
  const r = separarMemoria('ESTIMATIVA: Saúde ~7,8 perto do 8 (falta mobilidade)\nSaúde está quase no 8.\nMEMÓRIA: =', 'x');
  assert.equal(r.resposta, 'Saúde está quase no 8.', 'a estimativa nao aparece');
  assert.equal(r.estimativa, 'Saúde ~7,8 perto do 8 (falta mobilidade)');
  assert.equal(separarMemoria('Resposta normal.\nMEMÓRIA: =', '').estimativa, '');
}
console.log('Memoria: estimativa escondida.');
// A PERGUNTA DE TODAS AS AREAS (03/11/2026, com o Afonso): "cada area" nao pode
// virar resposta sobre uma area so. A funcao cola a instrucao na pergunta.
{
  const { lembreteDaPergunta } = await import('../supabase/functions/_shared/oraculo-ia-memoria.ts');
  for (const p of ['Qual o jeito mais fácil de subir de nível em cada área?', 'como melhoro todas as minhas áreas', 'E nas outras áreas?', 'me fala de todas as areas'])
    assert.match(lembreteDaPergunta(p), /cinco áreas/, p);
  assert.equal(lembreteDaPergunta('Como subo em Saúde?'), '');
}
console.log('Memoria: pergunta de todas as areas.');
{
  const { lembreteDoPerfil } = await import('../supabase/functions/_shared/oraculo-ia-memoria.ts');
  assert.match(lembreteDoPerfil('agora: x\nperfil marcado pela pessoa: Momento físico: Em recuperação · Foco relacional: Família\nficha'), /Momento físico: Em recuperação · Foco relacional: Família\. Se a pergunta/);
  assert.equal(lembreteDoPerfil('agora: x\nficha'), '', 'sem perfil, sem lembrete');
}
console.log('Memoria: perfil colado na pergunta.');
{
  const r = separarMemoria('Resposta.\nMEMÓRIA: =\n', 'antiga');
  assert.equal(r.resposta, 'Resposta.', 'quebra de linha no fim nao deixa a linha MEMORIA aparecer');
  assert.equal(r.memoria, 'antiga');
}
console.log('Memoria: quebra de linha no fim.');
// A resposta colada na linha da estimativa nao pode sumir (04/11/2026): a funcao
// tratava tudo como estimativa, a resposta ficava vazia e o app mostrava erro.
{
  const r = separarMemoria('ESTIMATIVA: Lazer ~9 (perto do 10: falta integrar). Faz sentido sim: você marcou Games. Um passo pequeno.\nMEMÓRIA: =', '');
  assert.equal(r.resposta, 'Faz sentido sim: você marcou Games. Um passo pequeno.');
  assert.equal(r.estimativa, 'Lazer ~9 (perto do 10: falta integrar).');
  const s = separarMemoria('ESTIMATIVA: Saúde ~7,8 · Lazer ~9,2.\nResposta.', '');
  assert.equal(s.resposta, 'Resposta.', 'em linha propria continua igual');
}
console.log('Memoria: resposta colada na estimativa.');
