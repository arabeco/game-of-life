# Handoff — modais de recompensa, fechamento 1–6

## Decisão visual

Todos os acontecimentos continuam na mesma família: **B · Monólito Central**. A moldura, a espessura, o chanfro, o suporte do emblema e o botão são os mesmos. Mudam somente emblema, texto, conteúdo e o reflexo cromático do acontecimento.

## O que foi concluído

1. **Arena concluída**
   - `ARENA_COMPLETED` deixou de ser descartado antes da renderização.
   - Usa a placa B, pode ser compartilhado no Feed e pode ser fechado normalmente.
   - Reaproveita `celebrationScreensEnabled`: “Não mostrar celebrações novamente” desliga as telas cheias; recompensa e toast continuam funcionando.

2. **Abertura de baú**
   - Item novo e duplicata continuam abrindo o `ItemDetailModal` com arte grande.
   - O novo `focusMode` esconde a fileira “Coleção” e aplica a entrada em zoom somente quando o `instanceId` começa por `bau-`.

3. **Selo da temporada**
   - O evento agora carrega `seloDaTemporada` e `seasonId`, portanto não é mais confundido com uma jornada comum.
   - O modal usa a insígnia sazonal e o PNG vertical da temporada como cenário.
   - `genesis.png` e `aurora.png` continuam sendo ícones de tema; os cenários novos são `season-genesis-background.png` e `season-aurora-i-background.png`.

4. **Vídeo da cerimônia**
   - Foi escolhida a opção B: vídeo cheio, com “Toque para pular”.
   - Terminar o vídeo ou tocar revela a recompensa; com animações desligadas, a pessoa entra direto na placa.
   - A opção C (dois segundos cheios e depois vídeo ao fundo) fica como evolução, porque precisa de prova em aparelho fraco.

5. **VANGUARDA25 / resgate de código**
   - A linguagem de “bem-vindo” foi removida da tela antiga: agora ela fala em código ativado, bônus e itens resgatados.
   - O resgate comum já monta a placa a partir do retorno real do RPC.

6. **Passagem de temporada**
   - Mantém as duas etapas: encerramento da anterior e abertura da próxima.
   - A abertura agora lista as três jornadas em faixas com cor da temporada.
   - Na tela de Temporada, clicar em uma faixa fecha a passagem e abre o detalhe real daquela jornada.

## Correções transversais da placa B

- Título adaptativo: 34 px quando curto, 25 px quando longo, com até duas linhas.
- Métricas sem símbolo mantêm um nicho neutro e não desalinhadas das demais.
- Quatro ou mais métricas entram no modo compacto, evitando a quarta órfã.
- Faixas de raridade usam base grafite e somente acento na cor correta, sem competir com a placa.
- Patentes usam reflexo fixo de ouro antigo; a evolução fica no emblema e não começa com aparência de downgrade cinza.

## Prova e validação

- Folha: `docs/drafts/reward-season-modals-proof-1-6.html`
- Captura: `docs/drafts/reward-season-modals-proof-1-6.png`
- `npm run type-check`: passou.
- `npm run build`: passou.
- `node tests/reward-modal.regression.mjs`: passou, incluindo arena viva, foco do baú, selo sazonal e três jornadas clicáveis.
- `npm run test:mission-reward`: passou.
- `npm run test:item-art`: passou.

## Limite honesto

O acabamento visual foi conferido na folha estática e o código compilou. A sensação do vídeo, a duração do corte e o peso da placa ainda precisam de conferência em aparelho; build/browser não provam fluidez móvel.

## Correção após a primeira prova

- Arena ficou menor, sem recompensa inventada: mostra ações, entregas e dias ativos gravados na conclusão.
- “Não mostrar novamente” ganhou caixa própria.
- Botões da família receberam borda de 2 px além do gradiente da Skin UI.
- A legenda técnica do modo de baú foi removida da prova; ela nunca existiu no produto.
- Selo mostra a insígnia na grade de item recebido e termina em `OK`.
- Resgate usa o título curto `ENTREGUE` e exibe os itens reais abaixo das métricas.
- As três jornadas da passagem usam cores por categoria: física, intelectual, espiritual, social ou emocional.
- O botão da passagem permanece no rodapé, separado da lista.
- Arena usa `OK` como ação principal; compartilhar virou controle quadrado secundário ao lado da preferência.
- Nos casos 1, 2 e 3, a ação final fica ancorada no rodapé mesmo quando sobra espaço no corpo.
- No resgate, ouro/EXP usam os PNGs de valor. Baú não ocupa métrica: aparece em `Itens recebidos` com a própria arte e cor de raridade.
- O título do resgate é `CÓDIGO RESGATADO`; o identificador do código aparece pequeno imediatamente abaixo.
- Recompensa única usa bloco de 104 px, não uma faixa de grade.
- Baú com múltiplas entregas destaca o melhor item uma única vez; ouro e fragmentos adicionais aparecem abaixo em `Itens recebidos`, sem repetir o destaque.
- Ao selar a temporada, a Insígnia Gênesis vira o prêmio-herói grande e central. O Tema UI Gênesis aparece abaixo em `Também recebido`; a insígnia não se repete no topo nem na lista.
- Os quadrados de valores e dados agora recebem um reflexo metálico discreto no tom do acontecimento. A placa continua grafite; prata, bronze, âmbar, verde-água, violeta ou ouro antigo entram apenas no gradiente.
- A prova do vídeo deixou de ser uma imagem parada: usa o `quest.mp4` público real, toca sem som, aceita toque para pular e revela a placa B; há controle para rever.
- A mesma prova permite alternar para `levelup.mp4`. Subida de patente recebe a cerimônia completa; `LEVEL_UP` continua apenas no feed quando entra EXP, evitando um segundo modal sobre a conclusão da missão.
- O `poster` de Aurora foi removido da prova dos vídeos: durante o carregamento aparece somente o fundo preto neutro, sem associar uma temporada errada à recompensa.
