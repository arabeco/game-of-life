alter table public.era_metadata
    add column if not exists final_summary text;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'era_metadata_final_summary_length'
    ) then
        alter table public.era_metadata
            add constraint era_metadata_final_summary_length
            check (char_length(coalesce(final_summary, '')) <= 140);
    end if;
end
$$;
