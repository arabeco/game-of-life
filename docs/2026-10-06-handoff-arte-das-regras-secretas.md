# Handoff de arte — os prêmios das 10 regras secretas novas

Saiu da conversa de 06/10/2026. O desenho das regras está em
`docs/superpowers/specs/2026-10-06-regras-secretas-design.md`.

**15 arquivos:** 5 roupas, 5 bordas e 5 banners. Borda e banner do mesmo nome
são um par: mesmo material, mesma paleta, mesma raridade.

| Prêmio | Raridade | Regra que o entrega |
|---|---|---|
| roupa **Escriba** | comum | 10 páginas do diário escritas |
| roupa **Maratona** | incomum | um dia com 12 ações concluídas |
| roupa **Ancião** | raro | 12 ciclos fechados |
| roupa **Campeão** | épico | vencer 3 competições |
| roupa **Imperador** | lendário | 5.000 ações concluídas |
| borda + banner **Sereno** | incomum | humor registrado em 30 dias |
| borda + banner **Alvorada** | raro | 10 ações antes das 7h, numa semana |
| borda + banner **Prisma** | raro | 14 dias seguidos tocando as 5 áreas |
| borda + banner **Profeta** | épico | 5 missões do Oráculo |
| borda + banner **Pedra da Lua** | lendário | um ciclo SSS |

**A riqueza cresce com a raridade.** Comum é simples e honesto; lendário é a
peça mais trabalhada do jogo. Foi assim que as placas novas saíram certas: com
referência, uma por degrau, para o peso subir junto com a raridade em vez de as
cinco saírem iguais.

**Enquanto a arte não chega, nada aparece.** O item existe no catálogo sem PNG,
escondido, e a regra fica desligada. Quando a arte entra, a regra liga e quem já
cumpriu ganha na hora.

---

## 1 · As 5 roupas

### Onde caem, e as regras que mais quebram

Roupa não é ilustração solta: é uma **camada por cima de um corpo que já
existe**, posta pixel a pixel, sem recorte nem ajuste. Existem oito corpos
(quatro tons × dois gêneros) e **uma roupa serve os oito**.

| Medida | Valor |
|---|---|
| Tamanho | **500×500** |
| Fundo | **transparente de verdade** |
| Enquadramento | **o mesmo do corpo** — mesma altura de ombro, mesma cintura, mesma escala |

**A gola é um buraco, não um pano.** Uma IA pedida por "casaco" entrega foto de
produto: dentro da gola aparece o avesso do casaco, e posto sobre o corpo ele
cobre o pescoço. A roupa tem de ser desenhada **como se já estivesse vestida**:

- o vão da gola é **transparente** — o pescoço vem do corpo;
- a boca da manga é transparente — **a mão vem do corpo**, e a roupa não tem mão;
- **sem a elipse do forro no punho**: a parte de trás da manga não pode aparecer
  na frente da mão (foi a correção de 23/09 em onze roupas);
- o vão entre braço e tronco é transparente;
- nada de forro, avesso ou parte de trás — o que ficaria atrás do corpo não
  existe nesta camada.

**Lê nas duas silhuetas:** recorte solto, camada por cima (capa, manto, casaco
aberto), cintura marcada por cinto e não por corte. Peça colada que assume ombro
ou quadril não serve.

**Sem objeto na mão.** A mão é do corpo; um cajado ou uma espada empunhada não
tem onde cair.

### As cinco

| Roupa | O que é | O que tem de dizer |
|---|---|---|
| **Escriba** · comum | túnica de linho cru até o joelho, cinto de couro com um estojo de penas, mangas com manchas de tinta | quem escreve todo dia; simples e honesta |
| **Maratona** · incomum | roupa técnica de corredor de longa distância — top colado com recortes, bermuda de compressão, colete de hidratação, tênis de corrida, uma **medalha de chegada** no peito | não é a Corrida casual que já existe: é quem terminou a prova |
| **Ancião** · raro | manto longo e pesado cinza-azulado, bordas bordadas, um **colar de 12 contas** — uma por ciclo | tempo, não poder; o sábio que ficou |
| **Campeão** · épico | peitoral polido de campeão de torneio com louros gravados, capa curta vermelha e dourada, faixa de vencedor cruzada | quem venceu outras pessoas, em público |
| **Imperador** · lendário | traje imperial: manto púrpura-tíria com louros de ouro bordados, peitoral de ouro, faixa imperial, acabamentos pretos | **império, não realeza** — o Rei já veste arminho e o Soberano veste luz; o Imperador é peso e conquista |

