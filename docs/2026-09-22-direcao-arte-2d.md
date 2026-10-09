# Direção e execução de arte 2D — Glyph

## Pedido para a próxima conversa

Execute a produção das artes 2D deste documento no projeto `C:\Users\Afonso\Downloads\GOL1.006`. O usuário autorizou começar pelo jardim 3D na conversa anterior; essa etapa já tem uma entrega local separada. Agora este documento orienta exclusivamente as imagens 2D. Ao receber a instrução do usuário para executá-lo, produza arquivos reais, confira o encaixe no app e registre o que foi entregue. Não entregue apenas prompts ou um plano.

Leia também `docs/2026-09-20-handoff-de-arte.md`. Use esse handoff para os nomes finais e significado das recompensas, mas confira o código atual: o documento contém contagens antigas e trechos contraditórios. Não refaça trabalho que já tenha sido concluído em outra conversa.

**Não alterar:** jardim 3D, banco, regras de desbloqueio, preços, raridades, recompensas, temporadas completas ou artes já aprovadas. Sem push, publicação ou AAB nesta etapa. Alterações pontuais de referências de imagem e offsets são parte da integração visual; não redesenhar o app.

## Primeira inspeção

1. Confirme o checkout e leia as instruções locais. Veja `git status` e preserve alterações de outras tarefas.
2. Execute `npm run arte:pendente`. Esse comando não cobre os sete fundos de grupo nem todos os itens sem arquivo.
3. Leia `constants/items.ts`, `constants/avatarOffsets.ts` e as referências de imagem dos componentes de avatar antes de inventar caminhos.
4. Abra visualmente os arquivos abaixo. Não deduza estilo, pose ou escala somente pelo nome.

Referências relativas à raiz do projeto:

- Corpos: `public/assets/catalog/avatars/body_masc_1.png` e `body_fem_1.png`; validar também os tons 2, 3 e 4.
- Roupa: `public/assets/catalog/avatars/SKIN_T1_CACADOR.png` e `SKIN_T1_NAUFRAGO.png`.
- Cabelo: `public/assets/catalog/avatars/hair/CABELO_T1_MEDIO_RETO_cast.png` e outros cortes prontos da mesma pasta.
- Wallpaper: `public/assets/catalog/avatars/glyphs/PLACA_PEDRA.png`, `PLACA_ROXA.png` e `PLACA_MADEIRA.png`.
- Borda: localizar uma borda pronta equivalente pelo catálogo e observar seu recorte real antes de desenhar a Soberano.
- Grupo: abrir os sete arquivos de `public/clan-backgrounds/` e o componente que os exibe. As paisagens emprestadas são referência de enquadramento, não obrigação de copiar a mesma paisagem.

## Direção visual comum

A identidade vem das referências aprovadas do projeto: reproduza seu acabamento, contorno, iluminação, proporção e nível de detalhe. O tema é fantasia de progressão pessoal com materiais legíveis e formas cuidadas. Não trocar por outro estilo de personagem, fotografia, vetor genérico, emoji ou desenho infantil.

A leitura em tamanho pequeno manda. Primeiro silhueta e massas de cor; depois costuras, gravuras e ornamentos. Detalhes que só aparecem ampliados não justificam ruído. Evitar excesso de dourado e brilho nas peças iniciais: a evolução precisa ter espaço para crescer.

Uma raridade maior não significa simplesmente mais partículas. A progressão aparece em material, corte, volume e presença. Peças comuns também precisam parecer acabadas.

## Ordem de produção

1. Soberano: roupa principal. Resolver linguagem e encaixe sem usar sua grandiosidade como padrão das peças comuns.
2. Escudeiro até Rei, em ordem crescente para conferir a progressão.
3. Pijama, Corrida, Chuva e Verão.
4. Quatro penteados, cada qual nas três cores especificadas.
5. Sete fundos de grupo, conferidos juntos como uma progressão.
6. Quatro wallpapers novos.
7. Empreendedor e Borda Soberano, verificando primeiro se ainda faltam.

Trabalhe em lotes pequenos, conclua a validação e salve o progresso por lote. Não peça confirmação a cada arquivo: corrija defeitos visíveis e avance dentro do escopo. Se houver um impedimento real de ferramenta, registre-o sem substituir imagem por placeholder.

## Roupa: camada utilizável, não retrato completo

Entrega: **PNG 500 × 500, alpha real**, uma roupa por item para os oito corpos. O quadro é exatamente o mesmo das bases. Não recortar a roupa até sua caixa delimitadora e depois esticá-la para 500 × 500.

