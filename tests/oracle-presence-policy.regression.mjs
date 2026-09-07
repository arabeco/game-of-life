import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import {
  ORACLE_PRESENCE,
  ORACLE_PRESENCE_ORDER,
  ORACLE_PRESENCE_RULES,
  getOraclePresenceRules,
  normalizeOraclePresence,
  allowsOracleReaction,
} from '../constants/oraclePresencePolicy.ts';

/**
 * A tabela do que o Oraculo faz em cada nivel.
 *
 * Estas regras viviam em tres lugares que nao se conheciam — o modal de ajustes,
 * o cron da edge function e o portao de push — cada um com o proprio numero
 * solto. O resultado era ninguem, nem quem escreveu, conseguir dizer o que cada
 * nivel fazia. Aqui a tabela e uma so e este teste e o contrato dela.
 *
 * A separacao que importa: PRESENCA decide O QUE ele fala; o interruptor de
 * avisos decide ONDE aquilo chega. Desligar aviso nunca cala o Oraculo.
 */

const silencioso = ORACLE_PRESENCE_RULES[ORACLE_PRESENCE.SILENCIOSO];
const equilibrado = ORACLE_PRESENCE_RULES[ORACLE_PRESENCE.EQUILIBRADO];
const presente = ORACLE_PRESENCE_RULES[ORACLE_PRESENCE.PRESENTE];

// --- silencioso: so o obrigatorio ----------------------------------------
assert.equal(silencioso.dailyCard, false, 'silencioso nao recebe card');
assert.equal(silencioso.openingLine, 'nunca', 'silencioso nao cumprimenta');
assert.equal(silencioso.reactions, 'nenhuma', 'silencioso nao comenta o que voce faz');

// --- equilibrado: card e uma fala por dia, sem comentar cada acao ---------
assert.equal(equilibrado.dailyCard, true, 'equilibrado recebe o card do dia');
assert.equal(equilibrado.openingLine, 'diaria', 'equilibrado fala uma vez por dia');
assert.equal(equilibrado.reactions, 'marcos', 'equilibrado celebra o que e grande, nao o cotidiano');

// --- presente: fala a cada abertura e reage -------------------------------
assert.equal(presente.dailyCard, true, 'presente recebe o card do dia');
assert.equal(presente.openingLine, 'sempre', 'presente fala a cada abertura');
assert.equal(presente.reactions, 'todas', 'o presente acompanha tambem o cotidiano');

// --- a escada sobe, nunca desce ------------------------------------------
const peso = { nunca: 0, diaria: 1, sempre: 2 };
const ordem = ORACLE_PRESENCE_ORDER.map((value) => ORACLE_PRESENCE_RULES[value]);
for (let i = 1; i < ordem.length; i += 1) {
  assert.ok(
    peso[ordem[i].openingLine] >= peso[ordem[i - 1].openingLine],
    'um nivel mais alto nao pode falar menos que o anterior',
  );
  assert.ok(
    Number(ordem[i].dailyCard) >= Number(ordem[i - 1].dailyCard),
    'um nivel mais alto nao pode receber menos card',
  );
  const pesoReacao = { nenhuma: 0, marcos: 1, todas: 2 };
  assert.ok(
    pesoReacao[ordem[i].reactions] >= pesoReacao[ordem[i - 1].reactions],
    'um nivel mais alto nao pode reagir menos',
  );
}

// --- valores gravados fora da tabela nao quebram --------------------------
// A lacuna do 1 DEIXOU de ser lacuna: ele virou o Discreto — nao analisa, mas
// comemora. Perfil antigo com 1 gravado cai nesse degrau, e recebe MENOS fala do
// que recebia (antes era aproximado para Equilibrado). Aproximar para cima seria
// dar voz a quem nao pediu.
assert.equal(normalizeOraclePresence(1), ORACLE_PRESENCE.DISCRETO, '1 e o Discreto, nao aproxima para cima');
assert.equal(getOraclePresenceRules(1).label, 'Discreto');
assert.equal(getOraclePresenceRules(1).openingLine, 'nunca', 'Discreto nao comenta o dia');
assert.equal(getOraclePresenceRules(1).dailyCard, false, 'Discreto nao recebe card');
assert.equal(getOraclePresenceRules(1).reactions, 'marcos', 'Discreto comemora o que e grande');
// Cada degrau acende exatamente UMA coisa a mais que o anterior.
assert.equal(getOraclePresenceRules(0).reactions, 'nenhuma');
assert.equal(getOraclePresenceRules(2).openingLine, 'diaria', 'o Equilibrado acrescenta a fala de abertura');
assert.equal(normalizeOraclePresence(4), ORACLE_PRESENCE.PRESENTE, 'acima do topo vira topo');
assert.equal(normalizeOraclePresence(-2), ORACLE_PRESENCE.SILENCIOSO);
assert.equal(normalizeOraclePresence(null), ORACLE_PRESENCE.SILENCIOSO);
assert.equal(normalizeOraclePresence('3'), ORACLE_PRESENCE.PRESENTE, 'texto do banco tambem resolve');
assert.equal(getOraclePresenceRules(2).label, 'Equilibrado');

