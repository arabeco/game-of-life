revoke all on function public.buy_gold_pack(text, integer, numeric, text, text, text, text, jsonb) from public;
revoke all on function public.buy_gold_pack(text, integer, numeric, text, text, text, text, jsonb) from anon;
revoke all on function public.buy_gold_pack(text, integer, numeric, text, text, text, text, jsonb) from authenticated;
grant execute on function public.buy_gold_pack(text, integer, numeric, text, text, text, text, jsonb) to service_role;

revoke all on function public.process_approved_payment(uuid, text, integer, numeric, jsonb) from public;
revoke all on function public.process_approved_payment(uuid, text, integer, numeric, jsonb) from anon;
revoke all on function public.process_approved_payment(uuid, text, integer, numeric, jsonb) from authenticated;
grant execute on function public.process_approved_payment(uuid, text, integer, numeric, jsonb) to service_role;

revoke all on function public.process_approved_membership_payment(uuid, text, text, numeric, jsonb) from public;
revoke all on function public.process_approved_membership_payment(uuid, text, text, numeric, jsonb) from anon;
revoke all on function public.process_approved_membership_payment(uuid, text, text, numeric, jsonb) from authenticated;
grant execute on function public.process_approved_membership_payment(uuid, text, text, numeric, jsonb) to service_role;
