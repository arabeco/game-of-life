/**
 * @typedef {Object} CycleGradeEvidence
 * @property {'scored'|'low_signal'} [measurementStatus]
 * @property {'stable'|'seeded'|'fallback'} [historyConfidence]
 * @property {number} [honoredLoadUnits]
 * @property {number} [planLoadRatio]
 * @property {{metaPts?: number}} [scoreBreakdown]
 */

/** @param {CycleGradeEvidence|null|undefined} fairness */
const qualifiesForTopGrade = (fairness) => !!fairness
    && fairness.measurementStatus === 'scored'
    && fairness.historyConfidence === 'stable'
    && (fairness.honoredLoadUnits || 0) >= 8
    && (fairness.scoreBreakdown?.metaPts || 0) >= 15
    && (fairness.planLoadRatio || 0) >= 0.55;

/**
 * One classifier for score calculation and presentation.
 * SS needs a measured perfect cycle; score-only legacy/average callers keep
 * their existing S fallback rather than inferring missing quality evidence.
 * @param {number} score
 * @param {CycleGradeEvidence|null} [fairness]
 */
/**
 * A frase e a cor pertencem a LETRA, e nao a quem calculou a letra.
 *
 * Elas moravam dentro do getScoreGrade, presas as faixas de score. Quem mostra a
 * nota nova na tela nao tinha de onde tirar a frase certa, e acabava pegando a do
 * score: um ciclo de 100% em cinco dias aparecia como "B" com "Plano honrado em
 * alto patamar. Raro e preciso." embaixo — a letra de uma regua, a frase de outra,
 * no mesmo cartao.
 */
const FALA_DA_NOTA = {
    SSS: { color: 'text-cyan-100', phrase: 'Ciclo absoluto. Cada compromisso foi honrado.' },
    SS: { color: 'text-rose-400', phrase: 'Excelência sustentada em um ciclo de alta exigência.' },
    S: { color: 'text-purple-400', phrase: 'Plano honrado em alto patamar. Raro e preciso.' },
    A: { color: 'text-amber-300', phrase: 'Execucao solida. O ciclo foi honrado.' },
    B: { color: 'text-yellow-400', phrase: 'Bom ciclo. Algumas brechas a selar.' },
    C: { color: 'text-orange-400', phrase: 'Metade do caminho. O que travou?' },
    D: { color: 'text-red-400', phrase: 'Ciclo comprometido. Revise o plano.' },
    E: { color: 'text-red-900', phrase: 'O plano existiu. A execucao, não.' },
};

/** A frase que acompanha uma nota. Quem mostra a letra mostra esta. */
export const falaDaNota = (nota) => FALA_DA_NOTA[nota] || FALA_DA_NOTA.E;

export const getScoreGrade = (score, fairness) => {
    const eligible = qualifiesForTopGrade(fairness);
    const comLetra = (grade) => ({ grade, ...falaDaNota(grade) });
    if (score === 100 && eligible) return comLetra('SS');
    if (score >= 92 && (!fairness || eligible)) return comLetra('S');
    if (score >= 84) return comLetra('A');
    if (score >= 70) return comLetra('B');
    if (score >= 55) return comLetra('C');
    if (score >= 40) return comLetra('D');
    return comLetra('E');
};

/* ==========================================================================
 * A NOTA DO CICLO — uma tabela so, tres colunas.
 *
 * Havia TRES reguas medindo a mesma coisa: o score de 100 pontos, a nota como
 * faixa desse score, e o bau como outra faixa com limites proprios. Um ciclo
 * real de 20/09/2026 fez 99 pontos, nota A e nenhum bau, sem nenhuma das tres
 * se explicar. Isso virou uma regua so: a nota sai daqui, e o bau sai da nota.
 *
 * O `getScoreGrade` acima continua vivo para quem so tem um score — a media
 * historica da placa de legado, por exemplo. Nota de CICLO vem daqui.
 *
 * A TABELA, desenhada com o Afonso em 06/10/2026. Cada placa pede tres coisas,
 * e a nota e a MAIS ALTA em que o ciclo cumpre a linha inteira — faltou uma
 * coluna, cai para a placa de baixo:
 *
 *   placa  conclusao  dias  horas
 *   SSS      100%      28+   200h  + impecavel
 *   SS        98%      28+   180h
 *   S         95%      14+    90h
 *   A         90%       7+    35h
 *   B         70%        -    20h
 *   C         50%        -    10h
 *   D         30%        -     5h
 *   E        o resto
 *
 * Cada coluna segura uma coisa diferente:
 *
 *   CONCLUSAO  sobre tudo o que foi prometido, sem a missao de temporada.
 *              Segura quem faz muito e deixa tudo pela metade: 45 horas com 50%
 *              e bronze.
 *   HORAS      o tamanho do ciclo. O metal cresce com o que foi FEITO — um ciclo
 *              perfeito de duas horas e um ciclo pequeno, e a cor diz isso.
 *   DIAS       o teto que ja existia, e continua proposital: uma semana para no
 *              A, o S pede duas, o SS pede o mes inteiro.
 *
 * A leitura que a tabela quer passar: B e bom, A e excelente, S e excepcional,
 * SS e quase perfeito, SSS e perfeito. O 98% do SS existe para ele ter degrau
 * proprio sem roubar o papel do SSS.
 *
 * Horas contam o que foi feito em qualquer acao que nao seja Livre, missao de
 * temporada inclusive: a missao fica fora da PORCENTAGEM, para o que faltar nela
 * nao virar divida, mas a hora trabalhada nela e real e conta como tamanho.
 * ========================================================================== */

