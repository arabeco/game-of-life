import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * A CAMPANHA SE BUSCA NO ORACULO, E NAO SE GANHA (13/10/2026, decidido com o Afonso).
 *
 *   - o quiz saiu da loja: la ficam a busca e os filtros (area, tipo e tema);
 *   - na aba Missao do Oraculo, ao lado de pedir missao, "Buscar campanha" abre
 *     as perguntas e recomenda uma campanha do catalogo pago;
 *   - nada de campanha de graca, nem para iniciante: o modo "gratuitas" saiu e o
 *     quiz comeca no catalogo completo. Ficha antiga ainda vale (modo media).
 */
const ler = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const loja = ler('components/Store/CodexStore.tsx');
assert.doesNotMatch(loja, /<CampaignRecommendationQuizModal|handleQuizTeaser/, 'o quiz ainda esta na loja');
assert.match(loja, /setFiltersOpen/, 'a loja perdeu os filtros');

const painel = ler('components/OracleMissionPanel.tsx');
assert.match(painel, />\s*Buscar campanha\s*</, 'sem o botao Buscar campanha na aba Missao');
assert.match(painel, /<CampaignRecommendationQuizModal/, 'Buscar campanha nao abre as perguntas');

const quiz = ler('components/Store/CampaignRecommendationQuizModal.tsx');
assert.match(quiz, /useState<QuizMode>\('full'\)/, 'o quiz ainda comeca nas campanhas gratuitas');
assert.match(quiz, /const canPickFreeQuiz = false;/, 'o quiz ainda oferece campanha de graca');
console.log('Campanha: busca no Oraculo, filtros na loja, nada de graca.');
