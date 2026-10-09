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
 * STYLE: second person, no greeting, no sign-off, one idea per card: a title (at most
 * 30 characters) and a text (at most 110). See OracleCard below.
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
/**
 * UM CARD E UM TITULO E UM TEXTO.
 *
 * Desde 09/10/2026 cada card tem duas partes. O TITULO e o gancho: e ele que
 * aparece em negrito no chat e que vira o titulo da notificacao, onde cabe uma
 * linha so — ate 30 caracteres. O TEXTO completa a ideia, ate 110 caracteres,
 * o que a tela de bloqueio mostra inteiro. Antes era uma frase solta, e o push
 * gastava a linha mais visivel dizendo "O Oraculo deixou um card".
 *
 * pickOracleCard devolve as duas partes numa string so, titulo na primeira
 * linha: quem grava e quem mostra o card continua lidando com texto.
 */
export interface OracleCard {
  titulo: string;
  texto: string;
}

export const ORACLE_CARD_LIBRARY: Partial<Record<OracleCategory, OracleCard[]>> = {
  frases_inspiradoras: [
    { titulo: 'Você vira o que repete', texto: 'Não é a intensidade de um dia que constrói. É a chatice de aparecer no dia seguinte.' },
    { titulo: 'Recomeçar não apaga nada', texto: 'O progresso antigo continua seu, mesmo depois de uma pausa longa.' },
    { titulo: 'A pequena de hoje vale mais', texto: 'Mais que a ação grande que você planeja para segunda-feira.' },
    { titulo: 'Motivação não é requisito', texto: 'Para começar, basta uma tarefa pequena o bastante para não dar medo.' },
    { titulo: 'Ninguém muda numa decisão só', texto: 'Muda em centenas de decisões pequenas que ninguém viu. A de hoje é uma delas.' },
    { titulo: 'O dia ruim também conta', texto: 'Aparecer mal é diferente de não aparecer.' },
    { titulo: 'Você já fez coisa mais difícil', texto: 'Mais difícil do que essa que você está adiando agora.' },
    { titulo: 'Constância não é nunca falhar', texto: 'É o intervalo entre falhar e voltar ficando cada vez menor.' },
    { titulo: 'Começar pesa mais que seguir', texto: 'O peso do começo é sempre o maior. Você só precisa atravessá-lo.' },
    { titulo: 'Não espera se sentir pronto', texto: 'Prontidão é consequência de ter começado, não requisito.' },
    { titulo: 'Uma semana honesta', texto: 'Vale mais que um mês de planos bonitos.' },
    { titulo: 'Quando ninguém está olhando', texto: 'O que você faz ali é exatamente o que você está construindo.' },
    { titulo: 'Ninguém começa pronto', texto: 'Começa disposto. A competência vem no caminho.' },
    { titulo: 'Hoje não precisa ser perfeito', texto: 'Só não pode ser o dia em que você desiste. O resto se acerta no caminho.' },
    { titulo: 'O progresso mais sólido', texto: 'É o que ninguém elogia enquanto acontece.' },
    { titulo: 'Cumprir fica mais barato', texto: 'Cada vez que você cumpre o combinado consigo mesmo, a próxima vez custa menos.' },
    { titulo: 'Ninguém só avança', texto: 'Não existe versão sua que só vai para a frente. Existe a que volta mais rápido.' },
    { titulo: 'A tarefa que você evita', texto: 'Costuma ser justamente a que destrava o resto.' },
    { titulo: 'Pouco e sempre vence', texto: 'Fazer pouco com constância vence fazer muito por impulso. Sempre venceu.' },
    { titulo: 'Você está mais perto', texto: 'Mais perto do que estava. Isso já é diferente de estar parado.' },
    { titulo: 'O plano torto que anda', texto: 'Ganha do plano perfeito que nunca começa.' },
    { titulo: 'Pequeno até ficar ridículo', texto: 'Começa pequeno a ponto de parecer ridículo. Ridículo é sustentável.' },
    { titulo: 'Confiança é evidência', texto: 'Confiar em si mesmo vem de provas acumuladas, não de discurso.' },
    { titulo: 'Salvo no fim da tarde conta', texto: 'Um dia salvo às seis da tarde ainda é um dia salvo.' },
    { titulo: 'Você não chegou tarde', texto: 'Chegou no ponto em que começou a prestar atenção. É daqui que se anda.' },
    { titulo: 'A vontade vem e vai', texto: 'O combinado fica.' },
    { titulo: 'Termina algo pequeno hoje', texto: 'Fechar uma coisa pequena hoje muda o seu humor de amanhã.' },
    { titulo: 'De perto parece lento', texto: 'De longe, o mesmo caminho costuma parecer rápido.' },
    { titulo: 'Você já provou que consegue', texto: 'Falta só repetir mais uma vez.' },
  ],
  reflexoes_filosoficas: [
    { titulo: 'Difícil ou mal definido?', texto: 'O que você está adiando hoje é difícil mesmo, ou só não tem forma ainda?' },
    { titulo: 'E se a inspiração faltar?', texto: 'Se o seu sistema depende de estar inspirado, ele funciona quantos dias por mês?' },
    { titulo: 'Você escolheu a sua semana?', texto: 'Ou algumas coisas só foram entrando sem ninguém decidir?' },
    { titulo: 'Quando você tirou algo?', texto: 'Quando foi a última vez que você tirou um item da lista, em vez de adicionar?' },
    { titulo: 'Falta de tempo ou prioridade?', texto: 'Troca uma palavra pela outra e vê se a frase continua verdadeira. Às vezes não continua.' },
    { titulo: 'Mede o que importa?', texto: 'Ou só o que é fácil de medir?' },
    { titulo: 'Mesmo ritmo sem plateia?', texto: 'Se ninguém soubesse do seu progresso, você continuaria no mesmo passo?' },
    { titulo: 'Essa meta ainda é sua?', texto: 'Ou virou uma dívida que você paga por vergonha?' },
    { titulo: 'E se fosse metade, todo dia?', texto: 'O que mudaria hoje se você aceitasse fazer metade, mas fazer todos os dias?' },
    { titulo: 'Terminar ou ter terminado?', texto: 'Querer fazer e querer que já esteja feito são vontades diferentes.' },
    { titulo: 'Trabalho ou ansiedade?', texto: 'Qual parte do seu esforço é trabalho, e qual é ansiedade parecendo trabalho?' },
    { titulo: 'Daqui a um ano, igual?', texto: 'Se nada disso tiver mudado até lá, o que você diria que faltou?' },
    { titulo: 'Construindo ou se mexendo?', texto: 'Você está construindo algo, ou só evitando ficar parado?' },
    { titulo: 'E se ninguém fosse ver?', texto: 'O que você faria diferente se o resultado fosse só seu? Talvez seja isso que vale fazer.' },
    { titulo: 'Metas suas ou herdadas?', texto: 'Quantas você escolheu, e quantas recebeu prontas e nunca revisou?' },
    { titulo: 'Com metade do tempo', texto: 'O que sairia da sua lista primeiro? Talvez já possa sair hoje.' },
    { titulo: 'Preguiça ou cansaço?', texto: 'O que você chama de preguiça poderia ser cansaço de verdade?' },
    { titulo: 'Dificuldade ou medo?', texto: 'Você está com dificuldade, ou com medo de descobrir que consegue?' },
    { titulo: 'Sorte só quando dá certo?', texto: 'Quando algo dá certo, você diz que foi sorte. E quando dá errado, de quem é?' },
    { titulo: 'O que não começar protege?', texto: 'Às vezes adiar guarda alguma coisa. Vale saber o quê antes de seguir.' },
    { titulo: 'Se fosse a rotina de um amigo', texto: 'Você acharia sustentável o que está pedindo de si mesmo?' },
    { titulo: 'Disciplina ou alívio?', texto: 'Você quer disciplina, ou quer parar de se sentir culpado? São caminhos diferentes.' },
    { titulo: 'O que mudou desde então?', texto: 'Desde a última vez que você revisou esse objetivo, o que mudou em você?' },
    { titulo: 'Cansado de fazer ou decidir?', texto: 'Você está cansado do trabalho, ou de decidir sobre ele o dia inteiro?' },
    { titulo: 'Qual é o menor passo real?', texto: 'O menor passo que ainda contaria como progresso de verdade.' },
    { titulo: 'Hábito sem motivo', texto: 'O que você faz por costume e já não consegue explicar por quê?' },
    { titulo: 'Hoje, repetido cem vezes', texto: 'Que vida esse dia construiria se fosse o padrão?' },
    { titulo: 'Feito ou faltando?', texto: 'Você mede o dia pelo que fez, ou pelo que deixou de fazer?' },
    { titulo: 'E se essa meta não interessa?', texto: 'O que você ganharia admitindo que ela não faz mais sentido?' },
    { titulo: 'Esperando o quê?', texto: 'O momento certo, ou virar outra pessoa antes de começar?' },
  ],
  fragmentos_sabedoria: [
    { titulo: 'Só o que depende de você', texto: 'Separa o que está na sua mão do que não está. Só o primeiro grupo merece sua energia hoje.' },
    { titulo: 'Você não controla o resultado', texto: 'Controla o preparo, a decisão e a repetição. E isso já é bastante.' },
    { titulo: 'O obstáculo é o caminho', texto: 'Por enquanto, ele não está no caminho: ele é o caminho.' },
    { titulo: 'Não é o fato que trava', texto: 'É o que você decide que aquilo significa.' },
    { titulo: 'Conta com a dificuldade', texto: 'Quando você já espera por ela, ela deixa de ser interrupção e vira parte do combinado.' },
    { titulo: 'Age com o que você tem', texto: 'Condições ideais são uma promessa que quase nunca chega.' },
    { titulo: 'Seu juízo vale mais', texto: 'Avaliar o próprio dia com honestidade vale mais que a opinião de qualquer um sobre ele.' },
    { titulo: 'Reclamar não muda o peso', texto: 'Mudar a alavanca, sim.' },
    { titulo: 'Você vai errar de novo', texto: 'A questão é quanto tempo leva para voltar depois do erro.' },
    { titulo: 'O que está na sua frente', texto: 'Fazer isso bem é o trabalho inteiro. O resto é imaginação.' },
    { titulo: 'Pressa também é fuga', texto: 'Ritmo sustentável é uma forma de coragem.' },
    { titulo: 'Lamentar o tempo perdido', texto: 'É o único jeito de perder o mesmo tempo duas vezes.' },
    { titulo: 'Não peça um dia fácil', texto: 'Peça para estar à altura do dia que vier.' },
    { titulo: 'Opinião alheia não soma ponto', texto: 'O que os outros acham do seu esforço não entra na conta. O que entra é o que você fez.' },
    { titulo: 'A interrupção não se escolhe', texto: 'Você escolhe só se ela vira desculpa.' },
    { titulo: 'Começa pelo que alcança', texto: 'O que está ao seu alcance agora é o começo. O resto é cenário.' },
    { titulo: 'Esperar vontade é acaso', texto: 'Quem age constrói o próprio clima.' },
    { titulo: 'Erro olhado ensina', texto: 'Ele só vira prejuízo quando você se recusa a olhar para ele.' },
    { titulo: 'Não precisa vencer o dia', texto: 'Precisa só não entregar o dia de graça.' },
    { titulo: 'Aceitar não é desistir', texto: 'Aceitar o limite de hoje é parar de negociar com a realidade.' },
    { titulo: 'A tarefa não fica leve', texto: 'Quem fica mais firme é você.' },
    { titulo: 'Preocupação é imposto', texto: 'Se preocupar com o que não depende de você é um imposto que você escolhe pagar.' },
    { titulo: 'Sem plateia também vale', texto: 'Fazer o combinado sem ninguém ver é onde o caráter aparece.' },
    { titulo: 'Adiar também é decidir', texto: 'E costuma ser a pior das decisões.' },
    { titulo: 'O que te tira do sério', texto: 'Mostra onde você ainda depende da aprovação dos outros.' },
    { titulo: 'Só a próxima ação', texto: 'É a única coisa que você controla agora. E já basta para hoje.' },
    { titulo: 'Constância sem drama', texto: 'Vale mais que intensidade com plateia.' },
    { titulo: 'Ocupado não é no caminho', texto: 'Muita coisa acontecendo não quer dizer que você está indo para onde quer.' },
    { titulo: 'Bem feito já é o prêmio', texto: 'A recompensa de fazer bem feito é ter feito bem feito. O resto é bônus.' },
    { titulo: 'Sua atenção tem dono', texto: 'Se você não escolher onde gastá-la, alguém escolhe por você.' },
  ],
  rituais_lifestyle: [
    { titulo: 'Separa tudo antes de dormir', texto: 'Material da próxima ação pronto na véspera corta o atrito de começar pela metade.' },
    { titulo: 'Ancora no que já existe', texto: 'Depois do café, antes do banho, ao sentar: ação presa a outra pega no automático.' },
    { titulo: 'Testa no horário ruim', texto: 'Se a tarefa difícil sobrevive ao pior horário, sobrevive à semana inteira.' },
    { titulo: 'Decide a primeira de amanhã', texto: 'Termina o dia escolhendo a primeira ação do dia seguinte. Você acorda sem negociar.' },
    { titulo: 'Trava? Faz só a primeira parte', texto: 'Divide a tarefa ao meio e faz a metade de hoje. Começar costuma bastar para destravar o resto.' },
    { titulo: 'Celular em outro cômodo', texto: 'Durante o bloco de foco, distância funciona melhor que força de vontade.' },
    { titulo: 'Começa pela versão feia', texto: 'Corrigir é mais fácil que criar do zero.' },
    { titulo: 'Hora fixa para revisar', texto: 'Sem um horário para olhar a semana, todo ajuste vira reação.' },
    { titulo: 'Dois minutos? Faz agora', texto: 'Se leva menos que isso, fazer custa menos do que anotar.' },
    { titulo: 'Água antes do café', texto: 'Parte do cansaço da manhã é só desidratação.' },
    { titulo: 'Uma fácil de reserva', texto: 'Guarda uma tarefa fácil para o dia em que nada funcionar. Ela protege a sequência.' },
    { titulo: 'Escreve o porquê da meta', texto: 'Anota o motivo ao lado dela. Em duas semanas você não vai lembrar sozinho.' },
    { titulo: 'Onde, e não só quando', texto: 'Definir o lugar da ação economiza uma decisão por dia.' },
    { titulo: 'Prepara o lugar antes', texto: 'Quinze minutos arrumando o ambiente rendem mais que quinze minutos fazendo a tarefa mal.' },
    { titulo: 'A parte chata primeiro', texto: 'Enquanto a cabeça ainda está inteira.' },
    { titulo: 'Tempo no lugar de volume', texto: 'Quando a tarefa trava, troca a meta de quantidade por um limite de minutos.' },
    { titulo: 'Anota na hora', texto: 'Confiar na memória para guardar ideias é como pagar juros.' },
    { titulo: 'Fecha as abas que sobram', texto: 'As que não pertencem à próxima hora. Ordem por fora vira foco por dentro.' },
    { titulo: 'Três dias no mesmo horário', texto: 'A tarefa que você vive adiando, marcada no mesmo horário por três dias seguidos.' },
    { titulo: 'Come antes de decidir', texto: 'Fome piora o julgamento mais do que parece.' },
    { titulo: 'Deixa o treino à vista', texto: 'Roupa e material visíveis custam menos para começar.' },
    { titulo: 'Tira um item de amanhã', texto: 'Revisa a lista de amanhã ainda hoje. Sempre tem um item que não era para estar lá.' },
    { titulo: 'Alarme para parar também', texto: 'Encerrar no horário protege o dia seguinte.' },
    { titulo: 'Domingo à noite, leve', texto: 'Usa para planejar a semana com calma, não para cobrar o que ficou.' },
    { titulo: 'Junta as parecidas', texto: 'Tarefas do mesmo tipo no mesmo bloco. Trocar de contexto é o que mais cansa.' },
    { titulo: 'Primeiro, a mensagem', texto: 'Se a ação depende de outra pessoa, manda a mensagem antes de começar o resto.' },
    { titulo: 'Um lugar para o pendente', texto: 'Pendências espalhadas ocupam a cabeça de graça. Junta tudo num lugar só.' },
    { titulo: 'Sem mensagem ao acordar', texto: 'Os primeiros trinta minutos decidem quem manda na sua atenção.' },
  ],
  sussurros_maestria: [
    { titulo: 'Maestria é decidir menos', texto: 'É reduzir as decisões do dia, não aumentar o número de tarefas.' },
    { titulo: 'Ficou fácil? Mais precisão', texto: 'Quando algo fica fácil, é hora de afinar a execução, não necessariamente o volume.' },
    { titulo: 'O amador busca o dia perfeito', texto: 'Quem avança busca o dia repetível. O alto nível está em fazer algo que pode ser consistente.' },
    { titulo: 'Domina o que faz cansado', texto: 'O resto ainda depende de condições boas para sair.' },
    { titulo: 'Variedade ou profundidade', texto: 'Quem começa quer variedade. Quem avança quer profundidade no mesmo lugar.' },
    { titulo: 'Repetir com atenção', texto: 'Sem atenção, a repetição não ensina: só desgasta.' },
    { titulo: 'Parar também é técnica', texto: 'Saber parar no ponto certo é tão técnico quanto saber começar.' },
    { titulo: 'O detalhe que ninguém nota', texto: 'É exatamente onde a diferença mora.' },
    { titulo: 'Antes de aumentar a carga', texto: 'Confere se a execução ainda está limpa.' },
    { titulo: 'Profundo não é mais', texto: 'Trabalho profundo é trabalhar sem trocar de assunto.' },
    { titulo: 'A base parece chata', texto: 'Parece porque você já a domina. Ela continua sendo a base.' },
    { titulo: 'Uma variável por vez', texto: 'Mudar três ao mesmo tempo apaga a leitura do que funcionou.' },
    { titulo: 'Quem domina sabe parar', texto: 'Quem está aprendendo insiste até estragar.' },
    { titulo: 'Do bom ao ótimo', texto: 'A diferença costuma estar no que você tira, não no que acrescenta.' },
    { titulo: 'Erro com descrição', texto: 'Registra o que deu errado em detalhe. Erro sem descrição vira erro repetido.' },
    { titulo: 'Devagar de propósito', texto: 'Executar devagar ensina mais que executar rápido no automático.' },
    { titulo: 'A pressa de subir de nível', texto: 'É o que mais atrasa gente talentosa.' },
    { titulo: 'Explica simples', texto: 'Se você ainda não consegue explicar de um jeito simples, ainda não dominou.' },
    { titulo: 'Volume e atenção', texto: 'Volume constrói resistência, atenção constrói técnica. Você precisa dos dois, em tempos diferentes.' },
    { titulo: 'Ajusta quando vai bem', texto: 'O melhor momento para corrigir a forma é quando está fluindo, não quando trava.' },
    { titulo: 'Compara com você mesmo', texto: 'Com você de três meses atrás. Comparar com outra pessoa só serve para escolher referência.' },
    { titulo: 'Sem retorno vira teimosia', texto: 'Antes de insistir numa tarefa difícil, arruma um jeito de medir se está melhorando.' },
    { titulo: 'Virou hábito? Muda o alvo', texto: 'Quando a ação vira hábito, ela para de ensinar. Ali muda o nível ou muda o alvo.' },
    { titulo: 'O que você evita treinar', texto: 'É exatamente o seu teto atual.' },
    { titulo: 'Descanso faz parte', texto: 'Descanso planejado é parte da técnica, não uma pausa dela.' },
    { titulo: 'Sequência longa dá margem', texto: 'Ela cria confiança, e a confiança abre espaço para arriscar de verdade.' },
    { titulo: 'Bom vira normal', texto: 'Quem domina reduz a variação. O resultado bom passa a ser o resultado comum.' },
    { titulo: 'Antes do método novo', texto: 'Confere se você aplicou inteiro o que já conhece.' },
    { titulo: 'Limpa é mais rápida', texto: 'A execução limpa ganha no fim, mesmo sendo mais lenta no começo.' },
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
  const cards = ORACLE_CARD_LIBRARY[category];
  if (!cards || cards.length === 0) return null;
  const stock = cards.map(cardAsText);

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

/** O card como ele e gravado e mostrado: titulo na primeira linha, texto na segunda. */
export const cardAsText = (card: OracleCard): string => `${card.titulo}\n${card.texto}`;

/**
 * O caminho de volta: separa o titulo do texto de um card gravado. Card antigo,
 * de antes do titulo, volta sem titulo e com o texto inteiro.
 */
export const splitCardText = (content: string): { titulo: string | null; texto: string } => {
  const [primeira, ...resto] = String(content || '').split('\n');
  return resto.length > 0
    ? { titulo: primeira.trim(), texto: resto.join(' ').trim() }
    : { titulo: null, texto: primeira.trim() };
};

export const getOracleCardStockSize = (category: OracleCategory): number =>
  ORACLE_CARD_LIBRARY[category]?.length ?? 0;
