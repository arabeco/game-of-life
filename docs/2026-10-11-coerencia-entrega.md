# Coerência do app e site — entrega local

11/10/2026. Substitui o estado de pendências de planos e conteúdo descrito na auditoria de 10/10. Não representa publicação ou atualização do Android.

## Regra atual usada

- Premium: bônus XP de 5%; Platinum: 10%, conforme `utils/premiumAccess.ts`.
- Sem baús em ambos os planos. Sem novo crédito de campanha grátis no Premium (mudança de 25/08, `5d77a84`); sem nova cena de legado no Platinum (mudança de 25/08, `e7013d5`). Créditos antigos preservados. Platinum mantém uma ficha média.
- Capacidade inclui arenas arquivadas: limites 10/15/30. Corrigidos os textos, preservada a regra existente.
- Benefícios das telas de assinatura e Ajustes agora usam o catálogo compartilhado. Preview administrativo também corrigido.

## Compra e renovação

Nova migração: `supabase/migrations/20261011010000_membership_delivery_parity.sql`. **Ainda precisa ser aplicada**, depois da migração sem baús que Afonso informou já ter executado.

Pagamento e compra com ouro usam a mesma entrega. A nova RPC realiza débito e ativação na mesma transação, valida preço no servidor e impede renovação Platinum pelo preço Premium. Repetir a mesma tentativa não cobra nem estende novamente. O app conserva o identificador da tentativa até confirmação, inclusive após recarregar. O caminho antigo `buy_store_item` também delega a entrega de assinatura à RPC. A interface não tenta mais gravar diretamente campos protegidos do perfil.

O teste em banco embarcado inclui o guard real de perfil, falha forçada com rollback, reenvio, desconto de renovação, saldo insuficiente e ausência de novos baús. Isso não prova pagamento real nem funções implantadas no Supabase remoto.

## Site

14 arquivos atualizados em `C:/Users/Afonso/Desktop/glyph-landing`, com backup em `output/glyph-landing-coherence-backup` e hashes conferidos.

- Estoque e conclusão direta aparecem no fluxo principal; agendamento e ciclo são opcionais.
- Oráculo usa o nome atual “Dia e ciclo”. CTA distingue acesso existente de solicitação de convite.
- Fórmula e teste de maestria alinhados à soma 0–50 e índice dobrado 0–100.
- Removido prazo fixo vencido; links sociais reais; contador aparece apenas após resposta válida.
- Termos: idade mínima 13, autorização do responsável para menores, procedimento de arrependimento de sete dias nas hipóteses legais, distinção de cancelamento/reembolso/exclusão e remoção do foro placeholder. Resumo dentro do app alinhado.
- Página de exclusão prepara e-mail explicitamente. Não anuncia registro automático em fila sem entrega validada.
- Seis capturas renovadas: Ativos, Arenas, Planner, Mundo, Progresso e Oráculo. São telas reais do código local com dados sintéticos interceptados. Não são prova de Android distribuído. Demais imagens foram mantidas; o manifesto registra a procedência e datas por captura.

## Verificação

- TypeScript, regressão de assinatura sem baús, bônus XP e pagamento web passaram.
- Landing: 18 combinações de tela e viewport (1440/390), navegação, galeria, fórmula, imagens, ausência de overflow e erros JS passaram.
- Checagem adicional de Termos, exclusão, links sociais e retirada do contador passou; nenhum pedido real de exclusão enviado.

## Limites e próximos passos

Não houve deploy, push, AAB novo, compra real nem aplicação remota da nova migração. Publicação do site e distribuição do app continuam necessárias. A integração completa da solicitação/exclusão de conta e a confirmação da cobrança de US$ 10 no painel Resend continuam pendentes; a correção da página não equivale à implementação desses fluxos.
