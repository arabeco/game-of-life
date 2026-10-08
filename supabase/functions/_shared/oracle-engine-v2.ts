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
}
export interface Spoken { id: string; subject: string; at: number; day: string; channel: Channel }
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
      : last && now - last.at < interval ? 'interval' : crowded ? 'daily_limit' : chosen ? 'lower_priority' : 'selected';
    rows.push({ id: candidate.id, score: candidate.score, reason });
    if (reason === 'selected') chosen = candidate;
  }
  return { chosen, rows };
}

const voice = (tone: Voice, lines: Record<Voice, string>) => lines[tone] || lines.neutro;
const actions = (n: number) => `${n} ${n === 1 ? 'ação' : 'ações'}`;
const left = (n: number) => n === 1 ? 'Falta 1 para completar a meta.' : `Faltam ${n} para completar a meta.`;
export interface OpeningFacts { completed: number; queued: number; stock: number; returned: boolean }
export function openingCandidates(f: OpeningFacts, tone: Voice, day: string): Candidate[] {
  const candidates: Candidate[] = [];
  const add = (subject: string, score: number, lines: Record<Voice, string>) => candidates.push({ subject, score, id: subject === 'return' ? `opening:${day}:return` : `opening:${day}:${subject}:${f.completed}:${f.queued}:${f.stock}`, text: voice(tone, lines) });
  if (f.returned) add('return', 70, {
    neutro: 'Bom te ver de volta. Seu planner e suas arenas estão aqui.',
    coach: 'Bom te ver de volta. Abra o planner e escolha por onde quer continuar.',
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
    coach: `Você separou ${actions(f.queued)} para hoje. Abra o planner para escolher o primeiro passo.`,
    reflexivo: `Há ${actions(f.queued)} no planner. Por qual faz sentido começar?`,
    calmo: `${actions(f.queued)} no planner de hoje. Uma de cada vez, no seu ritmo.`,
  });
  if (f.stock > 0) add('stock', f.stock >= 5 && !f.queued && !f.completed ? 35 : 25, {
    neutro: 'Seu estoque tem ações disponíveis. Você pode concluir direto, sem agendar.',
    coach: 'Tem opções no estoque. Escolha uma e conclua por ali mesmo, sem precisar agendar.',
    reflexivo: 'Entre as opções do estoque, qual combina com o seu momento?',
    calmo: 'Seu estoque guarda possibilidades. Não é uma lista de dívidas para hoje.',
  });
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
export function reactionCandidates(f: ReactionFacts, tone: Voice): Candidate[] {
  const result: Candidate[] = [];
  const addProgress = (p: ProgressFact, previous: number, subject: string, prefix: string) => {
    if (p.target <= 0 || p.completed <= previous || previous >= p.target) return;
    const remaining = Math.max(0, p.target - p.completed);
    const count = `${p.completed}/${p.target}`;
    const score = remaining === 0 ? 100 : remaining === 1 ? 80 : 60;
    const summary = `${prefix}«${p.name}»: ${count}.`;
    result.push({ id: `${subject}:${p.id}:${p.completed}`, subject, score, important: remaining === 0,
      text: voice(tone, {
        neutro: `${summary} ${remaining === 0 ? 'Meta cumprida.' : left(remaining)}`,
        coach: `${summary} ${remaining === 0 ? 'Essa meta está cumprida.' : remaining === 1 ? 'Mais uma e essa meta está cumprida.' : left(remaining)}`,
        reflexivo: `${summary} ${remaining === 0 ? 'O que fez diferença nessa conquista?' : left(remaining)}`,
        calmo: `${summary} ${remaining === 0 ? 'O que você fez agora é uma conquista completa.' : `Mais um avanço registrado. ${left(remaining)}`}`,
      }),
    });
  };
  addProgress(f.action, f.previousCount, 'action', '');
  if (f.mission) addProgress(f.mission, f.mission.previous, 'mission', 'Missão ');
  if (f.returned) result.push({ id: `return:${f.eventId}`, subject: 'return', score: 70, text: voice(tone, {
    neutro: `«${f.action.name}» voltou a ter uma conclusão registrada.`,
    coach: `«${f.action.name}» voltou a andar. Esse foi o primeiro passo da retomada.`,
    reflexivo: `Você retomou «${f.action.name}». O que ajudou hoje?`,
    calmo: `Você voltou a «${f.action.name}». Esse passo já conta.`,
  }) });
  if (f.arena && f.arena.target > 0) result.push({ id: `arena:${f.arena.id}:${f.arena.completed}`, subject: 'arena', score: 50,
    text: `«${f.arena.name}»: ${f.arena.completed}/${f.arena.target}. ${f.arena.completed >= f.arena.target ? 'Meta cumprida.' : left(f.arena.target - f.arena.completed)}` });
  return result;
}

export interface ReadingFacts {
  cycle: null | { percent: number | null; daysLeft: number; ended: boolean };
  arenas: ProgressFact[];
  completed: number;
}
/** Reading describes the actual scope; it never compares with a linear daily pace. */
export function readProgress(f: ReadingFacts): string {
  const header = f.cycle
    ? `${f.cycle.percent === null ? 'Seu ciclo está aberto, sem metas de repetição.' : `Seu ciclo está em ${Math.round(f.cycle.percent)}%.`} ${f.cycle.ended ? 'O prazo terminou.' : f.cycle.daysLeft === 0 ? 'O prazo termina hoje.' : `Faltam ${f.cycle.daysLeft} ${f.cycle.daysLeft === 1 ? 'dia' : 'dias'}.`}`
    : 'Nesta rodada, suas arenas continuam valendo, mesmo sem ciclo.';
  const arena = [...f.arenas].filter(a => a.target > 0).sort((a, b) => {
    const score = (p: ProgressFact) => p.completed >= p.target ? 60 : p.completed > 0 ? 80 + p.completed / p.target : 20;
    return score(b) - score(a) || a.id.localeCompare(b.id);
  })[0];
  if (!arena) return `${header} ${f.completed > 0 ? `${actions(f.completed)} concluídas nesse período.` : 'Ainda não há progresso de metas para mostrar.'}`;
  const remaining = Math.max(0, arena.target - arena.completed);
  return `${header} Em «${arena.name}»: ${arena.completed}/${arena.target}. ${remaining ? left(remaining) : 'Meta cumprida.'}`;
}