// --- todo nivel tem rotulo e explicacao ----------------------------------
for (const regra of ordem) {
  assert.ok(regra.label && regra.label.length <= 20, `rotulo ruim: ${regra.label}`);
  assert.ok(regra.caption && regra.caption.length <= 120, `legenda ruim: ${regra.caption}`);
}

// --- a reacao pesa: marco passa antes do cotidiano ----------------------
// Fechar arena acontece de vez em quando e merece palavra ja no Equilibrado;
// "voce fez 5 acoes hoje" dispara quase todo dia e so o Presente recebe.
assert.equal(allowsOracleReaction(silencioso, 'marco'), false);
assert.equal(allowsOracleReaction(silencioso, 'rotina'), false);
assert.equal(allowsOracleReaction(equilibrado, 'marco'), true, 'equilibrado celebra o que e grande');
assert.equal(allowsOracleReaction(equilibrado, 'rotina'), false, 'equilibrado nao comenta o cotidiano');
assert.equal(allowsOracleReaction(presente, 'marco'), true);
assert.equal(allowsOracleReaction(presente, 'rotina'), true);

// --- push nao depende mais da presenca -----------------------------------
// O portao do servidor exigia presenca 3: quem estava no Equilibrado recebia o
// card e nunca o aviso. Quem decide o aviso e o interruptor, nao o nivel.
const webPush = readFileSync(new URL('../supabase/functions/web-push/index.ts', import.meta.url), 'utf8');
const portao = webPush.slice(
  webPush.indexOf('const shouldPushOracleMessage'),
  webPush.indexOf('const buildOracleMessagePayload'),
);
assert.ok(portao.length > 0, 'o portao de push deve ser identificavel');
assert.doesNotMatch(
  portao,
  /presenceLevel\s*<\s*3/,
  'o push nao pode voltar a exigir presenca 3',
);
assert.match(portao, /presenceLevel\s*<=\s*0/, 'silencioso continua sem push');

// Executa o filtro local real para o card neutro: antes desta regressao, o
// servidor aceitava Equilibrado enquanto o fallback local o recusava.
const gameContext = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
const localFilterStart = gameContext.indexOf('const shouldPushOracleFeedMessage =');
const localFilterEnd = gameContext.indexOf('export interface GameContextType', localFilterStart);
assert.ok(localFilterStart >= 0 && localFilterEnd > localFilterStart);
const localFilterCode = ts.transpile(gameContext.slice(localFilterStart, localFilterEnd), {
  target: ts.ScriptTarget.ES2022,
});
const acceptsLocalCard = new Function('getOracleModeConfig',
  `${localFilterCode}; return shouldPushOracleFeedMessage;`,
)(() => ({ pushProfile: 'equilibrado' }));
const automaticCard = {
  mode: 'neutro',
  contextSnapshot: { presentation: 'info_card', triggerType: 'automatic' },
};
for (const presence of [0, 1, 2, 3]) {
  assert.equal(acceptsLocalCard(automaticCard, presence), presence > 0,
    `card automatico no fallback local, presenca ${presence}`);
  assert.equal(acceptsLocalCard({ ...automaticCard,
    contextSnapshot: { ...automaticCard.contextSnapshot, triggerType: 'manual' },
  }, presence), false, 'pedido manual nunca vira aviso local');
}
assert.equal(acceptsLocalCard({ ...automaticCard,
  contextSnapshot: { presentation: 'ambient_pulse', triggerType: 'automatic' },
}, 2), false, 'a correcao de presenca nao libera outros formatos no modo neutro');

// --- o painel respeita a frequencia --------------------------------------
const sitrep = readFileSync(new URL('../components/DailyPanelContent.tsx', import.meta.url), 'utf8');
assert.match(sitrep, /getOraclePresenceRules/, 'o painel le a politica, nao um numero solto');
assert.match(sitrep, /hasSpokenOpeningLineToday/, 'o nivel diario precisa lembrar se ja falou hoje');

