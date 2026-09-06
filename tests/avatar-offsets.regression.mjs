import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const empacota = async (entrada, saida) => {
    const destino = path.join(root, 'node_modules', '.cache', saida);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(root, entrada)],
        bundle: true, platform: 'node', format: 'esm',
        outfile: destino, logLevel: 'error',
    });
    return import(`file://${destino.split(path.sep).join('/')}`);
};

const {
    applyAvatarOffset, getAvatarOffset, getMascaraDoCorpo, getModoDoCabelo,
    AVATAR_OFFSETS, REFERENCIA, REGIOES_DO_CORPO,
} = await empacota('constants/avatarOffsets.ts', 'avatar-offsets-check.mjs');

// 1. Tabela vazia tem de ser IDENTICA ao comportamento antigo.
//
// O CanvasAvatar chamava `drawImage(img, 0, 0, width, height)` direto. Agora
// passa pelo applyAvatarOffset. Se a conta errar com ajuste ausente, todo avatar
// do jogo sai deslocado de uma vez — e nao ha tela de erro para isso, so um
// boneco torto que alguem eventualmente nota.
{
    assert.deepEqual(
        applyAvatarOffset(500, 500, undefined),
        { x: 0, y: 0, w: 500, h: 500 },
        'sem ajuste tem de render exatamente drawImage(img, 0, 0, 500, 500)',
    );
    assert.deepEqual(applyAvatarOffset(500, 500, {}), { x: 0, y: 0, w: 500, h: 500 });
    assert.deepEqual(applyAvatarOffset(320, 320, undefined), { x: 0, y: 0, w: 320, h: 320 });
}

// 2. A escala cresce a partir do CENTRO da peca.
//
// Escalando pelo canto, aumentar o tamanho empurraria o desenho para baixo e
// para a direita, e quem esta arrastando na ferramenta teria de corrigir a
// posicao a cada mudanca de tamanho. As duas contas — aqui e no
// tools/avatar-align.html — precisam concordar, senao o que a pessoa ve na
// ferramenta nao e o que o app desenha.
{
    assert.deepEqual(applyAvatarOffset(500, 500, { scale: 1.1 }), { x: -25, y: -25, w: 550, h: 550 });
    assert.deepEqual(applyAvatarOffset(500, 500, { scale: 0.9 }), { x: 25, y: 25, w: 450, h: 450 });
    assert.deepEqual(applyAvatarOffset(500, 500, { x: 10, scale: 0.9 }), { x: 35, y: 25, w: 450, h: 450 });
    assert.deepEqual(applyAvatarOffset(500, 500, { x: -5, y: 8 }), { x: -5, y: 8, w: 500, h: 500 });
}

// 3. A chave e o NOME DO ARQUIVO, venha a URL de onde vier.
//
// O CanvasAvatar monta URL de jeito diferente por categoria — avatarAsset,
// glyphAsset, getHairUrl, getAssetUrl — e algumas passam por CDN com query.
// Exigir um formato so espalharia normalizacao pelos pontos de chamada, e o
// ajuste sumiria em silencio no ponto que alguem esquecesse.
//
// E o nome do arquivo, e nao o id do item, porque variantes de cor do mesmo
// penteado divergem entre si: CABELO_T3_DREADS_pre tem os mesmos 5146 pixels e
// a mesma largura do _cast, salvo 7px mais abaixo.
{
    AVATAR_OFFSETS['CABELO_T3_DREADS_pre.png'] = { y: -7 };
    for (const url of [
        '/assets/catalog/avatars/hair/CABELO_T3_DREADS_pre.png',
        'avatars/hair/CABELO_T3_DREADS_pre.png',
        'CABELO_T3_DREADS_pre.png',
        'https://cdn.exemplo/assets/catalog/avatars/hair/CABELO_T3_DREADS_pre.png?v=2',
    ]) {
        assert.deepEqual(getAvatarOffset(url), { y: -7 }, `nao resolveu o ajuste em: ${url}`);
    }
    delete AVATAR_OFFSETS['CABELO_T3_DREADS_pre.png'];

    assert.equal(getAvatarOffset(null), undefined);
    assert.equal(getAvatarOffset(''), undefined);
    assert.equal(getAvatarOffset('/assets/catalog/avatars/body_masc_1.png'), undefined);
}