const DEGRAUS = [
    {
        nota: 'SSS', conclusao: 100, dias: 28, horas: 200, impecavel: true,
        motivo: 'O SSS pede 28 dias, 200 horas, execução perfeita, todas as metas, todos os dias e as cinco áreas vivas.',
    },
    { nota: 'SS', conclusao: 98, dias: 28, horas: 180, motivo: 'O SS pede 28 dias e 180 horas honradas.' },
    { nota: 'S', conclusao: 95, dias: 14, horas: 90, motivo: 'O S pede 14 dias e 90 horas honradas.' },
    { nota: 'A', conclusao: 90, dias: 7, horas: 35, motivo: 'O A pede 7 dias de ciclo e 35 horas honradas.' },
    { nota: 'B', conclusao: 70, dias: 0, horas: 20, motivo: 'O B pede 20 horas honradas.' },
    { nota: 'C', conclusao: 50, dias: 0, horas: 10, motivo: 'O C pede 10 horas honradas.' },
    { nota: 'D', conclusao: 30, dias: 0, horas: 5, motivo: 'O D pede 5 horas honradas.' },
];

/** Da melhor para a pior. */
const ESCADA = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'E'];

/**
 * As frescuras do SSS — o que so a placa do topo cobra, alem da tabela.
 *
 * Acoes contadas uma a uma, e nao so a porcentagem: 119 de 120 arredonda para
 * 100% em mais de uma tela, e o SSS nao pode nascer de um arredondamento.
 */
const ehImpecavel = (e) => {
    const acoesPlanejadas = Number(e?.acoesPlanejadas) || 0;
    const acoesConcluidas = Number(e?.acoesConcluidas) || 0;
    const metasPlanejadas = Number(e?.metasPlanejadas) || 0;
    const metasSeladas = Number(e?.metasSeladas) || 0;
    const diasZerados = Number(e?.diasZerados) || 0;
    const areasAtivas = Number(e?.areasAtivas) || 0;
    return acoesPlanejadas > 0
        && acoesConcluidas === acoesPlanejadas
        && metasPlanejadas > 0
        && metasSeladas >= metasPlanejadas
        && diasZerados === 0
        && areasAtivas >= 5;
};

/** A placa que a conclusao SOZINHA alcancaria, ignorando dias, horas e extras. */
const notaPelaConclusao = (pct) => DEGRAUS.find((degrau) => pct >= degrau.conclusao)?.nota || 'E';

/**
 * A nota de um ciclo, com o motivo quando o PORTE segurou alguma coisa.
 *
 * "Porte" e tudo o que nao e execucao: dias, horas e as frescuras do SSS. Quando
 * a conclusao sozinha levaria mais alto do que a nota que ficou, quem segurou foi
 * o porte — e o motivo e o que a placa logo acima pedia. Quando foi a propria
 * conclusao que parou a nota, nao ha motivo: explicar um limite que nao encostou
 * em nada manda a pessoa perseguir horas quando o que faltou foi fazer.
 */
export const notaDoCiclo = (evidencia) => {
    const pct = Math.max(0, Math.min(100, Number(evidencia?.conclusaoPct) || 0));
    const dias = Number(evidencia?.dias) || 0;
    const horas = Number(evidencia?.horas) || 0;
    const impecavel = ehImpecavel(evidencia);

    const cumpre = (degrau) => pct >= degrau.conclusao
        && dias >= degrau.dias
        && horas >= degrau.horas
        && (!degrau.impecavel || impecavel);

    const nota = DEGRAUS.find(cumpre)?.nota || 'E';
    const conquistada = notaPelaConclusao(pct);
    const limitada = ESCADA.indexOf(conquistada) < ESCADA.indexOf(nota);
    const placaDeCima = limitada ? DEGRAUS.find((degrau) => degrau.nota === ESCADA[ESCADA.indexOf(nota) - 1]) : null;

    return {
        nota,
        notaPelaConclusao: conquistada,
        motivoDoTeto: placaDeCima ? placaDeCima.motivo : null,
    };
};

const BAU_DA_NOTA = {
    SSS: 'Lendário',
    SS: 'Lendário',
    S: 'Épico',
    A: 'Raro',
    B: 'Incomum',
    C: 'Comum',
    D: null,
    E: null,
};

/** O bau sai da nota, e so dela. Sem EXP, sem dias, sem segunda regua. */
export const bauDaNota = (nota) => BAU_DA_NOTA[nota] ?? null;

/** Preserve the measured grade carried by the legacy payload in every output.
 * @param {{score: number, grade?: string|null}} cycle
 */
export const getLegacyCycleGrade = (cycle) => {
    const inferred = getScoreGrade(cycle.score);
    const grade = cycle.grade?.trim().toUpperCase();
    // A frase vinha junto com a cor, e aqui so a cor era trocada: a letra gravada
    // aparecia com a frase da letra INFERIDA do score. Trocar a letra troca as
    // duas coisas que falam por ela.
    return grade && Object.hasOwn(FALA_DA_NOTA, grade)
        ? { ...inferred, grade, ...falaDaNota(grade) }
        : inferred;
};
