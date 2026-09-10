import type { OracleContext } from '../types';

/**
 * O ESTADO MESTRE — qual e a historia mais importante dos dados agora.
 *
 * O coach tinha catorze assuntos com peso CONSTANTE. Peso constante nao consegue
 * dizer "isto importa mais AGORA": ele diz "isto importa mais SEMPRE". Duas
 * consequencias apareceram na simulacao dos cinco perfis:
 *
 *  - quem voltou hoje depois de seis dias parado ouvia sobre o atraso, porque
 *    atraso pesa 75 e a retomada nao existia como assunto;
 *  - quem estava com 80 de 100 feitas abria a leitura por uma pendencia, porque
 *    reconhecimento pesa 40 e reclamacao de arena pesa 60.
 *
 * O conserto nao e reescrever os catorze. E derivar, ANTES deles, qual e a
 * historia — e deixar essa historia mexer no peso e proibir o que a contradiz.
 *
 * Este arquivo nao inventa dado nenhum: tudo aqui sai do OracleContext que o
 * app ja monta. Ele so decide o que significa.
 */

export type OracleMasterState =
  | 'sem_dados'
  | 'retomando'
  | 'inviavel'
  | 'ultimo_dia'
  | 'forte'
  | 'atrasado'
  | 'sem_ciclo'
  | 'estavel';

export interface OracleMasterDiagnosis {
  estado: OracleMasterState;
  /** Por que ESTE estado venceu. Frase curta, para auditoria. */
  motivo: string;
  /** Fatos verdadeiros que nao sao a historia principal, mas seguem valendo. */
  modificadores: string[];
  /** Familias de assunto que este estado PROIBE, por contradicao. */
  proibidos: string[];
  /** Familia -> bonus de peso. E assim que a historia muda a ordem. */
  bonus: Record<string, number>;
}

/** A conta que nao fecha: o que falta por dia contra o melhor dia ja registrado. */
const contaNaoFecha = (context: OracleContext): { fecha: boolean; porDia: number; melhorDia: number } => {
  const melhorDia = Math.max(0, Math.round(context.bestDailyCompletions || 0));
  const diasRestantes = context.cycleDaysRemaining ?? 0;
  const pendentes = Math.max(0, context.cyclePendingActions);
  if (melhorDia <= 0 || diasRestantes <= 0 || pendentes <= 0) {
    return { fecha: true, porDia: 0, melhorDia };
  }
  const porDia = pendentes / diasRestantes;
  return { fecha: porDia <= melhorDia, porDia, melhorDia };
};

/** A arena que voltou depois de uma pausa longa. O dado ja existe no contexto. */
const arenaRetomada = (context: OracleContext) =>
  (context.arenaSignals || []).find((sinal) => sinal.trend === 'retomando') || null;

