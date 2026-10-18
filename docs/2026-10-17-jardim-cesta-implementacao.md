# Cesta do jardim — implementação local

## Escopo aprovado

Nesta rodada: cesta esporádica do jardim. Painel Diário fica para o futuro.
Preços da loja e da forja mantidos. Tamanhos em progressão e guia com imagens
continuam como propostas separadas; não foram integrados nesta entrega.

## Regras implementadas

- Um avanço por dia com ao menos uma ação concluída, independentemente da
  quantidade de ações. O servidor usa o dia de São Paulo, não a data do aparelho.
- Só conclusões de tarefas datadas de hoje ou ontem podem avançar. Não há
  recompensa retroativa por importar histórico ou marcar tarefas futuras.
- A próxima entrega exige de 3 a 5 dias ativos, sorteados no servidor. Dias
  sem uso não zeram o progresso. Reabrir o jardim não avança nem sorteia nada.
- Em 95% das entregas: sorteio uniforme de 5 a 15 fragmentos.
- Em 5%: pontuação 16, convertida em um baú Comum **no lugar** dos fragmentos.
- Guarda no máximo duas entregas pendentes, sem expiração. Ao atingir o teto,
  novas atividades não acumulam mais entregas. A contagem volta após recolher.
- Desfazer/concluir novamente, excluir uma tarefa ou abrir em outra sessão
  não remove a trava de um avanço por dia.
- Coleta por ID da entrega, com trava transacional e comprovante persistido.
  Repetir a solicitação não concede fragmentos nem baú novamente.
- Saquinho fixo fora da areia, na entrada, independente dos objetos salvos.
  Clique/toque direto no objeto abre o painel; não abre automaticamente.
  Selo e cordão: verde para 5–9, azul para 10–15, dourado para baú.
  Vazio fica neutro, sem brilho. Alvo acessível acompanha a posição 3D,
  sem botão flutuante. A cor vem da primeira entrega pendente no servidor.
- Na visita não há cesta, coleta, consulta às entregas do dono ou edição.
- Nada é inserido no layout do usuário; não há EXP, bônus de patente ou crédito diário.

## Economia

Com 5 dias ativos por semana, a média teórica é de 1,25 entrega/semana:
aproximadamente 52 fragmentos por mês (4,35 semanas), mais 0,27 baú Comum/mês.
Com 7 dias ativos: aproximadamente 72 fragmentos e 0,38 baú/mês.
Contas antes de teto de armazenamento e sem incluir fragmentos vindos da abertura
de baús, duplicatas ou outras fontes existentes. Não é promessa individual.

A cesta permanece um extra. A renda diária do Painel deverá ser calibrada
separadamente antes de rever custos de 40/120/400/1200/4000 da forja e
24/72/240/720/2400 dos baús. Nenhum preço foi reduzido para compensar a cesta.

## Ativação pendente — SQL executado pelo Afonso

Copiar o conteúdo integral de
`supabase/migrations/20261017210000_garden_basket.sql` para o editor SQL do Supabase
e executar. A migração é transacional e pode ser reaplicada. Não concede cestas
para atividades anteriores à instalação.

O SQL **não foi aplicado remotamente**. Não foram usadas credenciais service-role.
Enquanto a tabela não existir, o jardim continua abrindo/salvando normalmente
e o recurso cesta permanece oculto. O frontend precisa desta versão do código
e do build embarcado do jardim, além da migração, para ativar o fluxo completo.

## Validação

- `npm run sql:checa -- supabase/migrations/20261017210000_garden_basket.sql`: passou.
- `node tests/garden-basket.regression.mjs`: executa PostgreSQL/PGlite local;
  valida instalação repetida, cadência, teto, datas inválidas, desfazer/repetir,
  não expiração, coleta idempotente, baú, saldo, preservação de ouro, RLS e dono.
  `grant_chest` é substituído por registro local de teste; não prova concessão remota.
- `npx tsc --noEmit`, `npm run type-check:zen3d`: passaram.
- Build embarcado do jardim e build Vite principal: passaram.
- Regressões de terreno e hash/upload de areia: passaram.
- Navegador: componentes reais em demonstração isolada, coleta de 10 fragmentos,
  visita sem cesta, falha de coleta sem perder entrega e entrega de baú Comum.
  Sem gravações no Supabase, sem teste em Android.
- Prévia: `/output/garden-basket/index.html`; parâmetros `?visit`, `?failure`, `?chest`.
- Captura: `output/garden-basket/coleta-fragmentos.jpg`.

Sem AAB, incremento de versão ou publicação.
