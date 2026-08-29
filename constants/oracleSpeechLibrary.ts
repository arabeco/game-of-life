/**
 * Falas do Oraculo no momento em que a coisa acontece.
 *
 * Nao confundir com tres vizinhos:
 * - `oracleCardLibrary.ts` sao os cards de conteudo, puxados a pedido e
 *   limitados por dia. Nao variam por tom.
 * - `supabase/functions/_shared/oracle-host-voice.ts` sao blocos de prompt do
 *   tempo em que o Oraculo chamava IA. Nao ha mais IA no app.
 * - `showToast` e aviso de sistema. Fala e outra coisa: e o Oraculo comentando.
 *
 * Como mexer:
 * - trocar texto de um evento: edita so o array daquele evento e tom
 * - criar variacao: adiciona string no array, sem tocar em codigo
 * - criar evento: adiciona a chave em OracleSpeechEvent e preenche os 4 tons
 *
 * Cada fala usa marcadores em chaves, listados no comentario do evento.
 * Marcador que nao existir nas vars fica no texto - erro visivel, nao silencioso.
 */

export type OracleSpeechTone = 'neutro' | 'coach' | 'reflexivo' | 'calmo';

/** Tom de quem nao assina. Sempre disponivel. */
export const ORACLE_FREE_TONE: OracleSpeechTone = 'neutro';

/** Tons que o Premium abre. Platinum nao entra aqui. */
/**
 * O tom gravado pode vir de versao antiga ou nao existir ainda.
 *
 * Cair no neutro e o certo: ele e o tom gratuito, entao errar para ele nunca
 * entrega de graca a voz que o Premium compra, e nunca deixa o Oraculo mudo.
 */
export const resolveOracleSpeechTone = (tone: string | null | undefined): OracleSpeechTone =>
    tone && ['neutro', 'coach', 'reflexivo', 'calmo'].includes(tone)
        ? (tone as OracleSpeechTone)
        : 'neutro';

export const ORACLE_PREMIUM_TONES: readonly OracleSpeechTone[] = ['coach', 'reflexivo', 'calmo'];

export const ORACLE_TONE_LABELS: Record<OracleSpeechTone, { name: string; hint: string }> = {
    neutro: { name: 'Neutro', hint: 'Equilibrado e direto. O padrao, sem assinatura.' },
    coach: { name: 'Coach', hint: 'Solta dica e sugestao. Aponta o proximo movimento.' },
    reflexivo: { name: 'Reflexivo', hint: 'Devolve uma pergunta em vez de um elogio.' },
    calmo: { name: 'Calmo', hint: 'Sereno, sem pressa. Tira peso em vez de cobrar.' },
};

export type OracleSpeechEvent =
    | 'campaign_completed'
    | 'arena_completed'
    | 'daily_reps_high'
    | 'daily_reps_mid'
    | 'daily_reps_low'
    | 'cycle_goal_met'
    | 'cycle_goal_last_one'
    | 'cycle_goal_first'
    | 'cycle_goal_progress'
    | 'milestone_completed'
    // Nao sao coisas novas que acontecem: sao as MESMAS coisas acontecendo em
    // momentos que mudam o significado delas. Fechar uma acao e banal; fechar a
    // primeira depois de oito dias e historia.
    | 'first_after_pause'
    | 'streak_saved';

type ToneVariants = Record<OracleSpeechTone, string[]>;

