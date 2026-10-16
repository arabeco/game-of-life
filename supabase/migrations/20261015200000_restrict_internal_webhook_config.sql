begin;
-- Internal values include the backend webhook credential. They are not a public RPC.
revoke all on function public.get_internal_runtime_config(text) from public, anon, authenticated;
grant execute on function public.get_internal_runtime_config(text) to service_role;
revoke all on function public.enqueue_oracle_automatic_feed_webhook() from public, anon, authenticated;
grant execute on function public.enqueue_oracle_automatic_feed_webhook() to service_role;
commit;
