/**
 * Onde cada peca de arte se encaixa no boneco.
 *
 * O CanvasAvatar desenhava tudo com `drawImage(img, 0, 0, 500, 500)` — cada
 * camada no quadro inteiro, sempre na mesma posicao, para qualquer corpo. Isso
 * so funciona se todo PNG tiver sido desenhado contra a MESMA cabeca, e nao foi
 * o caso: medindo o alpha dos 26 cabelos e das 18 roupas contra os 6 corpos,
 * o cabelo encaixa no corpo feminino e a roupa de capuz encaixa no masculino.
 * Nenhuma das duas metades encaixa nas duas.
 *
 * Duas coisas resolvem isso juntas, e esta tabela e a segunda:
 *
 *   1. Um corpo de referencia unico. body_masc_1 e o padrao — a arte nova nasce
 *      contra ele. Ver REFERENCIA abaixo.
 *   2. Um ajuste fino por ARQUIVO, salvo aqui. Serve para o que ja existe e nao
 *      vai ser redesenhado, e para o desalinhamento entre variantes de cor do
 *      mesmo penteado: CABELO_T3_DREADS_pre tem os mesmos 5146 pixels e a mesma
 *      largura do _cast, mas salvo 7px mais abaixo. Trocar a cor do cabelo
 *      mexia o cabelo na cabeca.
 *
 * A chave e o NOME DO ARQUIVO, nao o id do item, justamente por causa das
 * variantes de cor: cada uma tem o proprio desvio.
 *
 * Editar a mao aqui e possivel mas nao e a ideia. A ferramenta que preenche
 * isto e tools/avatar-align.html — arrasta com o mouse, ajusta 1px na seta,
 * copia o bloco pronto. Com `npm run dev`, em /tools/avatar-align.html.
 */

export type RegiaoDoCorpo = 'bracos' | 'pernas' | 'pes';

export interface AvatarOffset {
    /** Deslocamento horizontal em pixels do quadro de 500x500. Positivo = direita. */
    x?: number;
    /** Deslocamento vertical. Positivo = baixo. */
    y?: number;
    /** Escala, 1 = tamanho original. Cresce a partir do centro da propria peca. */
    scale?: number;
    /**
     * Partes do corpo que ESTA roupa cobre por inteiro, e que por isso nao
     * devem ser desenhadas por baixo dela.
     *
     * So faz sentido em roupa. Existe porque o corpo e a roupa foram desenhados
     * contra cabecas e silhuetas diferentes, entao o corpo escapa pelas bordas:
     * na Season Criador, os bracos do corpo aparecem pelos lados da armadura, e
     * em corpo de pele escura isso salta. Medindo o alpha, dez das dezoito
     * roupas cobrem o corpo inteiro e deixam de 2% a 16% de pele vazando — que
     * ali e defeito, nao desenho.
     *
     * Marcar e por peca porque nao ha regra geral: o terno Executivo cobre os
     * bracos mas NAO tem maos proprias — quem desenha as maos e o corpo. Cortar
     * os bracos nele deixa manga vazia. Ja a Armadura Placa tem manopla e bota,
     * e cortar e exatamente certo.
     */
    cobre?: RegiaoDoCorpo[];
    /**
     * Recortes desenhados a mao, somados aos de `cobre`.
     *
     * Cada caixa e [x, y, largura, altura] no quadro de 500x500 do corpo de
     * referencia, e o corpo deixa de ser desenhado ali.
     *
     * Existe porque as tres regioes nomeadas sao grossas demais para alguns
     * casos reais: ha roupa que cobre o braco mas deixa a mao de fora, e ha
     * roupa curta em que o problema e so a faixa do quadril. Nomear cada
     * variacao dessas viraria um vocabulario que ninguem lembra; desenhar o
     * retangulo resolve sem inventar nome.
     *
     * Sao poucas por peca — duas ou tres. Se uma roupa precisar de muitas, o
     * provavel e que ela caiba num preset e o recorte esteja compensando um
     * desalinhamento que deveria ter sido corrigido em x/y.
     */
    recortes?: Array<[number, number, number, number]>;
    /**
     * O que esta roupa faz com o cabelo. Ausente = desenha por cima, que e o
     * comportamento de sempre e serve para 13 das 18 roupas.
     *
     * As outras cinco cobrem a calota do cranio, e nelas desenhar o cabelo por
     * cima produz cabelo longo pendurado na frente de um elmo fechado, ou
     * mechas cobrindo o rosto por cima de um capuz. Medindo o quanto de calota
     * cada roupa cobre, o corte e limpo — nao ha caso intermediario:
     *
     *   'esconde'   Hibrido (100%) e Armadura Placa (99%). Elmo fechado; nao
     *               sobra nada por onde o cabelo pudesse aparecer, entao nem
     *               vale desenhar.
     *   'porBaixo'  Street (96%), Nomade (94%) e Alquimista (86%). Bone, turbante
     *               e capuz: o cabelo espia pelas laterais e por baixo, e some
     *               so onde o pano cobre. Escondendo, a pessoa fica careca de
     *               bone; desenhando por cima, o cabelo tapa o rosto.
     *
     * As 13 restantes cobrem ZERO da calota.
     */
    cabelo?: 'porBaixo' | 'esconde';
    /**
     * Ajuste que vale SO em certos corpos, somado ao de cima.
     *
     * A chave e o nome do arquivo do corpo. Existe porque a tabela e chaveada
     * pelo arquivo da PECA: sem isto, afinar uma roupa olhando o corpo feminino
     * sobrescreveria o valor afinado no masculino, e o estrago apareceria so no
     * outro corpo, que ninguem estaria olhando na hora.
     *
     * E excecao, nao regra. Medindo as 18 roupas nos dois corpos, a maior
     * divergencia foi de 4 pontos percentuais (Executivo e Academico) — o mesmo
     * ajuste serve os dois em todas elas. Este campo existe para o caso que a
     * medicao nao pega: um decote que nao cai no lugar, uma ombreira que fica
     * larga. Comecar a usa-lo em tudo desfaz o proposito do corpo unificado.
     *
     * `cobre` e `cabelo` ficam de fora de proposito: sao decisoes sobre a ROUPA
     * (ela tem manopla? tem elmo?), e isso nao muda conforme quem a veste.
     */
    porCorpo?: Record<string, Pick<AvatarOffset, 'x' | 'y' | 'scale'>>;
}

