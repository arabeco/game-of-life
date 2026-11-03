/** Shared by app and server. Flip this switch to restore the legacy engine. */
export const ORACLE_ENGINE_V2 = true;
export type Voice = 'neutro' | 'coach' | 'reflexivo' | 'calmo';
export type Channel = 'opening' | 'reaction';
export interface Candidate {
  id: string;
  subject: string;
  score: number;
  text: string;
  important?: boolean;
  discovery?: { topic: DiscoveryTopic; label: string };
}
export type DiscoveryTopic = 'mastery' | 'journal' | 'relationships' | 'campaigns' | 'arsenal' | 'garden' | 'wisdom' | 'mission';
export interface Spoken { id: string; subject: string; at: number; day: string; channel: Channel; clickedAt?: number; important?: boolean }
const DAY = 86_400_000;
export function discoveryBlock(topic: DiscoveryTopic, history: Spoken[], now: number, day: string): string | null {
  const tips = history.filter(h => h.subject.startsWith('discovery:'));
  const own = tips.filter(h => h.subject === `discovery:${topic}`);
  if (history.some(h => h.day === day && h.important)) return 'important_today';
  if (history.some(h => h.channel === 'reaction' && now - h.at < 60_000)) return 'reaction_interval';
  if (own.filter(h => !h.clickedAt).length >= 3) return 'discovery_ignored';
  if (own.some(h => h.clickedAt && now - h.clickedAt < 30 * DAY)) return 'discovery_clicked';
  if (own.some(h => now - h.at < 14 * DAY)) return 'discovery_topic_interval';
  if (tips.some(h => now - h.at < 3 * DAY)) return 'discovery_interval';
  return null;
}
export interface Selection { chosen: Candidate | null; rows: Array<{ id: string; score: number; reason: string }> }

/** Eligibility precedes ranking. No debt, streak or assumed daily demand. */
export function selectSpeech(candidates: Candidate[], channel: Channel, presence: number, history: Spoken[], now: number, day: string): Selection {
  const threshold = channel === 'opening' ? (presence >= 2 ? 20 : Infinity)
    : presence >= 3 ? 40 : presence >= 2 ? 70 : presence >= 1 ? 100 : Infinity;
  const last = history.filter(h => h.channel === channel).sort((a, b) => b.at - a.at)[0];
  const daily = history.filter(h => h.channel === channel && h.day === day);
  const rows: Selection['rows'] = [];
  let chosen: Candidate | null = null;
  for (const candidate of [...candidates].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))) {
    const duplicate = history.some(h => h.id === candidate.id && (channel === 'reaction' || h.day === day));
    const interval = channel === 'opening' ? 30 * 60_000 : candidate.important ? 12_000 : presence >= 3 ? 60_000 : 5 * 60_000;
    const crowded = channel === 'reaction' && !candidate.important && daily.length >= (presence >= 3 ? 8 : 3);
    const reason = candidate.score < threshold ? 'presence' : duplicate ? 'already_spoken'
      : channel === 'opening' && presence === 2 && daily.length > 0 ? 'daily_limit'
      : last && now - last.at < interval ? 'interval' : crowded ? 'daily_limit'
      : candidate.discovery && (channel !== 'opening' || discoveryBlock(candidate.discovery.topic, history, now, day))
        ? (channel !== 'opening' ? 'opening_only' : discoveryBlock(candidate.discovery.topic, history, now, day)!)
      : chosen ? 'lower_priority' : 'selected';
    rows.push({ id: candidate.id, score: candidate.score, reason });
    if (reason === 'selected') chosen = candidate;
  }
  return { chosen, rows };
}

const voice = (tone: Voice, lines: Record<Voice, string>) => lines[tone] || lines.neutro;
const actions = (n: number) => `${n} ${n === 1 ? 'ação' : 'ações'}`;
const left = (n: number) => n === 1 ? 'Falta 1 para completar a meta.' : `Faltam ${n} para completar a meta.`;
export interface OpeningFacts {
  completed: number;
  queued: number;
  stock: number;
  returned: boolean;
  /** A leitura da manhã mede ações previstas, prazo e as arenas que ficaram para trás — sem mandar a pessoa executar nada. */
  cycle?: {
    percent: number;
    daysLeft: number;
    pace: 'adiantado' | 'no_ritmo' | 'atrasado' | 'critico';
    focusArenas: string[];
    /** Dia do ciclo (1 = hoje comecou) e o total: no comeco a porcentagem nao diz nada. */
    day?: number;
    totalDays?: number;
  };
}

