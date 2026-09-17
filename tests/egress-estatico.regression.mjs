import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const ANFITRIAO = 'supabase.co/storage/v1/object/public';

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
    // PENDENTE — item 1 da lista de egress. As nove faixas precisam virar Opus
    // e ir para public/audio/. Quando isso acontecer, esta linha sai e o teste
    // cobra que ela saia.
    ['components/FocusAudioPlayer.tsx', 'PENDENTE: 20,1 MB de audio ainda servidos do bucket com no-cache'],
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
        ['public/garden-experiment', 14],
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

console.log('egress-estatico: ok');
