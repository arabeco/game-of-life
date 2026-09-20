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
| 4 | Borda | A maioria passa a ser **desbloqueável ou secreta**, não comprável. Exceção possível: as de patente. |
| 5 | Banner | Igual à borda. |
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
| Kits de peça | 6 | 2 (Pedras e Caminhos) |
| Temas de cor | 3 | 1 (Refúgio natural) |

Os seis kits saem sozinhos das cinco categorias que já existem no
, com a Luz partida em duas:

Pedras (3 peças) · Caminhos (3) · Água (3) · Plantas (4) · Lanternas (2) ·
Assinaturas (3, uma por coleção)

**O tema não é um kit.** Ele acende a versão colorida de toda peça que a pessoa
já tem — vale mais quanto mais ela já jogou.

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
