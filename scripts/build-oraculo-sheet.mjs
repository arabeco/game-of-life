import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

/**
 * O ORACULO — a folha do repertorio.
 *
 * O problema que ela resolve: o Oraculo fala por QUATRO superficies, e o
 * repertorio dele mora em TRES arquivos diferentes, com tres logicas de escolha.
 * Ninguem consegue segurar isso na cabeca, e por isso ele apodrece rapido —
 * melhorar um lugar nao melhora os outros, e a mesma pessoa pode ouvir o mesmo
 * assunto em duas vozes no mesmo dia.
 *
 * Esta folha nao inventa organizacao: ela LE os tres arquivos e mostra o que
 * existe, o que esta morto e onde os assuntos se repetem. Se alguem apagar um
 * detector e esquecer o tipo, a folha mostra na proxima geracao.
 */

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const saida = path.join(raiz, 'docs', 'o-oraculo.html');

const empacota = async (entrada, nome) => {
    const destino = path.join(raiz, 'node_modules', '.cache', nome);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(raiz, entrada)],
        bundle: true, platform: 'node', format: 'esm', outfile: destino, logLevel: 'error',
    });
    return import(`file://${destino.split(path.sep).join('/')}`);
};

const le = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');
const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const presencaMod = await empacota('constants/oraclePresencePolicy.ts', 'oraculo-presenca.mjs');
const falasMod = await empacota('constants/oracleSpeechLibrary.ts', 'oraculo-falas.mjs');

// ---------------------------------------------------------------- PRESENCA
const { ORACLE_PRESENCE_RULES, ORACLE_PRESENCE_ORDER } = presencaMod;
const presencas = ORACLE_PRESENCE_ORDER.map((valor) => ({ valor, ...ORACLE_PRESENCE_RULES[valor] }));
// O valor 1 nunca foi usado: a escada pula de 0 para 2. A vaga e real.
const vagasDePresenca = [];
for (let n = 0; n <= 3; n += 1) {
    if (!presencas.some((p) => p.valor === n)) vagasDePresenca.push(n);
}

// ------------------------------------------------------- CANDIDATOS (cliente)
/**
 * Declarado nao e vivo. Um candidato so existe de verdade se algum detector
 * chamar `build('tipo'`. Quando a sequencia global saiu, os detectores foram
 * removidos e o TIPO ficou — a folha precisa mostrar essa diferenca, senao
 * conta fantasma como repertorio.
 */
// ------------------------------------------------- ESTADO MESTRE E AS CORES
/**
 * O Estado Mestre e as cores sao DERIVADOS, nao escritos aqui: o mapa vem do
 * modulo e as cores vem do componente da marca. Se alguem trocar um tom, a
 * folha muda na proxima geracao — que e a unica forma de ela nao apodrecer.
 */
const mestreMod = await empacota('utils/oracleMasterState.ts', 'oraculo-mestre.mjs');
const { ORACLE_TONE_BY_STATE } = mestreMod;