export const ORACLE_SPEECH_LIBRARY: Record<OracleSpeechEvent, ToneVariants> = {
    /** Campanha inteira fechada. Marcadores: {campaign} */
    campaign_completed: {
        neutro: [
            'Campanha "{campaign}" fechada. Boa. Agora deixa esse marco assentar antes de abrir outra frente grande.',
            '"{campaign}" concluiu. Isso já é um bloco inteiro de vida organizado, não só uma tarefa.',
            'Campanha "{campaign}" encerrada. Ela sai da lista e vira histórico.',
        ],
        calmo: [
            '"{campaign}" fechou. Não precisa abrir nada agora. Deixa assentar.',
            'Campanha "{campaign}" concluída. E bastante coisa. Descansa antes da próxima.',
            '"{campaign}" acabou. Não precisa de próxima hoje.',
        ],
        coach: [
            'Campanha "{campaign}" fechada. Dica: escreve em uma linha o que fez ela andar, antes de esquecer.',
            '"{campaign}" concluída. Sugestão: espera uma semana antes de abrir outra desse tamanho.',
            '"{campaign}" fechada. Dica: olha o que dela vale repetir na próxima antes de esquecer.',
        ],
        reflexivo: [
            '"{campaign}" fechou. O que dentro dela você faria de novo?',
            'Campanha "{campaign}" concluída. Foi o plano que funcionou, ou a insistência?',
            'Campanha "{campaign}" fechada. Você é o mesmo de quando começou ela?',
        ],
    },

    /** Arena concluida. Marcadores: {arena} */
    arena_completed: {
        neutro: [
            'Arena "{arena}" concluída. Muito bem. Essa frente ganhou forma real.',
            '"{arena}" fechou. Boa. Agora vale registrar o que funcionou antes de empilhar outra coisa.',
            'Arena "{arena}" encerrada. O espaço dela abre para outra coisa.',
        ],
        calmo: [
            '"{arena}" fechou. Sem pressa de começar a próxima.',
            'Arena "{arena}" concluída. Fica um momento com isso antes de seguir.',
            '"{arena}" fechou. Pode ficar só nisso hoje.',
        ],
        coach: [
            'Arena "{arena}" concluída. Dica: anota as duas ações que mais renderam.',
            '"{arena}" fechou. Sugestão: não abre outra hoje - deixa o próximo ciclo escolher.',
            '"{arena}" concluída. Sugestão: não preenche a vaga hoje - deixa o ciclo respirar um dia.',
        ],
        reflexivo: [
            '"{arena}" fechou. O que aqui vale levar para a próxima?',
            'Arena "{arena}" concluída. Foi ela que mudou, ou você?',
            '"{arena}" fechou. Ela terminou porque acabou, ou porque você mudou?',
        ],
    },

    /** Oito ou mais acoes reais no dia. Marcadores: {count} */
    daily_reps_high: {
        neutro: [
            '{count} ações reais hoje. Muito bem; agora protege o fechamento.',
            '{count} ações reais no dia. Bom ritmo. Agora não precisa provar mais nada, precisa fechar limpo.',
            '{count} ações hoje. E acima do seu dia comum.',
        ],
        calmo: [
            '{count} ações hoje. Já é bastante. Pode parar sem culpa.',
            '{count} entregas reais. O dia está feito. Fecha com calma.',
            '{count} hoje. Amanhã pode ser um, e continua valendo.',
        ],
        coach: [
            '{count} ações hoje. Sugestão: para de abrir e fecha o que ficou em pé.',
            '{count} entregas. Dica: dia assim cobra amanhã. Planeja um amanhã mais leve.',
            '{count} ações. Dica: guarda uma das fáceis para amanhã - começar cheio ajuda.',
        ],
        reflexivo: [
            '{count} ações hoje. Isso foi ritmo ou foi fuga de outra coisa?',
            '{count} entregas. O que ficou de fora enquanto você fazia tudo isso?',
            '{count} ações hoje. Você escolheu esse ritmo, ou ele te escolheu?',
        ],
    },

    /** Cinco a sete acoes reais no dia. Marcadores: {count} */
    daily_reps_mid: {
        neutro: [
            '{count} ações reais hoje. O dia ganhou corpo.',
            '{count} entregas reais. Boa. Agora escolhe a próxima sem inflar o dia.',
            '{count} ações reais hoje.',
        ],
        calmo: [
            '{count} ações hoje. O dia já tem peso proprio.',
            '{count} entregas. Dá para seguir devagar a partir daqui.',
            '{count} hoje. Esse é o tamanho de um dia que se sustenta.',
        ],
        coach: [
            '{count} ações hoje. Sugestão: escolhe uma só para fechar e para por aí.',
            '{count} entregas. Dica: a próxima rende mais se for a que você vem adiando.',
            '{count} entregas. Sugestão: repete esse número amanhã em vez de tentar dobrar.',
        ],
        reflexivo: [
            '{count} ações hoje. A próxima é necessidade ou impulso?',
            '{count} entregas. O dia já está bom - o que você ainda quer provar?',
            '{count} ações. Foi o dia que você planejou ou o que ele permitiu?',
        ],
    },

    /** Tres acoes reais no dia. Marcadores: {count} */
    daily_reps_low: {
        neutro: [
            '{count} ações reais hoje. Muito bem.',
            'Três ações reais já mudam o dia. Continua com calma.',
            '{count} hoje. Menos que o comum, e ainda assim registrado.',
        ],
        calmo: [
            '{count} ações hoje. Já é o suficiente para o dia contar.',
            'Três entregas reais mudam o dia. Sem pressa para a quarta.',
            '{count} hoje já tira o dia do zero. E isso que conta.',
        ],
        coach: [
            '{count} ações hoje. Dica: é aqui que o dia destrava. Aproveita o embalo numa quarta.',
            'Três entregas reais. Sugestão: fecha o dia agora e ganha o de amanhã inteiro.',
            '{count} feita. Dica: amanhã começa pela mesma - repetir é mais barato que escolher.',
        ],
        reflexivo: [
            '{count} ações hoje. O que destravou depois da primeira?',
            'Três entregas já mudam o dia. Por que essas três e não outras?',
            '{count} hoje. O que ocupou o resto?',
        ],
    },

    /** Meta da acao fechada no ciclo. Marcadores: {action} {count} {target} */
    cycle_goal_met: {
        neutro: [
            '{action}: {count}/{target} no ciclo. Fechou a meta dessa ação.',
            '{action} completou o combinado do ciclo: {count}/{target}. Boa.',
            '{action} fechou o ciclo em {count}/{target}.',
        ],
        calmo: [
            '{action} fechou o ciclo em {count}/{target}. Pode soltar essa.',
            '{action}: {count}/{target}. Combinado cumprido, sem precisar de mais.',
            '{action} completa: {count}/{target}. Não precisa passar disso.',
        ],
        coach: [
            '{action} fechou em {count}/{target}. Sugestão: não aumenta a meta no meio - sobe no próximo ciclo.',
            '{action}: {count}/{target}. Dica: usa o tempo dessa ação na que está atrasada.',
            '{action} em {count}/{target}, meta batida. Sugestão: não aumenta a meta agora - termina o ciclo assim.',
        ],
        reflexivo: [
            '{action} fechou em {count}/{target}. O alvo estava no tamanho certo?',
            '{action}: {count}/{target}. Você repetiria essa meta no próximo ciclo?',
            '{action} chegou a {count}/{target}. A meta estava certa, ou ficou fácil demais?',
        ],
    },

    /** Falta uma para fechar. Marcadores: {action} {count} {target} */
    cycle_goal_last_one: {
        neutro: [
            '{action}: {count}/{target} no ciclo. Falta só 1 para fechar essa meta.',
            'Boa. {action} está quase lá: {count}/{target}.',
            '{action} em {count}/{target}. Falta uma.',
        ],
        calmo: [
            '{action}: {count}/{target}. Falta uma, e ela pode esperar.',
            '{action} está a uma entrega do fim. Sem correria.',
            '{count}/{target} em {action}. A última pode ser amanhã.',
        ],
        coach: [
            '{action}: {count}/{target}. Dica: agenda a última para amanhã cedo, antes do ciclo apertar.',
            'Falta uma em {action} ({count}/{target}). Sugestão: fecha hoje e tira da cabeça.',
            '{action} em {count}/{target}. Dica: agenda a última agora, enquanto é só uma.',
        ],
        reflexivo: [
            '{action}: {count}/{target}. O que segurou a última até aqui?',
            'Falta uma em {action}. Ela é difícil ou só ficou para depois?',
            'Falta uma de {action}. O que costuma acontecer com você na última?',
        ],
    },

    /** Primeira entrega da acao no ciclo. Marcadores: {action} {target} {remaining} */
    cycle_goal_first: {
        neutro: [
            '{action} entrou no ciclo: 1/{target}. Agora é só manter sem inflar.',
            'Primeira de {action} registrada neste ciclo. Faltam {remaining}.',
            '{action} saiu do zero: 1/{target}.',
        ],
        calmo: [
            '{action} começou: 1/{target}. A primeira costuma ser a mais cara.',
            'Primeira de {action} no ciclo. Faltam {remaining}, uma de cada vez.',
            'Primeira de {action}. As outras {remaining} não precisam ser hoje.',
        ],
        coach: [
            '{action} começou: 1/{target}. Dica: marca as {remaining} restantes agora, enquanto está quente.',
            'Primeira de {action} feita. Sugestão: repete no mesmo horário - o habito pega mais rápido.',
            '1/{target} em {action}. Sugestão: a segunda dentro de dois dias, senão vira primeira de novo.',
        ],
        reflexivo: [
            '{action} começou: 1/{target}. O que destravou hoje e não antes?',
            'Primeira de {action} no ciclo. As {remaining} restantes cabem mesmo?',
            '{action} começou. O que quase impediu essa primeira?',
        ],
    },

    /** Progresso no meio do caminho. Marcadores: {action} {count} {target} {remaining} */
    cycle_goal_progress: {
        neutro: [
            '{action}: {count}/{target} no ciclo. Faltam {remaining}.',
            'Boa. {action} já tem {count} entregas no ciclo; restam {remaining}.',
            '{action} em {count}/{target}. Faltam {remaining}.',
        ],
        calmo: [
            '{action}: {count}/{target}. Restam {remaining}, e há tempo.',
            '{action} segue andando: {count} feitas, {remaining} pela frente.',
            '{count}/{target} em {action}. Meio caminho conta como caminho.',
        ],
        coach: [
            '{action}: {count}/{target}. Dica: divide as {remaining} pelos dias restantes e para de improvisar.',
            '{action} em {count}/{target}. Sugestão: se {remaining} não couber, corta a meta agora e não no fim.',
            '{action} em {count}/{target}. Dica: {remaining} restantes dividem bem nos dias que sobram.',
        ],
        reflexivo: [
            '{action}: {count}/{target}. As {remaining} restantes seguem fazendo sentido?',
            '{action} tem {count} entregas. O que mudou desde a primeira?',
            '{count}/{target} em {action}. O que fez as {count} primeiras acontecerem?',
        ],
    },

    /** Marco concluido. Marcadores: {action} */
    first_after_pause: {
        neutro: [
            'Primeira ação em {dias} dias.',
            'Depois de {dias} dias parados, uma saiu.',
            '{dias} dias sem nada, e hoje tem uma.',
        ],
        coach: [
            'Primeira em {dias} dias. Amanhã a segunda custa menos que essa.',
            'Quebrou {dias} dias de pausa. E a próxima que decide se virou retomada.',
            'Uma ação depois de {dias} dias parados. Repete amanhã e já e ritmo.',
        ],
        reflexivo: [
            'Primeira em {dias} dias. O que hoje tinha que os outros não tinham?',
            'Depois de {dias} dias, essa saiu. Dá para repetir o que fez ela acontecer?',
            '{dias} dias de pausa e uma ação hoje. O que mudou?',
        ],
        calmo: [
            'Primeira em {dias} dias, e já e o bastante para hoje.',
            'Depois de {dias} dias, uma. Não precisa recuperar o resto.',
            '{dias} dias pararam aqui. Sem pressa para o que vem.',
        ],
    },
    streak_saved: {
        neutro: [
            'Fechou o dia. A sequência continua em {streak}.',
            'Sequência mantida: {streak} dias.',
            'Passou de raspão, e {streak} segue de pé.',
        ],
        coach: [
            '{streak} salvos no fim do dia. Amanhã, mais cedo.',
            'Sequência mantida em {streak}. Antecipa amanhã e para de depender do limite.',
            'Fechou a tempo. {streak} continua, e o próximo não precisa ser assim.',
        ],
        reflexivo: [
            '{streak} salvos no limite. Foi o dia, ou foi a hora que você escolheu?',
            'A sequência sobreviveu por pouco. Isso está virando o padrão?',
            'Fechou no fim do dia de novo. {streak} vale essa corrida toda noite?',
        ],
        calmo: [
            '{streak} de pé. Chegou no fim, mas chegou.',
            'A sequência continua em {streak}. Tarde ainda é a tempo.',
            'Fechou. {streak} seguem, sem precisar ter sido perfeito.',
        ],
    },
    milestone_completed: {
        neutro: [
            'Marco "{action}" concluído. Isso muda o desenho do ciclo.',
            '"{action}" foi concluída. Boa. Esse era um ponto de passagem, não só mais uma ação.',
            'Marco "{action}" fechado. Ele não volta a aparecer.',
        ],
        calmo: [
            'Marco "{action}" concluído. Era um ponto de virada. Reconhece isso.',
            '"{action}" fechou. Deixa esse marco assentar antes de seguir.',
            '"{action}" era um marco. Deixa pesar o quanto merece.',
        ],
        coach: [
            'Marco "{action}" concluído. Sugestão: revisa o ciclo - marco fechado costuma liberar espaço.',
            '"{action}" fechou. Dica: se ele destravou outra coisa, agenda essa outra hoje.',
            'Marco "{action}" fechado. Sugestão: escreve em uma linha o que fez ele sair.',
        ],
        reflexivo: [
            'Marco "{action}" concluído. O que ele destrava agora?',
            '"{action}" fechou. Era mesmo um marco, ou virou um no caminho?',
            '"{action}" fechou. Há um mês você apostaria que fecharia?',
        ],
    },
};

