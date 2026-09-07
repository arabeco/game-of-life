import { createAnonClient, createTempUser, DEFAULT_SMOKE_URL } from './_smoke.supabase.mjs';
import { sleep, withBrowser } from './_smoke.browser.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;

function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function bodyIncludesExpression(text) {
  const needle = normalizeText(text);
  return `(() => {
    const body = (document.body?.innerText || '')
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .toUpperCase();
    return body.includes(${JSON.stringify(needle)});
  })()`;
}

function onboardingTitleExpression(text) {
  const needle = normalizeText(text);
  return `(() => {
    const title = document.querySelector('#first-use-onboarding-title');
    const value = (title?.textContent || '')
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .toUpperCase()
      .trim();
    return value === ${JSON.stringify(needle)};
  })()`;
}

async function waitForStep(page, title, timeoutMs = 20000) {
  await page.waitFor(`passo "${title}"`, onboardingTitleExpression(title), timeoutMs);
}

async function waitForBodyText(page, description, text, timeoutMs = 12000) {
  await page.waitFor(description, bodyIncludesExpression(text), timeoutMs);
}

async function advanceOverlay(page, currentStepText) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const clicked = await page.evaluate(`(() => {
      const button = document.querySelector('#first-use-onboarding-next');
      if (!(button instanceof HTMLElement)) return false;
      button.click();
      return true;
    })()`);
    if (!clicked) {
      await page.clickText('Próximo');
    }
    await sleep(320);
    const stillSameStep = await page.evaluate(onboardingTitleExpression(currentStepText));
    if (!stillSameStep) {
      return;
    }
  }

  throw new Error(`Overlay did not advance from step: ${currentStepText}`);
}


async function updateProfile(client, userId, patch) {
  const { error } = await client
    .from('user_profiles')
    .update(patch)
    .eq('id', userId);

  if (error) {
    throw new Error(`profile update failed: ${error.message}`);
  }
}

async function fetchProfile(client, userId) {
  const { data, error } = await client
    .from('user_profiles')
    .select('onboarding_completed_at,onboarding_dismissed_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error(`profile fetch failed: ${error?.message || 'missing profile'}`);
  }

  return data;
}

async function getSession(client) {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) {
    throw new Error(`session fetch failed: ${error?.message || 'missing session'}`);
  }
  return data.session;
}

async function seedSession(page, session) {
  const serialized = Buffer.from(JSON.stringify(session), 'utf8').toString('base64');
  await page.cdp('Page.navigate', { url: baseUrl });
  await page.waitFor(
    'smoke base url',
    `(() => location.href.startsWith(${JSON.stringify(baseUrl)}))()`,
    20000,
  );
  const ok = await page.evaluate(`(() => {
    localStorage.setItem('gol-supabase-auth', atob(${JSON.stringify(serialized)}));
    return true;
  })()`);

  if (!ok) {
    throw new Error('Failed to seed browser session.');
  }

  await page.reload();
  await page.waitFor(
    'authenticated shell',
    `(() => document.querySelector('#nav-mundo') instanceof HTMLElement && document.querySelector('#nav-settings') instanceof HTMLElement)()`,
    40000,
  );
}

async function clickOracleSend(page) {
  const ok = await page.evaluate(`(() => {
    const input = Array.from(document.querySelectorAll('input'))
      .find((node) => node instanceof HTMLInputElement && (node.placeholder || '').includes('operacional'));
    if (!(input instanceof HTMLInputElement)) return false;
    const wrapper = input.parentElement;
    const button = wrapper ? wrapper.querySelector('button') : null;
    if (!(button instanceof HTMLElement)) return false;
    button.click();
    return true;
  })()`);

  if (!ok) {
    throw new Error('Could not click Oracle send button.');
  }
}

async function waitForOracleResponse(page, promptText) {
  await page.waitFor(
    'oracle response',
    `(() => {
      const body = document.body ? document.body.innerText : '';
      if (!body.includes(${JSON.stringify(promptText)})) return false;
      if (body.includes('Consultando os astros...')) return false;
      return true;
    })()`,
    45000,
  );

  const body = await page.bodyText();
  const fallbackMarkers = [
    'O Oraculo esta em silencio momentaneo',
    'Sessao expirada no Oraculo',
    'Oraculo bloqueado para esta origem',
    'Oraculo indisponivel',
  ];

  const fallback = fallbackMarkers.find((marker) => body.includes(marker));
  if (fallback) {
    throw new Error(`Oracle returned fallback message: ${fallback}`);
  }
}

