import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/* O AVISO DO BAU E CURTO: "+1 baú raro".
 *
 * Em 09/10/2026 ele dizia "Baú Raro adicionado" (e, no fim do ciclo,
 * "adicionado ao inventário"). O "+1" ja diz que entrou. */

const ler = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

const raridade = ler('constants/rarityVisuals.ts');
assert.match(raridade, /export const formatChestGain = \(type: ChestType \| string, quantidade = 1\): string =>\s*`\+\$\{quantidade\} \$\{getChestDisplayName\(type\)\.toLowerCase\(\)\}`/);

for (const rel of ['components/AchievementModal.tsx', 'views/ReportsView.tsx']) {
  const fonte = ler(rel);
  assert.match(fonte, /formatChestGain\(/, `${rel} usa o aviso curto`);
  assert.doesNotMatch(fonte, /Baú \$\{[^}]+\} (e .*)?adicionad/, `${rel} ainda diz "adicionado"`);
}

console.log('toast-do-bau: ok');
