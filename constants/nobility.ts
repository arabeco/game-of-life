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
 * O CABELO SAIU DAQUI, e a conta acima nao vale mais.
 *
 * Cabelo e corpo sao APARENCIA, nao inventario: o jogador entra com os oito
 * penteados e as 26 variantes de cor, como entra com os oito corpos. Quem manda
 * nisso e o filtro de posse do SovereignCustomizer, que libera a categoria
 * inteira, e o ciclador de corpo, que le o BODY_DB direto sem olhar posse.
 *
 * Os sete cabelos entao nao tapavam buraco nenhum — anunciavam, com modal de
 * promocao, uma peca que a pessoa ja tinha desde o primeiro minuto. A curva que
 * eles maquiavam era esta, contando so o que de fato muda de mao:
 *
 *   vagante 5 · escudeiro 4 · cavaleiro 4 · lorde 3 · barao 3
 *   conde 3 · duque 3 · principe 2 · rei 3 · soberano 3
 *
 * O buraco do Barao continua aberto, e o Principe esta pior ainda. Nao da para
 * fechar os dois aqui: nao sobrou peca sem dono no catalogo. E conteudo a
 * produzir — as skins novas nascem para estes degraus, nao para o comeco.
 *
 * O QUE TAMBEM CONTINUA TORTO: os seis temas de UI acabam no Conde. Duque,
 * Principe, Rei e Soberano — os quatro degraus mais caros — nao ganham a
 * categoria mais visivel do jogo, porque so existem seis temas.
 *
 * O VAGANTE NAO E ENTREGUE AQUI. Ninguem e promovido a Vagante: entra-se nele.
 * Quem entrega essa lista e o starter pack do sql/new_player_bootstrap_rewards,
 * no cadastro. A lista fica declarada neste arquivo porque a NobilityLadder a
 * exibe, e porque o degrau zero ter conteudo visivel e o que ensina que a escada
 * existe.
 */
