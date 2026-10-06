-- OS NUMEROS DAS REGRAS SECRETAS DA CONTA PRINCIPAL. So leitura.
-- Rode depois da migracao 20261006180000_regras_secretas.sql.
select jsonb_pretty(public._marcas_secretas('e76e2b7f-a771-4738-a10a-30a993ecafeb')) as marcas;
