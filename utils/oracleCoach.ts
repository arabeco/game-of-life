import type { OracleSpeechTone } from '../constants/oracleSpeechLibrary';
import type { OracleContext } from '../types';
import type { OracleCandidateInput } from './oracleCandidates.ts';
import { rankOracleCandidates, ORACLE_CANDIDATE_WEIGHTS } from './oracleCandidates.ts';
import type { OracleSpeechMemoryEntry } from './oracleSpeechMemory.ts';
import { isOracleSubjectOnCooldown, recallOracleSpeech } from './oracleSpeechMemory.ts';

// Os tipos de ritmo moram no arbitro agora, junto de quem os le. Reexportados
// para quem ja importava daqui.
export type { OracleCoachPace, OracleCoachArenaPace, PlannerCoachArena } from './oracleCandidates.ts';

export type OracleCycleCoachAction =
  | { id: string; label: string; kind: 'open_planner' }
  | { id: string; label: string; kind: 'open_cycle' }
  | { id: string; label: string; kind: 'open_arenas' }
  | { id: string; label: string; kind: 'open_arena'; arenaId: string };

export interface OracleCycleCoachBrief {
  id: string;
  content: string;
  quickActions: OracleCycleCoachAction[];
}

/**
 * Os tres campos `focusArena*` sairam daqui.
 *
 * Eles eram a unica janela para a camada de arena, e mostravam UMA — a primeira
 * de um ranking por gravidade, com as outras cinco ja descartadas. No lugar
 * deles entra `arenas`, com todas, e quem escolhe passa a ser o arbitro.
 */
export type PlannerCoachContext = OracleCandidateInput;

// getOracleCoachDailyLimit saiu daqui.
//
// Ela dizia quantas falas por dia cada nivel de presenca recebe — a mesma
// pergunta que ORACLE_PRESENCE_RULES.openingLine responde, num arquivo que nao
// conhecia o outro. Duas regras sobre o mesmo assunto e como o app acabava
// dizendo uma coisa na tabela e fazendo outra na tela.

export const shouldShowPlannerCoach = (
  presenceLevel: number,
  random: () => number = Math.random,
): boolean => {
  if (presenceLevel <= 1) return false;
  return random() < (presenceLevel >= 3 ? 0.55 : 0.25);
};

const pickLine = (lines: string[], random: () => number): string => (
  lines[Math.floor(random() * lines.length)] || lines[0] || ''
);

/**
 * A fala de abertura, agora por TOM.
 *
 * Ela era a fala mais vista do app — dispara toda vez que se abre, no nivel
 * Presente — e tinha o menor estoque de todos: 20 frases, duas por situacao, sem
 * variacao nenhuma de tom. As reacoes ja falavam em quatro vozes; a abertura,
 * que aparece muito mais, falava numa so.
 *
 * O tom nao e enfeite: e o que o Premium compra. Ter reacao com tom e abertura
 * sem tom fazia o Oraculo mudar de personalidade dependendo do que ele estava
 * dizendo.
 *
 * As quatro vozes, e o que separa uma da outra:
 *   neutro    — constata. Nao sugere, nao pergunta, nao consola.
 *   coach     — entrega o proximo passo, concreto e pequeno.
 *   reflexivo — devolve a pergunta em vez da resposta.
 *   calmo     — tira o peso antes de qualquer coisa.
 *
 * Custo de rede: zero. Sao textos escritos, escolhidos no aparelho, com os
 * numeros da propria pessoa preenchidos nos marcadores.
 */

type CoachToneLines = Record<OracleSpeechTone, readonly string[]>;

