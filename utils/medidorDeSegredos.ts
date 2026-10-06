import { REGRAS_DE_DESBLOQUEIO, type CondicaoDeDesbloqueio, type RegraDeDesbloqueio } from '../constants/desbloqueiosPorRegra';
import { LIFE_AREAS } from '../constants/lifeAreas';
import { resolveItemDef } from '../constants/items';

export { REGRAS_DE_DESBLOQUEIO };

/**
 * O MEDIDOR DAS REGRAS SECRETAS.
 *
 * Recebe os numeros que o banco conta (minhas_marcas_secretas) e decide quais
 * regras foram cumpridas. A decisao mora so aqui, em cima da declaracao de
 * constants/desbloqueiosPorRegra.ts: o SQL nao repete nenhuma regra.
 */

export const MARCA_DE_SEGREDO = 'segredo:';

export interface CicloFechadoResumo {
    fim: string;
    dias: number;
    nota: string | null;
    feitas: number | null;
    planejadas: number | null;
    arenasFechadasPorArea: Record<string, number> | null;
}

export interface FatosDeSegredo {
    acoesConcluidas: number;
    maiorSequencia: number;
    maiorDia: number;
    diasSeguidosComCincoAreas: number;
    maiorSemanaAntesDasSete: number;
    paginasDoDiario: number;
    diasDeHumor: number;
    amizades: number;
    competicoesVencidas: number;
    missoesDoOraculo: number;
    mentoriasAteOFim: number;
    ciclos: CicloFechadoResumo[];
}

const ORDEM_DAS_NOTAS = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
const notaAlcanca = (nota: string | null, minima: string) => {
    const posicao = ORDEM_DAS_NOTAS.indexOf(String(nota || ''));
    return posicao >= 0 && posicao >= ORDEM_DAS_NOTAS.indexOf(minima);
};

/** As cinco areas da vida, sem a "geral", que nao e area. */
const AREAS: string[] = LIFE_AREAS.map((area) => area.id as string).filter((id) => id !== 'geral');

const fechadasNaArea = (ciclo: CicloFechadoResumo, area: string) => Number(ciclo.arenasFechadasPorArea?.[area] || 0);

export const condicaoCumprida = (condicao: CondicaoDeDesbloqueio, fatos: FatosDeSegredo): boolean => {
    const ciclos = fatos.ciclos || [];
    switch (condicao.tipo) {
        case 'ciclo_sem_falha':
            return ciclos.some((c) => (
                Number(c.planejadas) > 0
                && Number(c.feitas) >= Number(c.planejadas)
                && notaAlcanca(c.nota, condicao.notaMinima)
            ));
        case 'amizades':
            return fatos.amizades >= condicao.quantas;
        case 'ciclos_em_meses_distintos':
            return new Set(ciclos.map((c) => String(c.fim).slice(0, 7))).size >= condicao.quantos;
        case 'sequencia_de_dias':
            return fatos.maiorSequencia >= condicao.dias;
        case 'arenas_da_area_no_ciclo':
            return ciclos.some((c) => fechadasNaArea(c, condicao.area) >= condicao.quantas);
        case 'arena_em_cada_area_no_ciclo':
            return ciclos.some((c) => AREAS.every((area) => fechadasNaArea(c, area) >= 1));
        case 'ciclo_com_volume':
            return ciclos.some((c) => (
                Number(c.planejadas) >= condicao.acoes
                && Number(c.feitas) * 100 >= Number(c.planejadas) * condicao.conclusaoMinima
            ));
        case 'mentorias_concluidas':
            return fatos.mentoriasAteOFim >= condicao.quantas;
        case 'missoes_individuais':
            return fatos.missoesDoOraculo >= condicao.quantas;
        case 'acoes_concluidas':
            return fatos.acoesConcluidas >= condicao.quantas;
        case 'paginas_do_diario':
            return fatos.paginasDoDiario >= condicao.quantas;
        case 'dia_com_acoes':
            return fatos.maiorDia >= condicao.quantas;
        case 'ciclos_fechados':
            return ciclos.length >= condicao.quantos;
        case 'competicoes_vencidas':
            return fatos.competicoesVencidas >= condicao.quantas;
        case 'dias_de_humor':
            return fatos.diasDeHumor >= condicao.dias;
        case 'acoes_antes_das_sete_numa_semana':
            return fatos.maiorSemanaAntesDasSete >= condicao.quantas;
        case 'dias_seguidos_com_as_cinco_areas':
            return fatos.diasSeguidosComCincoAreas >= condicao.dias;
        case 'ciclo_com_nota':
            return ciclos.some((c) => notaAlcanca(c.nota, condicao.nota));
        default:
            return false;
    }
};

/** As regras ja descobertas, lidas das marcas `segredo:<id>` do perfil. */
export const lerDescobertas = (marcas?: string[] | null): Set<string> => new Set(
    (marcas || [])
        .filter((marca) => typeof marca === 'string' && marca.startsWith(MARCA_DE_SEGREDO))
        .map((marca) => marca.slice(MARCA_DE_SEGREDO.length)),
);

/**
 * O que destravou agora: cumprida, ainda nao descoberta, e com o premio inteiro
 * visivel. Regra cujo premio ainda nao tem arte fica de fora — e, como as
 * condicoes contam o passado, destrava sozinha quando a arte chegar.
 */
export const novasConquistas = ({ fatos, regras, descobertas, arteVisivel }: {
    fatos: FatosDeSegredo;
    regras: RegraDeDesbloqueio[];
    descobertas: Set<string>;
    arteVisivel: (itemId: string) => boolean;
}): RegraDeDesbloqueio[] => regras.filter((regra) => (
    !descobertas.has(regra.id)
    && regra.itens.every(arteVisivel)
    && condicaoCumprida(regra.condicao, fatos)
));

const CATEGORIA_DE_DESBLOQUEIO: Record<string, string> = { border: 'borders', banner: 'banners', skin: 'skins' };

/**
 * Um modal so, mesmo quando varias destravam juntas. O fecho do ciclo ja
 * empilha relatorio, bau e as vezes patente; segredo nao entra nessa pilha um
 * por um.
 */
export const montarModalDeSegredos = (regras: RegraDeDesbloqueio[]) => {
    const itens = regras.flatMap((regra) => regra.itens);
    return {
        id: MARCA_DE_SEGREDO + regras.map((regra) => regra.id).join('+'),
        secreta: true,
        title: regras.map((regra) => regra.nome).join(' · '),
        frase: regras.length === 1
            ? regras[0].frase
            : `${regras.length} segredos descobertos. Eles estão em Missões, em Segredos.`,
        icon: '\u{1F513}',
        reward: {
            exp: 0,
            items: itens,
            rewardDetails: itens.map((itemId) => {
                const def = resolveItemDef(itemId);
                return {
                    category: CATEGORIA_DE_DESBLOQUEIO[def?.category || ''] || 'borders',
                    itemId,
                    name: def?.name || itemId,
                };
            }),
        },
    };
};
