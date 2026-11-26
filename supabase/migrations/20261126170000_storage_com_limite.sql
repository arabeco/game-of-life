-- STORAGE COM LIMITE (26/11/2026).
--
-- Checagem de prontidao, segunda rodada. O plano gratis tem 1 GB de storage;
-- cheio, ninguem mais sobe avatar nem jardim. Hoje sao 68 MB. Tres portas
-- deixavam uma unica conta logada encher o resto:
--
-- 1. videos: qualquer conta subia mp4 de 10 MB em qualquer lugar do bucket.
--    O app nao sobe video (os 8 que existem sao de fevereiro, do projeto).
--    Sai o upload pelo app; os arquivos e os links publicos ficam.
-- 2. garden-sand: sem limite de tamanho e de tipo (subia HTML, por exemplo,
--    servido do dominio do projeto). O app sobe so dois PNG por conta, de no
--    maximo ~450 KB hoje. Fica: PNG, ate 2 MB. A leitura pela API passa a ser
--    so da propria pasta (o upsert do app precisa); o link publico segue
--    abrindo para todo mundo, como antes.
-- 3. user-images: cada troca de avatar cria um arquivo novo e nenhum limite
--    segurava. Fica: ate 60 arquivos por conta (avatars + slots). Hoje sao 217
--    arquivos no projeto inteiro.
--
-- Pode ser rodado de novo sem estrago.

-- 1. Videos: so leitura.
drop policy if exists "Authenticated Upload Videos" on storage.objects;
drop policy if exists "Users Update Own Videos" on storage.objects;
drop policy if exists "Users Delete Own Videos" on storage.objects;

-- 2. Areia do jardim: PNG ate 2 MB, e a API so lista a propria pasta.
update storage.buckets
set file_size_limit = 2097152,
    allowed_mime_types = array['image/png']
where id = 'garden-sand';

drop policy if exists garden_sand_leitura on storage.objects;
create policy garden_sand_leitura on storage.objects
  for select to authenticated
  using (bucket_id = 'garden-sand' and (storage.foldername(name))[1] = (auth.uid())::text);

-- 3. Imagens da conta: no maximo 60. A contagem roda como dono, porque uma
--    regra de storage.objects que le storage.objects entraria em si mesma.
create or replace function public.imagens_da_conta_no_storage()
returns integer
language sql
stable
security definer
set search_path to ''
as $function$
  select count(*)::integer
  from storage.objects o
  where o.bucket_id = 'user-images'
    and (storage.foldername(o.name))[1] in ('avatars', 'slots')
    and (storage.foldername(o.name))[2] = (auth.uid())::text;
$function$;

revoke all on function public.imagens_da_conta_no_storage() from public, anon;
grant execute on function public.imagens_da_conta_no_storage() to authenticated, service_role;

drop policy if exists "User Upload" on storage.objects;
drop policy if exists "users can upload own files" on storage.objects;
create policy "users can upload own files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'user-images'
    and (storage.foldername(name))[1] = any (array['avatars', 'slots'])
    and (storage.foldername(name))[2] = (auth.uid())::text
    and public.imagens_da_conta_no_storage() < 60
  );

-- CONFERENCIA (so le).
select b.id, b.file_size_limit, b.allowed_mime_types,
  (select string_agg(p.policyname || ':' || p.cmd, ', ' order by p.policyname)
     from pg_policies p
    where p.schemaname = 'storage' and p.tablename = 'objects'
      and coalesce(p.qual, p.with_check, '') like '%' || b.id || '%') as regras
from storage.buckets b
where b.id in ('videos', 'garden-sand', 'user-images')
order by b.id;
