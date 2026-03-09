alter table public.era_metadata
    add column if not exists description text;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'era_metadata_description_length'
    ) then
        alter table public.era_metadata
            add constraint era_metadata_description_length
            check (char_length(coalesce(description, '')) <= 240);
    end if;
end
$$;
