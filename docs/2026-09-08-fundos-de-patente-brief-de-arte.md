# Fundos de patente — brief de arte

**Estado: os dez existem no código e estão vazios.** Cada patente já tem um fundo
declarado, já aparece na escalada e no seletor, e já destranca sozinho quando a
pessoa sobe de degrau. O que falta é a imagem. Enquanto ela não existe, cada um
cai num gradiente sólido — nada quebra, nada some, nada dá erro.

---

## Como o buraco funciona

Cada fundo aponta para um arquivo no bucket que ainda não está lá:

```
user-images/background/<basename>.jpg
```

O app tenta `.jpg`, depois `.png`, depois `.jpeg`. Falhando os três, desenha o
gradiente da patente. Ou seja:

- **Subir uma imagem já liga aquele fundo.** Não precisa mexer em código, nem
  fazer deploy, nem subir versão do AAB.
- **Não é tudo ou nada.** Pode subir só o do Soberano hoje e os outros nove daqui
  a três meses. Os que faltam continuam em gradiente.
- **Trocar depois é só sobrescrever o arquivo.**

Onde isso está no código: `PROFILE_BACKGROUND_ASSETS` em
[utils/profileBackgrounds.ts](../utils/profileBackgrounds.ts), bloco "OS DEZ DA
ESCADA".

---

## Decisão que é sua antes de desenhar

Existem duas direções coerentes, e a tabela abaixo traz as duas.

**A — progressão de nobreza** (é o que os gradientes atuais fazem). A cor sobe
com o degrau: pedra fria embaixo, ouro e luz em cima. Lê como escada à primeira
vista. Não conversa com mais nada.

**B — casar com o tema de UI da mesma patente.** Cada uma das seis primeiras
patentes já entrega um tema de interface (`RANK_REWARDS` em
[constants/nobility.ts](../constants/nobility.ts)). Virar Cavaleiro dá o **tema
Aurora Boreal** — o fundo Aurora ao lado dele faz do degrau um conjunto, não dois
brindes soltos. O custo: Duque, Príncipe, Rei e Soberano **não têm tema nenhum**,
então esses quatro seriam invenção livre; e Barão já é "Ouro Soberano", o que
rouba o ouro de quem deveria ser o topo.

Eu iria de **B nas seis primeiras e livre nas quatro últimas**, porque o par
tema+fundo é a única coisa da escada que já existe pronta e ninguém vê. Mas a
colisão do ouro no Barão é real e é argumento pro A.

---

## Os dez

| # | Patente | Arquivo (basename) | Custo | Tema que a patente já dá | Gradiente atual (A) |
|---|---|---|---:|---|---|
| 1 | Vagante | `rank01vagante` | início | Gelo Eterno (FROST) | `#16181c → #2b2f36 → #4a5058` |
| 2 | Escudeiro | `rank02escudeiro` | 100 h | Cyberpunk (CYBER) | `#12161d → #2a3546 → #55697f` |
| 3 | Cavaleiro | `rank03cavaleiro` | 250 h | Aurora Boreal (AURORA) | `#0d141f → #23415f → #6d93b8` |
| 4 | Lorde | `rank04lorde` | 500 h | Chama Viva (EMBER) | `#0c1712 → #1d4433 → #5d9b78` |
| 5 | Barão | `rank05barao` | 1.000 h | Ouro Soberano (GOLD) | `#1a0b0f → #4a1622 → #9c4356` |
| 6 | Conde | `rank06conde` | 2.000 h | Vazio Primordial (VOID) | `#150b1e → #3b1c58 → #7d55a8` |
| 7 | Duque | `rank07duque` | 4.000 h | — | `#0b0f1c → #222c52 → #7a86ad` |
| 8 | Príncipe | `rank08principe` | 7.000 h | — | `#080d1e → #17265e → #8f9ed6` |
| 9 | Rei | `rank09rei` | 11.000 h | — | `#100b04 → #4a3410 → #d4af52` |
| 10 | Soberano | `rank10soberano` | 16.667 h | — | `#1a1408 → #7a5f1c → #f4e6b0` |

As horas saem da régua do jogo (~1 EXP por minuto executado) aplicada aos
limiares de `NOBILITY_RANKS`. São o número que a pessoa reconhece — a escalada na
tela fala em horas, não em XP.

---

## Especificação técnica

**Formato e tamanho.** JPG, **1200 × 1600** (3:4, retrato). Até ~400 KB cada; são
dez, e o app já carrega imagem demais. WebP funciona, mas o `.jpg` é a primeira
extensão que o app tenta — usando outra você paga uma requisição 404 por abertura.

**Enquadramento é o ponto de atenção.** A mesma imagem aparece em quatro recortes
diferentes:

| Onde | Recorte | Tamanho na tela | Peso |
|---|---|---|---|
| Cartão de perfil | 3:4 inteiro | 380 × 500 | é a arte inteira |
| **Escalada** — cartão do degrau | **~3.4:1, centro** | ~300 × 88 | é onde ela aparece maior e mais vezes |
| Escalada — cartão do topo | ~2.5:1, centro | ~340 × 136 | só a patente atual |
| Seletor de fundo | 16:9, centro | ~150 × 84 | miniatura de escolha |

