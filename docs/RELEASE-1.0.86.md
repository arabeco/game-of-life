# GLYPH 1.0.86 — 2026-09-11

- Package: `life.glyph.app`.
- Android versionCode: `86`; versionName: `1.0.86`; target SDK: `36`.
- AAB: `android/app/release/Glyph-1.0.86-release.aab` (20,063,505 bytes).
- SHA-256: `CBBD0B99594F3E0F549773973CF3ED348886FD94D1F0FB2E71F1C80FA4C40F48`.

## Alterações

- Avaliação de maestria embutida, roda com vizinhos visíveis, gradiente durante o gesto e vibração curta conforme a preferência. Pentagon atualizado durante a escolha e destaque da área atual.
- Histórico compacto das últimas seis avaliações; depende da migration existente `20260910120000_mastery_snapshots.sql` no banco.
- Contraste do resumo de perfil, navegação da avaliação e remoção de textos redundantes.
- Oráculo dividido em Meu dia, Missão e Sabedoria; apresentação do objetivo, prazo e progresso da missão individual.
- Correção do escopo da missão geral e retomada; SQL de diagnóstico e regressões locais.
- Teste de onboarding aguarda persistência remota antes de fechar o navegador.

## Verificação

- Web build, Capacitor sync e Gradle bundleRelease passaram.
- Manifest do bundle confirma pacote, versão e target SDK acima.
- `jarsigner -verify`: `jar verified`. Avisos: certificado autoassinado, ausência de timestamp e diferenças entre leitores JarFile/JarInputStream na organização do AAB; não houve erro de verificação criptográfica.
- Testes de lógica da suíte passaram, incluindo 30 cenários do core loop. Testes adicionais de missão, apresentação e seletor SQL passaram em fixtures locais.
- Navegador: onboarding completo, campanha, relatório do ciclo e UI shell passaram.
- **Suíte full incompleta:** `onboarding-oracle-delete-smoke.cdp.mjs` falhou ao procurar `#new-action-button` durante o tutorial. As etapas posteriores da suíte não rodaram. Não declarar o portão completo aprovado; detalhes em `LAUNCH_READINESS_REPORT.md`.
- Sem validação tátil em aparelho, upload na Play ou implantação de backend nesta rodada. O usuário informou anteriormente aplicar o SQL da missão; o build não comprova o estado remoto.
- `mundo-experimento/` excluído deste release.