/** Ate o 3o dia o ciclo esta comecando: fala de ritmo, nao de placar (03/11/2026). */
export const DIAS_DE_COMECO = 3;
export function openingCandidates(f: OpeningFacts, tone: Voice, day: string): Candidate[] {
  const candidates: Candidate[] = [];
  const add = (subject: string, score: number, lines: Record<Voice, string>) => candidates.push({ subject, score, id: subject === 'return' ? `opening:${day}:return` : `opening:${day}:${subject}:${f.completed}:${f.queued}:${f.stock}`, text: voice(tone, lines) });
  if (f.returned) add('return', 70, {
    neutro: 'Bom te ver de volta. Seu planner e suas arenas estão aqui.',
    coach: 'Bom te ver de volta. O planner e as arenas estão do jeito que você deixou.',
    reflexivo: 'Bom te ver de volta. O que faz sentido retomar agora?',
    calmo: 'Bom te ver de volta. Você pode continuar do seu jeito.',
  });
  if (f.completed > 0) add('done', 55, {
    neutro: `${actions(f.completed)} ${f.completed === 1 ? 'concluída' : 'concluídas'} hoje.${f.queued > 0 ? ` Há ${actions(f.queued)} na sua lista para hoje.` : ' Nenhuma outra ação na lista de hoje.'}`,
    coach: `${actions(f.completed)} já ${f.completed === 1 ? 'saiu' : 'saíram'} do papel hoje.${f.queued > 0 ? ' Seu planner mostra o que você separou para depois.' : ' O próximo passo fica à sua escolha.'}`,
    reflexivo: `${actions(f.completed)} ${f.completed === 1 ? 'feita' : 'feitas'} hoje. O que esse avanço mudou no seu dia?`,
    calmo: `Você já fez ${actions(f.completed)} hoje. Esse avanço está registrado.`,
  });
  if (f.completed === 0 && f.queued > 0) add('planned', 45, {
    neutro: `Seu planner tem ${actions(f.queued)} para hoje.`,
    coach: `Você separou ${actions(f.queued)} para hoje. O primeiro passo já está no planner.`,
    reflexivo: `Há ${actions(f.queued)} no planner. Por qual faz sentido começar?`,
    calmo: `${actions(f.queued)} no planner de hoje. Uma de cada vez, no seu ritmo.`,
  });
  if (f.stock > 0) add('stock', f.stock >= 5 && !f.queued && !f.completed ? 35 : 25, {
    neutro: 'Seu estoque tem ações disponíveis. Você pode concluir direto, sem agendar.',
    coach: 'Tem opções no estoque, e dá para concluir direto por lá, sem agendar.',
    reflexivo: 'Entre as opções do estoque, qual combina com o seu momento?',
    calmo: 'Seu estoque guarda possibilidades. Não é uma lista de dívidas para hoje.',
  });
  if (f.cycle) {
    const dias = f.cycle.daysLeft === 1 ? '1 dia' : `${f.cycle.daysLeft} dias`;
    const arenas = f.cycle.focusArenas.join(' e ');
    const leituraDasArenas = !arenas
      ? ''
      : f.cycle.focusArenas.length === 1
        ? ` ${arenas} é a parte do ciclo que ficou mais para trás.`
        : ` ${arenas} são as duas partes que mais ficaram para trás.`;
    const estado = f.cycle.pace;
    const diaDoCiclo = f.cycle.day && f.cycle.totalDays ? `Dia ${f.cycle.day} de ${f.cycle.totalDays}` : '';
    const hoje = f.queued > 0 ? ` Hoje tem ${actions(f.queued)} no planner.` : '';
    const comecando = Boolean(diaDoCiclo && f.cycle.day! <= DIAS_DE_COMECO);
    const comeco: Record<Voice, string> = {
      neutro: `${diaDoCiclo} do ciclo. O começo é para pegar ritmo.${hoje}`,
      coach: `${diaDoCiclo}. Os primeiros dias são para firmar o ritmo.${hoje}`,
      reflexivo: `${diaDoCiclo}, começo de ciclo. Que ritmo você quer firmar nesses primeiros dias?`,
      calmo: `${diaDoCiclo}, começo de ciclo. Sem pressa: o ritmo vem com os dias.${hoje}`,
    };
    const prefixo = diaDoCiclo ? `${diaDoCiclo}: ` : '';
    const lines: Record<Voice, string> = comecando ? comeco : estado === 'adiantado' ? {
      neutro: `${prefixo}você está indo bem, com ${f.cycle.percent}% do planejado e ${dias} pela frente.${leituraDasArenas}`,
      coach: `${prefixo}ciclo bem encaminhado, ${f.cycle.percent}% do planejado e ${dias} pela frente.${leituraDasArenas}`,
      reflexivo: `${prefixo}${f.cycle.percent}% do planejado e ${dias} pela frente. O que você quer ver ganhar espaço até o fim?${leituraDasArenas}`,
      calmo: `${prefixo}seu ciclo está indo bem, ${f.cycle.percent}% do planejado e ${dias} ainda abertos.${leituraDasArenas}`,
    } : estado === 'no_ritmo' ? {
      neutro: `${prefixo}seu ciclo está no ritmo, com ${f.cycle.percent}% do planejado e ${dias} restantes.${leituraDasArenas}`,
      coach: `${prefixo}o ciclo segue de pé, ${f.cycle.percent}% do planejado e ${dias} restantes.${leituraDasArenas}`,
      reflexivo: `${prefixo}${f.cycle.percent}% do planejado, ${dias} restantes. O que merece lugar no tempo que falta?${leituraDasArenas}`,
      calmo: `${prefixo}${f.cycle.percent}% do planejado e ${dias} restantes. O ciclo segue no seu tempo.${leituraDasArenas}`,
    } : {
      neutro: `${prefixo}seu ciclo está em ${f.cycle.percent}% do planejado, com ${dias} restantes.${leituraDasArenas}`,
      coach: `${prefixo}ainda há ${dias} neste ciclo, e ele está em ${f.cycle.percent}% do planejado.${leituraDasArenas}`,
      reflexivo: `${prefixo}faltam ${dias}, e o ciclo está em ${f.cycle.percent}% do planejado. O que dessas frentes ainda importa para você?${leituraDasArenas}`,
      calmo: `${prefixo}ainda há ${dias} neste ciclo, e ${f.cycle.percent}% do planejado já está registrado.${leituraDasArenas}`,
    };
    // Leitura do ciclo ganha de uma saudação genérica, mas nunca de voltar ao
    // app depois de dias: retorno é um acontecimento mais humano que placar.
    if (!f.returned) add(comecando ? 'cycle_comeco' : `cycle_${estado}`, estado === 'critico' && !comecando ? 68 : 62, lines);
  }
  if (!f.completed && !f.queued && !f.stock) add('open', 20, {
    neutro: 'Hoje ainda não há registros nem ações na lista do planner.',
    coach: 'Seu dia está aberto. Você pode começar por uma ação das suas arenas.',
    reflexivo: 'O que você gostaria de colocar em movimento hoje?',
    calmo: 'Seu dia está aberto. Você escolhe como começar.',
  });
  return candidates;
}

