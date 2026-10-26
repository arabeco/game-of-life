/**
 * HABITOS CONSOLIDADOS DO CICLO (25/10/2026).
 *
 * O que virou habito de verdade: a acao feita em pelo menos 6 dias por semana
 * do ciclo, com 90% ou mais das ocorrencias agendadas concluidas. O corte de 6
 * dias deixa de fora, sem acusar falha, o que naturalmente e de 5 dias (treino,
 * trabalho de dia util). Ciclo de menos de 7 dias nao tem base para isso.
 */
export interface HabitoConsolidado {
    nome: string;
    icone: string;
    dias: number;
}

type Tarefa = { actionId: string; date: string; completed?: boolean };
type Acao = { id: string; name: string; icon?: string };

const DIAS_POR_SEMANA = 6;
const TAXA_MINIMA = 0.9;

const diasEntre = (inicio: string, fim: string) =>
    Math.round((Date.parse(`${fim.slice(0, 10)}T12:00:00`) - Date.parse(`${inicio.slice(0, 10)}T12:00:00`)) / 86400000) + 1;

export function habitosConsolidados({ tasks, actions, inicio, fim }: {
    tasks: Tarefa[];
    actions: Acao[];
    inicio: string;
    fim: string;
}): HabitoConsolidado[] {
    const diasDoCiclo = diasEntre(inicio, fim);
    if (!(diasDoCiclo >= 7)) return [];
    const de = inicio.slice(0, 10);
    const ate = fim.slice(0, 10);

    const porAcao = new Map<string, { agendadas: number; feitas: number; dias: Set<string> }>();
    for (const t of tasks) {
        const data = String(t.date || '').slice(0, 10);
        if (data < de || data > ate) continue;
        const conta = porAcao.get(t.actionId) || { agendadas: 0, feitas: 0, dias: new Set<string>() };
        conta.agendadas += 1;
        if (t.completed) { conta.feitas += 1; conta.dias.add(data); }
        porAcao.set(t.actionId, conta);
    }

    const acaoPorId = new Map(actions.map((a) => [a.id, a]));
    const minimoDeDias = Math.ceil((DIAS_POR_SEMANA / 7) * diasDoCiclo);
    return [...porAcao.entries()]
        .filter(([, c]) => c.dias.size >= minimoDeDias && c.feitas / Math.max(1, c.agendadas) >= TAXA_MINIMA)
        .map(([id, c]) => ({ nome: acaoPorId.get(id)?.name || 'Ação', icone: acaoPorId.get(id)?.icon || '✦', dias: c.dias.size }))
        .sort((a, b) => b.dias - a.dias || a.nome.localeCompare(b.nome))
        .slice(0, 5);
}
