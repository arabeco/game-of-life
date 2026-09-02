import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

// 1. A versao do app nao pode voltar a ser um literal escrito a mao.
//
// Ela ficou em '1.0.48' enquanto o package.json chegava a 1.0.81, e isso nao era
// cosmetico: `isBroadcastCompatibleWithVersion` filtra comunicados por
// min_app_version e max_app_version usando esse valor. Um comunicado mirado nas
// versoes atuais simplesmente nao chegava a ninguem, sem erro nenhum.
{
    const source = read('components/AuthenticatedApp.tsx');
    assert.doesNotMatch(
        source,
        /const APP_VERSION = '\d+\.\d+\.\d+'/,
        'APP_VERSION deve vir de __APP_VERSION__ (vite.config.ts), nao de um literal',
    );
    assert.match(source, /__APP_VERSION__/, 'AuthenticatedApp deve usar __APP_VERSION__');
}

// 2. JSX morto mantido vivo com `{false && (` nao pode voltar.
//
// Sao telas antigas que ninguem apaga "por seguranca" e que passam a ser lidas,
// mantidas e refatoradas por engano — codigo que custa atencao e nao renderiza
// nada. O git guarda o que foi removido; o arquivo nao precisa guardar tambem.
{
    const files = [
        'views/ArenasView.tsx',
        'views/MundoView.tsx',
        'views/SettingsView.tsx',
        'views/SovereignPanelView.tsx',
    ];
    for (const file of files) {
        assert.doesNotMatch(read(file), /\{false && \(/, `${file} ainda tem JSX morto com {false && (`);
    }
}

// 3. Confirmacoes usam ConfirmationModal, nunca o dialogo nativo.
//
// No Android o `window.confirm` chega cinza, fora do tema, com o nome do pacote
// em cima — e some ao girar a tela, levando junto a decisao que ainda nao foi
// tomada. Ele tambem trava a thread enquanto estiver aberto.
{
    const walk = (dir, out = []) => {
        for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
            const relative = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(relative, out);
            else if (relative.endsWith('.tsx')) out.push(relative);
        }
        return out;
    };
    // O confirm nativo recebe uma string; o hook useConfirmation recebe um objeto.
    // Por isso o padrao exige aspas logo depois do parentese — assim `confirm({`
    // do hook nao e confundido com `confirm('` do navegador.
    const offenders = [...walk('views'), ...walk('components')].filter((file) => (
        /(^|[^A-Za-z.])(window\.)?confirm\(\s*['"`]/.test(read(file).replace(/\/\/.*$/gm, ''))
    ));
    assert.deepEqual(offenders, [], `window.confirm ainda usado em: ${offenders.join(', ')}`);
}

// 4. Botao so com icone precisa dizer o proprio nome.
//
// Sem nome ele sai como "botao" e nada mais para leitor de tela, e quem navega
// assim recebe uma fila de botoes indistinguiveis, adivinhando pela posicao.
//
// A heuristica e a mesma do scripts/list-unlabeled-buttons.mjs e e frouxa de
// proposito: erra para o lado de NAO acusar. Ela ja custou caro na primeira
// versao — dividia a tag no primeiro `>`, que em JSX quase nunca e o fim dela
// (`onClick={() => x}` tem um), e acusava 453 botoes quando havia 92. Rotular um
// botao que ja fala e pior do que nao rotular: aria-label SUBSTITUI o texto
// visivel, entao um rotulo diferente do que esta escrito faz a tela dizer duas
// coisas.
{
    const walk = (dir, out = []) => {
        for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
            const relative = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(relative, out);
            else if (relative.endsWith('.tsx')) out.push(relative);
        }
        return out;
    };
    const mudos = [];
    for (const file of [...walk('views'), ...walk('components')]) {
        const source = read(file);
        const pattern = /<button\b([^>]*)>([\s\S]*?)<\/button>/g;
        let match;
        while ((match = pattern.exec(source))) {
            const bloco = match[0];
            const temTexto = />[^<>{}]*[A-Za-zÀ-ú]{2,}[^<>{}]*</.test(bloco)
                || /\{[^}]*['"`][A-Za-zÀ-ú]{2,}/.test(bloco)
                || />\s*\{[^}]+\}\s*</.test(bloco)
                || /\{[^}]*(label|name|title|text|children)[^}]*\}/i.test(bloco)
                || />[^<>]{0,200}[A-Za-zÀ-ú]{2,}[^<>]{0,200}</.test(bloco);
            const temNome = /aria-label|title=/.test(bloco);
            if (!temTexto && !temNome) {
                mudos.push(`${file}:${source.slice(0, match.index).split('\n').length}`);
            }
        }
    }
    assert.deepEqual(mudos, [], `botao sem nome acessivel em: ${mudos.join(', ')}`);
}

console.log('ui-hygiene: ok');