export interface ProgressFact { id: string; name: string; completed: number; target: number; percent?: number }
export interface ReactionFacts {
  eventId: string; action: ProgressFact; previousCount: number; returned: boolean;
  arena?: ProgressFact; mission?: ProgressFact & { previous: number };
}
/**
 * REACAO SO NO QUE IMPORTA (03/11/2026, com o Afonso).
 *
 * Antes cada conclusao virava "«Meditação Zen»: 2/27. Faltam 25" — um contador,
 * nao alguem falando, e um balao no meio de quem esta emendando acoes. Agora a
 * acao fala em tres momentos: meta cumprida, falta 1 e quando passa da metade.
 * A arena so fala ao cumprir a meta. Fora disso, silencio.
 */
export function reactionCandidates(f: ReactionFacts, tone: Voice): Candidate[] {
  const result: Candidate[] = [];
  // `aoCumprir` fecha a frase quando a meta chega no alvo: a missao individual nao
  // se recebe sozinha (09/10/2026), entao a fala diz onde receber.
  const addProgress = (p: ProgressFact, previous: number, subject: string, prefix: string, aoCumprir = '') => {
    if (p.target <= 0 || p.completed <= previous || previous >= p.target) return;
    const remaining = Math.max(0, p.target - p.completed);
    const metade = p.target >= 4 && previous < p.target / 2 && p.completed >= p.target / 2;
    if (remaining > 1 && !metade) return;
    const count = `${p.completed}/${p.target}`;
    const score = remaining === 0 ? 100 : remaining === 1 ? 80 : 65;
    const nome = `${prefix}«${p.name}»`;
    const lines: Record<Voice, string> = remaining === 0 ? {
      neutro: `${nome}: ${count}. Meta cumprida.`,
      coach: `${nome}: ${count}. Essa meta está cumprida.`,
      reflexivo: `${nome}: ${count}. O que fez diferença nessa conquista?`,
      calmo: `${nome}: ${count}. O que você fez agora é uma conquista completa.`,
    } : remaining === 1 ? {
      neutro: `${nome}: ${count}. Falta 1 para a meta.`,
      coach: `${nome}: ${count}. Mais uma e essa meta está cumprida.`,
      reflexivo: `${nome}: ${count}. Falta 1. O que te trouxe até aqui?`,
      calmo: `${nome}: ${count}. Falta só 1, no seu tempo.`,
    } : {
      neutro: `${nome} passou da metade: ${count}.`,
      coach: `${nome}: metade da meta batida, ${count}. A segunda metade é com o mesmo ritmo.`,
      reflexivo: `${nome} chegou à metade, ${count}. O que está sustentando esse ritmo?`,
      calmo: `${nome} já está na metade, ${count}. Um passo de cada vez.`,
    };
    result.push({ id: `${subject}:${p.id}:${p.completed}`, subject, score, important: remaining === 0,
      text: voice(tone, lines) + (remaining === 0 ? aoCumprir : ''),
    });
  };
  addProgress(f.action, f.previousCount, 'action', '');
  if (f.mission) addProgress(f.mission, f.mission.previous, 'mission', 'Missão ', ' Ela está esperando na aba Missão do Oráculo.');
  if (f.returned) result.push({ id: `return:${f.eventId}`, subject: 'return', score: 70, text: voice(tone, {
    neutro: `«${f.action.name}» voltou a ter uma conclusão registrada.`,
    coach: `«${f.action.name}» voltou a andar. Esse foi o primeiro passo da retomada.`,
    reflexivo: `Você retomou «${f.action.name}». O que ajudou hoje?`,
    calmo: `Você voltou a «${f.action.name}». Esse passo já conta.`,
  }) });
  if (f.arena && f.arena.target > 0 && f.arena.completed >= f.arena.target) {
    const contagem = `${f.arena.completed}/${f.arena.target}`;
    result.push({ id: `arena:${f.arena.id}:${f.arena.completed}`, subject: 'arena', score: 90, important: true, text: voice(tone, {
      neutro: `Arena «${f.arena.name}»: ${contagem}. Meta da arena cumprida.`,
      coach: `Arena «${f.arena.name}» fechada: ${contagem}. Meta inteira batida.`,
      reflexivo: `Arena «${f.arena.name}» completa, ${contagem}. O que essa arena te deu neste ciclo?`,
      calmo: `Arena «${f.arena.name}» completa, ${contagem}. Tudo o que você planejou nela está feito.`,
    }) });
  }
  return result;
}