O arquivo final contém somente a roupa e seus acessórios vestíveis. Não incorporar cabeça, pele, mãos, corpo de referência, cabelo, cenário, moldura ou sombra no chão. Nas aberturas, aparece o corpo real por baixo. Ombros e cintura precisam coincidir com as duas silhuetas. Não cobrir o rosto com capuz, brilho ou ornamento. Não desenhar uma pose nova.

| Peça | Direção |
|---|---|
| Escudeiro | Gibão de couro, cinto largo, uma ombreira; simples e funcional. |
| Cavaleiro | Primeiro peitoral metálico, manto curto; armadura legível sem virar um tanque. |
| Lorde | Casaco longo, gola alta, sem metal; autoridade civil. |
| Barão | Sobretudo, pele no colarinho, riqueza discreta; anel apenas se puder encaixar sem pintar uma mão. |
| Conde | Veste de corte, bordado dourado no peito, elegância de alfaiataria. |
| Duque | Capa pesada até o chão e fecho no ombro; volume, sem esconder toda a silhueta. |
| Príncipe | Traje claro, faixa diagonal e ouro controlado; contraste com os anteriores. |
| Rei | Manto de arminho e corrente de ombro a ombro; ápice da realeza humana. |
| Soberano | Camadas luminosas estruturadas em marfim e ouro pálido, núcleo de luz contida, formas quase cerimoniais. Tem de parecer além de um rei, mantendo o corpo legível. Nada de bola branca estourada, aura solta ou personagem inteiro. |
| Pijama | Camiseta folgada e calça larga; confortável e distinta das camisetas atuais. |
| Corrida | Regata, shorts e tênis; visual esportivo leve. |
| Chuva | Capa longa e capuz compatível com o rosto/cabelo existente; volume e tecido impermeável. |
| Verão | Roupa leve, ombros livres e tecido solto; aberturas transparentes revelam a pele da base. |
| Empreendedor | Casaco ou blazer contemporâneo aberto, roupa limpa e bem construída; evitar dinheiro, logotipos, texto ou objetos que exijam mudar a pose. |

Os nomes finais das 13 roupas com placeholder estão no handoff, seção “Os arquivos, com o nome final”. Empreendedor: localizar o ID e o resolver atuais; se continuar sem caminho, criar um nome consistente e atualizar somente a referência visual desse item.

## Cabelo

Entrega: **12 PNGs 500 × 500 transparentes**. Quatro cortes × três cores. O trecho antigo que fala em 26 recolorações não define esta entrega. As variantes são arquivos individuais; confira como o seletor atual as carrega.

- Rabo de Cavalo: preso alto, franja solta; castanho, preto, branco.
- Coque Solto: preso no alto, fios caindo; castanho, preto, branco.
- Undercut: laterais raspadas, volume superior; castanho, preto, branco. Não pintar couro cabeludo ou pele na camada.
- Trança Lateral: longa sobre um ombro, sem estética de princesa; castanho, branco, rosa.

Preserve exatamente a geometria do mesmo corte entre cores; edite a cor da versão base em vez de gerar três cortes diferentes. Branco precisa de sombras para ler sobre pele clara; preto precisa de volume para não virar mancha.

Use os nomes completos do handoff, incluindo o prefixo em cada variante. Ajuste o encaixe por `tools/avatar-align.html` e registre os offsets em `constants/avatarOffsets.ts` quando necessário. Não mover o corpo globalmente para acomodar um cabelo.

## Sete fundos de grupo

Entrega: **WEBP 1599 × 900**, sem transparência. Substituir apenas os placeholders identificados em `public/clan-backgrounds/{feudo,bastiao,provincia,principado,reino,dinastia,imperio}.webp`.

Composição de tela: centro calmo, contraste moderado atrás de texto, informação nas bordas e profundidade ao fundo. Conferir o recorte em celular e desktop no componente real. Não escrever títulos, números, brasões com letras ou interface dentro da imagem.

- Feudo: madeira, cerca, abrigo e pequeno fogo; começo acolhedor, escala modesta.
- Bastião: muro de pedra e torre baixa; primeira fortificação.
- Província: campo, estrada, telhados; território habitado além de um único prédio.
- Principado: pátio de corte, salão ao fundo, estandartes sem texto; cerimônia.
- Reino: castelo completo e cidade; escala consolidada.
- Dinastia: galerias, brasões sem letras, arquivo e arquitetura de épocas sucessivas; passagem de gerações.
- Império: arquitetura em primeiro plano e vista de porto, mar e terras distantes; alcance que ultrapassa o quadro.

Manter uma família de luz e acabamento; aumentar a escala e a história contada, não só a saturação. Nenhum desses fundos é uma ilustração para o jardim 3D.