### Pedido (uma roupa por vez)

```
Roupa de avatar 2D para jogo, vista de frente, PNG 500x500 com fundo
transparente. Desenhe a roupa como se já estivesse vestida no corpo anexo: mesma
escala, mesma altura de ombro e de cintura, mesmo enquadramento. Só a roupa —
sem corpo, sem cabeça, sem pele e sem mãos. O vão da gola, a boca das mangas e o
vão entre braço e tronco são transparentes. Nada de forro, avesso, parte de trás
nem a elipse do forro no punho. Nenhum objeto na mão. Recorte solto, que sirva
num corpo masculino e num feminino. Mesmo estilo das roupas anexas.

A roupa: [O QUE É, da tabela]. Ela tem de dizer: [O QUE TEM DE DIZER].
Raridade [RARIDADE]: [comum = simples · lendário = a peça mais trabalhada do jogo].
```

**Anexar junto** (em `public/assets/catalog/avatars/`): `body_masc_1.png`,
`body_fem_1.png` e duas roupas prontas de referência — `SKIN_T1_CACADOR.png` e
`SKIN_T1_NAUFRAGO.png`. No Imperador, anexe também `SKIN_T4_REI.png` e
`SKIN_T5_SOBERANO.png` com a instrução *"não pode parecer com estas"*.

**O trabalho da arte acaba no PNG.** Ajuste fino de encaixe (alguns pixels de
x, y e escala) é de quem integra, em `constants/avatarOffsets.ts`. Encaixe torto
não se resolve redesenhando.

---

## 2 · As 5 bordas

Em volta da foto do jogador, em todo lugar que mostra o avatar. **Na lista do
Mundo ela tem 48 pixels**: tudo que não ler nesse tamanho vira ruído.

| Medida | Valor |
|---|---|
| Tamanho | **500×500** (o GPT gera 1024×1024; reduzimos na integração) |
| Fundo | **transparente de verdade** |
| Centro | **círculo vazio e transparente de ~64% da largura** — é onde a foto aparece |
| Anel | só a faixa externa, **grosso**, poucos elementos grandes |
| Forma | redonda, simétrica, centralizada, nada encostando na borda do quadro |

### As cinco, com o banner que forma par com cada uma

| Par | Material e paleta | Peça do topo | O que tem de dizer |
|---|---|---|---|
| **Sereno** · incomum | pedra lisa verde-água e prata fosca | uma flor de lótus pequena sobre um anel de água parada | calma; o que se olha por dentro |
| **Alvorada** · raro | ouro rosé com degradê de laranja suave | um sol nascendo, meio disco com raios curtos | o começo do dia, antes de todo mundo |
| **Prisma** · raro | cristal transparente que refrata **cinco cores — as das cinco áreas**: `#3f70a4` `#3f8069` `#b28a35` `#b9684b` `#a6424f` | um cristal facetado com as cinco cores | as cinco áreas inteiras, todo dia |
| **Profeta** · épico | violeta profundo e prata, gravações de estrelas | uma gema em forma de olho | o passo acima do Oráculo, que já existe — mais escuro, mais raro |
| **Pedra da Lua** · lendário | pedra-da-lua: branco leitoso com reflexo azul, filigrana de prata | uma lua crescente de pedra-da-lua | a placa do ciclo SSS — **a mesma pedra** dela |

**Pedido (uma borda por vez):**

