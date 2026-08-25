import { ChestType, ConfigSeasonQuest } from '../types';

export type SystemChallenge = ConfigSeasonQuest & {
  source: 'system';
  rewardChest?: ChestType;
  rewardGold?: number;
};

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
  {
    id: 'system-five-day-proof-streak',
    source: 'system',
    title: 'Cinco dias em movimento',
    description: 'Registre pelo menos uma acao real por cinco dias seguidos. Recompensa: 2 de ouro.',
    type: 'individual',
    category: 'spiritual',
    actionTemplate: {
      name: 'Cinco Dias em Movimento',
      description: 'Manter cinco dias seguidos com ao menos uma acao concluida.',
      icon: '\u{1F525}',
      duration: 0,
      repetitions: 5,
      isMilestone: true,
    },
    requirements: { totalReps: 5, milestone: true },
    rewards: { xp: 300 },
    rewardGold: 2,
  },
  {
    id: 'system-twenty-actions',
    source: 'system',
    title: 'Conclua 20 acoes',
    description: 'Registre vinte acoes reais concluidas. Recompensa: 2 de ouro.',
    type: 'individual',
    category: 'intellectual',
    actionTemplate: {
      name: 'Vinte Acoes Reais',
      description: 'Concluir vinte acoes que contam para o seu progresso.',
      icon: '\u2705',
      duration: 0,
      repetitions: 20,
      isMilestone: true,
    },
    requirements: { totalReps: 20, milestone: true },
    rewards: { xp: 300 },
    rewardGold: 2,
  },
  {
    id: 'tutorial-quest',
    source: 'system',
    title: 'Concluir o tutorial',
    description: 'Feche a trilha inicial do sistema. Recompensa: 1 Bau Comum.',
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
    rewards: { xp: 100 },
    rewardChest: 'Comum',
  },
  {
    id: 'system-first-cycle',
    source: 'system',
    title: 'Criar o primeiro ciclo',
    description: 'Abra seu primeiro ciclo real. Recompensa: 1 Bau Comum.',
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
    rewards: { xp: 100 },
    rewardChest: 'Comum',
  },
  {
    id: 'system-first-campaign',
    source: 'system',
    title: 'Instalar a primeira campanha',
    description: 'Instale uma campanha. Recompensa: 1 Bau Comum.',
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
    rewards: { xp: 100 },
    rewardChest: 'Comum',
  },
  {
    id: 'system-first-cycle-report',
    source: 'system',
    title: 'Concluir o primeiro ciclo',
    description: 'Feche um ciclo inteiro e gere o primeiro relatorio. Recompensa: 1 Bau Ciclo.',
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
    rewards: { xp: 500 },
    rewardChest: 'Ciclo',
  },
];
