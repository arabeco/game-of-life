# Os 133 itens, em tópicos

Gerado do `ITEMS_DB` e do `RANK_REWARDS` de verdade em 20/09/2026, depois que o
glifo e o orbe saíram. Nenhum número aqui foi estimado.

**Este arquivo é para ser mexido a mão, conversando.** Ele não é regenerado por
script — a folha que se regenera é a `tools/a-mesa.html`. Aqui é onde as
decisões ficam escritas antes de virarem código.

Como ler cada linha:

```
- Nome — onde se ganha · preço em ouro · SEM ARTE
```

Se aparece uma patente (`5 Barão`), é prêmio daquele degrau. `loja` é só ouro.
`só baú` é sorteio. `SEM PORTA` é item que existe e ninguém consegue.

---

## Decisões de 20/09/2026

Conversadas tópico a tópico. O que está aqui ainda **não virou código** — é o
combinado, escrito antes.

| # | Tópico | Decidido |
|---|---|---|
| 1 | Roupa | ~11 roupas novas, chegando a **30**. Para engordar o pacote inicial e dar uma boa por patente. |
| 2 | Cabelo | Fica como está: livre para todos. |
| 3 | Aura | Não cria agora. Uma nova para o degrau 8 é opcional e barata (é código, não desenho). |
| 4 | Borda | **Nenhuma nova.** Só a Soberano fica na escada, no degrau 10. As outras saem por **regra clara, com quest invisível e modal**. A Aprendiz entra no pacote inicial. |
| 5 | Banner | Igual à borda. A Aprendiz entra no pacote inicial. |
| 6 | Insígnia | Fica como está. |
| 7 | Skin de UI | Uma por **patente ímpar**. O pacote inicial passa a dar **BASIC + GOLD**. |
| 8 | Artefato | **Tirar o jardim 2D antigo** (9 peças aposentadas) e trazer os kits do jardim novo para cá. |
| 9 | Tábua / wallpaper | Sai de "tudo na loja": vira prêmio de patente. |
| 10 | Jardim | Ver se dá para vender as peças do kit separadas, e o que a variação de tema cria de fato. |

Em aberto, ligado ao 4 e ao 5: **o baú poder dar dois itens.**

### O que o baú alcança, antes e depois

Tirar o glifo e o orbe tirou 9 peças do sorteio. O efeito não foi parelho:

| Baú | Antes | Agora |
|---|---|---|
| Comum | 40 | 34 |
| Incomum | 49 | 45 |
| Raro e Ciclo | 51 | 46 |
| Épico | 31 | 28 |
| **Lendário** | **10** | **8** |
| Mítico | 3 por temporada | 3 por temporada |

**O Lendário é o problema, e já era antes.** Oito peças: abre oito vezes e viu
tudo. Foi de onde saíram duas das nove — o Artefato Sombrio e o Orbe Soberano
eram tier 5.

### O jardim como peça de catálogo — a proposta

Hoje o jardim entrega **5 itens** e se esgota em duas compras: um id libera as
nove peças de uma coleção inteira.

Quebrado como conversado, viram **13 lugares, 9 conquistáveis**:

| O quê | Quantos | Grátis no começo |
|---|---|---|
| Cenas (bases de terreno) | 4 | 1 (a aberta) |
| Kits de peça | 5 | 1 (o Básico) |
| Temas de cor | 3 | 1 (Refúgio natural) |

### Os kits são por NÍVEL, não por família

Agrupar por família estava errado: alguém compraria o kit de pedra e ficaria com
um jardim só de pedra. Cada kit leva **um pouco de cada família**, então qualquer
kit sozinho já monta um jardim que se olha.

As 18 peças do `views/zen3d/model.ts` se dividem assim:

- **3 são água** — e água não é peça de kit, vem do terreno. Quem escolhe a base
  "Espelho do bosque" ganha o lago; quem escolhe "Margens do refúgio" ganha o
  riacho e a ponte.
- **3 são assinatura** — uma por coleção, hoje presas ao tema.
- **12 sobram** para os kits.

| Kit | Pedra | Caminho | Planta | Luz |
|---|---|---|---|---|
| **Básico** · grátis | Pedra avulsa | Caminho reto | Pinheiro | — |
| **Kit 2** | Rocha musgosa | Caminho curvo | — | Lanterna de pedra |
| **Kit 3** | Conjunto natural | Passos livres | Bordo japonês | — |
| **Gourmet** | — | — | Bambuzal, Jardineira | Lanterna suspensa |
| **Extras** | as 3 assinaturas: Totem das três pedras, Guardião do pátio, Relicário de ametista |

