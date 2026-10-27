# Pedido de capas — 16 campanhas do Glyph

Uma imagem de fundo por campanha. Ela aparece em dois lugares do app:

- **atrás do card da loja**, um card pequeno e quase quadrado, cortado no centro, com um véu escuro por cima e o texto em branco;
- **no fundo da ficha da campanha**, uma placa vertical: a imagem fica no topo e vai escurecendo para baixo.

## Especificação

- **Formato:** vertical 4:5, 1080 × 1350 px, PNG ou JPG. Depois a gente reduz para WebP leve.
- **Composição:** o assunto no **terço de cima e no centro**. A parte de baixo pode ser simples ou escura, porque fica sob o texto. Não deixar nada importante nas bordas.
- **Sem texto, sem logo, sem marca d'água.** Pessoas só de costas, em silhueta ou sem rosto definido.
- **Estilo comum às 16:** pintura digital cinematográfica, cenários um pouco épicos e atemporais (o Glyph trata a vida como um império). Fundo escuro, luz quente pontual (dourado ou âmbar) e uma cor de destaque por campanha. Nada de foto de banco de imagem nem 3D brilhante de app genérico.
- **Nome do arquivo:** o indicado em cada item, por exemplo `sono-de-elite.png`.

## As 16

| Arquivo | Campanha | O que mostrar | Cor de destaque |
|---|---|---|---|
| `sono-de-elite` | Sono de Elite | Um quarto escuro ao anoitecer, cortina entreaberta e lua, cama arrumada; um celular apagado, longe, sobre uma mesa | azul-noite e âmbar |
| `detox-digital` | Detox Digital | Uma mão largando um celular numa caixa de madeira; ao fundo, uma janela com luz de fim de tarde | verde-água |
| `controle-de-impulsos` | Controle de Impulsos | Uma vitrine iluminada à noite e uma silhueta parada do lado de fora, mãos nos bolsos | carmesim e ouro |
| `presenca-real` | Presença Real | Duas xícaras numa mesa, duas pessoas de costas conversando; celulares virados para baixo | terracota quente |
| `mente-sem-armadilhas` | Mente sem Armadilhas | Um labirinto visto de cima com uma figura pequena encontrando a saída; linhas finas como um mapa | roxo e dourado |
| `expressao-criativa` | Expressão Criativa | Uma mesa de ateliê com papéis, tinta e um rascunho meio pronto sob uma lâmpada | laranja |
| `circulo-forte` | Círculo Forte | Uma fogueira à noite com várias silhuetas sentadas em roda | âmbar de fogo |
| `faxina-total` | Faxina Total | Um cômodo limpo e claro com a luz da manhã entrando; uma caixa de "doação" no canto | branco e verde claro |
| `estoicismo-aplicado` | Estoicismo Aplicado | Uma estátua de pedra clássica em ruínas, sob tempestade, firme | cinza-pedra e ouro |
| `despertar-de-ferro` | Despertar de Ferro | Um ginásio antigo de pedra; barra e anilhas de ferro sob um feixe de luz | vermelho-ferro |
| `financas-com-intencao` | Finanças com Intenção | Uma mesa de contador antigo com moedas organizadas em pilhas e um caderno aberto | verde-escuro e ouro |
| `maestria-financeira` | Maestria Financeira | Um cofre de pedra aberto com luz dourada saindo; escadaria subindo | ouro |
| `lideranca-sem-cargo` | Liderança sem Cargo | Uma silhueta segurando uma lanterna à frente de um grupo numa trilha escura | azul-aço e âmbar |
| `construcao-de-identidade` | Construção de Identidade | Um escultor (de costas) talhando a própria figura num bloco de mármore | mármore e violeta |
| `corpo-de-elite` | Corpo de Elite | Uma silhueta atlética subindo uma escadaria de pedra ao amanhecer | laranja-alvorada |
| `foco-blindado` | Foco Blindado | Uma sala de estudo fechada de pedra, uma única mesa com uma vela forte; fora, uma tempestade | azul-profundo e ouro |

## Depois que as imagens chegarem

Coloco cada uma em `public/assets/campanhas/` já em WebP, uns 80 KB cada, e aponto a capa da campanha para o arquivo. Enquanto a imagem não existir, o app mostra só o tom da campanha, sem quebrar nada.
