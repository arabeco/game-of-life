import type { ReadingFacts } from './oracle-engine-v2.ts';

/**
 * A REGUA DE CORES DO ORACULO (aprovada em 09/10/2026, secao 9 de
 * docs/2026-10-09-handoff-push-cores-e-imagens.md).
 *
 *   neutral     — branco: informacao neutra (ciclo, planner, estoque, sabedoria)
 *   guide       — azul: orientacao, comeco ou retorno
 *   success     — verde: avanco concreto, ainda em andamento
 *   achievement — dourado: conquista completa
 *
 * O vermelho existe no app (OracleSpeakerMark, `danger`) e fica reservado: nada
 * aqui o escolhe. Classifica-se pela intencao principal da fala, nunca pelo
 * narrador, pelo canal ou por uma palavra; na duvida, neutro.
 */
export type OracleVisualTone = 'neutral' | 'guide' | 'success' | 'achievement';

/**
 * A cor de destaque do Android (icone pequeno e nome do app na notificacao). O
 * neutro e um cinza-prata, e nao branco: a gaveta de notificacoes fica clara ou
 * escura conforme o tema do celular, e branco some no fundo claro. Conferir no
 * aparelho antes de fechar.
 */
export const ORACLE_PUSH_COLORS: Record<OracleVisualTone, string> = {
  neutral: '#6F7A8A', guide: '#2475AC', success: '#24844F', achievement: '#947322',
};

/**
 * A fala do motor V2. Retorno e comeco sao orientacao; reacao a uma meta que
 * chegou no alvo (`concluiu`) e conquista; reacao a avanco parcial e progresso;
 * o resto da abertura (o que foi feito hoje, o planner, o estoque) e informacao.
 */
export function speechVisualTone(channel: 'opening' | 'reaction', subject: string, concluiu = false): OracleVisualTone {
  if (subject === 'return') return 'guide';
  if (channel === 'reaction') return concluiu ? 'achievement' : 'success';
  return subject === 'open' ? 'guide' : 'neutral';
}

/**
 * A leitura do ciclo e geral: fica neutra mesmo quando menciona uma conquista de
 * passagem, e prazo encerrado tambem e so informacao. So o primeiro dia do ciclo
 * e orientacao.
 */
export function readingVisualTone(facts: ReadingFacts): OracleVisualTone {
  return facts.cycle?.startsToday ? 'guide' : 'neutral';
}

/**
 * O tom gravado numa mensagem. Card de Sabedoria e sempre neutro. Linha antiga
 * ou sem tom fica neutra — nunca se deduz progresso do texto.
 */
export function resolveOracleVisualTone(context?: Record<string, unknown> | null): OracleVisualTone {
  if (context?.purpose === 'premium_content_card') return 'neutral';
  const tom = context?.visualTone;
  return tom === 'guide' || tom === 'success' || tom === 'achievement' ? tom : 'neutral';
}

