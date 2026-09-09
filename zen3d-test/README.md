# Quatro bases e acabamentos medievais

No teste, abra **Bases**. Escolha Pátio do silêncio (livre), Espelho do bosque (lago), Margens do refúgio (riacho e ponte) ou Caminho antigo. Feche a gaveta escolhendo Desenhar, Alisar ou Câmera.

Os acabamentos **Rústico**, **Nobre** e **Ornamental** variam bordas de pedra, metais das lanternas, flores e cor da folhagem. São demonstrações visuais sem preço, compra, raridade ou desbloqueio. As definições separadas em `gardenTemplates.ts` permitem evoluir a apresentação no futuro sem misturar economia à cena.

A areia é preservada ao trocar de base; traços cobertos por uma composição reaparecem ao retornar. Artefatos têm uma exposição separada por base, mantida somente na sessão. O acabamento é uma escolha visual compartilhada. Recarregar descarta o estado.

O riacho é um único campo contínuo, não dois módulos duplicados. A ponte atravessa esse campo, com caminhos chegando às extremidades em terra. Base, água e caminhos são fixos. Pedestal do Legado e artes dos artefatos foram preservados.

Esta é uma primeira aproximação medieval mais detalhada: folhagem menor em camadas, grão procedural nos materiais, cantaria e lanternas de madeira/metal. Não equivale ao realismo da referência fornecida. Continua sendo uma cena leve, local e sem casas ou personagens.

Arquivos principais: `gardenTemplates.ts`, `GardenBorder.tsx`, `model.ts`, `procedural.ts`, `WaterGarden.tsx`, `SandExperiment.tsx` e CSS isolado. Verificados os quatro modelos/três acabamentos em regressão, centro livre, entrada e travessia completa da ponte; no navegador, troca de bases/acabamentos, preservação de artefatos e primeira pessoa. Revisão em 390 × 844 sem transbordamento horizontal ou erros de console. Uma amostra do lago apresentou 31 draw calls e cerca de 28 mil triângulos; isso não é medição de FPS em celular físico.

---

# Teste atual — areia e gesto

Abra **http://localhost:3018/zen3d-test/** (`npm run dev:zen3d`). A entrada agora usa `SandExperiment.tsx`; o editor anterior permanece nos arquivos, sem ser carregado por esta experiência.

- **Desenhar**: arraste um dedo ou o mouse. O ancinho segue com atraso suave proposital, arredondando mudanças de direção como no 2D; ao soltar, não força uma reta até o dedo. Abra **Garfo e areia**: Fino (3), Clássico (4), Campo (6), Zen (5) e Profundo (5), como no 2D. Distâncias Junto/Médio/Aberto/Grande e pressões Fraca/Média/Forte.
- **Cores**: Dourada, Branca e Basalto; trocar a cor preserva o desenho e seu relevo.
- **Alisar**: apague uma região com borda suave.
- **Desfazer**: recupera o estado anterior ao último gesto ou à limpeza completa. Histórico limitado a uma etapa.
- **Limpar → Alisar tudo**: recomeça; também pode ser desfeito.
- **Câmera**: arraste e use os controles de zoom; dois dedos aproximam/giram. Nenhum desenho é criado nesse modo.
- **Entrar**: primeira pessoa, joystick ou WASD/setas; arraste para olhar. Voltar preserva a areia.

Área ampla, uma árvore, pedras e uma lanterna nas bordas. Objetos fixos neste teste. A aba Bases oferece quatro composições locais e três acabamentos. A placa do Legado ocupa um canto sobre pedestal, com volume de pedra e frente derivada do componente original; tocar permite inspecionar. Os dados são fictícios. Nenhuma integração com o aplicativo, Jardim 2D, Legado, Ciclo ou Supabase. Recarregar descarta o desenho.

## Implementação e verificação

