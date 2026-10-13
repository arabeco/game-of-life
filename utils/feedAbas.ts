import type { FeedEvent } from '../types';

/**
 * DUAS ABAS NO FEED, SEM REPETICAO (12/10/2026).
 *   - Aliados: voce e seus amigos;
 *   - Reino: todo o resto. Quem e do seu cla e nao e amigo fica aqui (depois
 *     pode ganhar preferencia na ordem).
 *
 * A aba Grupo (cla) saiu: amigo que tambem e do cla aparecia em duas abas, e o
 * cla ja tem a propria tela, a Sede.
 */
export type AbaDoFeed = 'Reino' | 'Aliados';

type PostDoFeed = Pick<FeedEvent, 'userId' | 'timestamp'>;

export interface ContextoDoFeed {
    meuId: string;
    amigos: { id: string }[];
}

export function filtrarFeed<T extends PostDoFeed>(feed: T[], aba: AbaDoFeed, ctx: ContextoDoFeed): T[] {
    const perto = new Set([ctx.meuId, ...ctx.amigos.map((amigo) => amigo.id)]);
    return feed
        .filter((post) => (aba === 'Aliados') === perto.has(post.userId))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