// 4. O gabarito continua sendo o body_masc_1, e com os numeros medidos dele.
//
// A arte nova nasce contra este corpo, e scripts/check-avatar-geometry.mjs
// confere PNG novo contra estes mesmos valores. Mudar aqui sem mudar la faz as
// duas fontes discordarem em silencio.
{
    assert.equal(REFERENCIA.corpo, 'body_masc_1.png');
    assert.deepEqual(
        { topo: REFERENCIA.topoDaCabeca, centro: REFERENCIA.centroDaCabeca, largura: REFERENCIA.larguraDaCabeca, pescoco: REFERENCIA.pescoco },
        { topo: 54, centro: 244, largura: 42, pescoco: 99 },
        'o gabarito mudou — confira scripts/check-avatar-geometry.mjs junto',
    );
    const script = fs.readFileSync(path.join(root, 'scripts', 'check-avatar-geometry.mjs'), 'utf8');
    assert.match(
        script,
        /GABARITO = \{ topo: 54, centro: 244, largura: 42, pescoco: 99 \}/,
        'o script de conferencia usa outro gabarito que o avatarOffsets.ts',
    );
}

// 5. A ferramenta tem de continuar existindo e fora do build.
//
// Ela e o unico jeito pratico de preencher a tabela. Se sumir, a tabela vira
// numero digitado a mao, que e exatamente como o desalinhamento nasceu.
{
    const ferramenta = path.join(root, 'tools', 'avatar-align.html');
    assert.ok(fs.existsSync(ferramenta), 'tools/avatar-align.html sumiu');
    const html = fs.readFileSync(ferramenta, 'utf8');
    assert.match(html, /body_masc_1\.png/, 'a ferramenta deve abrir no corpo de referencia');
    // Vite so empacota o index.html da raiz; tools/ fica de fora do dist. Se
    // alguem transformar isso num entry, uma ferramenta de dev vai para producao.
    const vite = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
    assert.doesNotMatch(vite, /tools\//, 'tools/ nao pode virar entrada do build');
}

// 6. A mascara do corpo so existe quando alguem declarou.
//
// Sem `cobre` na tabela, o laco de clearRect do CanvasAvatar nao roda e o
// desenho e identico ao de antes. Isso importa porque a mascara APAGA pixel:
// um retorno errado aqui abriria buracos no corpo de todo mundo.
{
    assert.deepEqual(getMascaraDoCorpo(undefined, 500, 500), []);
    assert.deepEqual(getMascaraDoCorpo(null, 500, 500), []);

    // Nome inventado de proposito. Apontar para uma roupa de verdade amarraria
    // o teste ao conteudo da tabela — e foi o que quebrou quando as 19 roupas
    // foram alinhadas: o exemplo de "sem entrada" passou a ter entrada.
    const INEXISTENTE = 'SKIN_QUE_NAO_EXISTE_NO_CATALOGO.png';
    assert.deepEqual(getMascaraDoCorpo(`/x/${INEXISTENTE}`, 500, 500), []);

    const guardado = AVATAR_OFFSETS[INEXISTENTE];
    AVATAR_OFFSETS[INEXISTENTE] = { cobre: ['bracos'] };
    assert.deepEqual(
        getMascaraDoCorpo(`/assets/catalog/avatars/${INEXISTENTE}`, 500, 500),
        REGIOES_DO_CORPO.bracos,
        'no quadro de 500 as caixas saem sem conversao',
    );

    // O CanvasAvatar desenha em tamanhos variados conforme a tela; as caixas sao
    // do quadro de 500 e precisam acompanhar, ou a mascara cai no lugar errado.
    assert.deepEqual(
        getMascaraDoCorpo(`/x/${INEXISTENTE}`, 250, 250),
        REGIOES_DO_CORPO.bracos.map(([x, y, w, h]) => [x / 2, y / 2, w / 2, h / 2]),
        'a mascara tem de escalar junto com o canvas',
    );

    AVATAR_OFFSETS[INEXISTENTE] = { cobre: ['bracos', 'pes'] };
    assert.equal(
        getMascaraDoCorpo(`/x/${INEXISTENTE}`, 500, 500).length,
        REGIOES_DO_CORPO.bracos.length + REGIOES_DO_CORPO.pes.length,
        'duas regioes marcadas devolvem as caixas das duas',
    );
    if (guardado === undefined) delete AVATAR_OFFSETS[INEXISTENTE];
    else AVATAR_OFFSETS[INEXISTENTE] = guardado;
}

// 8. A tabela so aceita regiao que existe, e escala dentro do que a ferramenta
//    produz.
//
// Uma regiao com nome errado nao daria erro nenhum: getMascaraDoCorpo faz
// `REGIOES_DO_CORPO[regiao] || []` e simplesmente nao apagaria nada. O defeito
// apareceria como corpo vazando de novo, meses depois, sem pista de origem.
{
    const validas = Object.keys(REGIOES_DO_CORPO);
    const problemas = [];
    for (const [arquivo, ajuste] of Object.entries(AVATAR_OFFSETS)) {
        for (const regiao of ajuste.cobre || []) {
            if (!validas.includes(regiao)) problemas.push(`${arquivo}: regiao "${regiao}"`);
        }
        // 'porCima' e o padrao e nao deve ser escrito: gravado, ele viraria a
        // unica entrada da tabela que nao muda nada, e alguem passaria a achar
        // que roupa sem o campo tem comportamento indefinido.
        if (ajuste.cabelo !== undefined && !['porBaixo', 'esconde'].includes(ajuste.cabelo)) {
            problemas.push(`${arquivo}: cabelo "${ajuste.cabelo}" — so 'porBaixo' ou 'esconde'`);
        }
        // Cabelo so faz sentido em roupa; num arquivo de cabelo seria ignorado
        // em silencio.
        if (ajuste.cabelo && !arquivo.startsWith('SKIN_')) {
            problemas.push(`${arquivo}: cabelo so vale em roupa`);
        }
        if (ajuste.cobre?.length && !arquivo.startsWith('SKIN_')) {
            problemas.push(`${arquivo}: cobre so vale em roupa`);
        }
        // A ferramenta trava a escala entre 0,4 e 2. Valor fora disso so pode ter
        // vindo de edicao a mao, e escala extrema estica arte ate borrar.
        if (ajuste.scale !== undefined && (ajuste.scale < 0.4 || ajuste.scale > 2)) {
            problemas.push(`${arquivo}: scale ${ajuste.scale} fora de 0,4..2`);
        }
        // Deslocamento maior que meio quadro joga a peca para fora da tela — foi
        // exatamente assim que um arrasto atravessado sumiu com um terno inteiro.
        for (const eixo of ['x', 'y']) {
            const v = ajuste[eixo];
            if (v !== undefined && Math.abs(v) > 250) {
                problemas.push(`${arquivo}: ${eixo}=${v} joga a peca para fora do quadro`);
            }
        }
    }
    assert.deepEqual(problemas, [], `ajuste invalido em AVATAR_OFFSETS:\n  ${problemas.join('\n  ')}`);
}

// 7. As caixas da ferramenta e as do app tem de ser as mesmas.
//
// A ferramenta desenha o resultado para a pessoa decidir; o app desenha para
// quem joga. Se as duas listas divergirem, o que se aprova na ferramenta nao e o
// que sai na tela — e a divergencia nao daria erro em lugar nenhum.
{
    const html = fs.readFileSync(path.join(root, 'tools', 'avatar-align.html'), 'utf8');
    const bloco = html.match(/var REGIOES = \{([\s\S]*?)\n  \};/);
    assert.ok(bloco, 'REGIOES nao encontrada em tools/avatar-align.html');
    const numeros = (texto) => (texto.match(/-?\d+/g) || []).join(',');
    for (const regiao of Object.keys(REGIOES_DO_CORPO)) {
        // Ancorado no fim da linha: cada regiao ocupa uma linha so, e um `.*`
        // sem ancora engoliria as regioes seguintes e o teste passaria a
        // comparar a lista inteira contra uma regiao.
        const naFerramenta = bloco[1].match(new RegExp('^\\s*' + regiao + ':\\s*(.+?),?\\s*$', 'm'));
        assert.ok(naFerramenta, `a ferramenta nao declara a regiao ${regiao}`);
        assert.equal(
            numeros(naFerramenta[1]),
            numeros(JSON.stringify(REGIOES_DO_CORPO[regiao])),
            `a caixa de "${regiao}" difere entre a ferramenta e constants/avatarOffsets.ts`,
        );
    }
}

// 9. Toda chave da tabela corresponde a um arquivo que o app realmente carrega.
//
// Esta e a falha que nao avisa. getAvatarOffset resolve pelo basename da URL;
// uma chave com nome errado — letra trocada, extensao diferente, arquivo
// renomeado — simplesmente nao casa, o ajuste nao se aplica, e nada quebra. A
// peca volta a ficar desalinhada e o unico sintoma e visual, meses depois.
//
// Aqui a tabela e cruzada com as URLs que o proprio catalogo produz: as roupas
// vem de ITEMS_DB.imageUrl (que e o que SOVEREIGN_ASSETS.outfits usa) e os
// cabelos de getHairUrl em cada variante de cor, que e o que o CanvasAvatar
// chama na hora de desenhar.
{
    const { ITEMS_DB } = await empacota('constants/items.ts', 'items-para-offsets.mjs');
    const { HAIR_DB, getHairUrl } = await empacota('constants/skins.ts', 'skins-para-offsets.mjs');

    const basename = (url) => url.slice(url.lastIndexOf('/') + 1);
    const conhecidos = new Set();
    for (const item of ITEMS_DB) {
        if (typeof item.imageUrl === 'string' && item.imageUrl) conhecidos.add(basename(item.imageUrl));
    }
    for (const hair of HAIR_DB) {
        (hair.availableColors || []).forEach((_cor, indice) => {
            conhecidos.add(basename(getHairUrl(hair.id, String(indice + 1))));
        });
    }

    const orfas = Object.keys(AVATAR_OFFSETS).filter((chave) => !conhecidos.has(chave));
    assert.deepEqual(
        orfas,
        [],
        `ajuste apontando para arquivo que o app nunca carrega (nao daria erro, so nao teria efeito):\n  ${orfas.join('\n  ')}`,
    );
}

// 10. O padrao do cabelo e "por cima", e so as roupas de cabeca desviam disso.
//
// getModoDoCabelo governa a ORDEM de desenho no CanvasAvatar. Um erro aqui nao
// quebra nada — o avatar so passa a sair com cabelo pendurado na frente do elmo,
// que foi exatamente o defeito que este campo veio corrigir.
{
    assert.equal(getModoDoCabelo(undefined), 'porCima');
    assert.equal(getModoDoCabelo(null), 'porCima');
    assert.equal(getModoDoCabelo('/x/SKIN_QUE_NAO_EXISTE.png'), 'porCima');
    assert.equal(getModoDoCabelo('/assets/catalog/avatars/SKIN_T1_CASUAL.png'), 'porCima');

    // Elmo fechado: nao sobra por onde o cabelo aparecer.
    for (const arquivo of ['SKIN_T3_HIBRIDO.png', 'SKIN_T4_ARMADURA_PLACA.png']) {
        assert.equal(getModoDoCabelo(`/x/${arquivo}`), 'esconde', `${arquivo} deveria esconder o cabelo`);
    }
    // Capuz, bone e turbante: o cabelo espia por baixo.
    for (const arquivo of ['SKIN_T1_STREET.png', 'SKIN_T3_NOMADE.png', 'SKIN_T3_ALQUIMISTA.png']) {
        assert.equal(getModoDoCabelo(`/x/${arquivo}`), 'porBaixo', `${arquivo} deveria por o cabelo por baixo`);
    }

    // As outras treze cobrem zero da calota e nao devem ter o campo.
    const comModo = Object.entries(AVATAR_OFFSETS)
        .filter(([, a]) => a.cabelo).map(([k]) => k).sort();
    assert.deepEqual(
        comModo,
        ['SKIN_T1_STREET.png', 'SKIN_T3_ALQUIMISTA.png', 'SKIN_T3_HIBRIDO.png',
            'SKIN_T3_NOMADE.png', 'SKIN_T4_ARMADURA_PLACA.png'],
        'mudou o conjunto de roupas que mexem no cabelo — sao as cinco que cobrem a calota',
    );
}

// 11. O CanvasAvatar respeita os tres modos.
//
// A tabela e o helper podem estar certos e o componente desenhar do jeito
// antigo. Aqui a leitura e do proprio arquivo: o cabelo tem de ser desenhavel
// antes OU depois da roupa, e nao mais numa posicao fixa.
{
    const fonte = fs.readFileSync(path.join(root, 'components', 'CanvasAvatar.tsx'), 'utf8');
    assert.match(fonte, /getModoDoCabelo\(outfitUrl\)/, 'o componente nao consulta o modo do cabelo');
    assert.match(fonte, /modoDoCabelo === 'porBaixo'/, 'falta o caminho porBaixo');
    assert.match(fonte, /modoDoCabelo === 'porCima'/, 'falta o caminho porCima');
    // 'esconde' e a ausencia dos dois: nenhuma chamada a desenharCabelo roda.
    const chamadas = (fonte.match(/await desenharCabelo\(\)/g) || []).length;
    assert.equal(chamadas, 2, 'desenharCabelo deve ser chamado em exatamente dois caminhos');
}

// 12. O ajuste por corpo SOMA ao de base, e nunca o substitui.
//
// A tabela e chaveada pelo arquivo da PECA. Sem porCorpo, afinar uma roupa
// olhando o corpo feminino sobrescreveria o valor afinado no masculino, e o
// estrago so apareceria no outro corpo — que ninguem estaria olhando na hora.
//
// Somar, e nao substituir, importa: substituindo, cada corpo exigiria a
// coordenada inteira de novo, e mexer numa tiraria a outra do lugar.
{
    const PECA = 'SKIN_TESTE_PORCORPO.png';
    const guardado = AVATAR_OFFSETS[PECA];
    AVATAR_OFFSETS[PECA] = {
        x: 3, y: 7, scale: 1.02, cobre: ['pernas'],
        porCorpo: { 'body_fem_5.png': { x: 2, y: -4, scale: 0.95 } },
    };

    const semCorpo = getAvatarOffset(`/x/${PECA}`);
    assert.equal(semCorpo.x, 3, 'sem corpo informado vale so a base');
    assert.equal(semCorpo.y, 7);

    const outroCorpo = getAvatarOffset(`/x/${PECA}`, '/y/body_masc_1.png');
    assert.equal(outroCorpo.x, 3, 'corpo sem override nao muda a base');
    assert.equal(outroCorpo.y, 7);

    const comOverride = getAvatarOffset(`/x/${PECA}`, '/y/body_fem_5.png');
    assert.equal(comOverride.x, 5, 'x tem de somar: 3 + 2');
    assert.equal(comOverride.y, 3, 'y tem de somar: 7 + (-4)');
    assert.ok(Math.abs(comOverride.scale - 1.02 * 0.95) < 1e-9, 'a escala multiplica');
    assert.deepEqual(comOverride.cobre, ['pernas'], 'cobre nao muda por corpo');

    // A base tem de sair intacta da leitura — se getAvatarOffset mutasse o
    // objeto guardado, o segundo avatar renderizado ja veria o valor somado.
    assert.equal(AVATAR_OFFSETS[PECA].x, 3, 'a leitura nao pode alterar a tabela');
    assert.equal(AVATAR_OFFSETS[PECA].y, 7);

    if (guardado === undefined) delete AVATAR_OFFSETS[PECA];
    else AVATAR_OFFSETS[PECA] = guardado;
}

// 13. O CanvasAvatar informa qual corpo esta em cena.
//
// O helper pode estar certo e o componente nunca passar o corpo, e ai todo
// porCorpo seria ignorado em silencio.
{
    const fonte = fs.readFileSync(path.join(root, 'components', 'CanvasAvatar.tsx'), 'utf8');
    assert.match(fonte, /corpoEmCena/, 'o componente nao rastreia o corpo em cena');
    assert.match(
        fonte,
        /getAvatarOffset\(url, corpoEmCena\)/,
        'as leituras de ajuste precisam passar o corpo',
    );
    assert.match(fonte, /corpoEmCena = bodyUrl/, 'o corpo em cena nunca e atribuido');
}

// 14. Recortes a mao entram na mascara junto com os presets.
//
// As tres regioes nomeadas sao grossas: ha roupa que cobre o braco e deixa a
// mao, e roupa curta em que o problema e so a faixa do quadril. Nomear cada
// variacao viraria um vocabulario que ninguem lembra — o retangulo desenhado
// resolve sem inventar nome. Mas ele APAGA pixel, entao uma caixa mal formada
// abre buraco no corpo e nao da erro nenhum.
{
    const PECA = 'SKIN_TESTE_RECORTE.png';
    const guardado = AVATAR_OFFSETS[PECA];

    AVATAR_OFFSETS[PECA] = { recortes: [[10, 20, 30, 40]] };
    assert.deepEqual(
        getMascaraDoCorpo(`/x/${PECA}`, 500, 500),
        [[10, 20, 30, 40]],
        'recorte sozinho tem de sair na mascara',
    );

    // Preset e recorte convivem: um nao substitui o outro.
    AVATAR_OFFSETS[PECA] = { cobre: ['pes'], recortes: [[10, 20, 30, 40]] };
    assert.deepEqual(
        getMascaraDoCorpo(`/x/${PECA}`, 500, 500),
        [...REGIOES_DO_CORPO.pes, [10, 20, 30, 40]],
        'preset e recorte tem de sair juntos, nessa ordem',
    );

    // Escala junto com o canvas, igual aos presets.
    assert.deepEqual(
        getMascaraDoCorpo(`/x/${PECA}`, 250, 250).at(-1),
        [5, 10, 15, 20],
        'o recorte tem de escalar com o canvas',
    );

    AVATAR_OFFSETS[PECA] = { recortes: [] };
    assert.deepEqual(getMascaraDoCorpo(`/x/${PECA}`, 500, 500), [], 'lista vazia nao apaga nada');

    if (guardado === undefined) delete AVATAR_OFFSETS[PECA];
    else AVATAR_OFFSETS[PECA] = guardado;
}

// 15. Nenhum recorte gravado pode ter medida negativa ou cair fora do quadro.
//
// Arrastar da direita para a esquerda produz largura negativa, e clearRect com
// valor negativo NAO APAGA NADA: o recorte pareceria gravado e simplesmente nao
// funcionaria. A ferramenta normaliza, mas edicao a mao no arquivo nao passa
// por ela.
{
    const problemas = [];
    for (const [arquivo, ajuste] of Object.entries(AVATAR_OFFSETS)) {
        for (const caixa of ajuste.recortes || []) {
            if (!Array.isArray(caixa) || caixa.length !== 4) {
                problemas.push(`${arquivo}: recorte nao e [x, y, w, h]`);
                continue;
            }
            const [x, y, w, h] = caixa;
            if (w <= 0 || h <= 0) problemas.push(`${arquivo}: recorte [${caixa}] com medida <= 0 nao apaga nada`);
            if (x < 0 || y < 0 || x + w > 500 || y + h > 500) {
                problemas.push(`${arquivo}: recorte [${caixa}] sai do quadro de 500`);
            }
        }
        if (ajuste.recortes && !arquivo.startsWith('SKIN_')) {
            problemas.push(`${arquivo}: recorte so vale em roupa`);
        }
    }
    assert.deepEqual(problemas, [], `recorte invalido: ${problemas.join(' | ')}`);
}

console.log('avatar-offsets: ok');