`SandSurface.tsx`: dois CanvasTextures de 512 × 1024 para cor e relevo aparente por bump mapping, atualização gráfica somente após alterações, interpolação dos gestos, interrupção junto aos objetos e uma cópia de desfazer. A malha não é deformada e o desenho não aumenta o número de objetos ou triângulos. Texturas têm tamanho fixo e são descartadas ao desmontar.

`sandSmoothing.ts`: suavização baseada no `GardenZenModal.tsx` da versão Glyph1.002: acompanhamento de 0,085 por quadro para o garfo (0,34 ao alisar), normalizado por tempo, com emissão após 5,2 pixels de tela (4,4 ao alisar). Os pontos filtrados são unidos por curvas para arredondar as quinas; inversões exatas recebem um pequeno laço local. Sem limite de giro ou raio imposto ao movimento. A cauda termina no traço suavizado, sem saltar até a posição bruta do dedo.

`sandOptions.ts`: definições locais derivadas de `components/GardenZenModal.tsx`, sem importar o runtime do aplicativo. Garfos diferem em número, largura, distância e intensidade dos sulcos.

`SandExperiment.tsx`: cena e controles focados na areia. `GardenControls.tsx`: navegação da câmera pode ser desabilitada durante desenho. `GardenObjects.tsx`: cenário pode omitir os padrões antigos. `main.tsx`: entrada do teste. `zen3d.css`: ferramentas verticais.

Verificado com TypeScript e build standalone. No navegador: desenho, alisamento localizado, desfazer, limpeza completa reversível, separação do gesto de câmera e ida/volta da primeira pessoa. Sem erros de console nos testes. O aviso de tamanho do pacote Three.js permanece no build. A sensação do toque, curvas livres e fluidez em celular físico ainda exigem avaliação; não foram medidas taxas de quadros em aparelho.

---

## Histórico — direção anterior em pausa

# Atualização 03 — jardim por modelos

Acesse http://localhost:3018/zen3d-test/ com `npm run dev:zen3d` em execução.

Esta versão evolui apenas o protótipo isolado. O Jardim 2D, o aplicativo principal e o experimento Mundo não foram alterados por esta atualização.

## Como experimentar

- Abra **Meu jardim → Modelos**: Espelho de calma (lago), Entre margens (riacho e ponte de madeira) ou Pátio sereno (areia).
- **Cores** oferece Verde sereno, Outono e Flores rosadas para a folhagem. Pinheiros conservam uma linguagem perene na paleta rosada.
- Em **Decorar**, escolha Pedras, Plantas ou Luz. Toque no terreno, gire ou varie e confirme em Posicionar.
- Toque na decoração para mover, repetir ou remover. Árvores podem trocar entre bordo, pinheiro e bambuzal no mesmo lugar. A última remoção pode ser desfeita.
- Água, caminhos e ponte pertencem ao modelo. Não são removíveis; novas peças não podem ocupar a água ou a ponte.
- **Entrar** ativa primeira pessoa com joystick e gesto para olhar; no computador, WASD/setas. A ponte tem passagem própria e a altura dos olhos acompanha seu arco.
- As edições de cada modelo ficam em memória ao alternar entre eles. Recarregar descarta tudo. Sem banco, autenticação, Supabase ou salvamento.

Arquivos desta atualização: `model.ts` (modelos, paletas e travessia), `procedural.ts` (ponte e folhagem), `GardenObjects.tsx` (instâncias por paleta), `GardenControls.tsx` (travessia), `ZenGardenPrototype.tsx` e `zen3d.css` (edição), além da regressão em `tests/zen3d.regression.mjs`.

Verificação: TypeScript, build separado e regressões geométricas; navegador em retrato 390 × 844 para modelos, paleta, adicionar, trocar árvore, remover/desfazer e entrar. Travessia da ponte e bloqueio da água verificados por testes de lógica. O conforto da travessia e o desempenho em celular físico ainda precisam ser avaliados. A dependência gráfica emite um aviso de depreciação de THREE.Clock; não houve erro de execução nos fluxos verificados.

---

## Histórico da versão anterior

