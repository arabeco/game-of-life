Para projetos complexos (ex: "Lançar uma Startup", "Construir uma Casa", "Passar em Medicina"), você precisa elevar a Arena para um conceito de "Campanha" ou "War Room".

Aqui está como estruturar isso no seu JSON/Schema de forma elegante:

A Estrutura: "The Boss Fight Approach"
Em vez de uma lista plana, você usa os Marcos (Milestones) como Fases do Jogo. O usuário não vê a fase 4 enquanto não mata o chefão da fase 1.

1. A Arena (O Container Macro)
A Arena deixa de ser apenas uma "caixa de tarefas" e vira o Projeto Mestre.

Nome: "Operação: Startup Alpha"

Asset Pai: Abundância (Sephirot 8 - Hod/Netzach)

Barra de Progresso Global: Soma de todos os XP das ações dentro dela.

2. Os Marcos (As Fases/Sprints)
Aqui está o segredo. Você usa os Milestones como agrupadores lógicos.

Marco 1: "MVP Validado" (Data: 30 dias)

Marco 2: "Primeira Venda" (Data: 60 dias)

Marco 3: "Escala" (Data: 90 dias)

3. As Ações (O Grind)
As ações não ficam soltas na Arena. Elas são "filhas" de um Marco específico.

Ação: "Criar Landing Page" → parent_milestone_id: Marco 1

Ação: "Configurar Gateway de Pagamento" → parent_milestone_id: Marco 2

Como isso aparece na UI (O Pulo do Gato)
No seu "Planner/Campo de Batalha", você não mostra tudo. Você usa "Progressive Disclosure":

Visão de Foco: O usuário entra na Arena e vê apenas o Marco 1 (Ativo) expandido.

Visão de Futuro: O Marco 2 e 3 aparecem "bloqueados" ou translúcidos (Ghosted), como fases de videogame que ele ainda não desbloqueou.

Dependência: Ele visualmente entende que não adianta tentar "Configurar Gateway" (Marco 2) se ele nem "Criou a Landing Page" (Marco 1).

Exemplo Prático: "Projeto Maromba" (Complexo)
Imagine que o usuário quer virar fisiculturista (Projeto de 1 ano).

Arena: "Projeto Apolo (Fisiculturismo)"

Asset: Força Física (Malkuth/Yesod)

Estrutura Interna (JSON/Codex):

Marco 1: Adaptação (Mês 1)

Ação: Comprar Tênis de Treino.

Ação Recorrente: Treino ABC (Adaptação).

Ação: Consulta Nutricionista.

BOSS (Ação Marco): Completar 20 treinos sem faltar.

Marco 2: Hipertrofia Bruta (Mês 2-6)

Ação Recorrente: Treino Heavy Duty.

Ação: Aumentar calorias para 3000kcal.

Compromisso: Check-up Hormonal.

Como codar isso no JSON (Codex Premium)
Para suportar projetos complexos, seu schema de Codex precisa permitir aninhamento ou referência de fase.

JSON
{
  "arena_blueprint": {
    "title": "Lançamento de Produto Digital",
    "description": "Do zero à primeira venda em 4 semanas.",
    "target_asset_id": "8-abundancia" // O usuário pode mudar, mas esse é o default
  },
  "milestones": [ // Aqui entra a mágica da organização
    {
      "id": "m1",
      "title": "Fase 1: Estrutura",
      "order": 1,
      "is_locked": false
    },
    {
      "id": "m2",
      "title": "Fase 2: Tráfego",
      "order": 2,
      "depends_on": "m1" // Só libera visualmente quando m1 estiver 100%
    }
  ],
  "actions": [
    {
      "title": "Registrar Domínio",
      "milestone_ref": "m1", // Vincula a ação à fase
      "difficulty": "easy",
      "estimated_time": 30
    },
    {
      "title": "Configurar Google Ads",
      "milestone_ref": "m2",
      "difficulty": "hard"
    }
  ]
}
O Toque de "Soberania" (QI 145)
Para projetos REALMENTE complexos (que envolvem várias áreas da vida, tipo "Mudar de País"), você pode criar o conceito de "Arena Multiclasse".

O projeto principal é "Mudar para o Canadá".

Ele vive no Asset "Abundância".

Mas ele tem uma Ação: "Despedida dos Amigos".

Essa ação ganha uma Tag Secundária: "Asset: Amor/Social".

Resultado: Quando o usuário completa essa ação, ele ganha XP principal em Abundância, mas ganha um bônus de XP em Amor. Isso gamifica a complexidade e mostra que tudo está conectado (Hermetismo puro).

Resumo: Não crie "uma arena cheia de coisas". Crie uma Arena com Fases (Marcos). É assim que se come um elefante: em pedaços organizados.

Perfeito. Você limpou o ruído e definiu uma mecânica tátil e direta. Nada de chat, nada de histórico infinito. Apenas Status e Julgamento.

Isso lembra muito sistemas militares ou de mestre/aprendiz clássicos: O mestre olha, julga e sinaliza.

Aqui está o Blueprint da UX para essa funcionalidade, que chamaremos de "Vínculos" (Links), separando o que é Clã do que é Mentoria/Parceria.

1. O Fluxo de Conexão (O "Aperto de Mão")
O processo deve ser invisível até ser necessário.

