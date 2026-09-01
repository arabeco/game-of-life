# O que checar — 1.0.81

Dez coisas. São as que mexem em **dinheiro**, as que **nasceram agora** e as que
**já estiveram quebradas** — o resto do app está no
[CHECKLIST-TESTES-MANUAIS.md](CHECKLIST-TESTES-MANUAIS.md).

Em falha: o número, o que viu e o texto exato do erro, se houver.

**Antes de começar:** ouro, um amigo, e **itens no arsenal que você não usa**.

Fragmentos (💎) você não recebe de ninguém — **fabrica quebrando item**. Comum dá
10, e o baú mais barato custa 24, então três itens comuns já bastam. Item
repetido vira fragmento sozinho quando cai, e baú também dá alguns.

**Por isso faça o 7 antes do 3**: ele é quem paga o baú.

---

## Dinheiro

- [ ] **1. Fechar ciclo não paga em dobro.** Feche um ciclo e compare a EXP do
  relatório com a soma dos dias — tem que bater. **Se vier metade do que você
  esperava, está certo**: antes vinha o dobro.

- [ ] **2. A rodada paga ao concluir.** Sem ciclo, conclua ações: o toast diz
  *"entrou na sua rodada"* e o nível **não** muda. Em Arenas, **Concluir rodada**
  credita e libera as arenas.

- [ ] **3. Baú.** Com fragmentos do item 7, compre um Comum na aba Itens: saldo
  cai **24** e ele aparece no Arsenal.

---

## Nasceram agora

- [ ] **4. Doar — precisa de duas contas.** Item não equipado → ícone de presente
  → lista de amigos → confirma. O item sai daqui e **quem recebe vê o modal de
  recompensa** ao abrir o app.

- [ ] **5. Humor.** Arrastar **não salva nada**. `Registrar · Amor (500)` salva.
  Duas marcações e o gráfico aparece.

- [ ] **6. Painel diário com abas.** Ontem à esquerda, hoje à direita. Ontem
  mostra contagem por arena, não lista. Fechar e reabrir volta para **hoje**.

---

## Já estiveram quebradas

- [ ] **7. Quebrar item — confira o número.** Abra um item seu no Arsenal, anote
  o que o botão diz (`Quebrar 10 💎` num comum) e quebre. O item tem que sair e o
  saldo tem que subir **exatamente aquilo**. Item equipado não mostra o botão: é
  para desequipar antes.

  Era um alerta de simulação. Depois passou a ser duas funções brigando no banco,
  e depois um valor que não batia com o prometido — por isso o pedido agora é
  conferir o número, e não só ver o item sumir.

- [ ] **8. O Oráculo não cumprimenta a cada desbloqueio.** Bloqueie e desbloqueie
  o celular: ele deve ficar quieto.

- [ ] **9. O chat fecha.** Abra o Oráculo e toque fora dele.

- [ ] **10. Nenhuma chave crua na tela.** Se aparecer `{acoes}`, `{dias}` ou
  `{arena}` em qualquer fala do Oráculo, **avise na hora**.
