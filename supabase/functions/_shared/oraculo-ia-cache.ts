/**
 * OS PADROES GUARDADOS POR 5 MINUTOS (04/11/2026, com o Afonso).
 *
 * Quem emenda mensagens nao precisa reler tarefas e ciclos a cada uma: e o
 * que mais pesa em egress. Fica na memoria da funcao, entao nao precisa de
 * tabela; se a funcao esfriar ou outra instancia atender, le do banco e pronto.
 * Em troca, por ate 5 minutos ele nao ve uma acao recem-concluida.
 */
const VALIDADE_MS = 5 * 60_000;
const TETO_DE_CONTAS = 200;
const guardados = new Map<string, { padroes: string; em: number }>();

export const padroesGuardados = (userId: string, agora = Date.now()): string | null => {
  const achou = guardados.get(userId);
  if (!achou) return null;
  if (agora - achou.em > VALIDADE_MS) {
    guardados.delete(userId);
    return null;
  }
  return achou.padroes;
};

export const guardarPadroes = (userId: string, padroes: string, agora = Date.now()) => {
  guardados.delete(userId);
  guardados.set(userId, { padroes, em: agora });
  // O Map guarda a ordem de entrada: a primeira chave e a mais antiga.
  if (guardados.size > TETO_DE_CONTAS) guardados.delete(guardados.keys().next().value as string);
};
