const TOTAL_QUESTIONS = 7;
const QUIZ_MODE = "free";

const freeCatalog = [
  {
    id: "fundamentos-calistenia",
    title: "Fundamentos da Calistenia",
    type: "Pr&aacute;tica",
    duration: 7,
    description: "For&ccedil;a funcional com base limpa e progress&atilde;o curta.",
  },
  {
    id: "hiit-express",
    title: "HIIT Express",
    type: "Pr&aacute;tica",
    duration: 14,
    description: "Queima r&aacute;pida com protocolo objetivo e progress&atilde;o de intensidade.",
  },
  {
    id: "bussola-nutricional",
    title: "B&uacute;ssola Nutricional",
    type: "Aprendizado",
    duration: 7,
    description: "Clareza alimentar com base simples e aplic&aacute;vel.",
  },
  {
    id: "manha-energetica",
    title: "Manh&atilde; Energ&eacute;tica",
    type: "Pr&aacute;tica",
    duration: 7,
    description: "Ativa&ccedil;&atilde;o f&iacute;sica, energia e ritmo biol&oacute;gico.",
  },
  {
    id: "foco-basico",
    title: "Foco B&aacute;sico",
    type: "Pr&aacute;tica",
    duration: 7,
    description: "Corta ru&iacute;do, organiza o campo e devolve foco execut&aacute;vel.",
  },
  {
    id: "manutencao-base",
    title: "Manuten&ccedil;&atilde;o da Base",
    type: "Manuten&ccedil;&atilde;o",
    duration: 7,
    description: "Reset de ambiente, ordem operacional e higiene do espa&ccedil;o.",
  },
  {
    id: "motor-produtividade",
    title: "Motor de Produtividade",
    type: "Pr&aacute;tica",
    duration: 7,
    description: "Execu&ccedil;&atilde;o curta com dire&ccedil;&atilde;o clara.",
  },
  {
    id: "diario-bordo",
    title: "Di&aacute;rio de Bordo",
    type: "Aprendizado",
    duration: 7,
    description: "Reflex&atilde;o dirigida para clareza interna e organiza&ccedil;&atilde;o mental.",
  },
  {
    id: "radar-financeiro",
    title: "Radar Financeiro",
    type: "Manuten&ccedil;&atilde;o",
    duration: 7,
    description: "Visibilidade financeira simples para parar de operar no escuro.",
  },
  {
    id: "sincronia-rede",
    title: "Sincronia de Rede",
    type: "Pr&aacute;tica",
    duration: 7,
    description: "Contato intencional e reconex&atilde;o com a rede real.",
  },
];

const questionTwoOptionsByArea = {
  A: [
    { key: "A", title: "Como eu me movo e treino", subtitle: "Treino, for&ccedil;a, intensidade e consist&ecirc;ncia corporal." },
    { key: "B", title: "Como eu me alimento", subtitle: "Escolhas alimentares, clareza nutricional e rela&ccedil;&atilde;o com comida." },
    { key: "C", title: "Como eu recupero e durmo", subtitle: "Sono, recupera&ccedil;&atilde;o e energia restaurada." },
    { key: "D", title: "Como eu me sinto dia a dia", subtitle: "Disposi&ccedil;&atilde;o, ritmo e sensa&ccedil;&atilde;o corporal geral." },
  ],
  B: [
    { key: "A", title: "Como eu foco e tomo decis&otilde;es", subtitle: "Clareza, prioridade e presen&ccedil;a mental." },
    { key: "B", title: "Como eu organizo meu espa&ccedil;o e rotina", subtitle: "Ambiente, sistema e estrutura operacional." },
  ],
  C: [
    { key: "A", title: "Como eu executo no dia a dia", subtitle: "A&ccedil;&atilde;o concreta, ritmo e produ&ccedil;&atilde;o real." },
    { key: "B", title: "Como eu planejo e estrategio", subtitle: "Vis&atilde;o, organiza&ccedil;&atilde;o e pensamento de estrutura." },
  ],
  D: [
    { key: "A", title: "Como eu controlo e construo", subtitle: "Controle, dire&ccedil;&atilde;o e constru&ccedil;&atilde;o financeira." },
  ],
  E: [
    { key: "A", title: "Como eu me conecto e me fa&ccedil;o presente", subtitle: "V&iacute;nculo, presen&ccedil;a e contato intencional." },
  ],
  F: [
    { key: "A", title: "Como eu me entendo", subtitle: "Autopercep&ccedil;&atilde;o, leitura interna e clareza do eu." },
    { key: "B", title: "Como eu construo quem quero ser", subtitle: "Identidade deliberada, dire&ccedil;&atilde;o e prop&oacute;sito." },
  ],
};

