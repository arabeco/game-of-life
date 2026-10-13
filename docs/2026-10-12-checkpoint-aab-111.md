# Checkpoint Android 1.0.111 (111) — 12/10/2026

## Conjunto incluído

Build do checkout compartilhado, incluindo os 98 commits que estavam à frente de origin/main (HEAD de base 948f819) e as alterações locais de produção desta sessão. Inclui o trabalho do Claude: diário com tags/páginas, feed Aliados/Reino, nickname único, Feitos, clã/arena compartilhada e redução de consultas na abertura. Inclui convites/prêmios atuais, cinco dias no Glyph, ajustes de widget/ciclo e e-mails/exclusão já presentes no código.

Entram também: convite sem link Play enquanto a página pública está indisponível; 12 artes leves de 2027; compatibilidade das URLs antigas de Aurora; versões 111 no Gradle/package/lock; documentação, SQL dos contadores e testes antes não commitados. Propostas de skins são material de revisão, não roupas de produção aprovadas.

Os originais de geração, capturas, backups locais e relatórios antigos não entram no AAB. A landing é outro repositório: este push não a publica.

## Banco

Afonso informou nesta conversa que executou `sql/temporadas-2027-artes.sql`. Registro da confirmação, sem nova consulta ao banco nesta rodada. Nove peças futuras cadastradas desligadas conforme SQL; ainda faltam skins, temas e jornadas para ativar essas coleções. Outras confirmações de SQL continuam na PRANCHETA; build local não prova deploy do servidor.

## Validação

- TypeScript e `npm run build` completos, incluindo os dois jardins embarcados.
- 24 arquivos de regressão passaram: core-loop, convite-de-amigo, convite-da-instalacao, convites-imediatos, sete-dias-no-app, barras-do-ciclo, widget-conta-o-dia-certo, deletion-email, account-deletion-permissions, abertura-enxuta, network-efficiency, journal-egress, diario-tags, feed-abas, nickname-unico, missao-de-cla, missao-de-cla-sql, arena-compartilhada, feitos-cards, item-art, egress-estatico, reward-routing, landing-stats-scope e onboarding-first-use. Reward-routing também executa memberships-without-chests.
- `npx cap sync android`: concluído.
- Gradle `bundleRelease`: BUILD SUCCESSFUL, R8 e assinatura concluídos.
- Manifesto binário extraído do próprio AAB e manifesto intermediário conferidos: pacote `life.glyph.app`, código **111**, nome **1.0.111**, minSdk **24**, targetSdk **36**.
- As 12 novas artes estão dentro do ZIP do AAB.
- `jarsigner -verify`: exit 0, `jar verified`. Avisos de certificado próprio/cadeia não confiada, ausência de timestamp e leitura JarInputStream; mesmos tipos documentados no 110. Não comprova aceitação pelo Play Console.

## Artefato

- `android/app/build/outputs/bundle/release/Glyph-1.0.111-111.aab`
- **49.714.788 bytes** (49,7 MB decimais).
- SHA-256: **0D2288FB17C42F0A1BB3B8A8CC04D209370B96403AB8B2E4623767CE4DD406A2**.
- Logs locais: `output/aab-111-web-build.log`, `output/aab-111-typecheck.log`, `output/aab-111-regressions.log`, `output/aab-111-gradle.log`, `output/aab-111-signature.log`. Resultados estruturados e manifesto em `output/aab-111-*.json`.

## Limites

Nenhuma compra, exclusão de conta, recuperação de senha ou instalação real foi executada nesta rodada. Exclusão pelo site/retentativas, haptics e encaixe das skins continuam pendentes conforme `docs/2026-10-12-temporadas-integracao-e-pontas-soltas.md`. O histórico de LAUNCH_READINESS_REPORT não substitui as verificações desta versão.

Commit e push autorizados por Afonso com as mudanças de ambas as IAs. Não houve upload ao Play Console; o AAB está pronto para o envio ao canal escolhido por Afonso.
