# Prompt: Background Final do Legado

## Objetivo
Gerar um background vertical para a cena do `Legado`, pensado para mobile, com composicao cinematografica e espaco real para a UI do app.

## Formato
- proporcao: `9:19.5`
- resolucao alvo: `1080 x 2340`
- orientacao: `vertical`

> Corrigido em 18/08/2026. Antes pedia `9:16` / `1080x1920`, e por isso as artes
> antigas nunca enquadraram. O palco do app e 390x844 (proporcao 0.462), nao
> 0.5625. Com `background-size: cover`, uma arte 9:16 e escalada pela altura e
> perde cerca de 18% da largura, 9% em cada lado - antes de qualquer zoom.
> Com o `backdropZoom` padrao de 1.1 a perda passa de 25%. Ou seja: um quarto
> da arte nunca chega na tela, e sempre pelas beiradas.

## Composicao obrigatoria
- cenario tipo santuario / sala ritual / altar de memoria
- fundo mais aberto e menos zoomado do que as referencias anteriores
- placa principal ja esta desenhada no app, entao a arte NAO deve desenhar outra placa detalhada no centro
- a area central superior deve ficar limpa o suficiente para receber uma grande placa acrilica dourada
- a metade inferior deve sobrar para timeline e cards de ciclo

## Distribuicao visual desejada
- topo 0% a 42%: area hero para a placa do legado
- faixa 42% a 56%: espaco de transicao/timeline, com atmosfera mais limpa
- base 56% a 100%: base cenica para cards de ciclo, sem excesso de objetos no centro

## Direcao de arte
- sala de pedra elegante e ritualistica
- colunas laterais suaves
- tochas ou fontes de luz douradas nas laterais
- altar/plataforma de pedra na base
- atmosfera azul fria no centro, como energia eterea ou memoria condensada
- dourado quente nas molduras e luzes
- contraste entre `azul acrilico frio` e `ouro ritual`

## O que precisa aparecer
- parede de pedra ou santuario ao fundo
- profundidade real, nao flat
- alguma atmosfera eterea azul no centro
- iluminacao lateral quente
- textura premium, seria, adulta

## O que NAO pode aparecer
- nenhuma placa central com simbolos/texto prontos
- nenhum personagem
- nenhum objeto grande no centro inferior que brigue com os cards
- nenhum excesso de zoom
- nenhuma tipografia
- nenhum HUD
- nenhum frame decorativo exagerado ocupando a tela toda

## Safe areas

Medidas do codigo, nao estimadas. Palco de 390x844, placa com `marginTop 102`
e `plaqueOffsetY 120`, largura base 312 com `plaqueZoom 0.98`, botao em
`bottom-5`. Ver `utils/legacyLayoutLab.ts` e `components/LegacyProjectionModal.tsx`.

Tela anterior a cena (o que se ve antes de gerar):

- `x: 11% -> 89% / y: 26% -> 48%` - placa do legado, area mais protegida
- `x: 18% -> 82% / y: 90% -> 98%` - botao de gerar a cena
- `y: 0% -> 26%` - respiro acima da placa, aguenta arquitetura e luz
- `y: 48% -> 90%` - vazio hoje, e onde a composicao pode trabalhar

Cuidado com as bordas laterais: sao elas que o `cover` corta primeiro.
Nada essencial nos 12% de cada lado.

Detalhes fortes podem viver no topo e na base central.

## Mood
- serio
- premium
- memorial
- mistico sem ficar infantil
- tecnologico-ritual, nao fantasia generica

## Prompt base sugerido
"Vertical mobile background for a premium memory shrine, elegant stone sanctuary with subtle columns, warm torchlight on the sides, a broad ceremonial altar at the bottom, cool translucent blue energy in the upper center, high-end cinematic atmosphere, realistic materials, restrained composition, central safe area left clean for UI overlay, lower safe area left clean for timeline cards, gold accents, blue ethereal light, ritual-tech mood, adult premium aesthetic, no text, no characters, no central object blocking the composition, less zoomed-out composition, strong depth, soft haze, sophisticated lighting."

## Negative prompt sugerido
"text, letters, symbols in the center, characters, creatures, oversized central object, close-up composition, cluttered foreground, excessive fantasy ornaments, childish style, HUD, interface, logo, watermark, low detail, blurry main structure, noisy composition"

## Observacao
A placa principal do legado e os cards de ciclo ja existem no app. O background so precisa servir como palco e profundidade.
