import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { missionObjective } from '../utils/missionPresentation.ts';

/**
 * CADA MODAL DIZ O QUE A PESSOA FEZ.
 *
 * Relatado em 10/10/2026: "mostrou missao secreta concluida mas o que foi
 * concluido era a missao individual, e ainda falou duas missoes". Nada estava
 * errado na conta (eram mesmo duas missoes do Oraculo na historia da conta). O
 * defeito era de leitura: a conquista secreta tocava o MESMO video "Missao!" da
 * missao, e a frase de todo modal de missao era "A recompensa desta missao ja
 * entrou" — sem dizer o que foi cumprido, nem de que tipo de missao era.
 */

const fonte = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ============================== 1. a missao do Oraculo traz a descricao do cartao
// Decidido em 10/10/2026: a frase e a MESMA do cartao da missao, no imperativo
// ("Conclua 5 acoes em Treino em 7 dias"), e nao reescrita no passado — a pessoa
// reconhece o que aceitou.
const pacto = (kind, extra = {}) => ({
  kind, arenaId: 'a1', arenaName: 'Treino', goal: 5,
  startedOn: '2026-10-05', endsOn: '2026-10-11', ...extra,
});
assert.equal(missionObjective(pacto('volume')), 'Conclua 5 ações em Treino em 7 dias');
console.log('ok - a missao do Oraculo mostra a descricao igual a do cartao');

const contexto = fonte('contexts/GameContext.tsx');
const receber = contexto.slice(contexto.indexOf('const claimArenaPact = async'), contexto.indexOf('A MISSAO INDIVIDUAL SE RECEBE NA ABA MISSAO'));
assert.match(receber, /feito: missionObjective\(pact\)/, 'o modal da missao individual deixou de mostrar a descricao do cartao');
assert.match(receber, /sobrancelha: pact\.kind === 'primeira' \? 'Missão inicial' : 'Missão do Oráculo'/,
  'o modal da missao individual deixou de dizer de que tipo de missao ela e');

const sistema = contexto.slice(contexto.indexOf('const claimSystemChallenge = async'), contexto.indexOf('const claimSystemChallenge = async') + 2200);
assert.match(sistema, /sobrancelha: 'Missão inicial',/,
  'a missao inicial deixou de se apresentar como missao inicial');
assert.match(sistema, /feito: challenge\.description\.replace\(\/\\s\*Recompensa:\.\*\$\/, ''\)/,
  'a missao inicial deixou de mostrar a descricao do cartao');
console.log('ok - o modal diz se a missao e inicial ou do Oraculo');

// ============================== 2. o modal usa o que recebe
const modal = fonte('components/AchievementModal.tsx');
assert.match(modal, /message: data\.feito \|\| 'A recompensa desta missão já entrou\.'/,
  'o modal de missao voltou a ignorar o que foi feito');
assert.match(modal, /const sobrancelha = isCompetitionResult \? 'Resultado do desafio' : \(achievement\.data\.sobrancelha \|\| ''\);/,
  'a sobrancelha do modal deixou de vir do acontecimento');
console.log('ok - o modal mostra o feito e o tipo, e so cai na frase generica sem eles');

// ============================== 3. a conquista secreta nao finge ser missao
// O medidor importa sem extensao, como o resto do app; o esbuild resolve.
const pacote = await build({
  entryPoints: [fileURLToPath(new URL('../utils/medidorDeSegredos.ts', import.meta.url))],
  bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent',
});
const arquivo = join(mkdtempSync(join(tmpdir(), 'glyph-modais-')), 'medidor.mjs');
writeFileSync(arquivo, pacote.outputFiles[0].text);
const { montarModalDeSegredos, REGRAS_DE_DESBLOQUEIO } = await import(pathToFileURL(arquivo).href);
const oraculo = REGRAS_DE_DESBLOQUEIO.find((regra) => regra.id === 'oraculo');
const segredo = montarModalDeSegredos([oraculo]);
assert.equal(segredo.semVideo, true, 'a conquista secreta voltou a tocar o video "Missao!"');
// Como o cartao de missao: a regra no imperativo, e nao contada no passado.
assert.equal(segredo.frase, 'Cumpra duas missões individuais do Oráculo');
for (const regra of REGRAS_DE_DESBLOQUEIO) {
  assert.doesNotMatch(regra.frase, /^Você /, `a frase de ${regra.id} voltou para o passado`);
  assert.doesNotMatch(regra.frase, /\.$/, `a frase de ${regra.id} ganhou ponto final, e o cartao de missao nao tem`);
}
console.log('ok - a conquista secreta entra sem o video de missao e diz a regra como um cartao');

console.log('Modais das missoes: cada um diz o tipo e o que foi cumprido.');
