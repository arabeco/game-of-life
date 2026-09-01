# O que checar — 1.0.81

Dez coisas. São as que mexem em **dinheiro**, as que **nasceram agora** e as que
**já estiveram quebradas** — o resto do app está no
[CHECKLIST-TESTES-MANUAIS.md](CHECKLIST-TESTES-MANUAIS.md).

Em falha: o número, o que viu e o texto exato do erro, se houver.

**Antes de começar:** a conta precisa de ouro, **fragmentos** e pelo menos um
amigo. Sem fragmento, metade disto não roda.

---

## Dinheiro

- [ ] **1. Fechar ciclo não paga em dobro.** Feche um ciclo e compare a EXP do
  relatório com a soma dos dias — tem que bater. **Se vier metade do que você
  esperava, está certo**: antes vinha o dobro.

- [ ] **2. A rodada paga ao concluir.** Sem ciclo, conclua ações: o toast diz
  *"entrou na sua rodada"* e o nível **não** muda. Em Arenas, **Concluir rodada**
  credita e libera as arenas.

- [ ] **3. Baú.** Compre um Comum na aba Itens: saldo cai **24** e ele aparece no
  Arsenal.

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

- [ ] **7. Quebrar item.** Diz `Quebrar 20 💎` e realmente quebra. Era um alerta
  de simulação que não fazia nada.

- [ ] **8. O Oráculo não cumprimenta a cada desbloqueio.** Bloqueie e desbloqueie
  o celular: ele deve ficar quieto.

- [ ] **9. O chat fecha.** Abra o Oráculo e toque fora dele.

- [ ] **10. Nenhuma chave crua na tela.** Se aparecer `{acoes}`, `{dias}` ou
  `{arena}` em qualquer fala do Oráculo, **avise na hora**.
