# Revisão de coerência — app, planos e site

10/10/2026. Inspeção do código local do app e glyph-landing; Home, Descubra, Termos e Exclusão abertos no navegador publicado. Afonso informou execução da migração sem baús; não houve consulta direta à função remota nem compra real. O app instalado não foi atualizado nesta rodada.

## Promessas e entrega: corrigir primeiro

1. **Premium anuncia +10% no aviso de pagamento, entrega +5%.** `utils/premiumAccess.ts` define Premium 0.05 e Platinum 0.10; `GameContext.tsx` usa essa regra no fechamento. O SQL de pagamento, inclusive a migração sem baús, preservou duas mensagens antigas de +10% para Premium. Corrigir texto no servidor com nova migração, sem mudar a taxa.
2. **Créditos dependem do caminho de compra.** O cliente tem `MEMBERSHIP_REWARD_CAMPAIGN_QUIZ_FREE_CREDITS=0` e `PLATINUM_REWARD_LEGACY_SCENE_CREDITS=0`. O pagamento SQL concede 1 ficha grátis ao Premium e 1 cena ao Platinum. Platinum concede 1 ficha média nos dois caminhos. Não tratar isso como paridade comprovada. A cena virou desconto permanente no cliente; o crédito de ficha grátis só permite catálogo que já custa zero (`claim_campaign_quiz_free_codex` recusa `price_gold > 0`). `constants/economy.ts` ainda anuncia uma campanha curta grátis no Premium; `goldCatalog.ts` já não anuncia.
3. **Ouro: débito e ativação estão separados.** `buy_store_item` em `20260923200000_quem_cobra_entrega.sql` debita ouro para tipo premium, mas não ativa o plano. O cliente depois tenta atualizar campos protegidos por `20260914210000_guard_profile_privilege_escalation.sql`. Risco de cobrar sem ativação persistente; requer teste integrado e correção transacional no servidor antes de considerar esse caminho validado. Não fiz compra real para provar comportamento do ambiente remoto.
4. **Arenas “ativas” versus total.** Números 10/15/30 estão consistentes. Porém `utils/arenaCapacity.ts` calcula `remaining` e `isAtLimit` pelo total, incluindo arquivadas; `NewArenaModal` e `GameContext` usam essa regra. A loja promete arenas ativas. Decidir entre corrigir a contagem para ativas ou descrever capacidade total; não alterar a economia por inferência.
5. **Baús dos planos.** Removidos dos catálogos locais, helpers de ativação e função de pagamento na migração entregue. Isso não remove recompensas de uso, compras com fragmentos ou inventário antigo. Clientes instalados antigos ainda carregam textos/código antigos.

## Correção feita durante esta revisão

O texto novo de ativação local dizia que uma ficha estava disponível até para Premium, cujo crédito local é zero. Substituído por mensagem neutra de ativação. O teste anterior simulava uma ficha em vez de ler a constante real; corrigido para executar com as constantes extraídas do código. Isso testa a regra local efetiva, mas não resolve a divergência com o servidor.

## Site publicado e projeto local

- Home e Descubra não prometem baús como benefício dos planos nas páginas inspecionadas. Menções gerais a baús/Arsenal seguem coerentes; não devem ser apagadas só porque os planos mudaram.
- A Home apresenta o fluxo como agenda → ciclo. Menciona ações livres mais abaixo, mas não explica com destaque que é possível concluir direto do estoque e usar sem ciclo. Descubra também foca horários/calendário. Ajustar a hierarquia e a mensagem inicial.
- `assets/current/screens/manifest.json`: capturas 1.0.98, de 02/10, com dados sintéticos interceptados. A Home publicada usa os mesmos caminhos. A data por si só não invalida cada print, mas eles não comprovam a UI atual; recapturar prioritariamente Planner/estoque, Oráculo, Arenas/resumo de ciclo e perfil. A indicação de dados demonstrativos no site é correta e deve continuar.
- `script.js:initCountdown` local aponta para 02/05/2026; a marcação pública expõe contador zerado da temporada. Não representa um prazo futuro atual. Vincular à temporada real ou remover o contador.
- Rodapé da Home: Instagram/X/TikTok levam a `#`; Termos tem os endereços reais. Unificar.
- CTA da Home abre `app.glyph.life`, enquanto outras chamadas pedem Convite Dourado e falam em beta fechado. Não é necessariamente falso, mas falta esclarecer quem já pode entrar e quem precisa solicitar acesso. Não substituir por Play Store sem verificar o link e a disponibilidade.
- Termos publicados: versão 12/03, sem idade mínima escolhida (13), sem procedimento explícito de arrependimento de 7 dias e com `PREENCHER` no foro. Pendências da revisão anterior continuam publicadas.
- Exclusão publicada: instruções no app + suporte por e-mail. O formulário encontrado no projeto local não está nessa página publicada. Não anunciar solicitação web automatizada antes de integrar/publicar e testar a entrega do pedido.

## Sequência recomendada

1. Fechar uma única definição de benefícios e corrigir pagamento/ativação com ouro; corrigir avisos SQL e catálogos conforme a entrega decidida.
2. Atualizar textos do site para estoque, agendamento opcional e ciclo opcional; Termos, links e prazo da temporada.
3. Capturar telas atuais demonstrando os caminhos descritos e conferir a página em celular.
4. Validar banco e app distribuído. Não confundir os testes locais desta rodada com pagamento real, Android ou publicação do site.

Não houve publicação, alteração de preços, mudança dos créditos no servidor ou redesign do site nesta revisão.

## Complemento — 11/10

Confirmado o ponto de entrada do caminho com ouro: `components/AuthenticatedApp.tsx:2227`, `handleConfirmPremiumRenewalOffer`, chamado pelo modal em `onConfirm`, executa `buyStoreItem(..., 'premium')` e anuncia extensão de 30 dias. Portanto não é apenas código de catálogo sem consumidor. O guard de perfil conserva silenciosamente os valores antigos de assinatura para chamadas autenticadas comuns. A conclusão permanece limitada ao código/migrações locais; requer verificar funções implantadas para afirmar o resultado em produção.

Validação concluída: `npx tsc --noEmit`, regressão de planos sem baús e regressão de bônus XP passaram após a correção do texto e do teste com constantes reais. O teste de planos não simula a compra inteira com ouro: executa os helpers de recompensa locais e o pagamento de assinatura em banco embarcado. Não prova persistência da renovação com ouro.