const questions = [
  {
    id: "p1",
    title: "Quando voc&ecirc; para e olha para a sua vida agora — onde est&aacute; o maior peso?",
    subtitle: "N&atilde;o o que voc&ecirc; acha mais importante. O que est&aacute; pesando de verdade hoje.",
    options: [
      { key: "A", title: "No meu corpo", subtitle: "Energia baixa, sa&uacute;de negligenciada, corpo que n&atilde;o acompanha a mente" },
      { key: "B", title: "Na minha cabe&ccedil;a", subtitle: "Pensamentos acumulados, foco quebrado, ambiente mental pesado" },
      { key: "C", title: "No que eu produzo", subtitle: "Metas que n&atilde;o saem do papel, rotina que n&atilde;o rende, trabalho empacado" },
      { key: "D", title: "No meu dinheiro", subtitle: "Controle inexistente, gastos que somem, futuro financeiro sem clareza" },
      { key: "E", title: "Nas minhas rela&ccedil;&otilde;es", subtitle: "V&iacute;nculos rasos, presen&ccedil;a dividida, comunica&ccedil;&atilde;o que n&atilde;o chega" },
      { key: "F", title: "Em quem eu estou me tornando", subtitle: "Identidade turva, prop&oacute;sito sem forma, sensa&ccedil;&atilde;o de estar &agrave; deriva" },
    ],
  },
  {
    id: "p2",
    title: "O que dentro dessa &aacute;rea d&oacute;i mais quando voc&ecirc; para para pensar?",
    subtitle: "As op&ccedil;&otilde;es se adaptam ao que voc&ecirc; escolheu antes.",
    getOptions: (answers) => questionTwoOptionsByArea[answers.p1] || [],
  },
  {
    id: "p3",
    title: "Quando voc&ecirc; aprende algo novo, o que faz mais sentido pra voc&ecirc;?",
    subtitle: "N&atilde;o tem certo ou errado — &eacute; sobre como sua mente funciona melhor.",
    options: [
      { key: "A", title: "Jogar direto na pr&aacute;tica", subtitle: "Fazer, errar, ajustar. Teoria s&oacute; depois de sentir na pele" },
      { key: "B", title: "Entender antes de agir", subtitle: "Ler, entender o porqu&ecirc;, ent&atilde;o aplicar com consci&ecirc;ncia" },
      { key: "C", title: "Sustentar o que j&aacute; funciona", subtitle: "N&atilde;o preciso de novidade — preciso de consist&ecirc;ncia no que j&aacute; sei" },
      { key: "D", title: "Criar e expressar", subtitle: "Aprendo produzindo — escrita, forma, express&atilde;o s&atilde;o meu caminho" },
    ],
  },
  {
    id: "p4",
    title: "Quanto tempo voc&ecirc; consegue honestamente comprometer com um ciclo agora?",
    subtitle: "Seja real. Um ciclo curto conclu&iacute;do vale mais do que um longo abandonado.",
    options: [
      { key: "A", title: "7 dias", subtitle: "Uma semana. Curto, intenso, sem desculpa" },
      { key: "B", title: "14 dias", subtitle: "Duas semanas. Tempo suficiente para progress&atilde;o real" },
      { key: "C", title: "21 dias ou mais", subtitle: "Tr&ecirc;s semanas. Transforma&ccedil;&atilde;o mais profunda, exige mais comprometimento" },
    ],
  },
  {
    id: "p5",
    title: "Como est&aacute; o seu ritmo hoje, honestamente?",
    subtitle: "Isso ajuda o sistema a calibrar o n&iacute;vel de exig&ecirc;ncia da sua campanha.",
    options: [
      { key: "A", title: "No caos", subtitle: "Cada dia &eacute; diferente do anterior, nada tem forma ainda" },
      { key: "B", title: "Tentando, mas quebrando", subtitle: "Tenho inten&ccedil;&atilde;o de rotina mas ela n&atilde;o segura" },
      { key: "C", title: "Est&aacute;vel, mas estagnado", subtitle: "Tenho rotina mas sinto que n&atilde;o estou evoluindo" },
      { key: "D", title: "Em movimento", subtitle: "Estou bem — mas quero subir o n&iacute;vel" },
    ],
  },
  {
    id: "p6",
    title: "O que geralmente te tira do caminho quando voc&ecirc; come&ccedil;a algo?",
    subtitle: "N&atilde;o o que voc&ecirc; gostaria de dizer — o que realmente acontece.",
    options: [
      { key: "A", title: "Perco o foco no meio do caminho", subtitle: "Come&ccedil;o bem, mas disperso depois de alguns dias" },
      { key: "B", title: "A vida bate e eu desisto", subtitle: "Eventos externos quebram meu ritmo e eu n&atilde;o volto" },
      { key: "C", title: "N&atilde;o sei por onde come&ccedil;ar de verdade", subtitle: "A inten&ccedil;&atilde;o existe mas a a&ccedil;&atilde;o concreta trava" },
      { key: "D", title: "Fico num ciclo de planejar e n&atilde;o executar", subtitle: "Organizo tudo, mas na hora de fazer, travo" },
    ],
  },
  {
    id: "p7",
    title: "O que te faz sentir que valeu a pena no final de um ciclo?",
    subtitle: "A &uacute;ltima pergunta. O que importa pra voc&ecirc; quando olha para tr&aacute;s.",
    options: [
      { key: "A", title: "Ver o quanto avancei em rela&ccedil;&atilde;o a quem eu era", subtitle: "Progresso acumulado, hist&oacute;rico, compara&ccedil;&atilde;o com o passado" },
      { key: "B", title: "Ter cumprido o que eu prometi pra mim mesmo", subtitle: "Consist&ecirc;ncia, ader&ecirc;ncia, n&atilde;o ter quebrado o compromisso" },
      { key: "C", title: "Sentir que mudei algo concreto na minha vida", subtitle: "Resultado tang&iacute;vel, mudan&ccedil;a real, algo diferente que posso apontar" },
      { key: "D", title: "Ter constru&iacute;do algo que vai durar al&eacute;m do ciclo", subtitle: "H&aacute;bito instalado, sistema criado, legado que continua" },
    ],
  },
];