/** Troca o marcador pelo valor. O que nao existir fica visivel no texto. */
export const fillOracleSpeech = (template: string, vars: Record<string, string | number> = {}): string =>
    template.replace(/\{(\w+)\}/g, (match, key: string) => (
        Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
    ));

/** Sorteia uma variacao do evento no tom pedido. Cai no neutro se o tom nao tiver texto. */
export const pickOracleSpeech = (
    event: OracleSpeechEvent,
    tone: OracleSpeechTone,
    vars: Record<string, string | number> = {},
    avoid?: string | null,
): string => {
    const entry = ORACLE_SPEECH_LIBRARY[event];
    const variants = (entry?.[tone]?.length ? entry[tone] : entry?.neutro) || [];
    if (variants.length === 0) return '';

    // `avoid` EXCLUI, nao repete o sorteio ate dar diferente.
    //
    // A primeira versao tentava de novo tres vezes: com tres variantes, cada
    // tentativa tinha um terco de chance de cair na mesma, e a anterior voltava
    // uma vez em vinte e sete. Raro o bastante para o teste passar por sorte, e
    // frequente o bastante para a pessoa ver. Filtrar torna impossivel.
    const preenchidas = variants.map((linha) => fillOracleSpeech(linha, vars));
    const candidatas = avoid ? preenchidas.filter((linha) => linha !== avoid) : preenchidas;
    // Sobrando uma so, repetir e melhor que calar: a reacao responde a algo que a
    // pessoa acabou de fazer, e silencio ali e lido como defeito.
    const conjunto = candidatas.length > 0 ? candidatas : preenchidas;
    return conjunto[Math.floor(Math.random() * conjunto.length)] || conjunto[0];
};

