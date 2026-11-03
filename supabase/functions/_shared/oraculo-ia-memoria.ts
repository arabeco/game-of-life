/**
 * A MEMORIA DO ORACULO COM IA (03/11/2026, com o Afonso).
 *
 * As ultimas trocas somem depois de 3 mensagens ou 7 dias. O que a pessoa
 * contou de si (preferencias, limites, decisoes, como esta) fica numa memoria
 * curta, reescrita pela propria IA na mesma chamada: a resposta termina numa
 * linha "MEMÓRIA: ..." que sai antes de mostrar. "=" mantem a anterior.
 */
export const LIMITE_DA_MEMORIA = 500;

const LINHA = /(?:^|\n)[ \t]*mem[oó]ria[ \t]*:[ \t]*(.*)$/i;

/** "Você mesmo/mesma" escapava apesar da regra: sem genero, sai so "você" (03/11/2026). */
const semGenero = (texto: string) => texto.replace(/(você|voce) (mesmo|mesma)(?![a-zà-ú])/gi, '$1');

/**
 * A ESTIMATIVA ESCONDIDA (03/11/2026, com o Afonso). Em pergunta de maestria a
 * IA abre com "ESTIMATIVA: ..." (o degrau que a rotina de cada area parece ter)
 * e responde a partir dela. A linha sai antes de mostrar.
 */
const ESTIMATIVA = /^\s*estimativa\s*:[ \t]*([^\n]*)\n?/i;

export const separarMemoria = (texto: string, memoriaAtual: string) => {
  const comEstimativa = texto.match(ESTIMATIVA);
  const estimativa = comEstimativa ? comEstimativa[1].trim() : '';
  // Sem o trim, uma quebra de linha no fim deixava a linha MEMORIA aparecer.
  const corpo = (comEstimativa ? texto.slice(comEstimativa[0].length) : texto).trim();
  const achou = corpo.match(LINHA);
  if (!achou || achou.index === undefined) return { resposta: semGenero(corpo.trim()), memoria: memoriaAtual, estimativa };
  const resposta = semGenero(corpo.slice(0, achou.index).trim());
  const nova = achou[1].trim();
  const memoria = !nova || nova === "=" ? memoriaAtual : nova.slice(0, LIMITE_DA_MEMORIA);
  return { resposta, memoria, estimativa };
};

/**
 * A PERGUNTA DE TODAS AS AREAS (03/11/2026, com o Afonso). "Cada área" virava
 * resposta sobre uma area so: a regra no meio do prompt nao bastava. Quando a
 * pergunta pede todas, o lembrete vai colado nela.
 */
const TODAS_AS_AREAS = /\b(cada|todas(?: as)?(?: minhas)?|outras)\s+[aá]reas?\b/i;

export const lembreteDaPergunta = (pergunta: string) =>
  TODAS_AS_AREAS.test(pergunta)
    ? 'A pergunta pede as cinco áreas: fale de todas, uma frase curta por área (o que falta em cada uma), ou de uma coisa que ajude todas. Não responda sobre uma área só.'
    : '';
