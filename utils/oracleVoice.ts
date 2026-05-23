import type { OracleContext, OracleMode } from '../types';

export type OracleSurface = 'push' | 'balao' | 'chat' | 'card';

export type OracleOperationalState =
  | 'sem_direcao'
  | 'disperso'
  | 'atrasado'
  | 'em_ritmo'
  | 'em_risco'
  | 'retomando'
  | 'proximo_compromisso'
  | 'pronto_para_fechar'
  | 'arena_esquecida'
  | 'escopo_pesado'
  | 'oportunidade_util'
  | 'streak_mantida'
  | 'streak_quebrada'
  | 'primeira_acao_do_dia';

const STATE_FAMILY: Record<OracleOperationalState, string> = {
  sem_direcao: 'Direcao',
  disperso: 'Direcao',
  escopo_pesado: 'Direcao',
  atrasado: 'Tempo',
  em_risco: 'Tempo',
  proximo_compromisso: 'Tempo',
  retomando: 'Retorno',
  arena_esquecida: 'Manutencao',
  pronto_para_fechar: 'Manutencao',
  oportunidade_util: 'Valor',
  em_ritmo: 'Valor',
  streak_mantida: 'Valor',
  streak_quebrada: 'Retorno',
  primeira_acao_do_dia: 'Valor',
};

const SURFACE_RULES: Record<OracleSurface, string[]> = {
  push: [
    '1 frase curta.',
    'Parece notificacao viva, nao relatorio.',
    'Se citar numero, cite so o que muda a decisao.',
  ],
  balao: [
    '1 ou 2 frases curtas.',
    'Fale como uma presenca ao lado da tela.',
    'Termine com proximo movimento claro.',
  ],
  chat: [
    'Conversa natural, mas sem virar palestra.',
    'Se o usuario trouxe duvida, responda a duvida antes de sugerir acao.',
    'Use dados do app apenas quando eles ajudarem.',
  ],
  card: [
    'Mantenha o formato pedido pelo card quando existir.',
    'Prioridade, risco e AJA devem soar humanos, nao checklist tecnico.',
    'Uma leitura dominante vale mais que enumerar tudo.',
  ],
};

