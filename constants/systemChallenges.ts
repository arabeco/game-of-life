import type { ChestType, ConfigSeasonQuest } from '../types';

export type SystemChallenge = ConfigSeasonQuest & {
  source: 'system';
  rewardChest?: ChestType;
  rewardGold?: number;
  rewardFragments?: number;
  /**
   * MISSAO INICIAL: completa-se sozinha, nao ocupa o slot e nao precisa ser
   * aceita.
   *
   * Existe para a pessoa conhecer as partes do app — criar arena, montar ciclo,
   * instalar campanha. Por ser facil, paga pouco: 25 de EXP e 5 fragmentos, sem
   * ouro, sem bau e SEM INSIGNIA. Insignia e de compromisso aceito; dar uma por
   * abrir uma tela esvazia a que a pessoa suou para ter.
   *
   * Antes as quatro primeiras pagavam bau — tres Comuns e um Raro — por marcos
   * de um toque. O comentario da escala de XP logo abaixo conta a mesma
   * historia com outros numeros: o tutorial chegou a valer 16 horas de
   * trabalho. Esta e a segunda correcao do mesmo exagero.
   */
  inicial?: boolean;
};

/**
 * O preco de conhecer uma parte do app.
 *
 * EXP e minuto de acao, entao 25 e meia acao curta. Com dez missoes iniciais o
 * conjunto inteiro da 250 — menos que UMA missao de esforco (300). Explorar o
 * app todo vale menos que concluir vinte acoes, e e assim que tem de ser.
 */
export const INITIAL_MISSION_XP = 25;
export const INITIAL_MISSION_FRAGMENTS = 5;

/**
 * ESCALA DO XP: no Glyph o XP e minutos de acao (uma acao de 30 min vale ~30).
 * A tabela antiga ia de 500 a 3500, o que fazia "concluir o tutorial" pagar o
 * equivalente a 16 horas de trabalho e o primeiro relatorio, 58. As faixas
 * agora sao 100 (marco de um toque), 300 (esforco sustentado) e 500 (o maior
 * do jogo). Premio de missao e BONUS por cima do XP que a acao ja paga.
 */
export const SYSTEM_CHALLENGE_INSIGNIA_ID = 'insignia_quest_incomum';

