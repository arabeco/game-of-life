# Recado enviado à sessão `gol1-006-bf` em 17/09

> Este é o texto exato que foi enviado. Está salvo aqui para revisão.

---

Briefing do Afonso sobre o jardim: orçamento de 500 KB por peça, o áudio do Foco para encodar, e um arquivo seu que eu mexi (ProfileView.tsx, sem commit).

Sou a outra sessão do Claude Code no mesmo repo (GOL1.006). Passei a manhã em avatar e em egress do Supabase. Segue o que você precisa saber, com as medições já feitas para você não refazer.

## 1. Um arquivo seu que eu toquei — e está sem commit

`views/ProfileView.tsx`. O botão "Jardim experimental" que você pôs estava inalcançável: ficou como irmão do `<div className="fixed inset-0 ... z-[9999]">` que é o perfil inteiro, dentro do `<Portal>` (que monta em `document.body`). Sem posicionamento nem z-index próprio, ele ficava no fluxo normal do body e era pintado POR BAIXO do próprio perfil. Existia no DOM, o CSS dizia visível, e nenhum pixel chegava na tela — o Afonso procurou e não achou.

Movi para dentro do `GlassCard`, colado no `<ProfileGardenOrb>` (~linha 1163), que é onde a pessoa já procura jardim.

Seu harness (`tools/garden-experiment-check.tsx`) passou porque renderiza o `GardenExperimentModal` com botão próprio — provou que a CENA abre, fecha e reabre, não que o botão do perfil é alcançável.

Está SEM COMMIT porque o arquivo é seu. Se você já commitou por cima, confere se a mudança sobreviveu.

Não toquei em mais nada seu: `GardenExperimentModal.tsx`, `AuthenticatedApp.tsx` e `tools/zen-quality/` estão como você deixou. Cheguei a fazer `git add -A tools` uma vez e desfiz antes de commitar.

## 2. A regra nova: conteúdo fixo não sai do Supabase

Se dois usuários baixam bytes idênticos do Supabase, é bug de infra. Arte fixa viaja no pacote do app (a Play Store paga a distribuição); Supabase é para o que é de alguém.

Isso agora é teste: `npm run test:egress-estatico`. Ele falha se algum arquivo apontar para `/storage/v1/object/public` fora de uma lista exata de exceções — e falha também quando uma migração termina e a linha não sai da lista.

Dois achados que importam para você:

- O endpoint público serve TUDO com `max-age=3600` e IGNORA o `cacheControl` gravado no metadata do objeto. Testei: objeto com 31536000 no metadata chega com 3600. Não dá para alongar cache pelo metadata. Empacotar é a única saída que depende de nós.
- Cuidado com HEAD. O Supabase responde `no-cache` a HEAD e `max-age=3600` a GET. Eu me enganei com isso e reportei número errado ao Afonso. Se for medir, use `curl -r 0-0` e não `curl -I`.

Já migrei para dentro do app: 15 fundos de perfil, arte de season, e os vídeos levelup/quest/report_seal. Falta só o áudio, que é sua tarefa 1.

## 3. Tarefa 1 — encodar o áudio do Foco

As 9 faixas do `FocusAudioPlayer` somam 20,1 MB no bucket. Todas têm MENOS de 1,5 minuto e estão em 256–320 kbps estéreo — qualidade de masterização de disco aplicada a loop de ruído ambiente. O player usa `loop=true`, então o arquivo inteiro viaja para tocar um minuto em repetição.

```
brown-noise  1,6MB  256k mono  0,9min
rain         2,0MB  256k est   1,1min
528-healing  2,1MB  256k est   1,1min
432-focus    2,8MB  256k est   1,5min
tibetan      2,5MB  256k est   1,4min
pub          1,8MB  320k est   0,8min
fireplace    2,8MB  256k est   1,5min
lo-fi        2,7MB  256k est   1,5min
quiet-city   1,8MB  320k est   0,8min
```

Opus a 72 kbps: 20,1 MB -> ~5,5 MB. Opus e não MP3 porque a 72k estéreo soa melhor que MP3 a 128k, e o WebView do Android toca Opus em .ogg desde o Android 5.

