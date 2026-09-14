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
    ? `Sua missão está pronta para começar: ${progress.goal} ${pact.kind === 'constancia' ? 'dias com registros' : 'entregas'} ${scope}. Comece por uma ação que caiba na sua rotina; registre depois de fazê-la.`
    : `Você já fez ${progress.current} de ${progress.goal}. ${remaining === 1 ? 'Falta' : 'Faltam'} ${remaining} ${unit} ${scope}. ${pact.kind === 'constancia' ? 'Vários registros no mesmo dia contam como um único dia na missão.' : progress.current === 1 ? 'O primeiro passo já está registrado. Escolha a próxima ação possível, sem precisar fazer tudo de uma vez.' : remaining === 1 ? 'Continue no que você se propôs a fazer; não precisa acrescentar uma meta nova.' : 'Continue com ações que façam sentido para você, não apenas para completar o contador.'}`;
};
