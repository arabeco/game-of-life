import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const connections = read('components/ConnectionsModal.tsx');
const campaigns = read('components/CampaignsCodex.tsx');
const arenaDetail = read('components/ArenaDetailModal.tsx');
const actionModal = read('components/ActionModal.tsx');
const editor = read('components/CodexModal.tsx');
const mentorSql = read('supabase/migrations/20260322174500_campaign_wording_alignment.sql');
const mentorClaimSql = read('supabase/migrations/20261020110000_mentor_codex_requires_claim.sql');

// O editor precisa partir do vínculo vivo e não da tela antiga de Ajustes.
assert.match(connections, /Criar campanha/);
assert.match(connections, /recipientId=\{mentorCodexLink\.pupilId\}/);
assert.match(connections, /relationshipLinkId=\{mentorCodexLink\.id\}/);

// A origem ainda fica no Codex para evitar instalar duas vezes, mas nunca pode
// transformar a campanha de mentoria em conteúdo imutável do catálogo.
assert.match(campaigns, /isMentorDeliveredCampaign/);
assert.match(campaigns, /mentor_relationship_link_id/);
assert.match(arenaDetail, /isMentorDeliveredArena/);
assert.match(actionModal, /isMentorDeliveredAction/);
assert.match(editor, /moveDraftArenaToPhase/);
assert.match(editor, /campaign: buildDraftPreview\(activeCodex\)\.campaign/);

// O servidor continua entregando ao pupilo e guardando o vínculo de autoria.
const forgeMentorCodex = mentorSql.slice(mentorSql.indexOf('create or replace function public.forge_mentor_codex_for_pupil'));
assert.match(forgeMentorCodex, /insert into public\.codex \([\s\S]*?owner_id,[\s\S]*?\) values \([\s\S]*?p_recipient_id/);
assert.match(mentorSql, /mentor_relationship_link_id/);
assert.match(mentorClaimSql, /insert into public\.codex_shares/);
assert.match(mentorClaimSql, /'shareId', v_share_id/);
assert.match(mentorClaimSql, /mentor_relationship_link_id/);

console.log('Mentor Codex: editor parte da mentoria e a cópia do orientado permanece editável.');
