# Glyph 1.0.97 — Jardim ampliado e ilha com céu automático

Gerado e verificado localmente em 19/09/2026. O usuário fará o envio à Play Console.

## Artefato

- Arquivo: `C:\Users\Afonso\Downloads\GOL1.006\android\app\release\Glyph-1.0.97-release.aab`.
- Tamanho: **38.460.964 bytes** (38,46 MB / 36,68 MiB).
- Package: `life.glyph.app`.
- versionName **1.0.97**, versionCode **97**, minSdk **24**, targetSdk / compileSdk **36**.
- Manifesto extraído do próprio AAB com bundletool; pacote, versão e SDK confirmados.
- SHA-256: `0A8AC70B1702570480E925AC764310A778822A1A9B25E3C8EFD764D2A6251E34`.
- Assinatura: `jarsigner -verify` retornou **jar verified**, código 0.
- Estrutura: `bundletool-all-1.18.3.jar validate` passou, código 0.

O jarsigner emitiu os avisos já observados na entrega 1.0.95: certificado autoassinado/cadeia não confiável, ausência de timestamp, atributos POSIX e diferença de leitura JarFile/JarInputStream (manifesto no fim do ZIP). A verificação criptográfica e o bundletool passaram. Aceitação pela chave de upload da Play ainda depende do envio.

## Mudanças

- Jardins existentes recebem o terreno espaçoso por padrão, com 56,25% mais área, preservando posições e desenhos.
- Escolha de quadrado, círculo, elipse e formato original; tamanho e modelos prontos acessíveis no painel Jardim.
- Cena ocupa quase a tela inteira, com controles flutuantes de entrar/editar e sair.
- Ilha rochosa substitui o chão infinito; sol, lua, estrelas e iluminação seguem o horário local do aparelho, com nuvens sutis em shader.
- Placa do jardim usa o componente atual de Legado, com cor e informações do perfil; captura local sem upload ao Storage.

## Validação

- `npm run build`: passou (jardim integrado, experimento e app principal).
- `npx cap sync android`: passou.
- `android\gradlew.bat :app:bundleRelease --console=plain`: BUILD SUCCESSFUL.
- `git diff --check`: passou.
- Antes do empacotamento: typecheck do jardim, regressões de terreno, céu/ilha/Legado, cache da areia, suíte Zen3D e SQL local passaram. Detalhes em `../qa/garden-sky-island-legacy.md`.
- Navegador: visual diurno/noturno e placa conferidos; fixture de jardim antigo preservou objetos, desenho e relevo após salvar/reabrir.
- Typecheck global possui erros preexistentes fora dos arquivos alterados; não está aprovado globalmente.
- Android/WebView em aparelho real, salvamento no Supabase de produção e upload à Play não foram verificados nesta entrega.

O AAB é um artefato local ignorado pelo Git; o push contém código, versão e este registro.
