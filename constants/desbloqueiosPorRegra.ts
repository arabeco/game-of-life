import type { LifeAreaId } from './lifeAreas';

/**
 * AS VINTE REGRAS SECRETAS.
 *
 * Em 20/09/2026 borda e banner sairam da escada de patente. O motivo saiu de
 * contar: das 33 pecas, UMA tem nome de patente — a Borda Soberano. As outras
 * 32 ficavam num degrau sem dizer por que, e "Imparavel" no Duque nao explica
 * nada a quem chegou no Duque.
 *
 * Elas passaram a sair por CONDICAO, e o nome de cada uma ja dizia qual:
 * Disciplinado e constancia, Popular e gente, Vanguarda e ter chegado cedo.
 * Borda e banner vem em PAR: uma condicao cumprida libera os dois. Das pecas
 * que existiam, ficam fora das regras: Aprendiz (pacote inicial), Soberano
 * (degrau 10), Aurora II e Genesis (temporada), GM (staff), Origem
 * (aposentado) e a Vanguarda, que vem por codigo de resgate — porta, e nao
 * condicao.
 *
 * Em 06/10/2026 entraram mais dez, com premio proprio: cinco dao uma ROUPA nova
 * e cinco dao um par novo. A arte delas foi encomendada em
 * docs/2026-10-06-handoff-arte-das-regras-secretas.md; ate ela chegar, o
 * premio fica escondido e a regra nao dispara.
 *
 * O QUE ESTE ARQUIVO E, E O QUE ELE NAO E.
 *
 * Ele e a DECLARACAO, e a unica: qual condicao libera o que, e com que frase.
 * Quem decide se a condicao foi cumprida e utils/medidorDeSegredos.ts, em cima
 * dos numeros que o banco conta (minhas_marcas_secretas). O SQL nao repete
 * nenhuma regra — duas copias da mesma regra acabariam discordando.
 *
 * Peca de regra sai SO pela regra: `isRuleExclusive` no catalogo a tira da
 * loja, do bau e da forja. O tests/regras-de-desbloqueio guarda isso.
 *
 * Em 26/10/2026 (decidido com o Afonso) vieram as de MEIO E FIM DE JOGO: treze
 * novas, e EXP em todas, pela raridade (EXP_POR_RARIDADE). Quatro pares sairam
 * de missoes pequenas e foram para as grandes do mesmo tema, levando o nome e
 * subindo de raridade: Popular (5 -> 10 amigos), Veterano (3 meses -> 1 ano),
 * Disciplinado (1 ciclo A -> 100 dias fortes) e Imparavel (30 -> 100 dias
 * seguidos). As pequenas mantem o id — a condicao e a mesma, entao quem ja a
 * cumpriu continua com ela — e passam a dar so EXP, com nome novo.
 */

/**
 * A condicao, dita de um jeito que da para medir.
 *
 * Quase todas usam dado que o banco ja guardava. Duas — Mistico e Celestial —
 * pedem a MESMA leitura, que so passou a existir em 06/10/2026: quantas arenas
 * de tal area foram FECHADAS no ciclo. Fechadas, nao criadas: abrir cinco
 * arenas e abandonar nao pode valer premio.
 */
export type CondicaoDeDesbloqueio =
    /** Fechar um ciclo sem falhar nenhuma acao, com a nota que o ciclo selou
     *  (o `grade` do relatorio) igual ou acima de `notaMinima`. */
    | { tipo: 'ciclo_sem_falha'; notaMinima: 'A' | 'S' | 'SS' | 'SSS' }
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
    /** N missoes individuais completas — quem as entrega e o oraculo. Sem
     *  contar a missao inicial do onboarding (pacto `primeira`). */
    | { tipo: 'missoes_individuais'; quantas: number }
    /** N acoes concluidas na vida toda. */
    | { tipo: 'acoes_concluidas'; quantas: number }
    /** N paginas do diario com pelo menos 100 caracteres. */
    | { tipo: 'paginas_do_diario'; quantas: number }
    /** Um dia com N acoes concluidas. */
    | { tipo: 'dia_com_acoes'; quantas: number }
    /** N ciclos fechados na vida toda. */
    | { tipo: 'ciclos_fechados'; quantos: number }
    /** N competicoes vencidas. */
    | { tipo: 'competicoes_vencidas'; quantas: number }
    /** Humor registrado em N dias diferentes. */
    | { tipo: 'dias_de_humor'; dias: number }
    /** N acoes marcadas entre 04:00 e 06:59 dentro de 7 dias seguidos. */
    | { tipo: 'acoes_antes_das_sete_numa_semana'; quantas: number }
    /** N dias seguidos com acao concluida nas cinco areas. */
    | { tipo: 'dias_seguidos_com_as_cinco_areas'; dias: number }
    /** Um ciclo que selou esta nota, ou acima. */
    | { tipo: 'ciclo_com_nota'; nota: 'A' | 'S' | 'SS' | 'SSS' }
    /** N dias entre a primeira e a ultima acao concluida. Esperar sem jogar
     *  nao conta: a ultima acao tem de existir. */
    | { tipo: 'dias_entre_primeira_e_ultima_acao'; dias: number }
    /** A MESMA acao (mesmo id) concluida N vezes. Copiar a arena recomeca. */
    | { tipo: 'mesma_acao_repetida'; vezes: number }
    /** N ciclos fechados com pelo menos `diasMinimos` dias cada. */
    | { tipo: 'ciclos_longos'; quantos: number; diasMinimos: number }
    /** N arenas concluidas com meta final. */
    | { tipo: 'arenas_com_meta_concluidas'; quantas: number }
    /** N dias em que o fecho do dia depositou mais de `exp` de EXP. */
    | { tipo: 'dias_com_exp'; dias: number; exp: number };

