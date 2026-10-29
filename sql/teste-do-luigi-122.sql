-- TESTE DO LUIGI NO 1.0.122 (29/10/2026). Tres blocos; rode um de cada vez.
-- Troque 'luigi' pelo apelido exato da conta de teste (maiusculas nao importam).

-- 1) VER COMO A CONTA ESTA (so leitura). Rode antes e depois de cada compra.
select nickname, is_premium, subscription_tier, premium_expires_at,
       premium_expires_at - now() as falta,
       gold, fichas_de_vinculo
from public.user_profiles
where lower(btrim(nickname)) = lower('luigi');

-- 2) FAZER O PLANO VENCER DAQUI A 3 MINUTOS (teste da renovacao).
-- Depois de 3 minutos, o Luigi fecha o app de vez e abre de novo: se a Play
-- ainda tem a assinatura ativa, o app confere e o plano volta com a data da
-- Google. Se a assinatura foi cancelada na Play, o plano fica vencido.
update public.user_profiles
set premium_expires_at = now() + interval '3 minutes'
where lower(btrim(nickname)) = lower('luigi')
returning nickname, subscription_tier, premium_expires_at;

-- 3) OS PAGAMENTOS QUE O SERVIDOR REGISTROU (so leitura). Cada cobranca da
-- Play aparece uma vez, como "token:pedido" (o pedido termina em ..0, ..1...).
select p.created_at, p.payment_id, p.status, p.amount_paid, p.gold_amount,
       p.metadata->>'days' as dias, p.metadata->>'expires_at' as validade_google
from public.user_purchases p
join public.user_profiles u on u.id = p.user_id
where lower(btrim(u.nickname)) = lower('luigi')
order by p.created_at desc
limit 20;