const fonteMarca = le('components/OracleSpeakerMark.tsx');
const coresPorTom = Object.fromEntries(
    [...fonteMarca.matchAll(/(\w+):\s*\{\s*core:\s*'(#[0-9a-fA-F]{6})'[^]*?label:\s*'([^']+)'/g)]
        .map((m) => [m[1], { cor: m[2], rotulo: m[3] }]),
);

// Descanso e peso de cada assunto do ciclo, lidos da fonte.
const fonteCoachAssuntos = le('utils/oracleCoach.ts');
const assuntosDoCiclo = [...fonteCoachAssuntos.matchAll(/peso:\s*(-?\d+),\s*cooldownDays:\s*(\d+),(.*)[\s\S]*?id:\s*[`']coach:([a-z-]+)/g)]
    .map((m) => ({ peso: Number(m[1]), descanso: Number(m[2]), motivo: m[3].replace(/^\s*\/\/\s*/, '').trim(), assunto: m[4] }))
    .sort((a, b) => b.peso - a.peso);

// O que cada estado PROIBE, lido do proprio arquivo: sao as travas de coerencia.
const proibidosPorEstado = Object.fromEntries(
    [...le('utils/oracleMasterState.ts').matchAll(/estado:\s*'(\w+)'[^]*?proibidos:\s*(\[[^\]]*\])/g)]
        .map((m) => [m[1], (m[2].match(/'coach:[a-z-]+'/g) || []).map((x) => x.replace(/'/g, ''))]),
);

const fonteCandidatos = le('utils/oracleCandidates.ts');
const tiposDeclarados = (fonteCandidatos.match(/export const ORACLE_CANDIDATE_TYPES[^]*?\];/)?.[0] || '')
    .match(/'([a-z_]+)'/g)?.map((s) => s.replace(/'/g, '')) || [];
const tiposComDetector = new Set(
    [...fonteCandidatos.matchAll(/build\(\s*'([a-z_]+)'/g)].map((m) => m[1]),
);
const pesoDe = (tipo) => {
    const bloco = fonteCandidatos.match(new RegExp(`\\n  ${tipo}: \\{[^]*?\\n  \\}`, ''))?.[0] || '';
    return bloco.match(/peso:\s*(\d+)/)?.[1] || null;
};
const candidatos = tiposDeclarados.map((tipo) => ({
    tipo,
    vivo: tiposComDetector.has(tipo),
    peso: pesoDe(tipo),
}));

// ------------------------------------------------------- ESTADOS (servidor)
const fonteEstados = le('supabase/functions/_shared/oracle-host-voice.ts');
const fonteLinhas = le('supabase/functions/_shared/oracle-lines.ts');
const estadosDeclarados = (fonteEstados.match(/export type OracleHostOperationalState =[^;]*;/)?.[0] || '')
    .match(/"([a-z_]+)"/g)?.map((s) => s.replace(/"/g, '')) || [];
const estadosAlcancaveis = new Set(
    [...fonteEstados.matchAll(/return\s+"([a-z_]+)"/g)].map((m) => m[1]),
);
const frasesPorEstado = {};
for (const m of fonteLinhas.matchAll(/\n  ([a-z_]+): \[([^\]]*)\]/g)) {
    frasesPorEstado[m[1]] = (m[2].match(/"/g)?.length || 0) / 2;
}
const estados = estadosDeclarados.map((estado) => ({
    estado,
    vivo: estadosAlcancaveis.has(estado),
    frases: frasesPorEstado[estado] ?? 0,
}));

// ------------------------------------------------------------ REACOES
const { ORACLE_SPEECH_LIBRARY, ORACLE_TONE_LABELS } = falasMod;
const tons = Object.keys(ORACLE_TONE_LABELS);
const reacoes = Object.entries(ORACLE_SPEECH_LIBRARY).map(([evento, porTom]) => ({
    evento,
    porTom: tons.map((tom) => (porTom[tom] || []).length),
    total: tons.reduce((soma, tom) => soma + (porTom[tom] || []).length, 0),
}));

// --------------------------------------------------------- LER MEU DIA
/**
 * `buildOracleCycleCoachBrief` e uma CASCATA: o primeiro `if` que casa vence e
 * os outros nunca sao considerados. A ordem, entao, e a regra — e por isso ela
 * aparece numerada aqui.
 */
const fonteCoach = le('utils/oracleCoach.ts');
const brief = fonteCoach.slice(fonteCoach.indexOf('export const buildOracleCycleCoachBrief'));
const casosDoBrief = [...brief.matchAll(/id: [`']coach:([a-z-]+)/g)].map((m) => m[1]);

// ------------------------------------------------------- ASSUNTOS REPETIDOS
/**
 * Agrupamento por assunto. E CURADO, nao derivado: dizer que `arena_parada` e
 * `arena_esquecida` sao a mesma coisa e julgamento, e julgamento nao sai de
 * regex. O que a folha garante e que cada peca citada aqui existe de fato nas
 * listas acima — some da lista, some daqui.
 */
const ASSUNTOS = [
    { nome: 'Arena parada', candidato: ['arena_parada', 'arena_atrasada'], estado: ['arena_esquecida'], reacao: [] },
    { nome: 'Escopo grande demais', candidato: ['meta_inflada'], estado: ['escopo_pesado'], reacao: [] },
    { nome: 'Ciclo atrasado', candidato: ['ciclo_atrasado'], estado: ['atrasado'], reacao: [] },
    { nome: 'Voltar depois de sumir', candidato: ['arena_retomada'], estado: ['retomando'], reacao: ['first_after_pause'] },
    { nome: 'Sem ciclo', candidato: ['sem_ciclo'], estado: ['sem_direcao'], reacao: [] },
    { nome: 'Sequência (removida)', candidato: ['streak_marco', 'streak_em_risco'], estado: ['streak_mantida', 'streak_quebrada'], reacao: ['streak_saved'] },
];
const existe = {
    candidato: new Set(candidatos.map((c) => c.tipo)),
    estado: new Set(estados.map((e) => e.estado)),
    reacao: new Set(reacoes.map((r) => r.evento)),
};
const vivo = {
    candidato: new Set(candidatos.filter((c) => c.vivo).map((c) => c.tipo)),
    estado: new Set(estados.filter((e) => e.vivo).map((e) => e.estado)),
    reacao: new Set(reacoes.map((r) => r.evento)),
};

const pecas = (lista, familia) => lista.map((nome) => {
    if (!existe[familia].has(nome)) return `<s>${esc(nome)}</s>`;
    return vivo[familia].has(nome) ? `<code>${esc(nome)}</code>` : `<code class="morto">${esc(nome)}</code>`;
}).join(' ') || '<span class="nada">—</span>';

// ------------------------------------------------------------------ NUMEROS
const candidatosVivos = candidatos.filter((c) => c.vivo).length;
const estadosVivos = estados.filter((e) => e.vivo).length;
const totalFrases = Object.values(frasesPorEstado).reduce((a, b) => a + b, 0)
    + reacoes.reduce((a, r) => a + r.total, 0);

const commit = (() => {
    try { return execSync('git rev-parse --short HEAD', { cwd: raiz }).toString().trim(); }
    catch { return 'sem git'; }
})();
const agora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>O Oráculo — Glyph</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; padding:28px 24px 80px; background:#0e1013; color:#e7e9ec;
         font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif; }
  .wrap { max-width:1080px; margin:0 auto; }
  h1 { font-size:26px; margin:0 0 6px; }
  h2 { font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:#8b929c;
       margin:38px 0 12px; border-bottom:1px solid #23262c; padding-bottom:7px; }
  p.lead { color:#969ca6; max-width:74ch; margin:0 0 14px; }
  .carimbo { display:flex; gap:8px; flex-wrap:wrap; margin:14px 0 8px; }
  .carimbo span { font:11px/1 ui-monospace,monospace; color:#8b929c; border:1px solid #2a2e35;
                  border-radius:5px; padding:6px 9px; background:#14171b; }
  .placar { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; margin:16px 0 4px; }
  .placar div { border:1px solid #23262c; border-radius:9px; background:#111417; padding:12px 14px; }
  .placar b { display:block; font-size:24px; font-variant-numeric:tabular-nums; }
  .placar span { display:block; margin-top:3px; font:9px ui-monospace,monospace; letter-spacing:.12em;
                 text-transform:uppercase; color:#858a93; }
  .nota { margin-top:12px; padding:11px 13px; border-left:2px solid #d8b44c; background:#14171b;
          color:#969ca6; font-size:13.5px; }
  .nota strong { color:#e7e9ec; }
  .nota.alerta { border-left-color:#e9a268; }
  table { border-collapse:collapse; width:100%; font-size:13px; }
  th,td { text-align:left; padding:7px 12px 7px 0; border-bottom:1px solid #23262c; vertical-align:top; }
  th { font:9px ui-monospace,monospace; letter-spacing:.12em; text-transform:uppercase; color:#7c828c; }
  td.n { font-variant-numeric:tabular-nums; }
  code { font:11.5px ui-monospace,monospace; color:#c9cdd3; background:#181b1f;
         border:1px solid #262a30; border-radius:4px; padding:1px 5px; }
  code.morto { color:#e9a268; border-color:#4a3a2a; text-decoration:line-through; }
  s { color:#6e747c; font:11.5px ui-monospace,monospace; }
  .nada { color:#4d535b; }
  .sim { color:#7fd8a4; } .nao { color:#e9a268; }
  ol.cascata { counter-reset:c; list-style:none; padding:0; margin:0; }
  ol.cascata li { counter-increment:c; border-bottom:1px solid #23262c; padding:6px 0 6px 34px; position:relative; }
  ol.cascata li::before { content:counter(c); position:absolute; left:0; top:6px;
      font:10px ui-monospace,monospace; color:#7c828c; border:1px solid #2a2e35; border-radius:4px;
      width:22px; text-align:center; padding:2px 0; }
  footer { margin-top:52px; padding-top:16px; border-top:1px solid #23262c; color:#6e747c; font-size:12.5px; }
</style></head><body><div class="wrap">

<h1>O Oráculo</h1>
<p class="lead">O Oráculo fala por <strong>quatro superfícies</strong>, e o repertório dele mora em
<strong>três arquivos</strong>, com três lógicas de escolha. Esta folha lê os três e mostra o que
está vivo, o que está morto e onde os assuntos se repetem — para caber na cabeça de uma pessoa
antes de alguém escrever frase nova.</p>

<div class="carimbo">
  <span>gerada ${esc(agora)}</span>
  <span>commit ${esc(commit)}</span>
  <span>npm run folhas</span>
</div>

<div class="placar">
  <div><b>${candidatosVivos}<span style="font-size:14px;color:#6e747c">/${candidatos.length}</span></b><span>candidatos vivos</span></div>
  <div><b>${estadosVivos}<span style="font-size:14px;color:#6e747c">/${estados.length}</span></b><span>estados do servidor</span></div>
  <div><b>${reacoes.length}</b><span>eventos de reação</span></div>
  <div><b>${casosDoBrief.length}</b><span>casos do "Analisar meu ciclo"</span></div>
  <div><b>${totalFrases}</b><span>frases escritas</span></div>
</div>

<h2>Entradas do Oráculo — organização de 10/09/2026</h2>
<p>Meu acompanhamento reúne <strong>Ler meu dia</strong> (tarefas do dia operacional) e <strong>Analisar meu ciclo</strong> (metas e ritmo do período). Cada leitura ocupa seu próprio espaço na conversa; pedir novamente atualiza a leitura correspondente. As leituras ainda são locais à sessão do painel.</p>
<p><strong>Sabedoria</strong> reúne os cards de conteúdo e o pedido de card. As falas antigas permanecem no acompanhamento com data e hora. Novas aberturas e reações são temporárias e não gravam mensagens.</p>
<h2>As quatro superfícies</h2>
<table>
  <thead><tr><th>superfície</th><th>quando aparece</th><th>quem controla</th><th>vira push?</th></tr></thead>
  <tbody>
    <tr><td><b>Card</b></td><td>no máximo um por dia, gerado por IA</td><td>interruptor próprio + presença</td><td class="sim">sim</td></tr>
    <tr><td><b>Fala de abertura</b></td><td>ao abrir uma tela</td><td>presença</td><td class="nao">não — aparece só no momento</td></tr>
    <tr><td><b>Reação</b></td><td>ao concluir algo</td><td>presença</td><td class="nao">não — aparece só no momento</td></tr>
    <tr><td><b>Chat</b> (ler meu dia, analisar meu ciclo, escolher missão)</td><td>quando a pessoa pede</td><td>ninguém — ela pediu</td><td class="nao">nunca</td></tr>
  </tbody>
</table>
<div class="nota">Toda a complexidade do repertório está dentro de <strong>duas</strong> dessas
caixas: fala de abertura e reação. O que o usuário vê já é simples; o motor é que está
implementado duas vezes.</div>

<h2>Presença — a escada</h2>
<table>
  <thead><tr><th>nível</th><th>nome</th><th>card</th><th>fala de abertura</th><th>reações</th><th>legenda na tela</th></tr></thead>
  <tbody>${presencas.map((p) => `<tr>
    <td class="n">${esc(p.valor)}</td><td><b>${esc(p.label)}</b></td>
    <td>${p.dailyCard ? '<span class="sim">sim</span>' : '<span class="nao">não</span>'}</td>
    <td>${esc(p.openingLine)}</td><td>${esc(p.reactions)}</td>
    <td style="color:#8b929c">${esc(p.caption)}</td></tr>`).join('')}</tbody>
</table>
${vagasDePresenca.length ? `<div class="nota"><strong>Vaga${vagasDePresenca.length > 1 ? 's' : ''} na escada:
nível ${vagasDePresenca.join(', ')}.</strong> A escada pula de 0 para 2 — o valor 1 existe como número
gravado (é normalizado para o mais perto) e não tem política própria. É onde caberia um nível novo
sem inventar dimensão nenhuma: por exemplo, <em>não me analise, mas comemore comigo</em> — sem fala
de abertura, com reações de marco.</div>` : ''}

<h2>Candidatos de abertura <span style="color:#6e747c;font-weight:400">· cliente · <code>utils/oracleCandidates.ts</code></span></h2>
<p class="lead">Um árbitro escolhe <strong>no máximo um</strong>, por peso, e o silêncio é resposta
válida. Um tipo só está vivo se algum detector chamar <code>build('tipo'</code> — declarado no tipo
não basta.</p>
<table>
  <thead><tr><th>tipo</th><th>peso</th><th>estado</th></tr></thead>
  <tbody>${candidatos.map((c) => `<tr>
    <td>${c.vivo ? `<code>${esc(c.tipo)}</code>` : `<code class="morto">${esc(c.tipo)}</code>`}</td>
    <td class="n">${esc(c.peso || '—')}</td>
    <td>${c.vivo ? '<span class="sim">vivo</span>' : '<span class="nao">declarado, sem detector</span>'}</td>
  </tr>`).join('')}</tbody>
</table>

<h2>Estados operacionais <span style="color:#6e747c;font-weight:400">· servidor · <code>_shared/oracle-host-voice.ts</code></span></h2>
<p class="lead">Cascata de <code>if</code>: o primeiro que casa vence. <strong>Não têm variação de
tom</strong> — são frases fixas, enquanto as reações têm quatro tons. Mesma casa, duas políticas.</p>
<table>
  <thead><tr><th>estado</th><th>frases</th><th>alcançável?</th></tr></thead>
  <tbody>${estados.map((e) => `<tr>
    <td>${e.vivo ? `<code>${esc(e.estado)}</code>` : `<code class="morto">${esc(e.estado)}</code>`}</td>
    <td class="n">${esc(e.frases)}</td>
    <td>${e.vivo ? '<span class="sim">sim</span>' : '<span class="nao">nunca retornado</span>'}</td>
  </tr>`).join('')}</tbody>
</table>

<h2>Reações a evento <span style="color:#6e747c;font-weight:400">· cliente · <code>constants/oracleSpeechLibrary.ts</code></span></h2>
<p class="lead">O sistema mais bem feito dos três: cada evento tem frase nos quatro tons. Deveria
ser o modelo dos outros dois.</p>
<table>
  <thead><tr><th>evento</th>${tons.map((t) => `<th>${esc(ORACLE_TONE_LABELS[t].name)}</th>`).join('')}<th>total</th></tr></thead>
  <tbody>${reacoes.map((r) => `<tr>
    <td><code>${esc(r.evento)}</code></td>
    ${r.porTom.map((n) => `<td class="n">${n || '<span class="nada">0</span>'}</td>`).join('')}
    <td class="n"><b>${r.total}</b></td>
  </tr>`).join('')}</tbody>
</table>

<h2>"Analisar meu ciclo" <span style="color:#6e747c;font-weight:400">· <code>utils/oracleCoach.ts</code></span></h2>
<p class="lead">Grátis, local, sem ida ao servidor — e é a única superfície com <strong>botões que
navegam</strong>. Cada assunto tem um <strong>peso</strong> (relevância geral) e um
<strong>descanso</strong> em dias. Dito uma vez, o assunto sai da fila pelo tempo dele e o próximo
mais relevante assume: não é rodízio, o peso continua mandando dentro do que está disponível — o
descanso só impede que o primeiro lugar seja vitalício.</p>
<table>
  <thead><tr><th>assunto</th><th>peso</th><th>descanso</th><th>por quê esse descanso</th></tr></thead>
  <tbody>${assuntosDoCiclo.map((c) => `<tr><td><code>coach:${esc(c.assunto)}</code></td><td>${c.peso}</td><td>${c.descanso === 0 ? '—' : `${c.descanso}d`}</td><td style="font-size:12px;color:#6e747c">${esc(c.motivo)}</td></tr>`).join('')}</tbody>
</table>
<div class="nota"><strong>O peso não é a última palavra.</strong> Antes de escolher, o
<code>utils/oracleMasterState.ts</code> deriva qual é a <em>história</em> agora e aplica dois
efeitos: bônus de peso ao assunto que a conta, e <strong>proibição</strong> dos que a contradizem.
Foi isso que impediu o app de afirmar &ldquo;você está no ritmo&rdquo; a quem tem 10 de 140 feitas.</div>

<h2>Estado Mestre <span style="color:#6e747c;font-weight:400">· <code>utils/oracleMasterState.ts</code></span></h2>
<p class="lead">Um diagnóstico dominante, derivado do contexto que o app já calculava. Ele responde
&ldquo;qual é a história mais importante agora?&rdquo; e <strong>não escolhe a frase</strong> — ele
reordena e proíbe. A cor da marca também sai daqui: a casca continua dourada, e o que muda é o
<strong>círculo no centro</strong> e a <strong>luz ao redor</strong>. Cor é detalhe, não identidade.</p>
<table>
  <thead><tr><th>estado</th><th>tom</th><th>cor</th><th>proíbe</th></tr></thead>
  <tbody>${Object.entries(ORACLE_TONE_BY_STATE).map(([estado, tom]) => {
    const c = coresPorTom[tom] || { cor: '#888888', rotulo: tom };
    const proibidos = proibidosPorEstado[estado] || [];
    return `<tr><td><code>${esc(estado)}</code></td><td>${esc(c.rotulo)}</td>` +
      `<td><span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:${c.cor};box-shadow:0 0 8px ${c.cor};vertical-align:middle;margin-right:6px"></span><code>${esc(c.cor)}</code></td>` +
      `<td style="font-size:12px;color:#6e747c">${proibidos.length ? proibidos.map((x) => `<code>${esc(x)}</code>`).join(' ') : '—'}</td></tr>`;
  }).join('')}</tbody>
</table>
<div class="nota alerta"><strong>A cor só informa se alguém a passar.</strong> A abertura já usa o
Estado Mestre; as reações usam o próprio evento (concluir é <em>Progresso</em>, avançar numa missão
é <em>Guia</em>). Emissor que não passa tom cai em dourado — e dourado deixa de querer dizer
&ldquo;o Oráculo em repouso&rdquo; para querer dizer &ldquo;ninguém decidiu&rdquo;.</div>

<h2>Assuntos escritos mais de uma vez</h2>
<p class="lead">Agrupamento <strong>curado</strong>, não derivado — dizer que duas peças são o mesmo
assunto é julgamento. O que a folha garante é que cada peça citada existe de fato nas listas acima:
<s>riscada</s> = não existe mais, <code class="morto">laranja</code> = declarada mas morta.</p>
<table>
  <thead><tr><th>assunto</th><th>candidato (cliente)</th><th>estado (servidor)</th><th>reação</th></tr></thead>
  <tbody>${ASSUNTOS.map((a) => `<tr>
    <td><b>${esc(a.nome)}</b></td>
    <td>${pecas(a.candidato, 'candidato')}</td>
    <td>${pecas(a.estado, 'estado')}</td>
    <td>${pecas(a.reacao, 'reacao')}</td>
  </tr>`).join('')}</tbody>
</table>
<div class="nota"><strong>É daqui que vem a sensação de não ter controle.</strong> Seis assuntos
escritos em dois ou três lugares, com textos diferentes e regras de escolha diferentes. Melhorar um
não melhora os outros — e a mesma pessoa pode ouvir a mesma coisa em duas vozes no mesmo dia.</div>

<h2>As regras que não mudam</h2>
<div class="nota"><strong>Se não dá para nomear o número que gerou a frase, a frase não sai.</strong>
É o que separa leitura de bajulação.</div>
<div class="nota"><strong>O sujeito é a arena, o ciclo ou a ação — nunca "você" como culpado.</strong>
"A arena Meditações ficou pra trás", não "você abandonou Meditações".</div>
<div class="nota"><strong>A saída é editar o plano, não pedir mais esforço.</strong> "Reduzir meta
agora não tira EXP já conquistada."</div>
<div class="nota"><strong>Duas medidas do mesmo tipo, uma contra a outra.</strong> Medida sozinha é
placar, não fala.</div>
<div class="nota"><strong>Convite tem duas portas.</strong> "Deixar parada é uma escolha válida,
desde que seja escolha."</div>
<div class="nota"><strong>Falar de novo só quando o número muda</strong> — não quando o dia muda. É a
única defesa contra virar papel de parede, e ela vale mais que ter mais frases.</div>

<footer>
  Gerada por <code>scripts/build-oraculo-sheet.mjs</code> · <code>npm run folhas</code>.
  Não edite este arquivo à mão: a próxima geração apaga.
</footer>
</div></body></html>`;

fs.writeFileSync(saida, html, 'utf8');
console.log(`o-oraculo: ${path.relative(raiz, saida)} (${(html.length / 1024).toFixed(0)} KB)`);
console.log(`  candidatos ${candidatosVivos}/${candidatos.length} vivos · estados ${estadosVivos}/${estados.length}`
    + ` · reacoes ${reacoes.length} · brief ${casosDoBrief.length} casos · ${totalFrases} frases`);
if (vagasDePresenca.length) console.log(`  vaga(s) na escada de presenca: ${vagasDePresenca.join(', ')}`);