// Exportado para o teste conseguir medir variacao por estado e por tom. A
// contagem sozinha nao basta: duas linhas iguais contam duas e variam uma.
export const COACH_LINES: Record<string, CoachToneLines> = {
  /** Sumiu por tres dias ou mais. Marcadores: {dias} */
  /**
   * A pessoa sumiu por dias — e esta LENDO isto, o que significa que ela voltou.
   *
   * As linhas antigas anunciavam a ausencia para quem acabara de encerra-la:
   * "voce nao abre o Planner ha 5 dias", dito a alguem que estava com o Planner
   * aberto na mao. E o mesmo erro de mandar cortar meta no dia em que ela fez a
   * coisa certa — o app comentando o passado e ignorando o unico fato novo.
   *
   * A volta e o acontecimento. O numero fica, porque reconhecer o intervalo e
   * diferente de fingir que ele nao existiu, mas quem leva a frase e o retorno.
   */
  ausente: {
    neutro: [
      'Voltou depois de {dias} dias. As ações continuam onde estavam.',
      '{dias} dias de intervalo, e você está aqui. Nada foi perdido, só parou.',
      '{dias} dias fora, e o painel está igual ao que você deixou.',
      'Intervalo de {dias} dias. Começa do ponto em que parou, não do zero.',
    ],
    coach: [
      'Voltou depois de {dias} dias. Começa por uma ação pequena, e ajusta o resto depois.',
      'De volta em {dias} dias. Escolhe uma só para hoje: recomecar pesa menos que compensar.',
      '{dias} dias fora. Não tenta compensar hoje: uma ação já recoloca o ritmo.',
      'Está de volta. Abre a arena mais fácil que tiver e fecha uma coisa.',
    ],
    reflexivo: [
      'Voltou depois de {dias} dias. O que mudou na sua vida nesse intervalo?',
      '{dias} dias longe, e você voltou. Foi falta de tempo, ou o plano tinha deixado de servir?',
      '{dias} dias, e você voltou hoje. O que te trouxe de volta?',
      'Depois de {dias} dias, o que aqui ainda faz sentido para você?',
    ],
    calmo: [
      'Voltou depois de {dias} dias, e está tudo bem. O painel esperou, não cobrou.',
      '{dias} dias de pausa. Não precisa recuperar nada. Começa de onde dá.',
      '{dias} dias de intervalo. Voltar já foi a parte difícil.',
      'Você voltou, e isso basta por hoje.',
    ],
  },

  /**
   * Uma arena voltou a andar depois de uma pausa de verdade.
   *
   * Este e o unico estado que descreve uma MUDANCA e nao um lugar, e por isso e
   * o unico que a pessoa nao consegue ler na tela: a tela mostra 22%, nao mostra
   * que ontem eram 22% ha oito dias.
   *
   * Toda voz tem uma linha com {dias} e uma sem. Nao e enfeite: fillCoachLine
   * invalida a linha quando falta variavel, entao a sem numero e a garantia de
   * que sempre sobra alguma coisa para dizer.
   *
   * E nenhuma delas finge que a arena esta em dia — dizer "voltou a andar" e
   * "ainda esta atras" na mesma frase e o que separa reconhecer de bajular.
   */
  arena_retomada: {
    neutro: [
      'Depois de {dias} dias parada, {arena} voltou a andar. Ainda está atrás, mas mudou de direção.',
      '{arena} voltou a andar. Continua atrás do planejado, e agora está em movimento.',
      '{arena} teve movimento hoje depois de um tempo parada.',
    ],
    coach: [
      '{arena} ficou {dias} dias parada e voltou hoje. Repete amanhã e vira ritmo.',
      '{arena} saiu do lugar. O próximo dia é o que decide se foi um dia ou uma retomada.',
      '{arena} andou. Marca a próxima dela agora, enquanto está quente.',
    ],
    reflexivo: [
      '{dias} dias parada, e hoje {arena} andou. O que mudou hoje que não existia ontem?',
      '{arena} voltou depois de um tempo parada. Dá para repetir o que fez isso acontecer?',
      '{arena} voltou. O que estava travando ela até ontem?',
    ],
    calmo: [
      '{arena} voltou depois de {dias} dias. Não precisa recuperar tudo — precisa continuar.',
      '{arena} andou de novo. O tempo parado não volta, e também não precisa ser pago.',
      '{arena} andou de novo, e isso já é bastante.',
    ],
  },

  /** Tem arena, nao tem ciclo. */
  sem_ciclo: {
    neutro: [
      'Você tem arena e não tem ciclo aberto. O ciclo é o que dá começo e fim ao período.',
      'Sem ciclo, as ações existem mas não tem prazo nem fecho.',
      'Suas arenas estão sem período definido.',
      'Não há ciclo aberto. As ações existem soltas no tempo.',
    ],
    coach: [
      'Abra um ciclo de sete dias ou menos. Curto é mais fácil de terminar do que longo.',
      'Próximo passo: monte um ciclo pequeno. Uma semana já dá ritmo sem virar dívida.',
      'Abre um ciclo hoje e já coloca as arenas que você quer tocar nesta semana.',
      'Escolhe um prazo pequeno. Prazo curto termina; prazo longo vira dívida.',
    ],
    reflexivo: [
      'Você tem arena, mas não marcou um período. Quanto tempo você quer se dar?',
      'O que você quer conseguir enxergar quando esse período fechar?',
      'Sem ciclo, como você vai saber que esse período acabou?',
      'O que você quer que seja verdade sobre você daqui a uma semana?',
    ],
    calmo: [
      'Já tem arena, que era a parte difícil. O ciclo pode ser curto e sem ambição.',
      'Não precisa de um plano grande. Uma semana já é um ciclo.',
      'Não precisa de ciclo hoje. Quando quiser um começo e um fim, ele está ali.',
      'Um ciclo curto pesa menos que a dúvida de não ter nenhum.',
    ],
  },

  /** Ciclo longo com pouco progresso. Marcadores: {dias}, {progresso} */
  ciclo_longo: {
    neutro: [
      'Ciclo de {dias} dias, {progresso}% andado.',
      '{progresso}% em um ciclo de {dias} dias. O prazo está maior que o ritmo.',
    ],
    coach: [
      'Ciclo de {dias} dias em {progresso}%. Encurte a rodada ou tire uma frente.',
      '{progresso}% de {dias} dias. Reduzir o escopo agora custa menos que arrastar até o fim.',
    ],
    reflexivo: [
      'Ciclo de {dias} dias em {progresso}%. O ciclo está grande, ou a semana ficou cheia?',
      '{progresso}% andado. O que você planejou ainda é o que você quer?',
    ],
    calmo: [
      'Ciclo longo anda devagar mesmo. {progresso}% não é atraso, é o tamanho da rodada.',
      'São {dias} dias. Não há pressa embutida nisso.',
    ],
  },

  /** Sem conclusao ha tres dias ou mais. Marcadores: {dias} */
  sem_entrega: {
    neutro: [
      'Última conclusão há {dias} dias.',
      '{dias} dias sem fechar nada. A sequência parou.',
      '{dias} dias sem nada concluído. As ações continuam abertas.',
      'Nenhuma entrega em {dias} dias.',
    ],
    coach: [
      'Faz {dias} dias. Fecha a menor que estiver aberta hoje.',
      '{dias} dias sem entrega. Escolhe a mais barata e conclui: o resto volta sozinho.',
      '{dias} dias parados. Pega a de menor duração e fecha ela agora.',
      'Uma ação pequena hoje vale mais que um plano novo. Escolhe uma.',
    ],
    reflexivo: [
      '{dias} dias sem concluir. O que está no caminho?',
      'Faz {dias} dias. As ações ainda cabem no seu dia como estão?',
      '{dias} dias sem fechar nada. Foi o dia que encheu, ou a lista?',
      'Faz {dias} dias. Você mudou, ou a lista é que ficou para trás?',
    ],
    calmo: [
      '{dias} dias sem entrega, e isso acontece. Uma pequena hoje já recoloca.',
      'A sequência esfriou. Não precisa voltar inteiro de uma vez.',
      '{dias} dias sem entrega. Não há dívida acumulando aqui.',
      'Parar acontece. O que estava aberto continua aberto, sem juros.',
    ],
  },

  /** Arena de foco atrasada. Marcadores: {arena} */
  /**
   * Marco de sequencia: 7, 14, 30, 60, 100.
   *
   * A unica entrada do banco que so oferece. Nao pede acao, nao aponta proximo
   * passo, nao lembra do que falta — pedir alguma coisa aqui estragaria o unico
   * momento do app em que a pessoa nao deve nada a ninguem.
   *
   * E o numero e sempre dito. O marco existe justamente para o acumulado virar
   * acumulado; sem o numero, o dia 30 e igual ao dia 12.
   */
  streak_marco: {
    neutro: [
      '{streak} dias seguidos. Isso não foi sorte.',
      'Marca de {streak} dias. O número é seu.',
    ],
    coach: [
      '{streak} dias. Quem chega aqui já não depende de vontade, depende de habito.',
      'São {streak} dias seguidos. Guarda esse número para o dia em que bater dúvida.',
    ],
    reflexivo: [
      '{streak} dias seguidos. O que você era no primeiro deles?',
      'Chegou a {streak}. O que mudou de verdade nesse intervalo?',
    ],
    calmo: [
      '{streak} dias. Sem pressa e sem barulho, e chegou aqui.',
      'São {streak} dias seguidos. Não precisa fazer nada com isso agora.',
    ],
  },

  /**
   * A sequencia morre hoje se nada acontecer.
   *
   * O numero E a fala. Ate aqui nenhuma das 200 linhas do app mencionava o
   * streak — o que mais segura a pessoa era a unica coisa que o Oraculo nao
   * comentava. Por isso as oito linhas usam {streak}: "23 dias" reconhece um
   * percurso, "bom trabalho" nao reconhece nada.
   *
   * Nenhuma delas ameaca. A perda ja e o incentivo; acrescentar drama em cima
   * seria cobrar duas vezes pelo mesmo fato.
   */
  streak_em_risco: {
    neutro: [
      '{streak} dias seguidos, e hoje ainda sem nenhuma ação. Uma fecha o dia.',
      'Sua sequência está em {streak}. Falta a de hoje.',
      '{diasSeguidos}a noite seguida chegando no limite com {streak} dias em jogo.',
      'Nenhuma ação hoje, e a sequência de {streak} depende disso.',
    ],
    coach: [
      '{streak} dias de pé. Escolhe a menor ação que tiver e mantém.',
      'Uma ação agora é a diferença entre {streak} e começar de novo amanhã.',
      'Segunda vez esta semana que dá essa hora. Antecipa amanhã e para de depender do limite.',
      'Falta uma ação para os {streak} continuarem. A menor serve.',
    ],
    reflexivo: [
      '{streak} dias, e hoje passou sem nenhuma. O dia foi cheio, ou foi só escapando?',
      'Sua sequência está em {streak}. Ela ainda significa o que significava quando começou?',
      'São {diasSeguidos} noites seguidas apertando no fim. O problema é o dia ou é a hora?',
      '{streak} dias construídos, e hoje ainda vazio. Vale o risco?',
    ],
    calmo: [
      'Seu {streak} está de pé até a virada do dia. Uma ação segura ele.',
      '{streak} dias. Se hoje não der, também está tudo bem — mas ainda dá.',
      '{diasSeguidos} noites assim seguidas. Talvez o horário é que não está ajudando.',
      '{streak} dias. Uma ação pequena é o suficiente, e ainda há tempo.',
    ],
  },

  /**
   * A estrutura pede mais do que a pessoa jamais entregou.
   *
   * E o unico estado em que o Oraculo diz que o problema NAO e ela. Por isso
   * nenhuma linha cobra, nenhuma pede esforco, e nenhuma sugere abandonar: todas
   * apontam o numero. Nao culpar alguem por um erro estrutural e a diferenca de
   * produto inteira aqui.
   *
   * Marcadores: {acoes} — o que o plano pede por dia. {maximo} — o melhor dia
   * que ela ja teve.
   */
  meta_inflada: {
    neutro: [
      'Sua estrutura pede {acoes} ações por dia. Seu melhor dia até agora teve {maximo}.',
      'O plano pede {acoes} por dia. Isso não é falta de esforço, é conta que não fecha.',
    ],
    coach: [
      '{acoes} ações por dia é o que está montado. Corte pela metade e você passa a fechar o dia.',
      'Seu melhor dia teve {maximo}. Ajuste as repetições para perto disso e o resto se resolve.',
    ],
    reflexivo: [
      'O plano pede {acoes} por dia. Você montou para quem você é, ou para quem queria ser?',
      'Seu melhor dia foi {maximo} e a meta pede {acoes}. Qual dos dois números é o real?',
    ],
    calmo: [
      'São {acoes} ações por dia aí. Não é você que está devendo — é o número.',
      'O dia que você montou é maior que o dia que existe. Dá para baixar agora, sem perder nada.',
    ],
  },

  /**
   * Arena atras do ritmo. Este e o caso de EXECUCAO, nao de estrutura.
   *
   * Tres destas linhas mandavam cortar a meta — "reveja a meta", "diminua a
   * repeticao", "talvez a meta e que estava grande". Mas estar atras nao e
   * evidencia de meta errada: se voce pos 2 acoes por dia e passou a semana no
   * videogame, nao ha nada de errado com o numero, voce so nao fez. Sugerir
   * corte ali e o app se rendendo por voce.
   *
   * Quem manda cortar e `meta_inflada`, e so quando ha evidencia de verdade —
   * a demanda passa do dobro do melhor dia que a pessoa ja teve. Aqui a fala
   * volta para o que cabe: uma acao, hoje.
   */
  arena_atrasada: {
    neutro: [
      '{arena} está atrás do ritmo do ciclo.',
      'Pelo tempo e pelo progresso, {arena} é a que mais ficou para trás.',
      '{arena} acumulou pendência em relação ao resto do ciclo.',
    ],
    coach: [
      'Abra {arena} e feche uma ação dela hoje. A menor que tiver, não a mais difícil.',
      '{arena} não andou esta semana. Uma ação hoje já muda o número de amanhã.',
      'Se for tocar em alguma coisa hoje, que seja {arena}.',
    ],
    reflexivo: [
      '{arena} ficou para trás. Ela ainda importa como importava quando você criou?',
      'O que {arena} pedia de você que a semana não deu?',
      '{arena} está atrás. Ela é prioridade de verdade, ou só estava na lista?',
    ],
    calmo: [
      '{arena} está devagar, e devagar ainda é andar. Uma ação hoje basta.',
      'Nem toda arena anda no mesmo passo. {arena} pode esperar sem culpa.',
      '{arena} ficou para trás, e nada nela urgente. Um passo quando der.',
    ],
  },

  /** Arena parada, candidata a pausa. Marcadores: {arena} */
  arena_parada: {
    neutro: [
      '{arena} está sem movimento há alguns dias.',
      'Nenhuma ação de {arena} foi registrada recentemente.',
      '{arena} não registra conclusão há bastante tempo.',
    ],
    coach: [
      '{arena} parou. Decide agora: uma ação pequena hoje, ou pausa a arena.',
      'Retomar {arena} com o menor item, ou pausar. As duas resolvem; deixar aberta não.',
      '{arena} parou. Ou uma ação hoje, ou tira ela do ciclo — as duas resolvem.',
    ],
    reflexivo: [
      '{arena} esfriou. Isso é uma fase, ou ela deixou de fazer sentido?',
      'O que aconteceria se você pausasse {arena} por um tempo?',
      '{arena} parou faz tempo. Ela ainda pertence a este ciclo?',
    ],
    calmo: [
      '{arena} parou, e pausar também é uma escolha legítima.',
      'Não precisa manter {arena} viva só porque ela existe.',
      '{arena} está parada. Deixar parada também é uma decisão válida.',
    ],
  },

  /** Ciclo inteiro atrasado. */
  ciclo_atrasado: {
    neutro: [
      'O ciclo está atrás do ritmo pelo tempo restante.',
      'O progresso do ciclo ficou abaixo do que o prazo pedia.',
      'O ciclo está atrás do ritmo previsto para esta altura.',
    ],
    coach: [
      'Antes de compensar, tire uma meta. Fechar menos inteiro vale mais que muito pela metade.',
      'O ciclo apertou. Reduz o escopo hoje e protege o que sobrar.',
      'O ciclo está atrás. Escolhe uma arena só para hoje e ignora o resto.',
    ],
    reflexivo: [
      'O ciclo está atrasado. O que você planejou era para esta semana ou para uma semana ideal?',
      'O que dentro do ciclo você já sabe que não vai acontecer?',
      'O ciclo ficou para trás. Foi a semana, ou o ciclo já nasceu grande?',
    ],
    calmo: [
      'O ciclo está atrás, e isso não apaga o que já foi feito.',
      'Ciclo atrasado não é ciclo perdido. Ainda dá para fechar com o que cabe.',
      'O ciclo está atrasado, e ciclo atrasado ainda termina.',
    ],
  },

  /** Ha uma acao prioritaria clara. Marcadores: {acao} */
  prioridade: {
    neutro: [
      '{acao} é a próxima da fila hoje.',
      'Hoje tem {acao} em aberto.',
      'A próxima da fila é {acao}.',
      '{acao} continua aberta hoje.',
    ],
    coach: [
      'Faz {acao} hoje. Uma real já mantém o ciclo andando.',
      '{acao} primeiro. Depois dela o resto do dia decide sozinho.',
      'Começa por {acao}. Começar pela mais fácil também vale.',
      '{acao} agora, enquanto o dia ainda é seu.',
    ],
    reflexivo: [
      '{acao} cabe hoje de verdade, ou entrou na lista por inércia?',
      'Se só {acao} acontecesse hoje, o dia teria válido?',
      '{acao} é o que importa hoje, ou é só o que sobrou na lista?',
      'Se você fizesse só {acao} hoje, isso seria pouco?',
    ],
    calmo: [
      '{acao} está ali quando der. Não precisa ser agora.',
      'Se {acao} não couber hoje, ajustar a meta é melhor que carregar peso.',
      '{acao} espera. Não precisa ser a primeira coisa do dia.',
      '{acao} está na lista, e a lista não cobra.',
    ],
  },

  /** Ja concluiu algo hoje. Marcadores: {acao} */
  ja_entregou: {
    neutro: [
      'Você concluiu {acao} hoje.',
      '{acao} já saiu hoje.',
      '{acao} foi concluída hoje.',
      'Hoje já tem {acao} fechada.',
    ],
    coach: [
      '{acao} feita. Se ainda houver energia, a próxima menor mantém o ritmo.',
      'Boa, {acao} saiu. Decide agora se para aqui ou puxa mais uma.',
      '{acao} fechada. Se for puxar outra, escolhe a menor.',
      '{acao} saiu. Amanhã começa com essa mesma facilidade.',
    ],
    reflexivo: [
      '{acao} saiu hoje. O que fez ela acontecer, que dá para repetir amanhã?',
      'Você já entregou {acao}. O dia precisa de mais alguma coisa?',
      '{acao} aconteceu hoje. Foi planejado ou foi o dia que abriu espaço?',
      'Você fechou {acao}. Foi ela mesma que você queria fechar?',
    ],
    calmo: [
      '{acao} já foi. Isso já é o dia cumprido, se você quiser que seja.',
      'Uma entrega é suficiente. Encerrar aqui é uma escolha, não desistência.',
      '{acao} feita. O dia já tem o que precisava ter.',
      '{acao} saiu, e não há nada pendente nessa conversa.',
    ],
  },

  /** Estrutura muito enxuta. */
  estrutura_enxuta: {
    neutro: [
      'Você tem uma arena só, com poucas ações.',
      'A estrutura está enxuta: uma frente e pouca coisa dentro.',
    ],
    coach: [
      'Uma segunda arena separa melhor as áreas. Corpo, trabalho e casa não competem na mesma lista.',
      'Cria uma segunda frente quando fizer sentido. Duas pequenas equilibram mais que uma cheia.',
    ],
    reflexivo: [
      'Uma arena só. Ela cobre o que você quer mudar, ou é por onde deu para começar?',
      'O que está fora do app hoje e deveria estar dentro?',
    ],
    calmo: [
      'Uma arena já é um começo inteiro. Não precisa crescer agora.',
      'Enxuto funciona. Adicionar só quando incomodar ter só uma.',
    ],
  },
};

