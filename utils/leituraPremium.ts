/**
 * A LEITURA PREMIUM (28/10/2026, com o Afonso).
 *
 * O painel comum diz como o dia foi. A leitura do Premium diz o que o dia
 * significa: o ciclo contra o seu historico, para onde ele vai no ritmo de
 * agora, o seu horario e o seu dia mais fortes, a arena que subiu, a que caiu,
 * a que ficou esquecida e a sua presenca.
 *
 * Regra de ouro: cada item so aparece quando ha dado para sustentar. Item sem
 * dado nao vira frase de enchimento; simplesmente nao aparece. A presenca e a
 * unica que sempre aparece, porque zero tambem e informacao.
 *
 * Nada aqui cobra: abaixo da media e informacao, nao falta.
 */

export type FeitoDaLeitura = {
    /** Dia operacional, YYYY-MM-DD. */
    data: string;
    /** Hora local em que foi concluida (0-23), quando se sabe. */
    hora?: number | null;
    arenaId: string;
    arenaNome: string;
};

export type CicloDaLeitura = {
    feitas: number;
    planejadas: number;
    diasPassados: number;
    diasTotais: number;
    /** Execucao do ciclo em curso, 0-100. */
    execucaoAtual?: number | null;
    /** Mediana da execucao dos ciclos fechados, 0-100. */
    medianaHistorica?: number | null;
    ciclosFechados?: number;
};

export type ItemDaLeitura = {
    id: 'ciclo' | 'projecao' | 'horario' | 'semana' | 'alta' | 'queda' | 'esquecida' | 'presenca';
    titulo: string;
    valor: string;
    detalhe: string;
    tom: 'bom' | 'alerta' | 'normal';
};

const DIAS_DA_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const deslocar = (data: string, dias: number): string => {
    const d = new Date(`${data}T12:00:00`);
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
};

const umDecimal = (valor: number) => valor.toFixed(1).replace('.', ',');

const faixaDoDia = (hora: number): string => {
    if (hora < 6) return 'Madrugada';
    if (hora < 12) return 'Manhã';
    if (hora < 18) return 'Tarde';
    return 'Noite';
};

const FAIXA_EM_HORAS: Record<string, string> = {
    Madrugada: '0h às 6h', Manhã: '6h às 12h', Tarde: '12h às 18h', Noite: '18h à meia-noite',
};