export const deriveOracleMasterState = (context: OracleContext): OracleMasterDiagnosis => {
  const modificadores: string[] = [];
  const progresso = Math.round(context.cycleCompletionPercent || 0);
  const esperado = Math.round(context.expectedCycleCompletionPercent || 0);
  const pendentes = Math.max(0, context.cyclePendingActions);
  const conta = contaNaoFecha(context);
  const retomada = arenaRetomada(context);
  const atrasado = context.cyclePace === 'atrasado' || context.cyclePace === 'critico';

  // Os fatos secundarios sao coletados ANTES de escolher a historia: eles valem
  // independentemente de quem abre a leitura.
  if (atrasado) modificadores.push(`ciclo atrasado (${progresso}% contra ${esperado}% esperado)`);
  if (!conta.fecha) modificadores.push(`ritmo exigido acima do melhor dia (${conta.melhorDia})`);
  if (retomada) modificadores.push(`retomada em ${retomada.arenaName} apos ${retomada.trendPauseDays ?? '?'} dias`);
  if (context.pendingActionsToday === 0 && context.hasCycle) modificadores.push('dia de hoje sem pendencia');
  if ((context.pendingActionsToday || 0) >= 6) modificadores.push(`${context.pendingActionsToday} pendencias so hoje`);
  if (context.cyclePace === 'adiantado') modificadores.push('ritmo adiantado');

  // 1. SEM DADOS. Nao ha diagnostico a fazer, e inventar um seria pior que calar.
  // `hasArenas` entra junto das flags: elas vem do servidor e nem todo chamador
  // as preenche, mas "nao tem arena" e a mesma ausencia de estrutura.
  if (context.needsFirstArena || context.needsFirstAction || context.needsFirstTask || !context.hasArenas) {
    return {
      estado: 'sem_dados',
      motivo: 'ainda nao existe estrutura suficiente para diagnosticar',
      modificadores,
      // Sem dados, TODA leitura de ritmo e invencao.
      proibidos: [
        'coach:on-pace', 'coach:ahead', 'coach:behind', 'coach:deriva', 'coach:conta-nao-fecha',
        // Observacao sobre o passado do ciclo exige passado de ciclo.
        'coach:dia-concentrado', 'coach:volume-x-constancia',
      ],
      bonus: { 'coach:first-arena': 40, 'coach:start-cycle': 30 },
    };
  }

  // 2. RETOMADA vence o atraso. Quem voltou hoje depois de dias parado ja sabe
  //    que esta atras; o que ele nao sabe e que o app percebeu que ele voltou.
  //    O atraso nao some — vira modificador.
  if (retomada) {
    return {
      estado: 'retomando',
      motivo: `${retomada.arenaName} voltou apos ${retomada.trendPauseDays ?? 'varios'} dias parada`,
      modificadores,
      // Cobrar compensacao ou elogiar ritmo, aqui, sao os dois erros opostos.
      proibidos: ['coach:on-pace', 'coach:ahead', 'coach:deriva'],
      bonus: { 'coach:retomada': 60, 'coach:behind': -20 },
    };
  }

  // 3. A CONTA NAO FECHA. Enquanto for verdade, nada pode dizer que esta no
  //    ritmo — e essa e a trava mais importante desta revisao.
  if (!conta.fecha) {
    return {
      estado: 'inviavel',
      motivo: `faltam ${pendentes} em ${context.cycleDaysRemaining} dia(s): ${conta.porDia.toFixed(1)}/dia contra melhor dia de ${conta.melhorDia}`,
      modificadores,
      // Com a conta estourada, observacao sobre o padrao vira conversa fiada: o
      // que importa e o numero que nao fecha.
      proibidos: [
        'coach:on-pace', 'coach:ahead', 'coach:deriva',
        'coach:dia-concentrado', 'coach:volume-x-constancia',
      ],
      bonus: { 'coach:conta-nao-fecha': 40 },
    };
  }

  // 4. ULTIMO DIA. Prazo e fato, nao interpretacao.
  if (context.cycleDaysRemaining === 0 && pendentes > 0) {
    return {
      estado: 'ultimo_dia',
      motivo: `ultimo dia do ciclo com ${pendentes} pendente(s)`,
      modificadores,
      proibidos: ['coach:on-pace', 'coach:ahead', 'coach:deriva'],
      bonus: { 'coach:last-day': 40 },
    };
  }

  // 5. FORTE. Reconhecimento e diagnostico, nao elogio decorativo: quando o
  //    conjunto esta claramente bom, ele ABRE a leitura, e a excecao vem depois.
  // O corte e +5 por simetria com a deriva, que avisa a partir de -4: se
  // escorregar quatro pontos ja merece um toque, estar cinco a frente ja merece
  // ser reconhecido. Sem isso, 80% contra 71% caia em "estavel" e a leitura
  // abria por uma pendencia de arena — o item 13 da revisao.
  if (context.cyclePace === 'adiantado' || progresso - esperado >= 5) {
    return {
      estado: 'forte',
      motivo: `${progresso}% feito contra ${esperado}% esperado`,
      modificadores,
      // Falar de atraso ou deriva aqui e contradicao direta.
      proibidos: ['coach:behind', 'coach:deriva'],
      bonus: { 'coach:ahead': 50, 'coach:quanto-falta': -25, 'coach:arena-natimorta': -10 },
    };
  }

  if (atrasado) {
    return {
      estado: 'atrasado',
      motivo: `${progresso}% feito contra ${esperado}% esperado`,
      modificadores,
      proibidos: ['coach:on-pace', 'coach:ahead'],
      bonus: {},
    };
  }

  if (!context.hasCycle) {
    return {
      estado: 'sem_ciclo',
      motivo: 'ha estrutura montada, mas nenhum ciclo aberto',
      modificadores,
      // Sem ciclo nao ha ritmo de ciclo para comentar.
      proibidos: ['coach:on-pace', 'coach:ahead', 'coach:behind', 'coach:deriva', 'coach:conta-nao-fecha'],
      bonus: { 'coach:start-cycle': 20 },
    };
  }

  return {
    estado: 'estavel',
    motivo: `${progresso}% feito contra ${esperado}% esperado, sem desvio relevante`,
    modificadores,
    proibidos: [],
    bonus: {},
  };
};