export interface ReadingFacts {
  cycle: null | { percent: number | null; daysLeft: number; ended: boolean; startsToday?: boolean };
  arenas: ProgressFact[];
  completed: number;
}
/** Reading describes the actual scope; it never compares with a linear daily pace. */
export function readProgress(f: ReadingFacts): string {
  const header = f.cycle
    ? `${f.cycle.percent === null ? 'Seu ciclo está aberto, sem metas de repetição.' : `Seu ciclo está em ${Math.round(f.cycle.percent)}%.`} ${f.cycle.ended ? 'O prazo terminou.' : f.cycle.daysLeft === 0 ? 'O prazo termina hoje.' : `Faltam ${f.cycle.daysLeft} ${f.cycle.daysLeft === 1 ? 'dia' : 'dias'}.`}`
    : 'Nesta rodada, suas arenas continuam valendo, mesmo sem ciclo.';
  const arena = readingArena(f);
  if (!arena) return `${header} ${f.completed > 0 ? `${actions(f.completed)} concluídas nesse período.` : 'Ainda não há progresso de metas para mostrar.'}`;
  const remaining = Math.max(0, arena.target - arena.completed);
  return `${header} Em «${arena.name}»: ${arena.completed}/${arena.target}. ${remaining ? left(remaining) : 'Meta cumprida.'}`;
}

export function readingArena(f: ReadingFacts): ProgressFact | undefined {
  return [...f.arenas].filter(a => a.target > 0).sort((a, b) => {
    const score = (p: ProgressFact) => p.completed >= p.target ? 60 : p.completed > 0 ? 80 + p.completed / p.target : 20;
    return score(b) - score(a) || a.id.localeCompare(b.id);
  })[0];
}