# Jardim Zen 3D — V2 vertical

Evolução do protótipo isolado. Não importa nem altera o aplicativo, Jardim Zen 2D, rotas existentes, autenticação, Supabase ou serviços. Nenhuma dependência nova foi necessária nesta V2. A entrada e o build continuam separados. Nada é salvo; recarregar restaura a composição inicial.

## Abrir

```sh
npm run dev:zen3d
```

Abra `/zen3d-test/` na porta informada pelo Vite (padrão 3017; na sessão de desenvolvimento atual, 3018). Para celular na mesma rede, use o endereço Network do Vite. A criação funciona em HTTP local; não depende de APIs exclusivas de HTTPS.

## Experiência vertical

O CSS base é portrait. O jardim é alongado, ocupa uma cena de tela inteira e usa câmera ortográfica inclinada na construção. O desktop recebe uma adaptação posterior. A gaveta começa recolhida; abra pelo botão Elementos ou pelo gesto no puxador. Ao escolher uma peça, a gaveta fecha para liberar a paisagem.

1. Abra **Elementos** e escolha **Pedras, Caminhos, Água, Plantas ou Luz**.
2. Escolha uma peça e toque no jardim para posicionar a prévia. Use **Girar** (45°), **Variar** (seis opções determinísticas) e **Posicionar**.
3. Toque em um objeto para mover, girar, variar, repetir ou remover. Repetir abre uma nova prévia; Mover preserva o original se a operação for cancelada.
4. Arraste a paisagem para deslocar a vista. Dois dedos aproximam/giram. Há controles de zoom, giro e centralização com áreas confortáveis de toque.
5. **Entrar** muda para primeira pessoa: joystick à esquerda e arraste sobre a paisagem para olhar. WASD/setas também funcionam. **Construir** retorna sem perder a composição na memória.

A câmera de exploração usa olhos a 1,58 m e caminhada a 1,65 m/s. Pedras avulsas baixas e caminhos são transitáveis. Rochas grandes, árvores, bambu, lanternas e água têm colisões simples; a entrada é escolhida em local livre. Se não houver espaço, a entrada é recusada com explicação. A posição de exploração é preservada em mudanças de tamanho da tela.

## Construção híbrida

- Pedras: pedra avulsa, rocha musgosa, conjunto de cinco pedras.
- Caminhos: trecho reto, curva e passos irregulares, cada um composto por sete peças.
- Água: lago orgânico, riacho reto e curva de riacho.
- Plantas: bordo japonês, pinheiro e bambuzal.
- Luz: lanterna de pedra.

Todos os 13 tipos são procedurais e têm seis variações. Nenhum modelo, textura ou fonte vem da rede; a textura de areia também é gerada em memória. Os módulos são editados como uma unidade; pedras avulsas podem complementar qualquer composição. É permitido sobrepor objetos intencionalmente, respeitando as bordas e evitando duplicatas exatas.

Pontas próximas de módulos da mesma família recebem uma atração leve, desligável em Ajuda. A água sobreposta é convertida em uma única superfície e margem; as emendas não conservam fileiras de pedras atravessando o rio. Não há simulação hidráulica, desníveis de água ou sistema de pontes. Caminhos colocados sobre água não se tornam pontes. A areia mantém padrões zen fixos, sem desenho livre nesta etapa.

## Arte e performance

Galhos e raízes visíveis, copas irregulares, rochas deformadas com musgo e cores por vértice, água com transição de profundidade e pequenos brilhos, vegetação de borda e iluminação quente sobre ambiente verde. Sem voxels, modelos comprados, pós-processamento ou reflexos em tempo real.

