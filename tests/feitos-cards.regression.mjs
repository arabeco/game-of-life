import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getFeedAppearance, acaoDoFeito, tituloDoFeito, numerosDoFeito } from '../utils/feedAppearance.ts';

/**
 * OS CARDS DOS FEITOS (12/10/2026), como o Afonso fechou na bancada
 * (tools/feitos-bancada.html):
 *   - sem o icone do tipo: a foto da pessoa com a borda dela, e o nome tocavel;
 *   - primeira linha centralizada: NOME • AÇÃO; o titulo entre os risquinhos;
 *   - o fundo diz o tipo: patente = fundo da patente; ciclo = fundo da placa;
 *     maestria = branco e dourado com o nivel de cada area; temporada = a cor
 *     dela; arena = a cor da area;
 *   - "missão de temporada" curto; "recalibrou a maestria · Nível N" (nunca Indice);
 *   - a curtida e so a estrela com o numero, sem circulo.
 */
const ler = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const evento = (type, content = {}) => ({ id: 'e', userId: 'u', type, content, timestamp: new Date().toISOString() });

// ============================== 1. o fundo diz o tipo
const patente = getFeedAppearance(evento('PLAYER_RANK_UP', { rankName: 'Conde' }));
assert.match(String(patente.background), /\/assets\/backgrounds\/rank06conde\.webp/, 'subiu de patente sem o fundo da patente');
const patentePorId = getFeedAppearance(evento('PLAYER_RANK_UP', { rankId: 'principe', rankName: 'Príncipe' }));
assert.match(String(patentePorId.background), /rank08principe\.webp/);
const ciclo = getFeedAppearance(evento('CYCLE_COMPLETED', { grade: 'A', score: 92 }));
assert.match(String(ciclo.background), /\/assets\/cycles\/plate-a\.webp/, 'ciclo sem o fundo da placa');
assert.match(String(getFeedAppearance(evento('CYCLE_COMPLETED', { grade: 'SSS' })).background), /plate-sss\.webp/);
assert.equal(getFeedAppearance(evento('CYCLE_COMPLETED', { score: 80 })).background, undefined, 'ciclo antigo sem nota tinha de cair no gradiente');
const maestria = getFeedAppearance(evento('LEVEL_UP', { level: 85 }));
assert.equal(maestria['--feat-hue'], '#f1ece2', 'maestria tinha de ser branco e dourado');
assert.equal(maestria['--feat-hue-secondary'], '#c9a24f');
const arenaDeCorpo = getFeedAppearance(evento('ARENA_COMPLETED', { assetId: 'saude' }));
assert.equal(arenaDeCorpo['--feat-hue'], '#a6424f', 'arena de Corpo tinha de ser vermelha');
console.log('ok - patente com o fundo da patente, ciclo com a placa, maestria branco e dourado, arena na cor da area');

// ============================== 2. os textos
assert.equal(acaoDoFeito(evento('PLAYER_RANK_UP')), 'subiu de patente');
assert.equal(acaoDoFeito(evento('QUEST_COMPLETED', { seasonId: 'season-genesis-0' })), 'missão de temporada');
assert.equal(acaoDoFeito(evento('LEVEL_UP')), 'recalibrou a maestria');
assert.equal(tituloDoFeito(evento('LEVEL_UP', { level: 85 })), 'Nível 85');
assert.doesNotMatch(tituloDoFeito(evento('LEVEL_UP', { level: 85 })), /Índice/, 'a maestria se chama Nivel, nao Indice');
assert.equal(tituloDoFeito(evento('CYCLE_COMPLETED', { title: 'Ciclo de Outono', grade: 'A' })), 'Ciclo de Outono · A');
assert.equal(tituloDoFeito(evento('PLAYER_RANK_UP', { rankName: 'Conde' })), 'Conde');
const areas = numerosDoFeito(evento('LEVEL_UP', { level: 85, areas: [{ id: 'proposito', level: 8 }, { id: 'saude', level: 7 }] }));
assert.deepEqual(areas.map((n) => [n.valor, n.rotulo]), [[8, 'Propósito'], [7, 'Saúde']], 'a maestria tinha de mostrar o nivel de cada area');
assert.ok(areas.every((n) => typeof n.cor === 'string' && n.cor.startsWith('#')), 'cada area na cor dela');
assert.deepEqual(numerosDoFeito(evento('ARENA_COMPLETED', { actionCount: 24, days: 18 })).map((n) => n.rotulo), ['ações', 'dias ativos']);
console.log('ok - NOME • AÇÃO com textos curtos, Nível (nunca Índice), e o nivel de cada area na maestria');