/** Preenche {arena}, {acao}, {dias}, {progresso}. Marcador sem valor invalida a linha. */
const fillCoachLine = (template: string, vars: Record<string, string | number | null>): string | null => {
  let faltou = false;
  const texto = template.replace(/\{(\w+)\}/g, (_all, chave: string) => {
    const valor = vars[chave];
    if (valor === null || valor === undefined || valor === '') { faltou = true; return ''; }
    return String(valor);
  });
  return faltou ? null : texto;
};

const pickCoachLine = (
  estado: keyof typeof COACH_LINES,
  tone: OracleSpeechTone,
  vars: Record<string, string | number | null>,
  random: () => number,
  evitar?: string | null,
): string | null => {
  const porTom = COACH_LINES[estado];
  if (!porTom) return null;
  // Tom desconhecido cai no neutro, que e o gratuito: melhor a voz certa em
  // neutro do que a voz errada.
  const linhas = porTom[tone] || porTom.neutro;
  const validas = linhas.map((linha) => fillCoachLine(linha, vars)).filter((linha): linha is string => Boolean(linha));
  if (validas.length === 0) return null;
  // A mesma frase nunca sai duas vezes seguidas para o mesmo assunto. Quando o
  // assunto so tem uma frase valida, repetir e melhor que calar — o cooldown ja
  // cuida de nao insistir.
  const candidatas = evitar ? validas.filter((linha) => linha !== evitar) : validas;
  const conjunto = candidatas.length > 0 ? candidatas : validas;
  return conjunto[Math.floor(random() * conjunto.length)] || conjunto[0];
};