- Limite: 96 objetos compostos. Uma peça modular pode conter várias pedras.
- Geometria compartilhada por tipo/variação, com instâncias para repetições; materiais compartilhados.
- Renderização sob demanda. Nenhum loop de água/folhas fica consumindo quadros quando parado.
- Sombras estáticas recalculadas ao editar a cena ou a qualidade; caminhar/mover câmera reutiliza o mapa. Peças muito baixas não projetam sombras próprias.
- Colisões pré-calculadas após edição, sem reconstruir volumes a cada quadro.
- Superfície e margem de água calculadas só quando os módulos de água mudam.
- Leve: DPR 1, sombras 1024. Suave: DPR até 1,5, sombras 1536. Uma única luz com sombras.
- Identidade futura: `GardenLayout { version: 2, objects: [{ id, type, position, rotation, variant }] }`. A variante reproduz a mesma arte; nenhum objeto Three.js é persistido.

## Arquivos

- `zen3d-test/index.html`, `main.tsx`, `tsconfig.json`: entrada e verificação isoladas.
- `views/zen3d/ZenGardenPrototype.tsx`: estado, edição, gaveta, categorias, prévias e confirmação.
- `views/zen3d/zen3d.css`: interface com portrait como base.
- `views/zen3d/GardenControls.tsx`: câmera ortográfica, pan/pinça, exploração e joystick.
- `views/zen3d/model.ts`: tipos, módulos, variantes, limites, encaixe e colisões.
- `views/zen3d/procedural.ts`: geração e cache das geometrias e cores.
- `views/zen3d/GardenObjects.tsx`: instâncias, areia, vegetação, sombras estáticas e diagnóstico de renderização.
- `views/zen3d/WaterGarden.tsx`: união das superfícies de água, margem, pedras de borda e material.
- `views/zen3d/CatalogPreview.tsx`: miniaturas vetoriais locais.
- `views/zen3d/stressScene.ts`: composição determinística de carga, somente em desenvolvimento.
- `tests/zen3d.regression.mjs`: regressões espaciais, variantes e orçamento de geometria.
- `vite.zen3d.config.ts`: build/dev exclusivo, preservado.

## Verificação local

```sh
npm run type-check:zen3d
node tests/zen3d.regression.mjs
npm run build:zen3d
```

Build em `dist/zen3d-test/`. O build principal continua independente e pode limpar `dist`; se precisar de ambos, rode o build principal antes do experimental. Nenhuma configuração de produção foi modificada e nada foi publicado.

Em 2026-09-06: checagem estrita passou; 249 checks passaram. Maior variante: 5.424 triângulos. Inspeção visual em 390 × 844, 320 × 740 e adaptação desktop. Testados no navegador: abrir gaveta, trocar categorias, prévia, giro, variação, confirmação de caminho, criação e emenda de riacho, movimentação de módulo e exploração. No build final: pedra avulsa 14 → 15, repetição 15 → 16, remoção 16 → 15 e manutenção de 15 ao alternar exploração/construção.

Ensaio com 96 objetos em desenvolvimento (`/zen3d-test/?stress=1`): 66 chamadas de desenho, aproximadamente 192 mil triângulos e 66 geometrias registradas durante movimento da câmera, após gerar as sombras. A primeira renderização/edição também paga o custo do mapa de sombras. Os contadores ficam em atributos `data-*` do canvas para inspeção. A cena de stress não é ativada no build de produção.

Esses números são do navegador local, não medição de FPS, bateria, aquecimento ou multitouch em aparelho físico. A prova final de conforto/performance em Android/iPhone permanece pendente.


## Placa do Legado em pedra

`LegacyStone.tsx` cria a pedra chanfrada, pedestal, textura local e flutuação discreta. A frente é gerada a partir do JSX atual de `components/LegacyGrandPlaque.tsx` por `node zen3d-test/build-legacy-face.mjs`; o script lê o original, mas não o altera. `public/legacy/legacy-face.svg` e `.html` guardam o resultado local. Avatar e métricas são demonstrações, sem autenticação ou dados de conta. A textura é rasterizada localmente no navegador; não há download externo. Movimento reduzido/página oculta interrompem a flutuação. O pedestal bloqueia desenho e caminhada.

A frente na cena e a inspeção ao toque foram verificadas no navegador local. Performance e compatibilidade com o WebView Android ainda precisam ser avaliadas no aparelho.

