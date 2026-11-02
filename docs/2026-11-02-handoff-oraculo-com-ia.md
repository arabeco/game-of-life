# Oráculo com IA — passagem de 02/11/2026

Conversa de desenho com o Afonso. **Nada está ligado**: não há chamada de rede,
provedor escolhido nem prompt em produção. O que existe no código é só o
validador, que é puro e independe de qual modelo venha a ser usado.

O teste de voz entre os finalistas **não chegou a rodar**: o `openrouter.ai`
está fora da política de rede da sessão de nuvem e não havia credencial de
nenhum provedor no ambiente. O Afonso vai seguir numa conversa local.

## A decisão de arquitetura

A IA **não decide o que o Oráculo diz**. Decidir continua onde já está, em
`utils/oracleCoach.ts` e `utils/oracleMasterState.ts`, que são determinísticos.
A IA entra só como **voz**, em três camadas:

1. **Fatos** — o código calcula ("Leitura, 4 de 12, faltam 7 dias, no ritmo
   atual fecha com 6"). Sem IA. Esses números nunca erram.
2. **Decisão** — o motor escolhe qual mensagem cabe hoje, e se cabe alguma.
   Sem IA. Importa que o modelo não possa decidir cutucar ninguém.
3. **Voz** — a IA recebe a intenção escolhida e os números prontos, e escreve
   duas ou três frases no tom.

O validador confere o que voltou. Reprovado, usa-se a frase canônica de hoje.
**Por isso o pior caso da IA é exatamente o app atual, nunca pior.**

Existe um degrau ainda mais seguro, se quiser começar raso: o código gera N
frases candidatas e a IA devolve só o índice da que cabe melhor. Ela não
escreve nada, então não tem como errar número.

## O que já descobrimos no próprio código

Duas coisas que encurtam muito o trabalho:

- **O andaime da IA nunca saiu.** `supabase/functions/_shared/oracle-host-voice.ts`
  continua vivo e importado por `supabase/functions/oracle/index.ts`. Ele tem
  7 modos, 4 superfícies (push, balão, chat, card), 13 estados operacionais
  (`em_risco`, `retomando`, `streak_quebrada`...) e o contrato de fatos já
  tipado. **As camadas 1 e 2 já existem.** É religar, não construir.
- **O tom já é recurso pago.** `constants/oracleSpeechLibrary.ts` define
  `ORACLE_PREMIUM_TONES` = coach, reflexivo, calmo; neutro é o grátis. Hoje são
  arrays de frase fixa. Com IA viram vozes de verdade, o Premium passa a
  entregar o que vende, e o custo fica limitado a quem paga.
- **O few-shot já está escrito.** A mesma biblioteca tem cada evento nos quatro
  tons, na voz certa (seca, curta, sem exclamação, sem elogio genérico). É o
  material de treino, pronto, feito pelo Afonso.

## O que está no código agora

Commit `f34253e`, no branch `claude/miniatura-barra-ciclo`:

- `supabase/functions/_shared/oracle-ai-voice.ts` — o validador. Puro, sem rede.
- `tests/oracle-ai-voice.regression.mjs` — 16 asserções, registrado como
  `npm run test:oracle-ai-voice`. Passa.

O validador reprova:

| Checagem | Por quê |
|---|---|
| Número fora dos fatos | Em `4 de 12`, o `8` que falta é dedutível mas não foi dado. Quem precisa dele manda o 8 **dentro dos fatos**; o modelo não soma. |
| Número por extenso | Pega `oito` também, senão bastava escrever por extenso para furar a regra. `quatro` passa se o 4 veio nos fatos. |
| Economia | EXP, ouro, baú, item, recompensa, fragmento. Promessa alucinada de prêmio vira ticket de suporte. |
| Elogio genérico | parabéns, continue assim, você consegue. A própria biblioteca já recusa: "elogio de tamanho único é o mesmo que não comentar". |
| Forma | emoji, exclamação, mais de 2 frases, mais de 240 caracteres. |

Há um caso explícito contra falso positivo: *"a experiência do ciclo mudou"*
passa, porque `exp` dentro de `experiência` não é a sigla.

**A taxa de reprovação é a métrica que importa.** Alta quer dizer prompt ruim,
não modelo ruim.

## Decisões já tomadas com o Afonso

- **Só números na v1.** Nada de texto do Diário para a IA. Evita de uma vez
  resposta a conteúdo sensível e evita declarar envio de dado pessoal na
  Política de Privacidade. Melhora depois.
- **Limites:** Premium 15/dia, Platinum 50/dia. (Começou em 5 e 15; a simulação
  mostrou que era conservador demais.)
- **A cota conta entrega, não chamada.** Retentativa é problema do servidor, não
  do usuário:

  | Aconteceu | Entrega | Gasta cota |
  |---|---|---|
  | IA acertou de primeira | fala da IA | sim |
  | Errou, retentativa acertou | fala da IA | sim, uma só |
  | Errou e caiu na frase canônica | fala fixa | **não** |

- **Sem retentativa na v1.** Retentativa trata sintoma. Sobe sem ela, mede a
  reprovação. 2% torna retentativa inútil; 25% quer dizer prompt ruim, e
  retentar paga duas vezes pelo mesmo erro.
- **Limite contado no servidor**, no banco, pelo **dia operacional (virada às
  4h)**, igual ao resto do app. APK modificado ignora contador local; já é o
  padrão das fichas de vínculo e das campanhas.
- **`max_tokens` travado** (~200 em produção) e **raciocínio desligado**.

## Preços levantados (02/11/2026 — confira, isso envelhece rápido)

Por 1 milhão de tokens, entrada / saída:

| Modelo | Entrada | Saída |
|---|---|---|
| Qwen3.7 Flash | $0,03 | $0,13 | (até 32K de prompt) |
| DeepSeek V4.1 Flash | $0,035 | $0,139 | **ver armadilha abaixo** |
| DeepSeek V4 Flash 0731 | $0,059 | $0,30 |
| Claude Haiku 5.5 | $0,10 | $0,50 |
| GLM-5.3-Flash | $0,15 | $0,50 |
| GLM-4.7-Flash | grátis | grátis |
| Gemini 2.5 Flash-Lite | ~$0,10 | ~$0,40 |
| MiniMax M3 | $0,30 | $1,20 |
| Gemini 3.x Flash | $0,75–1,50 | $3,75–9,00 |
| Kimi K3 | $3,00 | $15,00 |

**A armadilha do DeepSeek.** Aquele $0,0348 é a **Baidu Qianfan com 88% de
desconto**. O preço de tabela dela é **$0,30 / $1,20** — oito vezes mais, e mais
caro que o Haiku. No OpenRouter o mesmo modelo tem sete provedores, com entrada
de $0,035 a $0,225 e saída de $0,18 a $0,90:

| Provedor (mesmo DeepSeek V4.1 Flash) | Entrada | Saída | Cache | Latência |
|---|---|---|---|---|
| Baidu Qianfan (88% off, promo) | $0,0348 | $0,1392 | $0,0007 | 0,82s |
| Relace | $0,035 | $0,50 | $0,005 | 0,52s |
| Wafer US | $0,045 | $0,50 | $0,006 | **0,22s** |
| Decart | $0,09 | $0,18 | $0,018 | 0,81s |
| CoreWeave | $0,13 | $0,65 | $0,002 | 0,66s |
| DigitalOcean | $0,225 | $0,90 | $0,006 | 0,62s |

**Nunca usar roteamento Floor ("mais barato").** Ele joga na promoção do dia,
que hoje é a Baidu, na China: custo imprevisível, dado saindo do país e 0,82s de
latência. **Fixar o provedor.**

## Simulação de custo

Premissas: prompt fixo 1.800 tokens (cacheado, igual para todos), fatos 350,
resposta 130. Uso médio 50% do limite. Dólar a R$ 5,50. Receita líquida após os
15% da Play: Premium R$ 12,74, Platinum R$ 25,49.

Com limites de 15 e 50, +15% de sobrecusto de retentativa, **com cache**:

| Modelo | Premium (225 msg/mês) | Platinum (750 msg/mês) |
|---|---|---|
| Qwen3.7 Flash | R$ 0,07 | R$ 0,22 |
| DeepSeek via Relace | R$ 0,12 | R$ 0,41 |
| DeepSeek via Wafer US | R$ 0,13 | R$ 0,43 |
| Claude Haiku 5.5 | R$ 0,17 | R$ 0,56 |
| DeepSeek via Baidu, preço de tabela | R$ 0,39 | R$ 1,29 |

Pior caso da tabela, Haiku sem cache nenhum: **3,1% da receita Premium e 5,2% da
Platinum**. O usuário que estoura o limite todo dia, no Platinum sem cache, chega
a 10,4% — o único número que merece olho, e é o cache que o derruba para 4,4%.

**O cache não é otimização, é requisito.** É ele que paga o limite generoso.

Em escala, 1.000 Premium + 200 Platinum no Haiku com cache: **R$ 280/mês** contra
R$ 17.838 de receita líquida, 1,6%.

**Conclusão de custo: não existe diferença que importe entre os candidatos.** A
distância do mais barato ao mais caro é R$ 0,15 por Platinum por mês. Com 200
Platinum, R$ 30/mês. A decisão é de **português e latência**, não de preço.

## Os três finalistas, e por quê

1. **Qwen3.7 Flash** — o mais barato de todos, com margem real.
2. **DeepSeek V4.1 Flash, provedor Wafer US fixado** — a 0,22s é o mais rápido da
   lista e fica nos EUA, que do Brasil é muito mais perto que a China. Paga
   R$ 0,02 a mais por assinante que o Relace e entrega menos da metade da
   latência; o usuário sente a latência, não os R$ 0,02.
3. **Claude Haiku 5.5** — o mais caro dos três, e a diferença é R$ 0,15 por
   Platinum por mês.

Ficaram de fora: Kimi K3 (caro feito modelo grande), Gemini 3.x Flash (subiu
muito de preço), MiniMax M3, GLM (não entrou no corte de voz), e os modelos
grandes em geral, que não se justificam para parafrasear fatos prontos.

**O motivo de o preço não decidir:** o produto aqui é o tom, vendido em quatro
vozes. Qwen, DeepSeek e GLM são treinadas pesado em chinês e inglês, e o pt-BR
delas muita hora soa traduzido. Economizar R$ 30/mês e entregar texto traduzido
num recurso que as pessoas assinam de propósito seria o pior dos dois mundos.

## O teste de voz, pronto para rodar

- Prompt: `docs/oraculo-ia/prompt-teste-de-voz.txt`. Montado com as falas reais
  da biblioteca, para medir **a voz do Glyph** e não uma genérica. Pede duas
  situações (uma de notícia ruim, uma de retomada) nos quatro tons = 8 saídas.
- Runner: `tools/teste-de-voz-oraculo.mjs`. Resolve o slug exato pelo catálogo do
  OpenRouter, roda 3 amostras por modelo, raciocínio desligado e temperatura
  fixa nos três, fixa o provedor Wafer US no DeepSeek, e grava em
  `docs/oraculo-ia/resultado-teste-de-voz.md`. Precisa de `OPENROUTER_API_KEY`.
  Custo da rodada inteira: menos de um centavo de dólar.

**Três amostras, não uma**: uma geração é sorte, e o que se quer saber é se o
modelo é consistente nos quatro tons.

O que medir, em ordem de peso:

1. **Os quatro tons saem mesmo diferentes?** É o teste principal, porque é isso
   que o Premium vende. Quatro saídas parecidas reprovam o modelo.
2. **Inventou número?** Os fatos da situação A não trazem o "8 que falta" nem os
   "33%", de propósito. Passar cada saída pelo `validarFala` dá o número
   objetivo: quantas reprovam por modelo.
3. **Deu a notícia ruim sem cobrar?** Na situação A a pessoa prometeu 12 e vai
   fechar com 6. Modelo ruim escorrega para "não desista, você consegue".
4. **Soa traduzido?** Frase longa, "jornada", "sua caminhada", gerúndio
   empilhado, exclamação. A voz do Glyph é seca e curta.
5. **Obedeceu o formato?** 8 linhas, nada antes nem depois.

## O que falta construir

1. **Adaptador de provedor** (~20 linhas, trocável). É o que permite plugar o
   vencedor numa linha.
2. **Montador de prompt** a partir do `oracle-host-voice.ts` e dos quatro tons da
   `oracleSpeechLibrary`.
3. **Fallback** para a frase canônica quando o validador reprova.
4. **Cota no servidor**, por entrega, no dia operacional das 4h.
5. **Portão de Premium**, se a decisão for essa.
6. **Prompt caching** — não é opcional, ver simulação.

Decisão de produto ainda **em aberto**: a voz por IA é só Premium ou para todo
mundo? O tom já é pago hoje, o que empurra para só Premium, mas é decisão de
receita e é do Afonso.

## Onde rodar, e a chave

A função `oracle` já roda em cron, já tem o contexto e já tem o canal de push. A
chave vive nos **secrets do Supabase** e só a Edge Function a enxerga.

**Nunca no app.** O AAB está na Play e qualquer um descompacta.

### Incidente de segurança resolvido em 02/11

O `lista.ts`, apagado em `93189e5` (20/09), levava uma chave do OpenRouter
escrita no código desde `a2d92a5`. **O repositório `arabeco/game-of-life` é
público**, então a chave (`sk-or-v1-64a579…`, 73 caracteres) ficou legível no
histórico para qualquer um.

O Afonso **deletou a chave no OpenRouter em 02/11**. Esse é o conserto de
verdade: revogar, não esconder. Reescrever o histórico não resolveria, porque o
histórico público já foi para forks, mirrors e caches fora do controle dele.

## Estado do branch

A `main` já está em `6e7c1f7` (versão 1.0.123). O trabalho de interface desta
sessão **já foi mesclado** pelo merge `ad62455`:

- `0316516` — barra do ciclo conta só dias completos; miniatura sem o certinho,
  sem vínculo por ação e sem o infinito. **Em `main`.**
- `95a6a3e` — tela de escolha Essencial/Imersivo com fundo opaco (era declaração
  CSS inválida) e cor por cartão; marco agendado com tracejado no planner;
  miniatura só com o emoji. **Em `main`.**

Falta mesclar só o desta passagem, no branch `claude/miniatura-barra-ciclo`,
sem PR aberto:

- `f34253e` — o validador, o prompt de teste, o runner e este documento.

O branch está atrás da `main`; vale rebasear antes de abrir PR. O conflito
esperado é nenhum: são arquivos novos mais uma linha em `package.json`.

Pendência separada, já anotada na prancheta: **arena com muitas ações fica lenta
em celular fraco**. A suspeita é re-render — cada ação da miniatura chamava
`useGame()` e refazia buscas próprias. O `ActionIcon` da miniatura já parou de
fazê-las no `95a6a3e`. Falta medir no aparelho antes de mexer em mais nada.
