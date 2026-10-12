/**
 * A MISSAO DE CLA NO APP (12/10/2026).
 * Desenho: docs/superpowers/specs/2026-10-12-missao-de-cla-design.md
 *
 * O servidor conta; aqui so se le o que ele disse e se decide o que mostrar.
 */

export const QUEST_DE_CLA_DE_TESTE = 'clan-genesis-socializar';

/** `ativo` falso = saiu (do cla ou da missao): o que depositou fica no grupo. */
export interface MembroDaMissao { userId: string; nickname: string; feito: number; ativo: boolean }
export interface StatusDaMissao {
    questId: string;
    meta: number;
    total: number;
    venceEm: string;
    vencida: boolean;
    entrei: boolean;
    recebi: boolean;
    temCla: boolean;
    /** A acao da MINHA participacao. E por ela, nunca pelo nome, que se acha a arena da missao. */
    minhaAcao: string | null;
    membros: MembroDaMissao[];
}

export const lerStatusDaMissao = (data: unknown): StatusDaMissao | null => {
    const bruto = (data && typeof data === 'object' ? data : null) as Record<string, unknown> | null;
    if (!bruto || typeof bruto.quest_id !== 'string' || !bruto.quest_id) return null;
    const membros = Array.isArray(bruto.members) ? bruto.members : [];
    return {
        questId: bruto.quest_id,
        meta: Math.max(1, Number(bruto.goal) || 1),
        total: Math.max(0, Number(bruto.total) || 0),
        venceEm: String(bruto.ends_on || ''),
        vencida: Boolean(bruto.expired),
        entrei: Boolean(bruto.joined),
        recebi: Boolean(bruto.claimed),
        temCla: Boolean(bruto.has_clan),
        minhaAcao: typeof bruto.my_action_id === 'string' && bruto.my_action_id ? bruto.my_action_id : null,
        membros: membros.map((m: any) => ({
            userId: String(m?.user_id || ''),
            nickname: String(m?.nickname || 'Membro'),
            feito: Math.max(0, Number(m?.done) || 0),
            ativo: m?.active !== false,
        })),
    };
};

export const rotuloDaMissao = (s: StatusDaMissao) => `${Math.min(s.total, s.meta)}/${s.meta}`;
export const metaBatida = (s: StatusDaMissao) => s.total >= s.meta;
export const podeReceber = (s: StatusDaMissao) => s.entrei && !s.recebi && metaBatida(s);
/** Vencida sem a meta: a arena se arquiva. Concluida fica. */
export const deveRecolher = (s: StatusDaMissao) => s.vencida && !metaBatida(s);

export const mensagemDoErroDaMissao = (erro?: string | null): string => {
    const texto = String(erro || '');
    if (texto.includes('MISSAO_VENCIDA')) return 'Esta missão já venceu.';
    if (texto.includes('SEM_CLA')) return 'Entre num clã para participar da missão.';
    if (texto.includes('NAO_ENTROU')) return 'Só recebe quem entrou na missão.';
    if (texto.includes('SAIU_DO_CLA')) return 'Você saiu do clã desta missão.';
    if (texto.includes('META_NAO_BATIDA')) return 'O grupo ainda não bateu a meta.';
    return 'Não consegui falar com o servidor agora. Tente de novo.';
};

/** Muda sempre que uma tarefa da missao e marcada ou desmarcada. */
export const assinaturaDaMissao = (
    tasks: { actionId: string; completed?: boolean }[],
    actionIds: Set<string>,
) => [...actionIds].sort().map((id) => `${id}:${tasks.filter((t) => t.actionId === id && t.completed).length}`).join('|');

/**
 * ENTRAR, E DESFAZER SO O QUE FOI CRIADO.
 *
 * Se o servidor recusar (vencida, sem cla, rede), desfaz exatamente o que esta
 * entrada criou: a acao nova, a arena nova, ou arquiva de novo a arena que
 * desarquivou. Uma acao que JA existia nunca e apagada — apagar levaria junto
 * as tarefas concluidas dela (revisao final de 12/10/2026).
 */
export interface PassosDaEntrada<A extends { id: string; isArchived?: boolean }, X extends { id: string }> {
    acaoExistente: X | null;
    arenaExistente: A | null;
    criarArena: () => Promise<A>;
    desarquivarArena: (arena: A) => void;
    rearquivarArena: (arena: A) => void;
    criarAcao: (arena: A) => Promise<X>;
    removerAcao: (acao: X) => Promise<void> | void;
    removerArena: (arena: A) => Promise<void> | void;
    registrar: (acao: X) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

export const entrarComDesfazer = async <A extends { id: string; isArchived?: boolean }, X extends { id: string }>(
    passos: PassosDaEntrada<A, X>,
): Promise<{ ok: true; data: unknown } | { ok: false; erro: string }> => {
    let arena = passos.arenaExistente;
    let acao = passos.acaoExistente;
    let criouArena = false;
    let criouAcao = false;
    let desarquivou = false;
    try {
        // Voltar para a missao na mesma arena: ela sai do arquivo.
        if (arena?.isArchived) {
            passos.desarquivarArena(arena);
            desarquivou = true;
        }
        if (!acao) {
            if (!arena) {
                arena = await passos.criarArena();
                criouArena = true;
            }
            acao = await passos.criarAcao(arena);
            criouAcao = true;
        }
        const resposta = await passos.registrar(acao);
        if (resposta.error) throw new Error(resposta.error.message);
        return { ok: true, data: resposta.data };
    } catch (erro) {
        try {
            if (criouAcao && acao) await passos.removerAcao(acao);
            if (criouArena && arena) await passos.removerArena(arena);
            else if (desarquivou && arena) passos.rearquivarArena(arena);
        } catch {
            // Desfazer e o melhor esforco; o erro que a pessoa precisa ver e o da entrada.
        }
        return { ok: false, erro: String((erro as Error)?.message || erro) };
    }
};