export interface PlannerCoachSpeech {
  line: string;
  /** O que gravar na memoria depois de falar. */
  entry: OracleSpeechMemoryEntry;
  /** Dias seguidos, ate ontem, no mesmo assunto. Serve para "terceiro dia". */
  consecutiveDays: number;
}

/**
 * A cascata de dez `if` saiu daqui.
 *
 * Ela decidia por ordem fixa: o primeiro que casasse vencia e calava os outros
 * nove. Quem estava tres dias ausente E com uma arena critica E com uma acao
 * prioritaria ouvia sobre a ausencia, sempre — e quem estava em `prioridade`
 * ouvia `prioridade` todo dia, porque a ordem nao muda.
 *
 * Agora os detectores produzem candidatos independentes e o arbitro ordena por
 * relevancia. Aqui so sobra andar na lista ate achar quem pode falar.
 *
 * ANDAR e o ponto, e e por isso que o arbitro devolve lista e nao vencedor: o
 * primeiro colocado pode estar de molho por ter falado ontem, ou nao render
 * frase por faltar variavel. Se so o primeiro voltasse, os dois casos virariam
 * silencio indevido em vez de passar a vez para o proximo.
 *
 * A presenca entra como corte de relevancia. O padrao e 3 (Presente) para que
 * chamadas sem ela se comportem como antes: quem controla se ele fala e a
 * politica de presenca, la em cima; aqui o corte so afina.
 */