export type RaridadeDaRegra = 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario';

/** O EXP de cada missao secreta vem da raridade dela (26/10/2026). */
export const EXP_POR_RARIDADE: Record<RaridadeDaRegra, number> = {
    comum: 1000,
    incomum: 3000,
    raro: 5000,
    epico: 10000,
    lendario: 20000,
};

export interface RegraDeDesbloqueio {
    /** O que fica gravado como `segredo:<id>` no perfil. Nunca muda: trocar o id
     *  de uma regra ja descoberta faria ela ser descoberta de novo. */
    id: string;
    /** O nome da missao: o do par ou da roupa, quando ela da um. */
    nome: string;
    /** O par, a roupa sozinha, ou nada (missao so de EXP). */
    itens: string[];
    /** A dificuldade, que decide o EXP (EXP_POR_RARIDADE). */
    raridade: RaridadeDaRegra;
    condicao: CondicaoDeDesbloqueio;
    /** O que o modal diz quando cumpre. Frase curta, no que a pessoa fez — nao
     *  no que o sistema registrou. */
    frase: string;
}

export const REGRAS_DE_DESBLOQUEIO: RegraDeDesbloqueio[] = [
    {
        // 100% sozinho nao bastava: um ciclo de uma acao so tambem fecha em 100%.
        // A nota A traz o porte junto — sete dias e 35 horas, pela tabela de
        // utils/cycleGrade.js —, entao a regra pede as duas coisas. Decidido em
        // 06/10/2026.
        id: 'disciplinado',
        nome: 'Primeiro Selo',
        itens: [],
        raridade: 'incomum',
        condicao: { tipo: 'ciclo_sem_falha', notaMinima: 'A' },
        frase: 'Feche um ciclo com nota A ou mais, sem deixar nenhuma ação para trás',
    },
    {
        id: 'popular',
        nome: 'Enturmado',
        itens: [],
        raridade: 'incomum',
        condicao: { tipo: 'amizades', quantas: 5 },
        frase: 'Faça cinco amizades no Glyph',
    },
    {
        id: 'veterano',
        nome: 'Estações',
        itens: [],
        raridade: 'incomum',
        condicao: { tipo: 'ciclos_em_meses_distintos', quantos: 3 },
        frase: 'Feche ciclos em três meses diferentes',
    },
    {
        id: 'imparavel',
        nome: 'Constante',
        itens: [],
        raridade: 'raro',
        condicao: { tipo: 'sequencia_de_dias', dias: 30 },
        frase: 'Conclua ações em trinta dias seguidos',
    },
    {
        // A area `proposito` se chama, por extenso, PROPOSITO & ESPIRITUALIDADE.
        // O nome da borda ja apontava para ela; faltava so reparar.
        id: 'mistico',
        nome: 'Místico',
        itens: ['item_border_t3_mistico', 'item_banner_t3_mistico'],
        raridade: 'raro',
        condicao: { tipo: 'arenas_da_area_no_ciclo', area: 'proposito', quantas: 2 },
        frase: 'Feche duas arenas de Propósito no mesmo ciclo',
    },
    {
        id: 'transcendente',
        nome: 'Transcendente',
        itens: ['item_border_t3_transcendente', 'item_banner_t4_transcendente'],
        raridade: 'epico',
        condicao: { tipo: 'ciclo_com_volume', acoes: 100, conclusaoMinima: 90 },
        frase: 'Planeje cem ações num ciclo e conclua noventa por cento delas',
    },
    {
        id: 'celestial',
        nome: 'Celestial',
        itens: ['item_border_t4_celestial', 'item_banner_t4_celestial'],
        raridade: 'epico',
        condicao: { tipo: 'arena_em_cada_area_no_ciclo' },
        frase: 'Feche uma arena em cada uma das cinco áreas, no mesmo ciclo',
    },
    {
        id: 'guardia',
        nome: 'Guardiã',
        itens: ['item_border_t4_guardia', 'item_banner_t4_guardia'],
        raridade: 'epico',
        condicao: { tipo: 'mentorias_concluidas', quantas: 2 },
        frase: 'Leve duas mentorias até o fim',
    },
    {
        id: 'oraculo',
        nome: 'Oráculo',
        itens: ['item_border_t4_oraculo', 'item_banner_t4_oraculo'],
        raridade: 'raro',
        condicao: { tipo: 'missoes_individuais', quantas: 2 },
        frase: 'Cumpra duas missões individuais do Oráculo',
    },
    {
        id: 'lenda-viva',
        nome: 'Lenda Viva',
        itens: ['item_border_4_001', 'item_banner_lendaviva'],
        raridade: 'epico',
        condicao: { tipo: 'acoes_concluidas', quantas: 1000 },
        frase: 'Conclua mil ações',
    },

    // --- AS DEZ DE 06/10/2026: cinco roupas e cinco pares novos ---
    {
        id: 'escriba',
        nome: 'Escriba',
        itens: ['item_skin_1_012'],
        raridade: 'comum',
        condicao: { tipo: 'paginas_do_diario', quantas: 10 },
        frase: 'Escreva dez páginas no seu diário',
    },
    {
        id: 'maratona',
        nome: 'Maratona',
        itens: ['item_skin_2_010'],
        raridade: 'incomum',
        condicao: { tipo: 'dia_com_acoes', quantas: 12 },
        frase: 'Conclua doze ações num dia só',
    },
    {
        id: 'anciao',
        nome: 'Ancião',
        itens: ['item_skin_3_009'],
        raridade: 'raro',
        condicao: { tipo: 'ciclos_fechados', quantos: 12 },
        frase: 'Feche doze ciclos',
    },
    {
        id: 'campeao',
        nome: 'Campeão',
        itens: ['item_skin_4_005'],
        raridade: 'epico',
        condicao: { tipo: 'competicoes_vencidas', quantas: 3 },
        frase: 'Vença três competições',
    },
    {
        // O passo acima da Lenda Viva: mil acoes viram cinco mil.
        id: 'imperador',
        nome: 'Imperador',
        itens: ['item_skin_5_003'],
        raridade: 'lendario',
        condicao: { tipo: 'acoes_concluidas', quantas: 5000 },
        frase: 'Conclua cinco mil ações',
    },
    {
        id: 'sereno',
        nome: 'Sereno',
        itens: ['item_border_t2_sereno', 'item_banner_t2_sereno'],
        raridade: 'incomum',
        condicao: { tipo: 'dias_de_humor', dias: 30 },
        frase: 'Registre seu humor em trinta dias',
    },
    {
        id: 'alvorada',
        nome: 'Alvorada',
        itens: ['item_border_t3_alvorada', 'item_banner_t3_alvorada'],
        raridade: 'raro',
        condicao: { tipo: 'acoes_antes_das_sete_numa_semana', quantas: 10 },
        frase: 'Conclua dez ações antes das sete, numa semana só',
    },
    {
        id: 'prisma',
        nome: 'Prisma',
        itens: ['item_border_t3_prisma', 'item_banner_t3_prisma'],
        raridade: 'raro',
        condicao: { tipo: 'dias_seguidos_com_as_cinco_areas', dias: 14 },
        frase: 'Toque as cinco áreas por catorze dias seguidos',
    },
    {
        // O passo acima do Oraculo: duas missoes viram cinco.
        id: 'profeta',
        nome: 'Profeta',
        itens: ['item_border_t4_profeta', 'item_banner_t4_profeta'],
        raridade: 'epico',
        condicao: { tipo: 'missoes_individuais', quantas: 5 },
        frase: 'Cumpra cinco missões individuais do Oráculo',
    },
    {
        id: 'pedra-da-lua',
        nome: 'Pedra da Lua',
        itens: ['item_border_t5_pedra_da_lua', 'item_banner_t5_pedra_da_lua'],
        raridade: 'lendario',
        condicao: { tipo: 'ciclo_com_nota', nota: 'SSS' },
        frase: 'Feche um ciclo com nota SSS',
    },

    // --- MEIO E FIM DE JOGO (26/10/2026) ---
    // Os quatro pares que vieram das pequenas, com o nome junto.
    {
        id: 'popular-de-verdade',
        nome: 'Popular',
        itens: ['item_border_2_001', 'item_banner_popular'],
        raridade: 'raro',
        condicao: { tipo: 'amizades', quantas: 10 },
        frase: 'Tenha dez amizades no Glyph',
    },
    {
        id: 'veterano-de-um-ano',
        nome: 'Veterano',
        itens: ['item_border_t2_veterano', 'item_banner_t2_veterano'],
        raridade: 'raro',
        condicao: { tipo: 'dias_entre_primeira_e_ultima_acao', dias: 365 },
        frase: 'Conclua ações com um ano de distância entre a primeira e a última',
    },
    {
        id: 'disciplinado-cem-dias',
        nome: 'Disciplinado',
        itens: ['item_border_1_002', 'item_banner_disciplinado'],
        raridade: 'epico',
        condicao: { tipo: 'dias_com_exp', dias: 100, exp: 350 },
        frase: 'Feche cem dias com mais de 350 de EXP',
    },
    {
        id: 'imparavel-cem-dias',
        nome: 'Imparável',
        itens: ['item_border_3_001', 'item_banner_imparavel'],
        raridade: 'epico',
        condicao: { tipo: 'sequencia_de_dias', dias: 100 },
        frase: 'Conclua ações em cem dias seguidos',
    },
    // As novas, so EXP.
    {
        id: 'cronista',
        nome: 'Cronista',
        itens: [],
        raridade: 'incomum',
        condicao: { tipo: 'ciclos_longos', quantos: 10, diasMinimos: 7 },
        frase: 'Feche dez ciclos de sete dias ou mais',
    },
    {
        id: 'inabalavel',
        nome: 'Inabalável',
        itens: [],
        raridade: 'raro',
        condicao: { tipo: 'sequencia_de_dias', dias: 50 },
        frase: 'Conclua ações em cinquenta dias seguidos',
    },
    {
        id: 'ritual',
        nome: 'Ritual',
        itens: [],
        raridade: 'raro',
        condicao: { tipo: 'mesma_acao_repetida', vezes: 100 },
        frase: 'Conclua a mesma ação cem vezes',
    },
    {
        id: 'trofeus',
        nome: 'Troféus',
        itens: [],
        raridade: 'raro',
        condicao: { tipo: 'arenas_com_meta_concluidas', quantas: 5 },
        frase: 'Conclua cinco arenas com meta final',
    },
    {
        id: 'mil-e-um',
        nome: 'Mil e Um',
        itens: [],
        raridade: 'epico',
        condicao: { tipo: 'acoes_concluidas', quantas: 2000 },
        frase: 'Conclua duas mil ações',
    },
    {
        id: 'liturgia',
        nome: 'Liturgia',
        itens: [],
        raridade: 'epico',
        condicao: { tipo: 'mesma_acao_repetida', vezes: 250 },
        frase: 'Conclua a mesma ação duzentas e cinquenta vezes',
    },
    {
        id: 'galeria',
        nome: 'Galeria',
        itens: [],
        raridade: 'epico',
        condicao: { tipo: 'arenas_com_meta_concluidas', quantas: 10 },
        frase: 'Conclua dez arenas com meta final',
    },
    {
        id: 'era',
        nome: 'Era',
        itens: [],
        raridade: 'lendario',
        condicao: { tipo: 'ciclos_longos', quantos: 50, diasMinimos: 7 },
        frase: 'Feche cinquenta ciclos de sete dias ou mais',
    },
    {
        id: 'fornalha',
        nome: 'Fornalha',
        itens: [],
        raridade: 'lendario',
        condicao: { tipo: 'dias_com_exp', dias: 200, exp: 350 },
        frase: 'Feche duzentos dias com mais de 350 de EXP',
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

/** O EXP que a regra paga. */
export const expDaRegra = (regra: Pick<RegraDeDesbloqueio, 'raridade'>): number => EXP_POR_RARIDADE[regra.raridade] || 0;

/** Todo item que alguma regra libera, para quem precisa so da lista. */
export const ITENS_LIBERADOS_POR_REGRA = new Set(
    REGRAS_DE_DESBLOQUEIO.flatMap((regra) => regra.itens),
);