A frente da placa usa rasterização de até 2048 × 600, anisotropia limitada a 8 e tipografia ampliada apenas no snapshot do protótipo. Exploração usa DPR até 1,5; construção continua em 1. A dimensão física da pedra permanece igual.


## Artefatos sobre suportes

Em **Artefatos → Escolher artefato**, há 20 artes existentes do catálogo local, disponíveis apenas como demonstração. Escolha, toque numa área livre e confirme **Posicionar**. Toque na placa para **Girar**, **Mover** ou **Remover**. **Cancelar** descarta a movimentação pendente. Entrar em primeira pessoa preserva as peças confirmadas. O desenho permanece ao editar; a área ocupada bloqueia novos sulcos e caminhada.

Limite de oito exposições. As artes são cópias de até 512 px em `public/artifacts/`, com cerca de 1,1 MB no total; os originais não foram alterados. `artifactCatalog.ts` guarda a seleção local e `ArtifactStands.tsx` monta a arte frontal sobre moldura inclinada e suporte de pedra. Texturas da cena carregam por peça e são descartadas ao remover. Não consulta inventário, posse, economia ou Supabase; recarregar descarta a exposição.

## Amostra medieval e terraço pessoal — 7 setembro
- Sanctuary.tsx: três fundos locais independentes (claustro, ruínas, vale), cantaria procedural, terraço e árvores com folhas individuais dobradas. Sem downloads, serviços ou novos pacotes.
- Parte norte, z < -4.05, reservada à exposição. Artefatos só podem ser colocados com centro z <= -4.85 e folga dos outros objetos. Areia desenhável termina antes do terraço.
- Trocar bases preserva a mesma coleção em memória, em vez de manter uma coleção diferente por modelo. Legado preservado. Sem persistência após recarga.
- As árvores novas são usadas apenas na experiência de areia; o editor antigo mantém seu gerador anterior.
- Verificado: TypeScript, build isolado, regressões de circulação e separação territorial, navegador 390×844 e vista em primeira pessoa. Sem medição em aparelho físico. A amostra ainda não equivale ao acabamento das referências.

## Edição e separação orgânica
- Retirado o piso do terraço: areia contínua e pequena borda curva de pedras, com passagem central.
- Legado ao fundo (.8, -7.65), centro da placa a 1.58 m, sobre pilar estreito com vão de flutuação.
- Objetos: adicionar árvores, pedras, caminhos e lanternas; selecionar, mover, girar, confirmar/cancelar e remover. Repetir a aba ativa mantém seleção. Desenhar encerra edição explicitamente pela mudança de modo.
- Mover base desloca todas as peças marcadas como parte do modelo em passos de 25 cm, validando contorno, área pessoal, objetos independentes e entrada. Não há rotação de conjunto nesta amostra.
- Dez insígnias existentes copiadas para o catálogo local de exposição; sem inventário, desbloqueios ou contas.
- TypeScript, build e regressões passaram; inclusão/rotação/remoção e deslocamento do conjunto conferidos no navegador. Performance em aparelho físico não medida.

## Arraste e silhuetas — 8 setembro
- DragPlacement.tsx compartilha o gesto entre decoração e exposição. Arraste pelo círculo da seleção ou use Mover; alterações ficam em prévia até confirmar. Cancelar conserva a posição previamente confirmada. Câmara desativada durante seleção para não disputar o gesto.
- A decoração usa sua geometria final na prévia, com círculo vermelho quando inválida. Pinheiro tem perfil estreito em camadas e verde escuro; bordo tem copa aberta e paleta quente.
- Verificados no navegador: arraste de pedra, confirmação, destino inválido na área pessoal, cancelamento e arraste/colocação de insígnia. TypeScript, regressões e build isolado passaram. Toque em aparelho físico continua sem validação.

