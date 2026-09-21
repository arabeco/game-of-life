/**
 * Quais placeholders ainda estao no lugar da arte.
 *
 * Todo PNG de mentira sai do gerador com os MESMOS bytes, entao um hash
 * responde a pergunta sem depender de nome, tamanho ou data. Quando o desenho
 * chega e sobrescreve o arquivo, o hash muda e a peca sai desta lista sozinha.
 *
 * E o jeito de saber, a qualquer momento, o que falta — sem conferir 25
 * arquivos a olho.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const raiz = path.resolve(
    path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
    '..',
);

const hash = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

// A assinatura sai do proprio gerador, e nao de uma constante escrita a mao:
// mudar o desenho do xadrez nao pode quebrar esta conta.
const molde = path.join(raiz, 'node_modules', '.cache', 'placeholder-molde.png');
fs.mkdirSync(path.dirname(molde), { recursive: true });
const { execFileSync } = await import('node:child_process');
execFileSync(process.execPath, [
    path.join(raiz, 'scripts', 'gerar-placeholders.mjs'),
    path.relative(raiz, molde).split(path.sep).join('/'),
], { cwd: raiz, stdio: 'ignore' });
const assinatura = hash(molde);

const pendentes = [];
const andar = (dir) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
        const completo = path.join(dir, entrada.name);
        if (entrada.isDirectory()) andar(completo);
        else if (entrada.name.endsWith('.png') && hash(completo) === assinatura) {
            pendentes.push(path.relative(raiz, completo).split(path.sep).join('/'));
        }
    }
};
andar(path.join(raiz, 'public', 'assets'));

pendentes.sort();
if (pendentes.length === 0) {
    console.log('placeholders: nenhum. Toda a arte chegou.');
} else {
    console.log(`placeholders ainda no lugar da arte: ${pendentes.length}\n`);
    pendentes.forEach((p) => console.log(`  ${p}`));
}