export const RANK_REWARDS: Record<string, { category: UnlockCategory; itemId: string; name: string }[]> = {
    // O VAGANTE SO PODE LISTAR O QUE O PACOTE INICIAL ENTREGA.
    //
    // Ninguem e promovido a Vagante — entra-se nele — entao nao ha modal de
    // promocao para entregar nada aqui. Quem entrega e o
    // `sql/new_player_bootstrap_rewards.sql`; esta lista so EXIBE, na
    // NobilityLadder. Por isso o degrau 1 nao ganhou borda, banner nem aura
    // junto com os outros: sem passar pelo SQL, seriam tres promessas que
    // nunca chegam.
    //
    // E por isso as quatro roupas continuam aqui. Nao e duplicata do pacote: e
    // o pacote, mostrado. O piso de quatro esta no
    // tests/starter-e-patentes.regression.mjs — a primeira promocao custa 100
    // horas, e ate la o vestuario e o unico lugar do jogo onde a pessoa se ve.
    vagante: [
        { category: 'ui_skins', itemId: 'FROST', name: 'Tema: Gelo Eterno' },
        { category: 'skins', itemId: 'item_skin_1_001', name: 'Náufrago' },
        { category: 'skins', itemId: 'item_skin_1_002', name: 'Casual' },
        { category: 'skins', itemId: 'item_skin_1_005', name: 'Caçador' },
        { category: 'skins', itemId: 'item_skin_1_006', name: 'Casual 2' },
        { category: 'skins', itemId: 'item_skin_1_004', name: 'Street' },
        { category: 'skins', itemId: 'item_skin_1_007', name: 'Pijama' },
        { category: 'skins', itemId: 'item_skin_1_008', name: 'Corrida' },
        { category: 'skins', itemId: 'item_skin_1_009', name: 'Chuva' },
        { category: 'skins', itemId: 'item_skin_1_010', name: 'Verão' },
        { category: 'insignias', itemId: 'insignia_rank_1_vagante', name: 'Insígnia: Vagante' },
    ],
    // Dos degraus 2 ao 10 a regra e uma so: UMA de cada categoria por degrau,
    // com a raridade subindo junto. Borda, banner e aura eram os tres mais
    // vazios da escada — 4, 2 e 0 degraus de dez — e nenhum deles precisou de
    // desenho novo: os itens ja existiam, so estavam todos na loja.
    escudeiro: [
        { category: 'ui_skins', itemId: 'GOLD', name: 'Tema: Ouro Soberano' },
        { category: 'skins', itemId: 'item_skin_1_011', name: 'Escudeiro' },
        { category: 'auras', itemId: 'item_aura_1_001', name: 'Aura: Bruma' },
        { category: 'insignias', itemId: 'insignia_rank_2_escudeiro', name: 'Insígnia: Escudeiro' },
    ],
    cavaleiro: [
        { category: 'ui_skins', itemId: 'CYBER', name: 'Tema: Cyberpunk' },
        { category: 'skins', itemId: 'item_skin_2_005', name: 'Cavaleiro' },
        { category: 'auras', itemId: 'item_aura_1_002', name: 'Aura: Safira' },
        { category: 'artifacts', itemId: 'item_artifact_1_005', name: 'Trio Café' },
        { category: 'insignias', itemId: 'insignia_rank_3_cavaleiro', name: 'Insígnia: Cavaleiro' },
    ],
    lorde: [
        { category: 'ui_skins', itemId: 'EMBER', name: 'Tema: Chama Viva' },
        { category: 'skins', itemId: 'item_skin_2_006', name: 'Lorde' },
        { category: 'auras', itemId: 'item_aura_1_003', name: 'Aura: Rubi' },
        { category: 'insignias', itemId: 'insignia_rank_4_lorde', name: 'Insígnia: Lorde' },
    ],
    // O degrau que caia. Mil horas entregavam um orbe tier 2 e mais nada —
    // menos que o Lorde por metade do preco. A roupa que fecha o buraco nao
    // precisou ser desenhada: o SKIN_T2_MILITAR.png estava no disco, pago e
    // pronto, sem item nenhum apontando para ele.
    barao: [
        { category: 'ui_skins', itemId: 'AURORA', name: 'Tema: Aurora Boreal' },
        { category: 'skins', itemId: 'item_skin_2_007', name: 'Barão' },
        { category: 'auras', itemId: 'item_aura_2_001', name: 'Aura: Esmeralda' },
        { category: 'insignias', itemId: 'insignia_rank_5_barao', name: 'Insígnia: Barão' },
    ],
    conde: [
        { category: 'ui_skins', itemId: 'VOID', name: 'Tema: Vazio Primordial' },
        { category: 'skins', itemId: 'item_skin_3_004', name: 'Conde' },
        { category: 'auras', itemId: 'item_aura_2_002', name: 'Aura: Prata' },
        { category: 'insignias', itemId: 'insignia_rank_6_conde', name: 'Insígnia: Conde' },
    ],
    duque: [
        { category: 'skins', itemId: 'item_skin_3_005', name: 'Duque' },
        { category: 'auras', itemId: 'item_aura_3_001', name: 'Aura: Ouro' },
        { category: 'artifacts', itemId: 'item_artifact_2_003', name: 'Setup' },
        { category: 'insignias', itemId: 'insignia_rank_7_duque', name: 'Insígnia: Duque' },
    ],
    principe: [
        { category: 'skins', itemId: 'item_skin_4_003', name: 'Príncipe' },
        { category: 'auras', itemId: 'item_aura_4_001', name: 'Aura: Eclipse' },
        { category: 'insignias', itemId: 'insignia_rank_8_principe', name: 'Insígnia: Príncipe' },
    ],
    rei: [
        { category: 'skins', itemId: 'item_skin_4_004', name: 'Rei' },
        { category: 'auras', itemId: 'item_aura_5_001', name: 'Aura: Pedra da Lua' },
        { category: 'artifacts', itemId: 'item_artifact_4_002', name: 'Dragão Bebê' },
        { category: 'insignias', itemId: 'insignia_rank_9_rei', name: 'Insígnia: Rei' },
    ],
    soberano: [
        { category: 'skins', itemId: 'item_skin_5_001', name: 'Soberano' },
        { category: 'borders', itemId: 'item_border_4_002', name: 'Borda: Soberano' },
        { category: 'auras', itemId: 'item_aura_5_002', name: 'Aura: Multiverso' },
        { category: 'insignias', itemId: 'insignia_rank_10_soberano', name: 'Insígnia: Soberano' },
    ],
};
