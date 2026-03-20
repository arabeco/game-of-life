alter table if exists public.relationship_link_invites
  alter column arena_snapshot drop not null;

alter table if exists public.relationship_links
  alter column arena_snapshot drop not null;
