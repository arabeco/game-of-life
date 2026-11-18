import type { FeedEvent } from '../types';

// O dia social usa a mesma virada das visitas: 04h em São Paulo (UTC-3).
export const diaSocial = (timestamp: string | number) => new Date(new Date(timestamp).getTime() - 7 * 3600000).toISOString().slice(0, 10);
const destaque = (post: FeedEvent) => post.type === 'PLAYER_RANK_UP' ? 3
    : post.type === 'CYCLE_COMPLETED' && ['SS', 'SSS'].includes(String((post.content as {grade?:string}).grade)) ? 2
    : post.type === 'LEVEL_UP' && Number((post.content as {level?:number}).level) >= 80 ? 1 : 0;

/** Monta apenas o Reino, depois de filtrarFeed. Não modifica o feed original. */
export function montarReino<T extends FeedEvent>(feed: T[], pontos: Record<string, number> = {}, agora = Date.now()): { destaques: T[]; posts: T[] } {
    const unicos = [...new Map(feed.map(post => [post.id, post])).values()]
        .filter(post => Number.isFinite(Date.parse(post.timestamp)));
    const recentes = unicos.filter(post => {
        const idade = agora - Date.parse(post.timestamp);
        return idade >= 0 && idade <= 7 * 86400000 && destaque(post) > 0;
    }).sort((a,b) => destaque(b)-destaque(a) || Date.parse(b.timestamp)-Date.parse(a.timestamp) || a.id.localeCompare(b.id));
    const contagem = new Map<string,number>();
    const aceitar = (post:T) => {
        const chave = `${post.userId}:${diaSocial(post.timestamp)}`;
        const quantidade = contagem.get(chave) || 0;
        if (quantidade >= 2) return false;
        contagem.set(chave, quantidade+1);
        return true;
    };
    const destaques:T[] = [];
    for (const post of recentes) {
        if (destaques.length === 3) break;
        if (aceitar(post)) destaques.push(post);
    }
    const ids = new Set(destaques.map(post=>post.id));
    const posts = unicos.filter(post=>!ids.has(post.id))
        .sort((a,b)=>(pontos[b.userId]||0)-(pontos[a.userId]||0) || Date.parse(b.timestamp)-Date.parse(a.timestamp) || a.id.localeCompare(b.id))
        .filter(aceitar);
    return {destaques, posts};
}
