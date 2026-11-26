import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AULAS_SOLTAS, CAMPANHAS, MIGRACAO, lerCampanha, lerDias, montarMigracao } from '../scripts/campanhas-md.mjs';

/**
 * TODA AULA PROMETIDA TEM TEXTO (26/11/2026).
 *
 * A checagem de prontidao achou 11 campanhas que mandavam "ler a aula" com o
 * texto vazio, embora as 16 estivessem escritas desde 27/10 nos MDs. A migracao
 * 20261126150000 leva os modelos completos ao catalogo; este teste garante que
 * eles fecham com o que o app instala e que a migracao nao fica para tras do MD.
 */

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

assert.deepEqual(lerDias('[1 a 3]'), [1, 2, 3]);
assert.deepEqual(lerDias('D1, D3, D5'), [1, 3, 5]);
assert.deepEqual(lerDias('D2 a D4'), [2, 3, 4]);

// As 15 da vitrine (o mapa das capas) sao exatamente as convertidas.
const capas = ler('components/CapaDaCampanha.tsx');
const naVitrine = [...capas.matchAll(/'([0-9a-f-]{36})': '[a-z-]+'/g)].map((m) => m[1]).sort();
assert.deepEqual(CAMPANHAS.map((c) => c.id).sort(), naVitrine, 'toda campanha da vitrine vem do seu MD');

const TIPOS = new Set(['Ação Recorrente', 'Compromisso', 'Marco']);
for (const campanha of CAMPANHAS) {
    const c = lerCampanha(campanha);
    const onde = c.titulo || campanha.arquivo;
    assert.ok(c.titulo && c.descricao, `${onde}: nome e descricao da loja`);
    assert.ok(c.levels.length >= 1 && c.levels.length <= 3, `${onde}: 1 a 3 fases`);
    assert.equal(c.duracaoDias, c.levels.length === 1 ? c.duracaoDias : c.levels.length * 7, `${onde}: duracao bate com as fases`);
    c.levels.forEach((level, i) => {
        assert.equal(level.level, i + 1, `${onde}: fases em ordem`);
        assert.ok(level.description, `${onde} fase ${i + 1}: descricao da fase`);
        assert.ok(level.actions.length > 0, `${onde} fase ${i + 1}: tem acao`);
        for (const a of level.actions) {
            const quem = `${onde} / ${a.name}`;
            assert.ok(a.icon && a.name && a.description, `${quem}: icone, nome e descricao`);
            assert.ok(a.dias.length > 0 && a.dias.every((d) => d >= 1 && d <= 7), `${quem}: dias dentro da fase`);
            assert.equal(a.repetitions, a.dias.length, `${quem}: repeticoes = dias (senao a fase nao fecha)`);
            assert.ok(TIPOS.has(a.actionType), `${quem}: tipo que o instalador aceita`);
            assert.equal(a.actionType === 'Compromisso', a.dias.length === 1, `${quem}: um dia = Compromisso`);
            assert.ok(a.difficulty >= 1 && a.difficulty <= 3, `${quem}: dificuldade 1 a 3`);
            assert.ok(a.duration >= 15 && a.duration % 15 === 0, `${quem}: duracao em passos de 15`);
            assert.equal(typeof a.scheduledStartTime, 'number', `${quem}: horario sugerido`);
            if (/^\s*leia (a|o) (aula|texto)/i.test(a.description) || a.icon === '📘') {
                assert.ok((a.briefing || '').length >= 300, `${quem}: aula com texto de verdade`);
            }
            if (a.preFlight) assert.ok(a.preFlight.every((item) => item.trim()), `${quem}: checklist sem item vazio`);
        }
    });
}

for (const solta of AULAS_SOLTAS) {
    assert.ok(solta.texto.length >= 300 && solta.texto.includes('[[page]]'), `aula solta ${solta.id}: texto em paginas`);
}

// A migracao e a que o gerador escreve hoje: mudou o MD, gere de novo.
assert.equal(readFileSync(MIGRACAO, 'utf8'), montarMigracao(), 'rode: node scripts/campanhas-md.mjs');

// O instalador le `dias` do modelo, e o quiz usa os nomes novos.
const contexto = ler('contexts/GameContext.tsx');
assert.match(contexto, /diasDaFase: diasValidos\(levelAction\.dias\)/);
const quiz = ler('components/Store/CampaignRecommendationQuizModal.tsx');
assert.ok(quiz.includes("'Mente sem Armadilhas'") && quiz.includes("'Círculo Forte'"), 'o quiz acha as campanhas pelos nomes novos');
assert.ok(!quiz.includes("'Leitura Ativa'") && !quiz.includes("'Construção de Clã'"));

console.log('ok - toda aula prometida nas campanhas da vitrine tem texto, e o modelo fecha com o instalador');
