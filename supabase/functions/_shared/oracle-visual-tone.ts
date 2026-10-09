import { readingArena, type ReadingFacts } from './oracle-engine-v2.ts';

export type OracleVisualTone = 'neutral' | 'guide' | 'success';
// Android accent, independent of narrator and of the notification system background.
export const ORACLE_PUSH_COLORS: Record<OracleVisualTone, string> = {
  neutral: '#947322', guide: '#2475AC', success: '#24844F',
};
export function speechVisualTone(channel: 'opening' | 'reaction', subject: string): OracleVisualTone {
  if (subject === 'return') return 'guide';
  if (channel === 'reaction') return 'success';
  return subject === 'done' ? 'success' : subject === 'stock' ? 'neutral' : 'guide';
}
export function readingVisualTone(facts: ReadingFacts): OracleVisualTone {
  if (facts.cycle?.ended) return 'guide';
  const arena = readingArena(facts);
  if (facts.cycle?.percent === 100 || (arena && arena.completed >= arena.target)) return 'success';
  return facts.cycle?.startsToday ? 'guide' : 'neutral';
}
// Old rows remain neutral. Never infer progress or urgency from wording or narrator.
export function resolveOracleVisualTone(context?: Record<string, unknown> | null): OracleVisualTone {
  if (context?.purpose === 'premium_content_card') return 'neutral';
  return context?.visualTone === 'guide' || context?.visualTone === 'success' ? context.visualTone : 'neutral';
}
