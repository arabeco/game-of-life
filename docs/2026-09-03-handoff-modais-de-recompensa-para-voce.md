# Handoff — modais de recompensa: eu falhei, continue daqui

Data: 2026-09-03
De: Claude (frente de código)
Para: a outra IA (frente visual)

## O que eu errei

Você deixou a direção aprovada pronta em `docs/drafts/reward-modal-4-direcoes.html`,
bloco `.monolith`, com todas as medidas escritas. **Eu li a folha, peguei duas
coisas dela — o chanfro e o título serifado — e inventei o resto.** Depois
propaguei esse meio-B para os seis acontecimentos, então o erro não ficou num
lugar só: ficou em todos.

O que eu inventei, e o que a folha mandava:

| Peça | O que eu fiz | O que a folha manda |
|---|---|---|
| Placa | borda 2px, chanfro 24px, 2 sombras | borda 3px `#56585a`, anéis internos 5/6/9px, sombras `9×11` + `12×14`, chanfro 28px |
| Brasão | 64px com PNG de 44 | 84px com PNG de 66, anéis 5/6, sombra `5×6` |
| Métrica | 76px, número → símbolo, legenda **fora** do quadrado | 94×94, símbolo em nicho de fio de 33px **acima** do número, legenda dentro |
| Item | 62px, arte 40, cartão fechado | 68px, arte 46, borda só embaixo, fundo `rgba(18,18,19,.78)` |
| Título de seção | rótulo solto | rótulo + fio até a borda |
| Botão | retangular | pontas em bico |

Isso já está corrigido no código (as medidas agora são as suas, e há teste
travando cada uma). O que **não** está resolvido é o que aparece quando o
conteúdo real entra na placa — abaixo.

## Os defeitos que sobraram, vistos na bancada

Levantados olhando os seis lado a lado, com payload de verdade. Não são gosto:
são quebras de alinhamento e de hierarquia.

1. **Métrica sem símbolo desalinha a fila.** "30 dias / PREMIUM" e "Raro / BAÚ"
   não têm símbolo, então não têm o nicho de 33px — o número sobe e fica numa
   linha de base diferente dos vizinhos que têm. Na mesma fila, uns têm três
   elementos empilhados e outros dois.
2. **A quarta métrica vira órfã.** A placa tem 390px; quatro quadrados de 94 +
   gaps não cabem, e o quarto cai sozinho numa segunda linha, centralizado. O
   resgate de código é exatamente esse caso (ouro, fragmentos, premium, baú).
   Ou a métrica encolhe quando são quatro, ou o excedente vira outra coisa.
3. **A faixa "Entregue agora" briga com a placa.** No fecho de ciclo ela sai
   **azul** (a raridade do Baú de Ciclo é rara) dentro de uma placa **bronze**
   (o tom do ciclo). Duas cores fortes disputando na mesma tela. A regra 2 do
   seu documento diz que a cor da recompensa é reflexo, não pintura — a faixa
   está pintando.
4. **A altura da placa varia demais entre acontecimentos.** Missão tem duas
   métricas e um item; patente tem uma métrica e seis itens. Como cada seção
   tem margem própria, a diferença de altura fica maior do que a diferença de
   conteúdo justifica.
5. **Título de duas palavras quebra em duas linhas** ("CICLO FECHADO" no
   eyebrow, "RECONSTRUÇÃO" no título) e o conjunto empurra tudo para baixo. Não
   há regra de tamanho por comprimento de título.
6. **O item de 68px com nome de duas linhas + categoria + raridade fica
   apertado.** "Insígnia de Relatório de Ciclo" ocupa as duas linhas inteiras e
   a raridade encosta na borda de baixo.
7. **Subida de patente sai cinza.** O tom da patente é a raridade da insígnia
   ganha, e Vagante/Escudeiro são comuns. Tecnicamente correto, visualmente
   morno para a recompensa mais rara do jogo (dez na vida da conta). Precisa da
   sua decisão: mantém a progressão ou patente ganha tom nobre fixo?

## O que está pronto no código, e onde

Não redesenhe do zero: quase tudo já está ligado. O que falta é o desenho fino.

| Arquivo | Papel |
|---|---|
| `components/RewardPackBody.tsx` | O miolo único: brasão, título, métricas, faixa, itens, vantagens. **Os dois modais usam este.** |
| `components/RewardPackModal.tsx` | A placa: fundo escurecido, moldura da direção e o botão da Skin UI |
| `components/AchievementModal.tsx` | Mesma família, mais o vídeo antes e o compartilhar depois |
| `constants/rewardPlateStyles.ts` | **As quatro direções (A, B, C, D), aplicáveis ao componente real.** Cópia literal dos blocos da sua folha |
| `constants/rewardEmblems.ts` | Emblema e tom por acontecimento |
| `utils/achievementRewardPayload.ts` | Prêmio de feito → payload |
| `utils/redeemRewardPresentation.ts` | Resgate de código → payload |
| `utils/chestRewardPresentation.ts` | Fecho de ciclo → payload |
| `tools/index.html` + `tools/avatar-preview.tsx` | **A bancada**: os seis com conteúdo real |

### Como ver, sem entrar no app

```bash
npm run bancada
```

Abre em `localhost:3010`. É a raiz do servidor, então não precisa de caminho,
login nem passar pelo app. Os seis modais estão lá, montados pelo componente
real, com os payloads reais. Editar qualquer arquivo acima recarrega sozinho.

### Trocar de direção

`RewardPackModal` aceita `direcao="A" | "B" | "C" | "D"`. B é o padrão. As
quatro vivem em `constants/rewardPlateStyles.ts` com placa, brasão e recorte de
botão cada uma — dá para comparar as quatro **com o conteúdo de verdade**, que é
o que a folha estática não permitia: lá a de patente cabia e a de resgate não,
e isso não aparecia.

## O que eu preciso de volta

1. **Os seis acontecimentos resolvidos na mesma placa**, sem repetição de
   componente. Se um caso precisar de exceção, que ela seja um prop do miolo, não
   um segundo componente — já tivemos dois desenhos para a mesma frase e cada
   melhoria só chegava em um deles.
2. **Uma regra para a fila de métricas**: quantas cabem, o que acontece na
   quarta, e como fica a que não tem símbolo. Hoje são três casos diferentes
   (uma, duas, quatro) e só o de duas foi desenhado.
3. **A faixa de destaque decidida**: ou ela perde a cor de raridade e vira mais
   um bloco grafite, ou a placa cede o tom para ela. As duas coloridas juntas
   não funcionam.
4. **A folha HTML refletindo a verdade.** Hoje ela mostra só patente, com seis
   itens e conteúdo inventado. Precisa mostrar os seis acontecimentos com o
   conteúdo real — resgate com quatro métricas, missão com duas, ciclo com faixa,
   temporada com dois itens míticos, Genesis com um, patente com seis. É nesses
   casos que o desenho quebra, e a folha atual esconde isso.
5. **A decisão do tom da patente** (item 7 acima).

Se preferir mexer direto no código, mexa: a bancada mostra na hora e os testes
avisam se alguma medida da sua folha for perdida de novo
(`node tests/reward-modal.regression.mjs`).

## O que não mudou e não deve mudar sem conversa

- O botão é **sempre** o da Skin UI equipada, nunca a cor da raridade.
- Duplicata de baú não tem tela própria: cai no modal do item, com uma linha
  dizendo que virou fragmento.
- `DailyCompletionPromptModal` não é recompensa e deve continuar leve.
- Não existe recompensa diária. Se vier a existir, alimenta este mesmo modal.
