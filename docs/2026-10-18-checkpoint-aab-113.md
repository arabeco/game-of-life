# Android 1.0.113 (113) — 18/10/2026

Entrega: novos modais e miniaturas de arena/ação, campanhas no grid em uma célula com duas arenas internas, emoji ao lado do título centralizado e gradiente combinando os tons das arenas. Biblioteca e loja seguem o novo material visual. Inclui tons por arena, busca de emojis, saquinho do jardim, expansões compradas com fragmentos, guia ilustrado e fragmentos do Painel Diário (1/50 EXP crua, máximo 15).

Inclui também os cinco commits locais anteriores: correções de perfil/logout, diário offline e documentação. Capturas, backups, originais de arte e output local não foram selecionados para o commit.

## Verificações

- TypeScript principal e jardim: passaram.
- Oito regressões: arena-tones, campaign-lifecycle, daily-fragments, emoji-search, garden-basket, garden-expansions, garden-guide e garden-terrain passaram; regras SQL de recompensas e compras executadas em PostgreSQL local (PGlite).
- npm run sql:checa passou para a migração mais recente (20261018100000_saldo_congelado_no_cliente).
- npm run build (dois jardins + app), npx cap sync android e Gradle bundleRelease: sucesso.
- Manifesto do próprio AAB e intermediário: life.glyph.app, versionCode 113, versionName 1.0.113, minSdk 24, targetSdk 36.
- Seis imagens do guia presentes no AAB.
- jarsigner -verify: exit 0, jar verified. Avisos de certificado próprio/cadeia não confiada, ausência de timestamp, atributos POSIX e diferença JarFile/JarInputStream; não são confirmação de aceitação pelo Play.
- Verificação remota anterior nesta conversa confirmou as seis funções do jardim/fragmentos iguais ao SQL entregue, cinco tabelas com RLS e dois triggers habilitados. Nenhuma migração foi reaplicada para gerar o AAB.

## Artefato

android/app/build/outputs/bundle/release/Glyph-1.0.113-113.aab

49.829.669 bytes.

SHA-256: a10dd0360cf62139c505041d0ce4be0707726ba2829d45ab21fcbc109d3edcf5

Commit e push autorizados pelo usuário. Sem upload ao Play Console ou instalação em aparelho nesta rodada. Validação visual anterior usou componentes reais com dados de demonstração no navegador.
