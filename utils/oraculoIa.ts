import { supabase } from '../supabaseClient';

/**
 * A CHAMADA AO ORACULO COM IA, NUM LUGAR SO (02/11/2026).
 *
 * A caixa de pergunta e o "Ler meu ciclo e arenas" usam a mesma funcao
 * oraculo-ia e a mesma cota do dia. Depois de cada chamada sai o evento
 * EVENTO_COTA_DO_ORACULO, para o contador da caixa acompanhar.
 */
export const EVENTO_COTA_DO_ORACULO = 'oraculo-ia-cota';

/** Conversas usadas e o limite do dia; mensagens = as que ainda cabem hoje. */
export type CotaDoOraculo = { usadas: number; limite: number; mensagens?: number };

/**
 * AS PERGUNTAS PRONTAS (03/11/2026): cards numa fileira acima da caixa, para
 * quem nao sabe o que perguntar. Servem para qualquer pessoa; o Oraculo
 * responde com os padroes dela. Cada uma gasta da cota como uma pergunta.
 */
export const PERGUNTAS_PRONTAS: ReadonlyArray<{ rotulo: string; pergunta: string }> = [
    { rotulo: 'O que faço agora?', pergunta: 'O que eu faço agora?' },
    // A escada da maestria (03/11/2026): o Oraculo ve o degrau atual e o proximo.
    { rotulo: 'Como subo de nível?', pergunta: 'Como eu subo de nível na maestria?' },
    { rotulo: 'Melhorar minha vida', pergunta: 'Como eu melhoro a minha vida?' },
    { rotulo: 'Onde vou bem?', pergunta: 'Onde eu estou indo bem?' },
    { rotulo: 'Meu ponto fraco', pergunta: 'Qual é o meu ponto mais fraco?' },
    { rotulo: 'Um hábito pequeno', pergunta: 'Que hábito pequeno faria mais diferença pra mim?' },
    { rotulo: 'Planejo demais?', pergunta: 'Estou planejando mais do que consigo cumprir?' },
    { rotulo: 'Semana mais leve', pergunta: 'Como deixo minha semana mais leve sem perder o ritmo?' },
    { rotulo: 'Próximo ciclo', pergunta: 'O que eu mudaria no próximo ciclo?' },
    { rotulo: 'Ideia de arena', pergunta: 'Me dá uma ideia de arena nova' },
];

/** A pergunta pronta do botao "Ler meu ciclo e arenas". */
export const PERGUNTA_LER_MEU_DIA = 'Leia o meu dia e o meu ciclo: o que importa hoje e o que você recomenda?';

export type RespostaDoOraculo =
    | { ok: true; resposta: string; usadas: number; limite: number }
    | { ok: false; erro: 'LIMITE'; usadas: number; limite: number }
    | { ok: false; erro: 'FALHOU' | 'SEM_INTERNET' };

const avisarCota = (usadas: number, limite: number, mensagens?: number) => {
    if (typeof window === 'undefined') return;
    const detail: CotaDoOraculo = { usadas, limite, mensagens: typeof mensagens === 'number' ? mensagens : undefined };
    window.dispatchEvent(new CustomEvent(EVENTO_COTA_DO_ORACULO, { detail }));
};

export const perguntarAoOraculo = async (pergunta: string, tom: string): Promise<RespostaDoOraculo> => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, erro: 'SEM_INTERNET' };
    const { data, error } = await supabase.functions.invoke('oraculo-ia', { body: { pergunta, tom } });
    if (data?.resposta) {
        avisarCota(data.usadas, data.limite, data.mensagens);
        return { ok: true, resposta: String(data.resposta), usadas: data.usadas, limite: data.limite };
    }
    // O corpo do erro vem no contexto da resposta.
    let erro: { erro?: string; usadas?: number; limite?: number } | null = null;
    try { erro = await (error as { context?: Response })?.context?.json(); } catch { erro = null; }
    if (erro?.erro === 'LIMITE') {
        const usadas = erro.usadas ?? 0;
        const limite = erro.limite ?? 1;
        avisarCota(usadas, limite, 0);
        return { ok: false, erro: 'LIMITE', usadas, limite };
    }
    // A chamada nem chegou ao servidor: quase sempre e a rede.
    if ((error as { name?: string } | null)?.name === 'FunctionsFetchError') return { ok: false, erro: 'SEM_INTERNET' };
    return { ok: false, erro: 'FALHOU' };
};