// --- a reacao passa por um portao so -------------------------------------
const taskDomain = readFileSync(new URL('../contexts/gameDomains/taskDomain.ts', import.meta.url), 'utf8');
assert.match(taskDomain, /oracleReactions/, 'a reacao precisa ser controlavel');
assert.match(taskDomain, /allowsOracleReaction/, 'o portao da reacao fica num lugar so');
// Fechar arena/campanha e marco sao os dois pontos que valem no Equilibrado.
assert.equal(
  (taskDomain.match(/\}, 'marco'\);/g) || []).length,
  2,
  'exatamente dois pontos de reacao contam como marco',
);


// --- a fala de abertura obedece a tabela, nao um sorteio -----------------
// Ela estava presa a tres coisas que nao vinham da regra: so disparava no
// Planner, tinha cota diaria em todos os niveis, e ainda passava por
// shouldShowPlannerCoach — uma moeda de 55% no Presente. "Fala toda vez que voce
// abre" virava "45% das vezes que voce abre o Planner, uma vez por dia".
const authenticatedApp = readFileSync(new URL('../components/AuthenticatedApp.tsx', import.meta.url), 'utf8');

assert.match(authenticatedApp, /getOraclePresenceRules/, 'a fala de abertura le a politica');
assert.doesNotMatch(
  authenticatedApp,
  /shouldShowPlannerCoach\(/,
  'sorteio nao decide o que a tabela ja decidiu',
);
assert.match(
  authenticatedApp,
  /presenceRules\.openingLine === 'diaria' && currentView !== 'planner'/,
  'so o nivel diario fica preso ao Planner; o Presente fala em qualquer abertura',
);
assert.match(
  authenticatedApp,
  /presenceRules\.openingLine === 'diaria' && lastSpeechDate === today/,
  '"sempre" nao pode ter cota diaria',
);

// A marca do dia so entra depois da fala. Gravada antes do sorteio, um sorteio
// perdido queimava o dia inteiro em silencio.
const inicioFala = authenticatedApp.indexOf('decideOracleSpeech({');
const fimFala = authenticatedApp.indexOf('emitOracleSpeech({', inicioFala);
// As ancoras conferidas antes do slice: indexOf devolvendo -1 ja transformou
// uma assercao deste arquivo em nada, e o teste seguiu passando por meses sem
// verificar coisa alguma. Ancora que sumiu tem de quebrar o teste, nao esvazia-lo.
assert.ok(inicioFala > 0, 'a chamada da fala de abertura deve ser identificavel');
assert.ok(fimFala > inicioFala, 'o fim do trecho da fala deve ser identificavel');
const trechoFala = authenticatedApp.slice(inicioFala, fimFala);

const posGuarda = trechoFala.indexOf('if (!speech) return;');
const posMarca = trechoFala.indexOf('localStorage.setItem(speechKey, today)');
assert.ok(posGuarda > 0, 'a guarda de "nao ha o que falar" deve existir');
assert.ok(posMarca > 0, 'a marca do dia deve ser gravada neste trecho');
assert.ok(
  posGuarda < posMarca,
  'a marca do dia so pode ser gravada depois de haver o que falar',
);

// A memoria e lida ANTES da escolha: ela participa de decidir o que dizer, e nao
// filtra o que ele ja decidiu. Lida depois, um assunto de molho viraria silencio
// em vez de passar a vez para o proximo colocado.
assert.ok(
  authenticatedApp.indexOf('readOracleSpeechMemory()') < inicioFala,
  'a memoria entra antes da escolha, nao depois',
);

// O registro da decisao vem ANTES da guarda de silencio: silencio e uma decisao
// e precisa ser explicavel igual. Registrado depois, so as falas teriam rastro,
// e "por que ele nao falou nada?" continuaria sem resposta.
const posRegistro = trechoFala.indexOf('recordOracleDecision(decisao)');
assert.ok(posRegistro > 0, 'a decisao precisa ser registrada neste trecho');
assert.ok(posRegistro < posGuarda, 'o silencio tambem precisa ficar registrado');
assert.ok(
  trechoFala.indexOf('writeOracleSpeechMemory') > posGuarda,
  'so grava na memoria o que ele de fato falou',
);

// --- perguntar push nao pode queimar o campo antes de perguntar ----------
// onboardingPushPromptedAt era gravado ANTES da chamada. Qualquer falha no meio
// calava o aparelho para sempre — e o unico outro caminho para ligar push era o
// modal de preferencias, que desenhava vazio ate a 1.0.69.
const blocoPush = authenticatedApp.slice(
  authenticatedApp.indexOf('const permission = await getAppPushPermission();'),
  authenticatedApp.indexOf('handleCloseVanguardWelcome'),
);
assert.ok(
  blocoPush.indexOf('await requestAppPushPermission()') < blocoPush.indexOf('onboardingPushPromptedAt: new Date()'),
  'a marca de "ja perguntei" so entra depois de perguntar',
);
assert.match(blocoPush, /nextPermission !== 'unsupported'/, 'falha nao conta como resposta');

// Pergunta UMA VEZ. Quem disse nao nao e perguntado de novo: insistir a cada
// abertura, ou a cada dia, e assedio. O caminho para mudar de ideia e Ajustes, e
// o unico momento em que da para dizer isso e na propria recusa.
assert.match(
  authenticatedApp,
  /if \(userProfile\.onboardingPushPromptedAt\) return;/,
  'respondeu uma vez, nao pergunta mais',
);
assert.match(blocoPush, /Ajustes > Or[aá]culo & Alertas/, 'a recusa precisa dizer onde ligar depois');


// --- as tres coisas sao tres, e as tres sao reais ------------------------
// CARD DE INFOS nasce no cron e sempre foi real. FALA e REACAO usavam o mesmo
// cano: um evento de janela que pintava um balao por cinco segundos e
// evaporava — sem gravar, sem push, sem hora. Quem estava com o celular no
// bolso simplesmente nao recebia, embora o combinado fosse que desligar o aviso
// tirasse a fala do celular, nao que a apagasse.
const speech = readFileSync(new URL('../utils/oracleSpeech.ts', import.meta.url), 'utf8');
assert.match(speech, /record_oracle_speech/, 'a fala precisa ficar gravada, nao so piscar');
assert.match(
  speech,
  /if \(payload\.ephemeral\) return;/,
  'reacao de rotina passa e some; so marco fica no historico',
);

// O balao continua aparecendo antes da gravacao: perder o historico e ruim,
// nao mostrar nada e pior.
assert.ok(
  speech.indexOf('window.dispatchEvent') < speech.indexOf('supabase.rpc'),
  'a fala aparece na hora mesmo se a gravacao falhar',
);

// A fala nao pode roubar a cota do card, que e conteudo pago com regra propria.
const rpcFala = readFileSync(
  new URL('../supabase/migrations/20260827120000_oracle_speech_is_a_real_message.sql', import.meta.url),
  'utf8',
);
assert.match(rpcFala, /'chat',/, "a fala grava como 'chat'; a cota do card conta so 'feed'");
assert.match(rpcFala, /v_presence, 0\) <= 0/, 'silencioso nao grava fala nenhuma');

