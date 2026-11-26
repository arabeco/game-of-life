/**
 * BACKUP DO BANCO SEM SENHA E SEM DOCKER (26/11/2026).
 *
 * O plano gratis do Supabase nao guarda copia nenhuma, e o GitHub so tem o
 * codigo e as migracoes: contas, tarefas, perfis e compras so existem no banco.
 * Este script copia os dados tabela por tabela, SO LENDO (o mesmo acesso
 * `db query --read-only` da checagem de prontidao, pelo login do CLI), e grava
 * uma pasta por dia FORA do projeto — ela tem e-mails e o hash das senhas, e
 * nao pode ir para o git.
 *
 *   npm run backup                 (dados + esquema + arquivos do storage)
 *   npm run backup -- --sem-arquivos
 *   npm run backup -- --destino D:\copias
 *
 * Fica em <destino>/AAAA-MM-DD/:
 *   dados/<schema>.<tabela>.json  as linhas, como o banco devolve
 *   esquema.json                  colunas, funcoes, regras (RLS), gatilhos, views e crons
 *   arquivos/<bucket>/...         os arquivos publicos do storage
 *   manifesto.json                quantas linhas cada tabela tinha e quantas vieram
 *
 * O manifesto confere cada tabela: o que veio tem de bater com o count(*) do
 * banco. Se alguma nao bater, o script termina com erro.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';

const args = process.argv.slice(2);
const valor = (nome) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : undefined; };
const DESTINO = valor('--destino') || join(homedir(), 'GlyphBackups');
const COM_ARQUIVOS = !args.includes('--sem-arquivos');
const POR_PAGINA = 2000;

/** Tabelas que so guardam rastro passageiro (logs, sessoes, filas): nao entram. */
const FORA = new Set([
    'net._http_response', 'net.http_request_queue', 'cron.job_run_details',
    'auth.refresh_tokens', 'auth.sessions', 'auth.flow_state', 'auth.mfa_amr_claims',
    'auth.mfa_challenges', 'auth.one_time_tokens', 'auth.audit_log_entries', 'auth.schema_migrations',
    'supabase_functions.hooks', 'supabase_functions.migrations', 'storage.migrations',
]);
/** Fora do public, so o que e preciso para refazer contas e arquivos. */
const SCHEMAS = ['public', 'auth', 'storage', 'cron'];

const pastaTemp = mkdtempSync(join(tmpdir(), 'glyph-backup-'));
const arquivoSql = join(pastaTemp, 'consulta.sql');