export const SYSTEM_CHALLENGES: SystemChallenge[] = [
  {
    id: 'system-first-arena-gold',
    source: 'system',
    title: 'Complete sua primeira arena',
    description: 'Conclua todas as metas de uma arena. Recompensa: 1 de ouro.',
    type: 'individual',
    category: 'physical',
    actionTemplate: {
      name: 'Primeira Arena Completa',
      description: 'Levar uma arena a 100% de progresso.',
      icon: '\u{1F3DF}\uFE0F',
      duration: 0,
      repetitions: 1,
      isMilestone: true,
    },
    requirements: { totalReps: 1, milestone: true },
    rewards: { xp: 300 },
    rewardGold: 1,
  },
  // "Conclua 20 acoes" saiu.
  //
  // A missao individual do APP INTEIRO faz a mesma coisa e melhor: a meta sai do
  // ritmo da pessoa em vez de ser 20 fixo para todo mundo, tem prazo de 14 dias,
  // e paga pela mesma regua das outras. Manter as duas seria oferecer o mesmo
  // trabalho em dois lugares, com numeros diferentes.
  {
    id: 'tutorial-quest',
    source: 'system',
    title: 'Concluir o tutorial',
    description: 'Feche a trilha inicial do sistema.',
    type: 'individual',
    category: 'intellectual',
    actionTemplate: {
      name: 'Tutorial de Iniciacao',
      description: 'Concluir a sequencia inicial.',
      icon: '\u{1F393}',
      duration: 0,
      repetitions: 1,
      isMilestone: true,
    },
    requirements: { totalReps: 1, milestone: true },
    inicial: true,
    rewards: { xp: INITIAL_MISSION_XP },
    rewardFragments: INITIAL_MISSION_FRAGMENTS,
  },
  {
    id: 'system-first-cycle',
    source: 'system',
    title: 'Criar o primeiro ciclo',
    description: 'Abra seu primeiro ciclo real.',
    type: 'individual',
    category: 'intellectual',
    actionTemplate: {
      name: 'Primeiro Ciclo Criado',
      description: 'Ter um ciclo ativo ou um ciclo ja fechado.',
      icon: '\u{1F504}',
      duration: 0,
      repetitions: 1,
      isMilestone: true,
    },
    requirements: { totalReps: 1, milestone: true },
    inicial: true,
    rewards: { xp: INITIAL_MISSION_XP },
    rewardFragments: INITIAL_MISSION_FRAGMENTS,
  },
  {
    id: 'system-first-campaign',
    source: 'system',
    title: 'Instalar a primeira campanha',
    description: 'Instale uma campanha.',
    type: 'individual',
    category: 'intellectual',
    actionTemplate: {
      name: 'Primeira Campanha Instalada',
      description: 'Ter ao menos uma campanha instalada.',
      icon: '\u{1F4E6}',
      duration: 0,
      repetitions: 1,
      isMilestone: true,
    },
    requirements: { totalReps: 1, milestone: true },
    inicial: true,
    rewards: { xp: INITIAL_MISSION_XP },
    rewardFragments: INITIAL_MISSION_FRAGMENTS,
  },
  {
    id: 'system-first-cycle-report',
    source: 'system',
    title: 'Concluir o primeiro ciclo',
    description: 'Feche um ciclo inteiro e gere o primeiro relatorio.',
    type: 'individual',
    category: 'spiritual',
    actionTemplate: {
      name: 'Primeiro Relatorio de Ciclo',
      description: 'Gerar o primeiro relatorio de ciclo completo.',
      icon: '\u{1F4DC}',
      duration: 0,
      repetitions: 1,
      isMilestone: true,
    },
    requirements: { totalReps: 1, milestone: true },
    inicial: true,
    rewards: { xp: INITIAL_MISSION_XP },
    rewardFragments: INITIAL_MISSION_FRAGMENTS,
  },
  {
    id: 'system-first-arena-created',
    source: 'system',
    title: 'Criar a primeira arena',
    description: 'Crie uma arena para uma frente da sua vida.',
    type: 'individual',
    category: 'intellectual',
    actionTemplate: {
      name: 'Primeira Arena Criada',
      description: 'Ter ao menos uma arena.',
      icon: '🏟️',
      duration: 0,
      repetitions: 1,
      isMilestone: true,
    },
    requirements: { totalReps: 1, milestone: true },
    inicial: true,
    rewards: { xp: INITIAL_MISSION_XP },
    rewardFragments: INITIAL_MISSION_FRAGMENTS,
  },
  {
    id: 'system-first-action-done',
    source: 'system',
    title: 'Concluir a primeira acao',
    description: 'Conclua uma acao de verdade.',
    type: 'individual',
    category: 'physical',
    actionTemplate: {
      name: 'Primeira Acao Concluida',
      description: 'Ter ao menos uma tarefa concluida.',
      icon: '✅',
      duration: 0,
      repetitions: 1,
      isMilestone: true,
    },
    requirements: { totalReps: 1, milestone: true },
    inicial: true,
    rewards: { xp: INITIAL_MISSION_XP },
    rewardFragments: INITIAL_MISSION_FRAGMENTS,
  },
  {
    id: 'system-first-planned-day',
    source: 'system',
    title: 'Planejar o primeiro dia',
    description: 'Coloque uma acao no planner.',
    type: 'individual',
    category: 'intellectual',
    actionTemplate: {
      name: 'Primeiro Dia Planejado',
      description: 'Ter ao menos uma tarefa no planner.',
      icon: '🗓️',
      duration: 0,
      repetitions: 1,
      isMilestone: true,
    },
    requirements: { totalReps: 1, milestone: true },
    inicial: true,
    rewards: { xp: INITIAL_MISSION_XP },
    rewardFragments: INITIAL_MISSION_FRAGMENTS,
  },
  {
    id: 'system-first-equipped-item',
    source: 'system',
    title: 'Equipar o primeiro item',
    description: 'Vista algo no Soberano.',
    type: 'individual',
    category: 'spiritual',
    actionTemplate: {
      name: 'Primeiro Item Equipado',
      description: 'Ter uma peca equipada no perfil.',
      icon: '👑',
      duration: 0,
      repetitions: 1,
      isMilestone: true,
    },
    requirements: { totalReps: 1, milestone: true },
    inicial: true,
    rewards: { xp: INITIAL_MISSION_XP },
    rewardFragments: INITIAL_MISSION_FRAGMENTS,
  },
  {
    id: 'system-first-individual-mission',
    source: 'system',
    title: 'Escolher a primeira missao individual',
    description: 'Peca uma missao ao Oraculo e escolha a sua.',
    type: 'individual',
    category: 'spiritual',
    actionTemplate: {
      name: 'Primeira Missao Individual',
      description: 'Ter escolhido uma missao individual.',
      icon: '🔮',
      duration: 0,
      repetitions: 1,
      isMilestone: true,
    },
    requirements: { totalReps: 1, milestone: true },
    inicial: true,
    rewards: { xp: INITIAL_MISSION_XP },
    rewardFragments: INITIAL_MISSION_FRAGMENTS,
  },
  {
    id: 'system-first-clan',
    source: 'system',
    title: 'Entrar num cla',
    description: 'Junte-se a um cla.',
    type: 'individual',
    category: 'social',
    actionTemplate: {
      name: 'Primeiro Cla',
      description: 'Fazer parte de um cla.',
      icon: '🛡️',
      duration: 0,
      repetitions: 1,
      isMilestone: true,
    },
    requirements: { totalReps: 1, milestone: true },
    inicial: true,
    rewards: { xp: INITIAL_MISSION_XP },
    rewardFragments: INITIAL_MISSION_FRAGMENTS,
  },
];