## Soltar aplica, salvar é separado
- Retirados Confirmar/Posicionar. Soltar aplica a última posição válida em memória; toque no terreno também posiciona. Rotação de objetos existentes é imediata e validada.
- Nenhuma persistência ou chamada Supabase foi adicionada. Recarregar descarta a sessão.
- Soltura conferida em nova aba: posição aplicada sem confirmação. A aba antiga manteve um manipulador anterior durante hot reload; sua sessão não foi recarregada para preservar a composição.

## Três kits cosméticos — 8 setembro
- Kits > Refúgio natural (inicial gratuito), Pátio dourado (luxo) e Gênesis (season roxa). Todos disponíveis para comparar, sem compra ou desbloqueio.
- Cada composição inicial tem seis peças editáveis: árvore, conjunto de pedras, rocha grande, caminho, lanterna e jardineira de flores. Kit cosmético independente dos quatro modelos e dos fundos.
- kits.ts define nomes, composição visual e IDs. GardenObject.kit prepara a identificação cosmética nos dados locais. A troca nesta comparação aplica o estilo às peças existentes sem mudar suas posições, desenho ou exposição; novas peças recebem o kit escolhido.
- Luxo: calcário claro, medalhões no caminho, bronze, flores claras e copa dourada. Gênesis: basalto, cristais de ametista na rocha, detalhes violetas, jardineira e copa roxa.
- Bordas orgânicas baixas em todos os kits. Nada de expansão comprável, níveis, preços, Supabase ou persistência.
- Verificados os três kits nos quatro modelos: entrada, área pessoal, seis funções diferentes e orçamento geométrico. TypeScript e teste em retrato 390×844, sem overflow ou erros de console; performance em aparelho físico não medida.

## Menu inspirado no Arsenal — 8 setembro
- Leitura de referência: components/Store/Inventory.tsx e views/ArsenalView.tsx, sem alterações nesses arquivos.
- Objetos em cartões com miniatura do próprio modelo, nome em duas linhas e identificação cromática do kit. Categorias, busca e seletor do kit das peças combináveis; peças de kits diferentes podem coexistir.
- ItemPreview.tsx usa um único render target 144px no renderer existente e guarda PNGs em memória, sem canvas WebGL por cartão nem assets externos. Miniaturas para os três kits geradas uma vez por sessão.
- Artefatos/insígnias com filtros separados e busca. Painel inferior recolhível; seleção reduz catálogo às ações de edição.
- Testado em 390×844: busca + categoria, troca do kit, miniaturas, ausência de overflow horizontal e erros de console. O app e o Arsenal originais permanecem intactos.

## Biblioteca unificada e estilos por peça
- Barra principal: Areia, Itens, Ambiente, Câmera. Desenhar e Alisar dentro de Areia.
- GardenItemLibrary.tsx reúne decoração, artefatos e insígnias, com busca e categorias. Escolher coleção ajusta internamente o controlador correto sem criar outra aba para o usuário.
- Kit é estilo de um objeto; trocar filtro ou estilo da seleção não altera o restante. Removido o seletor global de kits. A vitrine Comprar kits aplica visual isolado do botão .luxe-skin-button do index.html original, sem importar a loja. Kits liberados na demonstração; Ver peças filtra catálogo, não compra nem recolore cenário.
- Rolagem por gesto com barras ocultas. Validação em retrato: catálogo, vitrine, seleção de insígnia e prévia de rocha roxa coexistindo com cenário natural. TypeScript/build verificados.

## Seleção contextual e colocação repetida
- SelectionAnchor.tsx projeta a posição da peça para uma barra HTML com Mover, Girar e Remover, limitada às bordas da tela. Mais uma inicia outra peça do mesmo tipo.
- Catálogo recolhe automaticamente durante seleção/colocação. Toque no terreno vazio encerra seleção e reabre a coleção; Escolher outro item faz o mesmo.
- Validado em retrato: duas pedras com Mais uma, soltura, toque fora e retorno ao catálogo, sem erros de console. TypeScript/build isolados passaram. Não foi adicionado salvamento ou integração com o app.