```
Moldura circular de avatar para jogo, vista de frente, renderização 3D premium,
fundo TRANSPARENTE. O centro é um círculo vazio e transparente que ocupa 64% da
largura — é onde fica a foto do jogador. O anel ocupa só a faixa externa e é
grosso o bastante para ser lido em 48 pixels: poucos elementos grandes, nada de
filigrana fina. Perfeitamente redonda, simétrica, centralizada, nada encostando
na borda do quadro. Sem texto e sem letras. Mesma família visual das molduras
anexas.

Material e paleta: [MATERIAL E PALETA]. No topo: [PEÇA DO TOPO].
Raridade [RARIDADE]: [incomum = discreta · lendário = a mais trabalhada do jogo].
```

**Anexar junto** (em `public/assets/catalog/interface/`): `borda_t4_celestial.png`
e `borda_aurora_i.webp` (família visual, espessura e o vão do centro). Na
**Pedra da Lua**, anexe também `public/assets/cycles/plate-sss.webp` — é a pedra da
placa SSS, e as duas têm de ser a mesma. No **Profeta**, anexe
`borda_t4_oraculo.png` com *"é o passo acima desta, não uma cópia"*.

Fundo branco em vez de transparente não é motivo para refazer: ele se remove na
integração. Refaça se o **vão do centro** sair pequeno, oval ou fora do centro.

---

## 3 · Os 5 banners

O banner é a **placa com o nome**, logo abaixo do apelido no perfil, a **52 pixels
de altura**. Todos os que existem trazem o nome escrito — o novo também traz.

| Medida | Valor |
|---|---|
| Formato | horizontal, **~6:1** (os atuais têm ~680×115) |
| Fundo | **transparente de verdade** |
| Texto | o nome **em caixa alta**, letra serifada gravada, **com os acentos certos**: `SERENO`, `ALVORADA`, `PRISMA`, `PROFETA`, `PEDRA DA LUA` |
| Leitura | o nome tem de ler a 52 px de altura |

**Pedido (um banner por vez, depois da borda do mesmo par):**

```
Placa horizontal de nome para perfil de jogo, formato 6:1, renderização 3D
premium, fundo TRANSPARENTE. No centro, o nome "[NOME]" em caixa alta, letra
serifada gravada, legível numa altura de 52 pixels — escreva exatamente
"[NOME]", com os acentos certos. Mesmo material, paleta e peça decorativa da
moldura anexa: os dois são um par. Mesma família visual das placas anexas.
```

**Anexar junto:** a borda do mesmo par, já pronta, e de referência
`banner_t4_celestial.png` e `banner_t3_mistico.png` (em
`public/assets/catalog/interface/`).

Confira a grafia antes de aceitar: letra trocada no nome não tem conserto depois.

---

## Entrega

Salve com estes nomes. Pode ser no Downloads.

| Peça | Arquivo |
|---|---|
| Escriba | `SKIN_T1_ESCRIBA.png` |
| Maratona | `SKIN_T2_MARATONA.png` |
| Ancião | `SKIN_T3_ANCIAO.png` |
| Campeão | `SKIN_T4_CAMPEAO.png` |
| Imperador | `SKIN_T5_IMPERADOR.png` |
| Sereno | `borda_t2_sereno.png` · `banner_t2_sereno.png` |
| Alvorada | `borda_t3_alvorada.png` · `banner_t3_alvorada.png` |
| Prisma | `borda_t3_prisma.png` · `banner_t3_prisma.png` |
| Profeta | `borda_t4_profeta.png` · `banner_t4_profeta.png` |
| Pedra da Lua | `borda_t5_pedra_da_lua.png` · `banner_t5_pedra_da_lua.png` |

## Integração — do nosso lado

- Roupas em `public/assets/catalog/avatars/`; bordas e banners em
  `public/assets/catalog/interface/`, normalizados para o tamanho de cada família.
- Cada item ganha o `imageUrl` em `constants/items.ts`, e a linha dele em
  `public.items` passa a `is_live_in_game = true`. É isso que liga a regra.
- Roupa: encaixe conferido nos oito corpos e acertado em
  `constants/avatarOffsets.ts` se precisar.
- Borda sobre uma foto, em 48 px e no tamanho do perfil; banner a 52 px.
