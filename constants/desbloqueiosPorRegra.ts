import type { LifeAreaId } from './lifeAreas';

/**
 * AS DEZ REGRAS DE BORDA E BANNER.
 *
 * Em 20/09/2026 borda e banner sairam da escada de patente. O motivo saiu de
 * contar: das 33 pecas, UMA tem nome de patente — a Borda Soberano. As outras
 * 32 ficavam num degrau sem dizer por que, e "Imparavel" no Duque nao explica
 * nada a quem chegou no Duque.
 *
 * Elas passam a sair por CONDICAO, e o nome de cada uma ja dizia qual:
 * Disciplinado e constancia, Popular e gente, Vanguarda e ter chegado cedo.
 *
 * E sao DEZ regras para 32 pecas, nao 32. Borda e banner vem em PAR: catorze
 * nomes existem dos dois lados, e uma condicao cumprida libera os dois. Dos
 * dezoito nomes, oito ficam de fora: Aprendiz vai no pacote
 * inicial, Soberano fica no degrau 10, Aurora II e Genesis sao de temporada,
 * GM e de staff, Origem esta aposentado — e a Vanguarda vem por codigo de
 * resgate, que e porta e nao condicao.
 *
 * O QUE ESTE ARQUIVO E, E O QUE ELE NAO E.
 *
 * Ele e a DECLARACAO: qual condicao libera o que, e com que frase. Ele nao mede
 * nada — nenhuma funcao aqui olha o banco. O medidor e a outra metade, e ainda
 * nao existe.
 *
 * Existir so a declaracao ja paga o proprio custo. Antes dela, quatro pecas
 * estavam simplesmente perdidas: sairam da escada, nao tem preco e nao caem de
 * bau, e nada no codigo dizia que elas deveriam vir de algum lugar. Agora elas
 * estao DECLARADAS, faltando o medidor — que e uma pendencia, e nao um sumico.
 * O tests/regras-de-desbloqueio guarda isso: toda borda e todo banner ou tem
 * porta, ou tem regra aqui.
 *
 * A ENTREGA JA EXISTE. O `SKIN_SEASON_UNLOCKS` liga item a condicao cumprida e o
 * `BorderSelectionModal` ja o consulta para liberar borda. Quando o medidor
 * chegar, e nele que estas regras se plugam.
 */

/**
 * A condicao, dita de um jeito que da para medir.
 *
 * Oito das dez usam dado que o app ja guarda: sequencia, data de criacao da
 * conta, vinculos, nota do relatorio, contagem de acoes. Duas — Mistico e
 * Celestial — pedem a MESMA leitura nova: quantas arenas de tal area foram
 * FECHADAS neste ciclo. Fechadas, nao criadas: abrir cinco arenas e abandonar
 * nao pode valer premio.
 */
export type CondicaoDeDesbloqueio =
    /** Fechar um ciclo sem falhar nenhuma acao. */
    | { tipo: 'ciclo_sem_falha' }
    /** Ter N amizades ao mesmo tempo. Amizade, nao vinculo de arena. */
    | { tipo: 'amizades'; quantas: number }
    /** Fechar ciclos que toquem N meses diferentes. Tempo de conta nao serve:
     *  bastaria esperar, e esperar nao e jogar. */
    | { tipo: 'ciclos_em_meses_distintos'; quantos: number }
    /** N dias seguidos sem quebrar a sequencia. */
    | { tipo: 'sequencia_de_dias'; dias: number }
    /** N arenas de uma area FECHADAS no mesmo ciclo. */
    | { tipo: 'arenas_da_area_no_ciclo'; area: LifeAreaId; quantas: number }
    /** Uma arena fechada em CADA uma das cinco areas, no mesmo ciclo. */
    | { tipo: 'arena_em_cada_area_no_ciclo' }
    /** Um ciclo grande E bem executado ao mesmo tempo. */
    | { tipo: 'ciclo_com_volume'; acoes: number; conclusaoMinima: number }
    /** N mentorias concluidas como mentor. Uma so viraria bonus obvio. */
    | { tipo: 'mentorias_concluidas'; quantas: number }
    /** N missoes individuais completas — quem as entrega e o oraculo. */
    | { tipo: 'missoes_individuais'; quantas: number }
    /** N acoes concluidas na vida toda. */
    | { tipo: 'acoes_concluidas'; quantas: number };