## Vitrine separada e controles compactos
- Kits depois de Câmera; removida a vitrine interna de Itens. Ver peças abre dialog modal nativo com seis prévias, foco contido, botão fechar/Escape e retorno à vitrine sem alterar filtros ou jardim.
- Areia: opções em Garfos, Cor e Traço, apenas um grupo visível. Barra da peça em uma linha com Mover, Girar, Remover e +.
- Câmera permanece como modo de navegação para não desenhar durante o arraste; Itens sem seleção já permite navegação direta.
- Testado em 390×844: modal com seis imagens carregadas, fechamento, catálogo sem vitrine, opções da areia e ausência de erros/overflow. TypeScript e build passaram.

## Modelos na loja, terreno variável e aviso de troca
- Loja reúne Kits de peças e Modelos de jardim. Modelos de demonstração: oval 10,3×18,3 m; pátio amplo arredondado 12,4×18,3 m; oval alongado 11×21,4 m; pátio de cantos suaves 12×20 m. Faixas descritivas, sem preços/cobrança.
- ModelChangeDialog mostra o que será apagado antes de Aplicar modelo. Cancela sem efeitos; aplicar substitui objetos e reinicia as texturas de areia. Legado, artefatos e insígnias preservados. Área pessoal limitada ao espaço comum a todos os modelos.
- gardenSurface.ts usa o mesmo contorno que os limites de colocação/caminhada; bordas e câmera acompanham dimensões. configureGarden altera somente o perfil desta cena isolada antes de remontar seus componentes.
- Flores discretas adicionadas às bordas de todos os modelos.
- Regressões: quatro contornos, UVs, interiores/exteriores, entrada e encaixe dos objetos. Navegador portrait: cancelamento preserva desenho; aplicar modelo amplo limpa desenho/undo, mantém insígnia e Legado, sem erros. TypeScript/build passaram. Nenhuma integração, compra ou persistência adicionada.


## Identidade visual Glyph

O menu usa `buildUiSkinTokens` (helper visual puro do app), com BASIC escuro como padrão. `SandExperiment` aceita `skinId` e `theme` para receber a identidade do app na futura integração; isso não altera os kits ou materiais do jardim. A camada `views/zen3d/glyphMenu.css` deve ser carregada depois de `zen3d.css`, como na entrada local. Os cartões, filtros, controles e diálogos seguem a linguagem do Arsenal e os botões metálicos Luxe. Fontes Inter/Cinzel são herdadas quando disponíveis no host; o teste local usa fallbacks sem buscar fontes externas. Nenhuma conexão de conta, compra ou salvamento foi adicionada.


## Entrada no Glyph

As entradas Jardim de RestScreen e ProfileView agora abrem Garden3DModal. O shell usa um documento local isolado em garden3d/index.html, gerado automaticamente por npm run dev/build via build:zen3d:embedded. O parâmetro skin/theme leva apenas a identidade visual. Three.js e o CSS do jardim só são carregados no documento do jardim. Voltar ao app pede confirmação pois a sessão não é salva. Não há migração ou escrita sobre gardenState do 2D. Visitas a outros jogadores mostram uma mensagem de indisponibilidade até existir persistência 3D. Placa e coleção continuam demonstrativas nesta integração.

Validação: build completo e regressões 3D passaram; documento local e assets empacotados conferidos. TypeScript global ainda tem erros em outras áreas, sem diagnóstico no novo Garden3DModal. Validação autenticada e Android permanecem pendentes.


## Atualização: conta, salvamento e loja

A implementação atual inclui salvamento explícito, inventário do jogador, cinco desbloqueios lendários de jardim e SQL para persistência/aquisição. Consulte [ATIVAR-NO-APP.md](./ATIVAR-NO-APP.md) para ativação, preços, testes e limites. As descrições anteriores de sessão sem salvamento se referem à etapa anterior. O protótipo isolado continua demonstrativo; a versão embarcada depende da migração.