/**
 * A saudacao de abertura.
 *
 * O app abre no painel diario, e ate agora ele abria mudo: o Oraculo so falava
 * reagindo a algo ja feito. Isto e o cumprimento — uma linha, sem botao, sem
 * card, sem nada para dispensar. Some sozinho na proxima abertura.
 *
 * Some no silencioso (presenca 0) e aparece nos dois niveis em que o Oraculo
 * fala — equilibrado e presente. A primeira versao exigia presenca 3, mas o
 * padrao do app e 2: na pratica quase ninguem via a saudacao.
 *
 * Nao carrega numero nem cobranca: quem quer dado tem a leitura logo abaixo.
 */
export type OracleGreetingPeriod = 'manha' | 'tarde' | 'noite';

export const ORACLE_GREETINGS: Record<OracleGreetingPeriod, Record<OracleSpeechTone, string[]>> = {
    manha: {
        neutro: ['Bom dia.', 'Dia novo. O painel esta aqui.'],
        coach: ['Bom dia. Comece pela menor.', 'Dia novo: escolha uma e puxe.'],
        reflexivo: ['Bom dia. O que merece o comeco de hoje?', 'Dia novo. Que peso voce quer nao carregar hoje?'],
        calmo: ['Bom dia. Sem pressa.', 'Dia novo. Ele cabe do jeito que vier.'],
    },
    tarde: {
        neutro: ['Boa tarde.', 'Metade do dia. O painel esta aqui.'],
        coach: ['Boa tarde. Ainda da tempo de uma.', 'Metade do dia: uma entrega ainda cabe.'],
        reflexivo: ['Boa tarde. O dia foi como voce imaginou?', 'Metade do dia. O que mudou desde de manha?'],
        calmo: ['Boa tarde. O que veio ate aqui ja conta.', 'Metade do dia, e tudo bem se foi devagar.'],
    },
    noite: {
        neutro: ['Boa noite.', 'Fim do dia. O painel esta aqui.'],
        coach: ['Boa noite. Registre o que fez antes de fechar.', 'Fim do dia: deixe o registro pronto.'],
        reflexivo: ['Boa noite. O que hoje ensinou?', 'Fim do dia. Vale olhar antes de virar a pagina.'],
        calmo: ['Boa noite. Pode encerrar.', 'Fim do dia. Nao precisa fechar tudo.'],
    },
};

