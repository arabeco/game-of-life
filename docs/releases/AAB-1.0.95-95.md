# Glyph 1.0.95 — Jardim experimental

Gerado e verificado localmente em 2026-09-17. Não enviado à Play Store.

## Artefato

- Arquivo: `C:\Users\Afonso\Downloads\GOL1.006\android\app\build\outputs\bundle\release\Glyph-1.0.95-95.aab`
- Tamanho: **33.548.250 bytes** (33,55 MB decimais / 32,00 MiB).
- Package: `life.glyph.app`.
- versionName: **1.0.95**.
- versionCode: **95**.
- minSdk: **24**; targetSdk / compileSdk: **36**.
- SHA-256: `E0B016CA7BB6FBDA3F6013B9CFA8509713547EFB897CA0F213186461F850FEE8`.
- Assinatura: `jarsigner -verify` retornou **jar verified**, código 0.
- Estrutura: `bundletool-all-1.18.3.jar validate` passou, código 0.
- Manifesto extraído do próprio AAB com `bundletool dump manifest`: package, versão e SDK acima confirmados.

O jarsigner também emitiu avisos de certificado autoassinado/cadeia não confiável,
ausência de timestamp, atributos POSIX e diferença de leitura JarFile/JarInputStream
(manifesto no fim do ZIP). A verificação criptográfica e a validação do bundletool passaram.
Aceitação da Play depende do upload e da chave de upload cadastrada; não foi verificada aqui.

## O que mudou

- **Meu perfil → Jardim experimental**, visível no próprio perfil.
- Modal independente com areia, árvore e pedra; não lê/grava jardim, inventário ou conta.
- Seleção **Meio-termo / Original**, com modelos locais dentro do AAB.
- Teste de movimento e indicador de FPS de renderização; estado parado mostrado como repouso.
- Saída pelo botão do modal, Escape do iframe e integração do voltar Android.
- Fechamento envia pedido de descarregamento: para animação, descarta materiais,
  texturas, geometrias e contexto WebGL antes de retirar o iframe; fallback de 500 ms.
- Fontes externas removidas da cena experimental para não depender de Google Fonts.
- Configuração de build passa a gerar o documento em `public/garden-experiment/`.
- Jardim normal e suas regras de salvamento permanecem sem alterações.

O pacote inclui as duas qualidades para comparação. O limite de 4,65 MB refere-se
aos assets carregados pela versão intermediária, não ao tamanho total deste AAB.
Foram confirmados dentro do ZIP: página experimental, JS/CSS, três texturas de areia
e quatro GLBs (árvore/pedra original e intermediária). A cena só solicita a qualidade
original quando selecionada.

## Validação realizada

- `npx tsc -p tools/zen-quality/tsconfig.json`: PASS.
- `npm run build`: PASS.
- `npx cap sync android`: PASS.
- `android\gradlew.bat bundleRelease`: PASS.
- `git diff --check`: PASS.
- `npm run type-check`: FAIL por diagnósticos preexistentes. Comparação pela API TypeScript
  com as versões HEAD dos dois arquivos de integração editados: **69 diagnósticos antes,
  69 depois, nenhum diagnóstico novo**. O projeto completo não está com typecheck limpo.
- Harness no navegador com o componente real: abertura, carregamento embutido, movimento
  com indicador de FPS, fechar pelo botão, reabrir, alternar para Original e sair por Escape.
- A contagem de fechamentos do harness confirmou o primeiro ciclo; segundo fechamento
  também foi iniciado por Escape e verificado separadamente.
- Perfil autenticado no celular, voltar físico do Android, RAM, temperatura e desempenho
  no dispositivo: **PENDENTES**. Não há APK instalado ou teste de aparelho nesta entrega.

Build web concluído às 07:57 locais. A base observada durante a verificação era `5cedf85`;
o pacote também inclui os arquivos correntes do checkout no momento do build, inclusive
atualizações de avatar de trabalho paralelo anteriores a esse horário. Nenhum commit ou
push foi feito por esta tarefa.

## Teste após publicar na faixa de testes

1. Instale/atualize pela Play e abra **Meu perfil → Jardim experimental**.
2. Comece em Meio-termo e toque **Testar movimento**. Observe fluidez e FPS por 30–60 s.
3. Compare Original e Meio-termo. Verifique também árvore, pedra e areia de perto.
4. Volte ao app, reabra e confirme que começa em Meio-termo novamente.
5. Confira o jardim normal e os itens salvos. A cena experimental não deve alterá-los.

FPS deste contador é indicativo; diagnóstico de memória/temperatura exige medição Android.
