import { OracleConversationMemory } from '../types';

type MemoryMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
};

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const unique = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const extractTopics = (messages: MemoryMessage[]): string[] => {
  const corpus = normalize(messages.map((message) => message.content).join(' '));
  const topics: string[] = [];

  if (/\b(app|glyph|oraculo|oraculo|planner|sitrep|ciclo|arena|acao|acoes)\b/.test(corpus)) topics.push('app');
  if (/\b(treino|academia|correr|corrida|saude|sono)\b/.test(corpus)) topics.push('saude');
  if (/\b(foco|produtividade|rotina|agenda|horario|planejar|organizar)\b/.test(corpus)) topics.push('rotina');
  if (/\b(estudo|curso|leitura|prova|aprender)\b/.test(corpus)) topics.push('estudo');
  if (/\b(relacionamento|amizade|parceria|cla|mensagem)\b/.test(corpus)) topics.push('social');
  if (/\b(ansiedade|emocao|cansado|exausto|mente)\b/.test(corpus)) topics.push('emocional');

  return unique(topics).slice(0, 4);
};

const extractEntities = (messages: MemoryMessage[]): string[] => {
  const corpus = normalize(messages.map((message) => message.content).join(' '));
  const entities: string[] = [];

  if (/\bciclo\b/.test(corpus)) entities.push('ciclo');
  if (/\barena\b/.test(corpus)) entities.push('arena');
  if (/\bacao\b|\bações\b|\bacoes\b/.test(corpus)) entities.push('acao');
  if (/\bplanner\b/.test(corpus)) entities.push('planner');
  if (/\bsitrep\b/.test(corpus)) entities.push('sitrep');
  if (/\bpremium\b/.test(corpus)) entities.push('premium');
  if (/\bvoz\b|\bmicrofone\b/.test(corpus)) entities.push('voz');

  return unique(entities).slice(0, 6);
};

export const buildOracleConversationMemory = (
  messages: MemoryMessage[],
  options?: { lastActionOffer?: string | null },
): OracleConversationMemory => {
  const relevantMessages = messages
    .filter((message) => message.content.trim().length > 0)
    .slice(-8);

  const condensed = relevantMessages
    .map((message) => `${message.role === 'user' ? 'U' : 'A'}: ${message.content.replace(/\s+/g, ' ').trim()}`)
    .join(' | ')
    .slice(0, 900);

  const lastUserMessage = [...relevantMessages].reverse().find((message) => message.role === 'user')?.content || null;
  const currentObjective = lastUserMessage
    ? lastUserMessage.replace(/\s+/g, ' ').trim().slice(0, 140)
    : null;

  const topics = extractTopics(relevantMessages);

  return {
    summary: condensed,
    currentTopic: topics[0] || null,
    currentObjective,
    mentionedEntities: extractEntities(relevantMessages),
    lastActionOffer: options?.lastActionOffer || null,
    turnCount: relevantMessages.length,
  };
};
