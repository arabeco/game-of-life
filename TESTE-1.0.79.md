# Roteiro de teste — 1.0.79

`versionCode 79` · o AAB que você acabou de receber

**Esta versão é o Oráculo inteiro reescrito por dentro.** Onze commits, e nada
disso estava na 1.0.78. Os itens 1–23 do roteiro anterior continuam valendo e
não estão repetidos aqui.

**Nada de SQL novo.** A migração de alertas você já rodou, e as duas edge
functions já foram deployadas.

---

## Antes de qualquer coisa: ligue o diagnóstico

**Ajustes › Oráculo & Alertas › Copiar diagnóstico do Oráculo.**

Quando alguma fala parecer idiota, **não me diga "ficou estranho"** — toque nesse
botão e me cole o texto. Ele vem assim:

```
2026-08-28 21:30 · presenca 3 · corte 5 · tom coach
    18.3 meta_inflada — venceu
    17.5 ausente — perdeu
    15.5 arena_parada (aaa111) — perdeu
     5.9 ja_entregou — perdeu
   => meta_inflada: "40 ações por dia é o que está montado..."
```

Com isso eu ajusto peso. Sem isso, eu chuto. **É o item mais importante deste
roteiro** — os outros dependem dele para virar conserto.

Ele guarda as últimas 20 decisões, inclusive os **silêncios**. Nada sai do
aparelho.

---

## O que mudou no fundo

### 1. Ele parou de obedecer uma fila e passou a escolher

Antes: dez `if` em ordem fixa, o primeiro que casasse calava os outros nove. Você
podia estar ao mesmo tempo três dias ausente, com uma arena crítica, outra
retomada e no streak 29 — e ele dizia "ausente" e acabou.

**Olhe:** ao longo de alguns dias, ele não deve mais falar sempre da mesma coisa
quando várias estão acontecendo. O diagnóstico mostra os concorrentes.

### 2. As seis arenas competem, e não só a pior

Antes ele calculava seis arenas e usava **uma** — e, por ser ordenado por
gravidade, era **impossível** uma arena que vai bem ganhar a voz.

**Olhe:** o diagnóstico mostra linhas com `(id da arena)`. Se aparecer mais de uma
arena concorrendo, está funcionando.

### 3. Ele vê direção, não só posição `novo`

Uma arena pode estar **crítica** e **retomando** ao mesmo tempo.

**Olhe:** deixe uma arena parada uns dias, depois conclua uma ação nela. Antes ele
dizia *"está crítico, reduza a meta"* — no exato dia em que você fez a coisa
certa. Agora tem de dizer algo como:

> Depois de 8 dias parada, Projeto voltou a andar. Ainda está atrás, mas mudou
> de direção.

**Reconhece a volta sem fingir que o atraso sumiu.**

### 4. Ele parou de mandar cortar meta de quem só não executou

Antes, três das quatro vozes diziam *"reveja a meta"* / *"diminua a repetição"*
para qualquer arena atrasada. Se você pôs 2 ações por dia e não fez, **não há
nada errado com o número** — o app estava se rendendo por você.

**Olhe:** arena atrasada agora pede **uma ação**, não corte. Mandar cortar só
acontece com evidência real: demanda acima do **dobro** do seu melhor dia, com
pelo menos 5 dias de ciclo e 3 dias com entrega.

> São 40 ações por dia aí. Não é você que está devendo — é o número.

### 5. Ele lembra do que disse

**Olhe:** dois dias seguidos não podem trazer a mesma frase, nem o mesmo assunto.
Reclamação de arena fica 2 dias de molho; risco de sequência, nenhum.

Se o assunto está de molho, ele **passa a vez** para o próximo — não fica calado.

---

## Sequência (streak)

### 6. O número aparece nas falas `novo`

**Nenhuma das ~200 falas mencionava seu streak.** O que mais segura a pessoa era
a única coisa que o Oráculo não comentava.

**Olhe:** com sequência ativa, o número tem de aparecer.

