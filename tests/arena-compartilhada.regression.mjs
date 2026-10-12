import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describeArenaProgress } from '../utils/arenaProgressPresentation.ts';

/** ARENA COMPARTILHADA SEM % E SEM OSCILAR (12/10/2026). */
const ler = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const acoes = [{ id: 'a', actionType: 'Ação Recorrente' }];

// 1. missao de cla conta X/Y
const cla = describeArenaProgress(acoes, { progressPercent: 35, totalCompleted: 7, totalPlanned: 20, hasMeasurableProgress: true, isClanQuestArena: true, isSeasonQuestArena: false, isSharedPool: false, completedActionIds: [], isCleared: false });
assert.equal(cla.label, '7/20', 'a arena da missao de cla voltou a mostrar %');
console.log('ok - a arena da missao de cla mostra 7/20');

// 2. o cartao faz uma conta so
const cartao = ler('components/ArenaCard.tsx');
assert.match(cartao, /const progress = calculatedProgress\.progressPercent;/, 'o cartao voltou a misturar o numero de fora com o proprio');
assert.match(cartao, /forceSharedPool: isExplicitSharedArena\(arena\) \? undefined : false/, 'o pool do par voltou a ligar sozinho');
assert.match(cartao, /hasClanMission=\{isClanQuestArena\}/);
const lista = ler('views/ArenasView.tsx');
assert.match(lista, /forceSharedPool: isExplicitSharedArena\(arena\) \? undefined : false/);
assert.match(ler('components/ArenaStatusTags.tsx'), /hasClanMission[\s\S]*?seal\('Missão de clã'/);
console.log('ok - o cartao e a lista fazem a mesma conta, sem o pool do par ligar sozinho');
