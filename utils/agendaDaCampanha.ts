/**
 * A AGENDA DA CAMPANHA (27/10/2026, decidido com o Afonso).
 *
 * Cada acao do modelo pode dizer em que DIA da fase ela acontece (`dias`,
 * contando do 1). Ao iniciar a campanha a pessoa escolhe se quer agendar tudo
 * e em que dia comeca; a fase 1 cai a partir dessa data, e cada fase seguinte
 * cai a partir do dia depois de abrir — quem atrasou nao fica com o planner
 * cheio de coisa travada. O horario e o sugerido pela acao, e a pessoa muda o
 * de qualquer uma depois, como sempre.
 */

/** O pedido de "agendar tudo?" antes de instalar (escutado pelo AgendarCampanhaModal). */
export const EVENTO_AGENDAR_CAMPANHA = 'glyph:agendar-campanha';

/** Horario sugerido pelo momento do dia, quando a acao nao traz um. */
const HORARIO_DO_MOMENTO: Record<string, number> = {
    morning: 7 * 60,
    afternoon: 14 * 60,
    evening: 19 * 60,
    night: 21 * 60 + 30,
};

export const horarioSugerido = (acao: { scheduledStartTime?: number | null; context?: { timeOfDay?: string } | null }): number => {
    if (typeof acao.scheduledStartTime === 'number' && Number.isFinite(acao.scheduledStartTime)) return acao.scheduledStartTime;
    return HORARIO_DO_MOMENTO[acao.context?.timeOfDay || ''] ?? 9 * 60;
};

/** Os dias validos da acao na fase, sem repetir e em ordem (1 = primeiro dia). */
export const diasValidos = (dias?: unknown): number[] => {
    if (!Array.isArray(dias)) return [];
    return [...new Set(dias.map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 60))].sort((a, b) => a - b);
};

const somarDias = (data: string, dias: number): string => {
    const [ano, mes, dia] = data.slice(0, 10).split('-').map(Number);
    const d = new Date(Date.UTC(ano, mes - 1, dia + dias));
    return d.toISOString().slice(0, 10);
};

const SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const diaDaSemana = (data: string) => {
    const [ano, mes, dia] = data.slice(0, 10).split('-').map(Number);
    return SEMANA[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
};
/** Sem escolha (ou lista vazia), todos os dias valem. */
const permite = (diasDaSemana?: string[] | null) => {
    const escolhidos = new Set((diasDaSemana || []).filter((d) => SEMANA.includes(d)));
    return (data: string) => escolhidos.size === 0 || escolhidos.has(diaDaSemana(data));
};

/** O primeiro dia permitido a partir de `data` (ela mesma, se valer). */
export const primeiroDiaPermitido = (data: string, diasDaSemana?: string[] | null): string => {
    const vale = permite(diasDaSemana);
    let atual = data.slice(0, 10);
    for (let i = 0; i < 7 && !vale(atual); i += 1) atual = somarDias(atual, 1);
    return atual;
};

/**
 * As datas de uma acao, a partir do inicio da fase. Com dias da semana
 * escolhidos (27/10/2026), o "dia N" e o N-esimo dia PERMITIDO: quem tira o
 * domingo de folga nao recebe nada no domingo, e a campanha so anda um dia.
 */
export const datasDaAcao = (inicioDaFase: string, dias?: unknown, diasDaSemana?: string[] | null): string[] => {
    const vale = permite(diasDaSemana);
    const quero = diasValidos(dias);
    if (!quero.length) return [];
    const datas: string[] = [];
    let atual = primeiroDiaPermitido(inicioDaFase, diasDaSemana);
    for (let n = 1; n <= quero[quero.length - 1]; n += 1) {
        if (quero.includes(n)) datas.push(atual);
        do { atual = somarDias(atual, 1); } while (!vale(atual));
    }
    return datas;
};

/** O modelo traz agenda se alguma acao diz o dia dela. */
export const modeloTemAgenda = (template?: { levels?: { actions?: { dias?: unknown }[] }[] } | null): boolean =>
    Boolean(template?.levels?.some((nivel) => nivel.actions?.some((acao) => diasValidos(acao.dias).length > 0)));

/** A fase que abriu depois do inicio cai a partir do dia seguinte. */
export const inicioDaFaseQueAbriu = (hoje: string): string => somarDias(hoje, 1);