async function runOnboardingScenario() {
  const checkpoints = [];
  const user = await createTempUser({ label: 'onboarding-smoke', isPremium: true });

  // createTempUser marca TODA conta temporaria com onboarding_completed_at e
  // onboarding_dismissed_at, para que o overlay nao atrapalhe os outros smokes.
  // Este cenario quer justamente o overlay, entao precisa desfazer isso — sem
  // isto ele pedia uma tela que ele mesmo tinha acabado de desligar.
  await updateProfile(user.client, user.userId, {
    onboarding_completed_at: null,
    onboarding_dismissed_at: null,
  });

  const session = await getSession(user.client);

  await withBrowser({ baseUrl, debugPort: 9331 }, async (page) => {
    await seedSession(page, session);
    checkpoints.push('login-ok');

    // Antes isto procurava as palavras ONBOARDING e PRIMEIRO CICLO no texto da
    // tela. Nenhuma das duas aparece para quem usa o app: "onboarding" e nome de
    // codigo nosso, e o primeiro passo pergunta "Pra que você quer usar o app?".
    // O id do titulo existe no overlay e nao depende do texto de nenhum passo.
    // O PASSO A PASSO SEGUE O FLUXO DE HOJE, NAO O DE ONTEM.
    //
    // A versao anterior deste trecho percorria uma geracao antiga do onboarding:
    // comecava pelo ciclo, depois arena, depois acao, e esperava titulos como
    // "Nomeie a fase", "Tipo da acao" e "Duracao base". Nenhum deles existe.
    //
    // O fluxo atual tem 14 passos e comeca perguntando o proposito:
    //   proposito -> arena -> acao -> ciclo -> missoes -> fim
    //
    // Cada passo destaca um elemento do app (targetSelector) e alguns escondem o
    // botao Proximo (hideNext) porque so avancam quando a pessoa faz a coisa de
    // verdade. Por isso aqui alternamos: clicar no alvo quando o passo exige acao,
    // e avancar a tour quando ele so explica.
    //
    // Esperamos por TITULO DE PASSO, nao por texto solto na tela: o texto de
    // varios passos muda conforme o proposito escolhido, e o titulo nao.
    await waitForStep(page, 'Pra que você quer usar o app?', 40000);
    checkpoints.push('overlay-open');

    // Passo 1 esconde o Proximo: so sai daqui quem escolhe um proposito.
    await page.clickSelector('#onboarding-purpose-organizar');

    await waitForStep(page, 'Sua primeira arena');
    await page.clickSelector('#new-action-button');

    await waitForStep(page, 'Escolha a área');
    await advanceOverlay(page, 'Escolha a área');

    await waitForStep(page, 'Dê um nome claro');
    await page.setInputValue('#new-arena-name-input', 'Arena Smoke');
    await sleep(250);
    await advanceOverlay(page, 'Dê um nome claro');

    await waitForStep(page, 'Crie a arena');
    await page.clickSelector('#new-arena-submit-button');
    checkpoints.push('arena-created');

    await waitForStep(page, 'Primeira ação');
    await page.clickSelector('#add-action-button');

    await waitForStep(page, 'O que você vai fazer?');
    await page.setInputValue('#onboarding-action-name-input', 'Acao Smoke');
    await sleep(250);
    await advanceOverlay(page, 'O que você vai fazer?');

    await waitForStep(page, 'Escolha uma meta leve');
    await advanceOverlay(page, 'Escolha uma meta leve');

    await waitForStep(page, 'Salve sua ação');
    await page.clickSelector('#onboarding-action-save-button');
    checkpoints.push('action-created');

    await waitForStep(page, 'Comece um ciclo curto');
    // Aqui o botao do overlay se chama ABRIR, nao Proximo: o alvo
    // (#start-new-cycle-button) vive em outra tela, e e o proprio overlay que
    // navega e aciona. Clicar no alvo direto falha porque ele nem esta montado.
    await advanceOverlay(page, 'Comece um ciclo curto');

    await waitForStep(page, 'Confira o prazo');
    await advanceOverlay(page, 'Confira o prazo');

    await waitForStep(page, 'Inicie o ciclo');
    await page.clickSelector('#new-cycle-submit-button');
    await page.clickText('CONFIRMAR');
    checkpoints.push('cycle-created');

    await waitForStep(page, 'Quer uma missão para comecar?');
    await advanceOverlay(page, 'Quer uma missão para comecar?');

    await waitForStep(page, 'Tudo pronto');
    await page.clickText('Concluir');
    checkpoints.push('onboarding-finished');

    // O que importa no fim e o overlay ter saido de cena. A tela em que a pessoa
    // aterrissa e decisao do ultimo passo e ja mudou uma vez; prender o teste a
    // ela foi o que deixou este trecho desatualizado por tanto tempo.
    await page.waitFor(
      'overlay closed',
      `(() => !document.querySelector('#first-use-onboarding-title'))()`,
      25000,
    );
  });

  const profile = await fetchProfile(user.client, user.userId);
  if (!profile.onboarding_completed_at) {
    throw new Error('Onboarding did not persist onboarding_completed_at.');
  }

  return { user, checkpoints };
}