/** Faixa horaria da saudacao. Noite comeca cedo de proposito: o painel da noite e de fechamento. */
export const resolveGreetingPeriod = (hour: number): OracleGreetingPeriod => {
    if (hour < 12) return 'manha';
    if (hour < 18) return 'tarde';
    return 'noite';
};

/**
 * A saudacao do momento, ou null quando o Oraculo nao deve cumprimentar.
 *
 * Silencioso devolve null. Os outros dois niveis cumprimentam: quem escolheu
 * silencioso pediu para o Oraculo calar, os demais pediram que ele fale.
 */
export const pickOracleGreeting = (
    presenceLevel: number,
    tone: OracleSpeechTone,
    now: Date = new Date(),
    random: () => number = Math.random,
): string | null => {
    if (presenceLevel <= 0) return null;

    const period = resolveGreetingPeriod(now.getHours());
    const options = ORACLE_GREETINGS[period][tone] || ORACLE_GREETINGS[period][ORACLE_FREE_TONE];
    if (!options || options.length === 0) return null;

    return options[Math.floor(random() * options.length)] || options[0];
};

/**
 * O leque da fala espontanea — a quarta voz do Oraculo.
 *
 * As outras tres respondem a alguma coisa: a REACAO responde ao que voce acabou
 * de fazer, o CARD responde a um pedido seu, a MISSAO responde a um aceite.
 * Esta e a unica que sai do nada, ao abrir o painel, e por isso e a que mais
 * cansa se repetir. So saudacao viraria papel de parede em uma semana.
 *
 * Quatro tipos, misturados:
 *  - saudacao: cumprimento por hora do dia, no tom da pessoa.
 *  - dica: como o jogo funciona. Fato sobre o app, entao NAO varia por tom —
 *    escrever a mesma regra de quatro jeitos so multiplica texto sem informar
 *    mais. O tom colore opiniao, nao mecanica.
 *  - sugestao: um empurrao pequeno para agora, esse sim no tom.
 *  - curiosidade: como o mundo e as temporadas funcionam. Fato tambem, e sem
 *    nome de temporada, para nao apodrecer na virada.
 *
 * Nenhuma carrega numero nem cobranca: quem quer medida tem a leitura do dia
 * logo abaixo.
 */