O Básico dá pedra, caminho e árvore — o mínimo que faz um jardim parecer jardim.
A luz só chega no Kit 2, e é o que faz o segundo kit valer a pena.

O **Extras** é o único que não é seção transversal, e tudo bem: são as peças de
exibir. Hoje elas vêm de graça junto com o tema; soltá-las é o que cria o quinto
kit.

**O tema não é um kit.** Ele acende a versão colorida de toda peça que a pessoa
já tem — vale mais quanto mais ela já jogou.

### Borda e banner: o que isso desfaz

Em 20/09 eu tinha acabado de encher os dois na escada — borda 4/10 → 9/10,
banner 2/10 → 9/10. **A decisão desfaz isso**, e de propósito: 32 das 33 peças
não têm nome de patente, então ficavam num degrau sem dizer por quê.

Depois da mudança:

| | Na escada | Por regra |
|---|---|---|
| Borda | 1 (Soberano, degrau 10) | 16 |
| Banner | 0 | 16 |

Duas entram no **pacote inicial**, que era o buraco do degrau 1: a **Borda
Aprendiz** e o **Banner Aprendiz**. São as únicas com nome de quem está
chegando.

**A máquina de entrega já existe.** O `SKIN_SEASON_UNLOCKS` liga item a missão
cumprida e o `BorderSelectionModal` já lê `completedSeasonMissions` para liberar
borda. O que falta é a condição sair do ciclo em vez da temporada, e a quest ser
invisível até cumprir.

### As 11 regras de borda e banner

Borda e banner **vêm em par**: 14 nomes existem dos dois lados. Uma regra
desbloqueia os dois, então 32 peças não pedem 32 regras.

E dos 18 nomes, sete já têm porta e não pedem regra nenhuma: **Aprendiz** vai
para o pacote inicial, **Soberano** fica no degrau 10, **Aurora II** e
**Gênesis** são de temporada, **GM / Grão Mestre** é de staff, e **Origem** está
aposentado.

**Sobram 11 — e uma delas nem é regra.** Fechadas na conversa de 20/09:

| Nome | Raridade | A regra |
|---|---|---|
| **Disciplinado** | comum | fechar um ciclo com **100% das ações** — nenhuma falhada |
| **Popular** | incomum | ter **5 amizades** |
| **Veterano** | incomum | fechar ciclos em **meses diferentes** (quantos, a decidir) |
| **Imparável** | raro | **30 dias** de sequência sem quebrar |
| **Vanguarda** | raro | **não é regra.** Vem com o código VANGUARDA25 |
| **Místico** | raro | **2 arenas de Propósito & Espiritualidade** completas no mesmo ciclo |
| **Transcendente** | raro | **+100 ações e +90% de conclusão** no mesmo ciclo |
| **Celestial** | épico | uma arena **completa** em cada uma das **5 áreas** |
| **Guardiã** | épico | mentoria concluída — **duas**, ou uma com duas arenas |
| **Oráculo** | épico | **2 missões individuais** completas — o oráculo é quem as dá |
| **Lenda Viva** | épico | **1.000 ações** concluídas |

#### Três coisas que a conversa resolveu

**A espiritualidade existe.** Eu tinha escrito que faltava medir; não falta. A
área `proposito` se chama, por extenso, *PROPÓSITO & ESPIRITUALIDADE*. O Místico
mapeia direto numa das cinco áreas que já estão em `constants/lifeAreas.ts`.

**Completa, não criada.** O Celestial e o Místico contam arena **fechada** no
ciclo, não arena aberta. Criar cinco arenas e abandonar não pode valer prêmio.

**Disciplinado e Transcendente disparam no mesmo momento** — os dois se decidem
no fecho do ciclo, e um ciclo perfeito e grande cumpre os dois de uma vez. Não é
problema desde que os modais saiam em ordem, e não empilhados.

#### O Vanguarda é outra coisa

Ele sai da lista de regras. É item de **código de resgate**: o VANGUARDA25, com
**25 unidades** e peças que depois **não podem cair de baú**.

Duas coisas para conferir antes:

- o `reward_codes` tem `max_redemptions`, e o VANGUARDA10 do repositório está com
  ele em `null` — ou seja, ilimitado;
- a Borda e o Banner Vanguarda hoje são prêmio de patente (Conde e Duque) e estão
  com `isRankExclusive`, o que já os mantém fora do baú. Virando item de código,
  a porta muda mas a proteção precisa continuar.

#### O que ainda falta medir

