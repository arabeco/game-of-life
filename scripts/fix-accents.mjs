import fs from 'node:fs';
import path from 'node:path';

/**
 * Acerta a acentuacao dos textos de interface.
 *
 * O app mistura as duas grafias na mesma tela: "nao" aparece 335 vezes contra 68
 * da forma acentuada, "historico" 50 contra 4. Nenhuma das duas esta errada
 * sozinha; a MISTURA e que parece descuido.
 *
 * O risco aqui e real, e por isso o script e conservador em quatro camadas:
 *
 *   1. So toca em literal de string ou em texto JSX entre `>` e `<`.
 *   2. So quando o trecho tem pelo menos duas palavras — identificador, chave de
 *      objeto e valor de enum sao uma palavra so.
 *   3. Protege o conteudo de chaves antes de qualquer substituicao (veja
 *      protegeMarcadores abaixo).
 *   4. A tabela exclui de proposito as palavras ambiguas, onde a forma sem
 *      acento tambem existe em portugues: "esta" (pronome) vs a forma verbal,
 *      "so", "ate", "ja", "e", "porque". Errar nelas produz frase errada, que e
 *      pior do que frase sem acento.
 *
 * E MESMO ASSIM o diff inteiro deve ser lido antes de commitar. O script propoe;
 * quem le decide.
 *
 * Uso: node scripts/fix-accents.mjs
 */

// Chave = forma sem acento, valor = forma certa. So minusculas; a capitalizacao
// original e preservada na substituicao.
const WORDS = {
  nao: 'não', voce: 'você', voces: 'vocês', acao: 'ação', acoes: 'ações',
  historico: 'histórico', possivel: 'possível', rapido: 'rápido', rapida: 'rápida',
  tambem: 'também', estao: 'estão',
  sera: 'será', serao: 'serão', porem: 'porém', alem: 'além', apos: 'após',
  proximo: 'próximo', proxima: 'próxima', ultimo: 'último', ultima: 'última',
  numero: 'número', usuario: 'usuário', usuarios: 'usuários', missao: 'missão',
  missoes: 'missões', configuracao: 'configuração', configuracoes: 'configurações',
  conexao: 'conexão', conexoes: 'conexões', descricao: 'descrição', opcao: 'opção',
  opcoes: 'opções', codigo: 'código', pagina: 'página', memoria: 'memória',
  automatico: 'automático', automatica: 'automática', publico: 'público',
  publica: 'pública', diario: 'diário', diaria: 'diária',
  media: 'média', minimo: 'mínimo', maximo: 'máximo', nivel: 'nível', niveis: 'níveis',
  oraculo: 'oráculo', cla: 'clã', clas: 'clãs', bau: 'baú', baus: 'baús',
  premio: 'prêmio', premios: 'prêmios', experiencia: 'experiência', sequencia: 'sequência',
  inicio: 'início', termino: 'término', horario: 'horário', horarios: 'horários',
  calendario: 'calendário', relatorio: 'relatório', relatorios: 'relatórios',
  estatisticas: 'estatísticas', conteudo: 'conteúdo', titulo: 'título',
};

const wordPattern = new RegExp(`\\b(${Object.keys(WORDS).join('|')})\\b`, 'gi');

const fixWords = (text) => text.replace(wordPattern, (match) => {
  const fixed = WORDS[match.toLowerCase()];
  if (!fixed) return match;
  if (match === match.toUpperCase()) return fixed.toUpperCase();
  if (match[0] === match[0].toUpperCase()) return fixed[0].toUpperCase() + fixed.slice(1);
  return fixed;
});

// O sentinela e ALFANUMERICO de proposito, e isso nao e detalhe.
//
// Palavra partida por interpolacao existe e e comum:
//     `com ${n} acao${n === 1 ? '' : 'es'} pendente`
// "acao" e "es" sao a mesma palavra, cortada ao meio pelo plural. Com sentinela
// de pontuacao ou de controle, o corte vira FRONTEIRA DE PALAVRA: a regex casa
// com "acao", troca por "acao" acentuada, e o resultado e "acaoes" com acento no
// meio. Rodei assim e o teste do coach de ciclo pegou — depois de eu ter revisado
// o diff de views/ e nao o de utils/.
//
// Sendo letras, nao ha fronteira ali e a palavra partida fica intocada. Ela
// continua sem acento, o que e o certo: acentua-la exigiria entender o codigo.
const ABRE = 'zzmarcadorzz';
const FECHA = 'zzfimzz';

