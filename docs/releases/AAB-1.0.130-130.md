# Glyph 1.0.130 — Checagem de prontidão para o lançamento

Gerado e verificado localmente em 26/11/2026. O Afonso faz o envio à Play Console.

## Artefato

- Arquivo: `C:\Users\Afonso\Downloads\GOL1.006\android\app\build\outputs\bundle\release\Glyph-1.0.130-130.aab`.
- Tamanho: **51.678.881 bytes** (51,68 MB).
- Package `life.glyph.app`, versionName **1.0.130**, versionCode **130** (lidos do manifesto de dentro do bundle).
- SHA-256: `087F992AB1615EECDDB28FD2C9DD73C0A8EC86BF3572A3F0408DEC25CE1EDB4C`.
- Assinatura: `jarsigner -verify` → **jar verified**.
- Permissões: as mesmas da 1.0.129. Não é depurável.

## O que muda no app

- **Capacitor 8.3.0 → 8.4.3** (core, cli e android). A 8.3.0 tinha o alerta crítico GHSA-rvm3-566m-v7fv: conteúdo remoto podia ser carregado na origem do app pelo proxy HTTP interno. A 8.4.3 é a primeira correção nas linhas 8.3 e 8.4.
- **Feed social** só recarrega com a tela à vista.
- **Tarefas antigas** (mais de 14 dias) vêm da cópia no celular, dia a dia. A abertura da conta do Afonso cai de ~195 KB para ~4 KB.
- **Redefinir senha** pede o mesmo que o cadastro: 8 caracteres, com número ou símbolo. O mínimo do Supabase também passou a 8.
- **Quiz de campanha** com os nomes novos (Mente sem Armadilhas, Círculo Forte).

## O que já estava valendo no banco (não depende deste AAB)

- 15 funções internas, que qualquer pessoa sem login chamava, ficam só com o servidor.
- Webhook `notif` morto removido.
- Aulas completas das 15 campanhas da vitrine.
- Baú com limite; código promocional e Bilhete Dourado só com login.
- Storage com teto.

## Validação

- `npx tsc --noEmit`: zero erro.
- Regressão: **194 de 194**.
- `npm run build`: passou. O pacote `ws` (Node) não aparece no bundle.
- `npx cap sync android`: passou.
- `gradlew :app:bundleRelease`: BUILD SUCCESSFUL.
- Conteúdo conferido de dentro do AAB: o JS traz `impressoes_das_tarefas` e a nova mensagem de senha.
- `npm audit --omit=dev`: o Capacitor saiu da lista. Sobram `tar`, `@xmldom/xmldom` e `rimraf` (do `@capacitor/cli`, só no build) e `ws` (do realtime-js, só em Node). Nada disso vai no app.
- **Não verificado em aparelho:** abertura, login, push e widget com o Capacitor novo. É uma subida de versão menor (8.3 → 8.4), mas vale abrir o app e entrar antes de publicar.