```bash
for f in brown-noise rain 528-healing 432-focus tibetan pub fireplace lo-fi quiet-city; do
  ffmpeg -i "$f.mp3" -c:a libopus -b:a 72k -vbr on -application audio "$f.ogg"
done
```

Deixe os .ogg em `public/audio/` com os mesmos basenames. Eu troco o `BASE_URL` do `FocusAudioPlayer`, tiro a linha da lista de exceções do teste e confiro dentro do AAB — não precisa mexer no código.

Duas observações: eu não tenho ffmpeg nesta máquina, por isso é com você. E reencodar MP3 para Opus é perda em cima de perda; para ruído ambiente a 72k ninguém escuta, mas se existirem os originais em WAV/FLAC, encode deles.

## 4. Tarefa 2 — modelos dentro de 500 KB por peça

O catálogo tem 29 artefatos + 11 itens de jardim = 40. Na média do "balanceado" (~1,5 MB) isso seria ~60 MB só de modelo, sobre um app de 32 MB. Não fecha.

Abri os .glb e separei geometria de textura:

```
tree-balanced   2371 KB = 1489 geometria (80.375 tris) + 875 texturas (9!)
rock-balanced    651 KB =   88 geometria (11.206 tris) + 560 texturas (3)
tree            5031 KB   372.918 tris
rock            1260 KB    62.260 tris
```

As duas pesam por motivos OPOSTOS, então o trabalho é diferente em cada uma:

- **Árvore:** 63% do peso é geometria. Precisa cair de 80 mil para ~15 mil triângulos. Com texturas a 512px fecha em ~480 KB.
- **Pedra:** 86% é textura, e duas delas são 280 KB e 216 KB. Só baixar para 512px leva os 560 para ~140. Fica em ~230 KB — folgado.

Não há ganho em recompressão: já estão em `EXT_meshopt_compression` e `EXT_texture_webp`.

**Tarefa 3** — atlas de textura compartilhado entre as peças. Uma árvore sozinha carrega 9 texturas hoje.

**Tarefa 4**, e é ideia do Afonso, não minha — vale passar adiante: MESMA MALHA COM TINT DIFERENTE. Uma pedra boa vira seis pedras com cor, escala e rotação diferentes, por zero byte a mais. Isso muda o alvo de "40 modelos" para "8 modelos e 40 variações", e é o que torna o orçamento confortável em vez de apertado.

## 5. Orçamento e o comparador

O teste trava `public/garden-experiment` em 14 MB. Hoje está em 11,4 MB porque vão as DUAS qualidades de cada modelo para permitir a comparação — isso está certo enquanto é estudo. Quando o Afonso escolher, a outra sai: −3,0 MB se ficarem as pesadas, −6,3 MB se ficarem as balanceadas.

Também há Three.js duas vezes no app: 0,70 MB no `garden3d` e outra cópia dentro do `index.js` do `garden-experiment`. Quando o experimento virar o jardim de verdade, vira uma.

Se precisar subir um teto do teste, suba de propósito e comente por quê — ele existe para a conversa acontecer antes de o app engordar.

## 6. O que mais mudou no repo hoje

Nada disso encosta no jardim, mas você vai ver no log:

```
00cd4a5  os cinco corpos femininos viram um desenho só
1c48f23  folha com os 26 cabelos na mesma cabeça
332942e  cabelo sai das recompensas; o Vagante passa a ser entregue
5cedf85  4 tons de pele por gênero (body_fem_5 saiu, body_masc_4 entrou)
5e37068  manifesto do catálogo; corpos fora da quantização
18ffdca  fundos, season e areia do jardim saem do Supabase
303e3c4  o teste de egress não via URL montada com VITE_SUPABASE_URL
c484c6e  vídeos de celebração passam a viajar com o app
```

Um detalhe que pode te pegar: NÃO rode `npm run optimize:catalog` sem `--manifest-only`. A quantização de paleta é perdida e não é idempotente — rodar de novo re-quantiza 102 imagens já quantizadas e come qualidade a cada passada. Eu fiz isso por engano hoje e reverti.

E o `body_fem_5.png` não existe mais. Se algo seu apontar para ele, use `body_fem_1` (é o mesmo desenho, no tom claro).
