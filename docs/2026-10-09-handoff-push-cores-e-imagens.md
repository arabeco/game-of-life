# Handoff — as cores e as imagens do push do Oráculo

Para quem vai desenhar. **Só imagens e cores: não mexa no código.** O Claude
liga tudo nas funções do servidor (`supabase/functions/web-push` e
`supabase/functions/oracle`) depois que as imagens existirem. Duas IAs no
mesmo arquivo se atropelam.

---

## 1. O que é

O Glyph manda até dois pushes por dia:

- **Leitura do ciclo**, por volta das 7h. Exemplo: *"Seu ciclo está indo bem:
  45%, dia 6 de 14. Hoje tem 5 ações no seu planner."*
- **Card de Sabedoria**, umas 7h30 depois. É uma frase do tema que a pessoa
  escolheu.

Hoje os dois chegam iguais: só texto, sem cor e sem imagem. A ideia é que cada
push tenha:

1. **Uma cor de destaque.** O Android pinta com ela o ícone pequeno e o nome
   "Glyph" na notificação. O fundo da notificação não pode ser colorido, porque
   o sistema não deixa.
2. **Uma imagem grande**, que aparece quando a pessoa expande a notificação. Em
   muitos Android ela também vira uma miniatura do lado, com a notificação
   fechada.

A imagem é **a marca do Oráculo acesa na cor do tom**, como ela já aparece
dentro do app.

---

## 2. A marca do Oráculo no app

- Componente: `components/OracleSpeakerMark.tsx`.
- Desenho do losango: `GameLogoIcon` em `components/Icons.tsx`, e o PNG
  `public/logo-diamond.png` (500×500, transparente).

**A regra do app: a casca fica dourada sempre, e a cor muda só no miolo e no
brilho em volta.** A marca nunca vira verde ou vermelha inteira: ela continua
sendo o Oráculo, e a cor só informa.

Cores do miolo e do brilho no app (`TONE_TOKENS` em `OracleSpeakerMark.tsx`):

| Tom | Nome no app | Miolo | Brilho |
|---|---|---|---|
| `neutral` | Oráculo | `#f3d48a` | `rgba(243,212,138,0.2)` |
| `guide` | Guia | `#9fd8ff` | `rgba(159,216,255,0.20)` |
| `success` | Progresso | `#7cf5b1` | `rgba(124,245,177,0.22)` |

Casca e borda: dourado, `rgba(243,212,138,0.46)`. Fundo do círculo: um
gradiente de `rgba(45,38,28,0.98)` para preto.

---

## 3. Qual push usa qual tom — revisão de 09/10

| Push | Tom |
|---|---|
| Leitura destaca uma conquista confirmada | `success` (verde, Progresso) |
| Leitura: ciclo começa hoje | `guide` (azul, Guia) |
| Leitura geral do ciclo ou da rodada, sem julgamento de ritmo | `neutral` (dourado, Oráculo) |
| Leitura: prazo do ciclo acabou | `guide` (azul, Guia) |
| Card de Sabedoria | `neutral` (dourado, Oráculo) |

**Vermelho e amarelo de alerta ficam de fora**, para o push nunca soar como
bronca.

Se quiserem mudar alguma cor ou tom, escrevam aqui. O Claude lê esta tabela.

---

## 4. As três imagens

| Arquivo | Tom |
|---|---|
| `oraculo-push-oraculo.png` | `neutral`, dourado |
| `oraculo-push-guia.png` | `guide`, azul |
| `oraculo-push-progresso.png` | `success`, verde |

**Formato:**

- **1024 × 512 px** (proporção 2:1), PNG ou JPG, **até ~300 KB**. O Android
  tem limite de 1 MB no FCM. A proporção 2:1 é uma escolha de composição; o
  recorte e a miniatura variam conforme versão do sistema e aparelho.
- **Fundo escuro e opaco**, sem transparência, no tom do app: quase preto,
  levemente quente. Imagem transparente vira fundo branco em alguns aparelhos.
