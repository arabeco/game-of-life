# Roteiro de teste — 1.0.80

`versionCode 80` · quinze commits desde a 1.0.79

**A migração do baú você já rodou.** Nada mais de SQL, nada de deploy.

O roteiro da 1.0.79 continua valendo — ele cobre o Oráculo (árbitro, trend,
streak, memória, marcos, háptico, acentos) e não está repetido aqui.

Esta versão é **economia e telas**. Me diga o **número** do que não passar.

---

## Experiência — o que mais me preocupa

Isto mexe em números que você vê. Se algo parecer errado aqui, é o mais urgente.

### 1. O dia deposita, o fecho paga `mudança de regra`

**Antes:** com ciclo, a experiência ficava retida até o ciclo fechar. **Sem
ciclo, ela caía direta no perfil, na hora.**

**Agora:** o dia sempre deposita no recipiente — rodada ou ciclo — e quem paga é
o fecho.

**Olhe:** conclua ações num dia sem ciclo. Na virada, o toast diz **"X EXP entrou
na sua rodada"**, e o seu nível **não muda ainda**.

### 2. Concluir rodada paga `novo`

Na aba Arenas, sem ciclo ativo e com ações concluídas, aparece uma faixa:

> **Rodada livre · 6 ações concluídas**
> Concluir libera as arenas para a próxima rodada. O histórico e a experiência ficam.

**Olhe:** tocar em **Concluir rodada** credita o acumulado (o toast diz quanto) e
libera as arenas. Antes isso era um botão fantasma no canto chamado "Zerar
metas" — nome de coisa destrutiva numa ação boa, que é por isso que você nunca
usou.

### 3. Abrir ciclo fecha a rodada

**Olhe:** com rodada acumulada, abra um ciclo. Antes dele começar, a rodada é
paga (toast: "Rodada anterior fechada: +N EXP").

### 4. Fechar ciclo não paga mais em dobro `conserto`

O fecho somava o acumulado dos dias **mais** um recálculo da base das mesmas
tarefas — com o bônus premium incidindo em cima. Pagava perto do **dobro**.

**Olhe:** feche um ciclo e compare a EXP do relatório com a soma dos dias. Tem
que bater. Se estiver metade do que você esperava, é porque antes estava o
dobro.

### 5. Editar um dia julgado funciona sem ciclo `novo`

**Olhe:** sem ciclo, marque/desmarque uma ação de um dia já passado. O acumulado
da rodada tem que acompanhar. Antes o reconciliador tinha `if (!activeCycle)
return` — quem jogava sem ciclo **não tinha direito de corrigir**, porque a
experiência já tinha sido paga e crédito não volta.

---

## Loja — a aba Forja não existe mais

As quatro coisas dela foram para onde você já está.

### 6. Quebrar item, no próprio item `era simulação`

**Isto estava quebrado e publicado.** O botão "Reciclar" do modal fazia
`window.confirm` e depois um `alert("(Simulação)")`. **Nunca reciclou nada** — o
item continuava lá, nenhum fragmento aparecia.

**Olhe:** abra um item seu no Arsenal. O botão agora diz **`Quebrar 20 💎`** — com
o valor. Confirme e veja o item sair e os fragmentos entrarem.

### 7. Forjar e comprar, no item que falta `novo`

O modal já mostrava a coleção do mesmo tipo, com o que falta apagado em cinza.
Faltava poder agir.

**Olhe:** toque num item **apagado**. Aparecem:
- **`50 🪙`** com o botão da skin, se ele estiver à venda
- **`Forjar 120 💎`** — caro, e o único jeito de escolher exatamente qual

### 8. Baús na aba Itens `novo` `SQL`

O "sortear na categoria" custava **o mesmo** que escolher o item exato — ninguém
sortearia. Ele virou o que sempre foi por dentro: um baú.

**Olhe:** cinco baús no topo de Itens, um por raridade, a 60% do custo de forjar
exato daquele patamar:

```
Comum 24 · Incomum 72 · Raro 240 · Épico 720 · Lendário 2400
```

Compre um Comum. O saldo cai **24** e o baú aparece no Arsenal. O preço é
conferido no servidor — se der erro de fragmentos com saldo suficiente, me avise.

Mítico não tem baú (é só de temporada). Season e Ciclo também não se compram —
são recompensa.