export type OracleOpeningKind = 'saudacao' | 'dica' | 'sugestao' | 'curiosidade';

/** Como o jogo funciona. Fato, nao opiniao: sem variacao por tom. */
export const ORACLE_GAME_TIPS: readonly string[] = [
    'Arena é uma área da sua vida. Ação é o que você faz dentro dela.',
    'Ciclo é o período que você fecha e mede. O relatório nasce dele.',
    'Marco é ação que acontece uma vez. Recorrente é a que se repete.',
    'O XP de uma ação vem do tempo dela: meia hora vale cerca de 30.',
    'Concluir tudo de uma arena a fecha e ela para de pedir sua atenção.',
    'Você pode arquivar uma arena sem apagar nada do que já registrou.',
    'O baú guarda cosmético. Nada dentro dele muda regra de jogo.',
    'A pontuação do ciclo compara você com você, não com outra pessoa.',
    'Dia sem registro não apaga o ciclo: ele só entra como dia sem entrega.',
    'Dá para reordenar arenas por prioridade e o painel respeita a ordem.',
    'A insígnia marca o que você fez. Ela não expira quando a temporada vira.',
    'Você escolhe quanto o Oráculo fala no ajuste de presença.',
    'Ação concluída fora do horário marcado conta igual: o registro é o que vale.',
    'Arena sem ação nenhuma não entra em missão nem em relatório.',
    'O checklist do dia e separado das ações: ele não pontua, só organiza.',
    'Fechar o painel do dia sela o que foi feito e deposita o XP no ciclo.',
    'Você pode mover uma ação de arena sem perder o histórico dela.',
    'Campanha é um conjunto de arenas que abre por etapas conforme você avança.',
    'Ouro compra cosmético e assinatura. Ele não compra progresso.',
    'Relatório antigo continua acessível depois que o ciclo fecha.',
];