/**
 * Tira de circulação tudo que estiver entre chaves, e devolve depois.
 *
 * Duas razoes. A primeira: marcador de fala como {acoes} e preenchido por
 * `/\{(\w+)\}/`, e `\w` e [A-Za-z0-9_] — acentuado, ele deixa de casar, nao e
 * substituido por nada, e a pessoa le "{ações}" na tela. A segunda: dentro de
 * chaves ha CODIGO, e codigo nao se acentua.
 *
 * Sobre a escolha do sentinela, veja o bloco acima da constante ABRE. Uma
 * versao anterior usava " N " com espacos ao redor — isso destroi qualquer frase
 * que ja contenha um numero isolado, porque "Faltam 3 moedas" tem " 3 " e a
 * restauracao trocaria esse 3 pelo marcador de indice 3, ou por `undefined` se
 * ele nao existisse. Rodei essa versao por engano e revertei: o estrago teria
 * sido silencioso e em texto, que e onde ninguem procura defeito.
 */
const protegeMarcadores = (text) => {
  const guardados = [];
  // O `$` de `${...}` entra na protecao. Deixado de fora, ele sobra colado na
  // palavra anterior — e `$` nao e caractere de palavra, entao cria a fronteira
  // que o sentinela alfanumerico existe para evitar. Foi assim que
  // `acao${n === 1 ? '' : 'es'}` virou "acaoes" com acento no meio.
  const semMarcadores = text.replace(/\$?\{[^{}]*\}/g, (todo) => {
    guardados.push(todo);
    return `${ABRE}${guardados.length - 1}${FECHA}`;
  });
  const devolve = (resultado) => resultado.replace(
    new RegExp(`${ABRE}(\\d+)${FECHA}`, 'g'),
    (_todo, indice) => guardados[Number(indice)],
  );
  return [semMarcadores, devolve];
};

const corrige = (trecho) => {
  const [semMarcadores, devolve] = protegeMarcadores(trecho);
  return devolve(fixWords(semMarcadores));
};

// A regra do texto JSX (`>isto aqui<`) so vale em .tsx.
//
// Em .ts nao ha JSX, mas ha comparacao: `a > ultima && inicio < b` casa com o
// mesmo padrao, e o script acentuou IDENTIFICADORES — `ultima` virou `última` e
// o arquivo parou de compilar. Rodei assim uma vez e revertei. Literal de string
// continua valendo nas duas extensoes, porque la o conteudo e texto de verdade.
const fixSource = (source, ehTsx) => {
  const comStrings = source.replace(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g, (whole, quote, body) => (
    /\s/.test(body.trim()) ? `${quote}${corrige(body)}${quote}` : whole
  ));
  if (!ehTsx) return comStrings;
  return comStrings.replace(/>([^<>{}]+)</g, (whole, body) => (
    /\s/.test(body.trim()) ? `>${corrige(body)}<` : whole
  ));
};

const root = process.cwd();
const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(full)) files.push(full);
  }
};
// As pastas vem por argumento, com views e components como padrao. As falas do
// Oraculo moram em utils/ e em supabase/functions/_shared/, e ficaram de fora da
// primeira passada — justamente o texto mais lido do app.
const alvos = process.argv.slice(2);
for (const alvo of (alvos.length ? alvos : ['views', 'components'])) {
  walk(path.join(root, alvo));
}

let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  const after = fixSource(before, file.endsWith('.tsx'));
  if (after !== before) {
    // Rede final: sentinela que sobrou significa restauracao incompleta, e
    // gravar isso corromperia o arquivo em silencio.
    if (after.includes(ABRE) || after.includes(FECHA)) {
      console.error(`ABORTADO em ${path.relative(root, file)}: sentinela nao restaurado`);
      process.exit(1);
    }
    fs.writeFileSync(file, after, 'utf8');
    changed += 1;
    console.log('ajustado:', path.relative(root, file));
  }
}
console.log(`arquivos alterados: ${changed}`);
