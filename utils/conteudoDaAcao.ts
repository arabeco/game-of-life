import type { Action } from '../types';

/**
 * O QUE TEM DENTRO DA ACAO (27/10/2026).
 *
 * O planner mostra um iconezinho quando a acao traz algo alem do nome — a aula
 * (texto na aba Anotacao), um checklist ou midia — e o modal destaca as abas
 * que tem conteudo. Acao sem nada dentro nao ganha icone nenhum.
 */
export interface ConteudoDaAcao {
    texto: boolean;
    checklist: boolean;
    midia: boolean;
}

export const conteudoDaAcao = (action?: Pick<Action, 'briefing' | 'preFlight' | 'assets'> | null): ConteudoDaAcao => ({
    texto: Boolean(action?.briefing && action.briefing.trim().length > 0),
    checklist: Boolean(action?.preFlight?.some((item) => String(item || '').trim().length > 0)),
    midia: Boolean(action?.assets?.some((asset) => Boolean(asset?.url))),
});

export const temConteudo = (conteudo: ConteudoDaAcao) => conteudo.texto || conteudo.checklist || conteudo.midia;