Só uma leitura nova, e ela serve para as duas regras de área: *quantas arenas de
tal área foram FECHADAS neste ciclo*. Uma função.

**A entrega já existe.** O `SKIN_SEASON_UNLOCKS` liga item a condição cumprida e
o `BorderSelectionModal` já o consulta. Hoje ele tem **uma** linha:
`{ GOLD: ['sm_3'] }`. A tabela é a mesma; o que falta são as outras onze linhas e
as condições que as alimentam.

### A raridade não pode sair do preço

Hoje ela sai. No jardim é literal:

| Item | Preço | Raridade |
|---|---|---|
| Caminho antigo | 45 | incomum |
| Espelho do bosque | 110 | raro |
| Pátio dourado | 210 | épico |
| Margens do refúgio | 260 | épico |
| Gênesis | 480 | lendário |

Sobe o preço, sobe a raridade. Isso faz a raridade não querer dizer nada além de
"é caro" — e quem paga pula a escada inteira.

**A raridade devia dizer quão difícil é conseguir, não quanto custa.** Com os
kits por nível isso se resolve sozinho: o Básico é comum porque todo mundo tem,
o Extras é raro porque é a última coisa que se ganha. O preço vira outra coisa.

Fica em aberto decidir a raridade de cada kit e de cada cena.

---

## Roupa — 19

**comum** (6)
- Náufrago — 1 Vagante
- Casual — 1 Vagante
- Gym Rat — loja · 15 ouro
- Street — 2 Escudeiro
- Caçador — 1 Vagante
- Casual 2 — 1 Vagante

**incomum** (3)
- Executivo — 6 Conde
- Tático — 4 Lorde
- Acadêmico — 3 Cavaleiro · 35 ouro

**raro** (3)
- Nômade — 7 Duque · 70 ouro
- Alquimista — loja · 85 ouro
- Híbrido — loja · 95 ouro

**épico** (4)
- Armadura Placa — 9 Rei · 190 ouro
- Mago Círculo — 8 Príncipe
- O Criador — staff
- Empreendedor — só baú · SEM ARTE

**lendário** (1)
- Entidade de Luz — 10 Soberano · SEM ARTE

**mítico** (2)
- Vestido Real — temporada
- Guardião Aurora — missão

## Cabelo — 8

**comum** (2)
- Cachos — livre
- Médio Reto — livre

**incomum** (1)
- Texturizado — livre

**raro** (2)
- Dreads — livre
- Mullet Top — livre

**épico** (2)
- Anime Spiky — livre
- Princesa — livre

**lendário** (1)
- Fluxo Espiritual — livre

## Aura — 8

**comum** (3)
- Bruma — 2 Escudeiro · SEM ARTE
- Safira — 3 Cavaleiro · SEM ARTE
- Rubi — 4 Lorde · SEM ARTE

**incomum** (2)
- Esmeralda — 5 Barão · SEM ARTE
- Prata — 6 Conde · SEM ARTE

**raro** (1)
- Ouro — 7 Duque · SEM ARTE

**lendário** (2)
- Pedra da Lua — 9 Rei · SEM ARTE
- Multiverso — 10 Soberano · SEM ARTE

> **"SEM ARTE" aqui engana.** A aura não é PNG: ela é desenhada no canvas por
> `utils/auraVisuals.ts`, seis cores por aura (core, bloom, haze, ring, spark,
> shadow). No avatar ela aparece. O emoji só sai na miniatura da loja e do
> inventário, que procuram um arquivo.
>
> Existe uma nona aura já codificada — **Fênix Dourada** — sem item nenhum
> apontando para ela.

## Borda — 17

**comum** (2)
- Disciplinado — 3 Cavaleiro · 10 ouro
- Aprendiz — 2 Escudeiro

**incomum** (2)
- Popular — 4 Lorde · 30 ouro
- Veterano — 5 Barão

**raro** (4)
- Imparável — 7 Duque · 80 ouro
- Místico — loja · 110 ouro
- Transcendente — 8 Príncipe · 130 ouro
- Borda Vanguarda — 6 Conde

**épico** (6)
- Lenda Viva — 9 Rei
- Soberano — 10 Soberano · SEM ARTE
- Celestial — loja · 180 ouro
- Guardiã — loja · 220 ouro
- Oráculo — loja · 250 ouro
- Borda Gênesis — aposentado

**lendário** (1)
- GM - Grande Mestre — staff

**mítico** (2)
- Aurora II — temporada
- Gênesis — temporada

## Banner — 16