const typePreferenceByQuestionThree = {
  A: "Pr&aacute;tica",
  B: "Aprendizado",
  C: "Manuten&ccedil;&atilde;o",
  D: "Express&atilde;o",
};

const durationPreferenceByQuestionFour = {
  A: 7,
  B: 14,
  C: 21,
};

const catalogById = Object.fromEntries(freeCatalog.map((entry) => [entry.id, entry]));

const state = {
  index: 0,
  answers: {},
  currentSelection: null,
  result: null,
};

const quizFrame = document.getElementById("quizFrame");
const progressFill = document.getElementById("progressFill");
const headerIndex = document.getElementById("headerIndex");
const headerProgress = document.getElementById("headerProgress");
const catalogModal = document.getElementById("catalogModal");
const catalogGrid = document.getElementById("catalogGrid");
const catalogClose = document.getElementById("catalogClose");

function renderCatalog() {
  catalogGrid.innerHTML = freeCatalog.map((codex) => `
    <article class="catalog-card">
      <h3>${codex.title}</h3>
      <p>${codex.description}</p>
      <div class="catalog-tags">
        <span class="catalog-tag">${codex.type}</span>
        <span class="catalog-tag">${codex.duration} dias</span>
        <span class="catalog-tag">Gratuito</span>
      </div>
    </article>
  `).join("");
}

