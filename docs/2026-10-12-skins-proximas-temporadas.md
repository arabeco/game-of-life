# Cinco skins — próximas temporadas

Atualizado em 12/10/2026. Pedido do Afonso: começar pelas cinco skins das próximas temporadas, reportar antes dos outros assets. As cinco roupas de regras secretas não fazem parte desta entrega.

## Entrega visual

Galeria: `output/temporadas-skins-2026-10-12/galeria.html`. Tem roupa isolada e sobreposição nos corpos masculino/feminino, tons 1 e 4. Comparativo: `cinco-skins-comparativo.png` na mesma pasta.

| Temporada | Início no código | Paleta aprovada | PNG selecionado |
|---|---|---|---|
| Zênite I | 01/01/2027 | Marfim, ouro solar e bronze | `zenite-i-v2.png` |
| Eclipse I | 20/03/2027 | Obsidiana, prata envelhecida e vinho escuro | `eclipse-i-v1.png` |
| Égide I | 21/06/2027 | Azul profundo, aço e branco frio | `egide-i-v1.png` |
| Aurora II | 23/09/2027 | Jade fumê, prata e esmeralda pontual | `aurora-ii-v3.png` |
| Zênite II | 21/12/2027 | Cobre, grafite e âmbar | `zenite-ii-v1.png` |

Todos os PNGs selecionados ficam na pasta da galeria; são 500×500 RGBA, cerca de 119–137 KiB cada (aproximadamente 642 KiB juntos). Os originais maiores estão em `sources/`. Não substituir os originais do catálogo por estas candidatas sem terminar o encaixe.

Geradas com a ferramenta integrada `image_gen`, usando os corpos oficiais como gabarito e roupas existentes como referência de estilo. Prompts completos em `prompts.md` e `prompts-ajustes.md`; medições em `validation.json`, seleção em `selecionadas.json`. `prepare.mjs` apenas normaliza o tamanho/posição e cria comparativos; não deforma mangas nem recorta partes do corpo.

## Qualidade e limites reais

- Paletas e cinco desenhos produzidos; arquivos com transparência real confirmada.
- Zênite I recebeu uma segunda versão para aproximar os punhos das mãos.
- Aurora teve correção dirigida e uma tentativa em duas etapas: avatar vestido, depois extração da roupa. A v3 é a candidata selecionada. O intermediário está em `aurora-dressed-intermediate.png`.
- A sobreposição revelou pequenas faixas de pele junto às mangas e calcanhares em algumas peças. A escala global não resolve isso: ainda é necessário ajustar a geometria das mangas/botas e conferir a ausência de forro opaco nas bocas dos punhos. **Encaixe de produção não aprovado.**
- Conferência visual nas duas silhuetas e extremos de tom; não houve teste de integração no CanvasAvatar, nos oito corpos ou no Android. Não esconder esses defeitos com recortes do corpo.
- Nenhum item, recompensa, offset, data de temporada ou arte existente foi modificado. O Guardião Aurora original está preservado.

## O que cada temporada realmente tem hoje

Fonte: `constants/seasonContent.ts` e `constants/items.ts`, consultados nesta rodada. IDs internos ainda incluem anos antigos; as datas acima vêm de `startDate`, não do nome do ID.

- Zênite I, Eclipse I, Égide I e Zênite II: calendário e descrição existem, mas `quests` está vazio e não há coleção própria em `SEASON_COLLECTIONS`. As skins acima são propostas, não recompensas já ligadas.
- Aurora II: tem a coleção `aurora_1_2026`, com Guardião Aurora, borda, banner, insígnia e tema `AURORA_I`; tem três jornadas individuais e uma de clã. A nova arte é uma alternativa preservada fora do catálogo.
- O padrão escrito no código é cinco peças por coleção: **skin, borda, banner, insígnia e tema de interface**. As três jornadas individuais entregam baús da temporada, e o fechamento prevê insígnia/tema; revisar a entrega efetiva ao cadastrar cada coleção, sem inferir implementação pela regra escrita.
- Próxima fase de arte, após revisão das skins: bordas, banners, insígnias, temas e fundos próprios. Fundos de Zênite/Eclipse/Égide hoje reutilizam `gold.png`, `void.png` e `frost.png`.

Antes de anunciar lançamento: definir missões/pool das quatro temporadas vazias e conectar as coleções no cliente e no servidor. Gerar arte não faz essa integração automaticamente.

## Atualização após integração das artes (12/10)

O levantamento acima antecede a rodada seguinte: bordas, banners e insígnias das quatro temporadas agora estão no catálogo local; Zênite I/Eclipse I/Égide I ganharam coleções com três peças e SQL manual ainda pendente. A jornada de clã de Aurora II foi removida pelo Claude. Skins seguem sem encaixe aprovado, com revisão atribuída ao Claude na prancheta. Consulte docs/2026-10-12-temporadas-integracao-e-pontas-soltas.md para o estado atual.
