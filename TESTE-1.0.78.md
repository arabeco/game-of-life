# Roteiro de teste — 1.0.78

`versionCode 78` · o AAB que você acabou de receber

Substitui o roteiro da 1.0.71: aquele saiu, e mais quinze commits entraram por
cima dele. Isto aqui é **tudo que ainda não foi conferido em aparelho**, junto.

Me diga o **número** do que não passar.

**Pré-requisitos, todos já feitos:** 4 migrações rodadas, edge functions `oracle`
e `web-push` deployadas.

---

## Vínculos — Mundo › Vínculos

Esta leva inteira nunca foi tocada por você.

### 1. O ouro sai no envio, não no aceite
Convide alguém para parceria. O ouro sai **na hora do envio** — antes cobrava no
aceite, e se você tivesse gasto o saldo esperando, quebrava na pior hora.

### 2. Recusar devolve sozinho
Peça para recusarem, ou revogue. O ouro volta **sem nenhuma tela explicando**.
Se aparecer parágrafo sobre reembolso, sobrou coisa velha.

### 3. O prazo no canto do card
Selo discreto tipo `30d`. Tocar oferece renovar por **metade do preço**.
Faltando 5 dias ou menos, ele esquenta de cor.

### 4. Nada dentro do vínculo cobra
Expor arena e propor duelo mostram **"Incluso"** no lugar do preço. Você paga o
vínculo, não cada coisa dentro dele.

### 5. O duelo é proposto, não imposto
Propor mostra **"Proposto"** e espera. A arena espelhada só nasce quando o outro
**aceita**. Quem propôs vê "Cancelar"; quem recebeu vê "Recusar / Aceitar".

### 6. O mentor entrega, o pupilo instala
Como mentor, escolha uma arena sua com ações e entregue. Como pupilo,
**Instalar** faz a arena aparecer **como sua** — edite e apague para confirmar
que a posse mudou de mão.

### 7. Vencido congela em vez de sumir
Force com um `update` em `relationship_links.expires_at`. O card **continua
visível**, mostra o fecho e oferece renovar. Não aceita coisa nova.

---

## Oráculo

### 8. O Presente fala toda vez que você abre
Presença **Presente**: fala em qualquer tela, toda abertura do app — não uma vez
por dia só no Planner, e sem sorteio no meio. **Equilibrado**: uma vez por dia,
só no Planner. **Silencioso**: nada.

### 9. A fala fica no chat, com hora
Veja o balão, depois abra o Oráculo. **A mesma fala tem que estar lá**, com hora.
Hoje mostra `10:49`; de outro dia, `26/08 10:49`. Não pode existir mensagem sem
hora no chat.

### 10. O contador conta os seus temas
`0/3` estava certo: o denominador é **quantos temas você tem ligados**, não um 3
fixo. Com 1 tema lê `0/1`. O card **automático** é sempre 1 por dia — número
diferente, coisa diferente.

Tente desligar o último tema: ele **recusa**, dizendo que para calar o Oráculo é
na presença. Antes deixava zerar, e aí o card parava de chegar em silêncio com o
contador lendo `0/0`.

### 11. Reação de marco fica, rotina some
Feche uma arena: a reação aparece **e fica gravada**. Já "você fez 5 ações hoje"
aparece e **não** entra no histórico.

### 12. O rodapé virou ação
Três coisas: bolinha dos cards + **"Ler meu dia"** + **"Pedir missão"**.

- **Ler meu dia** responde na hora, **sem gravar** e sem rede. Aparece e some.
- **Pedir missão** abre a proposta **dentro do Oráculo**, acima da barra.
- Sem arena elegível, o botão fica **opaco**: tocar dá o háptico de erro e diz
  o motivo. Não é botão morto.

### 13. As vozes mudam com o tom
Troque o tom nas preferências e feche arenas / reabra o app. Abertura e reação
devem **soar diferente** entre os quatro tons. São 80 falas de abertura e 120 de
reação, todas escritas — zero egress, nenhuma chamada de modelo.

### 14. O push só do card
Só o **card de infos** toca o celular. Fala e reação ficam no chat. Você pediu a
leitura com o app aberto — não faz sentido ela te empurrar notificação.

### 15. O push é perguntado uma vez só
Instalação nova, logo depois do onboarding. Recusando, o aviso diz **"é em
Ajustes › Oráculo & Alertas"** — e **não** pergunta de novo, nunca.

### 16. Preferências abrem
Ajustes › Oráculo & Alertas. No AAB anterior essa tela **não abria** — era um
`return null` antes de um hook, e o app inteiro caía junto.

### 17. Fechar arena não elogia duas vezes
Feche uma arena. O toast diz só **`Arena "X" concluída.`** — seco, é o recibo. O
elogio vem **só do balão**. Antes os dois elogiavam junto, e o toast escapava da
presença: quem estava no **Silencioso** levava o parabéns assim mesmo.

Confira no Silencioso: **o toast continua** (você precisa saber que a ação
pegou), **o balão não**.

---

## Telas

### 18. O nível é um número só
Placa do legado e cabeçalho **têm que dizer o mesmo**. Antes um dizia 36 e o
outro 72. Confira também em clã, amigos e convites.

### 19. O painel diário cabe, com menos coisa dentro
Abra na tela de descanso. **Nada cortado**, em qualquer altura de tela, e sem
rolagem em lugar nenhum.

Ele cabe porque tem menos coisa, não porque rola. Saíram quatro blocos:
**Ritmo** (era Feitas em porcentagem), **Checklist** (já é badge no botão de
checklist, na mesma tela), **Arena mais tocada** e o trio **Perfeitos ·
Sequência · Melhor dia** — os dois últimos são história do ciclo, não do dia, e
"Sequência" ainda ficava colado em "Streak" sendo outra coisa.

Sobrou o que é de hoje: **Feitas · EXP · Streak**, a data, uma fala do Oráculo,
o pacto e o progresso do ciclo.

**Confira que não sumiu do app:** abra o resumo pelo modal (não pelo painel
embutido) — Arena mais tocada e as estatísticas do ciclo **continuam lá**, junto
com a tela de histórico.

### 20. Histórico é tela, não modal
O voltar é o **nativo do app** — inclusive o botão físico do Android, que antes
não existia em lugar nenhum. O ciclo abre **centralizado**.

### 21. Um botão de editar
Um só, que libera **apagar ciclo e selecionar era** juntos. Apagar existe só
dentro do modo de edição. Criar ciclo fica **embaixo**.

### 22. Três arenas por linha
Em **todos** os modos, inclusive o de ordenação em Ativos. A barra de rolagem só
aparece ao arrastar, como no resto do app.

### 23. Jardim só na tela de descanso
O atalho saiu da aba Ativos.

---

## Se algo falhar

Me diga o **número** e o que viu.

Erro do banco nomeia a causa: `RELATIONSHIP_LINK_EXPIRED`,
`MENTORSHIP_OFFER_SLOTS_FULL` e afins são **recusas previstas**, não defeitos.

Os itens **9, 11 e 14** dependem das edge functions. Se um deles falhar sozinho
enquanto os outros passam, o problema é o deploy, não o código.

Agora **tudo** que está aqui está no bundle — não sobrou conserto fora dele.
