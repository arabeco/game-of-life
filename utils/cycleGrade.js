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
    SS: { color: 'text-rose-400', phrase: 'Ciclo perfeito. Excelência em cada compromisso.' },
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
 * A NOTA DO CICLO — uma regua so.
 *
 * Havia TRES medindo a mesma coisa. O score de 100 pontos somava cinco
 * criterios; a nota era uma faixa desse score; e o bau era outra faixa, com
 * limites proprios de EXP e de dias. Cada uma com trava sua, nenhuma na tela.
 *
 * Um ciclo real de 20/09/2026: 99 pontos, nota A, nenhum bau. Tres regras
 * diferentes pegaram a pessoa de uma vez, e nenhuma se explicou.
 *
 * Agora a nota sai da PORCENTAGEM DE CONCLUSAO, e o PORTE do ciclo diz ate onde
 * ela sobe. O bau sai da nota, direto.
 *
 * O `getScoreGrade` acima continua vivo: ele atende quem tem um score e mais
 * nada — a media historica da placa de legado, por exemplo. Nota de CICLO vem
 * daqui.
 * ========================================================================== */

/** Da melhor para a pior. A ordem importa: o teto e um corte nesta lista. */
const ESCADA = ['SS', 'S', 'A', 'B', 'C', 'D', 'E'];

/** O que a execucao conquistou, antes de qualquer teto. */
const notaPelaConclusao = (pct) => {
    if (pct >= 100) return 'SS';
    if (pct >= 95) return 'S';
    if (pct >= 85) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 30) return 'D';
    return 'E';
};

/**
 * O teto que o PORTE do ciclo autoriza.
 *
 * Sem ele, uma semana perfeita e um mes perfeito valeriam o mesmo, e o bau
 * viraria torneira: bastaria encadear ciclos de tres dias.
 *
 * As portas do SS nao sao so tempo, porque tempo sozinho se espera. Ele cobra
 * que NADA tenha falhado — acoes, metas, dias — e que as cinco areas da vida
 * estejam vivas. Um mes impecavel, e nao um mes comprido.
 */
const tetoDoPorte = (e) => {
    const dias = Number(e?.dias) || 0;
    const horas = Number(e?.horas) || 0;
    const metasPlanejadas = Number(e?.metasPlanejadas) || 0;
    const metasSeladas = Number(e?.metasSeladas) || 0;
    const diasZerados = Number(e?.diasZerados) || 0;
    const areasAtivas = Number(e?.areasAtivas) || 0;

    const impecavel = metasPlanejadas > 0
        && metasSeladas >= metasPlanejadas
        && diasZerados === 0
        && areasAtivas >= 5;

    if (dias >= 28 && horas >= 180 && impecavel) return { teto: 'SS', motivo: null };
    if (dias >= 28 && horas >= 180) {
        return { teto: 'S', motivo: 'O SS pede um ciclo sem nenhuma falha e com as cinco áreas vivas.' };
    }
    if (dias >= 14) return { teto: 'S', motivo: 'O SS pede 28 dias e 180 horas honradas.' };
    if (dias >= 7) return { teto: 'A', motivo: 'O S pede 14 dias de ciclo.' };
    return { teto: 'B', motivo: 'O A pede 7 dias de ciclo.' };
};

/**
 * A nota de um ciclo, com o motivo do teto quando ele segurou alguma coisa.
 *
 * O motivo NAO vai para a tela — ficou decidido em 21/09 que a pessoa nao
 * precisa saber por que nao tirou S. Ele existe para quem depura e para o teste:
 * uma nota limitada tem de conseguir dizer o que a limitou, mesmo que ninguem
 * pergunte.
 */
export const notaDoCiclo = (evidencia) => {
    const pct = Math.max(0, Math.min(100, Number(evidencia?.conclusaoPct) || 0));
    const conquistada = notaPelaConclusao(pct);
    const { teto, motivo } = tetoDoPorte(evidencia);

    const limitada = ESCADA.indexOf(conquistada) < ESCADA.indexOf(teto);
    const nota = limitada ? teto : conquistada;

    return {
        nota,
        notaPelaConclusao: conquistada,
        teto,
        // So fala do teto quando ele REALMENTE cortou. Explicar um limite que
        // nao encostou em nada e ruido: manda a pessoa perseguir dias quando o
        // que faltou foi execucao.
        motivoDoTeto: limitada ? motivo : null,
    };
};

const BAU_DA_NOTA = {
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
