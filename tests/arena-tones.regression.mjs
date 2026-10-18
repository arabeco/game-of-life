import assert from 'node:assert/strict';
import { ARENA_TONES, getArenaTone, getArenaActionGradient, getCampaignGradient, nextArenaToneSequence } from '../utils/arenaTones.ts';

const arena = (id, sequence, assetId = 'trabalho') => ({ id, assetId, colorToneSequence: sequence, name: 'Leitura', description: '', icon: '📚', actionIds: [] });
for (const [area, palette] of Object.entries(ARENA_TONES)) {
    assert.equal(new Set(palette).size, 5);
    for (let index = 0; index < 11; index++) assert.equal(getArenaTone(arena(String(index), index, area)), palette[index % 5]);
}
const arenas = Array.from({ length: 7 }, (_, i) => arena(String(i), i));
const before = Object.fromEntries(arenas.map(a => [a.id, getArenaTone(a)]));
for (const a of arenas.toReversed().slice(1)) assert.equal(getArenaTone(a), before[a.id]);
assert.equal(nextArenaToneSequence(arenas, 'trabalho'), 7);
assert.equal(nextArenaToneSequence(arenas.slice(0, 3), 'trabalho', 7), 7, 'deleting newest does not rewind counter');
assert.equal(nextArenaToneSequence(arenas, 'proposito'), 0);
assert.equal(getArenaTone(arena('legacy', 2, 'financas')), ARENA_TONES.trabalho[2]);
for (const bad of [undefined, null, -1, NaN, 1.5, '3']) {
    const snapshot = arena('legacy', bad);
    assert.match(getArenaTone(snapshot), /^#[0-9A-Fa-f]{6}$/);
    assert.equal(getArenaTone(snapshot), getArenaTone(JSON.parse(JSON.stringify(snapshot))));
}
assert.equal(getArenaActionGradient(arena('a', 0)), 'linear-gradient(135deg, #41412d 0%, #64623b 48%, #bcb35d 100%)');
assert.match(getArenaActionGradient(arena('orange', 3, 'lazer')), /#f38601 100%/);
for (const [name, gradient] of [['Quests - Season', 'season'], ['Quests - Clã', 'clan'], ['Sidequest', 'sidequest']]) {
    assert.equal(getArenaActionGradient({ ...arenas[0], name }), `var(--quest-grad-${gradient})`);
}
console.log('Arena tones: five palettes, wrapping, stable IDs, deletion, aliases, malformed snapshots and quest styles passed.');

const red = arena('red', 0, 'saude');
const blue = arena('blue', 0, 'proposito');
assert.notEqual(getCampaignGradient([red, blue]), getCampaignGradient([red]));
assert.notEqual(getCampaignGradient([red, blue]), getCampaignGradient([blue]));
assert.equal(getCampaignGradient([red, blue, red]), getCampaignGradient([red, blue]));
assert.equal(getCampaignGradient([red, blue]), getCampaignGradient(JSON.parse(JSON.stringify([red, blue]))));
assert.notEqual(getCampaignGradient([red, blue]), getCampaignGradient([red, {...blue, colorToneSequence: 1}]));
for (const list of [[], [red], [red, blue]]) assert.doesNotMatch(getCampaignGradient(list), /NaN|undefined/);
console.log('Campaign gradients: combine distinct tones, reflect tone updates, stable after serialization, safe with zero or one arena.');
