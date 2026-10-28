/**
 * O AVISO DO ESSENCIAL (27/10/2026).
 *
 * Na experiencia Essencial o modal de recompensa nao abre: vira uma linha curta
 * dizendo o que aconteceu e o EXP. Bau, item e ouro continuam entrando em
 * silencio — quem trocar para Imersivo encontra tudo.
 */
/**
 * Trocar de experiencia nas Configuracoes nao e um interruptor: depois da
 * confirmacao o app roda a abertura do Glyph e volta na tela de descanso, como
 * um recomeco. Quem dispara e a tela de Configuracoes; quem toca e o app.
 */
export const EVENTO_TROCAR_EXPERIENCIA = 'glyph:trocar-experiencia';
export type Experiencia = 'essencial' | 'imersivo';

import { numeroDaPatente, TOTAL_DE_PATENTES } from '../constants/nobility.ts';
import { REGRAS_DE_DESBLOQUEIO, expDaRegra } from '../constants/desbloqueiosPorRegra.ts';

type Conquista = { type: string; data?: Record<string, any> | null };

const exp = (data?: Record<string, any> | null) => {
    const valor = Number(data?.reward?.exp || 0);
    return valor > 0 ? ` · +${valor.toLocaleString('pt-BR')} EXP` : '';
};

/**
 * `null` = nao avisa. A conquista secreta fica CALADA no Essencial: o EXP e os
 * itens entram, a marca fica gravada, e quem trocar para o Imersivo encontra
 * tudo pronto. O EXP que entrou se explica no cartao da patente.
 */
export const avisoDaConquista = ({ type, data }: Conquista): string | null => {
    switch (type) {
        case 'QUEST_COMPLETED':
            if (data?.secreta) return null;
            if (data?.sobrancelha === 'Missão inicial') return `Primeiro passo: ${data?.title || 'feito'}${exp(data)}`;
            return `Missão concluída: ${data?.title || 'missão'}${exp(data)}`;
        case 'ARENA_COMPLETED':
            return `${data?.metaFinal ? 'Meta concluída' : 'Arena concluída'}: ${data?.name || 'arena'}`;
        case 'MILESTONE_COMPLETED':
            return `Marco concluído: ${data?.name || data?.title || 'marco'}`;
        case 'PLAYER_RANK_UP':
            return `Nova patente: ${numeroDaPatente(data?.id)} de ${TOTAL_DE_PATENTES}`;
        case 'REPORT_COMPLETED':
            return 'Ciclo fechado. O relatório está pronto.';
        case 'COMPETITION_COMPLETED':
        case 'CLAN_RANK_UP':
            return data?.title || data?.name || 'Concluído.';
        default:
            return 'Concluído.';
    }
};

const EXP_DA_REGRA = new Map(REGRAS_DE_DESBLOQUEIO.map((regra) => [regra.id, expDaRegra(regra)]));
const REGRA_POR_ID = new Map(REGRAS_DE_DESBLOQUEIO.map((regra) => [regra.id, regra]));

/*
 * GUARDADAS (27/10/2026): as conquistas que entraram caladas no Essencial
 * ficam marcadas assim ate a pessoa voltar ao Imersivo. La, um aviso so diz
 * tudo o que entrou — em vez de dez modais seguidos — e as marcas saem.
 */
export const MARCA_DE_GUARDADA = 'guardada:';

/** As marcas de uma conquista calada, a partir do id do modal (`segredo:a+b`). */
export const marcasDeGuardada = (idDoModal: string | null | undefined): string[] =>
    String(idDoModal || '').replace(/^segredo:/, '').split('+').filter(Boolean).map((id) => MARCA_DE_GUARDADA + id);

/** O aviso unico de quem volta ao Imersivo; `null` se nada entrou calado. */
export const resumoDasGuardadas = (marcas: readonly string[] | null | undefined): string | null => {
    const regras = (marcas || [])
        .filter((marca) => marca.startsWith(MARCA_DE_GUARDADA))
        .map((marca) => REGRA_POR_ID.get(marca.slice(MARCA_DE_GUARDADA.length)))
        .filter((regra): regra is NonNullable<typeof regra> => Boolean(regra));
    if (!regras.length) return null;
    const exp = regras.reduce((soma, regra) => soma + expDaRegra(regra), 0);
    const itens = regras.reduce((soma, regra) => soma + regra.itens.length, 0);
    const conquistas = regras.length === 1 ? '1 conquista secreta' : `${regras.length} conquistas secretas`;
    const comItens = itens ? ` e ${itens} ${itens === 1 ? 'item' : 'itens'} no Arsenal` : '';
    return `Enquanto você esteve no Essencial: ${conquistas}, +${exp.toLocaleString('pt-BR')} EXP${comItens}. Estão em Missões, em Segredos.`;
};

/** O EXP que entrou calado no Essencial, para o cartao da patente. */
export const expDasConquistasGuardadas = (marcas: readonly string[] | null | undefined): number =>
    (marcas || []).reduce((soma, marca) => (
        marca.startsWith(MARCA_DE_GUARDADA) ? soma + (EXP_DA_REGRA.get(marca.slice(MARCA_DE_GUARDADA.length)) || 0) : soma
    ), 0);
