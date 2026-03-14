# RELATORIO OPERACIONAL: GLYPH 1.003b

Data: 13/03/2026

## 1. Fase atual

- Status: `ALPHA`
- Fase: `FUNDACAO (T1)`
- Missao da fase: provar onboarding, loop diario, retorno no `D2` e primeiros ciclos com usuarios reais.

## 2. O que esta confirmado no app

- `build` ok e base estrutural estavel.
- Beta fechado rearmado com `Convite Dourado`.
- Fluxo de Google ajustado para empurrar usuario novo para cadastro com convite quando ele ainda nao pertence ao beta.
- Links reais de `Termos` e `Privacidade` ligados no login, no modal legal e em Configuracoes.
- Exclusao de conta com trilha oficial Supabase preparada via SQL + Edge Function.
- Novo onboarding operacional de primeiro uso entrou; o antigo `Card 1` deixou de abrir automatico e virou tutorial manual.
- Painel do GM foi refatorado para ler `marco1_beta_scoreboard` e ignorar usuarios `ouro`.
- Estrutura de acompanhamento do `Marco 1 / T1` foi criada no Supabase.
- Forja e Biblioteca de Codex ja possuem base de backend para slots, compartilhamento por link, envio por `@nickname` e reivindicacao.

## 3. O que ainda precisa de validacao real

- QA ponta a ponta do beta fechado em ambiente real.
- QA do fluxo `Google -> voltar para criar conta -> usar convite -> entrar`.
- QA do onboarding operacional com conta nova.
- QA da exclusao real de conta com usuario descartavel.
- QA da Forja/Biblioteca de Codex com casos reais de slot, envio e claim.
- Revisao visual final do pacote de Codex para aderencia total ao padrao dos modais do app.
- Varredura final de strings/encoding nas telas tocadas recentemente, especialmente `Settings`.

## 4. Prioridades imediatas

1. Fechar e acompanhar os `5` primeiros betas certos.
2. Alimentar `marco1_beta_tracking` com dados reais de onboarding e retorno.
3. Medir `Ativacao`, `D2` e `% que fecha 1 ciclo`, ignorando usuarios `ouro`.
4. Corrigir primeiro qualquer friccao que apareca no loop `arena -> acao -> planner -> sitrep -> ciclo`.
5. Validar o pacote novo de Codex antes de expor isso como feature confiavel.

## 5. Pendencias abertas agora

- Publicar e validar em ambiente real tudo que foi fechado localmente nesta semana.
- Confirmar que a exclusao de conta limpa o que precisa limpar no Storage.
- Conferir se restou algum texto quebrado por encoding em telas antigas.
- Revisar o acabamento visual do fluxo de Codex para ele parecer 100% GLYPH.

## 6. Leitura seca do momento

O app ja saiu da fase de "falta base" e entrou na fase de "precisa validar uso real".
O risco principal deixou de ser codigo ausente e passou a ser friccao de onboarding, retorno e polimento de produto.
Tudo que nao ajudar a segurar bons usuarios no uso diario continua sendo secundario nesta etapa.
