/**
 * A MISSAO DE CLA NO APP (12/10/2026).
 * Desenho: docs/superpowers/specs/2026-10-12-missao-de-cla-design.md
 *
 * O servidor conta; aqui so se le o que ele disse e se decide o que mostrar.
 */

export const QUEST_DE_CLA_DE_TESTE = 'clan-genesis-socializar';

export interface MembroDaMissao { userId: string; nickname: string; feito: number }
export interface StatusDaMissao {
    questId: string;
    meta: number;
    total: number;
    venceEm: string;
    vencida: boolean;
    entrei: boolean;
    recebi: boolean;
    temCla: boolean;
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
        membros: membros.map((m: any) => ({
            userId: String(m?.user_id || ''),
            nickname: String(m?.nickname || 'Membro'),
            feito: Math.max(0, Number(m?.done) || 0),
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