/**
 * As caixas de cada regiao, no quadro de 500x500 do corpo de referencia.
 *
 * Nao sao chute: sairam do perfil de alpha do body_masc_1. Os bracos descolam
 * do tronco em y=177, com o tronco entre x=209 e x=281; a entrepernas abre em
 * y=267; e a silhueta volta a alargar em y=441, que e o calcado.
 *
 * Como sao coordenadas do gabarito, valem para qualquer corpo que passe no
 * scripts/check-avatar-geometry.mjs — e valem errado para um corpo que nao
 * passe. E mais uma razao para corpo novo nascer contra a referencia.
 */
export const REGIOES_DO_CORPO: Record<RegiaoDoCorpo, Array<[number, number, number, number]>> = {
    bracos: [[163, 114, 50, 182], [277, 114, 50, 182]],
    pernas: [[188, 284, 120, 158]],
    pes: [[176, 436, 150, 36]],
};

/**
 * O corpo contra o qual toda arte nova deve ser desenhada.
 *
 * Escolhido por ser o mais consistente do conjunto: os tres masculinos diferem
 * entre si em 1,1% a 3,9% da silhueta, enquanto os femininos chegam a 16,1%
 * entre fem_1 e fem_2 — sinal de que foram gerados separados em vez de
 * recoloridos a partir de um so.
 *
 * As medidas sao do alpha de body_masc_1.png e servem de gabarito para conferir
 * corpo novo: node scripts/check-avatar-geometry.mjs
 */
export const REFERENCIA = {
    corpo: 'body_masc_1.png',
    /** Primeira linha com pixel opaco, o alto do cranio. */
    topoDaCabeca: 54,
    /** Centro horizontal da cabeca. */
    centroDaCabeca: 244,
    /** Largura maxima da cabeca. */
    larguraDaCabeca: 42,
    /** Linha mais estreita abaixo do cranio, onde a cabeca vira pescoco. */
    pescoco: 99,
} as const;

/**
 * Ajuste por arquivo. Ausente = sem ajuste.
 *
 * Nenhum destes numeros saiu de conta: todos foram decididos olhando o boneco
 * em tools/avatar-align.html, peca por peca, contra o corpo de referencia. E
 * assim que tem de ser — a medicao diz onde a arte esta, mas nao diz onde ela
 * deveria estar, e chutar isso foi o que produziu o desalinhamento original.
 *
 * As roupas e os 26 cabelos ja foram passados nos dois corpos. Os cinco
 * `cabelo:` sairam da medicao de quanto cada roupa cobre da calota do cranio,
 * conferida a olho nas tres opcoes.
 *
 * SKIN_T2_MILITAR nao tem entrada de proposito: a skin foi aposentada.
 */