/**
 * A missao de sequencia, nomeada uma vez so.
 *
 * O AchievementModal reconhecia esta missao comparando com o texto
 * 'Sete Dias em Movimento', escrito a mao la dentro. Quando o desafio caiu de
 * sete para cinco dias, o nome mudou aqui e o literal de la ficou — a
 * comparacao passou a ser sempre falsa, e quem fechava a sequencia recebia o
 * "Desafio concluido" generico em vez da celebracao escrita para ela.
 *
 * Derivar dos proprios dados fecha a porta: renomear o desafio nunca mais
 * desliga a celebracao dele. Sao dois nomes porque o disparo usa ora o titulo
 * do desafio, ora o nome do modelo de acao.
 */
/**
 * A missao dos cinco dias foi APAGADA, nao escondida.
 *
 * Ela era a ultima coisa que ainda exigia dias consecutivos de todo mundo. O
 * passo 3 a tirou da oferta e manteve a definicao "para interpretar os aceites
 * antigos" — mas a conferencia no banco mostrou a coorte vazia: nenhum perfil
 * com `legacy_five_day_eligible`. Nao havia ninguem para interpretar.
 *
 * O gatilho `guard_retired_streak_and_volume_pact` no banco continua removendo o
 * id de qualquer array de aceites, entao binario antigo tambem nao a ressuscita.
 */

/**
 * O catalogo que a pessoa pode ESCOLHER.
 *
 * So missao individual entra aqui: a inicial nao se aceita, ela acontece. Sem
 * este filtro as dez iniciais apareceriam como opcoes para aceitar, competindo
 * pelo slot com o compromisso de verdade — que e exatamente o que a separacao
 * entre as duas familias veio desfazer.
 */
export const AVAILABLE_SYSTEM_CHALLENGES = SYSTEM_CHALLENGES.filter((challenge) => !challenge.inicial);
