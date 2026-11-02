import { supabase } from '../supabaseClient';

/**
 * A CHAMADA AO ORACULO COM IA, NUM LUGAR SO (02/11/2026).
 *
 * A caixa de pergunta e o "Ler meu ciclo e arenas" usam a mesma funcao
 * oraculo-ia e a mesma cota do dia. Depois de cada chamada sai o evento
 * EVENTO_COTA_DO_ORACULO, para o contador da caixa acompanhar.
 */
export const EVENTO_COTA_DO_ORACULO = 'oraculo-ia-cota';

/** A pergunta pronta do botao "Ler meu ciclo e arenas". */
export const PERGUNTA_LER_MEU_DIA = 'Leia o meu dia e o meu ciclo: o que importa hoje e o que você recomenda?';

export type RespostaDoOraculo =
    | { ok: true; resposta: string; usadas: number; limite: number }
    | { ok: false; erro: 'LIMITE'; usadas: number; limite: number }
    | { ok: false; erro: 'FALHOU' };

const avisarCota = (usadas: number, limite: number) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(EVENTO_COTA_DO_ORACULO, { detail: { usadas, limite } }));
};

export const perguntarAoOraculo = async (pergunta: string, tom: string): Promise<RespostaDoOraculo> => {
    const { data, error } = await supabase.functions.invoke('oraculo-ia', { body: { pergunta, tom } });
    if (data?.resposta) {
        avisarCota(data.usadas, data.limite);
        return { ok: true, resposta: String(data.resposta), usadas: data.usadas, limite: data.limite };
    }
    // O corpo do erro vem no contexto da resposta.
    let erro: { erro?: string; usadas?: number; limite?: number } | null = null;
    try { erro = await (error as { context?: Response })?.context?.json(); } catch { erro = null; }
    if (erro?.erro === 'LIMITE') {
        const usadas = erro.usadas ?? 0;
        const limite = erro.limite ?? 1;
        avisarCota(usadas, limite);
        return { ok: false, erro: 'LIMITE', usadas, limite };
    }
    return { ok: false, erro: 'FALHOU' };
};
