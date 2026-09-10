import type { OracleSpeechTone } from '../constants/oracleSpeechLibrary';
import type { OracleContext } from '../types';
import type { OracleCandidateInput } from './oracleCandidates.ts';
import { detectOracleCandidates, getOracleRelevanceThreshold, ORACLE_CANDIDATE_WEIGHTS } from './oracleCandidates.ts';
import type { OracleSpeechMemoryEntry } from './oracleSpeechMemory.ts';
import { isOracleSubjectOnCooldown, recallOracleSpeech } from './oracleSpeechMemory.ts';
import type { OracleMasterState } from './oracleMasterState.ts';
import { deriveOracleMasterState } from './oracleMasterState.ts';

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
   * "você não abre o Planner ha 5 dias", dito a alguem que estava com o Planner
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
  /**
   * Tem arena, nao tem ciclo.
   *
   * As dezesseis linhas empurravam a MESMA coisa: abra um ciclo. Quem esta sem
   * ciclo ouvia isso dia sim dia nao, sempre com a mesma solucao, e a fala virou
   * cobranca de burocracia — o app pedindo configuracao em vez de pedir acao.
   *
   * Metade delas agora aponta o contrario: sem ciclo tambem se anda, e a arena
   * ja existe. Fazer vale mais que organizar, e o ciclo pode esperar a vontade
   * de ter um.
   *
   * {acao} e a acao prioritaria de hoje, e so existe quando existe: sem ela, as
   * linhas que a citam sao invalidadas sozinhas e sobram as outras.
   *
   * E o enquadramento que faltava: o ciclo nao e o comeco do jogo, e o momento em
   * que voce assume uma META. Antes dele da para executar e ajustar o tamanho das
   * arenas — que e onde a meta ja mora, nas repeticoes. Dizer isso tira o ciclo do
   * caminho de quem so quer comecar, sem tirar o ciclo de quem quer se comprometer.
   *
   * Sao SEIS por voz, e nao uma, porque esta e a ideia que ele mais vai precisar
   * repetir: quem esta sem ciclo costuma ficar semanas assim. Dizer a mesma coisa
   * com as mesmas palavras vira cobranca; dizer a mesma coisa por angulos
   * diferentes — a meta ja esta nas repeticoes, o prazo e que falta, compromisso
   * se assume quando da vontade — continua sendo conversa.
   */
  sem_ciclo: {
    neutro: [
      'Você tem arena e não tem ciclo aberto. O ciclo é o que dá começo e fim ao período.',
      'Vá concluindo e ajustando as repetições das arenas. O ciclo entra quando você quiser meta.',
      'Sem ciclo as ações continuam valendo. {acao} está lá para hoje.',
      'Nenhum ciclo aberto, e nenhuma ação bloqueada por isso.',
      'A meta já está nas repetições que você definiu. O ciclo só acrescenta prazo.',
      'Dá para jogar assim por tempo indeterminado. O ciclo é opcional, não o começo.',
    ],
    coach: [
      'Abra um ciclo de sete dias ou menos. Curto é mais fácil de terminar do que longo.',
      'Sem ciclo você ainda executa. Faz {acao} hoje e decide o prazo depois.',
      'Não precisa planejar para começar. Escolhe uma ação da sua arena e fecha ela.',
      'Executa e ajusta as repetições até o tamanho ficar certo. Aí sim um ciclo, com meta.',
      'Primeiro descobre quanto cabe no seu dia. Depois o ciclo transforma isso em compromisso.',
      'Mexe nas repetições até parecer possível. O prazo vem quando o tamanho estiver certo.',
    ],
    reflexivo: [
      'Você tem arena, mas não marcou um período. Quanto tempo você quer se dar?',
      'Você já sabe o tamanho que consegue manter, ou ainda está descobrindo? O ciclo pede essa resposta.',
      'Você está esperando o plano ficar pronto, ou dá para começar por {acao}?',
      'A arena já existe. O que ainda falta para executar hoje?',
      'O que falta para você querer marcar um prazo: clareza do tamanho, ou vontade de se comprometer?',
      'A meta já existe nas suas repetições. O que o prazo acrescentaria a ela?',
    ],
    calmo: [
      'Não precisa de ciclo hoje. Quando quiser um começo e um fim, ele está ali.',
      'Sem pressa de ciclo. Vá fazendo e ajustando as repetições; a meta pode vir depois.',
      'Sem ciclo também se anda. {acao} cabe hoje, se você quiser.',
      'Fazer vale mais que organizar. O ciclo espera.',
      'O ciclo é um compromisso, e compromisso se assume quando dá vontade. Até lá, é só fazer.',
      'Nada aqui expira por não ter ciclo. Ele fica disponível para quando fizer sentido.',
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
/**
 * O que aconteceu na decisao — para depois conseguir discutir, em vez de adivinhar.
 *
 * Quando uma fala parecer idiota em teste, a pergunta nao pode ser "por que ele
 * falou isso?". Tem de ser: meta_inflada 18.3, arena_retomada 14.6,
 * prioridade 11.7, venceu meta_inflada. Ai da para discutir peso; sem isto, so
 * da para achar.
 *
 * O rastro inclui QUEM PERDEU e POR QUE, e nao so quem ganhou: um candidato
 * barrado pela presenca e um candidato barrado por cooldown falham de formas
 * diferentes e pedem consertos diferentes, e os dois sao invisiveis no resultado.
 */
export type OracleDecisionOutcome = 'venceu' | 'cortado_por_presenca' | 'de_molho' | 'sem_frase' | 'perdeu';

export interface OracleDecisionRow {
  type: string;
  arenaId?: string;
  score: number;
  outcome: OracleDecisionOutcome;
}

export interface OracleDecision {
  chosen: PlannerCoachSpeech | null;
  rows: OracleDecisionRow[];
  presenceValue: number;
  threshold: number;
  tone: OracleSpeechTone;
}

export const decideOracleSpeech = (
  context: PlannerCoachContext,
  random: () => number = Math.random,
  tone: OracleSpeechTone = 'neutro',
  presenceValue: number = 3,
  memory: OracleSpeechMemoryEntry[] = [],
  today: string = '',
): OracleDecision => {
  const threshold = getOracleRelevanceThreshold(presenceValue);
  const rows: OracleDecisionRow[] = [];

  // Os detectados ANTES do corte: quem a presenca barrou nao aparece no ranking,
  // e e justamente o que explica um silencio que parece defeito.
  const detectados = detectOracleCandidates(context)
    .sort((esquerda, direita) => direita.score - esquerda.score);

  let chosen: PlannerCoachSpeech | null = null;

  for (const candidato of detectados) {
    const base = { type: candidato.type, arenaId: candidato.arenaId, score: Math.round(candidato.score * 10) / 10 };

    if (chosen) { rows.push({ ...base, outcome: 'perdeu' }); continue; }
    if (candidato.score < threshold) { rows.push({ ...base, outcome: 'cortado_por_presenca' }); continue; }

    const peso = ORACLE_CANDIDATE_WEIGHTS[candidato.type];
    if (today && isOracleSubjectOnCooldown(memory, candidato.type, candidato.arenaId, today, peso.cooldownDays)) {
      rows.push({ ...base, outcome: 'de_molho' });
      continue;
    }

    const recall = today
      ? recallOracleSpeech(memory, candidato.type, candidato.arenaId, today)
      : { consecutiveDays: 0, lastLine: null, spokenToday: false, daysSinceLastSaid: null };

    const vars = {
      ...candidato.vars,
      diasSeguidos: recall.consecutiveDays > 0 ? recall.consecutiveDays + 1 : null,
    };
    const linha = pickCoachLine(candidato.type, tone, vars, random, recall.lastLine);
    if (!linha) { rows.push({ ...base, outcome: 'sem_frase' }); continue; }

    rows.push({ ...base, outcome: 'venceu' });
    chosen = {
      line: linha,
      entry: { type: candidato.type, arenaId: candidato.arenaId, date: today, line: linha },
      consecutiveDays: recall.consecutiveDays,
    };
  }

  return { chosen, rows, presenceValue, threshold, tone };
};

/**
 * A cascata de dez `if` saiu daqui.
 *
 * Ela decidia por ordem fixa: o primeiro que casasse vencia e calava os outros
 * nove. Quem estava tres dias ausente E com uma arena critica E com uma acao
 * prioritaria ouvia sobre a ausencia, sempre — e quem estava em `prioridade`
 * ouvia `prioridade` todo dia, porque a ordem nao muda.
 *
 * Hoje isto e so a cara simples de decideOracleSpeech, que decide e explica.
 */
export const buildPlannerCoachSpeechDetailed = (
  context: PlannerCoachContext,
  random: () => number = Math.random,
  tone: OracleSpeechTone = 'neutro',
  presenceValue: number = 3,
  memory: OracleSpeechMemoryEntry[] = [],
  today: string = '',
): PlannerCoachSpeech | null =>
  decideOracleSpeech(context, random, tone, presenceValue, memory, today).chosen;

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

/**
 * A leitura do momento — o que o botao "Ler meu dia" devolve.
 *
 * ANTES era uma cascata: o primeiro `if` que casasse vencia e os de baixo nunca
 * eram considerados. Como "atrasado" e "adiantado" ficavam no meio, eles pegavam
 * quase todo mundo — e qualquer leitura nova colocada depois deles seria escrita
 * para o vazio.
 *
 * Agora cada caso e um CANDIDATO com peso, e o mais pesado entre os aplicaveis
 * fala. Os pesos abaixo reproduzem exatamente a ordem antiga, entao esta troca
 * nao muda nenhuma resposta de hoje: ela abre espaco para as leituras que ainda
 * faltam entrarem no lugar certo da fila, em vez de no fim dela.
 *
 * Os textos sao os mesmos, palavra por palavra. O que mudou e quem decide.
 */
type CasoDoBrief = OracleCycleCoachBrief & { peso: number; cooldownDays: number };

/** O raciocinio que levou a uma leitura. Existe para ser auditado, nao exibido. */
export interface OracleCoachAudit {
  estado: OracleMasterState;
  motivo: string;
  modificadores: string[];
  proibidos: string[];
  assunto: string;
  pesoBase: number;
  bonus: number;
  pesoFinal: number;
  porQueVenceu: string;
  descartados: { assunto: string; peso: number; razao: string }[];
}

/** O que a pessoa ja leu, por familia, na forma familia -> data operacional. */
export type OracleCoachMemory = Record<string, string>;

/**
 * A FAMILIA de um caso: os dois primeiros segmentos do id.
 *
 * Os ids carregam parte variavel de proposito — `coach:behind:arena-7:12` muda
 * quando o dia do ciclo muda. Guardar o id inteiro faria o descanso nunca valer,
 * porque amanha ele ja e outra chave. O que descansa e o ASSUNTO.
 */
export const oracleCoachFamily = (id: string): string => id.split(':').slice(0, 2).join(':');

const diasEntre = (de: string, ate: string): number => {
  const inicio = Date.parse(`${de}T12:00:00`);
  const fim = Date.parse(`${ate}T12:00:00`);
  if (!Number.isFinite(inicio) || !Number.isFinite(fim)) return Number.POSITIVE_INFINITY;
  return Math.round((fim - inicio) / 86400000);
};

/**
 * A LEITURA DEIXA DE SER SEMPRE A MESMA.
 *
 * Os catorze casos ja tinham peso, mas o peso e CONSTANTE: quem esta atrasado
 * tem `coach:behind` no topo hoje, amanha e depois. Na pratica duas ou tres
 * portas capturavam todo mundo, e as outras onze — escritas, revisadas e pagas —
 * nunca chegavam a ser lidas por ninguem.
 *
 * O conserto e o mesmo que o arbitro dos candidatos de abertura ja usa: cada
 * caso tem um DESCANSO em dias. Dito uma vez, ele sai da fila pelo tempo dele, e
 * o proximo mais relevante assume. Quem continua atrasado ouve sobre o atraso
 * hoje; amanha ouve sobre a arena natimorta, sobre a concentracao, sobre quanto
 * falta — coisas que tambem sao verdade sobre ele e que ele nunca ia ver.
 *
 * Nao e rodizio: o peso continua mandando dentro do que esta disponivel. O
 * descanso so impede que o primeiro lugar seja vitalicio.
 *
 * A memoria e OPCIONAL e vem de fora. Sem ela a funcao se comporta como antes —
 * o que mantem o teste de regressao valido, e mantem a funcao pura: ela nao le
 * relogio nem armazenamento, so recebe o que ja foi lido.
 *
 * E se TODOS os casos aplicaveis estiverem descansando, o descanso e ignorado.
 * Melhor repetir do que emudecer um botao que a pessoa acabou de apertar.
 */
export const buildOracleCycleCoachBrief = (
  context: OracleContext,
  memoria?: { hoje: string; vistos: OracleCoachMemory },
  auditar?: (auditoria: OracleCoachAudit) => void,
): OracleCycleCoachBrief => {
  const focusArena = context.focusArenaSignal;
  const progress = Math.max(0, Math.round(context.cycleCompletionPercent || 0));
  const expected = Math.max(0, Math.round(context.expectedCycleCompletionPercent || 0));
  const completed = Math.max(0, context.cycleCompletedActions);
  const total = Math.max(0, context.cycleTotalActions);
  const pending = Math.max(0, context.cyclePendingActions);

  const casos: CasoDoBrief[] = [];

  if (!context.hasArenas) {
    casos.push({
      peso: 100, cooldownDays: 0, // Sem arena nenhuma nao existe outra leitura possivel: e o unico caminho.
      id: 'coach:first-arena',
      content: 'Vamos comecar pequeno. Escolha uma frente importante da sua vida e crie uma arena com uma ação que realmente caiba na sua semana.',
      quickActions: [{ id: 'coach-open-arenas', label: 'Criar primeira arena', kind: 'open_arenas' }],
    });
  }

  if (!context.hasCycle) {
    casos.push({
      peso: 95, cooldownDays: 2, // Jogar sem ciclo e modo suportado. Cobrar ciclo todo dia e a definicao de chatear.
      id: 'coach:start-cycle',
      content: `Você ja tem ${context.totalArenas} arena${context.totalArenas === 1 ? '' : 's'}. Agora escolha uma rodada curta para transformar intencao em ritmo. Sete dias ja bastam para aprender o que cabe de verdade.`,
      quickActions: [
        { id: 'coach-open-cycle', label: 'Montar ciclo', kind: 'open_cycle' },
        { id: 'coach-open-arenas', label: 'Rever arenas', kind: 'open_arenas' },
      ],
    });
  }

  if ((total > 0 && pending === 0) || progress >= 100) {
    // O texto antigo mandava "feche este ciclo". Ciclo VENCIDO fecha sozinho hoje
    // — este caso e de quem terminou tudo ANTES do prazo, e ai fechar e escolha,
    // nao instrucao.
    casos.push({
      peso: 90, cooldownDays: 0, // Terminar antes do prazo e fato pontual e acionavel. Calar seria esconder a saida.
      id: `coach:cycle-ready:${context.cycleName || 'active'}`,
      content: context.cycleDaysRemaining && context.cycleDaysRemaining > 0
        ? `Você concluiu o que estava medido neste ciclo, e ainda faltam ${context.cycleDaysRemaining} dia${context.cycleDaysRemaining === 1 ? '' : 's'}. Pode encerrar agora e registrar o que funcionou, ou deixar rodando.`
        : 'Você concluiu o que estava medido neste ciclo. Vale encerrar e registrar o que funcionou.',
      quickActions: [{ id: 'coach-open-cycle', label: 'Ver ciclo', kind: 'open_cycle' }],
    });
  }

  if (total === 0) {
    casos.push({
      peso: 85, cooldownDays: 2, // Meta mensuravel nao aparece sozinha em 24 horas.
      id: `coach:unmeasured:${focusArena?.arenaId || 'cycle'}`,
      content: focusArena
        ? `${focusArena.arenaName} ainda não tem uma meta mensuravel neste ciclo. Se quiser acompanhar o ritmo, defina uma repeticao minima que seja honesta.`
        : 'Este ciclo ainda não tem uma meta mensuravel. Escolha uma ação pequena para saber o que significa avancar.',
      quickActions: compactActions([
        openFocusedArena(context),
        { id: 'coach-open-arenas', label: 'Ver arenas', kind: 'open_arenas' },
      ]),
    });
  }

  if (context.cycleDaysRemaining === 0 && pending > 0) {
    casos.push({
      peso: 80, cooldownDays: 0, // O ultimo dia acontece uma vez por ciclo. Nao ha o que espacar.
      id: `coach:last-day:${context.cycleName || 'active'}:${pending}`,
      content: `O ciclo chegou ao último dia com ${pending} acao${pending === 1 ? '' : 'es'} pendente${pending === 1 ? '' : 's'}. Não precisa fingir um fechamento perfeito: faca o que ainda cabe e encerre com uma leitura honesta.`,
      quickActions: [
        { id: 'coach-open-planner', label: 'Ver o que ainda cabe', kind: 'open_planner' },
        { id: 'coach-open-cycle', label: 'Rever ciclo', kind: 'open_cycle' },
      ],
    });
  }

  if (context.cyclePace === 'atrasado' || context.cyclePace === 'critico') {
    const arenaLine = focusArena
      ? ` ${focusArena.arenaName} pede mais atencao agora.`
      : '';
    casos.push({
      peso: 75, cooldownDays: 1, // Cada dia atras e um fato novo — mas um dia de folga e o que deixa o resto da fila existir.
      id: `coach:behind:${focusArena?.arenaId || 'cycle'}:${context.cycleDayNumber || 0}`,
      content: `Seu ciclo esta em ${progress}%, enquanto o tempo percorrido aponta cerca de ${expected}%.${arenaLine} Em vez de tentar compensar tudo, escolha uma ação real ou reduza uma meta que deixou de fazer sentido.`,
      quickActions: compactActions([
        openFocusedArena(context),
        { id: 'coach-open-planner', label: 'Escolher uma ação', kind: 'open_planner' },
      ]),
    });
  }

  /**
   * A DERIVA — o toque antes do buraco.
   *
   * `behind` (peso 75) so acorda quando o ritmo ja e 'atrasado', e 'atrasado'
   * comeca em delta -10. Existe portanto uma faixa inteira em que a pessoa ja
   * esta escorregando e o app responde "voce esta acompanhando o ritmo".
   *
   * Este caso mora nessa faixa, e nao fala de buraco: fala de DIRECAO. Uma coisa
   * combinada ficou para tras e o dia seguinte passou sem retomada.
   *
   * E o que a sequencia tentava capturar e nao conseguia. A sequencia media o
   * INTERVALO — qualquer dia parado quebrava, inclusive o descanso de quem estava
   * indo bem. Isto mede o COMBINADO contra o FEITO, que e o que de fato prevê um
   * ciclo desandar: nao o dia que faltou, mas o que faltou e nao voltou.
   *
   * Por isso ele exige dois dias de folga no ciclo: avisar de deriva quando nao
   * ha mais tempo de corrigir e so cobrança.
   */
  const deriva = expected - progress;
  // "Uma acao hoje devolve o rumo" exige que exista acao HOJE. O teste era
  // contra as pendencias do CICLO, entao quem tem meta de frequencia — seis
  // treinos em catorze dias — recebia ordem de treinar num dia sem treino
  // marcado, so porque 67% fica abaixo dos 71% lineares. Meta semanal nao e
  // divida diaria, e o app nao deve inventar urgencia que a agenda nao registra.
  if (context.cyclePace === 'no_ritmo' && deriva >= 4 && (context.pendingActionsToday || 0) > 0 && (context.cycleDaysRemaining || 0) >= 2) {
    const arenaLine = focusArena?.arenaName
      ? ` ${focusArena.arenaName} foi a que mais ficou para tras.`
      : '';
    casos.push({
      peso: 68, cooldownDays: 2, // A deriva e aviso preventivo. Repetido vira cobranca sobre algo que ela ja ouviu.
      id: `coach:deriva:${focusArena?.arenaId || 'cycle'}:${context.cycleDayNumber || 0}`,
      content: `Ainda da tempo, mas o ciclo começou a escorregar: ${progress}% feito onde o tempo aponta ${expected}%.${arenaLine} Uma ação hoje devolve o rumo.`,
      quickActions: compactActions([
        openFocusedArena(context),
        { id: 'coach-open-planner', label: 'Retomar uma ação', kind: 'open_planner' },
      ]),
    });
  }

  if (completed === 0) {
    casos.push({
      peso: 70, cooldownDays: 0, // A primeira prova do ciclo so acontece uma vez.
      id: `coach:first-proof:${context.cycleName || 'active'}`,
      content: 'O ciclo comecou, mas ainda falta a primeira conclusao. Não tente resolver a semana inteira agora: escolha a menor ação que coloca o ciclo em movimento hoje.',
      quickActions: [
        { id: 'coach-open-planner', label: 'Escolher primeira ação', kind: 'open_planner' },
      ],
    });
  }

  // O reconhecimento acompanha o Estado Mestre: 'forte' comeca em +5 de delta, e
  // o assunto que reconhece precisa EXISTIR nessa faixa para poder receber o
  // bonus. Preso a 'adiantado', ele nao existia em 80% contra 71% — e a leitura
  // abria por uma pendencia de arena num ciclo claramente bom.
  if (context.cyclePace === 'adiantado' || progress - expected >= 5) {
    casos.push({
      peso: 40, cooldownDays: 2, // Elogio repetido vira bajulacao, e bajulacao gasta a confianca do resto.
      id: `coach:ahead:${context.cycleDayNumber || 0}:${completed}`,
      content: (() => {
        // A projecao: no ritmo medio ate aqui, quantos dias sobrariam.
        const dias = context.cycleDayNumber || 0;
        const ritmo = dias > 0 ? completed / dias : 0;
        const sobra = ritmo > 0 && pending > 0
          ? Math.max(0, (context.cycleDaysRemaining ?? 0) - Math.ceil(pending / ritmo))
          : 0;
        return sobra > 0
          ? `Boa: você concluiu ${completed} de ${total} ações e esta adiantado. Nesse ritmo, fecha ${sobra} dia${sobra === 1 ? '' : 's'} antes do prazo.`
          : `Boa: você concluiu ${completed} de ${total} ações e esta adiantado no ciclo. Proteja esse ritmo sem transformar a vantagem em carga extra.`;
      })(),
      quickActions: [{ id: 'coach-open-cycle', label: 'Ver andamento', kind: 'open_cycle' }],
    });
  }

  /**
   * A CONTA NAO FECHA — capacidade contra exigencia.
   *
   * A leitura mais forte que o app consegue fazer, e ela nao depende de agenda
   * nenhuma: o que falta dividido pelos dias que sobram, comparado ao melhor dia
   * que a pessoa ja registrou. Nao manda correr atras: mostra a conta e deixa a
   * saida ser editar o plano.
   *
   * Peso acima de "atrasado" porque e mais especifica: atrasado diz que esta
   * atras, esta diz por quanto e se ainda cabe.
   */
  const melhorDia = Math.max(0, Math.round(context.bestDailyCompletions || 0));
  const diasRestantes = context.cycleDaysRemaining ?? 0;
  if (melhorDia > 0 && diasRestantes > 0 && pending > 0) {
    const porDia = pending / diasRestantes;
    if (porDia > melhorDia) {
      const arredondado = porDia >= 2 ? Math.round(porDia) : Math.round(porDia * 10) / 10;
      casos.push({
        peso: 78, cooldownDays: 2, // A conta que nao fecha e estrutural: nao muda de um dia para o outro.
        id: `coach:conta-nao-fecha:${context.cycleDayNumber || 0}:${pending}`,
        content: `Faltam ${pending} ações e ${diasRestantes} dia${diasRestantes === 1 ? '' : 's'}. Isso pede ${arredondado} por dia, e seu melhor dia até agora ${melhorDia === 1 ? 'foi 1' : `foram ${melhorDia}`}. Reduzir uma meta agora não tira EXP já conquistada.`,
        quickActions: compactActions([
          openFocusedArena(context),
          { id: 'coach-open-cycle', label: 'Rever ciclo', kind: 'open_cycle' },
        ]),
      });
    }
  }

  /**
   * ARENA QUE NUNCA COMECOU — diferente de arena parada.
   *
   * Arena parada andou e parou; esta nunca andou. O sujeito da frase e o CICLO,
   * nao a pessoa: "voce desenhou este ciclo com cinco arenas" e um fato sobre o
   * plano, e a saida obvia (tirar ou comecar) fica sem precisar ser dita.
   */
  const natimortas = (context.arenaSignals || []).filter((sinal) => (
    sinal.completedActions === 0 && (sinal.plannedActions || 0) > 0
  ));
  if (natimortas.length > 0 && (context.arenaSignals || []).length > natimortas.length) {
    const total = (context.arenaSignals || []).length;
    casos.push({
      peso: 65, cooldownDays: 3, // Arena natimorta leva dias para deixar de ser. Nao ha o que dizer de novo antes disso.
      id: `coach:arena-natimorta:${natimortas.length}:${context.cycleDayNumber || 0}`,
      content: natimortas.length === 1
        ? `Você desenhou este ciclo com ${total} arenas, e ${natimortas[0].arenaName} ainda não recebeu nenhum registro.`
        : `Você desenhou este ciclo com ${total} arenas. ${natimortas.length} delas ainda não receberam nenhum registro.`,
      quickActions: compactActions([
        natimortas.length === 1
          ? { id: 'coach-open-arena', label: `Abrir ${natimortas[0].arenaName}`, kind: 'open_arena', arenaId: natimortas[0].arenaId }
          : null,
        { id: 'coach-open-arenas', label: 'Ver arenas', kind: 'open_arenas' },
      ]),
    });
  }

  /**
   * QUANTO FALTA, COM TAMANHO. O que a arena mais atrasada pede, em numero e em
   * dias — para "essa precisa de atencao" parar de ser vago.
   */
  const maisPendente = [...(context.arenaSignals || [])]
    .filter((sinal) => (sinal.pendingActions || 0) > 0)
    .sort((a, b) => (b.pendingActions || 0) - (a.pendingActions || 0))[0];
  if (maisPendente && diasRestantes > 0) {
    casos.push({
      peso: 60, cooldownDays: 2, // E agregado e pouco acionavel: repetir so acumula peso sem indicar saida.
      id: `coach:quanto-falta:${maisPendente.arenaId}:${maisPendente.pendingActions}`,
      content: `A que mais precisa agora é ${maisPendente.arenaName}: ${maisPendente.pendingActions} ${maisPendente.pendingActions === 1 ? 'ação' : 'ações'} em ${diasRestantes} dia${diasRestantes === 1 ? '' : 's'}.`,
      quickActions: compactActions([
        { id: 'coach-open-arena', label: `Abrir ${maisPendente.arenaName}`, kind: 'open_arena', arenaId: maisPendente.arenaId },
        { id: 'coach-open-planner', label: 'Abrir Planner', kind: 'open_planner' },
      ]),
    });
  }

  /**
   * CONCENTRACAO — nao julga, so revela.
   *
   * Quem esta feliz com o proprio foco le e segue; quem nao sabia que estava
   * fazendo isso toma um susto util. Por isso a frase nao tem conselho: ela
   * termina no fato.
   *
   * A conta e do CICLO, e a frase diz isso — inventar "ultimos 14 dias" com
   * numero de ciclo seria mentir sobre o que o numero mede.
   */
  const comEntrega = (context.arenaSignals || []).filter((sinal) => (sinal.completedActions || 0) > 0);
  if (comEntrega.length >= 2 && (context.arenaSignals || []).length >= 3) {
    const totalEntregas = comEntrega.reduce((soma, sinal) => soma + (sinal.completedActions || 0), 0);
    const dominante = [...comEntrega].sort((a, b) => (b.completedActions || 0) - (a.completedActions || 0))[0];
    const fatia = totalEntregas > 0 ? (dominante.completedActions || 0) / totalEntregas : 0;
    if (totalEntregas >= 5 && fatia >= 0.6) {
      casos.push({
        peso: 62, cooldownDays: 3, // Concentracao e revelacao, nao conselho. Repetir transforma constatacao em julgamento.
        id: `coach:concentracao:${dominante.arenaId}:${Math.round(fatia * 100)}`,
        content: `Você tem ${(context.arenaSignals || []).length} arenas neste ciclo. ${Math.round(fatia * 10)} de cada 10 registros foram em ${dominante.arenaName}.`,
        quickActions: [{ id: 'coach-open-arenas', label: 'Ver arenas', kind: 'open_arenas' }],
      });
    }
  }

  /**
   * O "VOCE ESTA NO RITMO" DEIXA DE SER INCONDICIONAL.
   *
   * Este era o unico dos catorze sem guarda nenhuma, e era o fundo da fila.
   * Resultado: bastava os assuntos de cima nao se aplicarem — ou, depois que o
   * descanso por assunto entrou, bastava eles estarem descansando — para o app
   * afirmar "voce esta acompanhando o ritmo do ciclo" a quem tinha 10 de 140
   * feitas. Foi exatamente o que a simulacao dos cinco perfis pegou na quarta
   * consulta dos perfis Sobrecarga e Retomada.
   *
   * Agora ele so existe quando o ritmo REALMENTE e no_ritmo ou adiantado. E o
   * Estado Mestre ainda o proibe em todo estado incompativel, por garantia: uma
   * frase que afirma um fato precisa da condicao do fato, e nao da ausencia de
   * concorrentes.
   */
  const ritmoPermiteElogio = context.hasCycle && (context.cyclePace === 'no_ritmo' || context.cyclePace === 'adiantado');
  const priorityLine = context.priorityActionName
    ? ` Que tal ${context.priorityActionName} hoje?`
    : ' Escolha uma ação que mantenha o fio sem pesar o dia.';
  if (ritmoPermiteElogio) casos.push({
    peso: 0, cooldownDays: 0,
    id: `coach:on-pace:${context.cycleDayNumber || 0}:${completed}`,
    content: `Você concluiu ${completed} de ${total} ações e esta acompanhando o ritmo do ciclo.${priorityLine}`,
    quickActions: [
      { id: 'coach-open-planner', label: 'Abrir Planner', kind: 'open_planner' },
      { id: 'coach-open-cycle', label: 'Ver ciclo', kind: 'open_cycle' },
    ],
  });

  /**
   * A RETOMADA COMO ACONTECIMENTO.
   *
   * `trend === 'retomando'` ja era calculado por arena e o coach nunca olhava —
   * so as falas de abertura usavam. Quem voltou hoje depois de seis dias parado
   * recebia a leitura de atraso, que ele ja sabia, em vez da unica coisa que o
   * app percebeu e ele talvez nao: que ele voltou.
   *
   * A frase nao manda compensar. Compensar e o instinto errado depois de uma
   * pausa, e e o que quebra a retomada no segundo dia.
   */
  const arenaRetomada = (context.arenaSignals || []).find((sinal) => sinal.trend === 'retomando');
  if (arenaRetomada) {
    const pausa = arenaRetomada.trendPauseDays;
    casos.push({
      peso: 55, cooldownDays: 1, // Retomada e um momento. Repetir todo dia transforma reconhecimento em bajulacao.
      id: `coach:retomada:${arenaRetomada.arenaId}:${context.cycleDayNumber || 0}`,
      content: pausa
        ? `Você voltou a registrar em ${arenaRetomada.arenaName} depois de ${pausa} dia${pausa === 1 ? '' : 's'} sem nada. O ciclo segue abaixo do planejado, mas recuperar tudo agora não é a prioridade — sustentar a volta é.`
        : `Você voltou a registrar em ${arenaRetomada.arenaName} depois de uma pausa. O ciclo segue abaixo do planejado, mas recuperar tudo agora não é a prioridade — sustentar a volta é.`,
      quickActions: compactActions([
        openFocusedArena(context),
        { id: 'coach-open-planner', label: 'Abrir Planner', kind: 'open_planner' },
      ]),
    });
  }

  /**
   * O CICLO CONCENTRADO NUM DIA.
   *
   * Ja existia `coach:concentracao`, mas ele mede concentracao por ARENA — em
   * qual frente a pessoa gastou os registros. Este mede por DIA: quanto do ciclo
   * aconteceu de uma vez so.
   *
   * Sao coisas diferentes e nenhuma tela mostra a segunda. O Planner soma o
   * ciclo e soma o dia; ele nunca compara os dois.
   *
   * A frase termina no fato, sem conselho. Fazer tudo num dia nao e erro — e
   * so uma coisa sobre a qual a pessoa talvez nao tenha reparado. Exige dois
   * dias com execucao: com um so, "metade num dia" e aritmetica, nao padrao.
   */
  const melhorDoDia = Math.max(0, Math.round(context.bestDailyCompletions || 0));
  const diasComExecucao = context.daysWithCompletions || 0;
  if (completed >= 6 && diasComExecucao >= 2 && melhorDoDia / completed >= 0.5) {
    const fatia = Math.round((melhorDoDia / completed) * 100);
    casos.push({
      peso: 58, cooldownDays: 3, // Padrao do passado do ciclo: nao muda de um dia para o outro.
      id: `coach:dia-concentrado:${melhorDoDia}:${completed}`,
      content: `Dos ${completed} registros deste ciclo, ${melhorDoDia} aconteceram num único dia — ${fatia}% do que você fez saiu de uma vez só.`,
      quickActions: [{ id: 'coach-open-cycle', label: 'Ver ciclo', kind: 'open_cycle' }],
    });
  }

  /**
   * VOLUME E CONSTANCIA EM DIRECOES OPOSTAS.
   *
   * O caso mais valioso que este motor consegue provar, e o que a tela nao
   * mostra de jeito nenhum: fazer MENOS por dia e faltar MENOS dias. O Planner
   * mostra soma e porcentagem; nenhum dos dois enxerga que o padrao mudou.
   *
   * So fala quando as duas medidas discordam. Se as duas sobem ou as duas caem,
   * a leitura seria "voce esta melhor" ou "voce esta pior" — que e o que os
   * outros assuntos ja dizem melhor, com acao junto.
   *
   * Os cortes (20% de volume, 15 pontos de constancia) existem para nao chamar
   * de mudanca o que e oscilacao de um dia.
   */
  const ritmo = context.cycleRhythm;
  if (ritmo && ritmo.volumeAntes > 0) {
    const quedaVolume = (ritmo.volumeAntes - ritmo.volumeDepois) / ritmo.volumeAntes;
    const ganhoConstancia = ritmo.constanciaDepois - ritmo.constanciaAntes;
    const metade = Math.floor(ritmo.diasAnalisados / 2);

    if (quedaVolume >= 0.2 && ganhoConstancia >= 0.15) {
      casos.push({
        peso: 56, cooldownDays: 3,
        id: `coach:volume-x-constancia:queda:${ritmo.diasAnalisados}`,
        content: `Nos últimos ${ritmo.diasAnalisados - metade} dias você fez menos por dia do que no começo do ciclo, mas faltou menos dias. Seu volume caiu; sua constância melhorou.`,
        quickActions: [{ id: 'coach-open-cycle', label: 'Ver ciclo', kind: 'open_cycle' }],
      });
    } else if (quedaVolume <= -0.2 && ganhoConstancia <= -0.15) {
      casos.push({
        peso: 56, cooldownDays: 3,
        id: `coach:volume-x-constancia:picos:${ritmo.diasAnalisados}`,
        content: `Nos últimos ${ritmo.diasAnalisados - metade} dias você fez mais por dia do que no começo do ciclo, mas em menos dias. Seu volume subiu; sua constância caiu.`,
        quickActions: [{ id: 'coach-open-cycle', label: 'Ver ciclo', kind: 'open_cycle' }],
      });
    }
  }

  /**
   * O FUNDO HONESTO — a resposta quando nao ha o que apontar.
   *
   * Antes, o fundo da fila afirmava ritmo adequado. Agora que ele tem condicao,
   * precisa existir alguma coisa embaixo de tudo que nao afirme NADA sobre o
   * ritmo, para o botao nunca ficar mudo e nunca mentir.
   *
   * Nem toda leitura precisa terminar em tarefa. "Esta bom assim" e resposta.
   */
  casos.push({
    peso: -1, cooldownDays: 0,
    id: `coach:sem-leitura:${context.cycleDayNumber || 0}`,
    content: 'Nada mudou o suficiente para uma leitura nova. Se o dia já está do jeito que você queria, está bom assim.',
    quickActions: [{ id: 'coach-open-planner', label: 'Abrir Planner', kind: 'open_planner' }],
  });

  const descansando = (caso: CasoDoBrief): boolean => {
    if (!memoria || caso.cooldownDays <= 0) return false;
    const visto = memoria.vistos[oracleCoachFamily(caso.id)];
    if (!visto) return false;
    return diasEntre(visto, memoria.hoje) < caso.cooldownDays;
  };

  /**
   * A HISTORIA MANDA NA ORDEM, e proibe o que a contradiz.
   *
   * O peso do caso continua sendo a relevancia GERAL dele. O que o Estado Mestre
   * acrescenta e a relevancia AGORA: um bonus por assunto, e uma lista do que
   * nao pode ser dito neste estado. Sem isso, variedade vencia verdade — a fila
   * escolhia o proximo assunto disponivel mesmo quando ele negava o anterior.
   */
  const diagnostico = deriveOracleMasterState(context);
  const bonusDe = (caso: CasoDoBrief) => diagnostico.bonus[oracleCoachFamily(caso.id)] || 0;
  const pesoFinal = (caso: CasoDoBrief) => caso.peso + bonusDe(caso);
  const proibido = (caso: CasoDoBrief) => diagnostico.proibidos.includes(oracleCoachFamily(caso.id));

  // O fundo honesto nunca e proibido: e ele que garante resposta em qualquer
  // estado, sem afirmar nada que o estado negue.
  const permitidos = casos.filter((caso) => !proibido(caso));
  const disponiveis = permitidos.filter((caso) => !descansando(caso));
  const fila = disponiveis.length > 0 ? disponiveis : permitidos;

  const escolhido = fila.reduce((melhor, caso) => (pesoFinal(caso) > pesoFinal(melhor) ? caso : melhor));

  if (auditar) {
    const descartados = casos
      .filter((caso) => caso.id !== escolhido.id)
      .map((caso) => ({
        assunto: oracleCoachFamily(caso.id),
        peso: pesoFinal(caso),
        razao: proibido(caso)
          ? `proibido pelo estado ${diagnostico.estado}`
          : descansando(caso)
            ? `descansando (${caso.cooldownDays}d)`
            : 'peso menor',
      }))
      .sort((a, b) => b.peso - a.peso);

    auditar({
      estado: diagnostico.estado,
      motivo: diagnostico.motivo,
      modificadores: diagnostico.modificadores,
      proibidos: diagnostico.proibidos,
      assunto: oracleCoachFamily(escolhido.id),
      pesoBase: escolhido.peso,
      bonus: bonusDe(escolhido),
      pesoFinal: pesoFinal(escolhido),
      porQueVenceu: descartados.length === 0
        ? 'unico candidato'
        : `maior peso final entre os permitidos e acordados; o proximo era ${descartados[0].assunto} (${descartados[0].peso}, ${descartados[0].razao})`,
      descartados: descartados.slice(0, 6),
    });
  }

  return { id: escolhido.id, content: escolhido.content, quickActions: escolhido.quickActions };
};
