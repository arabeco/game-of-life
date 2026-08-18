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