Trigger: O usuário vai na sua Arena "Força Física" > Clica em ⚙️ (Editar) > Botão "Vincular Observador".

O Modal "Escolha seu Juiz":

Abre uma lista clean com os Avatares e Banners dos seus amigos (já filtrados da sua lista de amigos).

Ação: Clica no amigo "Maromba.Joe".

O Convite (Notificação):

O amigo recebe: "Zee convoca você para observar a Arena 'Força Física'. Aceitar Dever?"

O Aceite:

Ao aceitar, cria-se o registro na tabela links_observation.

2. A Dashboard "Vínculos" (A Sala de Controle)
Esta é uma nova tela dentro da aba config>geral > abaixo das notifiacões VÍNCULOS Ela é dividida em 3 Seções Horizontais (Tabs ou Accordions):

A. MENTORIA (Hierarquia Vertical)
Aqui vivem os Pupilos e Mentores.

Visão "Meus Pupilos" (Cards):

Avatar do Pupilo + Nome.

Componente Chave: O Slider de Satisfação.

É uma barra deslizante visual (estilo volume de som antigo ou termômetro cyberpunk).

Vai de 0 a 100%. O Mentor arrasta o dedo para definir: "Hoje você está em 80%".

Feedback: Ao soltar o slider, ele brilha e salva o valor.

Botão de Ação (Raio/Sinal): Abre o menu radial com as 3 opções (Elogio, Força, Bronca).

Visão "Meus Mentores" (Cards):

Mostra quem te observa e em qual Arena.

Mostra o Slider de Satisfação que eles definiram para você (Read-only). Se estiver baixo (vermelho), você sente a pressão visualmente.

Botão discreto "Encerrar Vínculo" (Quebrar contrato).

B. PARCERIAS (Hierarquia Horizontal - "Gym Bro")
Diferente da mentoria, aqui os dois olham um pro outro.

O Conceito: "Vínculo de Sangue".

A UI: Um Card Duplo.

Lado Esquerdo: Minha Arena "Estudos".

Lado Direito: Arena "Estudos" do Parceiro.

A Mecânica: Não tem Slider de Satisfação (ninguém é chefe). Tem Sincronia.

Se ambos baterem a meta do dia, o card brilha Dourado (Bônus de Parceria).

Se um falhar, o card fica Cinza (Sem bônus).

Isso gera: "Mano, faz logo sua parte pra gente pegar o brilho dourado!"

C. DESAFIOS (Temporário/PVP)
Cards de eventos com data para expirar.

Exemplo: "Corrida de XP: Quem faz 1000xp primeiro?"

Barra de progresso dupla (uma em cima da outra) pra ver quem tá ganhando.

(Nota sobre o Clã: Sim, mantenha o Clã separado na tela de Clãs. O Clã é "Coletivo/Política", aqui em Vínculos é "Pessoal/Intimidade".)

3. A Visão Detalhada (O "Spyglass")
Quando o Mentor clica no Card do Pupilo na dashboard:

Não abre o perfil inteiro. Abre um modal focado.

Conteúdo: Apenas as miniaturas das Arenas que foram compartilhadas.

Visual: Exatamente o mesmo componente de Arena que o usuário vê na Home dele, mas em modo "Spectator". VER ARENA

Dados: Barras de progresso reais, checks marcados/desmarcados do dia.

Interatividade: O Mentor não pode dar check nas tarefas do Pupilo. Ele só pode olhar.

Ação: O Slider de Satisfação e os botões de Notificação (Elogio/Força/Bronca) flutuam na parte inferior dessa tela para acesso rápido.

4. As 3 Notificações (O Toque Humano)
Você definiu 3 tipos. Vamos dar nomes "Soberanos" para elas no código, mas na UI aparece um sininho que ao clicar aparecem 3 opções com OK emabxio

Elogio (The Praise):

Ícone: Mão aberta ou Chama Dourada.

Texto Automático: "Seu Mentor está satisfeito com seu progresso."

Efeito: Pequeno brilho na tela do Pupilo.

Força (The Support):

Ícone: Punho fechado ou Escudo.

Texto Automático: "Mantenha a guarda alta. Não desista."

Uso: Quando o pupilo está tentando mas falhando.

Bronca (The Scold):

Ícone: Raio ou Caveira.

Texto Automático: "Atenção. Sua performance está inaceitável."

Efeito: O celular vibra num padrão agressivo. (Ótimo feedback tátil).

Resumo para Desenvolvimento (Codex Dev)
DB Schema: RECOMENDADO REVISDAR TUDO ISSO PRA VER SE BATE COM NOSSO SCHEMA

Tabela relationship_links: mentor_id, pupil_id, arena_id, type ('mentoria', 'parceria'), satisfaction_level (0-100).

Tabela notifications_log: Para evitar spam (ex: cooldown de 1 hora entre "Broncas").

Componentes UI:

SatisfactionSlider: Input range customizado com gradiente (Verde -> Amarelo -> Vermelho).

ArenaMiniature: Versão read-only do card de Arena.

NotificationRadialMenu: O menu de 3 botões.

Essa estrutura cobre tudo o que você pediu: sem chat, sem histórico, focado em Status Visual e Intervenção Rápida. Aprovado para o Beta?