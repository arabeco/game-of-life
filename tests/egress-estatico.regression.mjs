import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * CONTEUDO IGUAL PARA TODO MUNDO NAO SAI DO SUPABASE.
 *
 * Supabase e para o que e DE ALGUEM: estado do jardim, inventario, a imagem que
 * a pessoa subiu. Arte fixa — audio, fundo, modelo 3D, icone — viaja dentro do
 * pacote do app, e quem paga a distribuicao e a Play Store.
 *
 * A regra nao e teorica. Medindo em 17/09: as nove faixas do Foco somavam
 * 20,1 MB servidos com `cache-control: no-cache`, e os fundos de perfil outros
 * 2,4 MB no mesmo regime — isto e, o arquivo inteiro rebaixado a cada sessao de
 * foco e a cada perfil aberto, para sempre, em cima de bytes identicos.
 *
 * O que este teste protege e o backslide: a migracao ja foi feita uma vez para
 * a arte do catalogo, e mesmo assim o utils/seasonPresentation.ts ficou para
 * tras apontando para o bucket enquanto uma copia local do mesmo genesis.png
 * estava empacotada ao lado.
 */

/**
 * Duas formas de apontar para o bucket, e a segunda quase escapou.
 *
 * A primeira e o hostname cravado no codigo. A segunda monta a URL a partir do
 * `VITE_SUPABASE_URL`, e por isso nao contem "supabase.co" em lugar nenhum —
 * foi assim que quatro videos (levelup, quest, report_seal e os de bau) ficaram
 * invisiveis para a primeira versao deste teste. O que denuncia os dois e o
 * caminho da API de storage, que nenhum arquivo local tem motivo para citar.
 */
const ANFITRIAO = '/storage/v1/object/public';

/**
 * Quem pode citar o bucket, e por que.
 *
 * A lista e EXATA de proposito, e nao um minimo. Crescer significa que alguem
 * pos arte nova no bucket; encolher significa que uma migracao terminou e a
 * linha correspondente aqui deveria ter saido junto. Os dois casos merecem
 * alguem olhando.
 */
const PERMITIDOS = new Map([
    ['components/ClanDetailModal.tsx', 'emblema de cla — imagem que o usuario sobe'],
    ['constants/catalogAssets.ts', 'reescreve URL antiga do bucket para o caminho local'],
    ['scripts/download-static-catalog-assets.ts', 'o script que faz a migracao bucket -> public'],
    ['utils/profileBackgrounds.ts', 'os 15 fundos sao locais; o bucket fica como fallback e para fundo novo ainda nao empacotado'],
]);

const varrer = (dir, saida = []) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entrada.name === 'node_modules' || entrada.name.startsWith('.')) continue;
        if (['dist', 'android', 'temp', 'docs'].includes(entrada.name)) continue;
        const cheio = path.join(dir, entrada.name);
        if (entrada.isDirectory()) varrer(cheio, saida);
        else if (/\.(ts|tsx)$/.test(entrada.name)) saida.push(cheio);
    }
    return saida;
};

// 1. Ninguem novo pode apontar para o bucket.
{
    const citam = varrer(root)
        .filter((arquivo) => fs.readFileSync(arquivo, 'utf8').includes(ANFITRIAO))
        .map((arquivo) => path.relative(root, arquivo).split(path.sep).join('/'))
        .sort();

    for (const arquivo of citam) {
        assert.ok(
            PERMITIDOS.has(arquivo),
            `${arquivo} aponta para o bucket do Supabase.\n`
            + '  Se for arte fixa, ela tem de ir para public/ e ser empacotada.\n'
            + '  Se for conteudo do usuario, some o arquivo a PERMITIDOS com o motivo.',
        );
    }

    for (const arquivo of PERMITIDOS.keys()) {
        assert.ok(
            citam.includes(arquivo),
            `${arquivo} esta em PERMITIDOS mas nao cita mais o bucket.\n`
            + '  Se a migracao terminou, tire a linha da lista.',
        );
    }
}