- **A marca centralizada, ocupando uns 60% da altura.** Com a notificação
  fechada, o Android pode mostrar só o **quadrado do centro** (512×512) como
  miniatura. Então nada importante fora desse quadrado.
- **Sem texto dentro da imagem.** O texto do push já vem por cima, e letra
  dentro da figura fica ilegível na miniatura.
- O brilho do tom pode se espalhar pelo fundo, de leve, mas a casca continua
  dourada.

---

## 5. A cor de destaque (o "pinta o ícone")

Ela aparece pequena, no ícone e no nome do app, **em cima de fundo claro e de
fundo escuro**, porque a gaveta de notificações muda com o tema do celular. Os
tons do miolo (`#7cf5b1`, `#9fd8ff`, `#f3d48a`) são claros demais e somem no
fundo branco.

Proposta, para conferir num celular com tema claro e com tema escuro:

| Tom | Cor de destaque |
|---|---|
| `neutral` | `#C9A23A` |
| `guide` | `#3B9EE6` |
| `success` | `#2FBF71` |

Escolham as definitivas e anotem nesta tabela.

---

## 6. Onde entregar

1. Salvar as três em `public/assets/oracle/push/` com os nomes da seção 4.
2. O celular só consegue baixar a imagem por um endereço público. Enquanto o
   site não for publicado com essa pasta, o Afonso sobe as mesmas três no
   bucket `user-images` do Supabase, numa pasta `oracle/`, com os mesmos nomes.

O resto é do Claude: o servidor passa a mandar a cor e a imagem de cada push, e
o Afonso testa no celular.


## 7. Comparação visual antes da entrega — 09/10

Afonso levantou que o logo já aparece no ícone do push. A imagem grande deixou de ser obrigatória. Comparar antes de produzir os arquivos finais:

- A: só texto e cor, sem imagem.
- B: atmosfera abstrata, com luz discreta e sem logo.
- C: a mesma atmosfera com marca pequena, sem texto.

Prévia: `tools/oracle-push-preview.html`, servida pela bancada em
`http://127.0.0.1:3016/oracle-push-preview.html`. Comparação fechada/expandida e clara/escura, com troca de cenário e paleta. É simulação, não prova de renderização Android. Não há alteração nos emissores de push.

A leitura do ciclo e da rodada usa o motor V2. Os outros textos são exemplos editoriais identificados na página. "Indo bem/abaixo do ritmo" não deve voltar como regra para escolher cores.

Paleta alternativa em avaliação: dourado `#947322`, azul `#2475AC`, verde `#24844F`. A original continua disponível na prévia. Ambas usam a mesma cor nos dois temas; nenhuma está aprovada como definitiva. Brilhos das imagens mantêm os tons claros do app.

Os nomes e diretório da seção 4/6 ficam reservados para a opção escolhida. Nesta etapa não foram gerados arquivos finais nem publicados assets. Depois da escolha, testar no aparelho: notificação fechada, expandida e gaveta clara/escura. Não presumir miniatura obrigatória nem recorte exato.


## 8. Primeira integração local (09/10) — régua substituída pela seção 9

Escolhida a opcao sem imagem. As alternativas da secao 7 sao apenas historico.
- Dourado: leitura geral, estoque, sabedoria.
- Azul: orientacao, retorno, inicio e prazo encerrado.
- Verde: conclusao/progresso confirmado; leitura verde so quando a meta destacada ou o ciclo esta completo.
- Narrador independente da cor. Sem regra de ritmo esperado, atraso ou sequencia.

Implementado em oracle-visual-tone.ts, compartilhado entre app e servidor. Leitura automatica salva context_snapshot.visualTone; registros antigos sem metadado ficam neutros. Sabedoria permanece neutra. Aberturas e reacoes continuam temporarias.

