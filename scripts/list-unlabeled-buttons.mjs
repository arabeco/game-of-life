import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Lista os <button> que nao dizem o proprio nome.
 *
 * Um botao so com icone e mudo para leitor de tela: sai como "botao" e nada
 * mais. Quem navega assim recebe uma fila de botoes indistinguiveis e tem de
 * adivinhar pela posicao.
 *
 * A heuristica e deliberadamente frouxa — texto visivel OU uma expressao que
 * provavelmente rende texto OU aria-label OU title. Ela erra para o lado de
 * nao acusar: e melhor deixar passar um mudo do que mandar alguem "consertar"
 * trinta botoes que ja falam.
 *
 * Uso:
 *   node scripts/list-unlabeled-buttons.mjs                      (tudo)
 *   node scripts/list-unlabeled-buttons.mjs views/SettingsView.tsx
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const targets = process.argv.slice(2);
const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (full.endsWith('.tsx')) files.push(full);
  }
};
walk(path.join(root, 'views'));
walk(path.join(root, 'components'));

const wanted = targets.length
  ? files.filter((file) => targets.some((target) => file.replace(/\\/g, '/').endsWith(target)))
  : files;

let total = 0;
for (const file of wanted) {
  const source = fs.readFileSync(file, 'utf8');
  const pattern = /<button\b([^>]*)>([\s\S]*?)<\/button>/g;
  let match;
  const hits = [];
  while ((match = pattern.exec(source))) {
    // Olha o BLOCO INTEIRO, nao a divisao entre atributos e conteudo.
    //
    // A primeira versao usava match[1] (atributos) e match[2] (conteudo), e o
    // corte entre os dois e o primeiro `>` — que quase nunca e o fim da tag,
    // porque `onClick={() => algo}` tem um `>` no meio. Com isso o texto real do
    // botao caia fora da parte analisada e botoes como
    // `<button onClick={() => recusar()}>RECUSAR</button>` eram acusados de
    // mudos. Como arrow em onClick e a regra, o numero saia inflado.
    const bloco = match[0];
    const hasVisibleText =
      // Texto solto entre tags: <button ...>SALVAR</button>
      />[^<>{}]*[A-Za-zÀ-ú]{2,}[^<>{}]*</.test(bloco)
      // Texto dentro de chaves: {sending ? 'ENVIANDO...' : 'ENVIAR RELATORIO'}
      // Sem isto, todo botao cujo rotulo muda com o estado era dado como mudo —
      // e rotulo que muda com o estado e justamente o dos botoes que importam.
      || /\{[^}]*['"`][A-Za-zÀ-ú]{2,}/.test(bloco)
      // Interpolacao que E o conteudo inteiro de um filho: <span>{value}</span>
      || />\s*\{[^}]+\}\s*</.test(bloco)
      // Texto misturado com interpolacao: >Adquira {faltam} moedas aqui<
      // As chaves entram na corrida aqui; nas regras acima elas eram excluidas,
      // e por isso frases com um numero no meio passavam por botao mudo.
      || />[^<>]{0,200}[A-Za-zÀ-ú]{2,}[^<>]{0,200}</.test(bloco)
      || /\{[^}]*(label|name|title|text|children)[^}]*\}/i.test(bloco);
    const hasName = /aria-label|title=/.test(bloco);
    if (!hasVisibleText && !hasName) {
      const line = source.slice(0, match.index).split('\n').length;
      hits.push(line);
    }
  }
  if (hits.length) {
    total += hits.length;
    console.log(`${path.relative(root, file)} (${hits.length}): linhas ${hits.join(', ')}`);
  }
}
console.log(`total: ${total}`);
