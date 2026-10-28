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

// A mesma marca de utils/medidorDeSegredos (MARCA_DE_EXP_DO_SEGREDO): o EXP da
// conquista foi pago. Repetida aqui para o aviso nao puxar o catalogo de itens.
const MARCA_DO_EXP_PAGO = 'segredo-exp:';
const EXP_DA_REGRA = new Map(REGRAS_DE_DESBLOQUEIO.map((regra) => [regra.id, expDaRegra(regra)]));

/** O EXP que as conquistas secretas ja pagaram, para o cartao da patente no Essencial. */
export const expDasConquistasGuardadas = (marcas: readonly string[] | null | undefined): number =>
    (marcas || []).reduce((soma, marca) => (
        marca.startsWith(MARCA_DO_EXP_PAGO) ? soma + (EXP_DA_REGRA.get(marca.slice(MARCA_DO_EXP_PAGO.length)) || 0) : soma
    ), 0);
