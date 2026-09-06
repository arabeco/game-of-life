import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// O catalogo e TypeScript e importa de meia duzia de arquivos sem extensao, que
// o type-stripping do Node nao resolve. O esbuild ja e dependencia do Vite, e
// empacotar e mais honesto do que reimplementar a leitura do catalogo aqui —
// reimplementacao envelhece calada e o teste passa a checar outra coisa.
//
// Pela API, nao pelo binario: no Windows o .bin/esbuild.cmd precisa de shell e
// execFileSync devolve EINVAL sem ele.
const empacota = async (entrada, saida) => {
    const destino = path.join(root, 'node_modules', '.cache', saida);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(root, entrada)],
        bundle: true,
        platform: 'node',
        format: 'esm',
        outfile: destino,
        logLevel: 'error',
    });
    return import(`file://${destino.split(path.sep).join('/')}`);
};

const { ITEMS_DB, ITEM_IDS_PENDING_ART, isItemCatalogVisible } =
    await empacota('constants/items.ts', 'item-art-check.mjs');

const naPasta = (relativo) => fs.existsSync(path.join(root, 'public', relativo.replace(/^\//, '')));

// 1. Item que promete arte precisa ter o arquivo no disco.
//
// isItemCatalogVisible esconde item de categoria obrigatoria SEM imageUrl, mas
// so olha o campo — nao olha a pasta. Um caminho com erro de digitacao passa
// pelas duas checagens e chega na tela como imagem quebrada, que e pior do que
// o emoji: o emoji parece escolha, o quadrado vazio parece defeito.
{
    const quebrados = ITEMS_DB
        .filter((item) => typeof item.imageUrl === 'string' && item.imageUrl.startsWith('/assets/'))
        .filter((item) => !naPasta(item.imageUrl))
        .map((item) => `${item.id} -> ${item.imageUrl}`);
    assert.deepEqual(quebrados, [], `imageUrl apontando para arquivo que nao existe:\n  ${quebrados.join('\n  ')}`);
}

// 2. Cabelo declara a propria arte e por isso pode exigir PNG.
//
// Os 26 PNGs de cabelo estao no disco desde sempre, mas o caminho era montado
// so na hora de desenhar o avatar (getHairUrl, a partir de tier + cor). O item
// ficava com imageUrl vazio, e hair estava em PNG_OPTIONAL_CATEGORIES — logo o
// penteado aparecia com emoji e ninguem era avisado.
//
// Agora cada penteado carrega o proprio imageUrl e hair e obrigatoria. Este
// teste trava as duas metades juntas: sem o campo, mover a categoria esconderia
// os oito do catalogo tendo a arte pronta.
{
    const cabelos = ITEMS_DB.filter((item) => item.category === 'hair');
    assert.equal(cabelos.length, 8, 'o catalogo deveria ter 8 penteados');

    const semCampo = cabelos.filter((item) => !item.imageUrl).map((item) => item.id);
    assert.deepEqual(semCampo, [], `penteado sem imageUrl: ${semCampo.join(', ')}`);

    const invisiveis = cabelos.filter((item) => !isItemCatalogVisible(item)).map((item) => item.id);
    assert.deepEqual(invisiveis, [], `penteado escondido do catalogo: ${invisiveis.join(', ')}`);
}

// 3. Toda variante de cor de cabelo existe.
//
// O item aponta so para a cor padrao; as outras aparecem quando a pessoa troca
// no customizador, que e onde uma variante faltando apareceria — tarde, e para
// ela. HAIR_DB e a fonte da verdade das cores, entao vale conferir a lista
// inteira contra a pasta.
{
    const { HAIR_DB, getHairUrl } = await empacota('constants/skins.ts', 'hair-check.mjs');

    const faltando = [];
    for (const hair of HAIR_DB) {
        (hair.availableColors || []).forEach((_cor, indice) => {
            const url = getHairUrl(hair.id, String(indice + 1));
            if (!naPasta(url)) faltando.push(`${hair.id} cor ${indice + 1} -> ${url}`);
        });
    }
    assert.deepEqual(faltando, [], `variante de cabelo sem arquivo:\n  ${faltando.join('\n  ')}`);
}

// 4. As categorias que ainda vivem de emoji sao exatamente as conhecidas.
//
// PNG_OPTIONAL_CATEGORIES nao e uma lista de conveniencia: cada categoria ali
// aparece com emoji na tela. 'aura' e 'ui_skin' sao procedurais e ficam. 'chest'
// e 'insignia' estao la porque a arte nao foi feita — 21 desenhos, listados em
// docs/2026-09-02-brief-de-assets.md. Se uma categoria NOVA entrar nessa lista
// sem passar por essa decisao, este teste quebra e obriga a conversa.
{
    const fonte = fs.readFileSync(path.join(root, 'constants', 'items.ts'), 'utf8');
    const bloco = fonte.match(/const PNG_OPTIONAL_CATEGORIES = new Set<ItemCategory>\(\[([\s\S]*?)\]\)/);
    assert.ok(bloco, 'PNG_OPTIONAL_CATEGORIES nao encontrada');
    const categorias = [...bloco[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
    assert.deepEqual(
        categorias,
        ['aura', 'chest', 'insignia', 'insignias', 'ui_skin'],
        'categoria entrou ou saiu de PNG_OPTIONAL_CATEGORIES — cada uma dessas aparece com emoji na tela',
    );
    assert.ok(!categorias.includes('hair'), 'cabelo tem arte e nao deve voltar a ser opcional');
}

// 5. A lista de itens escondidos por falta de arte nao cresce sozinha.
//
// ITEM_IDS_PENDING_ART e o que o catalogo esconde, e esconder e o comportamento
// certo: item de categoria obrigatoria sem PNG sairia na tela como quadrado
// vazio. O problema e que sumir nao da erro, nao aparece em log e nao tem tela
// de aviso — o item simplesmente deixa de existir para quem joga.
//
// Por isso a lista fica fixada aqui, e nao vazia. Estes tres ja estavam
// escondidos antes de cabelo virar obrigatorio, e sao o grupo E do
// docs/2026-09-02-brief-de-assets.md. Quando a arte deles entrar, apague a
// entrada correspondente. Se um item NOVO aparecer aqui, foi cadastrado sem PNG
// e ninguem ia notar.
{
    const conhecidos = [
        'item_border_4_002',        // Borda Soberano, epico
        'item_skin_5_001',          // Entidade de Luz, lendario
        'item_skin_exclusive_001',  // Empreendedor, epico
    ];
    const pendentes = ITEM_IDS_PENDING_ART.slice().sort();
    assert.deepEqual(
        pendentes,
        conhecidos,
        `mudou a lista de itens escondidos por falta de arte (${pendentes.length}): ${pendentes.join(', ')}`,
    );
    // Cabelo nao pode reaparecer aqui: tem os 26 PNGs no disco.
    assert.ok(
        !pendentes.some((id) => ITEMS_DB.find((item) => item.id === id)?.category === 'hair'),
        'penteado escondido por falta de arte — a arte existe, o imageUrl e que sumiu',
    );
}

// 6. As 10 insignias de patente e os 6 baus estao ligados.
//
// A arte estava no disco e nenhum item apontava para ela: os PNGs existiam e a
// tela continuava mostrando emoji. Nao dava erro, nao aparecia em log — so
// ninguem via o desenho que ja tinha sido feito.
{
    const { getChestArtUrl } = await empacota('constants/catalogAssets.ts', 'catalog-assets-check.mjs');

    const patentes = ITEMS_DB.filter((item) => /^insignia_rank_/.test(item.id));
    assert.equal(patentes.length, 10, 'sao 10 insignias de patente');
    const semArte = patentes.filter((item) => !item.imageUrl).map((item) => item.id);
    assert.deepEqual(semArte, [], `insignia de patente sem imageUrl: ${semArte.join(', ')}`);

    // As de conquista nao seguem o padrao de nome do arquivo: a arte foi
    // desenhada por funcao (ciclo, missao, quest de temporada) e o item tem
    // outro id. O par abaixo e a unica coisa que liga um ao outro — se alguem
    // renomear o PNG ou trocar o item, e aqui que aparece.
    const paresDeConquista = {
        insignia_report_comum: 'insignia_ciclo_bronze.webp',
        insignia_quest_incomum: 'insignia_missao_prata.webp',
        insignia_quest_master: 'insignia_quest_temporada.webp',
        insignia_levelup_rara: 'insignia_rank_7_duque.webp',
        insignia_season_genesis: 'insignia_season_genesis.webp',
    };
    for (const [id, arquivo] of Object.entries(paresDeConquista)) {
        const item = ITEMS_DB.find((candidato) => candidato.id === id);
        assert.ok(item, `${id} sumiu do catalogo`);
        assert.equal(item.imageUrl?.split('/').pop(), arquivo, `${id} deveria usar ${arquivo}`);
        assert.ok(naPasta(item.imageUrl), `${item.imageUrl} nao existe no disco`);
    }

    // Os oito tipos de bau caem em SEIS artes. Era cinco: Incomum dividia o
    // desenho do Comum porque nao existia arte propria, e agora existe
    // (bau_incomum.webp). Quem tem arte propria nao volta a compartilhar.
    const esperado = {
        'Comum': 'bau_comum.webp',
        'Incomum': 'bau_incomum.webp',
        'Skin Comum': 'bau_comum.webp',
        'Raro': 'bau_raro.webp',
        'Ciclo': 'bau_raro.webp',
        'Épico': 'bau_epico.webp',
        'Season': 'bau_mitico.webp',
        'Lendário': 'bau_lendario.webp',
    };
    for (const [tipo, arquivo] of Object.entries(esperado)) {
        const url = getChestArtUrl(tipo);
        assert.equal(url.split('/').pop(), arquivo, `bau "${tipo}" deveria usar ${arquivo}`);
        assert.ok(naPasta(url), `${url} nao existe no disco`);
    }

    // Tipo desconhecido nao pode quebrar a tela: cai no bau comum.
    assert.match(getChestArtUrl(''), /bau_comum\.webp$/);
    assert.match(getChestArtUrl(null), /bau_comum\.webp$/);
    assert.match(getChestArtUrl('tipo_que_nao_existe'), /bau_comum\.webp$/);
}

// 7. O campo de cor da temporada e lido por alguem.
//
// SeasonConfig ja carregava um `theme` ('aurora', 'eclipse', 'zenite'...) que
// NENHUMA tela lia — string morta que dava a impressao de existir identidade
// visual por temporada quando nao existia. `cores` so nao repete esse erro
// enquanto o modal de passagem continuar consultando o campo.
{
    const modal = fs.readFileSync(path.join(root, 'components', 'SeasonDetailModal.tsx'), 'utf8');
    assert.match(modal, /cores\?\.primaria/, 'o modal de passagem parou de ler as cores da temporada');
    assert.match(modal, /corDeAbertura/, 'falta a cor da temporada que abre');
    assert.match(modal, /corDeFecho/, 'falta a cor da temporada que fecha');

    // Sem cores declaradas, cai no dourado da skin: o comportamento de antes.
    assert.match(modal, /\|\| 'var\(--skin-accent-color\)'/, 'sumiu o fallback para a cor da skin');
}

// 8. O painel das temporadas continua existindo e fora do build.
//
// E o unico lugar onde da para ver o que cada temporada carrega. Sem ele, saber
// que onze das treze estao vazias exige ler constants/seasonContent.ts inteiro.
{
    for (const arquivo of ['season-editor.html', 'season-editor.tsx']) {
        assert.ok(
            fs.existsSync(path.join(root, 'tools', arquivo)),
            `tools/${arquivo} sumiu`,
        );
    }
    const vite = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
    assert.doesNotMatch(vite, /tools\//, 'tools/ nao pode virar entrada do build');
}

// 9. A regra da colecao: TRES missoes, CINCO pecas, toda temporada.
//
// Nao e meta, e regra. Uma temporada com quatro pecas nao e "quase pronta": e
// uma colecao que nunca fecha, e quem completar as tres missoes vai receber um
// buraco. O bau mitico sorteia dentro dessas pecas, entao a colecao incompleta
// tambem estreita o bau — a Aurora I entrega DOIS itens possiveis hoje.
{
    const { SEASONS, PECAS_POR_TEMPORADA, MISSOES_POR_TEMPORADA } =
        await empacota('constants/seasonContent.ts', 'season-rule-check.mjs');

    assert.deepEqual(
        [...PECAS_POR_TEMPORADA],
        ['skin', 'border', 'banner', 'insignia', 'ui_skin'],
        'mudaram as cinco pecas da colecao de temporada',
    );
    assert.equal(MISSOES_POR_TEMPORADA, 3, 'mudou o numero de missoes por temporada');

    // Quem ja tem missao escrita precisa ter exatamente tres.
    //
    // A Aurora I tem QUATRO: as tres da colecao mais 'aurora-quest-cla-vigilia',
    // uma missao de cla. Ela nao entrega peca e nao e o fecho — entrou fora da
    // regra. Fica anotada aqui ate a decisao: ou vira o selo (o quarto passo que
    // entrega insignia e tema), ou sai. Enquanto estiver na lista, o teste
    // aceita; no dia que mudar, ele avisa.
    const todas = Object.values(SEASONS);
    const excecoesConhecidas = { 'season-aurora-1-2026': 4 };
    const comQuests = todas.filter((season) => (season.quests || []).length > 0);
    const foraDaRegra = comQuests
        .filter((season) => season.quests.length !== (excecoesConhecidas[season.id] ?? MISSOES_POR_TEMPORADA))
        .map((season) => `${season.id}: ${season.quests.length}`);
    assert.deepEqual(foraDaRegra, [], `temporada com numero errado de missoes: ${foraDaRegra.join(', ')}`);

    // E nenhuma quest deveria pagar o bau mitico se a regra e entregar a PECA.
    // Hoje todas pagam. Enquanto a decisao nao vier, o teste so conta — para o
    // numero aparecer em vez de virar folclore.
    const pagamComBau = comQuests.flatMap((season) =>
        season.quests.filter((quest) => quest.reward_type === 'chest').map((quest) => quest.id));
    assert.equal(
        pagamComBau.length,
        7,
        `mudou quantas quests de temporada pagam bau em vez da peca (${pagamComBau.length}): ${pagamComBau.join(', ')}`,
    );

    // E quem tem chave de colecao precisa das cinco pecas. A lista abaixo e a
    // espera visivel: quando a arte entrar, tire daqui e o teste passa a cobrar.
    // Nenhuma colecao incompleta conhecida: a Aurora I fechou as cinco pecas.
    const incompletasConhecidas = {};
    const porChave = {};
    for (const item of ITEMS_DB) {
        // `isLegacyRetired` sao as versoes antigas que foram substituidas — a
        // Genesis tem uma borda e um banner epicos aposentados, alem dos
        // miticos que valem. Contar os dois grupos daria sete pecas numa
        // colecao de cinco.
        if (item.seasonKey && !item.isLegacyRetired) {
            porChave[item.seasonKey] = (porChave[item.seasonKey] || 0) + 1;
        }
    }
    for (const [chave, quantas] of Object.entries(porChave)) {
        const esperado = incompletasConhecidas[chave] ?? PECAS_POR_TEMPORADA.length;
        assert.equal(
            quantas,
            esperado,
            `${chave} tem ${quantas} pecas; a regra pede ${PECAS_POR_TEMPORADA.length}` +
            (incompletasConhecidas[chave] ? ' (esta na lista de espera com ' + esperado + ')' : ''),
        );
    }
}

// 10. O selo entrega a insignia E o tema; o bau sorteia as outras tres.
//
// O bau te veste (skin, borda, banner), o selo te marca (insignia, tema). Se o
// tema voltar para o sorteio, o fecho da temporada passa a entregar so a
// insignia — e quem completou tudo abre o app no dia seguinte sem ver
// diferenca nenhuma, porque insignia mora no perfil.
{
    const { GM_SEASON_MISSIONS } = await empacota('constants/seasonContent.ts', 'season-seal-check.mjs');
    const selos = GM_SEASON_MISSIONS.filter((missao) => missao.goal_type === 'quests_claimed');
    assert.ok(selos.length >= 2, 'sumiu um selo de temporada');

    for (const selo of selos) {
        assert.equal(selo.goal_value, 3, `${selo.id} deveria exigir as 3 jornadas`);
        assert.equal(selo.sourceQuestIds?.length, 3, `${selo.id} deveria apontar para 3 jornadas`);

        const premios = selo.reward_item_ids || [];
        const temInsignia = premios.some((id) => ITEMS_DB.find((item) => item.id === id)?.category === 'insignia');
        assert.ok(temInsignia, `${selo.id} nao entrega insignia de temporada`);

        // Nenhuma peca que o bau sorteia pode vir tambem pelo selo: chegaria
        // duas vezes.
        const duplicadas = premios.filter((id) => {
            const item = ITEMS_DB.find((candidato) => candidato.id === id);
            return item && ['skin', 'border', 'banner'].includes(item.seasonSlot || '');
        });
        assert.deepEqual(duplicadas, [], `${selo.id} entrega peca que o bau ja sorteia: ${duplicadas.join(', ')}`);
    }

    // E o SQL precisa estar tirando o tema do sorteio.
    const migracao = fs.readFileSync(
        path.join(root, 'supabase', 'migrations', '20260903150000_chest_ladder_never_drops_below_tier.sql'),
        'utf8',
    );
    assert.match(
        migracao,
        /not in \('ui_skin', 'insignia'\)/,
        'o tema ou a insignia voltaram para o sorteio do bau mitico — os dois sao premio do selo',
    );
    assert.doesNotMatch(migracao, /distinct from 'banner'/, 'o banner saiu do sorteio — ele e uma das tres pecas do bau');
}

// 11. A escada das patentes: sobe sempre, e o degrau nunca encolhe.
//
// A curva antiga acelerava ate o Conde e depois ficava LINEAR: os quatro
// ultimos degraus eram identicos, +162.500 cada. Do Conde ao Soberano viravam
// 10.833 horas em ritmo constante, sem escalada nenhuma justo onde a escalada
// deveria ser sentida. Repetir um degrau nao da erro e nao aparece em tela.
{
    const { NOBILITY_RANKS } = await empacota('constants/nobility.ts', 'nobility-check.mjs');

    assert.equal(NOBILITY_RANKS.length, 10, 'sao dez patentes');
    assert.equal(NOBILITY_RANKS[0].expTotalRequired, 0, 'a primeira patente comeca em zero');

    const degraus = NOBILITY_RANKS.slice(1).map((rank, i) => ({
        nome: rank.name,
        custo: rank.expTotalRequired - NOBILITY_RANKS[i].expTotalRequired,
    }));

    for (let i = 1; i < degraus.length; i += 1) {
        assert.ok(
            degraus[i].custo > degraus[i - 1].custo,
            `${degraus[i].nome} custa ${degraus[i].custo}, o mesmo ou menos que ${degraus[i - 1].nome} ` +
            `(${degraus[i - 1].custo}) — a escada parou de subir`,
        );
    }

    // E o primeiro degrau nao pode voltar a ser uma maratona: 100 horas ja e
    // um mes a tres horas por dia.
    assert.ok(
        degraus[0].custo <= 6000,
        `o primeiro degrau voltou a custar ${degraus[0].custo} EXP (${Math.round(degraus[0].custo / 60)} h)`,
    );
}

// 12. O selo conquistado atravessa a virada da temporada.
//
// A Genesis fecha em 22/09 e a Aurora comeca no mesmo dia. Quem fechasse a
// terceira jornada no dia 21 e nao abrisse o app antes da virada perderia a
// insignia da temporada e o tema — justamente quem foi ate o fim. O trabalho ja
// estava registrado; o resgate era burocracia.
//
// A excecao e SO do selo, e so quando as tres jornadas dele ja constam como
// resgatadas. Temporada velha continua fechada para todo o resto.
{
    const fonte = fs.readFileSync(path.join(root, 'contexts', 'GameContext.tsx'), 'utf8');
    const inicio = fonte.indexOf('const claimSeasonMission');
    assert.ok(inicio > 0, 'claimSeasonMission sumiu');
    const bloco = [fonte.slice(inicio, inicio + 2200)];

    assert.match(bloco[0], /goal_type === 'quests_claimed'/, 'o selo perdeu a excecao da virada');
    assert.match(bloco[0], /jornadas\.every/, 'a excecao parou de exigir as tres jornadas resgatadas');
    assert.match(
        bloco[0],
        /pertence a uma temporada encerrada/,
        'a porta da temporada encerrada foi removida — ela vale para tudo que nao e o selo',
    );
}

console.log('item-art: ok');