export interface RegraDeDesbloqueio {
    /** O nome que a borda e o banner dividem. */
    nome: string;
    /** O par. Quase sempre dois ids; um so quando a peca nao tem irma. */
    itens: string[];
    condicao: CondicaoDeDesbloqueio;
    /** O que a quest invisivel diz quando cumpre. Frase curta, no que a pessoa
     *  fez — nao no que o sistema registrou. */
    frase: string;
}

export const REGRAS_DE_DESBLOQUEIO: RegraDeDesbloqueio[] = [
    {
        nome: 'Disciplinado',
        itens: ['item_border_1_002', 'item_banner_disciplinado'],
        condicao: { tipo: 'ciclo_sem_falha' },
        frase: 'Você fechou um ciclo sem deixar nenhuma ação para trás.',
    },
    {
        nome: 'Popular',
        itens: ['item_border_2_001', 'item_banner_popular'],
        condicao: { tipo: 'amizades', quantas: 5 },
        frase: 'Cinco pessoas por perto.',
    },
    {
        nome: 'Veterano',
        itens: ['item_border_t2_veterano', 'item_banner_t2_veterano'],
        condicao: { tipo: 'ciclos_em_meses_distintos', quantos: 3 },
        frase: 'Três meses diferentes, e você fechou ciclo em todos.',
    },
    {
        nome: 'Imparável',
        itens: ['item_border_3_001', 'item_banner_imparavel'],
        condicao: { tipo: 'sequencia_de_dias', dias: 30 },
        frase: 'Trinta dias seguidos sem quebrar.',
    },
    {
        // A area `proposito` se chama, por extenso, PROPOSITO & ESPIRITUALIDADE.
        // O nome da borda ja apontava para ela; faltava so reparar.
        nome: 'Místico',
        itens: ['item_border_t3_mistico', 'item_banner_t3_mistico'],
        condicao: { tipo: 'arenas_da_area_no_ciclo', area: 'proposito', quantas: 2 },
        frase: 'Duas arenas de propósito fechadas no mesmo ciclo.',
    },
    {
        nome: 'Transcendente',
        itens: ['item_border_t3_transcendente', 'item_banner_t4_transcendente'],
        condicao: { tipo: 'ciclo_com_volume', acoes: 100, conclusaoMinima: 90 },
        frase: 'Cem ações num ciclo, e noventa por cento delas concluídas.',
    },
    {
        nome: 'Celestial',
        itens: ['item_border_t4_celestial', 'item_banner_t4_celestial'],
        condicao: { tipo: 'arena_em_cada_area_no_ciclo' },
        frase: 'Uma arena fechada em cada uma das cinco áreas, no mesmo ciclo.',
    },
    {
        nome: 'Guardiã',
        itens: ['item_border_t4_guardia', 'item_banner_t4_guardia'],
        condicao: { tipo: 'mentorias_concluidas', quantas: 2 },
        frase: 'Duas mentorias levadas até o fim.',
    },
    {
        nome: 'Oráculo',
        itens: ['item_border_t4_oraculo', 'item_banner_t4_oraculo'],
        condicao: { tipo: 'missoes_individuais', quantas: 2 },
        frase: 'Duas missões do oráculo, completas.',
    },
    {
        nome: 'Lenda Viva',
        itens: ['item_border_4_001', 'item_banner_lendaviva'],
        condicao: { tipo: 'acoes_concluidas', quantas: 1000 },
        frase: 'Mil ações concluídas.',
    },
];

/**
 * A VANGUARDA NAO E REGRA, e por isso nao esta na lista acima.
 *
 * Ela vem com o codigo de resgate — 25 unidades, e as pecas dela nao podem
 * cair de bau depois. E porta de codigo, nao de condicao, e misturar as duas
 * faria a lista de regras mentir sobre o proprio tamanho.
 */
export const ITENS_DA_VANGUARDA = ['item_border_vanguarda_01', 'item_banner_vanguarda_01'];

/** Todo item que alguma regra libera, para quem precisa so da lista. */
export const ITENS_LIBERADOS_POR_REGRA = new Set(
    REGRAS_DE_DESBLOQUEIO.flatMap((regra) => regra.itens),
);