export const AVATAR_OFFSETS: Record<string, AvatarOffset> = {
    'CABELO_T1_CACHOS_cast.png': { x: -3, y: 1, scale: 0.93 },
    'CABELO_T1_CACHOS_preto.png': { x: -3, y: 10, scale: 0.98 },
    'CABELO_T1_MEDIO_RETO_bran.png': { x: -2, y: 5, scale: 1.01 },
    'CABELO_T1_MEDIO_RETO_cast.png': { x: -2, y: 7 },
    'CABELO_T1_MEDIO_RETO_pre.png': { x: -1, y: 3, scale: 0.98 },
    'CABELO_T2_TEXTURED_CROP_bran.png': { x: -2, y: 18, scale: 1.02, porCorpo: { 'body_fem_5.png': { x: -1, y: -2 } } },
    'CABELO_T2_TEXTURED_CROP_pre.png': { x: -2, y: 68, scale: 1.26 },
    'CABELO_T2_TEXTURED_CROP_ver.png': { x: -2, y: 13, scale: 0.98 },
    'CABELO_T3_DREADS_bran.png': { x: -3, y: 13 },
    'CABELO_T3_DREADS_cast.png': { x: -2, y: 13 },
    'CABELO_T3_DREADS_pre.png': { x: -2, y: 12, scale: 1.03 },
    'CABELO_T3_MULLET_TOPETE_ama.png': { x: -2, y: 3, porCorpo: { 'body_fem_5.png': { y: 2 } } },
    'CABELO_T3_MULLET_TOPETE_bra.png': { x: -1, y: 5 },
    'CABELO_T3_MULLET_TOPETE_cast.png': { x: -1, y: 6 },
    'CABELO_T3_MULLET_TOPETE_verm.png': { x: -4, y: 6 },
    'CABELO_T4_ANIME_SPIKES_ama.png': { x: -5, y: 10 },
    'CABELO_T4_ANIME_SPIKES_bran.png': { x: -1, y: 10 },
    'CABELO_T4_ANIME_SPIKES_cast.png': { x: -4, y: 8 },
    'CABELO_T4_ANIME_SPIKES_pre.png': { x: -2, y: 6 },
    'CABELO_T4_PRINCESA_bran.png': { x: -2, y: 11 },
    'CABELO_T4_PRINCESA_cast.png': { x: -1, y: 17 },
    'CABELO_T4_PRINCESA_preto.png': { y: 11 },
    'CABELO_T5_FLUXO_ESPIRITUAL_ama.png': { x: -2, y: 9 },
    'CABELO_T5_FLUXO_ESPIRITUAL_bran.png': { x: -3, y: 6 },
    'CABELO_T5_FLUXO_ESPIRITUAL_rosa.png': { x: -2, y: 10 },
    'CABELO_T5_FLUXO_ESPIRITUAL_verm.png': { x: -4, y: 9 },
    'SKIN_QUEST_GUARDIAO_AURORA.png': { x: 2, y: 4, scale: 1.24 },
    'SKIN_SEASON_CRIADOR.png': { y: 1, scale: 1.08, cobre: ['bracos', 'pernas', 'pes'] },
    'SKIN_T1_CACADOR.png': { x: 1, scale: 1.18, porCorpo: { 'body_fem_5.png': { x: -1, y: 3 } } },
    'SKIN_T1_CASUAL.png': { x: 4, y: -3, cobre: ['pernas', 'pes'], porCorpo: { 'body_fem_5.png': { x: -2, y: 3, scale: 1.01 } } },
    'SKIN_T1_CASUAL_2.png': { x: 5, y: -6, scale: 1.15, recortes: [[280, 115, 17, 198], [194, 115, 18, 211]], porCorpo: { 'body_fem_5.png': { x: -3, y: 1, scale: 0.96 } } },
    'SKIN_T1_GYM_RAT.png': { x: 1, cobre: ['pes'], recortes: [[194, 232, 48, 71]], porCorpo: { 'body_fem_5.png': { x: -4, y: 7, scale: 1.04 } } },
    'SKIN_T1_NAUFRAGO.png': { x: -3, scale: 1.04 },
    'SKIN_T1_STREET.png': { x: 2, y: -6, cobre: ['pernas', 'pes'], recortes: [[192, 212, 29, 97]], cabelo: 'porBaixo' },
    'SKIN_T2_ACADEMICO.png': { x: 2, y: 2, scale: 1.02, cobre: ['pernas', 'pes'], recortes: [[168, 165, 159, 74]], porCorpo: { 'body_fem_5.png': { x: 1, y: 4 } } },
    'SKIN_T2_EXECUTIVO.png': { x: 3, y: 7, scale: 1.02, cobre: ['pernas', 'pes'], recortes: [[180, 170, 147, 61], [194, 217, 16, 83]] },
    'SKIN_T2_TATICO.png': { y: 1, cobre: ['pernas', 'pes'], recortes: [[175, 173, 154, 55], [188, 238, 114, 29]] },
    'SKIN_T3_ALQUIMISTA.png': { x: 1, y: -9, cobre: ['bracos', 'pernas', 'pes'], cabelo: 'porBaixo' },
    'SKIN_T3_HIBRIDO.png': { x: 4, y: -8, cobre: ['pernas', 'pes', 'bracos'], cabelo: 'esconde' },
    'SKIN_T3_NOMADE.png': { cobre: ['bracos', 'pernas', 'pes'], cabelo: 'porBaixo' },
    'SKIN_T4_ARMADURA_PLACA.png': { y: -6, cobre: ['bracos', 'pernas', 'pes'], cabelo: 'esconde' },
    'SKIN_T4_MAGO_CIRCULO.png': { x: 1, y: -4, scale: 1.02, cobre: ['pernas', 'pes'], recortes: [[174, 169, 144, 76]] },
    'SKIN_T5_VESTIDO_REAL.png': { x: 2, scale: 1.11, cobre: ['bracos'] },
};

