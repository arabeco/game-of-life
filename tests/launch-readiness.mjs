import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const nodeBin = process.execPath;
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const defaultReportPath = path.join(repoRoot, 'LAUNCH_READINESS_REPORT.md');
const manualQaNotes = [
  'PIX/Ouro real ponta a ponta',
  'GM Panel com e-mail real',
  'Premium remoto em 2 aparelhos',
  'Passada final em aparelho real',
];

const suites = {
  core: [
    {
      id: 'challenge-rewards',
      label: 'Challenge reward flow regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'challenge-reward-flow.regression.mjs')]],
      kind: 'logic',
      interactions: ['limita desafios visiveis', 'confere progresso de arenas', 'garante insignias acumulaveis'],
    },
    {
      id: 'oracle-cycle-coach',
      label: 'Oracle cycle coach regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'oracle-cycle-coach.regression.mjs')]],
      kind: 'logic',
      interactions: ['le ritmo do ciclo localmente', 'prioriza arena em risco', 'oferece apenas navegacao segura'],
    },
    {
      id: 'reward-modal-priority',
      label: 'Reward modal priority regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'reward-modal-priority.regression.mjs')]],
      kind: 'logic',
      interactions: ['nao mostra passagem antiga a conta nova', 'evita sobreposicao entre dicas, temporada e recompensas'],
    },
    {
      id: 'daily-widget-execution',
      label: 'Daily widget execution regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'daily-widget-execution.regression.mjs')]],
      kind: 'logic',
      interactions: ['remove planejamento diario do widget', 'mostra acoes feitas, XP e arenas tocadas'],
    },
    {
      id: 'daily-reading',
      label: 'Daily reading regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'daily-reading.regression.mjs')]],
      kind: 'logic',
      interactions: ['fala sobre o dia corrente, nao so sobre dias fechados', 'a assinatura muda a regua e nao o elogio', 'dia abaixo da media nao soa como falha'],
    },
    {
      id: 'cycle-comparison',
      label: 'Cycle comparison regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'cycle-comparison.regression.mjs')]],
      kind: 'logic',
      interactions: ['o ciclo nao entra na propria referencia', 'dias sem entrega conta invertido', 'mediana aguenta ciclo extremo'],
    },
    {
      id: 'subscription-xp-bonus',
      label: 'Subscription XP bonus regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'subscription-xp-bonus.regression.mjs')]],
      kind: 'logic',
      interactions: ['platinum rende mais que premium', 'assinatura vencida nao paga bonus', 'vitrine sai do mesmo numero do calculo'],
    },
    {
      id: 'arena-pacts',
      label: 'Arena pacts regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'arena-pacts.regression.mjs')]],
      kind: 'logic',
      interactions: ['nao propoe arena arquivada, travada, vazia ou concluida', 'constancia conta dias e nao acoes', 'entrega anterior ao aceite nao conta'],
    },
    {
      id: 'xp-scale',
      label: 'XP scale regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'xp-scale.regression.mjs')]],
      kind: 'logic',
      interactions: ['missoes, jornadas e pactos usam a mesma escala', 'nenhuma recompensa passa de 500 XP'],
    },
    {
      id: 'mission-reward-unification',
      label: 'Mission reward unification regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'mission-reward-unification.regression.mjs')]],
      kind: 'logic',
      interactions: ['os resgates passam pelo mesmo ritual', 'subida de patente entra em todos', 'missao de item paga XP por reward_exp'],
    },
    {
      id: 'oracle-presence-policy',
      label: 'Oracle presence policy regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'oracle-presence-policy.regression.mjs')]],
      kind: 'logic',
      interactions: ['presenca decide o que ele fala', 'aviso decide onde chega', 'push nao volta a exigir presenca 3'],
    },
    {
      id: 'device-only-failures',
      label: 'Safe area and late data regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'safe-area-insets.regression.mjs')]],
      kind: 'logic',
      interactions: ['o cabecalho desce a barra de status', 'a tela de descanso respeita as duas barras', 'preferencia que ainda nao chegou nao vira botao morto'],
    },
    {
      id: 'planner-simple-list',
      label: 'Planner simple list regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'planner-simple-list.regression.mjs')]],
      kind: 'logic',
      interactions: ['preserva horarios', 'salva a ordem no banco', 'mantem conclusoes fora da baia'],
    },
    {
      id: 'logic-core',
      label: 'Core loop regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'core-loop.regression.mjs')]],
      kind: 'logic',
      interactions: ['recalcula o core loop', 'valida progresso de campanha/arena', 'confere score, atlas e mutacoes utilitarias'],
    },
    {
      id: 'onboarding',
      label: 'Onboarding happy path',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'onboarding-happy-path.cdp.mjs')]],
      kind: 'browser',
      interactions: ['entra com conta temporaria', 'atravessa onboarding', 'cria arena/acao inicial', 'chega no fluxo principal sem travar'],
    },
    {
      id: 'campaign-quiz',
      label: 'Campaign quiz flow',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'campaign-quiz-flow-smoke.cdp.mjs')]],
      kind: 'browser',
      interactions: ['abre loja de campanhas', 'roda quiz gratis', 'reabre quiz completo', 'instala campanha e confirma menu'],
    },
    {
      id: 'cycle-report',
      label: 'Cycle report flow',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'cycle-report-flow.cdp.mjs')]],
      kind: 'browser',
      interactions: ['cria ciclo real', 'conclui tarefas', 'fecha ciclo', 'abre relatorio e reward flow'],
    },
    {
      id: 'ui-shell',
      label: 'UI shell smoke',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'ui-smoke.cdp.mjs')]],
      kind: 'browser',
      interactions: ['abre shell principal', 'navega views centrais', 'garante que a casca da app sobe sem overlay travando'],
    },
  ],
  account: [
    {
      id: 'oracle-delete',
      label: 'Onboarding + oracle + delete',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'onboarding-oracle-delete-smoke.cdp.mjs')]],
      kind: 'browser',
      interactions: ['valida onboarding', 'abre oracle', 'exercita fluxo de delete/account cleanup'],
    },
    {
      id: 'notifications',
      label: 'Notification lab',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'notification-lab-smoke.cdp.mjs')]],
      kind: 'browser',
      interactions: ['abre laboratorio de notificacoes', 'injeta notificacoes de teste', 'confere renderizacao e estados basicos'],
    },
  ],
  social: [
    {
      id: 'clan-create',
      label: 'Clan creation',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'clan-create-smoke.cdp.mjs')]],
      kind: 'browser',
      interactions: ['abre criacao de grupo', 'confirma debito/fluxo', 'garante que o grupo nasce na UI'],
    },
    {
      id: 'mentorship-sync',
      label: 'Mentorship planner sync',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'mentorship-planner-sync-smoke.cdp.mjs')]],
      kind: 'browser',
      interactions: ['cria mentoria 2 contas', 'cria arena vinculada', 'sincroniza planner entre os lados'],
    },
    {
      id: 'mentorship-visibility',
      label: 'Mentorship arenas visibility',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'mentorship-arenas-visibility-smoke.cdp.mjs')]],
      kind: 'browser',
      interactions: ['abre mentoria existente', 'confere arenas compartilhadas', 'valida leitura correta no board'],
    },
    {
      id: 'partnership',
      label: 'Partnership mutual arenas',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'partnership-mutual-arenas-smoke.cdp.mjs')]],
      kind: 'browser',
      interactions: ['cria parceria 2 contas', 'espelha arenas dos dois lados', 'confirma visibilidade mutua'],
    },
    {
      id: 'competition',
      label: 'Competition race',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'competition-race-smoke.cdp.mjs')]],
      kind: 'browser',
      interactions: ['abre competicao', 'executa corrida entre contas', 'confere vencedor, bau e reflexo final'],
    },
    {
      id: 'season-clan',
      label: 'Season clan smoke',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'season-clan-smoke.cdp.mjs')]],
      kind: 'browser',
      interactions: ['abre temporada', 'entra em superficie de missao/quest', 'verifica integracao base com grupo'],
    },
  ],
  legacy: [
    {
      id: 'legacy-customization',
      label: 'Legacy era customization',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'legacy-era-customization.cdp.mjs')]],
      kind: 'browser',
      interactions: ['abre customizacao do legado', 'troca configuracoes principais', 'confirma persistencia visual'],
    },
    {
      id: 'legacy-plaque',
      label: 'Legacy plaque flow',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'legacy-plaque-flow.cdp.mjs')]],
      kind: 'browser',
      interactions: ['gera placa final', 'abre cena de legado', 'confere fluxo de conclusao visual'],
    },
  ],
};

