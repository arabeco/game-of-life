# Roteiro de teste — 1.0.81

`versionCode 81` · quinze commits desde a 1.0.80

**As três migrações já estão no ar** — baú, humor e doação. Nada de SQL, nada de
deploy.

O roteiro da 1.0.80 continua valendo. Esta versão é sobre **coisas que estavam
quebradas sem ninguém saber** e sobre o painel diário.

---

## O que estava simulado

Três botões publicados que pareciam funcionar e não funcionavam.

### 1. Quebrar item era `alert("(Simulação)")`

**Olhe:** abra um item seu no Arsenal. O botão diz **`Quebrar 20 💎`** — com o
valor. Confirme: o item sai e os fragmentos entram.

Antes: `window.confirm`, um alerta dizendo *"(Simulação)"*, e nada acontecia.

### 2. Doar era a mesma coisa `SQL` `novo`

**Olhe:** num item seu **não equipado**, toque em **Doar** (ícone de presente).
Abre a lista de **amigos** — só amigos. Escolha, confirme, e o item sai do seu
inventário.

**Do outro lado:** quem recebe ganha notificação e, ao abrir o app, **o modal de
recompensa** — o mesmo dos baús.

Não há desfazer, de propósito. Item equipado recusa com aviso.

### 3. "Ver no Planner" mentia

Na tela de descanso ele avisava *"Planner aberto em 31/08"* e **não abria nada** —
a tela não navega e não há o que fechar ali. Sumiu do painel embutido. **No modal
continua**, porque lá funciona.

---

## O painel diário ganhou duas abas

### 4. Ontem e hoje `novo`

**Olhe:** abra o painel na tela de descanso. Duas abas: **ontem** à esquerda,
**hoje** à direita.

O que muda entre elas:

| | Hoje | Ontem |
|---|---|---|
| Leitura do Oráculo | sim | não |
| Proposta de missão | sim | não |
| Terceira métrica | Streak | **Fechou em 71%** |
| Lista | ações, uma a uma | **contagem por arena** |

A leitura e a proposta falam do **agora** — mostrá-las sobre ontem seria
apresentar o presente como se fosse aquele dia.

### 5. Ontem são números, não lista

**Olhe:** na aba ontem, em vez da lista aparecem etiquetas: `Saúde 3` ·
`Estudos 2`. Ninguém pergunta *"quais"* sobre um dia que passou — pergunta-se
*"quanto"* e *"onde"*. E ocupa o mesmo espaço com três ações ou com trinta.

### 6. Hoje mostra todas as ações

**Olhe:** com mais de cinco ações no dia, a lista rola. Antes ela cortava em
cinco e dizia *"+3 no Planner"*, mandando você a outra tela ver o resto do
próprio dia.

### 7. Fechar volta para hoje

**Olhe:** vá para ontem, feche o painel, abra de novo. Tem que estar em **hoje**.
Antes o estado sobrevivia, e você reabriria em ontem horas depois sem lembrar de
ter escolhido — lendo o dia errado achando que era o de agora.

---

## Oráculo e feed

### 8. Ele para de cumprimentar a cada desbloqueio

**Olhe:** bloqueie e desbloqueie o celular. Ele **não** deve falar de novo.

Antes a trava zerava em todo `visibilitychange` — trocar de aba por dez segundos,
atender uma mensagem, olhar a hora. Agora voltar em menos de **meia hora** é a
mesma vinda.

### 9. Os cards do feed dizem o tamanho do feito `novo`

**Olhe:** conclua uma arena nova e veja no feed:

```
[◯] Mister X · concluiu uma arena              2M  ♛  ↑
              🏋️  Academia
        34 ENTREGAS · 5 AÇÕES · 21 DIAS
```

Os números são **gravados no momento** — se você desmarcar uma ação amanhã, a
arena deixa de estar completa mas o registro continua verdadeiro. Ele diz o que
era naquele dia.

**Eventos antigos não têm esses campos e não mostram a linha.** Instantâneo que
não foi tirado não se inventa depois — então só arenas concluídas a partir desta
versão terão números.

---

## Humor

### 10. Registrar virou um ato `SQL` `novo`

**Olhe:** arraste o slider. **Nada é salvo.** Aparece um botão:

> **Registrar · Amor (500)**

O número é o nível na escala de 0 a 1000, não a posição do slider. Ninguém se
identifica com "75".

Antes, arrastar salvava em cada movimento — o que daria centenas de registros por
arrasto.

### 11. O gráfico

**Olhe:** registre duas vezes e o gráfico aparece. **Linha na cor da sua skin,
pontos na cor de cada estado** — dá pra ver a travessia do vermelho ao azul sem
ler número.

Sem editar e sem apagar, de propósito: registro de humor é o que você sentiu
naquele momento.

---

## Loja e telas

### 12. Baús na aba Itens `SQL`

**Olhe:** cinco baús no topo, um por raridade. Compre um Comum: o saldo cai **24**
e ele aparece no Arsenal.

### 13. A coleção no modal do item

**Olhe:** toque num item **apagado** (que você não tem). Aparecem **`50 🪙`** se
estiver à venda, e **`Forjar 120 💎`** — caro, e o único jeito de escolher
exatamente qual.

### 14. Missões com gradiente e título maior

**Olhe:** a cor da família atravessa o cartão e marca a borda esquerda —
temporada usa a cor da season, iniciante prateado, individual dourado, grupo
azul. Título maior e centralizado, com o estado logo abaixo.

### 15. Nenhum alerta do navegador

**Olhe:** tente criar grupo sem nome, ou subir uma imagem acima de 2 MB. Deve vir
**toast**, não o diálogo cinza do sistema com o nome do pacote em cima.

Eram nove, em cinco telas.

---

## Tutorial

### 16. O onboarding conta que existe mais

**Olhe:** no fim do onboarding, a última fala termina com *"Cada tela se
apresenta na primeira vez que você entra, e o tutorial completo fica em Ajustes
quando quiser."*

As quatro seções com 20 passos existiam e **nada em lugar nenhum dizia que
estavam lá** — a única porta era um botão "Reabrir" dentro de Ajustes.

### 17. Três passos do tutorial estavam desatualizados

**Olhe** (Ajustes › tutorial › Reabrir):

- **05** ensinava "fechamento do dia" — ritual que não existe mais, o dia fecha
  sozinho. Virou **RESUMO DO DIA**.
- **04** apresentava o ciclo como obrigatório. Agora diz que é **opcional**.
- **13** era "CAMPANHAS" pela segunda vez. Virou **OURO E FRAGMENTOS**.

E os passos que apontam para Arsenal ou Loja **agora trocam de aba** — antes
mudavam de tela e paravam na aba errada, com o holofote procurando um elemento
fora da tela.

---

## Se algo falhar

Me diga o **número** e o que viu.

Os itens **2, 10, 11 e 12** dependem das migrações, que já confirmei aplicadas.
Se algum deles der erro de permissão ou de coluna, é o único caso em que quero
saber o texto exato do erro.