const semExtensao = (caminho: string): string => {
    const barra = caminho.lastIndexOf('/');
    return barra >= 0 ? caminho.slice(barra + 1) : caminho;
};

/**
 * O ajuste de uma peca, a partir da URL com que ela foi carregada.
 *
 * Aceita URL completa, caminho relativo ou so o nome do arquivo — o
 * CanvasAvatar monta as URLs de jeitos diferentes conforme a categoria, e
 * exigir um formato so espalharia normalizacao pelos pontos de chamada.
 */
export const getAvatarOffset = (
    url?: string | null,
    urlDoCorpo?: string | null,
): AvatarOffset | undefined => {
    if (!url) return undefined;
    const semQuery = url.split('?')[0];
    const base = AVATAR_OFFSETS[semExtensao(decodeURIComponent(semQuery))];
    if (!base) return undefined;

    // O ajuste do corpo, quando existe, SOMA ao de base em vez de substituir.
    // Somando, uma peca que ja esta certa no corpo de referencia precisa de um
    // delta pequeno no outro; substituindo, cada corpo exigiria a coordenada
    // inteira de novo e as duas sairiam do lugar quando so uma fosse mexida.
    if (!base.porCorpo || !urlDoCorpo) return base;
    const doCorpo = base.porCorpo[semExtensao(decodeURIComponent(urlDoCorpo.split('?')[0]))];
    if (!doCorpo) return base;

    return {
        ...base,
        x: (base.x ?? 0) + (doCorpo.x ?? 0),
        y: (base.y ?? 0) + (doCorpo.y ?? 0),
        scale: (base.scale ?? 1) * (doCorpo.scale ?? 1),
    };
};

/**
 * Onde e com que tamanho desenhar, ja com o ajuste aplicado.
 *
 * A escala cresce a partir do CENTRO da peca, nao do canto: escalar pelo canto
 * empurraria o desenho para baixo e para a direita, e quem esta arrastando na
 * ferramenta teria de corrigir a posicao a cada mudanca de tamanho.
 */
/**
 * As caixas a apagar do corpo por causa da roupa equipada, ja em pixels.
 *
 * `largura` e `altura` existem porque o CanvasAvatar desenha em tamanhos
 * diferentes conforme a tela — as caixas sao do quadro de 500 e precisam
 * acompanhar.
 */
export const getMascaraDoCorpo = (
    urlDaRoupa: string | null | undefined,
    largura: number,
    altura: number,
): Array<[number, number, number, number]> => {
    const ajuste = getAvatarOffset(urlDaRoupa);
    if (!ajuste) return [];

    const doPreset = (ajuste.cobre || []).flatMap((regiao) => REGIOES_DO_CORPO[regiao] || []);
    const todas = [...doPreset, ...(ajuste.recortes || [])];
    if (!todas.length) return [];

    const kx = largura / 500;
    const ky = altura / 500;
    return todas.map(
        ([x, y, w, h]) => [x * kx, y * ky, w * kx, h * ky] as [number, number, number, number],
    );
};

/**
 * O que a roupa equipada faz com o cabelo: por cima (padrao), por baixo, ou nem
 * desenha.
 */
export const getModoDoCabelo = (urlDaRoupa?: string | null): 'porCima' | 'porBaixo' | 'esconde' =>
    getAvatarOffset(urlDaRoupa)?.cabelo ?? 'porCima';

export const applyAvatarOffset = (
    largura: number,
    altura: number,
    offset?: AvatarOffset,
): { x: number; y: number; w: number; h: number } => {
    const escala = offset?.scale ?? 1;
    const w = largura * escala;
    const h = altura * escala;
    return {
        x: (largura - w) / 2 + (offset?.x ?? 0),
        y: (altura - h) / 2 + (offset?.y ?? 0),
        w,
        h,
    };
};
