/**
 * A ABERTURA ENXUTA (12/10/2026) — passo 2 do egress de abertura.
 *
 * Medido na conta do Afonso (supabase/CHECK-o-que-a-abertura-baixa.sql, bloco 3):
 *   - `user_id` repetido em cada linha: 14 KB nas tarefas, 10 no inventario. E
 *     sempre o id de quem pediu, entao nao precisa descer; volta aqui.
 *   - `metadata` do inventario: ninguem le (3 KB).
 *   - `garden_state` do perfil: 19 dos 25 KB, o jardim 2D aposentado.
 *
 * O app recebe os mesmos objetos de antes. Qualquer falha (coluna que nao
 * existe, funcao nao criada, rede) cai na consulta antiga, inteira.
 */

type Resposta = { data: any; error: any };

export const COLUNAS_DA_TAREFA = 'id, action_id, date, start_time, duration, completed, completed_at, created_at, execution_order';
export const COLUNAS_DO_INVENTARIO = 'id, item_id, acquired_at, is_equipped';

const tentar = (consulta: () => PromiseLike<Resposta>) => Promise.resolve()
    .then(consulta)
    .catch(() => null as Resposta | null);

/** Linhas sem `user_id` na rede; ele volta aqui, o de quem pediu. */
export const semODono = async (
    userId: string,
    enxuta: () => PromiseLike<Resposta>,
    completa: () => PromiseLike<Resposta>,
): Promise<Resposta> => {
    const resposta = await tentar(enxuta);
    if (!resposta || resposta.error || !Array.isArray(resposta.data)) return completa();
    return { ...resposta, data: resposta.data.map((linha: any) => ({ ...linha, user_id: userId })) };
};

/**
 * O perfil sem `garden_state` (migracao 20261012190000). Perfil vazio tambem
 * confere na consulta antiga: "nao tem perfil" leva a abertura a criar um, e
 * isso nao pode sair de uma funcao que talvez nem exista ainda.
 */
export const perfilDeAbertura = async (
    userId: string,
    enxuta: () => PromiseLike<Resposta>,
    completa: () => PromiseLike<Resposta>,
): Promise<Resposta> => {
    const resposta = await tentar(enxuta);
    const perfil = resposta?.data;
    if (
        resposta
        && !resposta.error
        && perfil
        && typeof perfil === 'object'
        && !Array.isArray(perfil)
        && String(perfil.id) === userId
    ) {
        return { data: perfil, error: null };
    }
    return completa();
};
