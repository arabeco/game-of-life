/**
 * A CAIXA-PRETA DO APP.
 *
 * Quando o Glyph quebra no celular de alguem, hoje nao sobra registro em lugar
 * nenhum: a tela fica branca ou o botao para de responder, a pessoa fecha o app,
 * e ninguem fica sabendo. O Android vitals, que a Play ja coleta de graca, so
 * enxerga queda de PROCESSO — e o Glyph e Capacitor, entao quase todo defeito
 * daqui e um erro de JavaScript, que nao derruba processo nenhum. E exatamente
 * essa faixa que nao tinha ninguem olhando.
 *
 * NAO CUSTA EGRESS NEM BANCO.
 *
 * O relato vai do aparelho da pessoa direto para o Sentry. Nao passa pelo
 * Supabase, nao vira linha em tabela, nao conta como egress do projeto. O unico
 * custo que este arquivo cobra e alguns KB no pacote do app — e a Play distribui
 * o pacote, como ja faz com a arte.
 *
 * O QUE FICA DESLIGADO, DE PROPOSITO.
 *
 * `replaysSessionSampleRate` e `tracesSampleRate` ficam em zero. Session Replay
 * grava a tela da pessoa e e de longe a coisa mais cara e mais invasiva do
 * Sentry; tracing manda um evento por navegacao, que estoura a cota gratuita
 * sozinho. Nenhum dos dois ajuda a achar um bug de logica, que e o que se quer
 * aqui. O que sobe e erro, e so erro.
 *
 * `sendDefaultPii` fica falso, e nenhum id de usuario e anexado. Da para achar o
 * defeito sabendo a versao, o aparelho e a pilha — nao e preciso saber QUEM.
 * Isso mantem a declaracao do Data Safety curta e honesta: dados de diagnostico,
 * sem identificacao.
 *
 * SEM DSN, NEM O CODIGO E BAIXADO.
 *
 * A chave vem de `VITE_SENTRY_DSN`, e o SDK entra por `import()` — nao por
 * `import` no topo. A diferenca nao e estilo: com o import estatico, os 87 KB do
 * Sentry viajam no pacote de todo mundo mesmo com a chave vazia, fazendo nada.
 * Sendo dinamico, ele vira um pedaco separado que so e buscado quando ha chave.
 *
 * O preco disso e uma janela de alguns milissegundos entre o app comecar e os
 * apanhadores globais existirem. Um erro exatamente ali se perde — e e menos
 * grave do que parece, porque erro de arranque real costuma repetir em toda
 * abertura, entao a segunda pega.
 *
 * Quem clonar o projeto tambem nao dispara evento para uma conta que nao e dele.
 */

const DSN = import.meta.env?.VITE_SENTRY_DSN as string | undefined;
const VERSAO = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';

/**
 * Ruido que nao e defeito do app, e que gastaria cota todo dia.
 *
 * Os dois primeiros sao o mesmo aviso do navegador quando um scroll suave e
 * interrompido por outro — acontece o tempo todo e nunca significou nada. O
 * terceiro e queda de rede, que o app ja trata mostrando o estado offline.
 */
const RUIDO_CONHECIDO = [
    'ResizeObserver loop',
    'Non-Error promise rejection captured',
    'Failed to fetch',
    'NetworkError',
    'Load failed',
];

/** O modulo, depois de carregado. Guardado para o `registrarErro` reusar. */
let sentry: typeof import('@sentry/browser') | null = null;

export const iniciarRelatorioDeErros = async (): Promise<boolean> => {
    if (!DSN) return false;

    const Sentry = await import('@sentry/browser');
    sentry = Sentry;

    Sentry.init({
        dsn: DSN,
        release: `glyph@${VERSAO}`,
        environment: import.meta.env?.DEV ? 'dev' : 'producao',

        // So erro. Ver a nota do cabecalho.
        tracesSampleRate: 0,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        sendDefaultPii: false,

        ignoreErrors: RUIDO_CONHECIDO,

        /*
         * SO O QUE E PRECISO, E NAO O PACOTE INTEIRO.
         *
         * O `init` sem lista carrega todas as integracoes padrao — sessao,
         * contexto de http, erros encadeados, instrumentacao de fetch e de
         * historico. Com elas, o pedaco do Sentry passava de 160 KB comprimidos
         * num app cujo nucleo tem 120.
         *
         * O que sobra e o que responde a pergunta "o que quebrou": o apanhador
         * global de erro e de promessa rejeitada, a pilha, a migalha de
         * navegacao que diz onde a pessoa estava, e o dedupe, que impede o mesmo
         * erro em laco de queimar a cota do mes numa tarde.
         */
        defaultIntegrations: false,
        integrations: [
            Sentry.globalHandlersIntegration({ onerror: true, onunhandledrejection: true }),
            Sentry.breadcrumbsIntegration({ console: false, dom: false, fetch: false, history: true, xhr: false }),
            Sentry.dedupeIntegration(),
            Sentry.functionToStringIntegration(),
        ],

        /*
         * O ultimo filtro antes de sair do aparelho.
         *
         * Em dev nao se manda nada: quebrar enquanto se programa e o trabalho,
         * nao um incidente, e um `npm run dev` de tarde queimaria a cota do mes.
         */
        beforeSend(evento) {
            if (import.meta.env?.DEV) return null;
            return evento;
        },
    });

    return true;
};

/**
 * Um erro que o app pegou e tratou, mas que ainda quer ser visto.
 *
 * Erro capturado num try/catch nao chega ao Sentry sozinho — e justamente o
 * caso em que o app continua de pe e a pessoa nunca reclama, entao ele sumiria
 * para sempre. Usar onde o catch hoje so faz console.error e segue a vida.
 */
export const registrarErro = (erro: unknown, onde: string): void => {
    // Sem chave, ou antes de o modulo terminar de carregar, nao ha para onde
    // mandar. Perder um relato e melhor que segurar o app esperando a rede.
    if (!sentry) return;
    sentry.captureException(erro, { tags: { onde } });
};
