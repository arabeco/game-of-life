-- Inventário dirigido, somente leitura. Não retorna dados dos jogadores.
with alvos as (
  select c.oid,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind in ('r','p')
  and c.relname in ('assets','user_assets','pvp_challenges','legacy_render_jobs','asset_slots','daily_comparison_exclusions')
)
select t.relname as tabela,
  (select jsonb_agg(jsonb_build_object('coluna',a.attname,'tipo',format_type(a.atttypid,a.atttypmod)) order by a.attnum)
   from pg_attribute a where a.attrelid=t.oid and a.attnum>0 and not a.attisdropped) as colunas,
  array(select distinct pg_describe_object(d.classid,d.objid,d.objsubid)
        from pg_depend d where d.refclassid='pg_class'::regclass and d.refobjid=t.oid
        and d.classid in ('pg_proc'::regclass,'pg_rewrite'::regclass,'pg_constraint'::regclass,'pg_trigger'::regclass,'pg_policy'::regclass)
        order by 1) as dependencias_registradas,
  array(select format('%I.%I(%s)',n.nspname,p.proname,pg_get_function_identity_arguments(p.oid))
        from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        where n.nspname not in ('pg_catalog','information_schema')
          and strpos(lower(p.prosrc),lower(t.relname))>0 order by 1) as mencoes_em_funcoes,
  array(select j.jobname from cron.job j where strpos(lower(j.command),lower(t.relname))>0 order by 1) as mencoes_em_agendamentos
from alvos t order by t.relname;
-- Menção textual pode ser comentário, coluna ou parte de outro nome.
-- Ausência de menção não cobre SQL dinâmico ou consumidores externos.
