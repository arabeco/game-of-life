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
    | 'milestone_completed';

type ToneVariants = Record<OracleSpeechTone, string[]>;

export const ORACLE_SPEECH_LIBRARY: Record<OracleSpeechEvent, ToneVariants> = {
    /** Campanha inteira fechada. Marcadores: {campaign} */
    campaign_completed: {
        neutro: [
            'Campanha "{campaign}" fechada. Boa. Agora deixa esse marco assentar antes de abrir outra frente grande.',
            '"{campaign}" concluiu. Isso ja e um bloco inteiro de vida organizado, nao so uma tarefa.',
        ],
        calmo: [
            '"{campaign}" fechou. Nao precisa abrir nada agora. Deixa assentar.',
            'Campanha "{campaign}" concluida. E bastante coisa. Descansa antes da proxima.',
        ],
        coach: [
            'Campanha "{campaign}" fechada. Dica: escreve em uma linha o que fez ela andar, antes de esquecer.',
            '"{campaign}" concluida. Sugestao: espera uma semana antes de abrir outra desse tamanho.',
        ],
        reflexivo: [
            '"{campaign}" fechou. O que dentro dela voce faria de novo?',
            'Campanha "{campaign}" concluida. Foi o plano que funcionou, ou a insistencia?',
        ],
    },

    /** Arena concluida. Marcadores: {arena} */
    arena_completed: {
        neutro: [
            'Arena "{arena}" concluida. Muito bem. Essa frente ganhou forma real.',
            '"{arena}" fechou. Boa. Agora vale registrar o que funcionou antes de empilhar outra coisa.',
        ],
        calmo: [
            '"{arena}" fechou. Sem pressa de comecar a proxima.',
            'Arena "{arena}" concluida. Fica um momento com isso antes de seguir.',
        ],
        coach: [
            'Arena "{arena}" concluida. Dica: anota as duas acoes que mais renderam.',
            '"{arena}" fechou. Sugestao: nao abre outra hoje - deixa o proximo ciclo escolher.',
        ],
        reflexivo: [
            '"{arena}" fechou. O que aqui vale levar para a proxima?',
            'Arena "{arena}" concluida. Foi ela que mudou, ou voce?',
        ],
    },

    /** Oito ou mais acoes reais no dia. Marcadores: {count} */
    daily_reps_high: {
        neutro: [
            '{count} acoes reais hoje. Muito bem; agora protege o fechamento.',
            '{count} acoes reais no dia. Bom ritmo. Agora nao precisa provar mais nada, precisa fechar limpo.',
        ],
        calmo: [
            '{count} acoes hoje. Ja e bastante. Pode parar sem culpa.',
            '{count} entregas reais. O dia esta feito. Fecha com calma.',
        ],
        coach: [
            '{count} acoes hoje. Sugestao: para de abrir e fecha o que ficou em pe.',
            '{count} entregas. Dica: dia assim cobra amanha. Planeja um amanha mais leve.',
        ],
        reflexivo: [
            '{count} acoes hoje. Isso foi ritmo ou foi fuga de outra coisa?',
            '{count} entregas. O que ficou de fora enquanto voce fazia tudo isso?',
        ],
    },

    /** Cinco a sete acoes reais no dia. Marcadores: {count} */
    daily_reps_mid: {
        neutro: [
            '{count} acoes reais hoje. O dia ganhou corpo.',
            '{count} entregas reais. Boa. Agora escolhe a proxima sem inflar o dia.',
        ],
        calmo: [
            '{count} acoes hoje. O dia ja tem peso proprio.',
            '{count} entregas. Da para seguir devagar a partir daqui.',
        ],
        coach: [
            '{count} acoes hoje. Sugestao: escolhe uma so para fechar e para por ai.',
            '{count} entregas. Dica: a proxima rende mais se for a que voce vem adiando.',
        ],
        reflexivo: [
            '{count} acoes hoje. A proxima e necessidade ou impulso?',
            '{count} entregas. O dia ja esta bom - o que voce ainda quer provar?',
        ],
    },

    /** Tres acoes reais no dia. Marcadores: {count} */
    daily_reps_low: {
        neutro: [
            '{count} acoes reais hoje. Muito bem.',
            'Tres acoes reais ja mudam o dia. Continua com calma.',
        ],
        calmo: [
            '{count} acoes hoje. Ja e o suficiente para o dia contar.',
            'Tres entregas reais mudam o dia. Sem pressa para a quarta.',
        ],
        coach: [
            '{count} acoes hoje. Dica: e aqui que o dia destrava. Aproveita o embalo numa quarta.',
            'Tres entregas reais. Sugestao: fecha o dia agora e ganha o de amanha inteiro.',
        ],
        reflexivo: [
            '{count} acoes hoje. O que destravou depois da primeira?',
            'Tres entregas ja mudam o dia. Por que essas tres e nao outras?',
        ],
    },

    /** Meta da acao fechada no ciclo. Marcadores: {action} {count} {target} */
    cycle_goal_met: {
        neutro: [
            '{action}: {count}/{target} no ciclo. Fechou a meta dessa acao.',
            '{action} completou o combinado do ciclo: {count}/{target}. Boa.',
        ],
        calmo: [
            '{action} fechou o ciclo em {count}/{target}. Pode soltar essa.',
            '{action}: {count}/{target}. Combinado cumprido, sem precisar de mais.',
        ],
        coach: [
            '{action} fechou em {count}/{target}. Sugestao: nao aumenta a meta no meio - sobe no proximo ciclo.',
            '{action}: {count}/{target}. Dica: usa o tempo dessa acao na que esta atrasada.',
        ],
        reflexivo: [
            '{action} fechou em {count}/{target}. O alvo estava no tamanho certo?',
            '{action}: {count}/{target}. Voce repetiria essa meta no proximo ciclo?',
        ],
    },

    /** Falta uma para fechar. Marcadores: {action} {count} {target} */
    cycle_goal_last_one: {
        neutro: [
            '{action}: {count}/{target} no ciclo. Falta so 1 para fechar essa meta.',
            'Boa. {action} esta quase la: {count}/{target}.',
        ],
        calmo: [
            '{action}: {count}/{target}. Falta uma, e ela pode esperar.',
            '{action} esta a uma entrega do fim. Sem correria.',
        ],
        coach: [
            '{action}: {count}/{target}. Dica: agenda a ultima para amanha cedo, antes do ciclo apertar.',
            'Falta uma em {action} ({count}/{target}). Sugestao: fecha hoje e tira da cabeca.',
        ],
        reflexivo: [
            '{action}: {count}/{target}. O que segurou a ultima ate aqui?',
            'Falta uma em {action}. Ela e dificil ou so ficou para depois?',
        ],
    },

    /** Primeira entrega da acao no ciclo. Marcadores: {action} {target} {remaining} */
    cycle_goal_first: {
        neutro: [
            '{action} entrou no ciclo: 1/{target}. Agora e so manter sem inflar.',
            'Primeira de {action} registrada neste ciclo. Faltam {remaining}.',
        ],
        calmo: [
            '{action} comecou: 1/{target}. A primeira costuma ser a mais cara.',
            'Primeira de {action} no ciclo. Faltam {remaining}, uma de cada vez.',
        ],
        coach: [
            '{action} comecou: 1/{target}. Dica: marca as {remaining} restantes agora, enquanto esta quente.',
            'Primeira de {action} feita. Sugestao: repete no mesmo horario - o habito pega mais rapido.',
        ],
        reflexivo: [
            '{action} comecou: 1/{target}. O que destravou hoje e nao antes?',
            'Primeira de {action} no ciclo. As {remaining} restantes cabem mesmo?',
        ],
    },

    /** Progresso no meio do caminho. Marcadores: {action} {count} {target} {remaining} */
    cycle_goal_progress: {
        neutro: [
            '{action}: {count}/{target} no ciclo. Faltam {remaining}.',
            'Boa. {action} ja tem {count} entregas no ciclo; restam {remaining}.',
        ],
        calmo: [
            '{action}: {count}/{target}. Restam {remaining}, e ha tempo.',
            '{action} segue andando: {count} feitas, {remaining} pela frente.',
        ],
        coach: [
            '{action}: {count}/{target}. Dica: divide as {remaining} pelos dias restantes e para de improvisar.',
            '{action} em {count}/{target}. Sugestao: se {remaining} nao couber, corta a meta agora e nao no fim.',
        ],
        reflexivo: [
            '{action}: {count}/{target}. As {remaining} restantes seguem fazendo sentido?',
            '{action} tem {count} entregas. O que mudou desde a primeira?',
        ],
    },

    /** Marco concluido. Marcadores: {action} */
    milestone_completed: {
        neutro: [
            'Marco "{action}" concluido. Isso muda o desenho do ciclo.',
            '"{action}" foi concluida. Boa. Esse era um ponto de passagem, nao so mais uma acao.',
        ],
        calmo: [
            'Marco "{action}" concluido. Era um ponto de virada. Reconhece isso.',
            '"{action}" fechou. Deixa esse marco assentar antes de seguir.',
        ],
        coach: [
            'Marco "{action}" concluido. Sugestao: revisa o ciclo - marco fechado costuma liberar espaco.',
            '"{action}" fechou. Dica: se ele destravou outra coisa, agenda essa outra hoje.',
        ],
        reflexivo: [
            'Marco "{action}" concluido. O que ele destrava agora?',
            '"{action}" fechou. Era mesmo um marco, ou virou um no caminho?',
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
): string => {
    const entry = ORACLE_SPEECH_LIBRARY[event];
    const variants = (entry?.[tone]?.length ? entry[tone] : entry?.neutro) || [];
    if (variants.length === 0) return '';
    const chosen = variants[Math.floor(Math.random() * variants.length)] || variants[0];
    return fillOracleSpeech(chosen, vars);
};

/**
 * A saudacao de abertura.
 *
 * O app abre no painel diario, e ate agora ele abria mudo: o Oraculo so falava
 * reagindo a algo ja feito. Isto e o cumprimento — uma linha, sem botao, sem
 * card, sem nada para dispensar. Some sozinho na proxima abertura.
 *
 * So existe na presenca 3 ("Presente"), que e onde a pessoa pediu para ele
 * aparecer mais. Em silencioso e equilibrado o painel continua abrindo calado,
 * porque cumprimento que a pessoa nao pediu vira ruido.
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
 * `presenceLevel` abaixo de 3 devolve null: e a diferenca entre "aparece mais"
 * e "aparece sempre", que e o que a pessoa escolheu no ajuste de presenca.
 */
export const pickOracleGreeting = (
    presenceLevel: number,
    tone: OracleSpeechTone,
    now: Date = new Date(),
    random: () => number = Math.random,
): string | null => {
    if (presenceLevel < 3) return null;

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
    'Arena e uma area da sua vida. Acao e o que voce faz dentro dela.',
    'Ciclo e o periodo que voce fecha e mede. O relatorio nasce dele.',
    'Marco e acao que acontece uma vez. Recorrente e a que se repete.',
    'O XP de uma acao vem do tempo dela: meia hora vale cerca de 30.',
    'Concluir tudo de uma arena a fecha e ela para de pedir sua atencao.',
    'Voce pode arquivar uma arena sem apagar nada do que ja registrou.',
    'O baú guarda cosmetico. Nada dentro dele muda regra de jogo.',
    'A pontuacao do ciclo compara voce com voce, nao com outra pessoa.',
    'Dia sem registro nao apaga o ciclo: ele so entra como dia sem entrega.',
    'Da para reordenar arenas por prioridade e o painel respeita a ordem.',
    'A insignia marca o que voce fez. Ela nao expira quando a temporada vira.',
    'Voce escolhe quanto o Oraculo fala no ajuste de presenca.',
    'Acao concluida fora do horario marcado conta igual: o registro e o que vale.',
    'Arena sem acao nenhuma nao entra em missao nem em relatorio.',
    'O checklist do dia e separado das acoes: ele nao pontua, so organiza.',
    'Fechar o painel do dia sela o que foi feito e deposita o XP no ciclo.',
    'Voce pode mover uma acao de arena sem perder o historico dela.',
    'Campanha e um conjunto de arenas que abre por etapas conforme voce avanca.',
    'Ouro compra cosmetico e assinatura. Ele nao compra progresso.',
    'Relatorio antigo continua acessivel depois que o ciclo fecha.',
];

/**
 * Curiosidade sobre o mundo e as temporadas.
 *
 * Sem citar temporada por nome de proposito: a ativa muda a cada poucos meses e
 * frase com nome proprio apodrece sozinha na virada. Estas continuam verdadeiras
 * em qualquer temporada, entao ninguem precisa lembrar de revisa-las.
 */
export const ORACLE_LORE: readonly string[] = [
    'Cada temporada tem colecao propria, e o que voce ganhou nela fica com voce.',
    'Item de temporada nao volta: quem estava presente e quem carrega a marca.',
    'A insignia conta onde voce estava. A borda e o banner contam o mesmo em silencio.',
    'Temporada troca a colecao, nunca o seu historico.',
    'As jornadas da temporada sao poucas de proposito, para caberem em meses.',
    'Fechar todas as jornadas de uma temporada rende o selo dela.',
    'A patente cresce com o que voce faz, nao com o tempo que passa.',
    'O legado guarda o que sobreviveu aos seus ciclos, nao o que voce planejou.',
    'Temporada zero abriu o mundo. As seguintes constroem sobre ela.',
];

/** Um empurrao pequeno para agora. Este varia por tom. */
export const ORACLE_SUGGESTIONS: Record<OracleSpeechTone, readonly string[]> = {
    neutro: [
        'Se for abrir uma coisa so hoje, abra a que esta mais perto de fechar.',
        'Registrar o que ja fez conta tanto quanto fazer o proximo.',
        'Uma acao pequena hoje mantem o ciclo vivo.',
    ],
    coach: [
        'Escolha a menor da lista e tire ela do caminho.',
        'Se travou, corte a tarefa pela metade e faca a primeira metade.',
        'Comece pela arena que voce vem evitando. Ela custa mais parada.',
    ],
    reflexivo: [
        'O que voce evita registrar costuma dizer mais que o que voce registra.',
        'Se hoje so coubesse uma coisa, qual seria?',
        'Vale perguntar se a carga que voce planejou era mesmo para voce.',
    ],
    calmo: [
        'Nao precisa recuperar nada hoje. Comece de onde esta.',
        'Um dia menor continua sendo um dia.',
        'Se hoje nao for de avancar, que seja de nao desistir.',
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
    if (presenceLevel < 3) return null;

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
