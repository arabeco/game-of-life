import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { trocasDaConversa } from '../utils/trocasDoOraculoIa.ts';

/**
 * A CONVERSA COM O ORACULO FICA (22/11/2026, com o Afonso).
 *
 * "O oraculo nao ta guardando nada do historico, nem uma resposta que ele
 * acabou de dar." A funcao gravava a conversa, mas o app nunca lia: sem
 * politica de leitura, e o chat so guardava na tela.
 */
const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

// 1. As linhas do banco (mais nova primeiro) viram trocas em ordem de leitura.
const trocas = trocasDaConversa([
  { pergunta: 'E agora?', resposta: 'Agora o treino.', tom: 'coach', criada_em: '2026-11-21T12:00:00Z' },
  { pergunta: 'Oi', resposta: 'Oi, tudo certo.', tom: null, criada_em: '2026-11-20T09:00:00Z' },
  { pergunta: '', resposta: 'sem pergunta', criada_em: '2026-11-19T09:00:00Z' },
  { pergunta: 'sem data', resposta: 'x', criada_em: null },
]);
assert.equal(trocas.length, 2, 'linha incompleta fica de fora');
assert.equal(trocas[0].pergunta, 'Oi');
assert.equal(trocas[1].tom, 'coach');
assert.equal(trocas[0].tom, null);
assert.deepEqual(trocasDaConversa(null), []);

// 2. O banco deixa cada um ler so as proprias mensagens, e guarda o tom.
const sql = ler('supabase/migrations/20261122120000_conversa_do_oraculo_ia_visivel.sql');
assert.match(sql, /for select\s+to authenticated\s+using \(user_id = auth\.uid\(\)\)/);
assert.match(sql, /add column if not exists tom text/);
assert.doesNotMatch(sql, /for (insert|update|delete|all)/, 'o app so le; quem grava e a funcao');

// 3. A funcao grava o tom de cada resposta.
assert.match(ler('supabase/functions/oraculo-ia/index.ts'), /oraculo_ia_mensagens"\)\.insert\(\{[^}]*\btom\b/);

// 4. O chat le o historico num estado proprio (o carregamento dos cards nao apaga)
//    e mostra o tom nas respostas.
const chat = ler('components/OracleChat.tsx');
assert.match(chat, /lerHistoricoDoOraculoIa\(userProfile\.id\)/);
assert.match(chat, /const \[historicoIa, setHistoricoIa\]/);
assert.match(chat, /conversaCompleta\.filter\(/);
assert.match(chat, /msg\.respostaIa && \([\s\S]{0,300}ORACLE_TONE_LABELS\[msgMode\]\.name/);

console.log('conversa-do-oraculo-fica: ok');
