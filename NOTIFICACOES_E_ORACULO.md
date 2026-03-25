# Notificacoes e Oraculo

## Estado Atual

### Canais existentes

- `Toast`
  - feedback imediato
  - nao tem historico
  - serve para sucesso, erro, confirmacao curta

- `Avisos`
  - vem da tabela `notifications`
  - aparecem no feed do Oraculo na aba `AVISOS`
  - usam `NotificationType`

- `Mensagens do Oraculo`
  - vem da tabela `oracle_messages`
  - aparecem na aba `ORACULO`
  - podem ser `feed`, `push` ou `chat`, mas hoje o app usa principalmente `feed`

- `Push local`
  - nao e push remoto de servidor
  - e notificacao local do navegador / service worker
  - dispara quando o app recebe evento novo e a aba nao esta visivel

- `Email`
  - existe para alguns convites e sinais importantes
  - hoje passa por `SupabaseService.sendNotificationEmail`

### Modos existentes

- `appMode`
  - `BASIC`
  - `GAME`

- `oracle activeMode`
  - `neutro`
  - `calmo`
  - `reflexivo`
  - `tatico`
  - `estrategico`
  - `coach`
  - `personalizado`

- `sentinelMode`
  - `soberano_ativo`
  - `apenas_necessarias`
  - `nao_ia`

### O que hoje controla visibilidade

- `appMode` controla bastante coisa
  - `BASIC` mostra menos avisos
  - `GAME` mostra quase tudo

- `activeMode` hoje muda principalmente:
  - tom do Oraculo
  - copy de alguns corpos de notificacao
  - visibilidade de `oracle_prompt`

- `sentinelMode` hoje controla o Oraculo automatico
  - `soberano_ativo`: fluxo normal
  - `apenas_necessarias`: so deixa o automatico passar em gatilho critico
  - `nao_ia`: troca o automatico por aviso sistemico sem IA

### O que hoje vai para push

#### Push de notificacao

Hoje vai para push local apenas se:

- a notificacao for nova
- o usuario estiver com `pushEnabled = true`
- a aba estiver oculta
- a notificacao for visivel para o perfil atual
- a notificacao tiver `badge = true`

#### Tipos que hoje sao empurrados com mais chance

- `mentor_invite`
- `friend_request`
- `friend_response`
- `clan_invite`
- `clan_response`
- `clan_mission_update`
- `cycle_ending`
- `season_ending`
- `reward_ready`
- `mission_redeemable`
- `codex_gift`
- `partnership_invite`
- `arena_access`
- `competition_result`
- `system`

#### Tipos que hoje ficam mais no app

- `friend_accepted`
- `clan_join`
- `cycle_finalized`
- `level_up`
- `title_unlocked`
- `oracle_prompt`

#### Push do Oraculo

Separado do sistema acima, o app tambem manda push local do Oraculo quando:

- chega nova `oracle_message`
- `pushEnabled = true`
- `notificationsEnabled = true`
- a aba esta oculta

#### Push de sessao local

Tambem existe push local no fim de uma acao da tela de bloqueio / foco:

- `Tempo encerrado`

## Problema de produto hoje

Hoje estao misturadas 3 camadas diferentes:

- `tom`
  - como o Oraculo fala

- `prioridade`
  - o que merece interromper

- `canal`
  - onde a coisa aparece

Isso gera ruido porque:

- um modo de voz esta influenciando visibilidade
- `push` esta preso em `badge`, nao em urgencia real
- `oracle_prompt` fica meio especial demais
- `BASIC` e `GAME` filtram bastante, mas sem uma matriz muito explicita

## Proposta Melhor

### Separar 3 eixos

#### 1. Modo de voz do assistente

Isso deve mexer so em:

- tom
- estrutura da fala
- grau de firmeza

Nao deve decidir sozinho:

- se vira push
- se aparece em avisos
- se ganha badge

#### 2. Modo de atencao

Esse sim decide:

- o que interrompe
- o que vira push
- o que fica so em inbox

#### 3. Classe da notificacao

Toda notificacao deve nascer com uma classe clara:

- `critica`
- `acionavel`
- `progresso`
- `ambiente`

## Modos recomendados

### Modo de atencao

#### `Essencial`

- so push de itens criticos e acionaveis com prazo
- inbox mostra criticas, acionaveis e progresso
- nada de pulso filosofico em push

#### `Equilibrado`

- push de criticas e acionaveis importantes
- inbox mostra tudo
- Oraculo pode aparecer no feed, mas nao deve interromper demais

#### `Ativo`

- push de criticas, acionaveis e alguns lembretes do Oraculo
- inbox mostra tudo
- mais presenca operacional