// 2. Fundo declarado como empacotado tem de existir no disco.
//
// Um nome na lista sem arquivo ao lado nao falha em lugar nenhum: o app pede o
// caminho local, toma 404, cai para o bucket e volta a gastar egress em
// silencio — exatamente o que a migracao veio resolver.
{
    const fonte = fs.readFileSync(path.join(root, 'utils', 'profileBackgrounds.ts'), 'utf8');
    const bloco = fonte.match(/const FUNDOS_EMPACOTADOS = new Set\(\[([\s\S]*?)\]\)/);
    assert.ok(bloco, 'nao achei FUNDOS_EMPACOTADOS em utils/profileBackgrounds.ts');

    const nomes = [...bloco[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    assert.ok(nomes.length >= 15, `FUNDOS_EMPACOTADOS tem ${nomes.length} nomes; eram 15`);

    for (const nome of nomes) {
        const arquivo = path.join(root, 'public', 'assets', 'backgrounds', `${nome}.jpg`);
        assert.ok(fs.existsSync(arquivo), `FUNDOS_EMPACOTADOS lista ${nome}, sem arquivo em public/assets/backgrounds`);
    }
}

// 3. Orcamento do que e empacotado.
//
// O teto existe para a conversa acontecer ANTES de o app engordar, e nao depois
// de alguem notar o download. Os modelos do jardim sao o proximo a entrar aqui:
// 40 pecas a 500 KB sao 20 MB, e essa decisao merece ser tomada de olho aberto.
{
    const pesar = (dir) => {
        if (!fs.existsSync(dir)) return 0;
        return fs.readdirSync(dir, { withFileTypes: true }).reduce((soma, e) => {
            const cheio = path.join(dir, e.name);
            return soma + (e.isDirectory() ? pesar(cheio) : fs.statSync(cheio).size);
        }, 0);
    };

    const orcamentos = [
        ['public/assets/backgrounds', 4],
        ['public/assets/catalog', 12],
        // Only the approved full tree and compact sand now ship in the experiment.
        ['public/garden-experiment', 2],
        // Nine complete Opus loops at constrained VBR 72k: 6.62 MB decimal.
        ['public/audio', 7],
        ['public/videos', 6],
    ];

    for (const [relativo, tetoMb] of orcamentos) {
        const mb = pesar(path.join(root, relativo)) / 1048576;
        assert.ok(
            mb <= tetoMb,
            `${relativo} esta com ${mb.toFixed(1)} MB e o teto e ${tetoMb} MB.\n`
            + '  Ou a arte encolhe, ou o teto sobe de proposito — mas nao em silencio.',
        );
    }
}

// Every selectable loop must be present locally, with its expected Ogg/Opus header.
{
    const player = fs.readFileSync(path.join(root, 'components/FocusAudioPlayer.tsx'), 'utf8');
    assert.ok(player.includes('`${import.meta.env.BASE_URL}audio/`'));
    const files = [...player.matchAll(/url: '([^']+\.ogg)'/g)].map(match => match[1]);
    assert.equal(files.length, 9);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/audio/manifest.json'), 'utf8'));
    assert.deepEqual(files.slice().sort(), manifest.tracks.map(track => track.file).sort());
    for (const name of files) {
        const data = fs.readFileSync(path.join(root, 'public/audio', name));
        assert.equal(data.toString('ascii', 0, 4), 'OggS', name);
        assert.ok(data.subarray(0, 100).includes(Buffer.from('OpusHead')), name);
        const record = manifest.tracks.find(track => track.file === name);
        assert.equal(createHash('sha256').update(data).digest('hex'), record.sha256, name);
        assert.equal(data.length, record.bytes, name);
    }
}
// Prevent reintroducing unused comparison GLBs or the discarded tree in the build.
{
    const assets = path.join(root, 'public/garden-experiment/assets');
    if (fs.existsSync(assets)) {
        assert.ok(!fs.readdirSync(assets).some(name => /\.(glb|jpg)$/.test(name)));
        assert.ok(!fs.readdirSync(path.join(assets, 'light')).some(name => name.includes('lean')));
    }
    const sand = JSON.parse(fs.readFileSync(path.join(root, 'tools/zen-quality/assets/sand/compact/report.json'), 'utf8'));
    const bytes = sand.textures.reduce((sum, texture) => sum + fs.statSync(path.join(root, 'tools/zen-quality/assets/sand/compact', texture.file)).size, 0);
    assert.equal(bytes, sand.totalBytes);
    assert.ok(bytes < 150_000, 'Compact sand textures exceed 150 KB');
}
console.log('egress-estatico: ok');
