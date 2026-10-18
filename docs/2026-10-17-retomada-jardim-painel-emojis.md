# Retomada concluída localmente — jardim, Painel Diário e emojis

Atualizado em 18/10/2026. As regras abaixo foram confirmadas por Afonso nesta conversa.

## Tamanhos comprados com fragmentos

Original e Amplo continuam gratuitos. Sete expansões permanentes, compradas em
ordem, com os preços aprovados. A expansão não é aplicada automaticamente:
após comprar, a pessoa seleciona o tamanho disponível e salva o jardim.

| Opção | Escala linear sobre Original | Área adicional sobre Amplo | Preço incremental |
|---|---:|---:|---:|
| Original | 1,00 | — | Grátis |
| Amplo | 1,25 | 0% | Grátis |
| Expansão 1 | 1,30 | 8% | 80 |
| Expansão 2 | 1,35 | 17% | 140 |
| Expansão 3 | 1,40 | 25% | 220 |
| Expansão 4 | 1,45 | 35% | 320 |
| Expansão 5 | 1,50 | 44% | 450 |
| Expansão 6 | 1,55 | 54% | 650 |
| Expansão 7 | 1,60 | 64% | 900 |

Total de todas as compras: 2.760 fragmentos. Preço e saldo são conferidos no servidor;
a carteira é travada durante a compra. Repetir uma compra já concluída não cobra
novamente. A tabela de propriedade não permite alteração direta pelo cliente.
Um trigger recusa salvar expansões não possuídas. Nenhuma posição de peça ou desenho
é migrada. Limites de 64 objetos e 8 artefatos permanecem. MAX_OBJECTS=96 pertence
à outra cena de protótipo, não foi usado para vender capacidade adicional.

## Fragmentos do Painel Diário

Regra final: `min(15, floor(EXP_crua / 50))`.

- 49 EXP → 0; 50 → 1; 100 → 2; 250 → 5; 500 → 10; 750 ou mais → 15.
- Sem recompensa mínima, comparação com média pessoal ou bônus para iniciantes.
- EXP crua: duração das ações pontuadas concluídas, sem multiplicador de dificuldade,
  assinatura, baús ou recompensas de fechamento. Ações Livres não entram.
- Crédito ao abrir o Painel de um dia encerrado, inclusive na abertura automática
  do resumo de ontem já existente. Nunca credita o dia ainda em andamento.
- Dia operacional: corte às 4h em São Paulo. Tarefas de madrugada pertencem ao
  dia anterior, como no Planner.
- Comprovante único por usuário e dia; reabrir, desfazer/refazer ou editar tarefas
  depois da primeira entrega não recalcula nem concede outra recompensa.
- Não concede dias anteriores à ativação do SQL. O primeiro dia elegível é o
  dia operacional da instalação; só poderá ser recolhido depois que encerrar.
- Mostra quadrado com ícone e texto ao lado, no estilo das linhas de recompensa.
  Só mostra “recebidos” após resposta do servidor. Erro permite tentar novamente;
  ausência da migration mantém a linha oculta. Zero fragmentos não mostra prêmio.

Os preços atuais da loja e forja não mudaram. A proposta anterior de 12 na média,
teto 15 e 8 para iniciantes foi rejeitada. Não usar suas estimativas de renda.
A renda agora depende diretamente da EXP crua: por exemplo, 250 EXP em cada um
 de 20 dias gera 100 fragmentos no Painel, além das outras fontes existentes.

## Guia e biblioteca de emojis

- Guia de seis páginas recuperado, recompilado e com versão 2: quem viu a versão 1
  recebe apenas a página de personalização atualizada. Sem guia automático em visitas.
- Biblioteca mantém 315 emojis únicos e adiciona Todos, busca em português entre
  áreas, normalização de acentos/maiúsculas, descrições e botão de fechar.
- Seletor usa dialog nativo para funcionar sobre outros modais. A prévia anterior
  substituía o seletor por um componente vazio; agora usa o seletor real.
- Nenhum emoji já salvo foi migrado ou substituído.

## Ativação manual

Arquivo combinado: `sql/2026-10-18-jardim-fragmentos.sql`.
Contém a cesta que já estava pendente e as migrations de expansões e fragmentos
 do Painel. Cada seção é transacional e reaplicável. Não usa service-role.

O SQL NÃO foi aplicado remotamente. Também é necessário distribuir este código
web/Android e o build embarcado atualizado. Sem AAB, incremento de versão ou push.

## Evidências e limites

- TypeScript principal e jardim: passaram.
- Build completo: passou, com avisos preexistentes de chunks/importações.
- PostgreSQL/PGlite local: expansão em ordem, preços, saldo insuficiente, repetição,
  propriedade ao salvar, proteção das tabelas e preservação de ouro/objetos.
- PostgreSQL/PGlite local: limites de /50, teto 15, dia fechado, ativação, madrugada,
  ações Livres, dono, repetição e edição/desfazer após pagamento.
- Regressões de terreno, hash da areia, guia e busca de emojis: passaram.
- Browser: arena com seletor real, busca corrida e envio do ícone para o salvamento
  simulado; guia com imagem; painel de tamanhos e recompensa em componentes reais.
- Prévia isolada: `output/garden-retomada/index.html`, com compra/saldo simulados.
  Isto não prova débito/crédito no Supabase real nem comportamento no Android.
