import type { CondicaoDeDesbloqueio } from '../constants/desbloqueiosPorRegra';

export type EventoDeSegredo = 'acao' | 'diario' | 'humor' | 'amizade' | 'vinculo' | 'missao' | 'ciclo' | 'recuperacao';
export const EVENTO_DE_SEGREDO = 'glyph:segredo-confirmado';
const EVENTOS: Record<CondicaoDeDesbloqueio['tipo'], EventoDeSegredo> = {
    ciclo_sem_falha: 'ciclo', ciclos_em_meses_distintos: 'ciclo',
    arenas_da_area_no_ciclo: 'ciclo', arena_em_cada_area_no_ciclo: 'ciclo',
    ciclo_com_volume: 'ciclo', ciclos_fechados: 'ciclo', ciclo_com_nota: 'ciclo',
    sequencia_de_dias: 'acao', acoes_concluidas: 'acao', dia_com_acoes: 'acao',
    acoes_antes_das_sete_numa_semana: 'acao', dias_seguidos_com_as_cinco_areas: 'acao',
    paginas_do_diario: 'diario', dias_de_humor: 'humor', amizades: 'amizade',
    mentorias_concluidas: 'vinculo', competicoes_vencidas: 'vinculo', missoes_individuais: 'missao',
    dias_entre_primeira_e_ultima_acao: 'acao', mesma_acao_repetida: 'acao', dias_com_exp: 'acao',
    ciclos_longos: 'ciclo', arenas_com_meta_concluidas: 'acao',
};
export const regraEscutaEvento = (condicao: CondicaoDeDesbloqueio, eventos: ReadonlySet<EventoDeSegredo>) =>
    eventos.has('recuperacao') || eventos.has(EVENTOS[condicao.tipo]);

/** Chamar somente depois da escrita confirmada, nunca no estado otimista. */
export const avisarSegredoConfirmado = (userId: string, evento: EventoDeSegredo) => {
    if (typeof window !== 'undefined' && userId) {
        window.dispatchEvent(new CustomEvent(EVENTO_DE_SEGREDO, { detail: { userId, evento } }));
    }
};

/** Agrupa rajadas e conserva eventos recebidos enquanto uma consulta está rodando. */
export const criarFilaDeSegredos = (
    conferir: (eventos: Set<EventoDeSegredo>) => Promise<void>,
    falhou: (error: unknown) => void,
) => {
    const pendentes = new Set<EventoDeSegredo>();
    let rodando = false;
    let encerrada = false;
    const drenar = async () => {
        if (rodando || encerrada) return;
        rodando = true;
        try {
            while (!encerrada && pendentes.size) {
                const lote = new Set(pendentes);
                pendentes.clear();
                try { await conferir(lote); } catch (error) { falhou(error); }
            }
        } finally { rodando = false; }
    };
    return {
        pedir(evento: EventoDeSegredo) {
            if (encerrada) return;
            pendentes.add(evento);
            void Promise.resolve().then(drenar);
        },
        encerrar() { encerrada = true; pendentes.clear(); },
    };
};
