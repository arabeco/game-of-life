import assert from 'node:assert/strict';
import { searchPickerIcons, ALL_PICKER_ICONS } from '../utils/emojiSearch.ts';
for (const [query, icon] of [['CORRIDA','🏃'],['programação','💻'],['programacao','💻'],['cachorro','🐕'],['dinheiro','💰'],['piano','🎹'],['tenis','🎾'],['café','☕'],['🫁','🫁']]) {
 assert.ok(searchPickerIcons(query).includes(icon), query);
}
assert.deepEqual(searchPickerIcons('zxqnotfound'), []);
assert.equal(new Set(ALL_PICKER_ICONS).size, ALL_PICKER_ICONS.length);
assert.deepEqual(searchPickerIcons('   '), ALL_PICKER_ICONS);
assert.ok(searchPickerIcons('gato').every(icon => !['🐕','🐶'].includes(icon)));
console.log(`PASS: Portuguese search, accents, multiple categories, unique catalog (${ALL_PICKER_ICONS.length} icons), empty result.`);