const STATE_EXAMPLES: Record<OracleOperationalState, Record<OracleSurface, string[]>> = {
  sem_direcao: {
    push: ['Seu dia ainda esta sem trilho. Escolha uma arena e abra uma acao pequena.'],
    balao: ['Ainda nao tem uma proxima acao clara. Escolha uma arena e coloca o dia em movimento.'],
    chat: ['O estado aqui e falta de direcao, nao falta de vontade. Vamos escolher uma arena e transformar isso em uma acao pequena.'],
    card: ['PRIORIDADE: dar trilho ao dia.\nRISCO: continuar navegando sem execucao.\nAJA: escolha uma arena e crie uma acao curta.'],
  },
  disperso: {
    push: ['Tem coisa demais aberta. Fecha uma acao curta antes de mexer no resto.'],
    balao: ['O mapa esta grande demais agora. Uma arena, uma acao, uma prova.'],
    chat: ['Voce abriu varias frentes. Agora o movimento mais forte e reduzir o mapa e fechar uma coisa pequena.'],
    card: ['PRIORIDADE: reduzir escopo.\nRISCO: abrir mais frentes sem concluir.\nAJA: escolha uma acao de ate 10 minutos.'],
  },
  atrasado: {
    push: ['O tempo andou mais rapido que as entregas. Uma acao pequena ja reduz o atraso.'],
    balao: ['O ciclo correu na frente. Nao reorganiza tudo: fecha uma prova pequena agora.'],
    chat: ['O atraso aqui nao pede drama, pede uma prova concreta. Se uma acao pequena sair hoje, o ciclo volta a ter tracao.'],
    card: ['PRIORIDADE: recuperar tracao.\nRISCO: gastar energia redesenhando o plano.\nAJA: conclua a menor acao que ainda conta.'],
  },
  em_ritmo: {
    push: ['O ciclo esta no ritmo. Protege a cadencia sem inventar frente nova.'],
    balao: ['Boa cadencia. Mantem simples: uma execucao limpa sustenta mais que escopo novo.'],
    chat: ['Voce nao precisa aumentar o mapa agora. O melhor movimento e preservar a cadencia com uma acao bem fechada.'],
    card: ['PRIORIDADE: proteger cadencia.\nRISCO: abrir frente desnecessaria.\nAJA: conclua a proxima acao planejada.'],
  },
  em_risco: {
    push: ['A janela ficou curta. Corta o excesso e salva uma entrega real.'],
    balao: ['Agora e hora de cortar, nao de expandir. Escolha o que ainda muda o ciclo.'],
    chat: ['O risco nao e falta de plano, e excesso para o tempo que sobrou. Vamos escolher a entrega que ainda muda o resultado.'],
    card: ['PRIORIDADE: salvar o que ainda importa.\nRISCO: tentar compensar tudo e nao fechar nada.\nAJA: corte uma frente e execute a acao critica.'],
  },
  retomando: {
    push: ['Voce voltou. Uma prova pequena reabre o fio.'],
    balao: ['Nao tenta pagar os dias perdidos agora. Registra uma prova real e volta para o jogo.'],
    chat: ['Retorno bom nao e compensar tudo. E fazer uma acao real hoje para o sistema voltar a ter pulso.'],
    card: ['PRIORIDADE: retomar sem compensacao.\nRISCO: tentar resolver o atraso inteiro.\nAJA: registre uma prova real hoje.'],
  },
  proximo_compromisso: {
    push: ['Sua acao esta chegando. Prepara o ambiente e entra sem renegociar.'],
    balao: ['Essa acao esta perto. Arruma o minimo em volta e comeca.'],
    chat: ['O melhor uso do Oraculo agora e tirar atrito: prepare o ambiente e entre na acao sem redesenhar o plano.'],
    card: ['PRIORIDADE: entrar na acao.\nRISCO: renegociar na hora de executar.\nAJA: prepare o ambiente e comece.'],
  },
  pronto_para_fechar: {
    push: ['Seu dia ja tem material. Fecha o painel e deixa amanha menos nebuloso.'],
    balao: ['Ja existe progresso para revisar. Fecha o dia antes que ele fique aberto na cabeca.'],
    chat: ['O dia ja tem materia suficiente para fechamento. Revisar agora deixa o proximo movimento mais limpo.'],
    card: ['PRIORIDADE: fechar o dia.\nRISCO: perder clareza do que foi feito.\nAJA: faca o fechamento do painel.'],
  },
  arena_esquecida: {
    push: ['Uma arena ficou sem prova. Vale decidir se ela entra hoje ou sai do ciclo.'],
    balao: ['Essa arena esta sem sinal ha alguns dias. Falta tempo ou falta uma proxima acao?'],
    chat: ['A arena esquecida pode ser falta de espaco ou falta de acao clara. Vamos decidir se ela entra com algo pequeno ou sai do caminho.'],
    card: ['PRIORIDADE: resolver arena parada.\nRISCO: manter frente morta consumindo atencao.\nAJA: crie uma acao pequena ou pause a arena.'],
  },
  escopo_pesado: {
    push: ['O ciclo esta pesado. Remover uma frente pode salvar mais que adicionar outra.'],
    balao: ['Tem peso demais para o tamanho da janela. Corta antes de prometer mais.'],
    chat: ['O problema parece carga, nao motivacao. O proximo movimento adulto e tirar peso do ciclo.'],
    card: ['PRIORIDADE: aliviar carga.\nRISCO: excesso virar abandono.\nAJA: pause ou remova uma frente secundaria.'],
  },
  oportunidade_util: {
    push: ['Tem valor parado esperando uso. Abre uma recompensa ou escolhe a proxima prova.'],
    balao: ['Existe oportunidade util aqui. Use o que ja esta disponivel antes de abrir outra frente.'],
    chat: ['Antes de criar mais estrutura, vale usar o que ja esta pronto: recompensa, ficha, campanha ou acao disponivel.'],
    card: ['PRIORIDADE: usar valor disponivel.\nRISCO: acumular recurso sem movimento.\nAJA: escolha uma oportunidade e transforme em acao.'],
  },
  streak_mantida: {
    push: ['Sequencia mantida. Uma prova real segurou a linha.'],
    balao: ['Linha viva: uma acao real ja manteve a sequencia hoje.'],
    chat: ['A sequencia nao vive de login, vive de prova. Hoje ela ja recebeu uma acao real.'],
    card: ['PRIORIDADE: proteger continuidade.\nRISCO: confundir ritmo com perfeicao.\nAJA: mantenha simples e feche a proxima acao.'],
  },
  streak_quebrada: {
    push: ['A linha quebrou, mas o retorno conta. Uma acao hoje reabre o jogo.'],
    balao: ['Caiu, voltou. Sem drama: registra uma prova e recomeca o fio.'],
    chat: ['A sequencia anterior quebrou, mas isso nao apaga o sistema. Uma acao hoje reinicia o ritmo.'],
    card: ['PRIORIDADE: retorno real.\nRISCO: transformar quebra em abandono.\nAJA: conclua uma acao pequena hoje.'],
  },
  primeira_acao_do_dia: {
    push: ['Primeira acao feita. Sequencia mantida.'],
    balao: ['Primeira prova do dia registrada. A linha continua viva.'],
    chat: ['Boa. Nao precisou ser perfeito; so precisava comecar. A sequencia vive de acao, nao de intencao.'],
    card: ['PRIORIDADE: consolidar o comeco.\nRISCO: abrir outra frente cedo demais.\nAJA: escolha a proxima acao sem aumentar o mapa.'],
  },
};

