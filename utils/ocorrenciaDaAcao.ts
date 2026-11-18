/**
 * UMA ACAO, UMA OCORRENCIA POR ACONTECIMENTO (15/11/2026, "Visita Dada").
 *
 * Sexta, a Conexao planejada ganhou a anotacao "Visita Dada". A noite o Afonso
 * arrastou o chip para as 18:00, a hora em que a visita aconteceu, e concluiu.
 * O app criou OUTRA Conexao e deixou a planejada pendente; dois dias depois a
 * varredura a devolveu para a bandeja com a anotacao, e ela reapareceu no
 * domingo. Um acontecimento tinha virado duas ocorrencias.
 *
 * As duas regras daqui evitam isso sem tirar o direito de planejar a mesma
 * acao duas vezes no dia:
 *   - REGISTRAR (soltar num horario que ja passou) reaproveita a pendente do
 *     mesmo dia, levando-a para o horario em que aconteceu. Planejar (soltar no
 *     futuro) continua criando, porque ai a pessoa pode querer mais de uma.
 *   - SEGURAR O CHIP conclui a do dia antes da que esta esperando na bandeja.
 */

export interface OcorrenciaLeve {
    id: string;
    actionId: string;
    completed: boolean;
    /** Minutos do dia; -1 e sem horario. */
    startTime: number;
    dataOperacional: string | null;
    /** Ocorrencia de ciclo ja julgado: nao se move nem se conclui por aqui. */
    bloqueada?: boolean;
}

/** O horario solto ja passou? Data real (YYYY-MM-DD) e minutos reais do dia. */
export function slotJaPassou(data: string, minutos: number, agora: Date): boolean {
    const [ano, mes, dia] = data.split('-').map(Number);
    if (!ano || !mes || !dia) return false;
    const slot = new Date(ano, mes - 1, dia, 0, Math.max(0, minutos));
    return slot.getTime() <= agora.getTime();
}

const pendenteDaAcaoNoDia = (o: OcorrenciaLeve, actionId: string, dataOperacional: string) =>
    o.actionId === actionId && !o.completed && !o.bloqueada && o.dataOperacional === dataOperacional;

/**
 * A pendente do mesmo dia que deve ir para o horario registrado: a mais perto
 * do horario solto; as sem horario ficam por ultimo. Nenhuma: null (cria).
 */
export function ocorrenciaPendenteParaRegistrar(
    ocorrencias: OcorrenciaLeve[],
    { actionId, dataOperacional, inicio }: { actionId: string; dataOperacional: string; inicio: number },
): string | null {
    const distancia = (o: OcorrenciaLeve) => (o.startTime >= 0 ? Math.abs(o.startTime - inicio) : Number.MAX_SAFE_INTEGER);
    const candidatas = ocorrencias
        .filter((o) => pendenteDaAcaoNoDia(o, actionId, dataOperacional))
        .sort((a, b) => distancia(a) - distancia(b));
    return candidatas[0]?.id ?? null;
}

/** Segurar o chip: a pendente de hoje primeiro; depois a da bandeja; senao null (cria). */
export function escolherOcorrenciaParaConcluir(
    ocorrencias: OcorrenciaLeve[],
    { actionId, hojeOperacional, daEspera }: { actionId: string; hojeOperacional: string; daEspera?: string | null },
): string | null {
    const doDia = ocorrencias
        .filter((o) => pendenteDaAcaoNoDia(o, actionId, hojeOperacional))
        .sort((a, b) => (b.startTime >= 0 ? 1 : 0) - (a.startTime >= 0 ? 1 : 0));
    return doDia[0]?.id ?? daEspera ?? null;
}
