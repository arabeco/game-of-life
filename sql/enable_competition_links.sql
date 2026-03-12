begin;

alter table if exists public.relationship_link_invites
  drop constraint if exists relationship_link_invites_link_type_check;

alter table if exists public.relationship_link_invites
  add constraint relationship_link_invites_link_type_check
  check (link_type in ('mentoria', 'parceria', 'competicao'));

alter table if exists public.relationship_links
  drop constraint if exists relationship_links_link_type_check;

alter table if exists public.relationship_links
  add constraint relationship_links_link_type_check
  check (link_type in ('mentoria', 'parceria', 'competicao'));

commit;