/**
 * Curiosidade sobre o mundo e as temporadas.
 *
 * Sem citar temporada por nome de proposito: a ativa muda a cada poucos meses e
 * frase com nome proprio apodrece sozinha na virada. Estas continuam verdadeiras
 * em qualquer temporada, entao ninguem precisa lembrar de revisa-las.
 */
export const ORACLE_LORE: readonly string[] = [
    'Cada temporada tem coleção própria, e o que você ganhou nela fica com você.',
    'Item de temporada não volta: quem estava presente e quem carrega a marca.',
    'A insígnia conta onde você estava. A borda e o banner contam o mesmo em silêncio.',
    'Temporada troca a coleção, nunca o seu histórico.',
    'As jornadas da temporada são poucas de propósito, para caberem em meses.',
    'Fechar todas as jornadas de uma temporada rende o selo dela.',
    'A patente cresce com o que você faz, não com o tempo que passa.',
    'O legado guarda o que sobreviveu aos seus ciclos, não o que você planejou.',
    'Temporada zero abriu o mundo. As seguintes constroem sobre ela.',
];

/** Um empurrao pequeno para agora. Este varia por tom. */
export const ORACLE_SUGGESTIONS: Record<OracleSpeechTone, readonly string[]> = {
    neutro: [
        'Se for abrir uma coisa só hoje, abra a que está mais perto de fechar.',
        'Registrar o que já fez conta tanto quanto fazer o próximo.',
        'Uma ação pequena hoje mantém o ciclo vivo.',
    ],
    coach: [
        'Escolha a menor da lista e tire ela do caminho.',
        'Se travou, corte a tarefa pela metade e faça a primeira metade.',
        'Comece pela arena que você vem evitando. Ela custa mais parada.',
    ],
    reflexivo: [
        'O que você evita registrar costuma dizer mais que o que você registra.',
        'Se hoje só coubesse uma coisa, qual seria?',
        'Vale perguntar se a carga que você planejou era mesmo para você.',
    ],
    calmo: [
        'Não precisa recuperar nada hoje. Comece de onde está.',
        'Um dia menor continua sendo um dia.',
        'Se hoje não for de avançar, que seja de não desistir.',
    ],
};

/**
 * A fala de abertura, sorteando entre os tres tipos.
 *
 * `pickOracleGreeting` continua existindo e so cumprimenta; esta e a porta larga,
 * usada pelo painel. Segue valendo a trava de presenca 3.
 */
export const pickOracleOpeningLine = (
    presenceLevel: number,
    tone: OracleSpeechTone,
    now: Date = new Date(),
    random: () => number = Math.random,
): { text: string; kind: OracleOpeningKind } | null => {
    // Quem decide SE fala e a politica de presenca (constants/oraclePresencePolicy).
    // Aqui so sai fora quando a presenca cala de vez, para esta funcao continuar
    // servindo a quem ja resolveu a frequencia antes de chamar.
    if (presenceLevel <= 0) return null;

    const safeTone = tone in ORACLE_TONE_LABELS ? tone : ORACLE_FREE_TONE;
    const kinds: OracleOpeningKind[] = ['saudacao', 'dica', 'sugestao', 'curiosidade'];
    const kind = kinds[Math.floor(random() * kinds.length)] || 'saudacao';

    if (kind === 'dica') {
        const text = ORACLE_GAME_TIPS[Math.floor(random() * ORACLE_GAME_TIPS.length)]
            || ORACLE_GAME_TIPS[0];
        return { text, kind };
    }

    if (kind === 'curiosidade') {
        const text = ORACLE_LORE[Math.floor(random() * ORACLE_LORE.length)] || ORACLE_LORE[0];
        return { text, kind };
    }

    if (kind === 'sugestao') {
        const pool = ORACLE_SUGGESTIONS[safeTone] || ORACLE_SUGGESTIONS[ORACLE_FREE_TONE];
        return { text: pool[Math.floor(random() * pool.length)] || pool[0], kind };
    }

    const greeting = pickOracleGreeting(presenceLevel, safeTone, now, random);
    return greeting ? { text: greeting, kind: 'saudacao' } : null;
};
