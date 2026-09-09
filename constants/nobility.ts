import { NobilityRank, UnlockCategory } from '../types';

/**
 * A escada das dez patentes, ancorada em HORAS.
 *
 * A regua do jogo e ~1 EXP por minuto executado, entao cada limiar aqui e um
 * marco de tempo real. A curva antiga tinha dois defeitos que so aparecem
 * quando ela e vista inteira:
 *
 *  1. ACELERAVA E DEPOIS ACHATAVA. Os primeiros degraus dobravam (10k, 25k,
 *     50k, 100k) e os QUATRO ultimos eram identicos: +162.500 cada. Do Conde ao
 *     Soberano viravam 10.833 horas em ritmo constante, sem escalada nenhuma
 *     justo onde a escalada deveria ser sentida.
 *  2. O PRIMEIRO DEGRAU ERA LONGE DEMAIS. 10.000 EXP sao 167 horas — dois meses
 *     a tres horas por dia para sair de Vagante. A primeira promocao e a que
 *     ensina que a escada existe.
 *
 * Agora cada patente cai num numero redondo de HORAS, e o degrau cresce ate o
 * fim:
 *
 *   Escudeiro    100 h      Conde       2.000 h
 *   Cavaleiro    250 h      Duque       4.000 h
 *   Lorde        500 h      Principe    7.000 h
 *   Barao      1.000 h      Rei        11.000 h
 *                           Soberano   16.667 h  (o milhao de EXP)
 *
 * NINGUEM E REBAIXADO por esta troca: todos os limiares novos sao menores ou
 * iguais aos antigos, e a patente e derivada da EXP a cada leitura. Quem estava
 * numa patente continua nela ou sobe.
 *
 * `levelRequired` nao governa nada — nenhuma parte do app calcula nivel a
 * partir de EXP. Fica como rotulo.
 */
export const NOBILITY_RANKS: NobilityRank[] = [
    { id: 'vagante', name: 'Vagante', levelRequired: 1, expTotalRequired: 0 },
    { id: 'escudeiro', name: 'Escudeiro', levelRequired: 10, expTotalRequired: 6000 },
    { id: 'cavaleiro', name: 'Cavaleiro', levelRequired: 20, expTotalRequired: 15000 },
    { id: 'lorde', name: 'Lorde', levelRequired: 30, expTotalRequired: 30000 },
    { id: 'barao', name: 'Barão', levelRequired: 40, expTotalRequired: 60000 },
    { id: 'conde', name: 'Conde', levelRequired: 50, expTotalRequired: 120000 },
    { id: 'duque', name: 'Duque', levelRequired: 60, expTotalRequired: 240000 },
    { id: 'principe', name: 'Príncipe', levelRequired: 70, expTotalRequired: 420000 },
    { id: 'rei', name: 'Rei', levelRequired: 80, expTotalRequired: 660000 },
    { id: 'soberano', name: 'Soberano', levelRequired: 90, expTotalRequired: 1000000 },
];

/**
 * Escalada do Soberano 5.0 - todos os itens aqui sao exclusivos de patente.
 *
 * O REBALANCEAMENTO, e o que ele nao e.
 *
 * Contar itens por degrau da uma leitura errada: sugere que o Vagante (6 itens)
 * entrega mais que o Rei (4), quando o Vagante da tres skins tier 1 e o Rei da o
 * Crisol tier 4 e a Lenda Viva. Somando TIER — e tirando da conta a insignia,
 * que todo degrau tem, e o tema de UI, que so existe ate o Conde — a curva
 * antiga era:
 *
 *   4, 3, 4, 4, [2], 4, 5, 8, 12, 15
 *
 * Ela ja crescia. O defeito era pontual e estava no colchete: o BARAO custava
 * 1.000 horas e entregava um orbe tier 2 — menos que o Lorde, que custa metade.
 * Era o unico degrau da escada onde a entrega caia.
 *
 * O conserto nao inventou item nenhum. Havia NOVE pecas ja marcadas como
 * exclusivas de patente (portanto ja fora da loja de ouro, ja com arte pronta) e
 * que nenhum degrau entregava: sete cabelos cobrindo os tiers 1 a 5, uma borda e
 * um banner tier 3. Era arte paga que ninguem nunca ia ver.
 *
 * Distribuidas por tier, a curva vira:
 *
 *   4, 4, 5, 6, 8, 8, 8, 11, 12, 20
 *
 * Nao decrescente do primeiro ao ultimo degrau, e ninguem perdeu nada: todo item
 * que ja era de um degrau continua nele.
 *
 * O QUE CONTINUA TORTO e nao da para consertar aqui: os seis temas de UI acabam
 * no Conde. Duque, Principe, Rei e Soberano — os quatro degraus mais caros — nao
 * ganham a categoria mais visivel do jogo, porque so existem seis temas. Isso e
 * conteudo a produzir, nao distribuicao a corrigir.
 */
