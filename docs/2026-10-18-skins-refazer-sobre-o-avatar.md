# Refazer as 5 skins das temporadas — vestindo o avatar, depois tirando o avatar

Pedido do Afonso em 18/10/2026. A leva de 12/10 (Zênite I, Eclipse I, Égide I, Aurora II, Zênite II) foi **reprovada**: aparecem tiras de pele entre a manga e o tronco e pedaços do calcanhar fora da bota. A causa é que a roupa foi desenhada **solta**, com braço e pé no lugar errado, e só depois posta em cima do corpo.

Desta vez o caminho é o contrário: **vestir o avatar de verdade e só depois tirar o avatar**.

---

## 1. Antes de desenhar, olhe o que já existe

- **As 42 skins do catálogo** em `public/assets/catalog/avatars/SKIN_*.png`: o traço, a luz, a espessura do contorno e o nível de detalhe. As novas têm que parecer da mesma coleção. Veja principalmente as que já encaixam bem com braços e pés cobertos: `SKIN_T4_ARMADURA_PLACA`, `SKIN_T3_ALQUIMISTA`, `SKIN_T3_NOMADE`, `SKIN_SEASON_CRIADOR`.
- **As ideias de 12/10**, que continuam valendo como design (paleta, tema, silhueta): `output/temporadas-skins-2026-10-12/` (`zenite-i-v2`, `eclipse-i-v1`, `egide-i-v1`, `aurora-ii-v3`, `zenite-ii-v1`), `prompts.md`, `prompts-ajustes.md` e `docs/2026-10-12-skins-proximas-temporadas.md`. Os `*-review.png` mostram exatamente onde a pele aparece.
- **Como a roupa entra no app**: `components/CanvasAvatar.tsx` (corpo → recorte do que a roupa cobre → roupa → mãos na frente) e `constants/avatarOffsets.ts` (`cobre`, `recortes`, `REGIOES_DO_CORPO`). A roupa **não desenha mão nem cabeça**: quem desenha é o corpo.

## 2. Vestir o avatar

- **Corpo de referência: `public/assets/catalog/avatars/body_masc_1.png`** (500×500). É contra ele que toda arte nova nasce (ver `scripts/check-avatar-geometry.mjs`).
- Gere cada skin **vestida nesse corpo**, na mesma pose, posição e escala: mesmo quadro de 500×500, cabeça e pés no mesmo lugar, sem zoom e sem recentralizar. O corpo é a autoridade da geometria; a roupa se adapta a ele, nunca o contrário.
- **Mangas fechadas até o pulso**, coladas no braço do corpo, **sem vão entre a manga e o tronco** nem na axila. Manopla ou bracelete emendado na manga.
- **Botas cobrindo o pé inteiro**, calcanhar e borda de dentro incluídos.
- Gola baixa e aberta (a cabeça e o pescoço são do corpo). Nada de roupa de baixo aparecendo.
- Preserve o design de cada uma (paleta e tema aprovados em 12/10).

## 3. Tirar o avatar

- Com a skin vestida no `body_masc_1`, **remova tudo o que é do corpo**: cabeça, pescoço, mãos e qualquer pele.
- Use o próprio `body_masc_1.png` para isso: o que coincide com o corpo (cor e posição) sai; o que é roupa fica. Fundo e aberturas (gola, punhos) **transparentes de verdade**, sem cinza nem halo.
- As mãos ficam de fora, abaixo do punho: o corpo desenha a mão.

## 4. Conferir antes de mostrar

- Monte a roupa sobre **os 8 corpos** (`body_masc_1..4`, `body_fem_1..4`) e gere uma folha de revisão como os `*-review.png` de 12/10.
- **Medida, não olho:** conte os pixels de pele visíveis nas regiões que a roupa diz cobrir (`REGIOES_DO_CORPO`: braços, pernas, pés). A meta é **zero tira de pele** na manga e no calcanhar, em todos os corpos.
- Ajuste fino depois na ferramenta de sempre, **`tools/avatar-align.html`** (`npm run dev` → `/tools/avatar-align.html`): `x`, `y`, `scale` e `cobre: ['bracos', 'pernas', 'pes']`. A ferramenta só guarda no navegador; o bloco tem que ser colado em `constants/avatarOffsets.ts`.
- Mostre a folha de revisão ao Afonso **antes** de integrar.

## Regras

- **Não** integrar no catálogo, na loja ou em recompensas sem o ok do Afonso.
- **Não** substituir o Guardião Aurora original (`SKIN_QUEST_GUARDIAO_AURORA`).
- **Não** gerar AAB nem subir versão.
- Saída: 500×500 RGBA, no mesmo padrão de nome das skins de temporada (`SKIN_SEASON_*`) quando forem aprovadas.
- Ao terminar, atualize "Recados da outra IA" no `docs/PRANCHETA.md`. Item na prancheta: "Gerar de novo as 5 skins das temporadas".
