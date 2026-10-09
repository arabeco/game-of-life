import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ==========================================================================
 * "MEUS AMIGOS SUMIRAM" — 09/10/2026.
 *
 * 20260929103000_public_profile_boundary tirou a leitura direta do perfil dos
 * outros: user_profiles so devolve a linha de quem pergunta. A consulta em lote
 * `from('user_profiles').in('id', [...])` nao da erro — volta so a propria
 * linha —, e assim a lista de amigos esvaziava (o app filtrava quem nao tinha
 * perfil), a parceria mostrava um fantasma e o cla virava "Membro
 * Desconhecido".
 *
 * O perfil de outra pessoa sai por RPC: get_public_profile_data (um, completo
 * conforme as preferencias) e get_public_profile_cards (varios, so o cartao).
 * ========================================================================== */

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ler = (rel) => readFileSync(path.join(raiz, rel), 'utf8');

const arquivosDoApp = [];
const andar = (dir) => {
  for (const nome of readdirSync(path.join(raiz, dir))) {
    const rel = path.join(dir, nome);
    if (statSync(path.join(raiz, rel)).isDirectory()) andar(rel);
    else if (/\.(ts|tsx|js|jsx)$/.test(nome)) arquivosDoApp.push(rel);
  }
};
['components', 'contexts', 'views', 'hooks', 'utils'].forEach(andar);
arquivosDoApp.push('App.tsx');

// 1. Nenhuma tela le varios perfis direto da tabela.
const LOTE_DIRETO = /from\(\s*['"]user_profiles['"]\s*\)[\s\S]{0,240}?\.in\(\s*['"]id['"]/;
for (const rel of arquivosDoApp) {
  assert.doesNotMatch(ler(rel), LOTE_DIRETO, `${rel} le perfis dos outros direto de user_profiles`);
}

// 2. Os quatro lugares que montam amigos, cla, vinculos e conexoes usam o lote publico.
const contexto = ler('contexts/GameContext.tsx');
const hidratar = contexto.slice(contexto.indexOf('const hydrateProfilesByIds'), contexto.indexOf('const loadFriendsAndRequests'));
assert.match(hidratar, /rpc\('get_public_profile_cards'/, 'amigos e vinculos hidratam pelo cartao publico');
const membros = contexto.slice(contexto.indexOf('const memberIds = uniqueMembersData'), contexto.indexOf('const contributionTotals'));
assert.match(membros, /rpc\('get_public_profile_cards'/, 'o cla hidrata pelo cartao publico');
assert.match(ler('views/SettingsView.tsx'), /rpc\('get_public_profile_cards'/, 'a tela de amigos hidrata pelo cartao publico');
assert.match(ler('components/ConnectionsModal.tsx'), /rpc\('get_public_profile_cards'/, 'conexoes hidratam pelo cartao publico');

// Perfil embutido em outra tabela tambem passa pelo RLS: o remetente das
// mensagens diretas voltava nulo e a conversa com quem nao era amigo sumia.
const semComentarios = (codigo) => codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const buscarDMs = semComentarios(contexto.slice(contexto.indexOf('const fetchDMs'), contexto.indexOf('const sendDirectMessage')));
assert.doesNotMatch(buscarDMs, /user_profiles!/, 'as mensagens nao embutem o perfil do outro');
assert.match(buscarDMs, /hydrateProfilesByIds\(/, 'o cartao de cada participante vem do lote publico');

// 3. A funcao devolve so o cartao: nada de e-mail ou carteira.
const migracao = ler('supabase/migrations/20261009090000_cartoes_publicos_em_lote.sql');
const retorno = migracao.slice(migracao.indexOf('returns table ('), migracao.indexOf('language plpgsql'));
assert.doesNotMatch(retorno, /\b(email|wallet|gold|fragments|checklist_items)\b/, 'o cartao publico nao carrega dado privado');
assert.match(migracao, /security definer/);
assert.match(migracao, /raise exception 'AUTH_REQUIRED'/, 'so quem esta logado');
assert.match(migracao, /grant execute on function public\.get_public_profile_cards\(uuid\[\]\) to authenticated;/);

console.log('cartoes-publicos: ok');
