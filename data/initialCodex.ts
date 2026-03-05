
import { CodexTemplate } from '../types';

export const BIOLOGICAL_MACHINE_CODEX: CodexTemplate = {
  id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  title: 'Máquina Biológica',
  description: 'Reconfigure sua biologia para performance máxima em 28 dias. Protocolos de sono, nutrição e ativação física.',
  author: 'Soberano System',
  price: 200,
  durationDays: 28,
  tags: ['Saúde', 'Biohacking', 'Energia'],
  coverImage: '🧬',
  levels: [
    {
      level: 1,
      title: 'Fase 1: Desintoxicação & Reset',
      description: 'Limpeza metabólica e estabelecimento do ritmo circadiano.',
      actions: [
        {
          name: 'Hidratação Matinal',
          description: 'Beber 500ml de água com limão e sal integral ao acordar.',
          icon: '💧',
          duration: 5,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 1,
          briefing: 'Sua biologia acorda desidratada. A água ativa o metabolismo e o sal repõe eletrólitos fundamentais para a condução nervosa.',
          preFlight: ['Água filtrada', 'Meio limão', 'Pitada de sal integral'],
          context: { energyLevel: 'low', timeOfDay: 'morning' },
          scheduledDays: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'],
          scheduledStartTime: 420 // 07:00
        },
        {
          name: 'Higiene de Luz (Manhã)',
          description: 'Exposição direta à luz solar nos primeiros 30 min do dia.',
          icon: '☀️',
          duration: 15,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 2,
          briefing: 'A luz solar no nervo óptico sinaliza ao núcleo supraquiasmático que o dia começou, regulando a produção de cortisol e melatonina para a noite.',
          context: { energyLevel: 'medium', timeOfDay: 'morning' },
          scheduledDays: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'],
          scheduledStartTime: 450 // 07:30
        },
        {
          name: 'Jejum 12h',
          description: 'Janela de alimentação restrita a 12 horas.',
          icon: '🍽️',
          duration: 0,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 3,
          briefing: 'Dê descanso ao seu sistema digestivo para focar em reparo celular (autofagia incipiente).',
          context: { energyLevel: 'medium', timeOfDay: 'night' }
        },
        {
          name: 'Bloqueio de Luz Azul',
          description: 'Evitar telas ou usar filtro 1h antes de dormir.',
          icon: '🕶️',
          duration: 60,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 3,
          briefing: 'A luz azul inibe a melatonina. Proteja seu sono profundo evitando telas à noite.',
          context: { energyLevel: 'low', timeOfDay: 'night' },
          scheduledDays: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'],
          scheduledStartTime: 1320 // 22:00
        }
      ]
    },
    {
      level: 2,
      title: 'Fase 2: Ativação Mitocondrial',
      description: 'Otimização da produção de energia celular.',
      actions: [
        {
          name: 'Banho Frio',
          description: 'Exposição ao frio por 2-3 minutos.',
          icon: '❄️',
          duration: 3,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 4,
          briefing: 'O choque térmico aumenta a noradrenalina e dopamina, além de converter gordura branca em marrom (termogênica).',
          preFlight: ['Chuveiro gelado', 'Respiração controlada'],
          context: { energyLevel: 'high', timeOfDay: 'morning' }
        },
        {
          name: 'Treino HIIT',
          description: 'Alta intensidade intervalada.',
          icon: '🔥',
          duration: 20,
          repetitions: 3, // 3x por semana
          actionType: 'Ação Recorrente',
          difficulty: 4,
          briefing: 'Explosões de esforço máximo melhoram a capacidade cardiovascular e a sensibilidade à insulina.',
          scheduledDays: ['SEG', 'QUA', 'SEX']
        },
        {
          name: 'Respiração Wim Hof',
          description: '3 rounds de respiração profunda e retenção.',
          icon: '🫁',
          duration: 15,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 3,
          briefing: 'Alcaliniza o sangue temporariamente e treina o sistema nervoso autônomo.',
          context: { energyLevel: 'medium', timeOfDay: 'morning' }
        },
        {
          name: 'Grounding',
          description: 'Pés descalços na terra/grama.',
          icon: '🌱',
          duration: 10,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 1,
          briefing: 'Descarga elétrica e redução de inflamação através do contato com a terra.',
          context: { energyLevel: 'low', timeOfDay: 'afternoon' }
        }
      ]
    },
    {
      level: 3,
      title: 'Fase 3: Alta Performance Cognitiva',
      description: 'Foco, memória e clareza mental.',
      actions: [
        {
          name: 'Deep Work (Bloco 1)',
          description: '90 minutos de trabalho focado sem distrações.',
          icon: '🧠',
          duration: 90,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 4,
          briefing: 'Atenção plena em uma única tarefa complexa. Onde a mágica acontece.',
          preFlight: ['Celular longe', 'Notificações off', 'Água na mesa'],
          context: { energyLevel: 'high', timeOfDay: 'morning' }
        },
        {
          name: 'Meditação Mindfulness',
          description: 'Observação dos pensamentos sem julgamento.',
          icon: '🧘',
          duration: 10,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 2,
          briefing: 'Treino de foco e redução de ansiedade. O "bíceps" da mente.',
          context: { energyLevel: 'low', timeOfDay: 'evening' }
        },
        {
          name: 'Leitura Técnica',
          description: 'Absorção de conhecimento denso.',
          icon: '📚',
          duration: 30,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 3,
          briefing: 'Expansão do repertório mental.',
          context: { energyLevel: 'medium', timeOfDay: 'afternoon' }
        },
        {
          name: 'Diário de Gratidão',
          description: '3 coisas pelas quais é grato hoje.',
          icon: '📔',
          duration: 5,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 1,
          briefing: 'Recalibração do viés cognitivo para o positivo antes de dormir.',
          context: { energyLevel: 'low', timeOfDay: 'night' }
        }
      ]
    }
  ]
};