### 7. Aviso antes de perder `novo`

**No app:** com sequência ≥ 3, nenhuma ação hoje, e abrindo depois das **18h**,
ele avisa. (A madrugada ainda conta: o dia vira às 4h.)

**No celular:** ligue **"Avisar antes de perder a sequência"** em Ajustes. Nasce
**desligado** de propósito. Entre 21h e 23h, o cron manda um push.

**Isto funciona no Silencioso.** É a única coisa que atravessa — e só porque tem
interruptor próprio. Presença decide o que ele **comenta**; isto avisa que algo
vai ser **perdido**. Se você nunca ligou, nada acontece.

### 8. Marcos 7 · 14 · 30 · 60 · 100 `novo`

**Olhe:** no dia em que bater um desses, a fala tem de ser diferente da de um dia
comum, e **não pode pedir nada** — sem "agora continue", sem próximo passo. É o
único momento do app em que você não deve nada a ninguém.

Confira também o **háptico**: marco de sequência tem vibração exclusiva.

### 9. A ação que salva a sequência `novo`

**Olhe:** feche uma ação depois das 18h com a sequência em risco. A reação tem de
ser sobre **ter salvado**, não a reação comum.

### 10. A primeira ação depois de uma pausa `novo`

**Olhe:** fique 4+ dias sem concluir nada, depois conclua uma. A reação tem de
falar do intervalo:

> Primeira em 8 dias. Amanhã a segunda custa menos que essa.

Fechar uma ação é banal; fechar a primeira depois de oito dias é outra coisa — e
antes as duas recebiam a mesma frase.

---

## Reações e dicas

### 11. Reação não repete mais

Antes, com 3 variantes sorteadas sem memória, fechar duas arenas seguidas
devolvia a mesma frase **1 vez em 3**.

**Olhe:** feche várias arenas/metas seguidas. **Nunca** pode vir a frase anterior.

### 12. A dica de tela olha a tela `novo`

Ela era fixa: dizia *"crie uma arena simples"* para quem chegava com seis, e
*"puxa uma ação"* para quem não tinha ciclo — e ali o Planner está vazio.

**Olhe:** numa conta com arenas, a dica de Arenas conta **quantas** você tem. Sem
ciclo aberto, a do Planner diz que falta o ciclo.

---

## Toque e texto

### 13. Vibração com gramática `novo`

Antes colidiam: marcar ação vibrava igual a fechar um dia de sequência; fechar
arena igual a fechar o painel; e **fechar um ciclo inteiro vibrava igual a fechar
o painel diário**.

**Olhe — e este teste é físico:** depois de alguns dias, você consegue sentir a
diferença **sem olhar a tela**? Quatro pesos: toque (ação) · fecho (arena, dia) ·
marco (campanha, ciclo) · e um exclusivo do marco de sequência.

Se depois de uma semana tudo ainda parecer "bzz", não funcionou — me diga.

### 14. O texto ganhou acentos `novo`

As **320 frases** nasceram sem acento nenhum.

**Olhe:** qualquer fala do Oráculo. Tudo com acento, maiúscula e ponto final. E
**nenhuma chave crua na tela** — se aparecer `{acoes}` ou `{dias}` em vez do
número, me avise: é o defeito que mais me preocupa nesta versão.

---

## O que eu mais quero saber

Não é *"a fala estava certa?"*. É:

> **Você preferiria que ele não tivesse falado nada ali?**

Uma fala pode estar factualmente perfeita e mesmo assim atrapalhar. Se isso
acontecer muito, o corte de relevância está baixo. Se ele quase nunca falar e
você quiser mais, está alto.

Anote mentalmente: 👍 valeu · 😐 tanto faz · 👎 preferia silêncio. E quando der
👎, **cole o diagnóstico**.

---

## Se algo falhar

Me diga o **número** e o que viu.

Os itens **7 (push)** dependem do cron e das edge functions, já no ar. Os itens
**1–6 e 8–14** são só cliente e valem neste AAB.
