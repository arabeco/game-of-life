/**
 * O GABARITO DA MAESTRIA (03/11/2026, com o Afonso).
 *
 * Para cada area e cada degrau (3 a 10), a rotina tipica de quem esta ali:
 * praticas e frequencia. E a "pessoa imaginaria daquele nivel" com quem o
 * Oraculo compara as arenas e acoes de verdade, para dizer se a pessoa ja faz
 * o que o proximo degrau pede (talvez seja hora de atualizar), se esta perto
 * (falta uma peca) ou se a lacuna e grande.
 *
 * E REFERENCIA, NAO REGUA: o que a pessoa escreveu nas arenas e acoes pesa
 * mais. Do 0 ao 2 e ausencia, entao nao ha rotina. Alinhado as frases de
 * maestria-degraus.ts.
 */
export const ROTINA_TIPICA = {
  proposito: {
    3: 'Começa a explorar: lê, ouve ou experimenta meditação, oração ou diário de vez em quando.',
    4: 'Uma prática de presença (meditação, oração, gratidão) algumas vezes por semana, ainda falhando semanas.',
    5: 'Prática de presença 4 a 5 vezes por semana; já escreveu os próprios valores e usa em algumas decisões.',
    6: 'Prática de presença quase todo dia; revisão semanal do que importa; algo concreto ligado ao que acredita.',
    7: 'Rituais de manhã e de noite firmes; as decisões do dia passam pelo norte; um projeto pessoal com sentido andando.',
    8: 'Além dos rituais, um jeito de atravessar dúvidas: revisão mensal, diário nas crises, conversa com mentor ou guia; o projeto de sentido tem meta de meses.',
    9: 'Contribui toda semana com serviço, ensino ou comunidade ligada ao propósito; as escolhas grandes (trabalho, dinheiro, tempo) estão alinhadas.',
    10: 'Vida coerente com o que acredita em todas as áreas, há anos, inclusive em crise; serve de referência para outros.',
  },
  relacoes: {
    3: 'Começa a notar padrões: busca uma conversa honesta de vez em quando e se afasta do que faz mal.',
    4: 'Contato intencional com 1 ou 2 pessoas por semana; pratica escutar e dizer não, oscilando.',
    5: '2 ou 3 relações próximas com contato toda semana; já pede e oferece ajuda.',
    6: 'Rotina fixa com as pessoas importantes (encontro semanal, ligação, refeição em família); conversas difíceis acontecem.',
    7: 'Contato quase diário com quem importa; limites claros; conversas profundas e vulneráveis com frequência.',
    8: 'Além das relações próximas, um grupo ou comunidade fixa toda semana (time, igreja, turma); trocas que fazem crescer (projetos juntos, mentoria).',
    9: 'Aproxima pessoas: organiza encontros, cuida de uma comunidade, mentora alguém.',
    10: 'Relações recíprocas de anos, que atravessam fases; família e amizades integradas à vida que constrói.',
  },
  trabalho: {
    3: 'Começa a organizar: lista de prioridades, algum estudo esporádico, olha os gastos.',
    4: 'Executa tarefas e pequenos projetos; estudo 1 ou 2 vezes por semana; orçamento simples, mas perde o ritmo.',
    5: 'Direção definida; estudo 3 vezes por semana; o projeto principal avança toda semana; controla os gastos todo mês.',
    6: 'Trabalho e estudo com rotina fixa quase todo dia; reserva de emergência começando; revisão semanal das metas.',
    7: 'Entrega com qualidade; estudo constante de uma habilidade; decisões de longo prazo (carreira, investimento).',
    8: 'O trabalho gera valor reconhecido (renda, clientes, resultado); estudo com plano e meta; reserva estável e investimento todo mês.',
    9: 'Projetos relevantes com autonomia; lidera ou empreende; renda crescendo; ensina o que sabe.',
    10: 'Trabalho, conhecimento e dinheiro formam uma obra coerente e sustentável, que dura além da pessoa.',
  },
  lazer: {
    3: 'Experimenta lazer de vez em quando, sem regularidade; descansa quando sobra tempo.',
    4: 'Protege 1 ou 2 momentos de descanso, hobby ou silêncio por semana.',
    5: 'Um hobby que dá prazer 2 ou 3 vezes por semana; o descanso do fim de semana é respeitado.',
    6: 'Lazer, descanso e cuidado mental (pausas, sono, terapia) aparecem várias vezes na semana.',
    7: 'Alterna esforço e recuperação sem culpa: pausas no dia, um dia leve por semana, férias planejadas.',
    8: 'Hobbies que criam (arte, música, esporte, jogo) e que conectam com outras pessoas; presente no lazer, sem tela por obrigação.',
    9: 'Rotina rica e prazerosa que se sustenta há meses: hobbies, viagens, descanso e criação em equilíbrio.',
    10: 'Bem-estar e criação fazem parte do jeito de viver; não precisa tirar folga para estar bem.',
  },
  saude: {
    3: 'Saiu do zero: largou os piores hábitos; movimento 1 ou 2 vezes por semana, sem regularidade.',
    4: 'Movimento 2 vezes por semana; dá conta da rotina; começa a olhar sono e água.',
    5: 'Treino 3 vezes por semana; sono e refeições regulares; sem dores grandes.',
    6: 'Treino 4 vezes por semana com constância; alimentação planejada na maioria dos dias; disposição de sobra.',
    7: 'Força 4 a 5 vezes por semana (uma divisão de treino, como ABC ou ABCDE) e cardio 1 ou 2 vezes; alimentação planejada todo dia; resultado visível.',
    8: 'Força, cardio 2 vezes e mobilidade 2 ou 3 vezes por semana; sono de 7 horas ou mais; progressão de carga ou de tempo medida.',
    9: 'Rotina completa e periodizada há meses, com recuperação; desempenho muito acima da média (provas, marcas).',
    10: 'Treino e cuidado de atleta: força, energia e saúde no limite do potencial, inabaláveis.',
  },
} as const;
