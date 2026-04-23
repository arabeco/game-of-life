update public.reward_codes
set
  reward_payload = coalesce(reward_payload, '{}'::jsonb)
    || jsonb_build_object(
      'beta_program_key', 'vanguarda25',
      'beta_program_label', 'Vanguarda',
      'beta_program_days', 14,
      'beta_program_reward_gold', 50
    ),
  updated_at = now()
where upper(code) = 'VANGUARDA25';