async function runOracleScenario() {
  const checkpoints = [];
  const user = await createTempUser({ label: 'oracle-smoke', isPremium: true });
  const completedAt = new Date().toISOString();

  await updateProfile(user.client, user.userId, {
    onboarding_version: 'operational-v1',
    onboarding_started_at: completedAt,
    onboarding_completed_at: completedAt,
  });
  const session = await getSession(user.client);

  const promptText = 'Me de um conselho curto para hoje.';

  await withBrowser({ baseUrl, debugPort: 9332 }, async (page) => {
    await seedSession(page, session);
    checkpoints.push('login-ok');

    // O QUE ESTE CENARIO MEDIA, E O QUE ELE MEDE AGORA.
    //
    // Antes ele digitava uma pergunta livre no chat e esperava a resposta da edge
    // function, checando inclusive as mensagens de fallback ("Sessao expirada no
    // Oraculo", "Oraculo indisponivel"). Era a unica cobertura de ponta a ponta
    // daquele servidor.
    //
    // Essa consulta escrita NAO EXISTE MAIS na interface. O unico campo de texto
    // do Oraculo vivia em components/OracleAction.tsx — 1903 linhas que nenhum
    // arquivo importava, apagadas junto com esta correcao. O chat de hoje e por
    // botao.
    //
    // Entao aqui passamos a medir o que existe: "Ler meu dia" devolve a leitura.
    // E honesto dizer que isto e MENOS: a leitura le da memoria do app e nao toca
    // a rede, entao a edge function do Oraculo ficou sem cobertura de interface —
    // nao porque o teste piorou, mas porque a tela que a exercitava saiu.
    await page.clickSelector('#header-oracle');
    await page.waitFor('oracle tabs', `(() => document.querySelector('#oracle-tab-chat') instanceof HTMLElement)()`, 25000);
    await page.clickSelector('#oracle-tab-chat');
    await page.waitFor('oracle chat', `(() => document.querySelector('#oracle-read-my-day') instanceof HTMLElement)()`, 25000);
    checkpoints.push('oracle-open');

    await page.clickSelector('#oracle-read-my-day');
    await page.waitFor(
      'oracle reading',
      `(() => {
        const body = document.body ? document.body.innerText : '';
        if (body.includes('Consultando os astros...')) return false;
        // O estado vazio some quando a leitura entra na conversa.
        return !body.includes('O Oráculo aguarda sua consulta');
      })()`,
      45000,
    );

    const oracleBody = await page.bodyText();
    const oracleFallback = [
      'O Oraculo esta em silencio momentaneo',
      'Sessao expirada no Oraculo',
      'Oraculo bloqueado para esta origem',
      'Oraculo indisponivel',
    ].find((marker) => oracleBody.includes(marker));
    if (oracleFallback) {
      throw new Error(`Oracle returned fallback message: ${oracleFallback}`);
    }
    checkpoints.push('oracle-response');
  });

  return { user, checkpoints };
}

async function runDeleteScenario() {
  const checkpoints = [];
  const user = await createTempUser({ label: 'delete-smoke', isPremium: true });
  const completedAt = new Date().toISOString();

  await updateProfile(user.client, user.userId, {
    onboarding_version: 'operational-v1',
    onboarding_started_at: completedAt,
    onboarding_completed_at: completedAt,
  });
  const session = await getSession(user.client);

  await withBrowser({ baseUrl, debugPort: 9333 }, async (page) => {
    await seedSession(page, session);
    checkpoints.push('login-ok');

    await page.clickSelector('#nav-settings');
    await page.waitFor('settings view', `(() => document.querySelector('#settings-container') instanceof HTMLElement && document.body.innerText.includes('Deletar Conta'))()`, 25000);
    checkpoints.push('settings-open');

    await page.evaluate(`(() => {
      window.prompt = () => 'DELETAR';
      return true;
    })()`);

    await page.clickText('Deletar Conta');
    await page.waitFor('delete confirmation modal', `(() => document.body && document.body.innerText.includes('Não há recuperação'))()`, 15000);
    await page.clickText('CONFIRMAR');
    checkpoints.push('delete-confirmed');

    // Antes isto exigia os campos do formulario de e-mail, que so existem depois
    // de clicar "ENTRAR COM E-MAIL". A tela de login ja aparecia; o teste e que
    // procurava dois passos adiante. O que importa aqui e estar deslogado.
    await page.waitFor(
      'login screen after deletion',
      `(() => document.querySelector('#login-google-button') instanceof HTMLElement)()`,
      45000,
    );
  });

  const verifier = createAnonClient();
  const signIn = await verifier.auth.signInWithPassword({ email: user.email, password: user.password });
  if (!signIn.error) {
    throw new Error('Deleted account still allows sign-in.');
  }

  return { user, checkpoints, signInError: signIn.error.message };
}

async function main() {
  const scenarios = [
    ['onboarding', runOnboardingScenario],
    ['oracle', runOracleScenario],
    ['deletion', runDeleteScenario],
  ];

  const summary = {
    ok: true,
    baseUrl,
    results: {},
  };

  for (const [label, runner] of scenarios) {
    try {
      const result = await runner();
      summary.results[label] = {
        ok: true,
        email: result.user.email,
        checkpoints: result.checkpoints,
        ...(result.signInError ? { signInError: result.signInError } : {}),
      };
    } catch (error) {
      summary.ok = false;
      summary.results[label] = {
        ok: false,
        error: error?.message || String(error),
        stack: error?.stack || null,
      };
    }
  }

  console.log(JSON.stringify(summary, null, 2));

  if (!summary.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('SMOKE_FAILED');
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
