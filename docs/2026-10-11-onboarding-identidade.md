# Primeiro acesso: nome, idade e balão — 11/10/2026

- Termos mantêm a cerimônia, com fundo claro opaco, textos escuros e dourado de texto mais escuro. Ajustadas legendas e tamanho do auxílio do botão.
- Antes do guia, tela de apelido preenchido com `userProfile.nickname` (cadastro manual ou nome recebido do Google), editável; idade por rodinha com toque, rolagem e teclado. Nenhuma idade adulta é pré-selecionada.
- Salva no próprio `public.user_profiles`: `nickname` e `onboarding_age_range`. O número exato só existe na tela; grava as faixas já existentes (`ate_17`, `18_24`, `25_34`, `35_49`, `50_mais`). Novos envios de `ate_17` só ocorrem entre 13 e 17. Não reinterpreta faixas antigas como comprovação de idade.
- Aguarda confirmação do update antes de avançar; falha fica visível e permite tentar novamente. Não cria tabela ou SQL novo.
- Menos de 13 bloqueia esta etapa; há saída da conta. A conta já foi criada no fluxo atual. Isso não é verificação documental de idade nem bloqueio no backend, e o aviso a menores não implementa consentimento verificável do responsável.
- Depois, propósito e passos da arena/ação continuam no balão do Oráculo. Não reinicia o onboarding de quem já concluiu ou dispensou. Perfil que já possui faixa salva não repete a nova tela.
- Prévia: http://127.0.0.1:3182/onboarding-identity-preview.html (e-mail); ?provider=google (Google); ?terms=1 (Termos).
- TypeScript e regressão de retomada passaram. Teste de navegador com Supabase interceptado conferiu nome dos dois provedores, rodinha por teclado, bloqueio <13, gravação de faixa em vez de idade, erro sem avanço e transição ao balão. Sem gravação real, publicação ou AAB.