Ou seja: **o que identifica o fundo tem que estar na faixa central horizontal**, e
a faixa é estreita — o cartão da escalada corta uma tira de proporção 3.4:1 do
meio da imagem. Uma composição com o assunto no topo ou no rodapé desaparece em
três dos quatro lugares.

E tem um detalhe do lado: na escalada o cartão escurece forte à **esquerda**
(onde ficam o nome da patente e as horas) e solta à **direita**. Então o peso
visual da imagem deve estar do **lado direito** da faixa central — é a única
parte que aparece limpa ali.

**O que NÃO pode ter:**

- **Texto de qualquer tipo.** Nome da patente, número, lema. O nome já é impresso
  por cima em todos os quatro lugares.
- **Rosto ou figura humana com peso.** O avatar da pessoa fica em cima disso.
- **Detalhe fino no terço superior.** É onde ficam nickname, patente e insígnia no
  cartão de perfil.
- **Contraste alto no meio.** Os widgets do perfil ficam ali. Textura sim, drama
  não — o fundo é fundo.

**O que ajuda:** vinheta escura nas bordas, valor médio-escuro no geral (o texto
por cima é branco), e a cor da patente concentrada num ponto em vez de espalhada.

---

## Onde cada um aparece hoje

1. **Seletor de fundo** (perfil e fundo de ativo) — na grade, no fim, com **coroa**
   em vez de cadeado quando ainda não é seu. Coroa e cadeado dizem coisas
   diferentes de propósito: coroa é degrau que se sobe, cadeado é compra.
2. **Escalada**, em Config → Geral → hierarquia
   ([components/NobilityLadder.tsx](../components/NobilityLadder.tsx)) — aqui a
   arte é o **fundo do próprio cartão** do degrau, não uma miniatura ao lado. É
   onde ela aparece maior e dez vezes seguidas, e é o que faz a tela parecer uma
   escada em vez de dez linhas de texto. Degrau que você ainda não alcançou fica
   dessaturado.
3. **Promoção** — o modal de subida de patente anuncia "Fundo Rei liberado" junto
   com os outros itens.

O acesso é **derivado da patente a cada leitura**, igual à própria patente é
derivada da EXP. Não há unlock gravado no perfil, não há item de catálogo, não há
migração — quem já está em Conde hoje já tem os seis primeiros, sem nada rodar.

---

## O que ficou de fora, e por quê

- **A escalada continua dentro de Config.** Melhorei a tela onde ela estava; tirar
  ela de lá é decisão de navegação, não de código.
- **O rebalanceamento foi feito**, e era menor do que parecia. Contar itens sugeria
  que o Vagante (6) entregava mais que o Rei (4) — mas o Vagante dá três skins
  tier 1 e o Rei dá o Crisol tier 4. Somando **tier**, e tirando a insígnia (todo
  degrau tem) e o tema (só existe até o Conde), a curva antiga era
  `4, 3, 4, 4, [2], 4, 5, 8, 12, 15`: já crescia, e o defeito era um só — o
  **Barão**, que custava 1.000 h e entregava um orbe tier 2, menos que o Lorde
  pela metade do preço.

  O conserto não inventou item: havia **nove peças já marcadas como exclusivas de
  patente** (logo, já fora da loja de ouro, já com arte pronta) que nenhum degrau
  entregava — sete cabelos cobrindo os tiers 1 a 5, uma borda e um banner tier 3.
  Era arte paga que ninguém ia ver. Distribuídas por tier, a curva virou
  `4, 4, 5, 6, 8, 8, 8, 11, 12, 20` — não decrescente do primeiro ao último, e
  ninguém perdeu nada.

## O outro buraco: quatro temas de UI

Os seis temas de interface acabam no **Conde**. Duque, Príncipe, Rei e Soberano —
os quatro degraus mais caros, de 4.000 a 16.667 horas — não ganham a categoria
mais visível do jogo, a que muda o app inteiro. Isso não é distribuição a
corrigir; é conteúdo a produzir, exatamente como os fundos.

Se você fizer esses quatro temas, o fundo da patente e o tema da patente passam a
sair juntos nos dez degraus, e a decisão A/B lá em cima deixa de existir: os dois
são o mesmo mundo visual, e a única pergunta vira qual mundo.

## O que mais ficou de fora

- **A escalada continua dentro de Config → Geral, atrás de um toggle.** A tela
  melhorou onde estava; tirar ela de lá é decisão de navegação, não de código.
- **Nenhum degrau paga ouro ou fragmento.** Seria o jeito mais direto de fazer os
  degraus caros pesarem, mas a promoção já encadeia três escritas no perfil e
  somar carteira ali é corrida de escrita esperando acontecer. Precisa de um
  caminho próprio, não de mais uma linha no mesmo efeito.
- **A insígnia da patente não tem arte nova.** As dez já existem e são as mesmas
  de antes; a escalada só passou a mostrá-las antes de conquistadas, em cinza.
