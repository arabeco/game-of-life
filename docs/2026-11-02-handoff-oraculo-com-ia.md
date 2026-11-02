# Oráculo com IA — o que queremos (revisto em 02/11/2026, com o Afonso)

Este é o guia para construir o Oráculo com IA. Substitui a versão anterior
desta passagem, que tinha três premissas erradas: a IA só reescrevendo frase,
o validador como base e limites de 15 e 50.

**Nada está ligado ainda.** Não há chamada de rede em produção.

## A ideia

**A IA decide o que falar. O app só entrega os dados.**

O app calcula os fatos do dia: arenas, quanto foi feito do prometido, projeção
no ritmo, ações de hoje com horário, sequência, dia do ciclo. A IA lê isso e
escolhe o assunto, se cabe cobrar ou tirar o peso, ou se é melhor calar. Depois
escreve a fala no tom da pessoa.

As frases prontas de `constants/oracleSpeechLibrary.ts` foram o jeito de ter um
Oráculo **sem** IA. Com IA, a meta é responder **melhor** que elas, não
imitá-las. Elas continuam servindo de exemplo do jeito de falar (seco, curto,
sem exclamação, sem elogio genérico) e de reserva quando a IA não responder.

O validador que a sessão da nuvem escreveu
(`supabase/functions/_shared/oracle-ai-voice.ts`) **não é a base do projeto**.
O Afonso não quer ele como critério. Fica no código sem uso até decidir o
contrário.

## O modelo: Claude Haiku 5.5

Testado pelo Afonso no chat do OpenRouter em 02/11, com os três finalistas e
dois prompts:

- `docs/oraculo-ia/prompt-teste-ia-decide.txt` — dia normal, com um assunto
  óbvio (Leitura atrasada e a sessão de hoje ainda aberta).
- `docs/oraculo-ia/prompt-teste-dia-ruim.txt` — 23h10, dia zerado, ciclo
  acabando amanhã, com a opção de calar. Testa o julgamento.

| | Rodada 1 | Rodada 2 | Qualidade |
|---|---|---|---|
| **Haiku 5.5** | 5,7 s · 1k tokens · US$ 0,00064 | 7,8 s · 1k · US$ 0,00075 | 1º nas duas. Os 4 tons são realmente diferentes, tem bom senso ("a esta hora, cobrar pesaria mais do que ajudaria") e soa natural. Defeito: às vezes fala um pouco demais. |
| DeepSeek V4.1 Flash | 15,2 s · 5k · US$ 0,0025 | 27,6 s · 6k · US$ 0,00078 | 2º. Tem lampejos ótimos (foi o único que viu que o Corpo em 19 de 20 fecha com uma ação), mas repete a mesma abertura nos tons e às vezes é duro. Lento porque raciocina antes de responder. |
| Qwen3.7 Flash | 17,4 s · 2k · US$ 0,0058 | 38,6 s · 4k · US$ 0,0108 | 3º. Robótico ("com 0 de 4 ações de hoje e 23:10"), não nomeia a ação, conselho sem lógica. O mais lento e o mais caro. Fora. |

O Haiku vence nos três critérios ao mesmo tempo: escreve melhor, é o mais
rápido e custa o mesmo ou menos. Se quiser tirar a dúvida do DeepSeek, roda a
rodada 2 de novo com o raciocínio desligado.

O que medir em qualquer teste novo, nesta ordem:

1. **Escolheu o assunto certo?** O que dá para fazer hoje vem antes do que já
   está quase pronto.
2. **Os 4 tons fazem papéis diferentes?** É o que o Premium vende.
3. **Teve bom senso?** Não cobrar às 23h de um dia zerado.
4. **Escrita do Glyph?** Seca, curta, sem soar traduzido, nomeando a ação.
5. **Tempo, tokens e custo.**

## Custo

