import { CATALOG_INTERFACE_ROOT } from './catalogAssets';

/**
 * O emblema no topo da placa, por acontecimento.
 *
 * Nao existem seis modais: existe uma placa so, e o que muda e o emblema, o
 * texto e o reflexo. Sem esta tabela, cada acontecimento escolhia um emoji no
 * meio do JSX — a coroa da patente era a mesma coroa do bau lendario e da
 * insignia do Barao, e o `recompensa_geral.webp` estava no disco com zero
 * referencias no codigo.
 */

export type TipoDeRecompensa =
    | 'geral'      // resgate de codigo, presente, doacao, bonus, futuro premio diario
    | 'missao'     // missao individual, inicial, desafio de sistema, pacto de arena
    | 'ciclo'      // fecho de ciclo e relatorio
    | 'temporada'  // quest e missao de temporada
    | 'genesis'    // conquista exclusiva da Genesis
    | 'patente';   // subida de patente, com a insignia da patente atingida

const EMBLEMAS: Record<Exclude<TipoDeRecompensa, 'patente'>, string> = {
    geral: 'recompensa_geral.webp',
    missao: 'insignia_missao_prata.webp',
    ciclo: 'insignia_ciclo_bronze.webp',
    temporada: 'insignia_quest_temporada.webp',
    genesis: 'insignia_season_genesis.webp',
};

/**
 * As dez patentes, na ordem. O nome vem do evento ("Escudeiro"), e o arquivo
 * termina com o mesmo nome sem acento — e por isso que da para casar os dois
 * sem uma segunda tabela para manter em dia.
 */
const PATENTES = [
    'insignia_rank_1_vagante.webp',
    'insignia_rank_2_escudeiro.webp',
    'insignia_rank_3_cavaleiro.webp',
    'insignia_rank_4_lorde.webp',
    'insignia_rank_5_barao.webp',
    'insignia_rank_6_conde.webp',
    'insignia_rank_7_duque.webp',
    'insignia_rank_8_principe.webp',
    'insignia_rank_9_rei.webp',
    'insignia_rank_10_soberano.webp',
];

const semAcento = (valor: string) =>
    String(valor || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * O caminho do emblema. `nomeDaPatente` so importa quando o tipo e 'patente';
 * sem ele, ou com um nome que nao casa, cai na primeira — nunca fica sem
 * emblema, porque um suporte vazio no topo parece defeito.
 */
export const getRewardEmblemUrl = (tipo: TipoDeRecompensa, nomeDaPatente?: string | null): string => {
    if (tipo === 'patente') {
        const alvo = semAcento(nomeDaPatente || '');
        const achado = PATENTES.find((arquivo) => alvo && arquivo.includes(semAcento(alvo)));
        return `${CATALOG_INTERFACE_ROOT}/${achado || PATENTES[0]}`;
    }
    return `${CATALOG_INTERFACE_ROOT}/${EMBLEMAS[tipo]}`;
};

/**
 * O TOM de cada acontecimento, em RGB.
 *
 * A regra da direcao B: o fundo da placa e grafite, e a cor da recompensa
 * entra so como reflexo de metal — forte perto do topo, quase nada no resto.
 * Sem esta tabela os seis modais sao a mesma placa cinza, e a unica diferenca
 * entre "voce subiu de patente" e "voce resgatou um codigo" e o texto.
 *
 * Nao sao cores inventadas: saem da paleta canonica de raridade, menos o
 * bronze do ciclo e a prata da missao, que sao os metais das proprias
 * insignias — e o desenho delas que manda, nao a raridade do item.
 */
const TONS: Record<Exclude<TipoDeRecompensa, 'patente'>, string> = {
    geral: '245,158,11',      // ambar: o dourado do recompensa_geral.webp
    missao: '148,163,184',    // prata da insignia de missao
    ciclo: '184,115,51',      // bronze da insignia de ciclo
    temporada: '20,184,166',  // o verde-agua que rarityVisuals reserva para quest
    genesis: '123,97,255',    // mitico, a raridade da temporada
};

/**
 * A patente usa um reflexo unico de ouro antigo. A progressao ja esta toda no
 * emblema; trocar a placa para cinza nos primeiros graus parecia downgrade.
 */
export const getRewardToneRgb = (tipo: TipoDeRecompensa, nomeDaPatente?: string | null): string => {
    if (tipo !== 'patente') return TONS[tipo];
    void nomeDaPatente;
    return '184,146,82';
};