const suiteOrder = ['core', 'account', 'social', 'legacy'];
const suiteAliases = {
  full: suiteOrder,
  launch: suiteOrder,
  release: suiteOrder,
};

function parseArgs(argv) {
  const options = {
    suite: 'core',
    dryRun: false,
    list: false,
    skipBuild: false,
    skipServer: false,
    reportPath: defaultReportPath,
    port: Number(process.env.SMOKE_PORT || 3011),
    smokeUrl: process.env.SMOKE_URL || '',
  };

  for (const arg of argv) {
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--list') options.list = true;
    else if (arg === '--skip-build') options.skipBuild = true;
    else if (arg === '--skip-server') options.skipServer = true;
    else if (arg.startsWith('--suite=')) options.suite = arg.slice('--suite='.length);
    else if (arg.startsWith('--report=')) options.reportPath = path.resolve(repoRoot, arg.slice('--report='.length));
    else if (arg.startsWith('--port=')) options.port = Number(arg.slice('--port='.length));
    else if (arg.startsWith('--smoke-url=')) options.smokeUrl = arg.slice('--smoke-url='.length);
  }

  return options;
}

function resolveSuiteNames(name) {
  if (suiteAliases[name]) return suiteAliases[name];
  if (suites[name]) return [name];
  throw new Error(`Unknown suite "${name}". Use one of: ${[...Object.keys(suites), ...Object.keys(suiteAliases)].join(', ')}`);
}

