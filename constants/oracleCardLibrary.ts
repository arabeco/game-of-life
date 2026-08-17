import type { OracleCategory } from '../types';

/**
 * Written stock for the five manual card categories.
 *
 * These cards are pure content — they say nothing about the player's own numbers, so
 * there is nothing for a model to compute. Generating them per delivery meant paying
 * per request, shipping text nobody had read, and losing the feature entirely whenever
 * the provider was unreachable. A written bank costs nothing, works offline, and can be
 * reviewed before it reaches anyone.
 *
 * SIZING: a Premium player can pull one card per category per day, so a bank of N per
 * category takes N days to cycle. Target is ~180 each (about six months) — the entries
 * below are the seed, kept deliberately small so the shape can be reviewed before the
 * volume is written. Nothing breaks at any size: the picker degrades to reuse.
 *
 * STYLE: second person, no greeting, no sign-off, one idea per card, two to four lines.
 * Nothing that reads as a diagnosis of the player — these are read on demand, not
 * triggered by a state. Contextual reactions live in supabase/functions/_shared/
 * oracle-lines.ts instead.
 */
export const ORACLE_CARD_LIBRARY: Partial<Record<OracleCategory, string[]>> = {
  frases_inspiradoras: [
    'O que voce repete vira quem voce e. Nao e a intensidade de um dia que constroi, e a chatice de aparecer no dia seguinte.',
    'Comecar de novo nao apaga o que ja foi feito. O progresso antigo continua seu, mesmo depois de uma pausa longa.',
    'A acao pequena que voce faz hoje vale mais que a grande que voce planeja pra segunda.',
    'Voce nao precisa de motivacao pra comecar. Precisa de uma tarefa pequena o suficiente pra nao dar medo.',
  ],
  reflexoes_filosoficas: [
    'Disciplina costuma ser confundida com dureza. Na pratica, e a arte de tornar facil aquilo que importa.',
    'Todo sistema que exige seu heroismo diario ja falhou no desenho. O bom sistema funciona no seu pior dia.',
    'Voce nao tem falta de tempo. Tem excesso de coisas que aceitou sem escolher.',
    'O oposto de procrastinar nao e produzir. E decidir — inclusive decidir nao fazer.',
  ],
  fragmentos_sabedoria: [
    'Quem mede, ajusta. Quem so tenta lembrar, repete o mesmo erro com outra roupa.',
    'Escopo grande demais nao e ambicao, e adiamento com aparencia de esforco.',
    'Fechar o dia importa mais que encher o dia. O que nao e registrado nao vira aprendizado.',
    'Metade do que voce planejou pra semana era vontade, nao compromisso. Separar os dois ja e metade do trabalho.',
  ],
  rituais_lifestyle: [
    'Deixa o material da proxima acao separado antes de dormir. O atrito de comecar cai pela metade.',
    'Uma acao ancorada em outra que ja existe pega no automatico. Depois do cafe, antes do banho, ao sentar.',
    'Escolhe um horario ruim de proposito pra tarefa dificil. Se ela sobrevive ao horario ruim, sobrevive a semana.',
    'Termina o dia decidindo a primeira acao do dia seguinte. Voce acorda sem precisar negociar consigo mesmo.',
  ],
  sussurros_maestria: [
    'Maestria e reduzir o numero de decisoes por dia, nao aumentar o numero de tarefas.',
    'Quando algo fica facil, e sinal pra aumentar a precisao — nao necessariamente o volume.',
    'O amador busca o dia perfeito. Quem avanca busca o dia repetivel.',
    'Voce so domina o que consegue fazer cansado. O resto ainda depende de condicoes.',
  ],
};

const normalize = (value: string) => value.trim().toLowerCase();

/**
 * Picks a card the player has not seen, falling back to the least recently delivered
 * once the whole category has been used. Returns null only for a category with no
 * stock, which lets the caller say so instead of delivering an empty card.
 */
export const pickOracleCard = ({
  category,
  deliveredContents = [],
}: {
  category: OracleCategory;
  /** Previously delivered card text for this player, newest first. */
  deliveredContents?: string[];
}): string | null => {
  const stock = ORACLE_CARD_LIBRARY[category];
  if (!stock || stock.length === 0) return null;

  const seen = new Set(deliveredContents.map(normalize));
  const unseen = stock.filter((card) => !seen.has(normalize(card)));

  if (unseen.length > 0) {
    return unseen[Math.floor(Math.random() * unseen.length)];
  }

  // Everything has been seen: reuse whatever has been out of rotation longest.
  const recency = new Map(deliveredContents.map((content, index) => [normalize(content), index]));
  return [...stock].sort(
    (left, right) => (recency.get(normalize(right)) ?? Infinity) - (recency.get(normalize(left)) ?? Infinity),
  )[0];
};

export const getOracleCardStockSize = (category: OracleCategory): number =>
  ORACLE_CARD_LIBRARY[category]?.length ?? 0;