// E o push da fala passa a existir, com o interruptor decidindo — nao a presenca.
const webPush2 = readFileSync(new URL('../supabase/functions/web-push/index.ts', import.meta.url), 'utf8');
// So o CARD vira aviso no celular. A fala de abertura so existe porque a pessoa
// abriu o app, e a reacao porque ela acabou de concluir algo — nos dois casos ela
// esta com a tela na mao. Avisar sobre o que acabou de acontecer na tela em que se
// esta e o mesmo defeito do card pedido a mao, que tocava o celular de quem
// estava olhando para ele.
const portaoPush = webPush2.slice(
  webPush2.indexOf('const shouldPushOracleMessage'),
  webPush2.indexOf('const buildOracleMessagePayload'),
);
assert.match(
  portaoPush,
  /deliveryType !== "feed"[\s\S]{0,40}return false/,
  'so o card de infos vira push',
);
assert.doesNotMatch(portaoPush, /oracle_speech/, 'a fala nao pode voltar a virar aviso');

// Mas ela continua GRAVADA: desligar o aviso nunca apagou a fala.
assert.match(speech, /record_oracle_speech/, 'a fala continua no historico');

// --- o que a pessoa PEDE nao vira historico -----------------------------
// "Ler meu dia" e resposta a um toque, sobre algo que ela esta olhando — como o
// painel de missao, que aparece, recebe as escolhas e some. Gravar encheria o
// historico de linhas iguais no mesmo dia, e o historico existe para o que o
// Oraculo disse por conta propria.
const chat = readFileSync(new URL('../components/OracleChat.tsx', import.meta.url), 'utf8');
const lerMeuDia = chat.slice(
  chat.indexOf('const handleReadMyDay'),
  chat.indexOf('const handleAskMission'),
);
assert.ok(lerMeuDia.length > 0, 'o handler de ler meu dia deve ser identificavel');
// A assercao antiga exigia `ephemeral: true`, que era COMO a leitura evitava o
// historico quando ela saia em balao flutuante. Ela agora sai dentro do proprio
// chat — o balao aparecia ATRAS do painel aberto, que e o pior dos dois mundos —
// e o mecanismo mudou. O que precisa continuar valendo e a garantia, nao o
// mecanismo: a leitura pedida a mao nao pode encostar no banco.
assert.doesNotMatch(
  lerMeuDia,
  /emitOracleSpeech|record_oracle_speech|supabase/,
  'leitura sob demanda nao entra no historico: nada de gravar',
);
// E ocupa uma vaga unica: pedir de novo troca a leitura no lugar e a hora muda
// junto, em vez de empilhar a mesma coisa varias vezes na lista.
assert.match(lerMeuDia, /!== READING_FEED_ID/, 'a leitura anterior sai antes da nova entrar');