**comum** (2)
- Disciplinado — 2 Escudeiro · 20 ouro
- Aprendiz — 3 Cavaleiro

**incomum** (2)
- Popular — 4 Lorde · 40 ouro
- Veterano — 5 Barão · 55 ouro

**raro** (3)
- Imparável — 6 Conde · 90 ouro
- Místico — loja · 110 ouro
- Banner Vanguarda — 7 Duque

**épico** (6)
- Lenda Viva — 10 Soberano · 180 ouro
- Celestial — 8 Príncipe · 195 ouro
- Guardiã — 9 Rei · 220 ouro
- Oráculo — loja · 250 ouro
- Transcendente — loja · 280 ouro
- Banner Origem — aposentado

**lendário** (1)
- Grão Mestre — staff

**mítico** (2)
- Aurora II — temporada
- Gênesis — temporada

## Insígnia — 16

**comum** (3)
- Insígnia do Vagante — 1 Vagante
- Insígnia do Escudeiro — 2 Escudeiro
- Insígnia de Relatório de Ciclo — entregue no fecho do ciclo, direto no código

**incomum** (2)
- Insígnia do Cavaleiro — 3 Cavaleiro
- Insígnia de Missão — missão

**raro** (3)
- Insígnia do Lorde — 4 Lorde
- Insígnia de Missão de Temporada — missão
- Insígnia de Patente Rara — entregue a cada promoção, direto no código

**épico** (2)
- Insígnia do Barão — 5 Barão
- Insígnia do Conde — 6 Conde

**lendário** (4)
- Insígnia do Duque — 7 Duque
- Insígnia do Príncipe — 8 Príncipe
- Insígnia do Rei — 9 Rei
- Insígnia do Soberano — 10 Soberano

**mítico** (2)
- Gênesis — temporada
- Aurora II — temporada

## Skin de UI — 9

**comum** (1)
- Tema: Básico Profissional — pacote inicial

**raro** (2)
- Tema: Ouro Soberano — 2 Escudeiro · 135 ouro
- Tema: Gelo Eterno — 1 Vagante · 135 ouro

**épico** (3)
- Tema: Chama Viva — 4 Lorde · 220 ouro
- Tema: Cyberpunk — 3 Cavaleiro · 220 ouro
- Tema: Aurora Boreal — 5 Barão · 220 ouro

**lendário** (1)
- Tema: Vazio Primordial — 6 Conde · 420 ouro

**mítico** (2)
- Tema: Aurora II — temporada
- Tema: Genesis — temporada

## Artefato — 29

**comum** (8)
- Adaga Aprendiz — pacote inicial
- Cachorro Beagle — só baú
- Gato Laranja — só baú
- Halteres — só baú
- Trio Café — 3 Cavaleiro
- Pedra Serena — aposentado
- Musgo Vivo — aposentado
- Garfo de Areia — aposentado

**incomum** (7)
- Cachorro Husky — só baú
- Gato Siamês — só baú
- Setup — 7 Duque
- Pedra Lunar — aposentado
- Lanterna de Pedra — aposentado
- Bambu Jovem — aposentado
- Ponte de Madeira — aposentado

**raro** (8)
- Pedra Obsidiana — aposentado
- Estatua de Meditação — aposentado
- Cachorro Jack — só baú
- Caixa Mágica — só baú
- Cetro Esmeralda — só baú
- Coroa Prata — só baú
- Divine Scepter — só baú
- Espada Runas — só baú

**épico** (4)
- Coroa de Espinhos — só baú
- Dragão Bebê — 9 Rei
- Grimório Arcano — só baú
- Manta — só baú

**lendário** (2)
- Fênix Cósmico — só baú
- Tesseract — só baú

## Tábua / wallpaper — 6

**comum** (1)
- Placa Madeira — pacote inicial · 18 ouro

**incomum** (1)
- Placa Pedra — loja · 42 ouro

**raro** (1)
- Placa Prata — loja · 95 ouro

**épico** (1)
- Placa Roxa — loja · 200 ouro

**lendário** (2)
- Placa Ouro — loja · 340 ouro
- Placa Gelo — loja · 360 ouro

## Jardim — 5

**incomum** (1)
- Jardim: Caminho antigo — loja · 45 ouro

**raro** (1)
- Jardim: Espelho do bosque — loja · 110 ouro

**épico** (2)
- Kit Jardim: Pátio dourado — loja · 210 ouro
- Jardim: Margens do refúgio — loja · 260 ouro

**lendário** (1)
- Kit Jardim: Gênesis — loja · 480 ouro
