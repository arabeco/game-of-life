# Missão de clã — desenho (12/10/2026)

## Por quê

O Afonso abre o app 5 vezes por dia para marcar e nunca entra na tela do clã. Ele quer entrar lá todo dia para xeretar, contribuir e se expressar, e quer que a novidade se encaixe no que já existe (arenas, planner, nível) em vez de virar um sistema à parte. Do social ele espera dopamina, reconhecimento e cooperação.

As missões de clã antigas foram desligadas por serem "muito joguinho, pouca simplicidade": o líder criava uma prioridade na mão e surgia uma arena "Clan Office" no planner. Isso continua desligado (`clanMissions: false`).

**Esta decisão revoga a nota de 22/09/2026** em `acceptSeasonQuest` ("missão de clã não se pega e não ganha arena"). Agora ela se pega e ganha arena, porque é a arena que leva a missão para dentro do planner de quem entrou.

## Como funciona para o jogador

1. **Na tela do clã** (MUNDO › Social › Clã) aparece o cartão da missão da temporada, com a mesma cara das missões da temporada:
   - nome e descrição no imperativo;
   - barra do grupo em **X/Y**, nunca em %;
   - os rostos de quem entrou, cada um com quanto fez;
   - o botão **Entrar**, no estilo do botão de missão do Oráculo.
2. **Ao entrar**, a arena da missão (nome = título da missão) aparece no ArenasView com uma **tag de clã**, igual à tag da parceria, e a ação vai para o planner.
3. **Toda vez que um participante marca ou desmarca** a ação, a barra muda para todos. O número sai das tarefas marcadas.
4. **Quando o grupo bate a meta**, o cartão e a arena mostram "Receber". Quem entrou recebe um **baú Raro**, entregue pelo ritual de recompensa que já existe. A arena fica no ArenasView como concluída. **Só ganha quem entrou.**
5. **Se a temporada termina sem a meta batida, a missão some**: a arena é arquivada e o cartão sai da tela do clã. Nada é apagado.
6. **O baú não é de temporada.** A coleção da temporada é contada em 3 baús para 3 peças, e um baú de temporada a mais quebraria a conta.
7. A mesma missão aparece em MUNDO › Temporada, com o mesmo botão Entrar.

**Missão de teste:** "Socializar", na Genesis (`season-genesis-0`, vence em 01/01/2027). A meta é o grupo completar 20 vezes. O prêmio é um baú Raro por participante.

## Por dentro

**Fonte da verdade no servidor.** A barra nunca vem de um contador que alguém incrementa (era o `update_clan_mission_progress`, que podia se perder). Ela é a contagem das tarefas concluídas dos participantes, contada na hora.

- `clan_quests`: guarda a meta, a temporada, o fim e o baú de cada missão (`id`, `season_id`, `goal`, `ends_on`, `reward_chest`). O texto e a ação ficam em `constants/seasonContent.ts`, e um teste garante que a meta e o fim batem com o servidor.
- `clan_quest_participants`: quem entrou (`quest_id`, `user_id`, `clan_id`, `action_id`, `joined_at`), uma linha por pessoa por missão. O cliente não escreve direto nela.
- `entrar_na_missao_de_cla(p_quest_id, p_action_id)`: confere que a pessoa está num clã, que a missão existe e ainda não venceu, e grava a participação. É idempotente.
- `status_da_missao_de_cla(p_quest_id)`: devolve meta, total, fim, se eu entrei, se já recebi, e a lista de participantes do meu clã com quanto cada um fez. Conta as tarefas concluídas da ação de cada participante, com data entre a entrada e o fim. Só enxerga o próprio clã. Quem saiu do clã para de contar.
- `receber_premio_da_missao_de_cla(p_quest_id)`: só para quem entrou, só com o total na meta, uma vez só (marcador `clan_quest`). Entrega `grant_chest(..., 'Raro')`.
- Tudo `security definer`, com grants só para `authenticated`. A migração pode ser rodada de novo sem estrago.

**Cliente.**

