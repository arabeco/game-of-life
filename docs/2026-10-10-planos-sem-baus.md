# Premium e Platinum sem baús

Decisão do Afonso: retirar baús dos dois planos nas novas ativações e renovações. Não retirar baús já entregues, nem alterar outras fontes de baús.

Implementação local:
- `constants/goldCatalog.ts` e `constants/economy.ts`: removida a promessa de baús dos benefícios.
- `contexts/GameContext.tsx`: ativação com ouro não chama `addChest`; o aviso de recompensa não anuncia baús. Demais créditos mantidos.
- `supabase/migrations/20261010190000_memberships_without_chests.sql`: substitui a função usada pelos pagamentos Google Play e Mercado Pago, removendo a concessão de baús e os respectivos textos. Mantém a função restrita a `service_role`, a proteção contra pagamento repetido, a extensão de validade e os demais créditos. Não altera inventário ou avisos históricos.

Validação local: `npx tsc --noEmit`, `node tests/pagamento-web.regression.mjs` e `node tests/memberships-without-chests.regression.mjs` passaram. Este último executa a migração em PostgreSQL embarcado (PGlite) com esquema mínimo: ativação dos dois planos, renovação, repetição de pagamento, créditos, inventário preexistente e permissões. Também executa os helpers locais de ativação com uma trava contra entrega de baús. Não é teste de compra real nem comprovação do banco remoto.

Publicação pendente: aplicar a migração no Supabase e distribuir o app atualizado. O código de versões antigas do app ainda contém a chamada de baús na ativação com ouro; a migração cobre a função de pagamento no servidor, não reescreve clientes instalados. Não desativar o RPC genérico de baús sem avaliar as outras recompensas que o utilizam.

Divergência preexistente fora do escopo: o cliente define zero crédito de cena de legado para Platinum, usando desconto permanente; a função de pagamento já concedia um crédito e continua concedendo. Esta alteração não muda outros benefícios para resolver essa diferença.
