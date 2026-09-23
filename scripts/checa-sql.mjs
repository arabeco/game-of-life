#!/usr/bin/env node
/**
 * COMPILA UM ARQUIVO DE SQL ANTES DE ELE SAIR DAQUI.
 *
 * Um `case ... when ... then ... end` dentro da condicao de um `IF` nao compila
 * em plpgsql: o parser procura o THEN que fecha o IF, acha primeiro o do CASE,
 * e engole o resto do arquivo. O erro sai como "syntax error at end of input",
 * apontando para uma linha que nao tem defeito nenhum.
 *
 * Um arquivo assim foi entregue para ser rodado em producao. Ninguem tinha como
 * saber: nesta maquina nao ha Postgres nem Docker, entao o SQL era conferido
 * lendo. Ler nao compila.
 *
 * O PGlite e um Postgres de verdade compilado para WebAssembly. Roda em dois
 * segundos, sem Docker e sem servico, e diz a mesma frase que o Supabase diria.
 * Ele NAO substitui rodar em producao: nao tem os dados, nao tem sessao, e o
 * andaime e so o bastante para o arquivo se sustentar. Responde uma pergunta
 * so, que e a que estava sem resposta: ISTO COMPILA?
 *
 *   npm run sql:checa                        # a migracao mais recente
 *   npm run sql:checa -- caminho/arquivo.sql # um arquivo especifico
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '..');

// ---------------------------------------------------------------------------
// O FILHO: e ele quem fala com o Postgres.
// ---------------------------------------------------------------------------

if (process.argv.includes('--worker')) {
  const alvo = process.argv[process.argv.indexOf('--worker') + 1];
  const { PGlite } = await import('@electric-sql/pglite');
  const db = await PGlite.create();

  try {
    await db.exec(readFileSync(path.join(raiz, 'scripts', 'sql-andaime.sql'), 'utf8'));
  } catch (erro) {
    console.log(`ANDAIME\t${erro.message}`);
    process.exit(0);
  }

  const fonte = readFileSync(alvo, 'utf8');
  try {
    await db.exec(fonte);
    console.log('OK');
  } catch (erro) {
    const linha = erro.position
      ? fonte.slice(0, Number(erro.position)).split('\n').length
      : 0;
    console.log(`ERRO\t${erro.message}\t${linha}`);
  }
  process.exit(0);
}

// ---------------------------------------------------------------------------
// O PAI: decide pela SAIDA do filho, e nao pelo codigo de saida dele.
//
// O worker do PGlite derruba o processo no teardown no Windows — um assert do
// libuv que troca o codigo de saida por 127 mesmo quando o SQL compilou. O
// codigo de saida dali nao serve para nada; a linha impressa serve.
// ---------------------------------------------------------------------------

const alvos = process.argv.slice(2).filter((a) => !a.startsWith('-'));

if (alvos.length === 0) {
  const dir = path.join(raiz, 'supabase', 'migrations');
  const maisRecente = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().pop();
  if (!maisRecente) {
    console.error('[checa-sql] nenhuma migracao encontrada em supabase/migrations');
    process.exit(2);
  }
  alvos.push(path.join(dir, maisRecente));
}

let falhas = 0;

for (const alvo of alvos) {
  const caminho = path.resolve(raiz, alvo);
  const nome = path.relative(raiz, caminho);

  // Um processo — e portanto um banco vazio — por arquivo: uma migracao nao
  // pode passar so porque a anterior deixou algo de pe.
  const filho = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', caminho], {
    encoding: 'utf8',
    cwd: raiz,
  });

  const veredito = (filho.stdout || '').split('\n').find((l) => /^(OK|ERRO|ANDAIME)\b/.test(l));

  if (!veredito) {
    falhas += 1;
    console.log(`[?] ${nome} — o checador nao devolveu veredito`);
    if (filho.stderr) console.log(filho.stderr.trim().split('\n').slice(0, 3).join('\n'));
    continue;
  }

  const [tipo, mensagem, linha] = veredito.split('\t');

  if (tipo === 'OK') {
    console.log(`[ok] ${nome}`);
    continue;
  }

  if (tipo === 'ANDAIME') {
    console.log(`[andaime] ${mensagem}`);
    console.log('  conserte scripts/sql-andaime.sql — o arquivo checado pode estar certo');
    process.exit(2);
  }

  // FALTA DE VIZINHO NAO E ERRO DO ARQUIVO.
  //
  // O andaime tem o que as migracoes checadas ate hoje precisaram, e nao uma
  // copia do banco. Quando falta uma tabela, o que se descobriu foi um buraco
  // no andaime — dizer "FALHOU" ali treinaria a ignorar a palavra, e no dia de
  // uma falha de verdade ela nao seria lida.
  const faltaVizinho = /relation ".+" does not exist|column ".+" does not exist|function .+ does not exist|type ".+" does not exist/.test(mensagem);

  if (faltaVizinho) {
    console.log(`[incompleto] ${nome}`);
    console.log(`  ${mensagem}`);
    console.log('  o andaime nao tem esse vizinho; acrescente em scripts/sql-andaime.sql para checar este arquivo');
    continue;
  }

  falhas += 1;
  console.log(`[FALHOU] ${nome}`);
  console.log(`  ${mensagem}`);
  // O plpgsql aponta o FIM do trecho que ele nao conseguiu fechar, e nao o
  // comeco do problema. A linha e onde ele desistiu, nao onde voce errou.
  if (Number(linha) > 0) console.log(`  ate a linha ${linha}`);
  if (/syntax error at end of input/.test(mensagem)) {
    console.log('  dica: um CASE dentro da condicao de um IF engole o resto do arquivo.');
  }
}

process.exit(falhas > 0 ? 1 : 0);