## Quatro wallpapers de perfil

Entrega: **PNG 512 × 512**, fundo cheio. Usar as PLACA existentes como régua de acabamento. O avatar é o protagonista; o centro precisa ser calmo.

Direções propostas para preencher o meio da coleção sem duplicar madeira, pedra, prata, roxo, ouro e gelo:

1. Linho mineral: tecido cru, fibras delicadas, bordas discretas.
2. Ardósia azul: mineral fosco, fissuras finas nas laterais.
3. Jardim de jade: superfície verde profunda com motivos botânicos de baixo contraste nas bordas; é wallpaper 2D, não item do jardim.
4. Cobre envelhecido: cobre escurecido com pátina pontual, sem brilho de ouro lendário.

Esses nomes são direção artística, não decisão de raridade/preço. Se ainda não existem itens correspondentes, salvar candidatos em `art-delivery/2d/wallpapers/` e registrar os caminhos. Não substituir wallpapers aprovados, criar desbloqueios nem declarar os candidatos disponíveis no app.

## Borda Soberano

É a única borda nova autorizada por esta lista. Localize o item atual e o formato real das bordas já prontas. Produza uma moldura com centro transparente, material e luz contida compatíveis com a roupa Soberano. Deve funcionar também sobre outras roupas; não incluir personagem nem wallpaper. Não gerar novas bordas ou banners para os demais degraus.

## Como gerar e finalizar

Use a skill e a ferramenta de geração de imagens disponíveis na nova conversa. Um modelo de conversa menor ainda precisa ter essa ferramenta para produzir os bitmaps. Não simular arte raster com SVG, CSS, emojis ou formas programadas.

Forneça ao gerador as imagens reais de referência, rotuladas por função: corpo = encaixe; roupa pronta = acabamento; item atual = alvo de substituição quando for placeholder. Para variantes, use a imagem-base do próprio corte/peça. Não confiar apenas em descrição textual para manter alinhamento.

Modelo de briefing para cada roupa:

> Crie somente a camada vestível de [PEÇA], seguindo [DIREÇÃO]. Use os corpos anexados exclusivamente como guia de pose, proporção e encaixe e a roupa pronta como referência de acabamento. Preserve o enquadramento completo. Resultado sem corpo, pele, cabeça, cabelo, texto, fundo ou sombra externa, com transparência real. Deve encaixar sobre ambas as bases no mesmo canvas. [ACENTOS/MATERIAIS DA PEÇA].

Adapte o briefing ao que foi observado, não copie exigências incompatíveis com a referência. Se a ferramenta não entregar o tamanho exato, exportar depois para a dimensão final preservando quadro e alpha; simples redução não corrige uma pose errada. Seguir as regras da ferramenta para edição de imagem e finalização. Não usar remoção grosseira de fundo que destrua bordas ou tons claros.

Guardar candidatos e originais em `art-delivery/2d/`, separados dos arquivos finais consumidos pelo app. Substituir somente placeholders confirmados ou os arquivos explicitamente previstos neste documento. Não apagar candidatos aprovados para economizar espaço.

## Critérios de conclusão por lote

- Abrir cada imagem gerada: sem deformações, pedaços de corpo, texto inventado, cortes ou halo de fundo.
- Conferir dimensões, formato e alpha com ferramenta de imagem.
- Roupa/cabelo: compor sobre os oito corpos em uma folha de revisão, ver a 500 × 500 e em tamanho de avatar. A composição de QA não substitui a camada final transparente.
- Fundos: testar texto/avatar por cima e recortes reais; revisar a progressão dos sete lado a lado.
- Confirmar que os caminhos finais são locais ao projeto e que o app carrega esses arquivos.
- Executar `npm run arte:pendente` novamente; a contagem sozinha não prova qualidade.
- Se mudou offsets ou referências, executar os testes pertinentes e o build; relatar falhas preexistentes separadamente.
- Criar `docs/2026-09-22-entrega-arte-2d.md` com peça, caminho, status, referências, dimensões, peso, encaixe e pendências. Atualizar esse registro a cada lote.
- A entrega deve mostrar prévias e dizer claramente quais arquivos estão integrados e quais são candidatos sem item. Não declarar todo o handoff concluído com arquivos faltando.

Contagem de planejamento: 14 roupas + 12 arquivos de cabelo + 7 fundos + 4 wallpapers + 1 borda = **38 imagens finais**, se nada disso tiver sido concluído desde o handoff. São 36 na tabela antiga mais Empreendedor e Borda Soberano. Temporadas futuras não entram nesta produção.
