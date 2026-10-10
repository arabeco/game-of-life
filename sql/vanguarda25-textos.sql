-- OS TEXTOS DO VANGUARDA25 (10/10/2026).
--
-- O resumo do modal ainda dizia "Seu codigo de teste foi validado" — sobra do
-- teste fechado — e os textos estavam sem acento. Sai tambem a chave
-- beta_program_starts_at, que nada le. Ouro, itens e bau nao mudam.

update public.reward_codes
set
  reward_payload = (reward_payload - 'beta_program_starts_at')
    || jsonb_build_object('vanguard_payload',
      (reward_payload -> 'vanguard_payload')
      || jsonb_build_object(
        'title', 'Bem-vindo à Vanguarda',
        'eyebrow', 'Código de ativação',
        'summary', 'Seu código foi validado e o pacote da Vanguarda já está no seu perfil.',
        'emptyMessage', 'Seu pacote da Vanguarda já foi entregue ao Arsenal.',
        'rewardHighlights', jsonb_build_array(
          jsonb_build_object('tone', 'gold', 'label', 'Ouro', 'value', '+25', 'detail', 'Reserva inicial da Vanguarda.'),
          jsonb_build_object('tone', 'cyan', 'label', 'Baú', 'value', 'Incomum', 'detail', 'Entrega do código de ativação.'),
          jsonb_build_object('tone', 'emerald', 'label', 'Arsenal', 'value', 'Kit Vanguarda', 'detail', 'Borda, banner e itens de vitrine já foram adicionados.')
        )
      )),
  updated_at = now()
where code = 'VANGUARDA25'
returning code, jsonb_pretty(reward_payload -> 'vanguard_payload') as modal;