export const RANK_REWARDS: Record<string, { category: UnlockCategory; itemId: string; name: string }[]> = {
    vagante: [
        { category: 'ui_skins', itemId: 'FROST', name: 'Tema: Gelo Eterno' },
        { category: 'glyphs', itemId: 'item_glyph_1_001', name: 'Tábua Aprendiz' },
        { category: 'skins', itemId: 'item_skin_1_001', name: 'Náufrago' },
        { category: 'skins', itemId: 'item_skin_1_002', name: 'Casual' },
        { category: 'skins', itemId: 'item_skin_1_005', name: 'Caçador' },
        { category: 'insignias', itemId: 'insignia_rank_1_vagante', name: 'Insígnia: Vagante' },
    ],
    escudeiro: [
        { category: 'ui_skins', itemId: 'CYBER', name: 'Tema: Cyberpunk' },
        { category: 'skins', itemId: 'item_skin_1_004', name: 'Street' },
        { category: 'skins', itemId: 'item_skin_1_006', name: 'Casual 2' },
        { category: 'borders', itemId: 'item_border_t1_aprendiz', name: 'Borda: Aprendiz' },
        { category: 'hairStyles', itemId: 'cachos', name: 'Cabelo: Cachos' },
        { category: 'insignias', itemId: 'insignia_rank_2_escudeiro', name: 'Insígnia: Escudeiro' },
    ],
    cavaleiro: [
        { category: 'ui_skins', itemId: 'AURORA', name: 'Tema: Aurora Boreal' },
        { category: 'artifacts', itemId: 'item_artifact_1_005', name: 'Trio Café' },
        { category: 'skins', itemId: 'item_skin_2_003', name: 'Acadêmico' },
        { category: 'banners', itemId: 'item_banner_t1_aprendiz', name: 'Banner: Aprendiz' },
        { category: 'hairStyles', itemId: 'medio_reto', name: 'Cabelo: Médio Reto' },
        { category: 'insignias', itemId: 'insignia_rank_3_cavaleiro', name: 'Insígnia: Cavaleiro' },
    ],
    lorde: [
        { category: 'ui_skins', itemId: 'EMBER', name: 'Tema: Chama Viva' },
        { category: 'glyphs', itemId: 'item_glyph_2_002', name: 'Granito Rúnico' },
        { category: 'skins', itemId: 'item_skin_2_002', name: 'Tático' },
        { category: 'hairStyles', itemId: 'textured_crop', name: 'Cabelo: Texturizado' },
        { category: 'insignias', itemId: 'insignia_rank_4_lorde', name: 'Insígnia: Lorde' },
    ],
    barao: [
        { category: 'ui_skins', itemId: 'GOLD', name: 'Tema: Ouro Soberano' },
        { category: 'orbs', itemId: 'item_orb_2_002', name: 'Orbe Sombrio' },
        // O degrau que caia. Mil horas entregavam um orbe tier 2, menos que o
        // Lorde por metade do preco.
        { category: 'hairStyles', itemId: 'dreads', name: 'Cabelo: Dreads' },
        { category: 'borders', itemId: 'item_border_vanguarda_01', name: 'Borda: Vanguarda' },
        { category: 'insignias', itemId: 'insignia_rank_5_barao', name: 'Insígnia: Barão' },
    ],
    conde: [
        { category: 'ui_skins', itemId: 'VOID', name: 'Tema: Vazio Primordial' },
        { category: 'skins', itemId: 'item_skin_2_001', name: 'Executivo' },
        { category: 'borders', itemId: 'item_border_t2_veterano', name: 'Borda: Veterano' },
        { category: 'hairStyles', itemId: 'anime_spikes', name: 'Cabelo: Anime Spiky' },
        { category: 'insignias', itemId: 'insignia_rank_6_conde', name: 'Insígnia: Conde' },
    ],
    duque: [
        { category: 'glyphs', itemId: 'item_glyph_3_003', name: 'Mecanismo Rúnico' },
        { category: 'artifacts', itemId: 'item_artifact_2_003', name: 'Setup' },
        { category: 'banners', itemId: 'item_banner_vanguarda_01', name: 'Banner: Vanguarda' },
        { category: 'insignias', itemId: 'insignia_rank_7_duque', name: 'Insígnia: Duque' },
    ],
    principe: [
        { category: 'skins', itemId: 'item_skin_4_002', name: 'Mago Círculo' },
        { category: 'orbs', itemId: 'item_orb_4_001', name: 'Orbe de Diamante' },
        { category: 'hairStyles', itemId: 'mullet_topete', name: 'Cabelo: Mullet Top' },
        { category: 'insignias', itemId: 'insignia_rank_8_principe', name: 'Insígnia: Príncipe' },
    ],
    rei: [
        { category: 'glyphs', itemId: 'item_glyph_4_001', name: 'Crisol Geomântico' },
        { category: 'borders', itemId: 'item_border_4_001', name: 'Borda: Lenda Viva' },
        { category: 'artifacts', itemId: 'item_artifact_4_002', name: 'Dragão Bebê' },
        { category: 'insignias', itemId: 'insignia_rank_9_rei', name: 'Insígnia: Rei' },
    ],
    soberano: [
        { category: 'glyphs', itemId: 'item_glyph_5_001', name: 'A FORJA' },
        { category: 'skins', itemId: 'item_skin_5_001', name: 'Entidade de Luz' },
        { category: 'orbs', itemId: 'item_orb_5_001', name: 'Orbe Gênese' },
        { category: 'hairStyles', itemId: 'fluxo_espiritual', name: 'Cabelo: Fluxo Espiritual' },
        { category: 'insignias', itemId: 'insignia_rank_10_soberano', name: 'Insígnia: Soberano' },
    ],
};
