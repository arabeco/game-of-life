import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * O PLANNER NAO ANDA DE LADO (15/10/2026, prints do Afonso).
 *
 * Nos dois prints a grade inteira (horarios e blocos) estava deslocada ~17 px
 * de um para o outro, e a barra do estoque nao: quem andava era so a area de
 * rolagem do planner. O conteudo dela passava um pouco da largura (a linha de
 * "agora", por exemplo, e 100% + a bolinha), e `overflow-x: hidden` ainda deixa
 * o navegador rolar de lado por codigo — ao abrir, ao pegar um cartao, ao focar.
 *
 * A correcao: o conteudo e cortado na largura (overflow-x: clip, que nao deixa
 * rolar), e se algo ainda rolar de lado, a area volta para o lugar.
 */
const tela = readFileSync(new URL('../views/PlannerView.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const scroller = tela.slice(tela.indexOf('ref={scrollContainerRef}'), tela.indexOf('ref={scrollContainerRef}') + 900);
assert.match(scroller, /overflow-x-clip/, 'o conteudo da area de rolagem ainda pode passar da largura');
assert.match(tela, /scrollLeft !== 0[\s\S]{0,80}scrollLeft = 0/, 'se algo rolar de lado, a area nao volta para o lugar');
console.log('Planner: o conteudo nao passa da largura, e a area nunca fica rolada de lado.');
