# 🏛️ Codex da Cidadela: Arquitetura de Dados

Este documento serve como a fonte da verdade para todas as entidades de dados e suas relações no Life OS.

## I. O Soberano (Dados Centrais do Usuário)

Estes dados definem o estado e a identidade do usuário.

-   **`profiles`**: O Trono do Soberano.
    -   **Propósito:** Armazena todas as informações do perfil público e privado.
    -   **Relações:** Ligado diretamente ao `auth.users` pelo `id`.
    -   **Variáveis:** `id`, `nickname`, `level`, `avatar_url`, `background_url`, `banner_url`, `sovereign` (config do avatar `jsonb`), `nobility` (`jsonb`), `chests` (`jsonb`), `skin`, `border`, etc.

-   **`user_assets`**: Os Níveis de Maestria dos 10 Ativos.
    -   **Propósito:** Rastreia o progresso do usuário em cada área da vida.
    -   **Relações:** Pertence a um `user_id`. Cada registro corresponde a um `asset_id` (ex: 'consciencia').
    -   **Variáveis:** `user_id`, `asset_id`, `level`.

-   **`asset_slots`**: A Memória dos Ativos.
    -   **Propósito:** Armazena os valores customizáveis (lemas, imagens, escolhas) de cada Ativo.
    -   **Relações:** Pertence a um `user_id`. Cada registro corresponde a um `slot_id` (ex: 'consciencia.lema').
    -   **Variáveis:** `user_id`, `slot_id`, `value`.

## II. O Reino (Entidades Criadas pelo Usuário)

Estas são as estruturas que o usuário constrói para organizar sua vida.

-   **`arenas`**: Os Contextos e Projetos.
    -   **Propósito:** Representam os grandes projetos ou áreas de foco.
    -   **Relações:** Pertencem a um `user_id` e a um `asset_id`.
    -   **Variáveis:** `id`, `user_id`, `asset_id`, `name`, `description`, `icon`, `is_archived`.

-   **`actions`**: As Missões e Tarefas.
    -   **Propósito:** As tarefas individuais que o usuário executa.
    -   **Relações:** Pertencem a um `user_id` e a uma `arena_id`.
    -   **Variáveis:** `id`, `user_id`, `arena_id`, `name`, `icon`, `duration`, `repetitions`, `action_type`, `difficulty`.

-   **`scheduled_tasks`**: O Planner.
    -   **Propósito:** Uma `action` agendada em um dia e horário específico. É a instância de uma `action` no grid.
    -   **Relações:** Pertence a um `user_id` e a uma `action_id`.
    -   **Variáveis:** `id`, `user_id`, `action_id`, `date`, `start_time`, `completed`.

## III. O Mundo (Dados Sociais e de Sistema)

Estas entidades governam as interações e o progresso macro.

-   **`clans`**: (A ser implementado no DB) A Guilda do Soberano.
    -   **Propósito:** Armazena informações do Clã como nome, XP total e rank.
    -   **Variáveis:** `id`, `name`, `exp`, `rank_id`.

-   **`clan_members`**: (A ser implementado no DB) A Távola Redonda.
    -   **Propósito:** Tabela de junção que liga `user_id` a `clan_id`.
    -   **Variáveis:** `user_id`, `clan_id`, `role` (ex: 'membro', 'líder').

-   **`clan_member_states`**: (A ser implementado no DB) **Ação no Santuário do Clã.**
    -   **Propósito:** Exatamente o que você mencionou. Armazena o estado dinâmico de cada membro no Santuário (ex: 'Meditando na Árvore', 'Trabalhando no Jardim'). Isso adiciona uma camada de imersão fantástica.
    -   **Variáveis:** `user_id`, `state_name`, `state_icon`, `state_lore`, `updated_at`.

-   **`reports`**: (A ser implementado no DB) O Historiador.
    -   **Propósito:** Salva os resultados de cada Ciclo concluído.
    -   **Relações:** Pertence a um `user_id`.
    -   **Variáveis:** `id`, `user_id`, `start_date`, `end_date`, `performance_score`, `metrics` (`jsonb`).

## IV. A Chancelaria (Governança do Soberano)

Estas entidades são controladas pelo Painel do Soberano para gerenciar o acesso e o conteúdo dinâmico do reino.

-   **`golden_invites`**: (A ser implementado no DB) O Arsenal de Convites.
    -   **Propósito:** Gerencia os códigos de convite únicos para o registro de novos Soberanos.
    -   **Variáveis:** `id`, `code`, `is_used`, `claimed_by_user_id`, `claimed_at`, `created_at`.

-   **`seasons`**: (A ser implementado no DB) O Oráculo das Estações.
    -   **Propósito:** Define os parâmetros de uma temporada de conteúdo, como tema, duração e lore.
    -   **Variáveis:** `id`, `name`, `start_date`, `end_date`, `background_png_url`, `lore_text`, `is_active`.

-   **`season_missions`**: (A ser implementado no DB) Os Decretos Sazonais.
    -   **Propósito:** Detalha as missões específicas disponíveis durante uma `season`.
    -   **Relações:** Ligada a uma `season_id`.
    -   **Variáveis:** `id`, `season_id`, `title`, `description`, `goal_type`, `goal_value`, `reward_type`, `reward_value`.

-   **`missions`**: (A ser implementado no DB) Os Feitos e Conquistas.
    -   **Propósito:** Rastreia o progresso do usuário em missões definidas pelo sistema (ex: 'Complete seu primeiro Ciclo', 'Alcance Nível 10 em FÍSICO').
    -   **Relações:** Pertence a um `user_id`.
    -   **Variáveis:** `user_id`, `mission_id`, `progress`, `completed_at`.