- Flag nova `clanSeasonQuests: true`. A missão de clã da temporada volta a aparecer; `clanMissions` (prioridade do líder e Clan Office) continua `false`.
- **Entrar:** cria a arena e a ação como `acceptSeasonQuest` faz para as individuais e chama `entrar_na_missao_de_cla`. Se o servidor recusar, desfaz a arena.
- **Progresso:** um gancho `useMissaoDoCla` lê o status ao abrir a tela do clã, ao abrir o ArenasView e depois de marcar ou desmarcar uma tarefa da ação da missão (com espera curta para juntar toques). Sem canal em tempo real, para não pesar no egress.
- A arena da missão no ArenasView mostra **total/meta do grupo** no lugar do progresso pessoal, mais a tag de clã.
- **Vencida:** se o status disser que venceu sem meta, o cliente arquiva a arena.

## Acertos de quebra

- **Arena compartilhada mostrando % e "brigando":** achar a causa (suspeita: duas fontes de progresso disputando, o `getSharedActionPoolProgress` em tempo real contra o progresso pessoal) e fazer ela mostrar X/Y como as outras arenas, sem oscilar.
- **Parceria:** revisar o que a arena da parceria mostra, quando vence (`expiresAt`: vencida congela) e a tag no ArenasView. Corrigir o que estiver estranho e descrever o resto para o Afonso.

## Barrinha de humor dos membros

- Na lista "Pessoas do grupo", embaixo do nome de cada membro, vai uma barrinha fina com o humor atual, nas cores e no rótulo do `MOODS_DATA` (as mesmas do modal de humor).
- O humor só é visto por quem é do mesmo clã. Ele não entra no cartão público: quem não é do clã continua sem ver.
- O servidor ganha `humor_do_meu_cla()`, que devolve `(user_id, mood)` dos membros do clã de quem pede, e nada se a pessoa não tem clã. É `security definer`, com grant só para `authenticated`, e fica na mesma migração.
- Sem humor registrado, a barrinha não aparece (nada de barra vazia fingindo 0).

## Fora deste desenho

- Ranking de clãs: escondido até decidirmos.
- Aviso do Oráculo quando o grupo bate a meta (mensagem e push "o clã fechou, seu baú está esperando"): próximo passo.
- Prioridade do líder e Clan Office: continuam desligados.

## Testes

- PGlite com a migração:
  - entrar, contar, desmarcar (o total cai), quem não entrou não recebe;
  - receber duas vezes paga uma vez;
  - missão vencida não aceita entrada;
  - outro clã não enxerga a lista.
- Regressão de cliente:
  - flags separadas;
  - "Entrar" cria a arena e chama a RPC;
  - a arena da missão mostra X/Y;
  - a vencida arquiva;
  - a meta e o fim batem com o servidor;
  - o baú não é de temporada.
- `tsc` e a suíte inteira. O teste `challenge-reward-flow` passa a olhar a flag nova onde for o caso.

## Ajustes do Afonso depois da revisão (12/10/2026)

- **"Se depositou, já era."** Quem sai do clã ou abandona a missão deixa no grupo o que fez, e não leva nada para o clã novo. Cada período dentro da missão é uma linha própria (`clan_quest_participants`, com `encerrada_em`). Sair do clã encerra o período por gatilho, e voltar abre um período novo, então o que se fez fora não entra. A contagem usa o momento da conclusão (`completed_at`). Quem saiu continua na lista do cartão, apagado e marcado "(saiu)", e não recebe o baú.
- **Humor sem registro:** quem nunca registrou humor aparece com a barra vazia (transparente, "sem dados"), e não com o 50 do cadastro. `humor_do_meu_cla()` devolve `registrado`, que verifica se a pessoa tem alguma linha em `mood_entries`.
- **A meta que vale é a do servidor** (`clan_quests.goal`). A arena e a Temporada usam a meta que vem no status; a do app fica só de reserva.
- **Aurora II sem missão de clã:** a `aurora-quest-cla-vigilia` saiu. Um teste garante que toda missão de clã tem semente em `clan_quests`.
- **`clan_quests`:** `revoke all` e só `select` para `authenticated`.
