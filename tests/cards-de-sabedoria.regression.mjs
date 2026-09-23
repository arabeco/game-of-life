import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  ORACLE_CARD_LIBRARY,
  pickOracleCard,
  getOracleCardStockSize,
} from '../constants/oracleCardLibrary.ts';

const le = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

const edge = le('supabase/functions/oracle/index.ts');
const chat = le('components/OracleChat.tsx');
const contexto = le('contexts/GameContext.tsx');

/* ==========================================================================
 * O CARD DE SABEDORIA NUNCA CHEGOU, E FORAM TRES CAUSAS EMPILHADAS.
 *
 * Medido em 21/09/2026: 676 contas, 2 com o toggle ligado. O cron rodava de dez
 * em dez minutos, procurava gente elegivel, achava duas, e ia embora.
 *
 * 1. A porta nascia fechada: daily_focus_card_enabled entrou com default false,
 *    e o lote do cron exige ela true.
 * 2. As duas entregas dividiam um contador so, entao a leitura do ciclo saia
 *    primeiro e gastava a vaga do dia.
 * 3. A leitura sorteava um tema da biblioteca so para ter o que gravar na coluna
 *    de categoria, e o roteamento era por categoria — entao ela caia em
 *    Sabedoria com rotulo de card e corpo de relatorio.
 *
 * Cada uma sozinha ja bastaria para o recurso nao existir. Este teste guarda as
 * tres, porque consertar so a primeira faria o card chegar na aba errada.
 * ========================================================================== */

// ---------------------------------------------------------------------------
// 1. A PORTA NASCE ABERTA — nos tres lugares, ou nao adianta em nenhum.
// ---------------------------------------------------------------------------

const migracoes = [
  'supabase/migrations/20260921120000_daily_card_is_on_by_default.sql',
];
assert.ok(
  migracoes.some((caminho) => existsSync(new URL(`../${caminho}`, import.meta.url))),
  'A migracao que abre o default do card do dia sumiu.',
);
const migracao = le(migracoes[0]);
assert.match(
  migracao,
  /alter column daily_focus_card_enabled set default true/,
  'A coluna precisa nascer true: o lote do cron exige ela true para incluir a pessoa.',
);
assert.match(
  migracao,
  /update public\.oracle_preferences\s+set daily_focus_card_enabled = true/,
  'Mudar so o default deixaria as 674 contas existentes de fora para sempre.',
);

assert.doesNotMatch(
  edge,
  /dailyFocusCardEnabled: false/,
  'O default do edge function e consultado quando a linha nao existe: false ali exclui a pessoa do lote.',
);
assert.doesNotMatch(
  contexto,
  /dailyFocusCardEnabled: false/,
  'O app tem dois defaults (linha carregada e linha nova). Os dois precisam nascer ligados.',
);

// ---------------------------------------------------------------------------
// 2. DUAS ENTREGAS, DOIS CONTADORES.
// ---------------------------------------------------------------------------

assert.match(
  edge,
  /const faltaInsight = !jaSaiuHoje\("cycle_insight"\)/,
  'A leitura do ciclo tem de ter contagem propria.',
);
assert.match(
  edge,
  /const faltaSabedoria = !jaSaiuHoje\("premium_content_card"\)/,
  'O card de tema tem de ter contagem propria, senao a leitura gasta a vaga dele.',
);
assert.match(
  edge,
  /if \(!faltaInsight && !faltaSabedoria\) return \{ status: "skipped", reason: "daily_limit" \}/,
  'So para o dia quando as DUAS ja sairam.',
);

// ---------------------------------------------------------------------------
// 3. A LEITURA NAO PEGA TEMA EMPRESTADO.
//
// analise_padroes e o nome proprio dela: "Leitura de ritmo". Ele fica FORA da
// lista de temas da biblioteca, entao a leitura nunca consome um tema nem
// aparece na lista que a pessoa marca nas preferencias.
// ---------------------------------------------------------------------------

assert.match(
  edge,
  /category = "analise_padroes";\s*\n\s*purpose = "cycle_insight";/,
  'A leitura tem de gravar a propria categoria, nao uma da biblioteca.',
);

const blocoDaBiblioteca = edge.match(
  /const ORACLE_MANUAL_LIBRARY_CATEGORIES: OracleCategory\[\] = \[([\s\S]*?)\];/,
);
assert.ok(blocoDaBiblioteca, 'A lista de temas da biblioteca sumiu do edge function.');
assert.doesNotMatch(
  blocoDaBiblioteca[1],
  /analise_padroes/,
  'analise_padroes na lista de temas faria a leitura voltar a competir por uma vaga de card.',
);

