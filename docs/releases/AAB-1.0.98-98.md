# Glyph 1.0.98 — Zeragem de tipos, acentos do app inteiro e widget com a cor da skin

Gerado e verificado localmente em 20/09/2026. O usuário fará o envio à Play Console.

Este AAB **substitui** o de mesma versão gerado às 11:49 do mesmo dia. A versão
não subiu porque o anterior não chegou a ser publicado — ele é que ficou para
trás: todo o trabalho abaixo é posterior a ele.

## Artefato

- Arquivo: `C:\Users\Afonso\Downloads\GOL1.006\android\app\build\outputs\bundle\release\Glyph-1.0.98-98.aab`.
- Tamanho: **38.463.242 bytes** (38,46 MB / 36,68 MiB).
- Package: `life.glyph.app`.
- versionName **1.0.98**, versionCode **98**, minSdk **24**, targetSdk / compileSdk **36**.
- SHA-256: `0D2458B054FC4D3C2CD79592EC2070882A7E3F53946E4B8A19182634B747EE66`.
- Assinatura: `jarsigner -verify` retornou **jar verified**, código 0.
- Pacote e versão lidos de dentro do próprio `base/manifest/AndroidManifest.xml` do bundle.

O jarsigner emitiu os mesmos avisos das entregas anteriores: certificado
autoassinado, ausência de timestamp e atributos POSIX. A verificação
criptográfica passou. Aceitação pela chave de upload da Play depende do envio.

**Diferença de método em relação às entregas 1.0.95 e 1.0.97:** o
`bundletool validate` não rodou. O `bundletool-all-1.18.3.jar` usado antes não
está mais no disco, e baixá-lo não foi autorizado nesta sessão. No lugar dele, a
conferência saiu do próprio arquivo: estrutura do ZIP, manifesto, dex e assets
lidos e confirmados um a um (ver Validação).

## Mudanças

- **Zero erro de TypeScript**, de 69. Sete eram defeito de verdade, do tipo que
  entrega a tela errada e segue: ícone de arena virando lápis no balão de pacto,
  avatar do ocupante saindo como `??`, botão de compra indo ao banco com custo 0
  e tipo indefinido, "Membro há…" quebrado ao adicionar amigo ao grupo, presença
  da arena compartilhada lendo `avatar_url` num perfil que guarda `avatarUrl`,
  bolinha de humor da tela de descanso sem cor, e o modal de enviar campanha que
  nunca fechava nem quando o envio dava certo.
- **1.194 palavras acentuadas** no texto de tela, em 72 arquivos. Sobraram 4
  ocorrências e as 4 são intocáveis: `!criar-acao`, comando do chat do oráculo, e
  `coach:conta-nao-fecha`, id de mensagem com peso amarrado a ele.
- **Widget de ciclo segue a cor da Skin de UI equipada**. Era dourado para todo
  mundo. Fundo e barras passaram a ser Bitmap desenhado no `GlyphWidgetPaint`,
  no tamanho real do widget na tela.
- **Santuário de áreas removido** — 608 linhas mortas dos dois lados: ninguém
  gravava e ninguém lia, e ainda havia um temporizador de 60 em 60 segundos
  chamando duas funções que voltavam vazias.
- **Aldeia escondida, não apagada.** A aba era a inicial do modal de grupo e
  abria zerada, porque a camada de dados está atrás de
  `PRODUCT_FEATURES.clanSanctuary: false`. O grupo abre em Pessoas; religar é
  virar a flag.
- **SDK de IA fora** — `ai` e `@ai-sdk/*` existiam só por dois scripts soltos na
  raiz, e o chunk `oracle-ai` do vite.config nunca foi gerado. 14 MB de
  node_modules; zero byte de AAB, porque o Rollup já não empacotava nada disso.

## Validação

- `npm run build`: passou (jardim integrado, experimento e app principal).
- `npx cap sync android`: passou.
- `android\gradlew.bat :app:bundleRelease --console=plain`: BUILD SUCCESSFUL.
- `npx tsc --noEmit`: **zero erro**, e desta vez global — não há mais erro
  preexistente fora dos arquivos alterados, ao contrário das entregas anteriores.
- Suíte de regressão: **57 de 57**.
- `:app:compileDebugJavaWithJavac`: passou, o que também valida o layout XML do
  widget, porque `processDebugResources` roda antes.
- Conteúdo do bundle conferido de dentro do arquivo: `GlyphWidgetPaint` e
  `GlyphWidgetProvider` presentes em `base/dex/classes2.dex`;
  `glyph_widget_background` presente em `base/resources.pb`; a string
  "Não foi possível salvar o novo nome" presente em `game-core-dtNuPaUt.js` e a
  versão sem acento **ausente** de todos os 68 JS, o que prova que os assets são
  os desta leva e não os do AAB das 11:49.
- **Não verificado:** o resultado visual do widget em aparelho real. Widget só
  aparece com instalação de verdade, e nenhuma máquina daqui substitui isso.
  Também não foram verificados compra real na Play, premium em dois aparelhos e
  upload à Play.

O AAB é um artefato local ignorado pelo Git; o push contém código, versão e este
registro.
