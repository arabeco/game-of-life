import type { OracleCategory } from '../types';

/**
 * Written stock for the five manual card categories.
 *
 * These cards are pure content — they say nothing about the player's own numbers, so
 * there is nothing for a model to compute. Generating them per delivery meant paying
 * per request, shipping text nobody had read, and losing the feature entirely whenever
 * the provider was unreachable. A written bank costs nothing, works offline, and can be
 * reviewed before it reaches anyone.
 *
 * SIZING: a Premium player can pull one card per category per day, so a bank of N per
 * category takes N days to cycle. Target is ~180 each (about six months) — the entries
 * below are the seed, kept deliberately small so the shape can be reviewed before the
 * volume is written. Nothing breaks at any size: the picker degrades to reuse.
 *
 * STYLE: second person, no greeting, no sign-off, one idea per card, two to four lines.
 * Nothing that reads as a diagnosis of the player — these are read on demand, not
 * triggered by a state. Contextual reactions live in supabase/functions/_shared/
 * oracle-lines.ts instead.
 *
 * WHAT EACH CATEGORY IS FOR — they overlap easily, so keep the angles apart:
 *  - frases_inspiradoras: a push. Short, warm, gets someone moving.
 *  - reflexoes_filosoficas: a question the reader puts to themselves. Ends open.
 *  - fragmentos_sabedoria: stoic. What is up to you, what is not, and acting anyway.
 *  - rituais_lifestyle: one concrete thing to do differently today.
 *  - sussurros_maestria: the craft. How practice changes once the basics are boring.
 */
