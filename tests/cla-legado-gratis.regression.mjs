import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const catalog = read('../constants/goldCatalog.ts');
const clanModal = read('../components/CreateClanModal.tsx');
const legacyModal = read('../components/LegacyProjectionModal.tsx');
const premiumAccess = read('../utils/premiumAccess.ts');
const migration = read('../supabase/migrations/20261022120000_cla_e_primeira_cena_gratis.sql');

assert.match(catalog, /GOLD_CLAN_CREATION_COST\s*=\s*0/, 'criar clã não pode voltar a custar ouro no cliente');
assert.match(clanModal, /Criação gratuita/, 'o modal deve explicar que criar clã é gratuito');
assert.match(clanModal, /GOLD_CLAN_CREATION_COST <= 0/, 'o modal gratuito não pode abrir confirmação de débito');

assert.match(premiumAccess, /legacyProjectionSceneFreeClaimedAt/, 'o perfil precisa conhecer o primeiro resgate grátis do Legado');
assert.match(premiumAccess, /if \(!profile\?\.legacyProjectionSceneFreeClaimedAt\) return 0/, 'a primeira cena deve aparecer grátis antes de chamar o banco');
assert.doesNotMatch(legacyModal, /isPremium/, 'a cena base do Legado não pode continuar atrás do Premium');
assert.match(legacyModal, /Você precisa fechar pelo menos 1 ciclo antes de criar sua cena do legado/, 'sem ciclo fechado, o toque deve explicar o próximo passo');

assert.match(migration, /legacy_projection_scene_free_claimed_at timestamptz/, 'o servidor deve guardar que a primeira cena grátis já foi usada');
assert.match(migration, /'cost_gold', 0/, 'a migration precisa devolver custo zero para a primeira cena e para criar o clã');
assert.match(migration, /legacy_projection_scene_first_free_applied/, 'o cliente precisa distinguir a primeira cena grátis de um crédito antigo');
assert.match(migration, /'cost_gold', 0,[\s\S]*?'new_gold', coalesce\(v_new_gold, 0\)/, 'criar clã não pode debitar ouro no servidor');

console.log('Clã gratuito e primeira cena do Legado gratuita: cliente, servidor e landing alinhados.');