function buildSuiteEntries(suiteName) {
  const resolved = resolveSuiteNames(suiteName);
  const entries = [];
  const seen = new Set();

  for (const name of resolved) {
    for (const entry of suites[name]) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      entries.push(entry);
    }
  }

  return entries;
}

function formatSeconds(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function makeSmokeUrl(port) {
  return `http://127.0.0.1:${port}/`;
}

async function waitForServer(url, timeoutMs = 20000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          res.resume();
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
            resolve();
            return;
          }
          reject(new Error(`HTTP ${res.statusCode}`));
        });
        req.on('error', reject);
      });
      return;
    } catch {
      await sleep(500);
    }
  }

  throw new Error(`Static smoke server did not respond at ${url} within ${timeoutMs}ms.`);
}

async function runProcess(label, bin, args, env = {}) {
  const startedAt = Date.now();
  const child = spawn(bin, args, {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });

  const [code, signal] = await once(child, 'exit');
  const durationMs = Date.now() - startedAt;

  if (code !== 0) {
    throw new Error(`${label} failed with exit ${code ?? 'null'}${signal ? ` (${signal})` : ''}`);
  }

  return durationMs;
}

function getBuildCommand() {
  if (process.platform === 'win32') {
    const cmd = process.env.ComSpec || 'cmd.exe';
    return [cmd, ['/d', '/s', '/c', 'npm run build']];
  }

  return [npmBin, ['run', 'build']];
}

function resolveStaticPath(smokeUrl, requestUrl = '/') {
  const pathname = decodeURIComponent(new URL(requestUrl, smokeUrl).pathname);
  const trimmed = pathname.replace(/^\/+/, '');
  const distRoot = path.join(repoRoot, 'dist');
  const candidate = trimmed ? path.resolve(distRoot, trimmed) : path.join(distRoot, 'index.html');

  if (!candidate.startsWith(distRoot)) {
    return path.join(distRoot, 'index.html');
  }

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  return path.join(distRoot, 'index.html');
}

function startStaticServer(port) {
  const smokeUrl = makeSmokeUrl(port);
  const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };

  const server = http.createServer((req, res) => {
    try {
      const filePath = resolveStaticPath(smokeUrl, req.url);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(String(error));
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      console.log(`[smoke-server] ready at ${smokeUrl}`);
      resolve(server);
    });
  });
}

async function stopStaticServer(server) {
  if (!server || !server.listening) return;

  await new Promise((resolve) => {
    server.close(() => resolve());
  });
}

function printSuite(entries, suiteName, smokeUrl) {
  console.log(`\nLaunch readiness suite: ${suiteName}`);
  console.log(`Static server: ${smokeUrl}`);
  console.log('Checks:');
  entries.forEach((entry, index) => {
    console.log(`${String(index + 1).padStart(2, '0')}. ${entry.label} [${entry.kind}]`);
    (entry.interactions || []).forEach((interaction) => {
      console.log(`    - ${interaction}`);
    });
  });
  console.log(`\nManual QA still required: ${manualQaNotes.join(', ')}.`);
}

