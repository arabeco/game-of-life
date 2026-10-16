import type { Candidate, DiscoveryTopic, Voice } from '../supabase/functions/_shared/oracle-engine-v2';
import { supabase } from '../supabaseClient';

export interface DiscoveryFacts {
  lastLevelUpdate?: number;
  hasJournal?: boolean;
  hasFriends?: boolean;
  hasRelationships?: boolean;
  hasGarden?: boolean;
  hasClosedCycle: boolean;
  hasCampaign: boolean;
  hasUnequippedItem: boolean;
  hasEquippedItem: boolean;
  hasWisdomThemes: boolean;
  gardenEnabled: boolean;
}

/** Only existence checks: never download journal text or the garden document. Errors stay unknown. */
export async function readDiscoveryUsage(userId: string): Promise<Partial<DiscoveryFacts>> {
  const queries = [
    supabase.from('journal_pages').select('user_id', { count: 'exact', head: true }).eq('user_id', userId).neq('content', ''),
    supabase.from('friends').select('user_id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('relationship_links').select('id', { count: 'exact', head: true }).or(`mentor_id.eq.${userId},pupil_id.eq.${userId}`),
    supabase.from('user_gardens_3d').select('user_id', { count: 'exact', head: true }).eq('user_id', userId),
  ];
  const names = ['hasJournal', 'hasFriends', 'hasRelationships', 'hasGarden'] as const;
  const results = await Promise.allSettled(queries);
  const facts: Partial<DiscoveryFacts> = {};
  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && !result.value.error && typeof result.value.count === 'number') {
      facts[names[i]] = result.value.count > 0;
    }
  });
  return facts;
}

export function discoveryCandidates(f: DiscoveryFacts, tone: Voice, now: number): Candidate[] {
  const result: Candidate[] = [];
  const add = (topic: DiscoveryTopic, label: string, lines: Record<Voice, string>) => result.push({
    id: `discovery:${topic}`, subject: `discovery:${topic}`, score: 30,
    text: lines[tone], discovery: { topic, label },
  });
  if (!f.lastLevelUpdate || now - f.lastLevelUpdate >= 60 * 86400000) add('mastery', 'Ver Maestria', {
    neutro: 'Na Maestria, você pode avaliar como está em cada área da vida.',
    coach: 'Vale revisar seu ponto de partida. A Maestria reúne suas áreas da vida.',
    reflexivo: 'Como você se percebe hoje em cada área da vida? A Maestria ajuda nessa reflexão.',
    calmo: 'Sua Maestria pode acompanhar suas mudanças. Revise quando fizer sentido.',
  });
  if (f.hasJournal === false) add('journal', 'Abrir Diário', {
    neutro: 'O Diário guarda suas anotações e reflexões junto do registro de humor.',
    coach: 'Uma ideia de hoje pode virar uma anotação no Diário.',
    reflexivo: 'O que você gostaria de lembrar deste momento? Há espaço no Diário.',
    calmo: 'O Diário é um espaço para escrever no seu ritmo, sem precisar organizar tudo.',
  });
  if (f.hasFriends === true && f.hasRelationships === false) add('relationships', 'Ver Vínculos', {
    neutro: 'Você pode criar um vínculo com um amigo e acompanhar uma arena juntos.',
    coach: 'Tem um objetivo em comum com um amigo? Os Vínculos ajudam a acompanhar juntos.',
    reflexivo: 'Que experiência valeria dividir com um amigo? Um vínculo pode acompanhar esse caminho.',
    calmo: 'Se fizer sentido para vocês, um vínculo permite acompanhar uma arena juntos.',
  });
  if (f.hasClosedCycle && !f.hasCampaign) add('campaigns', 'Ver campanhas', {
    neutro: 'Campanhas oferecem arenas prontas com um plano de dias. Você pode explorar as opções.',
    coach: 'Quer experimentar um plano pronto? Na aba Missão, você pode buscar uma campanha.',
    reflexivo: 'Um caminho diferente pode começar por uma campanha. Há planos prontos para explorar.',
    calmo: 'Há campanhas com planos prontos, para quando você quiser experimentar outro caminho.',
  });
  if (f.hasUnequippedItem && !f.hasEquippedItem) add('arsenal', 'Abrir Arsenal', {
    neutro: 'Você tem itens no Arsenal. Pode usá-los para personalizar seu Soberano.',
    coach: 'Seu Arsenal já tem opções para dar sua cara ao Soberano.',
    reflexivo: 'Que aparência combina com você? Seus itens estão no Arsenal.',
    calmo: 'Seus itens estão guardados no Arsenal. Você pode experimentar uma composição.',
  });
  if (f.gardenEnabled && f.hasGarden === false) add('garden', 'Abrir Jardim', {
    neutro: 'Seu Jardim é um espaço que você pode montar e personalizar.',
    coach: 'Você pode começar seu Jardim escolhendo como quer organizar esse espaço.',
    reflexivo: 'Como seria um lugar com a sua cara? Você pode experimentar no Jardim.',
    calmo: 'O Jardim oferece um espaço para uma pausa e para criar do seu jeito.',
  });
  if (!f.hasWisdomThemes) add('wisdom', 'Ver Sabedoria', {
    neutro: 'Na Sabedoria, você escolhe os temas dos cards de reflexão que quer receber.',
    coach: 'Escolha um assunto que desperte sua curiosidade na aba Sabedoria.',
    reflexivo: 'Que assunto você gostaria de explorar? Os temas da Sabedoria ficam à sua escolha.',
    calmo: 'Na Sabedoria, você pode escolher temas para ler quando quiser.',
  });
  return result;
}