export const ORACLE_CARD_LIBRARY: Partial<Record<OracleCategory, string[]>> = {
  frases_inspiradoras: [
    'O que voce repete vira quem voce e. Nao e a intensidade de um dia que constroi, e a chatice de aparecer no dia seguinte.',
    'Comecar de novo nao apaga o que ja foi feito. O progresso antigo continua seu, mesmo depois de uma pausa longa.',
    'A acao pequena que voce faz hoje vale mais que a grande que voce planeja pra segunda.',
    'Voce nao precisa de motivacao pra comecar. Precisa de uma tarefa pequena o suficiente pra nao dar medo.',
    'Ninguem vira outra pessoa numa decisao. Vira em centenas de decisoes pequenas que ninguem viu.',
    'O dia ruim tambem conta. Aparecer mal e diferente de nao aparecer.',
    'Voce ja fez coisas mais dificeis do que a que esta adiando agora.',
    'Constancia nao e nunca falhar. E o intervalo entre falhar e voltar ficar cada vez menor.',
    'O peso de comecar e sempre maior que o peso de continuar. Voce so precisa atravessar o comeco.',
    'Nao espera se sentir pronto. Prontidao e consequencia de ter comecado, nao requisito.',
    'Uma semana honesta vale mais que um mes de planos bonitos.',
    'O que voce faz quando ninguem esta olhando e exatamente o que voce esta construindo.',
    'Ninguem comeca pronto. Comeca disposto, e a competencia vem no caminho.',
    'Voce nao precisa acertar hoje. Precisa nao desistir hoje.',
    'O progresso mais solido e o que ninguem elogia enquanto acontece.',
    'Cada vez que voce cumpre o combinado consigo mesmo, a proxima vez fica mais barata.',
    'Nao existe versao sua que so avanca. Existe a que volta mais rapido.',
    'A tarefa que voce evita costuma ser a que mais destrava o resto.',
    'Fazer pouco com constancia vence fazer muito por impulso. Sempre venceu.',
    'Voce esta mais perto do que estava. Isso ja e diferente de estar parado.',
    'O plano perfeito que nao comeca perde para o plano torto que anda.',
    'Comeca pequeno o suficiente para ser ridiculo. Ridiculo e sustentavel.',
    'Confiar em si mesmo e resultado de evidencia acumulada, nao de discurso.',
    'Um dia salvo no fim da tarde ainda conta como dia salvo.',
    'Voce nao esta atrasado. Esta no ponto onde comecou a prestar atencao.',
    'A vontade vem e vai. O combinado fica.',
    'Terminar algo pequeno hoje muda o seu humor amanha.',
    'O que parece lento de perto costuma parecer rapido de longe.',
    'Voce ja provou que consegue. Falta so repetir mais uma vez.',
  ],
  reflexoes_filosoficas: [
    'O que voce esta adiando hoje: e dificil mesmo, ou so mal definido?',
    'Se o seu sistema depende de voce estar inspirado, ele funciona quantos dias por mes?',
    'Voce escolheu tudo que esta na sua semana, ou algumas coisas so foram entrando?',
    'Quando foi a ultima vez que voce tirou algo da lista em vez de adicionar?',
    'O que voce chama de falta de tempo seria a mesma coisa se chamasse de ordem de prioridade?',
    'Voce esta medindo o que importa, ou o que e facil de medir?',
    'Se ninguem soubesse do seu progresso, voce continuaria no mesmo ritmo?',
    'A meta que voce definiu ainda e sua, ou virou uma divida que voce paga por vergonha?',
    'O que mudaria hoje se voce aceitasse fazer metade, mas fazer todo dia?',
    'Voce quer terminar isso, ou quer ter terminado? Sao vontades diferentes.',
    'Qual parte do seu esforco e trabalho e qual parte e ansiedade parecendo trabalho?',
    'Se daqui a um ano nada disso tiver mudado, o que voce diria que faltou?',
    'Voce esta construindo algo, ou so evitando ficar parado?',
    'O que voce faria diferente se soubesse que ninguem ia ver o resultado?',
    'Quantas das suas metas sao suas, e quantas voce herdou sem revisar?',
    'Se voce tivesse metade do tempo, o que sairia da lista primeiro?',
    'O que voce chama de preguica poderia ser cansaco de verdade?',
    'Voce esta com dificuldade nisso, ou com medo de descobrir que consegue?',
    'Quando algo da certo, voce credita a sorte. E quando da errado?',
    'O que voce esta protegendo ao nao comecar?',
    'Se um amigo te contasse essa rotina, voce acharia sustentavel?',
    'Voce quer disciplina, ou quer parar de se sentir culpado? Sao caminhos diferentes.',
    'O que mudou desde a ultima vez que voce revisou esse objetivo?',
    'Voce esta cansado do trabalho, ou de decidir sobre ele o dia todo?',
    'Qual seria o menor passo que ainda contaria como progresso real?',
    'O que voce faz por habito e nao consegue mais explicar por que?',
    'Se hoje fosse repetido cem vezes, que vida isso construiria?',
    'Voce mede o dia pelo que fez, ou pelo que deixou de fazer?',
    'O que voce ganharia admitindo que essa meta nao interessa mais?',
    'Voce esta esperando o momento certo, ou esperando virar outra pessoa?',
  ],
  fragmentos_sabedoria: [
    'Separa o que depende de voce do que nao depende. So o primeiro grupo merece sua energia hoje.',
    'Voce nao controla o resultado. Controla o preparo, a decisao e a repeticao — e isso ja e bastante.',
    'O obstaculo de hoje nao esta no caminho. Por enquanto, ele e o caminho.',
    'Nao e o que acontece que te trava, e o que voce decide que aquilo significa.',
    'Espera dificuldade e ela deixa de ser interrupcao. Vira parte do combinado.',
    'Age agora com o que voce tem. Condicoes ideais sao uma promessa que raramente chega.',
    'Julgar o proprio dia com honestidade vale mais que a opiniao de qualquer pessoa sobre ele.',
    'Reclamar do peso nao muda o peso. Mudar a alavanca, sim.',
    'Voce vai errar de novo. A questao e quanto tempo voce leva pra voltar depois do erro.',
    'Fazer bem feito o que esta na sua frente e o trabalho inteiro. O resto e imaginacao.',
    'A pressa e uma forma de fuga. Ritmo sustentavel e uma forma de coragem.',
    'Perder tempo lamentando o tempo perdido e a unica forma de perde-lo duas vezes.',
    'Nao peca que o dia seja facil. Peca para estar a altura do dia que vier.',
    'A opiniao alheia sobre o seu esforco nao entra na conta do resultado.',
    'Voce nao escolhe a interrupcao. Escolhe se ela vira desculpa.',
    'Comeca pelo que esta ao seu alcance agora. O resto e cenario.',
    'Quem espera vontade obedece ao acaso. Quem age constroi o proprio clima.',
    'O erro so vira prejuizo quando voce se recusa a olhar pra ele.',
    'Voce nao precisa vencer o dia. Precisa nao entregar o dia de graca.',
    'Aceitar o limite de hoje nao e desistir. E parar de negociar com a realidade.',
    'A tarefa nao fica mais leve. Voce e que fica mais firme.',
    'Preocupacao com o que nao depende de voce e imposto que voce escolhe pagar.',
    'Faz o combinado mesmo sem plateia. E ali que o carater aparece.',
    'Adiar a decisao ja e uma decisao — e costuma ser a pior delas.',
    'O que te tira do serio revela onde voce ainda depende de aprovacao.',
    'Voce controla a proxima acao. So ela. E ja e o bastante pra hoje.',
    'Constancia sem drama vale mais que intensidade com plateia.',
    'Nao confunda estar ocupado com estar no caminho.',
    'A recompensa de fazer bem feito e ter feito bem feito. O resto e bonus.',
    'Se voce nao escolher onde gastar sua atencao, alguem escolhe por voce.',
  ],
  rituais_lifestyle: [
    'Deixa o material da proxima acao separado antes de dormir. O atrito de comecar cai pela metade.',
    'Uma acao ancorada em outra que ja existe pega no automatico. Depois do cafe, antes do banho, ao sentar.',
    'Escolhe um horario ruim de proposito pra tarefa dificil. Se ela sobrevive ao horario ruim, sobrevive a semana.',
    'Termina o dia decidindo a primeira acao do dia seguinte. Voce acorda sem precisar negociar consigo mesmo.',
    'Corta a tarefa pela metade e faz so a primeira parte hoje. Costuma ser o suficiente pra destravar.',
    'Guarda o celular em outro comodo durante o bloco de foco. Distancia funciona melhor que forca de vontade.',
    'Comeca pela versao feia. Corrigir e mais facil que criar do zero.',
    'Marca um horario fixo pra revisar a semana. Sem isso, todo ajuste vira reacao.',
    'Se a acao leva menos de dois minutos, faz agora em vez de anotar.',
    'Bebe agua antes do cafe. Metade do cansaco da manha e desidratacao simples.',
    'Deixa uma tarefa facil separada pro dia em que nada funcionar. Ela protege a sequencia.',
    'Escreve o motivo da meta ao lado dela. Em duas semanas voce nao vai lembrar sozinho.',
    'Define onde a acao acontece, nao so quando. Lugar fixo economiza decisao.',
    'Separa quinze minutos pra deixar o ambiente pronto. Rende mais que quinze minutos de execucao ruim.',
    'Faz a parte chata primeiro, enquanto a cabeca ainda esta inteira.',
    'Coloca um limite de tempo em vez de meta de volume quando a tarefa te trava.',
    'Anota a ideia na hora que ela vier. Confiar na memoria e como pagar juros.',
    'Fecha as abas que nao pertencem a proxima hora. Ordem externa vira foco interno.',
    'Se voce vive adiando uma tarefa, marca ela pro mesmo horario tres dias seguidos.',
    'Come antes de decidir coisa importante. Fome piora julgamento mais do que voce acha.',
    'Deixa roupa e material do treino visiveis. O que esta a vista custa menos pra comecar.',
    'Revisa a lista de amanha ainda hoje, e corta um item. Sempre tem um que nao era pra estar la.',
    'Usa um alarme pra encerrar, nao so pra comecar. Parar no horario protege o dia seguinte.',
    'Guarda o domingo a noite pra planejar leve, nao pra cobrar o que nao foi feito.',
    'Junta tarefas parecidas no mesmo bloco. Trocar de contexto e o que mais cansa.',
    'Se a acao depende de outra pessoa, manda a mensagem antes de comecar o resto.',
    'Tem um lugar so pra coisas por decidir. Deixar espalhado ocupa a cabeca de graca.',
    'Comeca o dia sem abrir mensagem. Os primeiros trinta minutos definem quem manda na sua atencao.',
  ],
  sussurros_maestria: [
    'Maestria e reduzir o numero de decisoes por dia, nao aumentar o numero de tarefas.',
    'Quando algo fica facil, e sinal pra aumentar a precisao — nao necessariamente o volume.',
    'O amador busca o dia perfeito. Quem avanca busca o dia repetivel.',
    'Voce so domina o que consegue fazer cansado. O resto ainda depende de condicoes.',
    'Quem esta comecando quer variedade. Quem esta avancando quer profundidade no mesmo lugar.',
    'A repeticao so ensina quando voce presta atencao nela. Sem atencao, e so desgaste.',
    'Aprender a parar no ponto certo e tao tecnico quanto aprender a comecar.',
    'O detalhe que ninguem nota e exatamente onde a diferenca mora.',
    'Antes de aumentar a carga, verifica se a execucao ainda esta limpa.',
    'Trabalho profundo nao e trabalhar mais. E trabalhar sem trocar de assunto.',
    'A base parece chata porque voce ja a domina. Ela continua sendo a base.',
    'Melhora uma variavel por vez. Mudar tres ao mesmo tempo apaga a leitura do que funcionou.',
    'Quem domina sabe a hora de parar. Quem esta aprendendo insiste ate estragar.',
    'A diferenca entre bom e otimo costuma estar no que se retira, nao no que se acrescenta.',
    'Registra o que deu errado com detalhe. Erro sem descricao vira erro repetido.',
    'Executar devagar de proposito ensina mais que executar rapido no automatico.',
    'A pressa de avancar de nivel e o que mais atrasa gente talentosa.',
    'Se voce nao consegue explicar simples, ainda nao dominou.',
    'Volume constroi resistencia. Atencao constroi tecnica. Voce precisa dos dois, em tempos diferentes.',
    'O melhor momento pra ajustar a forma e quando esta indo bem, nao quando trava.',
    'Compara com voce de tres meses atras. Comparar com outro so serve pra escolher referencia.',
    'Tarefa dificil sem feedback vira teimosia. Arruma como medir antes de insistir.',
    'Depois que a acao vira habito, ela para de te ensinar. Ali muda o nivel ou muda o alvo.',
    'A parte que voce evita treinar e exatamente o seu teto atual.',
    'Descanso planejado e parte da tecnica, nao pausa dela.',
    'Sequencia longa cria confianca. Confianca cria margem pra arriscar de verdade.',
    'Quem domina reduz variabilidade. O resultado bom vira o resultado normal.',
    'Antes de buscar metodo novo, verifica se voce aplicou inteiro o que ja conhece.',
    'A execucao limpa e mais rapida no fim, mesmo sendo mais lenta no comeco.',
  ],
};

