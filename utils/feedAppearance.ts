import type { CSSProperties } from 'react';
import type { FeedEvent } from '../types';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals.ts';
import { SEASONS } from '../constants/seasonContent.ts';
import { LIFE_AREAS } from '../constants/lifeAreas.ts';
import { getMasteryBadgeTier } from '../constants/masteryBadgeTiers.ts';
import { PROFILE_BACKGROUND_LOCAL_ROOT, getProfileBackgroundBasename, getRankBackgroundToken } from './profileBackgrounds.ts';

/**
 * O FUNDO DIZ O TIPO (12/10/2026, fechado na bancada tools/feitos-bancada.html).
 *
 * O card nao tem mais icone de tipo: quem diz o que aconteceu e o fundo.
 *   - subiu de patente: o fundo daquela patente (os dez da escada);
 *   - ciclo: o fundo da placa que a pessoa tirou (SSS..E);
 *   - maestria: branco e dourado;
 *   - missao de temporada: a cor da temporada;
 *   - arena e marco: a cor da area.
 */

// Visual fallbacks for seasons whose optional color pair is not configured yet.
const seasonPalette: Record<string, { primaria: string; secundaria: string }> = {
    genesis: { primaria: '#7663a4', secundaria: '#a48a53' },
    aurora: { primaria: '#418d87', secundaria: '#946598' },
    zenite: { primaria: '#ad873e', secundaria: '#aa6043' },
    eclipse: { primaria: '#665394', secundaria: '#9b526e' },
    egide: { primaria: '#4a7187', secundaria: '#648577' },
};

const PATENTES = ['vagante', 'escudeiro', 'cavaleiro', 'lorde', 'barao', 'conde', 'duque', 'principe', 'rei', 'soberano'];
const NOTAS_COM_PLACA = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'E'];
const semAcento = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** A patente do post: o id gravado, ou o nome dela (posts antigos so tem o nome). */
const patenteDoFeito = (event: FeedEvent): string | null => {
    const content = event.content as FeedEvent['content'] & { rankId?: string };
    const candidato = semAcento(String(content.rankId || content.rankName || ''));
    return PATENTES.includes(candidato) ? candidato : null;
};

const notaDoFeito = (event: FeedEvent): string | null => {
    const nota = String((event.content as { grade?: string }).grade || '').toUpperCase().trim();
    return NOTAS_COM_PLACA.includes(nota) ? nota : null;
};

const fundoComImagem = (url: string, peliculaMeio: number, peliculaPontas: number) =>
    `linear-gradient(90deg, rgba(4,5,7,${peliculaPontas}) 0%, rgba(4,5,7,${peliculaMeio}) 50%, rgba(4,5,7,${peliculaPontas - 0.06}) 100%), url(${url}) center/cover`;

export function getFeedAppearance(event: FeedEvent): CSSProperties {
    let primary = '#87744e';
    let secondary = '#514535';
    let accent = '#e9c981';
    let rgb = '233, 201, 129';
    let background: string | undefined;
    let moldura: Record<string, string> = {};

    if (event.type === 'ARENA_COMPLETED' || event.type === 'MILESTONE_COMPLETED') {
        primary = ASSET_ACCENT_COLORS[event.content.assetId || ''] || '#687380';
        secondary = primary;
    } else if (event.type === 'QUEST_COMPLETED') {
        const season = event.content.seasonId ? SEASONS[event.content.seasonId] : undefined;
        const colors = season?.cores || (season ? seasonPalette[season.theme] : undefined);
        primary = colors?.primaria || '#9564ce';
        secondary = colors?.secundaria || '#be608f';
    } else if (event.type === 'LEVEL_UP') {
        // Maestria: branco e dourado.
        primary = '#f1ece2';
        secondary = '#c9a24f';
        accent = '#f3dfa6';
        rgb = '243, 223, 166';
        // A MOLDURA SOBE COM O NIVEL, na mesma regra do pentagono da maestria
        // (25, 50, 75, 90 e 100): borda mais grossa, brilho, e a coroa nos 100.
        const nivel = Number((event.content as { level?: number }).level);
        if (Number.isFinite(nivel)) {
            const tier = getMasteryBadgeTier(nivel);
            moldura = {
                '--feat-borda': `${tier.borda}px`,
                '--feat-brilho': String(tier.brilho),
                '--feat-anel': tier.anelDuplo ? '1' : '0',
                '--feat-coroa': tier.coroado ? '1' : '0',
            };
        }
    } else if (event.type === 'PLAYER_RANK_UP') {
        const patente = patenteDoFeito(event);
        const basename = patente ? getProfileBackgroundBasename(getRankBackgroundToken(patente)) : null;
        if (basename) background = fundoComImagem(`${PROFILE_BACKGROUND_LOCAL_ROOT}/${basename}.webp`, 0.18, 0.62);
    } else if (event.type === 'CYCLE_COMPLETED' || event.type === 'REPORT_COMPLETED' || event.type === 'CLAN_RANK_UP') {
        primary = '#9baabc';
        secondary = '#606e82';
        accent = '#e0e5ee';
        rgb = '210, 220, 235';
        const nota = event.type === 'CYCLE_COMPLETED' ? notaDoFeito(event) : null;
        if (nota) {
            background = fundoComImagem(`/assets/cycles/plate-${nota.toLowerCase()}.webp`, 0.62, 0.88);
            accent = '#f6dc96';
            rgb = '246, 220, 150';
        }
    }

    return {
        '--feat-hue': primary,
        '--feat-hue-secondary': secondary,
        '--feat-accent': accent,
        '--feat-rgb': rgb,
        ...(background ? { background } : {}),
        ...moldura,
    } as CSSProperties;
}