function openCatalog() {
  renderCatalog();
  catalogModal.classList.add("is-open");
  catalogModal.setAttribute("aria-hidden", "false");
}

function closeCatalog() {
  catalogModal.classList.remove("is-open");
  catalogModal.setAttribute("aria-hidden", "true");
}

function getQuestion(questionIndex) {
  return questions[questionIndex];
}

function getQuestionOptions(question, answers) {
  if (typeof question.getOptions === "function") {
    return question.getOptions(answers);
  }
  return question.options || [];
}

function updateHeader() {
  const current = Math.min(state.index + 1, TOTAL_QUESTIONS);
  progressFill.style.width = `${(current / TOTAL_QUESTIONS) * 100}%`;
  headerIndex.textContent = `${String(current).padStart(2, "0")} / 07`;
  headerProgress.textContent = `Pergunta ${current} de 7`;
}

function buildQuestionScreen(question, answers) {
  const options = getQuestionOptions(question, answers);
  const selected = state.answers[question.id] || state.currentSelection;
  const screen = document.createElement("section");
  screen.className = "screen";

  screen.innerHTML = `
    <div class="screen-meta">
      <div class="screen-index">${String(state.index + 1).padStart(2, "0")} / 07</div>
      <div>${QUIZ_MODE === "free" ? "Filtro inicial: gratuitos" : "Cat&aacute;logo completo"}</div>
    </div>

    <div class="question-copy">
      <h1 class="question-title">${question.title}</h1>
      <p class="question-subtitle">${question.subtitle}</p>
    </div>

    <div class="options ${options.length <= 4 ? "is-single-column" : ""}">
      ${options.map((option) => `
        <button class="option-card ${selected === option.key ? "is-active" : ""}" type="button" data-option-key="${option.key}">
          <span class="option-letter">${option.key}</span>
          <span>
            <span class="option-main">${option.title}</span>
            <span class="option-sub">${option.subtitle || ""}</span>
          </span>
        </button>
      `).join("")}
    </div>

    <div class="screen-footer">
      <button class="continue-button" type="button" ${selected ? "" : "hidden"}>Continuar</button>
    </div>
  `;

  const optionButtons = Array.from(screen.querySelectorAll("[data-option-key]"));
  const continueButton = screen.querySelector(".continue-button");

  optionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      optionButtons.forEach((node) => node.classList.remove("is-active"));
      button.classList.add("is-active");
      state.currentSelection = button.getAttribute("data-option-key");
      continueButton.hidden = false;
    });
  });

  continueButton.addEventListener("click", () => {
    state.answers[question.id] = state.currentSelection;
    state.currentSelection = null;

    if (state.index === TOTAL_QUESTIONS - 1) {
      state.result = resolveResult(state.answers);
      transitionTo(buildResultScreen(state.result));
      return;
    }

    state.index += 1;
    transitionTo(buildQuestionScreen(getQuestion(state.index), state.answers));
  });

  return screen;
}

function buildResultScreen(result) {
  const screen = document.createElement("section");
  screen.className = "screen result-screen";

  screen.innerHTML = `
    <div class="screen-meta">
      <div class="screen-index">07 / 07</div>
      <div>Resultado</div>
    </div>

    <div>
      <h1 class="result-title">Sua campanha foi identificada</h1>
      <p class="result-subtitle">Com base nas suas respostas, o sistema encontrou a campanha ideal para o seu momento.</p>
      <div class="result-codex">${result.title}</div>
      <div class="result-pillars">
        <span class="result-pill">${result.type}</span>
        <span class="result-pill">${result.duration} dias</span>
        <span class="result-pill">Gratuito</span>
      </div>
      <p class="result-meta">${result.description}</p>
    </div>

    ${result.upgradeNote ? `<div class="result-note">${result.upgradeNote}</div>` : ""}

    <div class="result-actions">
      <button class="result-primary" id="installCodexButton" type="button">Instalar Campanha</button>
      <button class="result-secondary" id="viewCatalogButton" type="button">Ver cat&aacute;logo completo</button>
      <div class="result-status" id="resultStatus"></div>
    </div>
  `;

  screen.querySelector("#installCodexButton").addEventListener("click", () => {
    const status = screen.querySelector("#resultStatus");
    status.innerHTML = `Instala&ccedil;&atilde;o simulada para <strong>${result.title}</strong>. Conecte este CTA ao fluxo real da campanha quando quiser plugar.`;
  });

  screen.querySelector("#viewCatalogButton").addEventListener("click", openCatalog);
  return screen;
}

