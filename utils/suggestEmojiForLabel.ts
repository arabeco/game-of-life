export type EmojiSuggestionKind = 'codex' | 'arena' | 'action';

type EmojiSuggestionOptions = {
  assetId?: string;
  actionType?: string;
  fallback?: string;
};

type EmojiRule = {
  emoji: string;
  keywords: string[];
  kinds?: EmojiSuggestionKind[];
  boost?: number;
};

const ASSET_EMOJI_FALLBACKS: Record<string, string> = {
  saude: '🧘',
  financas: '💰',
  trabalho: '💼',
  hobbies: '🎨',
  fisico: '💪',
  geral: '🏛️',
  intelectual: '🧠',
  social: '🤝',
  emocional: '❤️',
  espiritual: '🙏',
  carreira: '🚀',
  lazer: '🎮',
  familia: '👨‍👩‍👧‍👦',
  estudos: '📚',
  relacionamento: '💞',
  criatividade: '🎭',
  aventura: '🧭',
  natureza: '🌿',
  tecnologia: '💻',
  viagem: '✈️',
  culinaria: '🍳',
  musica: '🎵',
  esportes: '⚽',
  leitura: '📖',
  autoconhecimento: '🪞',
};

const EMOJI_RULES: EmojiRule[] = [
  { emoji: '🧠', keywords: ['deep work', 'trabalho profundo', 'foco profundo', 'cognitiv', 'mente', 'mental'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '☀️', keywords: ['luz', 'sol', 'manha', 'amanhe', 'sunrise', 'morning'], kinds: ['arena', 'action'], boost: 4 },
  { emoji: '🌙', keywords: ['sono', 'noturno', 'noite', 'melatonina', 'descanso', 'sleep', 'night'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '💧', keywords: ['agua', 'hidrat', 'hidrata', 'water'], kinds: ['arena', 'action'], boost: 5 },
  { emoji: '🍽️', keywords: ['jejum', 'aliment', 'nutri', 'comida', 'refeicao', 'meal', 'food'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '❄️', keywords: ['frio', 'gelo', 'ice', 'cold', 'banho frio', 'wim hof'], kinds: ['arena', 'action'], boost: 6 },
  { emoji: '🫁', keywords: ['respira', 'pulmao', 'folego', 'breath', 'breathing', 'wim hof'], kinds: ['arena', 'action'], boost: 5 },
  { emoji: '🌿', keywords: ['grounding', 'natureza', 'terra', 'grama', 'verde', 'horta', 'natural'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '🔥', keywords: ['forja', 'fogo', 'chama', 'ignite', 'intensidade', 'hiit', 'ritual'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '💪', keywords: ['corpo', 'fisico', 'forca', 'treino', 'musculo', 'fitness', 'exercise', 'workout'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '🏃', keywords: ['corrida', 'correr', 'run', 'movimento', 'moviment'], kinds: ['arena', 'action'], boost: 3 },
  { emoji: '🧘', keywords: ['medit', 'mindful', 'presenca', 'calma', 'silencio', 'centramento'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '🙏', keywords: ['espirit', 'oracao', 'gratidao', 'gratid', 'rezar', 'sagrado'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '📚', keywords: ['leitura', 'livro', 'estudo', 'estudar', 'learning', 'aprender', 'tecnica'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '📝', keywords: ['escrita', 'escrever', 'inventario', 'registro', 'anotar', 'diario', 'journal', 'nota'], kinds: ['arena', 'action'], boost: 5 },
  { emoji: '📔', keywords: ['diario', 'journal', 'gratid', 'reflexao', 'reflex', 'caderno'], kinds: ['action'], boost: 5 },
  { emoji: '🎯', keywords: ['foco', 'meta', 'objetivo', 'alvo', 'clareza', 'decisao'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '👁️', keywords: ['presenca', 'visao', 'observ', 'consciencia', 'awareness', 'claridade'], kinds: ['codex', 'arena', 'action'], boost: 5 },
  { emoji: '👑', keywords: ['soberano', 'reino', 'lider', 'lideranca', 'comando', 'trono'], kinds: ['codex', 'arena', 'action'], boost: 5 },
  { emoji: '⚔️', keywords: ['desafio', 'batalha', 'combate', 'competi', 'war', 'arena', 'duelo'], kinds: ['arena', 'action'], boost: 4 },
  { emoji: '🛡️', keywords: ['defesa', 'escudo', 'prote', 'seguranca', 'resilien'], kinds: ['arena', 'action'], boost: 4 },
  { emoji: '🤝', keywords: ['parceria', 'mentor', 'mentoria', 'vinculo', 'equipe', 'social', 'conexao'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '❤️', keywords: ['amor', 'afet', 'emocional', 'relacion', 'coracao'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '💼', keywords: ['trabalho', 'carreira', 'profissional', 'empresa', 'negocio', 'business'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '💻', keywords: ['codigo', 'code', 'program', 'tech', 'tecnologia', 'sistema', 'hacker'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '📈', keywords: ['crescimento', 'metric', 'performance', 'resultado', 'evolu', 'progresso'], kinds: ['codex', 'arena', 'action'], boost: 3 },
  { emoji: '💰', keywords: ['dinheiro', 'finance', 'grana', 'riqueza', 'lucro', 'caixa', 'invest'], kinds: ['codex', 'arena', 'action'], boost: 5 },
  { emoji: '🧭', keywords: ['proposito', 'direcao', 'norte', 'missao', 'jornada', 'travessia'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '🚀', keywords: ['lancar', 'lancamento', 'escala', 'crescer', 'rocket', 'startup'], kinds: ['codex', 'arena', 'action'], boost: 3 },
  { emoji: '🎨', keywords: ['arte', 'criativ', 'design', 'pintura', 'criacao'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '🎵', keywords: ['musica', 'som', 'audio', 'ritmo'], kinds: ['codex', 'arena', 'action'], boost: 3 },
  { emoji: '🍳', keywords: ['cozinha', 'culinaria', 'receita', 'cozinhar'], kinds: ['arena', 'action'], boost: 4 },
  { emoji: '✈️', keywords: ['viagem', 'viajar', 'trip', 'voo'], kinds: ['codex', 'arena', 'action'], boost: 3 },
  { emoji: '🧹', keywords: ['limpeza', 'reset', 'organiza', 'ordem', 'arrumar', 'desintoxic'], kinds: ['codex', 'arena', 'action'], boost: 4 },
  { emoji: '📅', keywords: ['planej', 'agenda', 'calend', 'rotina', 'ritmo', 'sequencia'], kinds: ['arena', 'action'], boost: 4 },
  { emoji: '🗂️', keywords: ['sistema', 'processo', 'organiza', 'estrutura', 'arquivo'], kinds: ['codex', 'arena', 'action'], boost: 3 },
  { emoji: '🏛️', keywords: ['campanha', 'codex', 'protocolo', 'arquivo', 'manuscrito'], kinds: ['codex'], boost: 2 },
  { emoji: '📜', keywords: ['codex', 'grimorio', 'manuscrito', 'ritual', 'arquivo'], kinds: ['codex'], boost: 4 },
  { emoji: '🏆', keywords: ['marco', 'conquista', 'vitoria', 'meta final'], kinds: ['action'], boost: 5 },
  { emoji: '🔁', keywords: ['recorrente', 'repeticao', 'consistencia', 'habit'], kinds: ['action'], boost: 4 },
  { emoji: '✅', keywords: ['check', 'checklist', 'concluir', 'completar'], kinds: ['action'], boost: 3 },
];

const normalizeText = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getDefaultEmoji = (kind: EmojiSuggestionKind, options: EmojiSuggestionOptions) => {
  if (kind === 'action') {
    const actionType = normalizeText(options.actionType);
    if (actionType.includes('marco')) return '🏆';
    if (actionType.includes('compromisso')) return '🤝';
    return options.fallback || '📝';
  }

  if (kind === 'arena') {
    return ASSET_EMOJI_FALLBACKS[normalizeText(options.assetId)] || options.fallback || '🏛️';
  }

  return options.fallback || '📜';
};

export const suggestEmojiForLabel = (
  label: string | undefined,
  kind: EmojiSuggestionKind,
  options: EmojiSuggestionOptions = {}
) => {
  const normalizedLabel = normalizeText(label);
  let winningEmoji = '';
  let winningScore = -1;

  for (const rule of EMOJI_RULES) {
    if (rule.kinds && !rule.kinds.includes(kind)) continue;

    let score = 0;
    for (const keyword of rule.keywords) {
      const normalizedKeyword = normalizeText(keyword);
      if (normalizedKeyword && normalizedLabel.includes(normalizedKeyword)) {
        score += Math.max(normalizedKeyword.length, 2);
      }
    }

    if (score > 0) {
      score += rule.boost || 0;
      if (score > winningScore) {
        winningScore = score;
        winningEmoji = rule.emoji;
      }
    }
  }

  return winningEmoji || getDefaultEmoji(kind, options);
};