#### `Sistema`

- sem IA proativa
- push so de sistema e urgencia real
- inbox continua mostrando eventos normais

### Sugestao de mapeamento interno

- `soberano_ativo` -> `Ativo`
- `apenas_necessarias` -> `Essencial`
- `nao_ia` -> `Sistema`

## Classe recomendada por tipo

| Tipo | Classe | Inbox | Push Essencial | Push Equilibrado | Push Ativo |
|---|---|---:|---:|---:|---:|
| mentor_invite | acionavel | sim | sim | sim | sim |
| partnership_invite | acionavel | sim | sim | sim | sim |
| friend_request | acionavel | sim | nao | sim | sim |
| clan_invite | acionavel | sim | nao | sim | sim |
| clan_response | acionavel | sim | nao | sim | sim |
| friend_response | acionavel | sim | nao | sim | sim |
| codex_gift | acionavel | sim | sim | sim | sim |
| arena_access | acionavel | sim | nao | sim | sim |
| competition_result | critica | sim | sim | sim | sim |
| clan_mission_update | critica | sim | sim | sim | sim |
| cycle_ending | critica | sim | sim | sim | sim |
| season_ending | critica | sim | sim | sim | sim |
| reward_ready | progresso acionavel | sim | nao | opcional | sim |
| mission_redeemable | progresso acionavel | sim | nao | opcional | sim |
| cycle_finalized | progresso | sim | nao | nao | nao |
| level_up | progresso | sim | nao | nao | nao |
| title_unlocked | progresso | sim | nao | nao | nao |
| friend_accepted | ambiente | sim | nao | nao | nao |
| clan_join | ambiente | sim | nao | nao | nao |
| oracle_prompt | ambiente guiado | sim | nao | nao | opcional |
| system | critica | sim | sim | sim | sim |

## Como cada modo de voz deve agir

### `neutro`

- default
- sem empurrar demais
- ideal para `Equilibrado`

### `calmo`

- reduz urgencia verbal
- push so para critico e acionavel forte
- bom para usuarios sensiveis a sobrecarga

### `reflexivo`

- quase nada em push
- mais inbox e feed
- bom para leitura, nao para interrupcao

### `tatico`

- push curto, seco, objetivo
- so quando houver proximo passo real
- excelente para `Essencial` e `Ativo`

### `estrategico`

- pouco push imediato
- mais resumo, risco e consequencia
- bom para digests e avisos de ciclo

### `coach`

- pode usar push para compromisso, prazo e retorno ao trilho
- ainda assim so para itens acionaveis

### `personalizado`

- deve herdar regras de entrega do modo de atencao
- personaliza so o tom

## Regra de canal recomendada

### Toast

Usar apenas para:

- sucesso
- erro
- confirmacao de acao local
- operacao concluida

Nunca usar toast como substituto de inbox.

### Inbox / Avisos

Usar para:

- tudo que precisa de historico
- tudo que o usuario possa abrir depois
- todo evento social, sistemico ou de progresso

### Push

Usar apenas para:

- urgencia temporal
- convite acionavel
- resultado que pede resposta
- risco de ciclo
- timer encerrado

Nao usar push para:

- celebracao leve
- progresso cosmetico
- frase bonita
- oracle_prompt comum

### Oraculo Feed

Usar para:

- leitura interpretativa
- contexto
- diagnostico
- nudge

O feed do Oraculo nao deve virar log generico de sistema.

## Regra por app mode

### `BASIC`

- menos volume
- esconder ambiente e social leve
- mostrar so critico, acionavel e progresso claro
- push mais conservador

### `GAME`

- mostrar tudo
- permitir ambiente, progresso e sinais do mundo
- push ainda precisa obedecer prioridade real

## Melhorias que eu implementaria depois

### Curto prazo

- separar `badge` de `push`
- criar campo explicito `severity`
- criar campo explicito `deliveryPolicy`
- parar de usar `activeMode` para decidir visibilidade de aviso

### Medio prazo

- permitir politica por tipo:
  - `inboxOnly`
  - `pushAndInbox`
  - `feedOnly`
  - `toastOnly`

- criar resumo diario em vez de empilhar progresso pequeno

### Longo prazo

- push remoto de verdade
- batching inteligente
- janela de foco:
  - segurar push ambiente
  - liberar so critico

## Minha recomendacao pratica

Se eu mexer nisso agora, eu faria nesta ordem:

1. separar `modo de voz` de `modo de atencao`
2. definir `severity` por `NotificationType`
3. fazer `push` depender de `severity + attention mode`
4. deixar `activeMode` mexer so em copy
5. reduzir `oracle_prompt` para feed/inbox e quase nunca push

