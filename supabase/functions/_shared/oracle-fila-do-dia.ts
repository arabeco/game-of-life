/**
 * A FILA DO DIA DOS CARDS DO ORACULO (04/11/2026, com o Afonso).
 *
 * A rotina roda a cada 10 minutos. Antes ela sorteava 25 contas e fazia as
 * consultas de cada uma so para descobrir que a maioria ja tinha recebido; com
 * muita gente, o sorteio ainda deixava pessoas sem card. Agora a fila sai de uma
 * leitura so: entra quem ainda precisa de alguma entrega hoje, primeiro quem nao
 * recebeu nada, depois quem recebeu ha mais tempo.
 */
export type ContaDaFila = { userId: string; temSabedoria: boolean };
export type EntregaDeHoje = { userId: string; purpose: string; createdAt: string };

export const filaDoDia = (contas: ContaDaFila[], entregas: EntregaDeHoje[], limite: number): string[] => {
  const porConta = new Map<string, EntregaDeHoje[]>();
  entregas.forEach((entrega) => porConta.set(entrega.userId, [...(porConta.get(entrega.userId) || []), entrega]));
  return contas
    .map(({ userId, temSabedoria }) => {
      const deHoje = porConta.get(userId) || [];
      const saiu = (purpose: string) => deHoje.some((entrega) => entrega.purpose === purpose);
      const falta = !saiu('cycle_insight') || (temSabedoria && !saiu('premium_content_card'));
      return { userId, falta, ultima: deHoje.map((entrega) => entrega.createdAt).sort().at(-1) || '' };
    })
    .filter((conta) => conta.falta)
    .sort((a, b) => a.ultima.localeCompare(b.ultima))
    .slice(0, limite)
    .map((conta) => conta.userId);
};
