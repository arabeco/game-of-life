# Checkpoint Android 1.0.110 (110) — 12/10/2026

## Escopo

Onboarding com apelido e faixa etária, contraste dos Termos, convites imediatos com marcos 1/5/10 e modal de recompensa, benefícios de planos sem baús e compra/renovação com ouro idempotente. Inclui os commits anteriores de widgets, Oráculo, Install Referrer e medição de abertura presentes no HEAD de base 329d540.

## Banco confirmado por Afonso

- Planos: migração complementar 20261011010000 aplicada e dez verificações OK.
- Convites imediatos: 20261011120000 aplicada.
- Limpeza de legado: 20261011180000 aplicada, resposta de sucesso.
- Permissões da exclusão: 20261012120000 aplicada; sete funções negam execução a anon/authenticated e permitem service_role.

## Validação desta rodada

TypeScript; nove arquivos de regressão (planos, bônus XP, convites, convites imediatos, permissões da exclusão, limpeza de legado, Install Referrer, core loop e barras do ciclo); onboarding em navegador com fixture isolada; build web e Capacitor sync passaram. O teste de navegador precisou sair da restrição de rede local do sandbox. Não houve compra, exclusão nem envio de e-mail real.

## Pendências separadas

Exclusão/pedido pelo site e retentativas ainda incompletos; Resend/fatura não verificados; haptics e fluidez do Planner ainda por revisar. Arte depois e skin por último. Site pertence a outro repositório, tem mudanças locais e não foi publicado neste checkpoint. Testes humanos seguem docs/SMOKETEST.md, especialmente novo cadastro, compra real, convite pela instalação Play, push e exclusão em conta descartável.

Não houve push Git nem upload no Play Console. O código 110 foi escolhido por Afonso; disponibilidade no Console não foi consultada.

## Artefato verificado

- Arquivo: android/app/build/outputs/bundle/release/Glyph-1.0.110-110.aab
- Pacote life.glyph.app; versionCode 110; versionName 1.0.110; targetSdk 36. Conferidos no manifesto gerado pelo processo do bundle.
- Tamanho: 49.008.714 bytes.
- SHA-256: B5D8E76270E74E58545E96CA17C477D828BD9090F45E9026D6963E703E82A41C
- Gradle :app:bundleRelease: BUILD SUCCESSFUL, incluindo R8 e assinatura.
- jarsigner: exit 0, jar verified. Avisos de certificado próprio/cadeia não confiada, ausência de timestamp e leitura por JarInputStream (manifesto fora da primeira entrada). Isso não comprova aceitação pelo Play; log completo em output/aab-110-signature.log.
- Logs locais: output/aab-110-web-build.log e output/aab-110-gradle.log.
