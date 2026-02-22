# TELA DO ORÁCULO — Chat + Notificações

## ESTRUTURA DA TELA

O Oráculo é acessado pelo Glifo no header global. Ao abrir, tem duas sub-abas:

```
┌──────────────────────────┐
│  ◉ ORÁCULO           ⚙️  │
│  [ Chat | Notificações ] │
│──────────────────────────│
│                          │
│  (conteúdo da aba ativa) │
│                          │
└──────────────────────────┘
```

---

## ABA: CHAT

### Comportamento

O chat é a conversa com a IA. Quando o usuário abre, o Oráculo pode já ter **uma mensagem plantada** esperando. Essa mensagem é gerada em background (baseada no contexto do usuário) e fica lá até o usuário abrir o chat.

### Mensagem Plantada

- Aparece em **itálico**, como um pensamento solto do Oráculo
- O usuário pode responder e aprofundar a conversa
- Ou pode ignorar e perguntar qualquer outra coisa
- É um gancho, não uma obrigação
- Gerada pela IA usando o contexto do usuário (Sephirot, arenas, ciclo, etc.)
- Máximo 1 mensagem plantada por vez (a nova substitui a anterior)

Exemplo:

```
┌──────────────────────────┐
│                          │
│  "Sua Arena de Estudos   │
│   anda quieta. Será que  │
│   o escopo tá grande     │
│   demais?"               │
│                          │
│                          │
│                          │
│  Consulte o Oráculo...   │
└──────────────────────────┘
```

### O Oráculo como Tutor do App

O Oráculo conhece cada tela, cada botão, cada fluxo do app. Quando o usuário pergunta "como faço X?", ele responde com passo a passo preciso, não genérico.

O system prompt do Oráculo deve incluir o seguinte mapa do app:

```
GUIA DO APP (use quando o usuário perguntar como fazer algo):

CRIAR AÇÃO:
Aba Arenas → abrir a Arena desejada → botão + → preencher nome da ação → escolher tipo (diária, pontual, marco) → definir duração (opcional) → Salvar. A ação aparece na lista da arena e pode ser arrastada pro Planner.

CRIAR ARENA:
Aba Arenas → botão + no canto inferior → digitar nome → escolher ícone → Salvar.

EDITAR ARENA:
Aba Arenas → tocar na arena → ícone de edição → alterar nome/ícone → Salvar.

EXCLUIR ARENA:
Aba Arenas → tocar na arena → ícone de edição → botão Excluir → confirmar.

AGENDAR AÇÃO NO PLANNER:
Aba Planner → arrastar ação da Bay Area pro horário desejado no grid. Ou tocar no + pra criar direto no Planner.

COMPLETAR AÇÃO:
Aba Planner → long press na ação agendada → marca como completa.

CRIAR CICLO:
Aba Config → Geral → Ciclo Atual → Criar → definir duração → confirmar.

GERAR RELATÓRIO:
Aba Config → Geral → Ciclo Atual → Gerar Relatório (disponível quando o ciclo encerrar ou manualmente).

FAZER SITREP:
Aba Planner → ícone do SITREP (checklist) → preencher → OK.

ABRIR BAÚ:
Aba Mundo → Arsenal → Inventário → tocar no baú desejado.

EQUIPAR SKIN/BORDA/BANNER:
Aba Mundo → Arsenal → Inventário → tocar no item → Equipar.

VER SEPHIROT:
Aba Ativos → a árvore aparece com os 10 nós e seus níveis.

VER DOSSIÊ DE UM ATIVO:
Aba Ativos → tocar em qualquer Sephirah → abre o Dossiê com slots editáveis.

BUSCAR ALIADOS:
Aba Mundo → Social → campo de busca → digitar nome → enviar solicitação.

ENTRAR NUM CLÃ:
Aba Mundo → Social → buscar clã → solicitar entrada.

VER MISSÕES:
Aba Mundo → Temporada → lista de missões da season e do clã.

RESGATAR MISSÃO:
Aba Mundo → Temporada → missão completa → botão Resgatar.

TROCAR AVATAR/BORDA/BACKGROUND:
Tocar no avatar no header → modal de perfil → modo editar → tocar no elemento que quer trocar.

CONFIGURAR ORÁCULO:
Glifo no header → ⚙️ → checklist de categorias e modo de conversa (Premium).

CONFIGURAR PREFERÊNCIAS:
Aba Config → Preferências → toggles de IA, Notificações, Animações, Sons, Háptico.
```