/** A acao, curta, que vem depois do nome: "MISTER X • SUBIU DE PATENTE". */
export function acaoDoFeito(event: FeedEvent): string {
    switch (event.type) {
        case 'MILESTONE_COMPLETED': return 'fechou um marco';
        case 'ARENA_COMPLETED': return 'concluiu uma arena';
        case 'CYCLE_COMPLETED': return 'encerrou um ciclo';
        case 'REPORT_COMPLETED': return 'publicou um relato';
        case 'PLAYER_RANK_UP': return 'subiu de patente';
        case 'CLAN_RANK_UP': return 'subiu o clã de patente';
        case 'LEVEL_UP': return 'recalibrou a maestria';
        case 'QUEST_COMPLETED': return event.content.seasonId ? 'missão de temporada' : 'concluiu uma missão';
        case 'COMPETITION_COMPLETED': return 'encerrou um desafio';
        default: return 'teve um feito';
    }
}

/** O titulo entre os risquinhos. */
export function tituloDoFeito(event: FeedEvent): string {
    const content = event.content as FeedEvent['content'] & { level?: number; grade?: string };
    const titulo = content.title?.trim() || 'Feito sem título';
    switch (event.type) {
        case 'PLAYER_RANK_UP':
        case 'CLAN_RANK_UP':
            return content.rankName?.trim() || titulo;
        case 'LEVEL_UP':
            // Nivel, e nunca "Indice": e o numero que o app mostra como "Nv.".
            return typeof content.level === 'number' ? `Nível ${content.level}` : titulo;
        case 'CYCLE_COMPLETED': {
            const nota = notaDoFeito(event);
            if (nota) return `${titulo} · ${nota}`;
            return typeof content.score === 'number' ? `${titulo} · Score ${content.score}` : titulo;
        }
        default:
            return titulo;
    }
}

export interface NumeroDoFeito { valor: number; rotulo: string; cor?: string }

const NOME_CURTO_DA_AREA: Record<string, string> = {
    proposito: 'Propósito', relacoes: 'Relações', trabalho: 'Trabalho', lazer: 'Lazer', saude: 'Saúde',
};

/** Os numeros embaixo. Na maestria, o nivel de cada area, na cor dela. */
export function numerosDoFeito(event: FeedEvent): NumeroDoFeito[] {
    const content = event.content as FeedEvent['content'] & { areas?: { id: string; level: number }[] };
    if (event.type === 'LEVEL_UP' && Array.isArray(content.areas)) {
        return content.areas
            .filter((area) => area && typeof area.level === 'number')
            .map((area) => ({
                valor: area.level,
                rotulo: NOME_CURTO_DA_AREA[area.id] || area.id,
                cor: LIFE_AREAS.find((candidata) => candidata.id === area.id)?.color || '#c9a24f',
            }));
    }
    return [
        { valor: content.actionCount, rotulo: 'ações' },
        { valor: content.deliveries, rotulo: 'entregas' },
        { valor: content.days, rotulo: 'dias ativos' },
        { valor: content.exp, rotulo: 'EXP ganhos' },
        { valor: content.minutes, rotulo: 'min registrados' },
    ].filter((n): n is NumeroDoFeito => typeof n.valor === 'number' && Number.isFinite(n.valor) && n.valor >= 0);
}