function transitionTo(nextScreen) {
  updateHeader();
  const currentScreen = quizFrame.firstElementChild;

  if (!currentScreen) {
    nextScreen.classList.add("is-entering");
    quizFrame.appendChild(nextScreen);
    requestAnimationFrame(() => nextScreen.classList.remove("is-entering"));
    return;
  }

  nextScreen.classList.add("is-entering");
  quizFrame.appendChild(nextScreen);

  requestAnimationFrame(() => {
    currentScreen.classList.add("is-leaving");
    nextScreen.classList.remove("is-entering");
  });

  window.setTimeout(() => {
    if (currentScreen.parentElement === quizFrame) {
      quizFrame.removeChild(currentScreen);
    }
  }, 340);
}

function resolveBaseCandidates(answers) {
  if (answers.p1 === "A" && answers.p2 === "A") return [catalogById["fundamentos-calistenia"], catalogById["hiit-express"]];
  if (answers.p1 === "A" && answers.p2 === "B") return [catalogById["bussola-nutricional"]];
  if (answers.p1 === "A" && (answers.p2 === "C" || answers.p2 === "D")) return [catalogById["manha-energetica"]];
  if (answers.p1 === "B" && answers.p2 === "A") return [catalogById["foco-basico"]];
  if (answers.p1 === "B" && answers.p2 === "B") {
    return (answers.p5 === "A" || answers.p5 === "B")
      ? [catalogById["manutencao-base"]]
      : [catalogById["foco-basico"]];
  }
  if (answers.p1 === "C" && answers.p2 === "A") return [catalogById["motor-produtividade"]];
  if (answers.p1 === "C" && answers.p2 === "B") return [catalogById["diario-bordo"]];
  if (answers.p1 === "D") return [catalogById["radar-financeiro"]];
  if (answers.p1 === "E") return [catalogById["sincronia-rede"]];
  if (answers.p1 === "F") return [catalogById["diario-bordo"]];
  return [catalogById["foco-basico"]];
}

function resolveResult(answers) {
  let candidates = resolveBaseCandidates(answers);
  const preferredType = typePreferenceByQuestionThree[answers.p3];
  const desiredDuration = durationPreferenceByQuestionFour[answers.p4] || 7;

  if (candidates.length > 1 && preferredType) {
    const filteredByType = candidates.filter((candidate) => candidate.type === preferredType);
    if (filteredByType.length) {
      candidates = filteredByType;
    }
  }

  const perfectDuration = candidates.find((candidate) => candidate.duration === desiredDuration);
  const sevenDayFallback = candidates.find((candidate) => candidate.duration === 7) || candidates[0];
  const chosen = perfectDuration || sevenDayFallback;

  return {
    ...chosen,
    upgradeNote: !perfectDuration && desiredDuration > chosen.duration
      ? "Quer esse ciclo em 14 ou 21 dias? Dispon&iacute;vel na loja."
      : "",
  };
}

function startQuiz() {
  updateHeader();
  transitionTo(buildQuestionScreen(getQuestion(state.index), state.answers));
}

catalogClose.addEventListener("click", closeCatalog);
catalogModal.addEventListener("click", (event) => {
  if (event.target === catalogModal) {
    closeCatalog();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && catalogModal.classList.contains("is-open")) {
    closeCatalog();
  }
});

startQuiz();