export const buildPlannerCoachSpeechDetailed = (
  context: PlannerCoachContext,
  random: () => number = Math.random,
  tone: OracleSpeechTone = 'neutro',
  presenceValue: number = 3,
  memory: OracleSpeechMemoryEntry[] = [],
  today: string = '',
): PlannerCoachSpeech | null => {
  for (const candidato of rankOracleCandidates(context, presenceValue)) {
    const peso = ORACLE_CANDIDATE_WEIGHTS[candidato.type];

    // Sem data nao ha memoria possivel, e ai ele se comporta como antes de ter.
    if (today) {
      const deMolho = isOracleSubjectOnCooldown(
        memory, candidato.type, candidato.arenaId, today, peso.cooldownDays,
      );
      if (deMolho) continue;
    }

    const recall = today
      ? recallOracleSpeech(memory, candidato.type, candidato.arenaId, today)
      : { consecutiveDays: 0, lastLine: null, spokenToday: false, daysSinceLastSaid: null };

    // `diasSeguidos` sai da memoria, nao do detector — o detector nao sabe o que
    // ja foi dito. Na primeira vez ele vale null, e fillCoachLine invalida
    // sozinho as linhas que o usam: a variacao "segunda noite seguida" simplesmente
    // nao existe ate existir. Nenhum `if` a mais para isso.
    const vars = {
      ...candidato.vars,
      diasSeguidos: recall.consecutiveDays > 0 ? recall.consecutiveDays + 1 : null,
    };
    const linha = pickCoachLine(candidato.type, tone, vars, random, recall.lastLine);
    if (!linha) continue;

    return {
      line: linha,
      entry: { type: candidato.type, arenaId: candidato.arenaId, date: today, line: linha },
      consecutiveDays: recall.consecutiveDays,
    };
  }
  return null;
};