Chat e balao usam marca dourada com nucleo colorido e gradiente discreto. Missao individual preservada. Android envia android.notification.color e accentColor nos dados, consumido como iconColor pela notificacao local quando o app esta aberto. Sem imagem e sem alterar fundo nativo.

Paleta Android implementada: #947322, #2475AC, #24844F. Previa final: tools/oracle-colors-preview.html (marca real, textos ilustrativos, push simulado).

Validacao local: TypeScript, regressoes de leitura/motor/classificacao, bundles das duas funcoes com imports Deno externos. Nenhum deploy ou teste em aparelho efetuado. Para chegar aos aparelhos: publicar oracle e web-push; atualizar app para os cards e a cor com app aberto. Mensagens antigas nao sao reclassificadas.

## 9. Régua aprovada — branco, azul, verde e dourado

Esta seção substitui as classificações de cores anteriores. Decisão de produto aprovada; a nova régua ainda não foi aplicada ao motor nem aos emissores. O pedido nesta etapa é registrar a decisão e deixá-la em commit para continuidade.

| Cor do símbolo | Intenção principal | Exemplo |
| --- | --- | --- |
| Branco sobre fundo escuro | Informação neutra: ciclo, planner, estoque e sabedoria | “Seu ciclo está em 40%. Faltam 8 dias.” |
| Azul | Orientação, começo ou retorno | “Bom te ver de volta. Escolha por onde continuar.” |
| Verde | Avanço concreto, ainda em andamento | “3/5 nessa ação. Faltam 2.” |
| Dourado | Conquista completa | “Meta cumprida.” |
| Vermelho | Reservado, sem gatilho automático aprovado | Não usar por enquanto. |

### Regras para classificar sem cobrar indevidamente

- Classificar pela intenção principal da fala, não pelo narrador, canal, tema de sabedoria ou uma palavra isolada.
- Leitura geral continua neutra mesmo se mencionar uma conquista de passagem. Uma reação dedicada à conquista completa é dourada.
- Uma reação de progresso parcial é verde. Retorno com orientação é azul.
- Prazo encerrado, por si só, é informação neutra: “O prazo terminou. Veja seu fechamento.” Não implica azul ou vermelho automaticamente.
- Não usar vermelho para inatividade, falta de agendamento, percentual baixo, fim do ciclo ou fins de semana. Não comparar com ritmo diário esperado nem reintroduzir cobrança de sequência.
- A pessoa pode concluir direto do estoque. Não tratar ausência de planejamento como falta de progresso.
- Sabedoria começa neutra; o título identifica seu tema. Missão individual mantém seu funcionamento, sem reformulação do texto nesta etapa.
- Em caso de ambiguidade ou metadado ausente, usar neutro. Não deduzir conquista por percentual arredondado.

### Símbolo aprovado visualmente

O usuário preferiu a proposta sem bolinha central: o próprio símbolo recebe a cor, com fundo escuro, borda fina e brilho suave. A comparação está em `tools/oracle-colors-preview.tsx` / `.html`, usando a silhueta do `GameLogoIcon`. É somente uma prévia: `OracleSpeakerMark.tsx` ainda mantém o desenho anterior no app.

### Continuidade para a outra IA

1. Aplicar o símbolo aprovado ao componente compartilhado, preservando tamanhos e usos existentes.
2. Separar avanço verde de conquista dourada no contrato compartilhado de tons; hoje `success` reúne os dois e `neutral` ainda é dourado.
3. Propagar a régua para abertura, reação, leitura manual, leitura automática, cards e metadados de push, mantendo narradores independentes.
4. Definir os valores finais das cores. Branco sobre fundo escuro é a direção interna do app; não enviar branco cegamente ao Android, cujo fundo claro/escuro é controlado pelo sistema. Validar contraste em aparelho antes de fechar o neutro do push.
5. Manter push sem imagem. O destaque nativo e o card dentro do app são apresentações distintas; não prometer gradiente no fundo da notificação Android.

Este registro e a prévia não constituem deploy, atualização Android nem validação em aparelho.
