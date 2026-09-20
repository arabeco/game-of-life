/**
 * PNGs de mentira, nos nomes de verdade.
 *
 * A arte chega em dois dias. Ate la o codigo pode ficar inteiro — item criado,
 * degrau ligado, bau e loja apontando — desde que exista um arquivo no caminho
 * que o item promete. Sem arquivo, o `isItemCatalogVisible` esconde a peca do
 * catalogo sem avisar, e a gente ficaria montando as portas no escuro.
 *
 * Por isso os arquivos saem com o NOME FINAL. Quando o desenho chegar, e so
 * sobrescrever: nenhuma linha de codigo muda.
 *
 * E eles sao feios de proposito. Xadrez magenta e preto, 500x500, com uma
 * moldura clara — ninguem confunde isto com arte pronta, nem de longe, nem numa
 * captura de tela mandada por engano.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const LADO = 500;

const crcTabela = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c;
    }
    return t;
})();

const crc32 = (buf) => {
    let c = -1;
    for (const b of buf) c = crcTabela[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
};

const pedaco = (tipo, dados) => {
    const tamanho = Buffer.alloc(4);
    tamanho.writeUInt32BE(dados.length);
    const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(corpo));
    return Buffer.concat([tamanho, corpo, crc]);
};

/** Um xadrez magenta, com moldura, em RGBA cru. */
const desenha = () => {
    // Cada linha leva um byte de filtro (0) na frente. E o formato do PNG.
    const linhas = [];
    for (let y = 0; y < LADO; y++) {
        const linha = Buffer.alloc(1 + LADO * 4);
        for (let x = 0; x < LADO; x++) {
            const naMoldura = x < 6 || y < 6 || x >= LADO - 6 || y >= LADO - 6;
            const quadrado = (Math.floor(x / 25) + Math.floor(y / 25)) % 2 === 0;
            const i = 1 + x * 4;
            if (naMoldura) {
                linha[i] = 255; linha[i + 1] = 255; linha[i + 2] = 255; linha[i + 3] = 255;
            } else if (quadrado) {
                linha[i] = 230; linha[i + 1] = 30; linha[i + 2] = 160; linha[i + 3] = 255;
            } else {
                linha[i] = 20; linha[i + 1] = 20; linha[i + 2] = 26; linha[i + 3] = 255;
            }
        }
        linhas.push(linha);
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(LADO, 0);
    ihdr.writeUInt32BE(LADO, 4);
    ihdr[8] = 8;   // bits por canal
    ihdr[9] = 6;   // RGBA
    ihdr[10] = 0;  // deflate
    ihdr[11] = 0;  // filtro padrao
    ihdr[12] = 0;  // sem entrelacamento

    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        pedaco('IHDR', ihdr),
        pedaco('IDAT', zlib.deflateSync(Buffer.concat(linhas), { level: 9 })),
        pedaco('IEND', Buffer.alloc(0)),
    ]);
};

const raiz = path.resolve(
    path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
    '..',
);

const png = desenha();
const alvos = process.argv.slice(2);

if (!alvos.length) {
    console.error('uso: node scripts/gerar-placeholders.mjs <caminho relativo> [...]');
    process.exit(1);
}

let escritos = 0;
let pulados = 0;
for (const alvo of alvos) {
    const destino = path.join(raiz, alvo);
    // Nunca por cima de arte de verdade. Se ja existe, o desenho chegou.
    if (fs.existsSync(destino)) { pulados++; continue; }
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, png);
    escritos++;
}

console.log(`placeholders: ${escritos} escrito(s), ${pulados} pulado(s) por ja existirem`);
console.log(`  ${LADO}x${LADO}, xadrez magenta — troque o arquivo quando a arte chegar`);
