import type { ArenaPact, ArenaPactProgress } from './arenaPacts';

/** A current reading, not a reconstruction of past messages or delivery dates. */
export const buildOracleMissionBrief = (pact: ArenaPact, progress: ArenaPactProgress): string => {
  const remaining = Math.max(0, progress.goal - progress.current);
  if (progress.completed) return 'Você cumpriu a missão. Sua recompensa está disponível no cartão acima.';
  if (progress.windowEnded) return 'O prazo terminou. Confira os registros feitos dentro da janela da missão antes de encerrá-la.';
  const scope = pact.arenaId ? `em ${pact.arenaName}` : 'entre suas arenas';
  if (pact.kind === 'conclusao') return `A arena está ${Math.round(progress.percent)}% concluída. Continue nas ações que ainda faltam para fechar esta missão.`;
  const unit = pact.kind === 'constancia' ? (remaining === 1 ? 'dia com registro' : 'dias com registro')
    : (remaining === 1 ? 'entrega' : 'entregas');
  return progress.current === 0
    ? `Sua missão está pronta para começar: ${progress.goal} ${pact.kind === 'constancia' ? 'dias com registros' : 'entregas'} ${scope}. Cada registro válido entra no progresso.`
    : `Você já fez ${progress.current} de ${progress.goal}. ${remaining === 1 ? 'Falta' : 'Faltam'} ${remaining} ${unit} ${scope}.`;
};
