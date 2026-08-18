-- Tom das falas do Oraculo (constants/oracleSpeechLibrary.ts).
-- Beneficio Premium: 'neutro' e livre, os outros tres o app so aplica com
-- assinatura ativa. A checagem de Premium fica no cliente; aqui so garantimos
-- que o valor salvo e um dos quatro conhecidos.
alter table public.oracle_preferences
  add column if not exists speech_tone text not null default 'neutro';

alter table public.oracle_preferences
  drop constraint if exists oracle_preferences_speech_tone_check;

alter table public.oracle_preferences
  add constraint oracle_preferences_speech_tone_check
  check (speech_tone in ('neutro', 'coach', 'reflexivo', 'calmo'));

comment on column public.oracle_preferences.speech_tone is
  'Tom das falas de evento do Oraculo: neutro (livre), coach, reflexivo ou calmo (Premium).';