/** Atalho de quem so quer a frase. Mantido porque a maior parte das chamadas so quer isso. */
export const buildPlannerCoachSpeech = (
  context: PlannerCoachContext,
  random: () => number = Math.random,
  tone: OracleSpeechTone = 'neutro',
  presenceValue: number = 3,
  memory: OracleSpeechMemoryEntry[] = [],
  today: string = '',
): string | null =>
  buildPlannerCoachSpeechDetailed(context, random, tone, presenceValue, memory, today)?.line ?? null;

/** Quantas linhas o banco tem, por estado e por tom. Usado pelo teste. */
export const COACH_LINE_STATES = Object.keys(COACH_LINES);
export const countCoachLines = (): number =>
  Object.values(COACH_LINES).reduce(
    (soma, porTom) => soma + Object.values(porTom).reduce((s, linhas) => s + linhas.length, 0),
    0,
  );

const openFocusedArena = (context: OracleContext): OracleCycleCoachAction | null => {
  if (!context.focusArenaSignal) return null;
  return {
    id: `coach-open-arena:${context.focusArenaSignal.arenaId}`,
    label: `Abrir ${context.focusArenaSignal.arenaName}`,
    kind: 'open_arena',
    arenaId: context.focusArenaSignal.arenaId,
  };
};

const compactActions = (
  actions: Array<OracleCycleCoachAction | null>,
): OracleCycleCoachAction[] => actions.filter((action): action is OracleCycleCoachAction => Boolean(action)).slice(0, 2);

