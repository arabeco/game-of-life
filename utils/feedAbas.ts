import type { FeedEvent } from '../types';

/**
 * AS TRES ABAS DO FEED NAO SE REPETEM (12/10/2026).
 *   - Aliados: voce e seus amigos;
 *   - Grupo: voce e quem e do seu cla;
 *   - Reino: so quem nao e amigo, nem do cla, nem voce. O que ja aparece nas
 *     outras abas nao entra de novo.
 *
 * Quem e do cla: o nome do cla gravado no post, ou um amigo que esta no cla hoje.
 */
export type AbaDoFeed = 'Reino' | 'Grupo' | 'Aliados';

type PostDoFeed = Pick<FeedEvent, 'userId' | 'authorClanName' | 'timestamp'>;

export interface ContextoDoFeed {
    meuId: string;
    amigos: { id: string; clanName?: string | null }[];
    meuCla: string | null | undefined;
}

export function filtrarFeed<T extends PostDoFeed>(feed: T[], aba: AbaDoFeed, ctx: ContextoDoFeed): T[] {
    const amigos = new Set(ctx.amigos.map((amigo) => amigo.id));
    const doCla = (post: T) => Boolean(
        ctx.meuCla &&
            (post.authorClanName === ctx.meuCla ||
                ctx.amigos.some((amigo) => amigo.id === post.userId && amigo.clanName === ctx.meuCla))
    );
    return feed
        .filter((post) => {
            const meu = post.userId === ctx.meuId;
            if (aba === 'Aliados') return meu || amigos.has(post.userId);
            if (aba === 'Grupo') return meu || doCla(post);
            return !meu && !amigos.has(post.userId) && !doCla(post);
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
