/**
 * MORA AQUI PORQUE OS DOIS LADOS PRECISAM DELA.
 *
 * O card pedido a mao nasce no app; o card do dia nasce no cron, dentro da Edge
 * Function. Se o banco de textos vivesse so em constants/, o servidor teria de
 * ganhar uma copia — e uma copia de 180 cards por tema vira duas verdades no
 * primeiro dia em que alguem escrever num arquivo so. Entao o banco fica onde o
 * Deno alcanca, e constants/oracleCardLibrary.ts reexporta daqui para o app.
 *
 * Por isso o arquivo nao importa nada: o tipo abaixo espelha `OracleCategory` de
 * types.ts a mao, porque o servidor nao pode enxergar types.ts.
 */
export type OracleCategory =
  | 'frases_inspiradoras'
  | 'reflexoes_filosoficas'
  | 'fragmentos_sabedoria'
  | 'dicas_produtividade'
  | 'rituais_lifestyle'
  | 'provocacoes'
  | 'sussurros_maestria'
  | 'analise_padroes';

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
    'O que você repete vira quem você e. Não e a intensidade de um dia que constroi, e a chatice de aparecer no dia seguinte.',
    'Começar de novo não apaga o que já foi feito. O progresso antigo continua seu, mesmo depois de uma pausa longa.',
    'A ação pequena que você faz hoje vale mais que a grande que você planeja pra segunda.',
    'Você não precisa de motivacao pra começar. Precisa de uma tarefa pequena o suficiente pra não dar medo.',
    'Ninguém vira outra pessoa numa decisão. Vira em centenas de decisões pequenas que ninguém viu.',
    'O dia ruim também conta. Aparecer mal e diferente de não aparecer.',
    'Você já fez coisas mais difíceis do que a que esta adiando agora.',
    'Constância não e nunca falhar. E o intervalo entre falhar e voltar ficar cada vez menor.',
    'O peso de começar e sempre maior que o peso de continuar. Você so precisa atravessar o começo.',
    'Não espera se sentir pronto. Prontidao e consequência de ter comecado, não requisito.',
    'Uma semana honesta vale mais que um mês de planos bonitos.',
    'O que você faz quando ninguém esta olhando e exatamente o que você esta construindo.',
    'Ninguém começa pronto. Começa disposto, e a competencia vem no caminho.',
    'Você não precisa acertar hoje. Precisa não desistir hoje.',
    'O progresso mais solido e o que ninguém elogia enquanto acontece.',
    'Cada vez que você cumpre o combinado consigo mesmo, a próxima vez fica mais barata.',
    'Não existe versão sua que so avança. Existe a que volta mais rápido.',
    'A tarefa que você evita costuma ser a que mais destrava o resto.',
    'Fazer pouco com constância vence fazer muito por impulso. Sempre venceu.',
    'Você esta mais perto do que estava. Isso já e diferente de estar parado.',
    'O plano perfeito que não começa perde para o plano torto que anda.',
    'Começa pequeno o suficiente para ser ridículo. Ridículo e sustentável.',
    'Confiar em si mesmo e resultado de evidencia acumulada, não de discurso.',
    'Um dia salvo no fim da tarde ainda conta como dia salvo.',
    'Você não esta atrasado. Esta no ponto onde começou a prestar atenção.',
    'A vontade vem e vai. O combinado fica.',
    'Terminar algo pequeno hoje muda o seu humor amanhã.',
    'O que parece lento de perto costuma parecer rápido de longe.',
    'Você já provou que consegue. Falta so repetir mais uma vez.',
  ],
  reflexoes_filosoficas: [
    'O que você esta adiando hoje: e difícil mesmo, ou so mal definido?',
    'Se o seu sistema depende de você estar inspirado, ele funciona quantos dias por mês?',
    'Você escolheu tudo que esta na sua semana, ou algumas coisas so foram entrando?',
    'Quando foi a última vez que você tirou algo da lista em vez de adicionar?',
    'O que você chama de falta de tempo seria a mesma coisa se chamasse de ordem de prioridade?',
    'Você esta medindo o que importa, ou o que e fácil de medir?',
    'Se ninguém soubesse do seu progresso, você continuaria no mesmo ritmo?',
    'A meta que você definiu ainda e sua, ou virou uma divida que você paga por vergonha?',
    'O que mudaria hoje se você aceitasse fazer metade, mas fazer todo dia?',
    'Você quer terminar isso, ou quer ter terminado? São vontades diferentes.',
    'Qual parte do seu esforço e trabalho e qual parte e ansiedade parecendo trabalho?',
    'Se daqui a um ano nada disso tiver mudado, o que você diria que faltou?',
    'Você esta construindo algo, ou so evitando ficar parado?',
    'O que você faria diferente se soubesse que ninguém ia ver o resultado?',
    'Quantas das suas metas são suas, e quantas você herdou sem revisar?',
    'Se você tivesse metade do tempo, o que sairia da lista primeiro?',
    'O que você chama de preguica poderia ser cansaco de verdade?',
    'Você esta com dificuldade nisso, ou com medo de descobrir que consegue?',
    'Quando algo da certo, você credita a sorte. E quando da errado?',
    'O que você esta protegendo ao não começar?',
    'Se um amigo te contasse essa rotina, você acharia sustentável?',
    'Você quer disciplina, ou quer parar de se sentir culpado? São caminhos diferentes.',
    'O que mudou desde a última vez que você revisou esse objetivo?',
    'Você esta cansado do trabalho, ou de decidir sobre ele o dia todo?',
    'Qual seria o menor passo que ainda contaria como progresso real?',
    'O que você faz por habito e não consegue mais explicar por que?',
    'Se hoje fosse repetido cem vezes, que vida isso construiria?',
    'Você mede o dia pelo que fez, ou pelo que deixou de fazer?',
    'O que você ganharia admitindo que essa meta não interessa mais?',
    'Você esta esperando o momento certo, ou esperando virar outra pessoa?',
  ],
  fragmentos_sabedoria: [
    'Separa o que depende de você do que não depende. So o primeiro grupo merece sua energia hoje.',
    'Você não controla o resultado. Controla o preparo, a decisão e a repetição — e isso já e bastante.',
    'O obstáculo de hoje não esta no caminho. Por enquanto, ele e o caminho.',
    'Não e o que acontece que te trava, e o que você decide que aquilo significa.',
    'Espera dificuldade e ela deixa de ser interrupcao. Vira parte do combinado.',
    'Age agora com o que você tem. Condicoes ideais são uma promessa que raramente chega.',
    'Julgar o próprio dia com honestidade vale mais que a opiniao de qualquer pessoa sobre ele.',
    'Reclamar do peso não muda o peso. Mudar a alavanca, sim.',
    'Você vai errar de novo. A questao e quanto tempo você leva pra voltar depois do erro.',
    'Fazer bem feito o que esta na sua frente e o trabalho inteiro. O resto e imaginacao.',
    'A pressa e uma forma de fuga. Ritmo sustentável e uma forma de coragem.',
    'Perder tempo lamentando o tempo perdido e a única forma de perde-lo duas vezes.',
    'Não peça que o dia seja fácil. Peça para estar a altura do dia que vier.',
    'A opiniao alheia sobre o seu esforço não entra na conta do resultado.',
    'Você não escolhe a interrupcao. Escolhe se ela vira desculpa.',
    'Começa pelo que esta ao seu alcance agora. O resto e cenario.',
    'Quem espera vontade obedece ao acaso. Quem age constroi o próprio clima.',
    'O erro so vira prejuízo quando você se recusa a olhar pra ele.',
    'Você não precisa vencer o dia. Precisa não entregar o dia de graca.',
    'Aceitar o limite de hoje não e desistir. E parar de negociar com a realidade.',
    'A tarefa não fica mais leve. Você e que fica mais firme.',
    'Preocupacao com o que não depende de você e imposto que você escolhe pagar.',
    'Faz o combinado mesmo sem plateia. E ali que o carater aparece.',
    'Adiar a decisão já e uma decisão — e costuma ser a pior delas.',
    'O que te tira do serio revela onde você ainda depende de aprovação.',
    'Você controla a próxima ação. So ela. E já e o bastante pra hoje.',
    'Constância sem drama vale mais que intensidade com plateia.',
    'Não confunda estar ocupado com estar no caminho.',
    'A recompensa de fazer bem feito e ter feito bem feito. O resto e bônus.',
    'Se você não escolher onde gastar sua atenção, alguém escolhe por você.',
  ],
  rituais_lifestyle: [
    'Deixa o material da próxima ação separado antes de dormir. O atrito de começar cai pela metade.',
    'Uma ação ancorada em outra que já existe pega no automático. Depois do café, antes do banho, ao sentar.',
    'Escolhe um horário ruim de propósito pra tarefa difícil. Se ela sobrevive ao horário ruim, sobrevive a semana.',
    'Termina o dia decidindo a primeira ação do dia seguinte. Você acorda sem precisar negociar consigo mesmo.',
    'Corta a tarefa pela metade e faz so a primeira parte hoje. Costuma ser o suficiente pra destravar.',
    'Guarda o celular em outro comodo durante o bloco de foco. Distância funciona melhor que força de vontade.',
    'Começa pela versão feia. Corrigir e mais fácil que criar do zero.',
    'Marca um horário fixo pra revisar a semana. Sem isso, todo ajuste vira reacao.',
    'Se a ação leva menos de dois minutos, faz agora em vez de anotar.',
    'Bebe água antes do café. Metade do cansaco da manhã e desidratacao simples.',
    'Deixa uma tarefa fácil separada pro dia em que nada funcionar. Ela protege a sequência.',
    'Escreve o motivo da meta ao lado dela. Em duas semanas você não vai lembrar sozinho.',
    'Define onde a ação acontece, não so quando. Lugar fixo economiza decisão.',
    'Separa quinze minutos pra deixar o ambiente pronto. Rende mais que quinze minutos de execução ruim.',
    'Faz a parte chata primeiro, enquanto a cabeça ainda esta inteira.',
    'Coloca um limite de tempo em vez de meta de volume quando a tarefa te trava.',
    'Anota a ideia na hora que ela vier. Confiar na memória e como pagar juros.',
    'Fecha as abas que não pertencem a próxima hora. Ordem externa vira foco interno.',
    'Se você vive adiando uma tarefa, marca ela pro mesmo horário três dias seguidos.',
    'Come antes de decidir coisa importante. Fome piora julgamento mais do que você acha.',
    'Deixa roupa e material do treino visiveis. O que esta a vista custa menos pra começar.',
    'Revisa a lista de amanhã ainda hoje, e corta um item. Sempre tem um que não era pra estar la.',
    'Usa um alarme pra encerrar, não so pra começar. Parar no horário protege o dia seguinte.',
    'Guarda o domingo a noite pra planejar leve, não pra cobrar o que não foi feito.',
    'Junta tarefas parecidas no mesmo bloco. Trocar de contexto e o que mais cansa.',
    'Se a ação depende de outra pessoa, manda a mensagem antes de começar o resto.',
    'Tem um lugar so pra coisas por decidir. Deixar espalhado ocupa a cabeça de graca.',
    'Começa o dia sem abrir mensagem. Os primeiros trinta minutos definem quem manda na sua atenção.',
  ],
  sussurros_maestria: [
    'Maestria e reduzir o número de decisões por dia, não aumentar o número de tarefas.',
    'Quando algo fica fácil, e sinal pra aumentar a precisao — não necessariamente o volume.',
    'O amador busca o dia perfeito. Quem avança busca o dia repetivel.',
    'Você so domina o que consegue fazer cansado. O resto ainda depende de condicoes.',
    'Quem esta começando quer variedade. Quem esta avancando quer profundidade no mesmo lugar.',
    'A repetição so ensina quando você presta atenção nela. Sem atenção, e so desgaste.',
    'Aprender a parar no ponto certo e tao técnico quanto aprender a começar.',
    'O detalhe que ninguém nota e exatamente onde a diferença mora.',
    'Antes de aumentar a carga, verifica se a execução ainda esta limpa.',
    'Trabalho profundo não e trabalhar mais. E trabalhar sem trocar de assunto.',
    'A base parece chata porque você já a domina. Ela continua sendo a base.',
    'Melhora uma variavel por vez. Mudar três ao mesmo tempo apaga a leitura do que funcionou.',
    'Quem domina sabe a hora de parar. Quem está aprendendo insiste até estragar.',
    'A diferença entre bom e ótimo costuma estar no que se retira, não no que se acrescenta.',
    'Registra o que deu errado com detalhe. Erro sem descrição vira erro repetido.',
    'Executar devagar de propósito ensina mais que executar rápido no automático.',
    'A pressa de avançar de nível e o que mais atrasa gente talentosa.',
    'Se você não consegue explicar simples, ainda não dominou.',
    'Volume constroi resistencia. Atenção constroi técnica. Você precisa dos dois, em tempos diferentes.',
    'O melhor momento pra ajustar a forma e quando esta indo bem, não quando trava.',
    'Compara com você de três meses atrás. Comparar com outro so serve pra escolher referência.',
    'Tarefa difícil sem feedback vira teimosia. Arruma como medir antes de insistir.',
    'Depois que a ação vira habito, ela para de te ensinar. Ali muda o nível ou muda o alvo.',
    'A parte que você evita treinar e exatamente o seu teto atual.',
    'Descanso planejado e parte da técnica, não pausa dela.',
    'Sequência longa cria confiança. Confiança cria margem pra arriscar de verdade.',
    'Quem domina reduz variabilidade. O resultado bom vira o resultado normal.',
    'Antes de buscar método novo, verifica se você aplicou inteiro o que já conhece.',
    'A execução limpa e mais rápida no fim, mesmo sendo mais lenta no começo.',
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