export const buildOracleCycleCoachBrief = (context: OracleContext): OracleCycleCoachBrief => {
  const focusArena = context.focusArenaSignal;
  const progress = Math.max(0, Math.round(context.cycleCompletionPercent || 0));
  const expected = Math.max(0, Math.round(context.expectedCycleCompletionPercent || 0));
  const completed = Math.max(0, context.cycleCompletedActions);
  const total = Math.max(0, context.cycleTotalActions);
  const pending = Math.max(0, context.cyclePendingActions);

  if (!context.hasArenas) {
    return {
      id: 'coach:first-arena',
      content: 'Vamos comecar pequeno. Escolha uma frente importante da sua vida e crie uma arena com uma acao que realmente caiba na sua semana.',
      quickActions: [{ id: 'coach-open-arenas', label: 'Criar primeira arena', kind: 'open_arenas' }],
    };
  }

  if (!context.hasCycle) {
    return {
      id: 'coach:start-cycle',
      content: `Voce ja tem ${context.totalArenas} arena${context.totalArenas === 1 ? '' : 's'}. Agora escolha uma rodada curta para transformar intencao em ritmo. Sete dias ja bastam para aprender o que cabe de verdade.`,
      quickActions: [
        { id: 'coach-open-cycle', label: 'Montar ciclo', kind: 'open_cycle' },
        { id: 'coach-open-arenas', label: 'Rever arenas', kind: 'open_arenas' },
      ],
    };
  }

  if ((total > 0 && pending === 0) || progress >= 100) {
    return {
      id: `coach:cycle-ready:${context.cycleName || 'active'}`,
      content: `Voce concluiu o que estava medido neste ciclo. Antes de abrir outra rodada, feche este ciclo e registre o que funcionou.`,
      quickActions: [{ id: 'coach-open-cycle', label: 'Fechar ciclo', kind: 'open_cycle' }],
    };
  }

  if (total === 0) {
    return {
      id: `coach:unmeasured:${focusArena?.arenaId || 'cycle'}`,
      content: focusArena
        ? `${focusArena.arenaName} ainda nao tem uma meta mensuravel neste ciclo. Se quiser acompanhar o ritmo, defina uma repeticao minima que seja honesta.`
        : 'Este ciclo ainda nao tem uma meta mensuravel. Escolha uma acao pequena para saber o que significa avancar.',
      quickActions: compactActions([
        openFocusedArena(context),
        { id: 'coach-open-arenas', label: 'Ver arenas', kind: 'open_arenas' },
      ]),
    };
  }

  if (context.cycleDaysRemaining === 0 && pending > 0) {
    return {
      id: `coach:last-day:${context.cycleName || 'active'}:${pending}`,
      content: `O ciclo chegou ao ultimo dia com ${pending} acao${pending === 1 ? '' : 'es'} pendente${pending === 1 ? '' : 's'}. Nao precisa fingir um fechamento perfeito: faca o que ainda cabe e encerre com uma leitura honesta.`,
      quickActions: [
        { id: 'coach-open-planner', label: 'Ver o que ainda cabe', kind: 'open_planner' },
        { id: 'coach-open-cycle', label: 'Rever ciclo', kind: 'open_cycle' },
      ],
    };
  }

  if (context.cyclePace === 'atrasado' || context.cyclePace === 'critico') {
    const arenaLine = focusArena
      ? ` ${focusArena.arenaName} pede mais atencao agora.`
      : '';
    return {
      id: `coach:behind:${focusArena?.arenaId || 'cycle'}:${context.cycleDayNumber || 0}`,
      content: `Seu ciclo esta em ${progress}%, enquanto o tempo percorrido aponta cerca de ${expected}%.${arenaLine} Em vez de tentar compensar tudo, escolha uma acao real ou reduza uma meta que deixou de fazer sentido.`,
      quickActions: compactActions([
        openFocusedArena(context),
        { id: 'coach-open-planner', label: 'Escolher uma acao', kind: 'open_planner' },
      ]),
    };
  }

  if (completed === 0) {
    return {
      id: `coach:first-proof:${context.cycleName || 'active'}`,
      content: `O ciclo comecou, mas ainda falta a primeira conclusao. Nao tente resolver a semana inteira agora: escolha a menor acao que coloca o ciclo em movimento hoje.`,
      quickActions: [
        { id: 'coach-open-planner', label: 'Escolher primeira acao', kind: 'open_planner' },
      ],
    };
  }

  if (context.cyclePace === 'adiantado') {
    return {
      id: `coach:ahead:${context.cycleDayNumber || 0}:${completed}`,
      content: `Boa: voce concluiu ${completed} de ${total} acoes e esta adiantado no ciclo. Proteja esse ritmo sem transformar a vantagem em carga extra.`,
      quickActions: [{ id: 'coach-open-cycle', label: 'Ver andamento', kind: 'open_cycle' }],
    };
  }

  const priorityLine = context.priorityActionName
    ? ` Que tal ${context.priorityActionName} hoje?`
    : ' Escolha uma acao que mantenha o fio sem pesar o dia.';
  return {
    id: `coach:on-pace:${context.cycleDayNumber || 0}:${completed}`,
    content: `Voce concluiu ${completed} de ${total} acoes e esta acompanhando o ritmo do ciclo.${priorityLine}`,
    quickActions: [
      { id: 'coach-open-planner', label: 'Abrir Planner', kind: 'open_planner' },
      { id: 'coach-open-cycle', label: 'Ver ciclo', kind: 'open_cycle' },
    ],
  };
};