function writeReport({ suiteName, entries, results, reportPath, smokeUrl, buildStatus }) {
  const generatedAt = new Date().toISOString();
  const lines = [
    '# Launch Readiness Report',
    '',
    `- Generated at: ${generatedAt}`,
    `- Suite: \`${suiteName}\``,
    `- Smoke URL: \`${smokeUrl}\``,
    `- Build: ${buildStatus}`,
    '',
    '## Checks',
    '',
  ];

  for (const entry of entries) {
    const result = results.find((item) => item.id === entry.id);
    const status = result?.status || 'PLANNED';
    const duration = typeof result?.durationMs === 'number' ? ` (${formatSeconds(result.durationMs)})` : '';
    lines.push(`### ${status} - ${entry.label}${duration}`);
    lines.push(`- Kind: \`${entry.kind}\``);
    for (const interaction of entry.interactions || []) {
      lines.push(`- Simulates: ${interaction}`);
    }
    if (result?.error) {
      lines.push(`- Error: ${result.error}`);
    }
    lines.push('');
  }

  lines.push('## Manual QA Still Required', '');
  for (const note of manualQaNotes) {
    lines.push(`- ${note}`);
  }
  lines.push('');

  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const entries = buildSuiteEntries(options.suite);
  const smokeUrl = options.smokeUrl || makeSmokeUrl(options.port);

  if (options.list || options.dryRun) {
    printSuite(entries, options.suite, smokeUrl);
    writeReport({
      suiteName: options.suite,
      entries,
      results: entries.map((entry) => ({ id: entry.id, status: 'PLANNED' })),
      reportPath: options.reportPath,
      smokeUrl,
      buildStatus: options.skipBuild ? 'SKIPPED' : 'PLANNED',
    });
    console.log(`\nReport written to ${options.reportPath}`);
    return;
  }

  console.log(`\n== Launch Readiness :: ${options.suite} ==`);
  console.log(`Smoke URL: ${smokeUrl}`);
  console.log(`Checks selected: ${entries.length}`);
  const results = [];
  let buildStatus = options.skipBuild ? 'SKIPPED' : 'PENDING';

  if (!options.skipBuild) {
    console.log('\n[build] npm run build');
    try {
      const [buildBin, buildArgs] = getBuildCommand();
      const buildMs = await runProcess('build', buildBin, buildArgs);
      buildStatus = `PASS (${formatSeconds(buildMs)})`;
      console.log(`[ok] build finished in ${formatSeconds(buildMs)}`);
    } catch (error) {
      buildStatus = `FAIL (${error instanceof Error ? error.message : String(error)})`;
      throw error;
    }
  }

  const browserEntries = entries.filter((entry) => entry.kind === 'browser');
  const logicEntries = entries.filter((entry) => entry.kind === 'logic');
  let server;

  try {
    for (const entry of logicEntries) {
      console.log(`\n[check] ${entry.label}`);
      try {
        const durationMs = await runProcess(entry.label, entry.command[0], entry.command[1]);
        results.push({ id: entry.id, label: entry.label, status: 'PASS', durationMs });
        console.log(`[ok] ${entry.label} (${formatSeconds(durationMs)})`);
      } catch (error) {
        results.push({ id: entry.id, label: entry.label, status: 'FAIL', error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    }

    if (browserEntries.length > 0) {
      if (options.skipServer || options.smokeUrl) {
        console.log('\n[server] using external smoke server');
      } else {
        console.log('\n[server] starting dist static server');
        server = startStaticServer(options.port);
      }
      await waitForServer(smokeUrl);
      console.log(`[ok] smoke server ready at ${smokeUrl}`);
    }

    for (const entry of browserEntries) {
      console.log(`\n[check] ${entry.label}`);
      try {
        const durationMs = await runProcess(entry.label, entry.command[0], entry.command[1], {
          SMOKE_URL: smokeUrl,
        });
        results.push({ id: entry.id, label: entry.label, status: 'PASS', durationMs });
        console.log(`[ok] ${entry.label} (${formatSeconds(durationMs)})`);
      } catch (error) {
        results.push({ id: entry.id, label: entry.label, status: 'FAIL', error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    }

    console.log('\n== Launch readiness summary ==');
    entries.forEach((entry) => {
      const result = results.find((item) => item.id === entry.id);
      const duration = typeof result?.durationMs === 'number' ? `  ${formatSeconds(result.durationMs)}` : '';
      console.log(`${result?.status || 'PLANNED'}  ${entry.label}${duration}`);
    });
    console.log(`\nStill manual: ${manualQaNotes.join(', ')}.`);
  } finally {
    await stopStaticServer(server);
    writeReport({
      suiteName: options.suite,
      entries,
      results,
      reportPath: options.reportPath,
      smokeUrl,
      buildStatus,
    });
    console.log(`\nReport written to ${options.reportPath}`);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n[launch-readiness] failed');
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
  });