const normalize = (value: string) => value.trim().toLowerCase();

/**
 * Picks a card the player has not seen, falling back to the least recently delivered
 * once the whole category has been used. Returns null only for a category with no
 * stock, which lets the caller say so instead of delivering an empty card.
 */
export const pickOracleCard = ({
  category,
  deliveredContents = [],
}: {
  category: OracleCategory;
  /** Previously delivered card text for this player, newest first. */
  deliveredContents?: string[];
}): string | null => {
  const stock = ORACLE_CARD_LIBRARY[category];
  if (!stock || stock.length === 0) return null;

  const seen = new Set(deliveredContents.map(normalize));
  const unseen = stock.filter((card) => !seen.has(normalize(card)));

  if (unseen.length > 0) {
    return unseen[Math.floor(Math.random() * unseen.length)];
  }

  // Everything has been seen: reuse whatever has been out of rotation longest.
  const recency = new Map(deliveredContents.map((content, index) => [normalize(content), index]));
  return [...stock].sort(
    (left, right) => (recency.get(normalize(right)) ?? Infinity) - (recency.get(normalize(left)) ?? Infinity),
  )[0];
};

export const getOracleCardStockSize = (category: OracleCategory): number =>
  ORACLE_CARD_LIBRARY[category]?.length ?? 0;