### 9. Campanha por fragmento, na aba Campanhas

**Olhe:** nos cards de campanha não-premium, um segundo botão com o preço em
fragmento ao lado do de ouro.

### 10. A aba Forja sumiu

**Olhe:** a barra da loja tem três abas agora — Campanhas, Itens, Ouro.

---

## Mundo — as telas

### 11. A barra da loja cabe numa linha

Ouro e fragmentos ficavam **empilhados**, e essas duas linhas definiam a altura
da barra inteira. E ela é `sticky` com fundo translúcido: "Pacotes de Ouro" e
"FORJA" **liam-se através** da caixa de moedas.

### 12. Itens sem os rótulos inúteis

Saíram `Tipos de item`, `10 a 500` e o `JÁ POSSUI` — que era um **botão
desabilitado ocupando uma linha inteira** em todo item que você já tem. Virou um
visto no canto. E `COMMON` virou **Comum**.

### 13. Pacotes de ouro menores

De 12,4rem para 9,2rem. Saíram o título e o selo `GOOGLE PLAY`. A quantidade
agora é **`500 🪙`**.

### 14. Insígnias com nome próprio

`OURO: SOB...` virou **`Insígnia do Soberano`**. O metal na frente empurrava o
nome útil para depois dos dois pontos — exatamente onde a grade cortava. Agora
cabe em duas linhas.

### 15. Feed pela metade da altura

Saíram `Sinais do reino` e `EVENTOS 14`. Cada evento eram três blocos empilhados,
e o do meio repetia a estrutura do de cima com **outro ícone de 44px**. Quase
200px por evento.

### 16. Campanhas começam pelas campanhas

Saiu o `CAMPANHAS` gigante e a faixa do quiz. Quiz e filtro viraram botões
quadrados na mesma faixa da busca. Nos cards, o quadradinho de arena tem ícone,
nome e a contagem como marcador — antes tentava caber "4 ações" em um terço da
largura.

### 17. Cards de missão dizem o que a missão é

**Olhe:** um botão só (**Ver**). O estado virou texto quieto com um ponto —
`Não iniciada · Em curso · Concluída`. Antes `ACEITAR` era um chip **vestido de
botão** ao lado do botão real, e o mais chamativo não clicava.

A **barra de progresso agora aparece sempre**, inclusive vazia — antes só existia
depois de aceitar, então a maioria dos cards não mostrava progresso nenhum.

E a **recompensa aparece**: ela era passada em sete lugares e o componente nunca
declarava a prop. Chegava e era jogada fora.

Faixa de cor por família na borda: temporada usa a cor da season, iniciante
prateado, individual dourado, grupo azul.

---

## Painel e Oráculo

### 18. O painel diário não corta mais

A lista de ações tinha `overflow-hidden`, e a altura disponível quase nunca é
múltipla da altura de um cartão — **sobrava sempre meio cartão fatiado**. Agora
rola com a barra escondida.

### 19. O Oráculo parou de empurrar ciclo

Todas as 16 linhas de "sem ciclo" diziam a mesma coisa: abra um ciclo. Com
cooldown de 1 dia, dia sim dia não.

**Olhe:** sem ciclo, ao longo de dias, ele deve variar entre seis ângulos:

> Vá concluindo e ajustando as repetições das arenas. O ciclo entra quando você quiser meta.
> A meta já está nas repetições que você definiu. O ciclo só acrescenta prazo.
> Nada aqui expira por não ter ciclo.

E a dica do Planner diz o que era invisível: **sem ciclo a experiência entra
igual.**

### 20. O chat fecha

**Olhe:** abra o Oráculo e toque **fora** dele. Fecha. Antes não fechava — o
container era `pointer-events-none` e só o painel reativava os eventos, então o
clique no fundo **atravessava sem encontrar nada**. Com o chat alto, o X saía da
área visível e não havia saída nenhuma.

Ele também estava colado na direita (`justify-end`) e com altura em `vh`, que no
Android ignora as barras do sistema.

---

## Se algo falhar

Me diga o **número** e o que viu.

Nos itens **1 a 5** (experiência), me diga também **os números que apareceram** —
quanto o toast disse, quanto o nível subiu. Ali a diferença entre certo e errado
é aritmética, não impressão.
