import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { abaInicialDoPerfil, abasDoPerfil, soberanoVisivel } from '../utils/abasDoPerfil.ts';

const perfil = readFileSync(new URL('../views/ProfileView.tsx', import.meta.url), 'utf8');

/* ==========================================================================
 * O PERFIL QUE ABRE NO AVATAR (15/11/2026, com o Afonso).
 *
 * O soberano ficava solto no canto, por cima do nome e do OK, e quem nao tinha
 * soberano ficava com o buraco. E a area das abas cortava embaixo no celular:
 * o cartao tem altura fixa e o miolo era overflow-hidden.
 *
 *   - o soberano vira a PRIMEIRA aba, com os artefatos; sem soberano, nao ha aba;
 *   - ordem: Soberano, Resumo, Maestria, Widgets; abre no Soberano, senao no Resumo;
 *   - o miolo das abas rola, em vez de cortar;
 *   - o Resumo nao repete a maestria (ja tem aba propria).
 * ========================================================================== */

// ---------------------------------------------------------------------------
// 1. QUEM TEM SOBERANO PARA MOSTRAR.
// ---------------------------------------------------------------------------
assert.equal(soberanoVisivel(undefined), false);
assert.equal(soberanoVisivel({ outfit: 'none' }), false, 'conta nova, sem roupa: nao mostra');
assert.equal(soberanoVisivel({ outfit: 'skin_x' }), true, 'vestido e sem escolha: mostra');
assert.equal(soberanoVisivel({ outfit: 'skin_x', primaryDisplay: 'none' }), false, 'escolheu esconder: nao mostra');
assert.equal(soberanoVisivel({ outfit: 'none', primaryDisplay: 'sovereign' }), true, 'escolheu mostrar: mostra');

// ---------------------------------------------------------------------------
// 2. AS ABAS E A PRIMEIRA.
// ---------------------------------------------------------------------------
assert.deepEqual(abasDoPerfil(true), ['sovereign', 'summary', 'mastery', 'widgets']);
assert.deepEqual(abasDoPerfil(false), ['summary', 'mastery', 'widgets'], 'sem soberano, sem a aba');
assert.equal(abaInicialDoPerfil(true), 'sovereign');
assert.equal(abaInicialDoPerfil(false), 'summary');

// ---------------------------------------------------------------------------
// 3. O PERFIL USA ISSO, E O SOBERANO SAIU DO CANTO.
// ---------------------------------------------------------------------------
assert.match(perfil, /abasDoPerfil\(/, 'as abas saem de abasDoPerfil');
assert.match(perfil, /abaInicialDoPerfil\(/, 'a primeira aba sai de abaInicialDoPerfil');
assert.ok(!perfil.includes('className="absolute top-[60px] right-4 w-[70px]"'), 'o soberano solto no canto do perfil saiu');
assert.match(perfil, /activeWidgetTab === 'sovereign'/, 'existe a aba do soberano');

// ---------------------------------------------------------------------------
// 4. O MIOLO ROLA EM VEZ DE CORTAR.
// ---------------------------------------------------------------------------
assert.match(perfil, /data-perfil-abas-conteudo[^>]*overflow-y-auto|overflow-y-auto[^>]*data-perfil-abas-conteudo/, 'o conteudo das abas rola');

// ---------------------------------------------------------------------------
// 5. O RESUMO NAO REPETE A MAESTRIA.
// ---------------------------------------------------------------------------
const resumo = perfil.slice(perfil.indexOf("activeWidgetTab === 'summary' && ("), perfil.indexOf("activeWidgetTab === 'mastery' && ("));
assert.ok(resumo.length > 0, 'achei o bloco do Resumo');
assert.ok(!/>\s*Maestria\s*</.test(resumo), 'o Resumo nao tem mais a casinha Maestria');

console.log('perfil-abas: ok');