// ============================== 3. o card
const card = ler('components/FeedEventCard.tsx');
const css = ler('components/feed-cards.css');
assert.doesNotMatch(card, /className="feat-medallion"/, 'o icone do tipo voltou');
assert.match(card, /<UserAvatar[\s\S]{0,200}borderId=/, 'a foto da pessoa com a borda dela sumiu');
assert.match(card, /className="feat-nome"[\s\S]{0,120}onClick=/, 'o nome deixou de ser tocavel');
assert.match(card, /className="feat-ponto"/);
assert.match(card, /className="feat-titulo-riscado"/, 'o titulo saiu dos risquinhos');
assert.match(css, /\.feat-topline \{[^}]*grid-template-columns: 1fr auto 1fr/, 'a primeira linha deixou de ser centralizada');
assert.match(css, /\.feed-achievement-card \.feed-like-button \{[^}]*border: 0/, 'a estrela voltou a ter circulo');
console.log('ok - foto com borda, nome tocavel, NOME • AÇÃO centralizado, titulo riscado, estrela sem circulo');

// ============================== 4. o que se publica leva o que o fundo precisa
assert.match(ler('views/ReportsView.tsx'), /type: 'CYCLE_COMPLETED',[\s\S]{0,300}grade:/, 'o ciclo publicado nao leva a nota (sem ela nao ha placa)');
assert.match(ler('components/AchievementModal.tsx'), /rankId: achievement\.data\.id/, 'a patente publicada nao leva o id (sem ele nao ha fundo)');
const maestriaView = ler('views/MasteryView.tsx');
assert.match(maestriaView, /addFeedEvent\(\{\s*type: 'LEVEL_UP'/, 'a maestria nao tem como ser compartilhada');
assert.match(maestriaView, /areas:/);
console.log('ok - ciclo leva a nota, patente leva o id, e a maestria ganhou o compartilhar');

// ============================== 5. o nome que aparece e o atual
const contexto = ler('contexts/GameContext.tsx');
assert.match(contexto, /autoresDoFeed/, 'o feed nao sabe o nome atual de quem nao e amigo');
assert.match(card, /autor\?\.nickname \|\| event\.authorNickname/, 'o card mostra o nome guardado no post em vez do atual');
console.log('Feitos: o fundo diz o tipo, a foto e o nome sao da pessoa, e o nome e o de hoje.');

// ============================== 6. a moldura da maestria sobe com o nivel (a regra do pentagono)
const faixa = (nivel) => getFeedAppearance(evento('LEVEL_UP', { level: nivel }));
assert.equal(faixa(40)['--feat-borda'], '1px');
assert.equal(faixa(55)['--feat-borda'], '2px', 'nos 50 a moldura tinha de engrossar, como no pentagono');
assert.equal(faixa(95)['--feat-borda'], '3px');
assert.ok(Number(faixa(85)['--feat-brilho']) > Number(faixa(55)['--feat-brilho']), 'o brilho tinha de subir com a faixa');
assert.equal(faixa(100)['--feat-coroa'], '1', 'os 100 ganham a coroa');
assert.match(ler('utils/feedAppearance.ts'), /getMasteryBadgeTier\(/, 'a faixa tinha de vir da mesma regra do pentagono');
assert.match(ler('components/feed-cards.css'), /var\(--feat-borda/);
console.log('ok - a moldura do card da maestria sobe nas mesmas faixas do pentagono (25, 50, 75, 90, 100)');

// ============================== 7. adicionar amigo pelo perfil
const perfil = ler('views/ProfileView.tsx');
assert.match(perfil, /!isOwnProfile && !isFriendProfile[\s\S]{0,1400}sendFriendRequest\(displayProfile\.id\)/, 'o perfil de quem nao e amigo nao tem como adicionar');
assert.match(perfil, /Pedido enviado/);
console.log('ok - o perfil de quem nao e amigo tem Adicionar amigo (e mostra pedido enviado)');
