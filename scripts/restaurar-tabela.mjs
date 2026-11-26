/**
 * DE VOLTA DO BACKUP (26/11/2026).
 *
 * Le uma tabela da copia feita por `npm run backup` e escreve o SQL que a
 * devolve ao banco, para colar no SQL Editor do Supabase. Nao toca no banco.
 *
 *   npm run restaurar -- <pasta-do-backup> <schema.tabela> [--so-faltando]
 *   ex.: npm run restaurar -- C:\Users\Afonso\GlyphBackups\2026-11-26 public.scheduled_tasks --so-faltando
 *
 * --so-faltando: devolve so as linhas cujo id sumiu (on conflict do nothing).
 *   E o caso comum: algo apagou linhas e o resto da tabela esta bom.
 * Sem a opcao: apaga a tabela inteira e poe a copia no lugar (dentro de uma
 * transacao; se algo falhar, nada muda).
 *
 * Usa json_populate_recordset: as colunas sao casadas pelo nome com a tabela
 * de hoje, entao coluna nova fica com o padrao e coluna que saiu e ignorada.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [pasta, tabela, ...resto] = process.argv.slice(2);
if (!pasta || !/^[a-z_]+\.[a-z0-9_]+$/.test(tabela || '')) {
    console.error('uso: npm run restaurar -- <pasta-do-backup> <schema.tabela> [--so-faltando]');
    process.exit(1);
}
const soFaltando = resto.includes('--so-faltando');
const linhas = JSON.parse(readFileSync(join(pasta, 'dados', `${tabela}.json`), 'utf8'));
const tag = '$copia$';
const json = JSON.stringify(linhas);
if (json.includes(tag)) throw new Error('a copia tem o marcador do SQL');

const sql = [
    `-- Restaurar ${tabela} a partir de ${pasta} (${linhas.length} linhas).`,
    soFaltando ? '-- So as linhas que faltam (pelo id); as que existem ficam como estao.' : '-- Troca a tabela inteira pela copia.',
    'begin;',
    soFaltando ? '' : `delete from ${tabela};`,
    `insert into ${tabela}`,
    `select * from json_populate_recordset(null::${tabela}, ${tag}${json}${tag}::json)`,
    soFaltando ? 'on conflict do nothing;' : ';',
    'commit;',
    '',
    `select count(*) as linhas_agora from ${tabela};`,
    '',
].filter((l) => l !== '').join('\n');

const saida = join(pasta, `restaurar-${tabela}${soFaltando ? '-faltando' : ''}.sql`);
writeFileSync(saida, sql);
console.log(`ok - ${saida}`);