const getContextDate = (context: OracleContext): string | null => {
  const date = new Date(context.currentTime);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const deriveOracleOperationalState = (context: OracleContext): OracleOperationalState => {
  const contextDate = getContextDate(context);
  const lastProofDate = context.dailyProofLastClosedDate;

  if (context.dailyProofStreakCurrent > 0 && contextDate && lastProofDate === contextDate) {
    return context.pendingActionsToday > 0 ? 'streak_mantida' : 'primeira_acao_do_dia';
  }

  if (context.dailyProofStreakCurrent === 0 && lastProofDate) {
    return 'streak_quebrada';
  }

  if (context.needsFirstArena || context.needsFirstAction || context.needsFirstTask || !context.hasCycle) {
    return 'sem_direcao';
  }

  if (context.cycleRisk === 'alto' || context.cyclePace === 'critico') {
    return 'em_risco';
  }

  if (context.overdueActions > 0 || context.cyclePace === 'atrasado') {
    return 'atrasado';
  }

  if (context.pendingActionsToday >= 6 || context.cyclePendingActions >= 8) {
    return 'escopo_pesado';
  }

  if (context.pendingActionsToday >= 4) {
    return 'disperso';
  }

  if (context.staleArenas.length > 0) {
    return 'arena_esquecida';
  }

  if (context.needsSitrepClosure) {
    return 'pronto_para_fechar';
  }

  if (context.pendingChests > 0) {
    return 'oportunidade_util';
  }

  if (context.cyclePace === 'no_ritmo' || context.cyclePace === 'adiantado') {
    return 'em_ritmo';
  }

  return context.pendingActionsToday > 0 ? 'oportunidade_util' : 'em_ritmo';
};

export const getOracleStateFamily = (state: OracleOperationalState): string => STATE_FAMILY[state];

export const buildOracleVoiceDirective = (
  context: OracleContext,
  surface: OracleSurface,
  mode: OracleMode = context.activeMode,
  recentLines: string[] = [],
): string => {
  const state = deriveOracleOperationalState(context);
  const examples = STATE_EXAMPLES[state]?.[surface] || STATE_EXAMPLES[state]?.chat || [];
  const cleanRecentLines = recentLines
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  return [
    'CAMADA DE VOZ VIVA DO ORACULO',
    `Estado dominante: ${state}`,
    `Familia: ${getOracleStateFamily(state)}`,
    `Superficie: ${surface}`,
    `Tom selecionado: ${mode}`,
    '',
    'Regra principal:',
    '- Escolha uma verdade dominante. Nao despeje 12 assuntos.',
    '- Fale de ciclos, arenas e acoes como movimento real, nao como relatorio.',
    '- Varie a frase. Use os exemplos como direcao de voz, nao copie sempre literal.',
    '- Se houver priorityArenaName ou priorityActionName, use o nome quando isso deixar a fala mais concreta.',
    '- Se a sequencia estiver em 0, nao finja continuidade.',
    '- Se dailyProofLastClosedDate for hoje, pode tratar como prova real do dia ja registrada.',
    '',
    'Regras da superficie:',
    ...SURFACE_RULES[surface].map((rule) => `- ${rule}`),
    '',
    'Exemplos de voz para este estado:',
    ...examples.map((example) => `- ${example}`),
    ...(cleanRecentLines.length > 0
      ? [
          '',
          'Evite repetir frases recentes:',
          ...cleanRecentLines.map((line) => `- ${line}`),
        ]
      : []),
  ].join('\n');
};
