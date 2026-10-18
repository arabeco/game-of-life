import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

/**
 * CONTA NOVA GANHA PERFIL, E "SAIR DA CONTA" SAI (18/10/2026, teste do Luigi).
 *
 * 1. Na tela "Como posso chamar voce?", salvar a idade dava "Nao consegui
 *    salvar" mesmo com internet. A conta nova nunca tinha ganhado a linha em
 *    user_profiles: o syncUserProfile cria o perfil com um UPSERT, e upsert e
 *    INSERT ... ON CONFLICT DO UPDATE — o Postgres exige permissao de UPDATE em
 *    toda coluna enviada, mesmo quando nao ha conflito. Desde 23/09 ("o saldo
 *    nao se escreve a mao") ouro, fragmentos e cia. nao aceitam UPDATE do app,
 *    entao o banco recusava a linha inteira e o update da idade nao achava nada.
 *
 * 2. O "Sair da conta" dessa tela chamava supabase.auth.signOut() cru. No
 *    celular, um SIGNED_OUT que nao foi marcado como intencional e tratado como
 *    queda de sessao e o App restaura a sessao do backup: a pessoa nao saia.
 */
const servico = readFileSync(new URL('../services/SupabaseService.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const inicio = servico.indexOf('static async syncUserProfile');
const corpo = servico.slice(inicio, servico.indexOf('.select()', inicio));
const enviadas = [...corpo.matchAll(/^\s*([a-z_]+):/gm)].map((m) => m[1]).filter((c) => c !== 'id');
assert.ok(enviadas.length > 10, 'nao achei as colunas do upsert do perfil');

// A lista de colunas que o app escreve e a da ultima migration que derrubou o
// UPDATE da tabela e reconcedeu coluna a coluna. (A 20261018100000 devolve o
// UPDATE de saldo so para o 112 nao quebrar, congelando o valor: o app novo nao
// deve contar com isso.)
const pasta = new URL('../supabase/migrations/', import.meta.url);
const ultima = readdirSync(pasta).filter((f) => f.endsWith('.sql')).sort().reverse()
  .map((f) => readFileSync(new URL(f, pasta), 'utf8'))
  .find((sql) => /revoke update on table public\.user_profiles from authenticated/i.test(sql));
assert.ok(ultima, 'nao achei a migration que define o UPDATE por coluna de user_profiles');
const lista = ultima.match(/grant update \(([\s\S]*?)\) on table public\.user_profiles to authenticated/i)[1];
const permitidas = new Set(lista.split(',').map((c) => c.trim()).filter(Boolean));

const proibidas = enviadas.filter((c) => !permitidas.has(c));
assert.deepEqual(proibidas, [], `o upsert do perfil manda colunas sem permissao de UPDATE (o banco recusa a linha inteira): ${proibidas.join(', ')}`);

const onboarding = readFileSync(new URL('../components/FirstUseOnboardingOverlay.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(onboarding, /supabase\.auth\.signOut\(/, '"Sair da conta" do primeiro acesso chama o logout cru, que o celular desfaz');
assert.match(onboarding, /onExit=\{\(\) => \{ void signOutAndClearSupabaseSession\(/, '"Sair da conta" precisa sair pelo logout intencional');

console.log('Conta nova: o perfil nasce sem colunas proibidas, e "Sair da conta" sai de verdade.');