// A reacao de rotina nao pode virar push nem historico.
const taskDomain2 = readFileSync(new URL('../contexts/gameDomains/taskDomain.ts', import.meta.url), 'utf8');
assert.match(taskDomain2, /ephemeral: weight !== 'marco'/, 'so marco fica gravado');


// --- o toast confirma, o Oraculo comenta --------------------------------
// Fechar arena disparava os dois no mesmo instante, e o toast dizia "Muito bem"
// enquanto o balao elogiava de novo logo abaixo — dois elogios pelo mesmo fato.
//
// Pior que a repeticao: o toast ignora a presenca. Quem pos o Oraculo no
// Silencioso pediu para nao ser comentado, e recebia o elogio assim mesmo pela
// outra porta. Os dois podem coexistir desde que tenham papeis diferentes: o
// toast registra que a acao pegou, o Oraculo diz o que acha dela.
const fechaArena = taskDomain2.slice(
  taskDomain2.indexOf('emitAppSensoryCue(campaignJustCleared'),
  taskDomain2.indexOf("}, 'marco');"),
);
assert.ok(fechaArena.length > 0, 'o fecho de arena deve ser identificavel');
assert.match(fechaArena, /showToast\(/, 'fechar arena continua confirmando');
assert.match(fechaArena, /emitOracleSpeech\(/, 'e o Oraculo continua comentando');
assert.doesNotMatch(
  fechaArena.slice(fechaArena.indexOf('showToast('), fechaArena.indexOf('emitOracleSpeech(')),
  /Muito bem|Parabens|Boa!/i,
  'o toast nao pode elogiar: elogio e do Oraculo, e ele obedece a presenca',
);

console.log('Oracle presence policy: silencioso cala, equilibrado celebra o grande, presente acompanha tudo.');

// Executa o portao remoto real: alertas antigos nao atravessam nem BASIC.
const remoteStart = webPush.indexOf('const shouldPushOracleMessage =');
const remoteEnd = webPush.indexOf('const configureVapid',remoteStart);
assert.ok(remoteEnd>remoteStart);
const remoteCode = ts.transpile(webPush.slice(remoteStart,remoteEnd),{target:ts.ScriptTarget.ES2022});
const acceptsRemote = new Function('asTrimmedString','MODE_PUSH_PROFILE',`${remoteCode}; return shouldPushOracleMessage;`)(
  value => String(value || '').trim(), {neutro:'equilibrado'});
for(const level of [0,1,2,3]) {
  const card = {...automaticCard,deliveryType:'feed',read:false};
  assert.equal(acceptsRemote(card,'BASIC',true,level,true),level>0);
  for(const context of [{purpose:'streak_alert'},{operationalState:'streak_mantida'},{operationalState:'streak_quebrada'}]) {
    const retired = {...card,contextSnapshot:{...card.contextSnapshot,...context}};
    assert.equal(acceptsRemote(retired,'BASIC',true,level,true),false);
    assert.equal(acceptsLocalCard(retired,level),false);
  }
  assert.equal(acceptsRemote({...card,deliveryType:'chat'},'BASIC',true,level,true),false);
  assert.equal(acceptsRemote({...card,contextSnapshot:{...card.contextSnapshot,triggerType:'manual'}},'BASIC',true,level,true),false);
}
console.log('Push: cards preservados; sequencia antiga bloqueada no servidor e no fallback local em todas as presencas.');