export const leituraPremiumDoDia = (entrada: {
    feitos: FeitoDaLeitura[];
    hoje: string;
    /** As arenas com acao ativa (para achar a esquecida). */
    arenas: { id: string; nome: string }[];
    ciclo: CicloDaLeitura | null;
}): ItemDaLeitura[] => {
    const { feitos, hoje, arenas, ciclo } = entrada;
    const itens: ItemDaLeitura[] = [];
    const desde = (dias: number) => deslocar(hoje, -(dias - 1));
    const naJanela = (dias: number) => feitos.filter((feito) => feito.data >= desde(dias) && feito.data <= hoje);

    // 1. O ciclo contra o seu historico.
    if (ciclo && typeof ciclo.execucaoAtual === 'number' && typeof ciclo.medianaHistorica === 'number' && (ciclo.ciclosFechados || 0) >= 2) {
        const delta = Math.round(ciclo.execucaoAtual - ciclo.medianaHistorica);
        itens.push({
            id: 'ciclo',
            titulo: 'Este ciclo',
            valor: `${Math.round(ciclo.execucaoAtual)}%`,
            detalhe: `Sua mediana em ${ciclo.ciclosFechados} ciclos é ${Math.round(ciclo.medianaHistorica)}%. ${delta >= 5 ? 'Está acima do seu padrão.' : delta <= -5 ? 'Está abaixo do seu padrão; vale ver se a carga mudou.' : 'Está no seu padrão.'}`,
            tom: delta >= 5 ? 'bom' : delta <= -5 ? 'alerta' : 'normal',
        });
    }

    // 2. Para onde o ciclo vai no ritmo de agora.
    if (ciclo && ciclo.planejadas > 0 && ciclo.diasPassados >= 2 && ciclo.diasTotais > ciclo.diasPassados) {
        const projetadas = (ciclo.feitas / ciclo.diasPassados) * ciclo.diasTotais;
        const pct = Math.round(Math.min(100, (projetadas / ciclo.planejadas) * 100));
        const faltam = ciclo.diasTotais - ciclo.diasPassados;
        itens.push({
            id: 'projecao',
            titulo: 'No ritmo de agora',
            valor: `${pct}%`,
            detalhe: `É onde o ciclo fecha se os próximos ${faltam} ${faltam === 1 ? 'dia' : 'dias'} forem como os de até aqui.`,
            tom: pct >= 90 ? 'bom' : pct < 60 ? 'alerta' : 'normal',
        });
    }

    // 3. O horario mais forte (ultimos 30 dias).
    const comHora = naJanela(30).filter((feito) => typeof feito.hora === 'number');
    if (comHora.length >= 8) {
        const porFaixa = new Map<string, number>();
        for (const feito of comHora) porFaixa.set(faixaDoDia(feito.hora as number), (porFaixa.get(faixaDoDia(feito.hora as number)) || 0) + 1);
        const [faixa, quantas] = [...porFaixa.entries()].sort((a, b) => b[1] - a[1])[0];
        itens.push({
            id: 'horario',
            titulo: 'Seu horário mais forte',
            valor: faixa,
            detalhe: `${Math.round((quantas / comHora.length) * 100)}% do que você fez nos últimos 30 dias saiu entre ${FAIXA_EM_HORAS[faixa]}.`,
            tom: 'normal',
        });
    }

    // 4. O dia da semana mais forte (ultimas 4 semanas, com pelo menos 2 de dado).
    const quatroSemanas = naJanela(28);
    const datas = [...new Set(feitos.map((feito) => feito.data))].sort();
    if (quatroSemanas.length >= 8 && datas.length > 0 && datas[0] <= desde(14)) {
        const porDia = new Array(7).fill(0);
        for (const feito of quatroSemanas) porDia[new Date(`${feito.data}T12:00:00`).getDay()] += 1;
        const melhor = porDia.indexOf(Math.max(...porDia));
        itens.push({
            id: 'semana',
            titulo: 'Seu dia mais forte',
            valor: DIAS_DA_SEMANA[melhor],
            detalhe: `${umDecimal(porDia[melhor] / 4)} ações em média nas últimas quatro semanas.`,
            tom: 'normal',
        });
    }

    // 5 e 6. A arena que subiu e a que caiu (esta semana contra a anterior).
    const estaSemana = new Map<string, { nome: string; n: number }>();
    const anterior = new Map<string, { nome: string; n: number }>();
    for (const feito of feitos) {
        const alvo = feito.data >= desde(7) && feito.data <= hoje ? estaSemana
            : feito.data >= deslocar(hoje, -13) && feito.data < desde(7) ? anterior : null;
        if (!alvo) continue;
        const atual = alvo.get(feito.arenaId) || { nome: feito.arenaNome, n: 0 };
        atual.n += 1;
        alvo.set(feito.arenaId, atual);
    }
    const ids = new Set([...estaSemana.keys(), ...anterior.keys()]);
    const movimento = [...ids].map((id) => ({
        nome: (estaSemana.get(id) || anterior.get(id))!.nome,
        agora: estaSemana.get(id)?.n || 0,
        antes: anterior.get(id)?.n || 0,
    }));
    const alta = movimento.filter((m) => m.agora - m.antes >= 2 && m.agora >= 3).sort((a, b) => (b.agora - b.antes) - (a.agora - a.antes))[0];
    if (alta) {
        itens.push({ id: 'alta', titulo: 'Em alta', valor: alta.nome, detalhe: `${alta.agora} esta semana, contra ${alta.antes} na anterior.`, tom: 'bom' });
    }
    const queda = movimento.filter((m) => m.antes - m.agora >= 2 && m.antes >= 3).sort((a, b) => (b.antes - b.agora) - (a.antes - a.agora))[0];
    if (queda) {
        itens.push({ id: 'queda', titulo: 'Em queda', valor: queda.nome, detalhe: `${queda.agora} esta semana, contra ${queda.antes} na anterior.`, tom: 'alerta' });
    }

    // 7. A arena esquecida: com acao, e nada nos ultimos 7 dias.
    const tocadas = new Set(naJanela(7).map((feito) => feito.arenaId));
    // A que ja esta em queda nao entra de novo aqui: o mesmo nome em dois cartoes
    // diz a mesma coisa duas vezes.
    const esquecida = arenas.find((arena) => !tocadas.has(arena.id) && arena.nome !== queda?.nome);
    if (esquecida && feitos.length > 0) {
        itens.push({ id: 'esquecida', titulo: 'Esquecida', valor: esquecida.nome, detalhe: 'Nada feito nesta arena nos últimos 7 dias.', tom: 'alerta' });
    }

    // 8. Presenca: dias com alguma coisa feita.
    const dias7 = new Set(naJanela(7).map((feito) => feito.data)).size;
    const dias30 = new Set(naJanela(30).map((feito) => feito.data)).size;
    itens.push({
        id: 'presenca',
        titulo: 'Presença',
        valor: `${dias7} de 7 dias`,
        detalhe: `${dias30} de 30 nos últimos 30 dias tiveram alguma coisa feita.`,
        tom: dias7 >= 5 ? 'bom' : dias7 <= 2 ? 'alerta' : 'normal',
    });

    return itens;
};

/** A sugestao para o proximo ciclo, a partir do que este ciclo mostrou. */
export const sugestaoParaOProximoCiclo = (metricas: {
    executionRatePct?: number | null;
    totalDays: number;
    daysWithoutCompletion?: number | null;
}): { valor: string; nota: string } => {
    const execucao = Number(metricas.executionRatePct ?? 0);
    const vazios = Math.max(0, Number(metricas.daysWithoutCompletion || 0));
    if (execucao >= 95) {
        return { valor: '+10% de carga', nota: 'Você cumpriu quase tudo. Dá para pedir um pouco mais no próximo.' };
    }
    if (execucao < 60) {
        return { valor: 'Planeje menos', nota: 'O plano ficou maior que o tempo. Um ciclo menor e cumprido vale mais que um grande pela metade.' };
    }
    if (metricas.totalDays > 0 && vazios / metricas.totalDays >= 0.3) {
        return { valor: 'Dias leves', nota: `Foram ${vazios} dias sem nada feito. Deixe esses dias mais leves no próximo ciclo.` };
    }
    return { valor: 'Mesma carga', nota: 'O ritmo está certo. Mantenha e aumente só onde sobrou fôlego.' };
};