Quando o usuário perguntar algo que não está no mapa, o Oráculo responde honestamente: "Essa funcionalidade ainda não conheço em detalhe. Tenta explorar a aba [mais provável] ou me pergunta de outro jeito."

### Chat — Regras

- Free: chat desabilitado. Só vê a mensagem plantada mas não pode responder. CTA: "Desbloqueie o Oráculo Soberano para conversar."
- Premium: chat completo, bidirecional, ilimitado.
- O histórico do chat pode zerar entre sessões (não precisa persistir pra sempre). A mensagem plantada é renovada.

---

## ABA: NOTIFICAÇÕES

### Comportamento

Feed persistente de notificações do app. Salvo no Supabase. Não zera. O usuário gerencia manualmente.

### Interações

- **Tap** na notificação → ela ganha opacidade reduzida (visual de "lido"). Marcada como `read: true` no banco.
- **Swipe esquerda** → deletar a notificação.
- Notificações novas aparecem no topo.
- Badge numérico no Glifo do header conta apenas as não lidas.

### Tipos de Notificação

#### Social

| Evento | Texto | Ação ao tocar |
|--------|-------|--------------|
| Solicitação de amizade recebida | "[Fulano] quer ser seu aliado" | Marca como lida |
| Solicitação aceita | "[Fulano] aceitou sua solicitação" | Marca como lida |
| Convite pro clã | "Você foi convidado para o clã [Nome]" | Marca como lida |
| Alguém entrou no clã | "[Fulano] entrou no [Nome do Clã]" | Marca como lida |
| Missão do clã atualizada | "Missão [Nome] do clã avançou" | Marca como lida |

#### Sistema

| Evento | Texto | Quando gerar |
|--------|-------|-------------|
| Ciclo terminando | "Seu ciclo termina em [X] dias" | Faltando 7 dias, 3 dias e 1 dia |
| Temporada terminando | "A Temporada [Nome] termina em [X] dias" | Faltando 7 dias, 3 dias e 1 dia |

#### Progresso

| Evento | Texto | Quando gerar |
|--------|-------|-------------|
| Subiu de nível | "Você alcançou o nível [X]" | Ao computar XP que passa pro próximo nível |
| Novo título | "Novo título desbloqueado: [Título]" | Ao atingir requisito de título |
| Missão disponível pra resgatar | "Missão [Nome] completa! Resgate sua recompensa" | Ao cumprir todos os requisitos da missão |

### Visual das Notificações

```
┌──────────────────────────────────┐
│  👤 Fulano quer ser seu aliado   │  ← não lida (opacidade 100%)
│  há 2 horas                     │
├──────────────────────────────────┤
│  ⬆️ Você alcançou o nível 37    │  ← lida (opacidade reduzida ~50%)
│  há 1 dia                       │
├──────────────────────────────────┤
│  ⏰ Seu ciclo termina em 3 dias  │  ← não lida
│  há 5 horas                     │
└──────────────────────────────────┘
```

- Não lida: opacidade 100%, texto claro
- Lida (após tap): opacidade reduzida, visual transparente/afundado
- Swipe esquerda em qualquer uma: deleta

---

## SUPABASE

### Tabela: notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,
  -- 'friend_request' | 'friend_accepted' | 'clan_invite' | 'clan_join'
  -- 'clan_mission_update' | 'cycle_ending' | 'season_ending'
  -- 'level_up' | 'title_unlocked' | 'mission_redeemable'
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notif_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notif_unread ON notifications(user_id, read) WHERE read = FALSE;
```

### Geração de notificações

As notificações são criadas por triggers ou edge functions:

- **Social**: triggers no Supabase quando inserir em `friend_requests`, `clan_members`, etc.
- **Sistema (ciclo/temporada)**: cron job diário que checa datas e cria notificações pra quem está a 7, 3 ou 1 dia do fim.
- **Progresso**: trigger quando XP é computado e ultrapassa threshold de nível. Trigger quando missão atinge 100%.

---

## INTEGRAÇÃO COM TOGGLES DAS PREFERÊNCIAS

| Toggle | Efeito no Chat | Efeito nas Notificações |
|--------|---------------|------------------------|
| IA ON | Mensagem plantada aparece, chat funciona (premium) | Sem efeito |
| IA OFF | Sem mensagem plantada, chat desabilitado | Sem efeito |
| Notificações ON | Sem efeito | Notificações são geradas e push é enviado |
| Notificações OFF | Sem efeito | Notificações são geradas mas SEM push (só vê ao abrir o app) |

Notificações sempre são salvas no banco independente do toggle. O toggle só controla se envia push ou não.