// ---------------------------------------------------------------------------
// 4. SABEDORIA E LISTA DE PERMISSAO, E AS DUAS PONTAS LEEM A MESMA.
//
// A regra era por EXCLUSAO: tudo que nao fosse leitura de ciclo caia em
// Sabedoria. Uma aba definida pelo que NAO tem herda tudo o que nascer depois —
// foi assim que o card do coach ("voce ja provou que consegue") entrou ali, por
// nao ser leitura de ciclo. Agora ela e definida pelo que tem: card da
// biblioteca.
//
// A hidratacao e o filtro da aba ja discordaram uma vez, e discordaram de novo
// quando so a hidratacao foi corrigida. Por isso os dois chamam a MESMA funcao.
// ---------------------------------------------------------------------------

assert.match(
  chat,
  /const PROPOSITOS_DE_BIBLIOTECA = new Set\(\['premium_content_card'\]\)/,
  'So o card que saiu da biblioteca pertence a Sabedoria; a lista precisa ser de permissao.',
);

const usosDoRoteador = chat.match(/ehCardDeBiblioteca\(/g) || [];
assert.ok(
  usosDoRoteador.length >= 2,
  `As duas pontas (hidratacao e filtro) precisam chamar ehCardDeBiblioteca. Chamadas encontradas: ${usosDoRoteador.length}`,
);

assert.match(
  chat,
  /section: ehCardDeBiblioteca\(feedMessage\.deliveryType, feedMessage\.category, feedMessage\.contextSnapshot\?\.purpose\) \? 'wisdom' : 'guidance'/,
  'A hidratacao precisa rotear pela origem do card, e nao pelo que ele nao e.',
);

assert.match(
  chat,
  /wisdomIds = new Set\(\(oracleMessages \|\| \[\]\)\.filter\(message => [^\n]*ehCardDeBiblioteca\(message\.deliveryType, message\.category, message\.contextSnapshot\?\.purpose\)\)/,
  'O filtro da aba precisa usar o mesmo criterio da hidratacao, senao o card volta a entrar por ele.',
);

// Card gravado antes de o proposito existir na coluna nao tem como ser
// classificado pela origem. Mandar o historico inteiro para a outra aba seria
// pior que o defeito, entao ali vale a regra antiga.
assert.match(
  chat,
  /if \(!purpose\) return !ehLeitura\(category\);/,
  'O card antigo, sem proposito gravado, precisa manter a regra de antes.',
);

// ---------------------------------------------------------------------------
// 5. UM BANCO SO, DOIS CONSUMIDORES.
//
// O card pedido a mao nasce no app; o card do dia nasce no cron. Se o banco
// vivesse so em constants/, o servidor precisaria de uma copia — e uma copia de
// centenas de textos vira duas verdades no primeiro dia em que alguem escrever
// num arquivo so.
// ---------------------------------------------------------------------------

assert.match(
  edge,
  /import \{ pickOracleCard \} from "\.\.\/_shared\/oracle-card-library\.ts"/,
  'O cron tem de puxar do mesmo banco que o botao manual usa.',
);
assert.match(
  le('constants/oracleCardLibrary.ts'),
  /from '\.\.\/supabase\/functions\/_shared\/oracle-card-library\.ts'/,
  'O app tem de reexportar o banco compartilhado em vez de guardar uma copia.',
);
assert.ok(
  !existsSync(new URL('../supabase/functions/oracle/oracle-card-library.ts', import.meta.url)),
  'Uma copia do banco dentro da funcao e exatamente o que este teste existe para impedir.',
);

assert.match(
  edge,
  /text = pickOracleCard\(\{/,
  'O card do dia tem de sair do banco escrito, e nao da frase de contexto.',
);

// ---------------------------------------------------------------------------
// 6. O BANCO ENTREGA DE VERDADE.
// ---------------------------------------------------------------------------

const temasDaBiblioteca = [
  'frases_inspiradoras',
  'reflexoes_filosoficas',
  'fragmentos_sabedoria',
  'rituais_lifestyle',
  'sussurros_maestria',
];

for (const tema of temasDaBiblioteca) {
  assert.ok(
    getOracleCardStockSize(tema) > 0,
    `O tema ${tema} esta na lista de escolha mas nao tem card nenhum: a pessoa marca e nunca recebe.`,
  );
  const card = pickOracleCard({ category: tema, deliveredContents: [] });
  assert.equal(typeof card, 'string');
  assert.ok(card.trim().length > 0, `O tema ${tema} entregou card vazio.`);
}

// Um tema inteiro ja visto nao pode devolver null: ele reusa o mais antigo. Sem
// isso, quem acompanha o app ha meses simplesmente para de receber card.
const tema = temasDaBiblioteca[0];
const tudoVisto = [...ORACLE_CARD_LIBRARY[tema]];
const reuso = pickOracleCard({ category: tema, deliveredContents: tudoVisto });
assert.ok(
  typeof reuso === 'string' && reuso.trim().length > 0,
  'Com o tema todo visto o banco tem de reusar, nao calar.',
);

console.log('[cards-de-sabedoria] ok');
