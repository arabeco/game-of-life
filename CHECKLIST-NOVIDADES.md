# Checklist do que é novo — 1.0.81

Complementa o [CHECKLIST-TESTES-MANUAIS.md](CHECKLIST-TESTES-MANUAIS.md), que
continua valendo para o resto. **Aqui só o que mudou ou nasceu** desde a última
passada completa.

Marque só quando o resultado observado for igual ao esperado. Em falha: anote o
número, o que viu e, se houver, o texto exato do erro.

---

## Preparação

- [ ] **N01. A conta precisa ter com que brincar:** ouro para comprar item,
  **fragmentos** para baú e forja, pelo menos **um amigo** para doar, e itens
  repetidos no arsenal. Sem fragmento, metade da loja não pode ser testada.

---

## Experiência: quem paga e quando

A mudança de maior risco desta versão. Anote os **números**, não a impressão.

- [ ] **N02. O dia deposita, não paga:** conclua ações num dia **sem ciclo
  aberto**. Na virada, o toast diz *"X EXP entrou na sua rodada"* e o seu **nível
  não muda**. Antes caía direto no perfil.

- [ ] **N03. Concluir rodada paga:** na aba Arenas, sem ciclo, aparece a faixa
  *"Rodada livre · N ações concluídas"*. Toque em **Concluir rodada**: o toast
  diz quanto entrou, o nível sobe, e as arenas ficam livres para a próxima.

- [ ] **N04. Abrir ciclo fecha a rodada:** com rodada acumulada, abra um ciclo. A
  rodada é paga antes (*"Rodada anterior fechada: +N EXP"*).

- [ ] **N05. Fechar ciclo não paga em dobro:** feche um ciclo e compare a EXP do
  relatório com a soma dos dias. Tem que **bater**. Se vier metade do que você
  esperava, está certo — antes vinha o dobro.

- [ ] **N06. Dá para corrigir um dia:** sem ciclo, marque e desmarque uma ação de
  um dia já passado. O acumulado da rodada acompanha.

---

## Item: quebrar, forjar, comprar, doar

Três botões deste modal estavam simulados ou mentindo.

- [ ] **N07. Quebrar funciona e diz o valor:** abra um item seu. O botão diz
  **`Quebrar 20 💎`**. Confirme: o item sai e os fragmentos entram.

- [ ] **N08. O que falta tem saída:** toque num item **apagado** na coleção.
  Aparecem **`50 🪙`** (se estiver à venda) e **`Forjar 120 💎`**.

- [ ] **N09. Doar — precisa de duas contas:** num item **não equipado**, toque no
  ícone de presente. Abre a lista de **amigos**. Escolha e confirme: o item sai
  do seu inventário.

- [ ] **N10. Quem recebe vê o modal:** do outro lado, abrir o app mostra o modal
  de recompensa com o item. Fechar marca como lido e ele não volta.

- [ ] **N11. As recusas avisam:** tente doar um item **equipado** (deve recusar
  pedindo para desequipar).

---

## Loja

- [ ] **N12. A aba Forja não existe mais:** a barra da loja tem três abas —
  Campanhas, Itens, Ouro.

- [ ] **N13. Baús:** cinco no topo de Itens, um por raridade. Compre um Comum: o
  saldo cai **24** e ele aparece no Arsenal.

- [ ] **N14. Campanha por fragmento:** nos cards de campanha não-premium, um
  segundo botão com preço em fragmento ao lado do de ouro.

---

## Painel diário

- [ ] **N15. Duas abas:** **ontem** à esquerda, **hoje** à direita. Ontem mostra
  *"Fechou em N%"* e **contagem por arena** (`Saúde 3`), não lista. Hoje mostra a
  lista completa, rolando se for longa.

- [ ] **N16. Fecha voltando para hoje:** vá para ontem, feche o painel, reabra.
  Tem que estar em **hoje**.

---

## Oráculo

- [ ] **N17. Não cumprimenta a cada desbloqueio:** bloqueie e desbloqueie o
  celular. Ele **não** deve falar de novo. Só depois de meia hora fora.

- [ ] **N18. Sequência tem voz:** com sequência ativa, o número aparece nas
  falas. Depois das **18h** sem nenhuma ação e com sequência ≥ 3, ele avisa.

- [ ] **N19. O diagnóstico:** *Ajustes › Oráculo & Alertas › Copiar diagnóstico*.
  Cola aqui quando alguma fala parecer idiota — ele mostra por que ela ganhou.

- [ ] **N20. Sem ciclo ele não cobra ciclo:** ao longo de dias sem ciclo, as
  falas devem **variar** e dizer que dá para executar sem ele. Se repetir a mesma
  frase ou insistir em abrir ciclo todo dia, falhou.

---

## Feed e humor

- [ ] **N21. O feito tem tamanho:** conclua uma **arena nova** e veja no feed:
  `34 ENTREGAS · 5 AÇÕES · 21 DIAS`. Cards antigos não têm — é esperado.

- [ ] **N22. Humor só salva quando você manda:** arraste o slider — **nada é
  salvo**. Toque em **`Registrar · Amor (500)`**. Registre duas vezes e o gráfico
  aparece, com a linha na cor da sua skin e os pontos na cor de cada estado.

---

## Coisas que não podem mais acontecer

- [ ] **N23. Nenhum alerta cinza do sistema:** tente criar grupo sem nome ou
  subir imagem acima de 2 MB. Tem que vir **toast**, nunca o diálogo do
  navegador com o nome do pacote em cima.

- [ ] **N24. Nenhuma chave crua na tela:** se aparecer `{acoes}`, `{dias}` ou
  `{arena}` em qualquer fala, **avise na hora**. É o defeito que mais preocupa.

- [ ] **N25. O chat fecha:** abra o Oráculo e toque **fora** dele.
