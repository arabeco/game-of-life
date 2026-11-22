import { supabase } from '../supabaseClient';
import { TROCAS_NO_HISTORICO, trocasDaConversa, type LinhaDaConversa, type TrocaComOraculo } from './trocasDoOraculoIa';
export type { TrocaComOraculo } from './trocasDoOraculoIa';

/**
 * A CONVERSA COM O ORACULO FICA (22/11/2026, com o Afonso).
 *
 * A funcao oraculo-ia grava cada pergunta e resposta em oraculo_ia_mensagens.
 * O chat nunca lia de volta, entao a conversa vivia so na tela e sumia ao sair
 * da aba. Aqui o chat le as ultimas trocas da propria pessoa (a politica do
 * banco so deixa ler as suas) e devolve em ordem, da mais velha para a mais
 * nova. Poucas linhas e so de texto: o custo de rede e pequeno.
 */

/** As ultimas trocas da pessoa logada. Sem rede, sem tabela ou sem a coluna do tom: lista vazia ou sem tom, sem quebrar o chat. */
export const lerHistoricoDoOraculoIa = async (userId: string | null | undefined): Promise<TrocaComOraculo[]> => {
    if (!userId || userId === 'placeholder_user') return [];
    const consulta = (colunas: string) => supabase
        .from('oraculo_ia_mensagens')
        .select(colunas)
        .eq('user_id', userId)
        .order('criada_em', { ascending: false })
        .limit(TROCAS_NO_HISTORICO);
    let { data, error } = await consulta('pergunta,resposta,tom,criada_em');
    // Antes do SQL do tom rodar, a coluna nao existe: le sem ela.
    if (error) ({ data, error } = await consulta('pergunta,resposta,criada_em'));
    if (error) return [];
    return trocasDaConversa(data as LinhaDaConversa[]);
};
