# Roteiro de teste — 1.0.71

`versionCode 71` · commit `d8520fc` · 27/08 09:49

Quinze coisas mudaram desde a 1.0.68 e **nenhuma foi conferida em aparelho**.
Cada item diz o que era antes, porque quase sempre é a diferença que denuncia o
defeito. Me diga o **número** do que não passar.

**Pré-requisitos, todos já feitos:** 4 migrações rodadas, edge functions `oracle`
e `web-push` deployadas, cliente neste AAB.

---

## Vínculos — Mundo › Vínculos

### 1. O ouro sai no envio, não no aceite `SQL`

**Antes:** cobrava quando o outro aceitava. Se você tivesse gasto o saldo
enquanto esperava, quebrava na pior hora possível.

**Olhe:** convide alguém para parceria. O ouro sai **na hora do envio**. Com
saldo insuficiente, recusa ali mesmo.

### 2. Recusar devolve o ouro sozinho `SQL`

**Antes:** a tela explicava a política de reembolso num parágrafo — para uma
cobrança que era de zero.

**Olhe:** peça para recusarem, ou revogue. O ouro volta **sem nenhuma tela
explicando**. Se aparecer texto sobre reembolso, sobrou coisa velha.

### 3. O prazo no canto do card `SQL` `novo`

**Antes:** o vínculo não tinha prazo. Existia para sempre.

**Olhe:** um selo discreto tipo `30d` no card. Tocar oferece renovar por
**metade do preço**. Faltando 5 dias ou menos ele esquenta de cor.

### 4. Nada dentro do vínculo cobra `SQL`

**Antes:** expor arena custava 50, cada duelo custava 50 — e nenhuma tela
avisava antes.

**Olhe:** expor arena e propor duelo mostram **"Incluso"** no lugar do preço, e
não tiram ouro nenhum.

### 5. O duelo é proposto, não imposto `SQL` `novo`

**Antes:** forjar criava as duas arenas na hora — inclusive a do outro, na conta
dele, sem perguntar.

**Olhe:** propor mostra **"Proposto"** e espera. A arena espelhada só nasce
quando o outro **aceita**. Quem propôs vê "Cancelar"; quem recebeu vê
"Recusar / Aceitar".

### 6. O mentor entrega, o pupilo instala `SQL` `novo`

**Antes:** desde agosto o mentor não podia criar nada — e a tela ainda mandava
ele "abrir uma arena", que o banco recusava.

**Olhe:** como mentor, escolha uma arena sua com ações e entregue. Como pupilo,
**Instalar** faz a arena aparecer **como sua** — edite e apague para confirmar
que a posse mudou de mão.

### 7. Vencido congela em vez de sumir `SQL`

**Olhe:** difícil sem esperar 30 dias — dá para forçar com um `update` em
`relationship_links.expires_at`. O card **continua visível**, mostra o fecho
(quem venceu, na competição) e oferece renovar. Não aceita coisa nova.

---

## Oráculo — o card leva até 10 min (cron)

### 8. A fala fica no chat, com hora `SQL` `edge`

**Antes:** a fala piscava 5 segundos no topo e evaporava. Se o celular estava no
bolso, ela nunca existiu.

**Olhe:** abra o app, veja o balão, depois abra o Oráculo. **A mesma fala tem
que estar lá**, com hora ao lado. Hoje mostra `10:49`; de outro dia mostra
`26/08 10:49`.

### 9. A fala vai para o celular `edge`

**Antes:** só o card virava push. A fala nunca chegava.

**Olhe:** com o interruptor de avisos ligado e o app fechado, a fala **toca o
celular**. Com ele desligado, ela ainda aparece no chat — desligar aviso tira do
celular, não apaga.

### 10. Os links deixaram de ser mensagem falsa `cliente`

**Antes:** "Montar ciclo · Rever arenas" era um painel recalculado toda vez que o
chat abria — sem hora, sem histórico, sem push, sentado num log ao lado de
mensagens de verdade.

**Olhe:** os mesmos botões viajam **dentro de uma fala real**. Não pode mais
existir mensagem sem hora no chat.

### 11. Reação de marco fica, rotina some `SQL`

**Olhe:** feche uma arena — a reação aparece **e fica gravada**. Já "você fez 5
ações hoje" aparece e **não** entra no histórico: repetida todo dia viraria papel
de parede.

### 12. O Presente volta a falar `cliente`

**Antes:** só disparava no Planner, uma vez por dia, e ainda passava por um
sorteio de 55%. A marca do dia era gravada antes do sorteio, então sorteio
perdido queimava o dia inteiro em silêncio.

**Olhe:** com presença **Presente**, ele fala **toda vez que você abre o app**,
em qualquer tela. Com **Equilibrado**, uma vez por dia e só no Planner.

### 13. O card do dia existe no plano grátis `edge`

**Antes:** card era exclusivo do Premium, então quem não assinava nunca via a
mecânica funcionar.

**Olhe:** numa conta **sem Premium** o card do dia entra sozinho. O seletor de
temas aparece **apagado**, e tocar nele avisa que escolher tema é do Premium.

### 14. O push é perguntado uma vez só `cliente`

**Antes:** a marca de "já perguntei" era gravada *antes* de perguntar. Qualquer
falha no meio queimava o campo — e o único outro caminho, o modal de
preferências, desenhava vazio.

**Olhe:** instalação nova, logo depois do onboarding, ele pergunta. Recusando, o
aviso diz **"é em Ajustes › Oráculo & Alertas"** — e **não** pergunta de novo.

---

## Telas — só cliente

### 15. Cabeçalho, ciclos e o preço da cena `cliente`

**Cabeçalho:** as duas bolinhas menores e iguais entre si, com o alvo do dedo
intacto. E me diga se **algo desceu no topo** — é isso que confirma se sua
WebView virou edge-to-edge.

**Ciclos:** trilha horizontal que abre já no ciclo atual, encaixando no centro ao
arrastar, com as faixas de era embaixo.

**Cena do legado:** o preço aparece com o de tabela riscado ao lado. Sem
Platinum deve ler **25** riscando **50**.

---

## Se algo falhar

Me diga o **número** e o que viu.

Erro do banco nomeia a causa: `RELATIONSHIP_LINK_EXPIRED`,
`MENTORSHIP_OFFER_SLOTS_FULL` e afins são **recusas previstas**, não defeitos.

Os itens **8, 9, 11 e 13** dependem das edge functions que subiram hoje. Se um
deles falhar sozinho enquanto os outros passam, o problema é o deploy, não o
código.
