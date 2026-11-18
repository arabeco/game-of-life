/**
 * AS ABAS DO PERFIL QUE ABRE NO AVATAR (15/11/2026, com o Afonso).
 *
 * O soberano saiu do canto do cartao (ficava por cima do nome e do OK, e quem
 * nao tinha soberano ficava com o buraco) e virou a primeira aba, com os
 * artefatos. Sem soberano para mostrar, a aba nao existe e o perfil abre no
 * Resumo. Widgets vai por ultimo: e o mais pessoal, e pouca gente preenche.
 */

export type AbaDoPerfil = 'sovereign' | 'summary' | 'mastery' | 'widgets';

/**
 * QUEM NAO QUER MOSTRAR, NAO MOSTRA. E QUEM NUNCA ESCOLHEU TAMBEM NAO, ENQUANTO
 * ESTIVER SEM ROUPA: `primaryDisplay` ausente e nunca ter aberto o editor, e a
 * conta nova nasce com `outfit: 'none'`. `'none'` e escolha explicita.
 */
export function soberanoVisivel(config?: { outfit?: string; primaryDisplay?: string } | null): boolean {
    if (!config) return false;
    if (config.primaryDisplay === 'none') return false;
    if (config.primaryDisplay === undefined && (config.outfit || 'none') === 'none') return false;
    return true;
}

export function abasDoPerfil(temSoberano: boolean): AbaDoPerfil[] {
    return temSoberano ? ['sovereign', 'summary', 'mastery', 'widgets'] : ['summary', 'mastery', 'widgets'];
}

export function abaInicialDoPerfil(temSoberano: boolean): AbaDoPerfil {
    return temSoberano ? 'sovereign' : 'summary';
}
