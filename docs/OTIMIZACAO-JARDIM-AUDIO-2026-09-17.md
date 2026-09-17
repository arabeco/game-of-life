# Jardim experimental e áudio local — 17/09/2026

## Entregue

- Árvore **full / copa cheia**, escolha explícita de Afonso: 461.159 bytes com imagens.
- Original/intermediária/lean removidas do build e do comparador. GLBs originais e
  JPGs fonte preservados apenas na pasta de ferramentas para reprodução.
- Areia: 1.552.576 → **97.148 bytes** (WebP, cor/normal 512px e rugosidade 256px).
- Sereno, Pátio dourado e Gênesis usam as mesmas duas malhas externas. Guardião e
  relicário acrescentados como peças procedurais distintivas para revisão visual.
- Nove faixas do FocusAudioPlayer agora referenciam `BASE_URL + audio/*.ogg` local.
  A exceção de egress do player foi removida e o teste exige presença/hash/Opus das nove.
- Orçamento do jardim reduzido de 14 para 2 MiB. Áudio tem teto de 7 MiB.

## Áudio: medições, não estimativa

MP3s atuais somam **20.967.352 bytes** (20,97 MB decimais, aproximadamente 20 MiB).
Ogg/Opus a 72 kbps com VBR restrito: **6.614.615 bytes**, redução de 68,45%.
Nenhuma faixa encurtada, nenhum canal removido. Os arquivos atuais de pub/cidade
têm aproximadamente 92/93 segundos; os tempos/bitrates no recado estavam diferentes.
Por isso o resultado medido não foi apresentado como a estimativa de 5,5 MB.

FFmpeg 7.1 encontrado na instalação Python via `imageio_ffmpeg`; nenhuma instalação
de sistema foi necessária. Originais MP3 guardados em `temp/focus-audio-source`
(ignorado pelo Git). Não foram encontrados WAV/FLAC em tools/public; houve transcode
com perdas a partir dos MP3s existentes, sem afirmar qualidade auditiva indistinguível.

Reprodução: `python scripts/package-focus-audio.py` (requer imageio_ffmpeg no Python).
O script baixa apenas as URLs públicas exatas das nove faixas, reutiliza fontes locais,
encoda, decodifica o resultado completo, verifica duração e grava hashes no manifesto.

## Evidências e limites

- Build completo do app passou; Oggs presentes em `dist/audio`.
- Typecheck do experimento e verificador de geometria/assets passaram.
- `test:egress-estatico` passou com os novos tetos e sem exceção de áudio.
- Harness `/tools/audio-package-check.html`: **9/9 PASS** em decodificação no navegador,
  reprodução HTMLAudio, passagem pelo fim com loop e pausa. Teste mudo; não é avaliação
  subjetiva de fidelidade, nem teste de controles do player com uma conta autenticada.
- Renderização das três coleções e troca de tema observadas sem novos downloads de
  modelos. A água usa reflexão procedural; texturas da areia compacta foram renderizadas.
- Sem AAB novo, instalação em aparelho, publicação ou push nesta etapa.
- O jardim atual com inventário/conta não foi substituído pelo experimento.

As demais famílias estão discriminadas em `tools/zen-quality/CATALOGO-PLANO.md`.
O catálogo atual tem 20 artefatos + 10 insígnias em imagem e 18 tipos de jardim;
não foi declarada uma conversão fictícia de “37 modelos restantes”.
