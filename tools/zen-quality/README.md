# Jardim experimental — estado atual (17/09/2026)

Cena isolada do jardim com conta/inventário. Entrada: **Meu perfil → Jardim experimental**.
Fontes em `tools/zen-quality`; saída embutida gerada em `public/garden-experiment`.

## Seleção aprovada e orçamento

Afonso aprovou **copa cheia / full**. Somente ela é empacotada. As versões original,
intermediária e lean saíram do comparador/build; os originais de trabalho ficam em
`assets/tree.glb`, `assets/rock.glb` e `assets/sand/*.jpg` para reproduzir o processamento.

| Recurso atual | Bytes | Triângulos |
|---|---:|---:|
| Árvore full, incluindo imagens | 461.159 | 16.782 |
| Pedra, incluindo imagens | 150.517 | 7.054 |
| Areia: cor/normal 512px, rugosidade 256px WebP | 97.148 | 24.576 nos sulcos |

A areia caiu de 1.552.576 para 97.148 bytes (-93,7%). Não há download de originais
nem imagens grandes escondidos no build. A régua do pacote experimental foi reduzida
para **2 MiB**, verificada por `test:egress-estatico`. Bytes de modelos não incluem JS.

## Coleções e compartilhamento

- **Sereno:** árvore aprovada, totem de três pedras, caminho, água, bambu e lanternas.
- **Pátio dourado:** folhagem dourada, pedra clara/bronze e guardião esculpido estilizado.
- **Gênesis:** folhagem violeta, pedra escura e relicário com ametista e arcos.

Os três temas são prévias de composição fixa. Reutilizam os mesmos dois arquivos de
modelo e imagens. Folhagem colorida tem material próprio, mas mantém a malha e a
textura da árvore; o Sereno mantém o material aprovado. Caminhos, bordas, bambu,
lanternas e peças exclusivas são geometria procedural. A reflexão da água usa uma
pequena textura gerada em memória, sem novo arquivo remoto. Ainda não há integração
dos kits com itens compráveis, inventário, posicionamento ou persistência.

Cada modelo tem um carregamento por URL. Repetições usam instâncias; tint não elimina
custo de desenho, polígonos, materiais ou memória. Instâncias reaproveitam buffers e
imagens. Visitar os temas mantém seus recursos próprios em cache até fechar. O painel
mostra contagens GPU, não bytes de memória, temperatura ou prova de desempenho Android.

`CATALOGO-PLANO.md` registra famílias disponíveis e itens ainda pendentes. Não assumir
que os artefatos/insígnias existentes em imagem exigem um GLB próprio.

## Gerar e verificar

```powershell
npm ci --prefix tools/zen-quality/pipeline
node tools/zen-quality/pipeline/build.mjs
node tools/zen-quality/pipeline/sand.mjs
node tools/zen-quality/pipeline/verify.mjs
npx tsc -p tools/zen-quality/tsconfig.json
npm run build:garden-experiment
node tools/zen-quality/pipeline/verify.mjs --embedded
npm run test:egress-estatico
```

`sharp` vem das dependências da raiz. O pipeline sempre parte dos originais, sem
requantizar repetidamente o resultado. `assets/light/report.json` e
`assets/sand/compact/report.json` guardam medições reais. Testes decodificam os modelos,
validam referências, índices, limites e alpha das folhas. Build preserva caminhos
relativos dos glTFs e imagens compartilhadas. `npm run build` inclui esta cena.

Dev: `npx vite --config tools/zen-quality/vite.config.ts`, porta 3018.
Harness do modal: `/tools/garden-experiment-check.html` no servidor principal.
O harness prova abrir/fechar/reabrir, não a localização do botão no perfil autenticado.

## Origem dos assets

Modelos e texturas Poly Haven, licença CC0; geometria procedural nova no código:
[árvore](https://polyhaven.com/a/island_tree_02), [pedra](https://polyhaven.com/a/boulder_01),
[areia](https://polyhaven.com/a/sand_01), [licença](https://polyhaven.com/license).
Folhas reconstruídas como planos com recorte alpha do atlas RGB de fundo preto,
4.847 folhas ampliadas 2,65 vezes e distribuídas por células para manter a copa.
Tronco e galhos são simplificados separadamente. Meshopt para geometria, WebP para imagens.

O arquivo `VALIDACAO-2026-09-17.md` registra a etapa histórica de comparação, anterior
à seleção final. Seus tamanhos/comparadores não descrevem o pacote atual.