Medido, não da tabela: **US$ 0,00075 por fala, uns R$ 0,004.** A tabela de
preços da versão anterior punha o Haiku a US$ 0,10 por milhão de entrada; pelo
custo real, a chamada sai 2 a 3 vezes mais cara que isso. Vale o custo medido.

Limites: **5 falas por dia no Premium e 15 no Platinum.** No pior caso, quem
usa tudo, todo dia:

| Plano | Falas no mês | Custo no mês | Sobre a receita líquida |
|---|---|---|---|
| Premium | 150 | ~R$ 0,62 | ~5% de R$ 12,74 |
| Platinum | 450 | ~R$ 1,86 | ~7% de R$ 25,49 |

Quem usa já pagou, então o uso normal não dá prejuízo.

## Os buracos que dão prejuízo, e a proteção

1. **Limite contado no app.** Um APK modificado ignora. O contador fica no
   servidor, no dia operacional (virada às 4h), igual às fichas de vínculo.
2. **Bug em loop**, como um cron que repete. A proteção é o **teto de gasto na
   chave do OpenRouter**, que corta sozinho.
3. **Premium sem dinheiro:** cupom, convite, GM, staff, plano de presente. Usam
   IA sem receita. Hoje são poucos.
4. **Reembolso na Play.** O prejuízo fica no mês usado, uns R$ 0,62.

A chave **nunca vai no app**: o AAB está na Play e qualquer um descompacta. Ela
fica no servidor (secrets do Supabase), com teto de gasto.

## Ainda não decidido

- **Só Premium ou todo mundo?** É decisão de receita, do Afonso. Recomendação:
  só Premium e Platinum. O tom já é o que o plano vende, e o grátis segue com a
  frase fixa do tom neutro, como hoje.
- **Retentativa** quando a IA falha ou demora.
- **Cache do prompt.** A sessão da nuvem achou que pode atrapalhar, porque
  ficaria sempre quente. Não decidido.
- **Onde exatamente guardar a chave** (secrets do Supabase é o caminho, falta
  fechar).
- **Diário.** A v1 manda só números. Texto do Diário fica para depois, porque
  envolve conteúdo sensível e a Política de Privacidade.

## Onde isso mora no código

- O servidor do Oráculo é `supabase/functions/oracle/index.ts`. A decisão de
  hoje vem do **motor v2 do Codex** (`supabase/functions/_shared/oracle-engine-v2.ts`)
  e os fatos de `oracle-engine-facts.ts`. Esses arquivos são do Codex:
  **combinar com ele antes de mexer.**
- `supabase/functions/_shared/oracle-host-voice.ts` tem as superfícies (push,
  balão, chat, card), os estados e os modos. Ainda é importado pela função.
- Os tons: `ORACLE_PREMIUM_TONES` em `constants/oracleSpeechLibrary.ts` (coach,
  reflexivo, calmo são pagos; neutro é grátis).

## O que construir (quando o Afonso der o ok)

1. **Adaptador do provedor**: OpenRouter fixado no Haiku 5.5, `max_tokens`
   baixo, raciocínio desligado.
2. **Montador do prompt**: os dados do dia, que já saem do motor de fatos, mais
   o tom da pessoa e as regras de voz dos prompts de teste.
3. **Reserva**: se a IA não responder a tempo ou falhar, entra a frase fixa de
   hoje. O pior caso é o app atual.
4. **Cota no servidor**: 5 e 15 por dia operacional, contando o que foi
   entregue.
5. **Teto de gasto** na chave.
6. **Portão de plano**, conforme a decisão de Premium.

A IA entra como substituta da escolha da fala no motor do Codex. Por isso o
primeiro passo de código é combinar com ele onde ela entra.

## Incidente de segurança resolvido

O `lista.ts`, apagado em `93189e5` (20/09), levava uma chave do OpenRouter no
código desde `a2d92a5`, e o repositório `arabeco/game-of-life` é público. O
Afonso **apagou essa chave no OpenRouter em 02/11**. Revogar é o conserto;
reescrever o histórico não adiantaria.
