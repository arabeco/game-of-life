# Infos Boas para Produzir Rounds GLYPH

Este arquivo guarda aprendizados operacionais que ja foram validados na pratica.
Ele existe para acelerar a producao dos proximos rounds e evitar retrabalho visual.

## Ordem fixa do round

- 1. Mestria
- 2. Vitrine
- 3. Filosofia
- 4. Mentalidade

## Cores oficiais por formato

- Mestria = `Rubi`
- Vitrine = `Safira`
- Filosofia = `Marfim`
- Mentalidade = `Obsidiana`

Backgrounds oficiais:
- `marketing/background/rubiback.jpg`
- `marketing/background/darkblueback.jpg`
- `marketing/background/whiteback.jpg`
- `marketing/background/blackback.jpg`

## Regra de texto do miolo

- o texto dos slides centrais deve ser maior do que o padrao comum de Instagram
- pensar sempre em leitura no celular
- quando houver espaco livre, a caixa de texto cresce antes da fonte diminuir
- a maior fonte que couber com harmonia e margem e a resposta certa

## Regra do slide final

- todo carrossel fecha com GLYPH + `Organize seu imperio.`
- `glyph.life` e o CTA publico
- o watermark atras do GLYPH deve usar o nome da categoria:
- `Mestria`
- `Vitrine`
- `Filosofia`
- `Mentalidade`

## Mestria

- pasta antiga ainda pode continuar com nome `curadoria-*`, mas a categoria visual e editorial agora e `Mestria`
- usa 5 slides
- slide 1 e capa forte com retrato principal
- slide 2 contextualiza a figura
- slide 3 mostra ativos mais altos
- slide 4 mostra radar e nivel geral
- slide 5 fecha a marca

Regras visuais validadas:
- o nome da pessoa entra como watermark discreto nos slides 1, 2, 3 e 4
- o slide 5 nao usa o nome da pessoa como watermark; usa `Mestria`
- no slide 2, a imagem entra em modo `fit`, nao em `cover`
- no slide 2, a cabeca nunca pode ser cortada; preservar a figura inteira vale mais do que preencher toda a moldura
- o pill `Nivel de maestria` na capa deve ficar mais alto e um pouco mais a direita
- referencia pratica de capa boa: X `186`, Y `860`, Width `392`, Height `56`
- o pill nao pode ficar colado no texto de baixo nem muito jogado para a esquerda
- o texto dentro do pill precisa de padding interno e leve deslocamento para baixo para nao cortar acentos ou topo das letras
- a moldura da imagem da capa deve usar a proporcao visivel real do PNG
- cortar transparencia sobrando antes de decidir largura e altura da moldura
- se a imagem for mais fina, ela pode crescer mais em altura
- slide 3 deve ficar um pouco mais baixo para nao encostar na marca dagua superior
- o titulo do slide 3 precisa ter margem superior real; nunca pode rocar ou cortar no topo
- a imagem do slide 3 nao pode invadir o terceiro card
- o titulo dentro dos cards do slide 3 precisa de respiro interno maior; nao pode cortar na primeira linha
- slide 4 deve evitar texto empilhado no topo
- no slide 4, a marca dagua `Mestria` entra mais embaixo, no espaco livre sob o radar
- o rotulo superior do radar (`Consciencia`) precisa descer um pouco para nao cortar na borda

Regras de escolha automatica de imagens:
- usar as 2 imagens mais verticais nos slides 1 e 2
- usar a imagem menos comprida no slide 3
- se o usuario jogar as imagens na pasta `marketing/roundX` direto, o script deve tentar aceitar isso
- se o usuario usar `marketing/roundX/mestria`, preferir essa pasta

Regra de score:
- toda Mestria precisa fechar as 10 areas
- o total e soma ate `100`
- usar `marketing/banco-frases-radar.md` como base da leitura

## Vitrine

- usa 4 slides por padrao
- slide 1 e chamada central forte
- slide 2 fala sobre o app ou a feature
- slide 3 em diante mostram os prints reais
- nunca colocar print no slide 1 ou 2

Regras visuais validadas:
- os slots de celular precisam parecer parte do sistema, nao gambiarra
- os boxes de texto e print precisam ter margens replicaveis
- o texto dos slides 1 e 2 deve ser limpo, elegante e bem distribuido
- os prints entram so no bloco de prova

Regra de assets:
- se houver 1 print, usar composicao central forte
- se houver 2 prints, usar lado a lado
- se ainda nao houver print, o slide de prova pode sair em modo placeholder bonito para revisao
- se o usuario jogar os prints em `marketing/roundX` direto, o script deve tentar aceitar isso
- se existir `marketing/roundX/vitrine`, preferir essa pasta

Referencia de features:
- `marketing/vitrine-funcionalidades.md`

## Filosofia

- slide 1 = tese dura
- slide 2 = desenvolvimento da dor, erro ou confronto
- slide 3 = principio ou fechamento logico
- slide 4 = fecho GLYPH

Regras:
- mais espaco negativo
- pouco ruido visual
- texto dominante
- precisa soar como verdade dura, nao como frase de efeito vazia

## Mentalidade

- slide 1 = chamada forte
- slide 2 = primeira metade da logica
- slide 3 = segunda metade da logica
- slide 4 = fecho GLYPH

Regras:
- nao soar como dica comum de produtividade
- precisa parecer leitura de elite
- a referencia editorial e o territorio de livros como `177 Secrets of the World Class`
- a tese deve mostrar a diferenca entre gente comum e gente world class
- evitar autoajuda fofa e conselho generico

## Regra operacional de assets por round

Formato sugerido:
- `marketing/roundX/mestria`
- `marketing/roundX/vitrine`

Fallback aceito:
- `marketing/roundX`

Tipos esperados:
- Mestria: `3 imagens`
- Vitrine: `1 ou 2 prints`
- Filosofia: normalmente sem asset extra
- Mentalidade: normalmente sem asset extra

## Regra de velocidade

- primeiro gerar a estrutura dos 4
- depois lapidar visual fino
- quando uma decisao visual se provar melhor, salvar aqui e no template oficial
- toda melhoria que for repetivel vira padrao