const consultar = (sql) => {
    writeFileSync(arquivoSql, sql);
    const saida = execFileSync('npx', ['-y', 'supabase@3.4.0', 'db', 'query', '--remote', '--read-only', '--output-format', 'json', '-f', arquivoSql], {
        cwd: new URL('..', import.meta.url),
        env: { ...process.env, SUPABASE_ACCESS_TOKEN: '' },
        encoding: 'utf8',
        maxBuffer: 512 * 1024 * 1024,
        shell: process.platform === 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    const json = JSON.parse(saida.slice(saida.indexOf('{')));
    if (json.error) throw new Error(json.error.message || String(json.error));
    return json.rows || [];
};

const aspas = (nome) => `"${String(nome).replace(/"/g, '""')}"`;
const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const pasta = join(DESTINO, hoje);
mkdirSync(join(pasta, 'dados'), { recursive: true });

console.log(`Backup em ${pasta}`);

// 1. As tabelas, com a chave primaria para paginar sempre na mesma ordem.
const tabelas = consultar(`
select n.nspname as schema, c.relname as tabela,
  coalesce((select string_agg(quote_ident(a.attname), ',' order by k.ord)
            from pg_index i cross join lateral unnest(i.indkey) with ordinality k(attnum, ord)
            join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
            where i.indrelid = c.oid and i.indisprimary), '') as chave
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where c.relkind in ('r', 'p') and n.nspname in (${SCHEMAS.map((s) => `'${s}'`).join(',')})
order by 1, 2;`).filter((t) => !FORA.has(`${t.schema}.${t.tabela}`));

const manifesto = { feito_em: new Date().toISOString(), tabelas: {} };
const falhas = [];

for (const { schema, tabela, chave } of tabelas) {
    const nome = `${schema}.${tabela}`;
    const alvo = `${aspas(schema)}.${aspas(tabela)}`;
    try {
        const [{ total }] = consultar(`select count(*)::bigint as total from ${alvo};`);
        const linhas = [];
        for (let desde = 0; desde < Number(total); desde += POR_PAGINA) {
            const pagina = consultar(`select coalesce(json_agg(x), '[]'::json)::text as dados from (
                select * from ${alvo} t order by ${chave || 'ctid'} limit ${POR_PAGINA} offset ${desde}) x;`);
            linhas.push(...JSON.parse(pagina[0].dados));
        }
        writeFileSync(join(pasta, 'dados', `${nome}.json`), JSON.stringify(linhas));
        const ok = linhas.length === Number(total);
        manifesto.tabelas[nome] = { no_banco: Number(total), na_copia: linhas.length, ok };
        if (!ok) falhas.push(`${nome}: banco ${total}, copia ${linhas.length}`);
        process.stdout.write(ok ? '.' : 'x');
    } catch (erro) {
        manifesto.tabelas[nome] = { erro: String(erro.message || erro).slice(0, 300) };
        falhas.push(`${nome}: ${String(erro.message || erro).slice(0, 120)}`);
        process.stdout.write('E');
    }
}
console.log('');

// 2. O esquema que as migracoes do git podem nao ter igual ao banco.
const esquema = {
    colunas: consultar(`select table_schema, table_name, column_name, data_type, udt_name, is_nullable, column_default
        from information_schema.columns where table_schema in ('public','storage') order by 1,2,ordinal_position;`),
    funcoes: consultar(`select p.proname as nome, pg_get_function_identity_arguments(p.oid) as args, pg_get_functiondef(p.oid) as definicao
        from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prokind in ('f','p') order by 1,2;`),
    regras: consultar(`select schemaname, tablename, policyname, permissive, roles::text, cmd, qual, with_check
        from pg_policies where schemaname in ('public','storage') order by 1,2,3;`),
    gatilhos: consultar(`select c.relname as tabela, t.tgname as nome, pg_get_triggerdef(t.oid) as definicao
        from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
        where not t.tgisinternal and n.nspname = 'public' order by 1,2;`),
    views: consultar(`select viewname, definition from pg_views where schemaname = 'public' order by 1;`),
    crons: consultar(`select jobname, schedule, command, active from cron.job order by 1;`),
};
writeFileSync(join(pasta, 'esquema.json'), JSON.stringify(esquema, null, 1));
manifesto.esquema = Object.fromEntries(Object.entries(esquema).map(([k, v]) => [k, v.length]));

// 3. Os arquivos do storage (todos os buckets sao publicos).
if (COM_ARQUIVOS) {
    const env = Object.fromEntries(readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/)
        .filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
    const base = env.VITE_SUPABASE_URL;
    const objetos = JSON.parse(readFileSync(join(pasta, 'dados', 'storage.objects.json'), 'utf8'));
    let baixados = 0;
    for (const o of objetos) {
        if (!o.name || o.name.endsWith('/') || o.name.includes('..')) continue;
        const destino = join(pasta, 'arquivos', o.bucket_id, ...o.name.split('/'));
        if (existsSync(destino)) { baixados += 1; continue; }
        const resposta = await fetch(`${base}/storage/v1/object/public/${o.bucket_id}/${o.name.split('/').map(encodeURIComponent).join('/')}`);
        if (!resposta.ok) { falhas.push(`arquivo ${o.bucket_id}/${o.name}: ${resposta.status}`); continue; }
        mkdirSync(join(destino, '..'), { recursive: true });
        writeFileSync(destino, Buffer.from(await resposta.arrayBuffer()));
        baixados += 1;
    }
    manifesto.arquivos = { no_storage: objetos.length, baixados };
}

manifesto.falhas = falhas;
writeFileSync(join(pasta, 'manifesto.json'), JSON.stringify(manifesto, null, 1));
rmSync(pastaTemp, { recursive: true, force: true });

const nTabelas = Object.keys(manifesto.tabelas).length;
const nLinhas = Object.values(manifesto.tabelas).reduce((s, t) => s + (t.na_copia || 0), 0);
console.log(`${nTabelas} tabelas, ${nLinhas} linhas${manifesto.arquivos ? `, ${manifesto.arquivos.baixados}/${manifesto.arquivos.no_storage} arquivos` : ''}.`);
if (falhas.length) {
    console.error(`FALHAS (${falhas.length}):\n- ${falhas.join('\n- ')}`);
    process.exit(1);
}
console.log('ok - copia conferida com o banco, tabela por tabela');
