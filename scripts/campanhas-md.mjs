/**
 * DOS RASCUNHOS PARA O CATALOGO (26/11/2026).
 *
 * As 16 campanhas foram escritas por inteiro em 27/10 (docs/campanhas/conteudo),
 * mas o banco ficou com os modelos antigos, de 2 a 4 acoes, e 11 deles mandavam
 * "ler a aula" com o texto vazio. Este arquivo le cada MD e devolve o modelo no
 * formato que o app instala (levels -> actions), e o modo CLI escreve a migracao.
 *
 * Regras do formato (as mesmas do instalador em GameContext):
 * - `dias` = dias da fase; a agenda da campanha usa so eles.
 * - `repetitions` = quantos dias: a fase so fecha quando cada acao cumpre as dela.
 * - Acao de um dia so e `Compromisso`; de varios, `Ação Recorrente`.
 * - `difficulty` vai de 1 a 3 (o app corta o resto).
 * - `briefing` e o texto da aula, com [[page]] entre as paginas.
 * - `preFlight` e o checklist.
 *
 * Uso: node scripts/campanhas-md.mjs  (reescreve a migracao das aulas)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PASTA = new URL('../docs/campanhas/conteudo/', import.meta.url);

/** Campanha do catalogo (id) <- rascunho. Mesmos ids do mapa das capas. */
export const CAMPANHAS = [
    { arquivo: '01-sono-de-elite.md', id: '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c01' },
    { arquivo: '02-detox-digital.md', id: '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c06' },
    { arquivo: '03-controle-de-impulsos.md', id: '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c04' },
    { arquivo: '04-presenca-real.md', id: '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c05' },
    { arquivo: '05-mente-sem-armadilhas.md', id: '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c02' },
    { arquivo: '06-expressao-criativa.md', id: '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d10' },
    { arquivo: '07-circulo-forte.md', id: '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d08' },
    { arquivo: '09-estoicismo-aplicado.md', id: '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c08' },
    { arquivo: '10-despertar-de-ferro.md', id: '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a01' },
    { arquivo: '11-financas-com-intencao.md', id: '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d09' },
    { arquivo: '12-maestria-financeira.md', id: '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e05' },
    { arquivo: '13-lideranca-sem-cargo.md', id: '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e04' },
    { arquivo: '14-construcao-de-identidade.md', id: '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a05' },
    { arquivo: '15-corpo-de-elite.md', id: '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e03' },
    { arquivo: '16-foco-blindado.md', id: '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a03' },
    // 08-faxina-total: ainda nao tem linha no catalogo.
];

/**
 * Acoes escritas em uma linha so no MD ("igual a anterior, mas..."). Herdam da
 * ultima acao com o mesmo icone; aqui vai o que muda no texto.
 */
const AJUSTES = {
    '15-corpo-de-elite.md#11': {
        description: 'Agachamento, flexão, remada, ponte de glúteo e prancha: 4 séries de cada, parando 2 ou 3 repetições antes da falha.',
        checklist: ['Aquecimento de 5 minutos', '4 séries de cada movimento', 'Nenhuma dor aguda'],
    },
    '15-corpo-de-elite.md#12': {
        description: '45 minutos de caminhada rápida, corrida leve ou bicicleta, num ritmo em que dá para conversar com esforço.',
    },
    '15-corpo-de-elite.md#19': {
        description: 'Agachamento, flexão, remada, ponte de glúteo e prancha: 4 séries de cada, descendo em 3 segundos e com pausa de 1 segundo embaixo.',
        checklist: ['Aquecimento de 5 minutos', '4 séries lentas de cada movimento', 'Nenhuma dor aguda'],
    },
    '15-corpo-de-elite.md#20': {
        description: 'Intervalos na caminhada, corrida ou bicicleta: 5 minutos leve, depois 6 vezes (1 minuto forte + 2 minutos leve) e 7 minutos leve para fechar.',
    },
    '15-corpo-de-elite.md#21': {
        description: '20 a 30 minutos de mobilidade de quadril, ombros e coluna, num ritmo leve. É o dia de o corpo se recuperar sem ficar parado.',
    },
};

const AULA_PADRAO = 'Leia a aula na aba Anotação e conclua no fim da leitura.';
const ICONES_DE_TREINO = new Set(['🏋️', '🏋', '🧘', '🏃']);

const minutos = (hhmm) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : undefined;
};

/** "[1, 2, 3]", "[1 a 7]", "D1 a D5", "D1, D2" -> [1, 2, ...]. */
export const lerDias = (texto) => {
    const limpo = String(texto || '').replace(/[\[\]D]/g, '');
    const dias = [];
    for (const parte of limpo.split(',')) {
        const intervalo = /(\d+)\s*a\s*(\d+)/.exec(parte);
        if (intervalo) {
            for (let d = Number(intervalo[1]); d <= Number(intervalo[2]); d += 1) dias.push(d);
        } else if (/\d/.test(parte)) {
            dias.push(Number(parte.trim()));
        }
    }
    return [...new Set(dias.filter((d) => Number.isInteger(d) && d >= 1))].sort((a, b) => a - b);
};

const momentoDoDia = (inicio) => {
    if (typeof inicio !== 'number') return 'morning';
    if (inicio < 12 * 60) return 'morning';
    if (inicio < 17 * 60) return 'afternoon';
    if (inicio < 20 * 60 + 30) return 'evening';
    return 'night';
};

const energia = (momento, dificuldade) => {
    const m = /energia\s+(baixa|média|media|alta)/i.exec(momento || '');
    if (m) return { baixa: 'low', média: 'medium', media: 'medium', alta: 'high' }[m[1].toLowerCase()];
    return dificuldade <= 1 ? 'low' : dificuldade === 2 ? 'medium' : 'high';
};

const semMarkdown = (texto) => texto.replace(/\*\*([^*]+)\*\*/g, '$1').trim();

/** Le um rascunho e devolve { titulo, descricao, duracaoDias, levels }. */
export const converterCampanha = (md, arquivo = '') => {
    const linhas = md.replace(/\r\n/g, '\n').split('\n');
    const ficha = {};
    const fasesDaFicha = {};
    const secoesLivres = {};
    const tabela = {};
    const fases = [];
    let faseAtual = null;
    let acaoAtual = null;
    let secao = null;
    let noTexto = false;
    let noChecklist = false;

    const novaFase = (numero) => {
        faseAtual = { numero, acoes: [] };
        fases.push(faseAtual);
    };

    for (let i = 0; i < linhas.length; i += 1) {
        const linha = linhas[i];

        if (noTexto) {
            if (/^```\s*$/.test(linha)) { noTexto = false; continue; }
            acaoAtual.texto.push(linha);
            continue;
        }

        const h2 = /^## (.+)$/.exec(linha);
        if (h2) {
            acaoAtual = null;
            noChecklist = false;
            const fase = /^Fase (\d+)\b/.exec(h2[1]);
            if (fase) { secao = 'fase'; novaFase(Number(fase[1])); continue; }
            if (/^As ações/i.test(h2[1])) { secao = 'fase'; novaFase(1); continue; }
            if (/^Ficha/i.test(h2[1])) { secao = 'ficha'; continue; }
            secao = h2[1].trim();
            secoesLivres[secao] = [];
            continue;
        }

        if (secao === 'ficha') {
            const campo = /^- \*\*([^*]+):\*\*\s*(.*)$/.exec(linha);
            if (!campo) continue;
            const fase = /^Fase (\d+)$/.exec(campo[1]);
            if (fase) {
                const m = /^"([^"]+)"\s*—\s*(.*)$/.exec(campo[2]);
                fasesDaFicha[Number(fase[1])] = m ? { titulo: m[1], descricao: m[2].trim() } : { titulo: campo[2], descricao: '' };
            } else {
                ficha[campo[1]] = campo[2].trim();
            }
            continue;
        }

        if (secao && secao !== 'fase') {
            secoesLivres[secao].push(linha);
            continue;
        }

        if (!faseAtual) continue;

        const linhaDaTabela = /^\|\s*(\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/.exec(linha);
        if (linhaDaTabela) {
            tabela[Number(linhaDaTabela[1])] = {
                tipo: linhaDaTabela[3].trim(),
                dias: lerDias(linhaDaTabela[4]),
                inicio: minutos(linhaDaTabela[5]),
                duracao: Number(String(linhaDaTabela[6]).trim()),
            };
            continue;
        }

        const h3 = /^### (\d+)\.\s+(\S+)\s+(.+)$/.exec(linha);
        if (h3) {
            noChecklist = false;
            const [nomeCru, ...resto] = h3[3].split(' — ');
            const curta = resto.join(' — ');
            acaoAtual = {
                numero: Number(h3[1]),
                icone: h3[2],
                nome: nomeCru.trim(),
                texto: [],
                checklist: [],
                curta: Boolean(curta),
            };
            if (curta) {
                const pedacos = curta.split(' · ').map((p) => p.trim());
                for (const pedaco of pedacos) {
                    if (/^dias:/.test(pedaco)) acaoAtual.dias = lerDias(pedaco.slice(5));
                    else if (/^\d{1,2}:\d{2}$/.test(pedaco)) acaoAtual.inicio = minutos(pedaco);
                    else if (/^\d+ min$/.test(pedaco)) acaoAtual.duracao = Number(pedaco.replace(' min', ''));
                    else acaoAtual.nota = pedaco;
                }
            }
            faseAtual.acoes.push(acaoAtual);
            continue;
        }

        if (!acaoAtual) continue;

        if (/^```text\s*$/.test(linha)) { noTexto = true; noChecklist = false; continue; }

        const descricao = /^- \*\*description:\*\*\s*(.+)$/.exec(linha);
        if (descricao) { acaoAtual.descricao = descricao[1].trim(); acaoAtual.curta = false; noChecklist = false; continue; }

        // "- **dias:** ..." e tambem "- Igual à fase 1. **dias:** ..." (herda o resto).
        if (/^- .*\*\*dias:\*\*/.test(linha)) {
            noChecklist = false;
            acaoAtual.curta = !/^- \*\*dias:\*\*/.test(linha) && !acaoAtual.descricao;
            for (const pedaco of linha.slice(linha.indexOf('**dias:**')).split(' · ')) {
                const m = /^\*\*([^*]+):\*\*\s*(.+)$/.exec(pedaco.trim());
                if (!m) continue;
                if (m[1] === 'dias') acaoAtual.dias = lerDias(m[2]);
                if (m[1] === 'horário') acaoAtual.inicio = minutos(m[2]);
                if (m[1] === 'duração') acaoAtual.duracao = Number(m[2]);
                if (m[1] === 'dificuldade') acaoAtual.dificuldade = Number(m[2]);
                if (m[1] === 'momento') acaoAtual.momento = m[2];
            }
            continue;
        }

        if (/^- \*\*checklist:\*\*/.test(linha)) { noChecklist = true; continue; }
        const item = /^\s{2,}- (.+)$/.exec(linha);
        if (noChecklist && item) { acaoAtual.checklist.push(item[1].trim()); continue; }
        // Linha de apoio solta sob a acao: entra no fim da descricao.
        const apoio = /^- (?!\*\*)(.+)$/.exec(linha);
        if (apoio) { acaoAtual.apoio = [...(acaoAtual.apoio || []), semMarkdown(apoio[1])]; noChecklist = false; continue; }
        if (linha.trim() && !/^\s/.test(linha)) noChecklist = false;
    }

    // O treino descrito uma vez no MD vira o texto das acoes de treino sem aula propria.
    const treino = Object.entries(secoesLivres).find(([nome]) => /treino/i.test(nome));
    const textoDoTreino = treino
        ? semMarkdown(treino[1].join('\n').replace(/^- /gm, '— ')).replace(/\n{3,}/g, '\n\n')
        : '';

    const anteriores = [];
    const levels = fases.map((fase) => {
        const daFicha = fasesDaFicha[fase.numero] || { titulo: `Fase ${fase.numero}`, descricao: '' };
        const actions = fase.acoes.map((acao) => {
            const linhaTab = tabela[acao.numero] || {};
            const ajuste = AJUSTES[`${arquivo}#${acao.numero}`] || {};
            // Sem descricao propria: herda da ultima acao com o mesmo icone.
            const mae = acao.curta || !acao.descricao ? [...anteriores].reverse().find((a) => a.icone === acao.icone && a.descricao) : undefined;

            const dias = acao.dias?.length ? acao.dias : linhaTab.dias || [];
            const duracao = acao.duracao || linhaTab.duracao || mae?.duracao || 15;
            const inicio = acao.inicio ?? linhaTab.inicio ?? mae?.inicio;
            const ehAula = acao.icone === '📘' || /^aula$/i.test(linhaTab.tipo || '');
            let descricao = ajuste.description || acao.descricao || mae?.descricao || (ehAula ? AULA_PADRAO : '');
            if (!ajuste.description && !acao.descricao && mae?.descricao && mae.duracao !== duracao) {
                descricao = descricao.replace(new RegExp(`\\b${mae.duracao} minutos\\b`), `${duracao} minutos`);
            }
            if (acao.apoio?.length) descricao = [descricao, ...acao.apoio].filter(Boolean).join(' ');
            const checklist = ajuste.checklist || (acao.checklist.length ? acao.checklist : mae?.checklist || []);
            const dificuldade = acao.dificuldade || mae?.dificuldade || (ehAula ? 1 : 2);
            const texto = acao.texto.join('\n').trim()
                || (ICONES_DE_TREINO.has(acao.icone) && textoDoTreino ? textoDoTreino : '');

            const pronta = { icone: acao.icone, descricao, checklist, dificuldade, duracao, inicio };
            anteriores.push(pronta);

            const action = {
                icon: acao.icone,
                name: acao.nome,
                description: descricao,
                duration: duracao,
                difficulty: Math.min(3, Math.max(1, Math.round(dificuldade))),
                actionType: dias.length > 1 ? 'Ação Recorrente' : 'Compromisso',
                repetitions: Math.max(1, dias.length),
                dias,
                context: { timeOfDay: momentoDoDia(inicio), energyLevel: energia(acao.momento, dificuldade) },
            };
            if (typeof inicio === 'number') action.scheduledStartTime = inicio;
            if (texto) action.briefing = texto;
            if (checklist.length) action.preFlight = checklist;
            return action;
        });
        return {
            level: fase.numero,
            title: `Fase ${fase.numero}: ${daFicha.titulo}`,
            description: daFicha.descricao,
            actions,
        };
    });

    const duracaoDias = Number(/(\d+)\s*dias/.exec(ficha['Duração'] || '')?.[1]) || levels.length * 7;
    return {
        titulo: ficha['Nome'],
        descricao: ficha['Descrição na loja'],
        duracaoDias,
        levels,
    };
};

export const lerCampanha = ({ arquivo }) => converterCampanha(readFileSync(new URL(arquivo, PASTA), 'utf8'), arquivo);

/**
 * As duas campanhas antigas que sairam da vitrine (Voz e Presenca, Criatividade
 * em Sprint) seguem com quem ja tem; so a aula vazia ganha texto.
 */
export const AULAS_SOLTAS = [
    {
        id: '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c07',
        fase: 0,
        acao: 0,
        texto: [
            'Algumas pessoas falam pouco e todo mundo presta atenção. Outras falam muito e ninguém lembra do que disseram. A diferença quase nunca é a voz bonita ou o vocabulário. É clareza.',
            '',
            'Quem é ouvido sabe o que quer dizer antes de abrir a boca. Quem não é, vai descobrindo enquanto fala: dá voltas, repete, explica o contexto do contexto, e quando chega ao ponto a atenção do outro já foi embora.',
            '[[page]]',
            'Três hábitos fazem alguém ser ouvido:',
            '',
            '— Começar pelo ponto. Primeiro a conclusão ("acho que devemos adiar"), depois o porquê. Quem começa pelo porquê obriga o outro a adivinhar onde a conversa vai chegar.',
            '— Uma ideia por vez. Três assuntos na mesma fala viram nenhum. Se são três, diga que são três e vá um por um.',
            '— Parar quando terminou. O silêncio depois de uma frase clara tem mais força do que mais uma explicação.',
            '[[page]]',
            'A prática da próxima fase é simples: antes de uma conversa importante do dia, escreva o que quer dizer em duas frases. Se não couber em duas, você ainda não sabe o que quer dizer, e é melhor descobrir no papel do que na frente dos outros.',
            '',
            'Não é para decorar. É para chegar na conversa sabendo onde ela termina.',
        ].join('\n'),
    },
    {
        id: '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c10',
        fase: 0,
        acao: 0,
        texto: [
            'Esperar a inspiração é o jeito mais comum de não criar nada. Ela aparece de vez em quando, sem aviso, e quase nunca na hora em que dá para sentar e fazer.',
            '',
            'Quem cria com frequência não espera. Senta num horário marcado, com um tempo curto, e começa mesmo sem vontade. A vontade costuma chegar depois dos primeiros minutos, não antes.',
            '[[page]]',
            'Prazo curto ajuda por um motivo simples: não dá tempo de julgar. Com duas horas pela frente, a cabeça gasta a primeira meia hora decidindo se a ideia é boa o bastante. Com quinze minutos, só dá para fazer.',
            '',
            'Por isso a regra do sprint é produzir sem filtrar: escrever, rabiscar, listar, gravar. Apagar e escolher fica para depois. Uma sessão com dez ideias ruins e uma boa é uma sessão que funcionou.',
            '[[page]]',
            'Na próxima fase, todo dia: um problema criativo aberto (um texto, um nome, um desenho, uma solução), cronômetro em 15 minutos, e só parar quando ele tocar.',
            '',
            'No fim, uma linha na anotação: o que saiu de mais interessante. É dessa lista que vem o material bom.',
        ].join('\n'),
    },
];

const TAG = '$modelo$';
const comoSql = (valor) => {
    const json = JSON.stringify(valor);
    if (json.includes(TAG)) throw new Error('O texto tem o marcador da migracao');
    return `${TAG}${json}${TAG}::jsonb`;
};
const textoSql = (valor) => `'${String(valor).replace(/'/g, "''")}'`;

export const montarMigracao = () => {
    const partes = [
        '-- AS AULAS DAS CAMPANHAS (26/11/2026).',
        '--',
        '-- As 16 campanhas foram escritas por inteiro em 27/10 (docs/campanhas/conteudo),',
        '-- mas o banco ficou com os modelos antigos, de 2 a 4 acoes, e 11 deles mandavam',
        '-- "ler a aula" com o texto vazio. Aqui entram os modelos completos das 15 da',
        '-- vitrine: cada aula com o seu texto, os dias de cada acao na fase, o checklist',
        '-- e as repeticoes iguais aos dias (a fase so fecha quando cada acao cumpre as dela).',
        '-- Voz e Presenca e Criatividade em Sprint, fora da vitrine, ganham so o texto',
        '-- da aula que faltava.',
        '--',
        '-- Preco, capa, tags e o resto do modelo ficam como estao. Quem ja instalou uma',
        '-- campanha segue com as acoes que tem: o modelo so vale para a proxima instalacao.',
        '--',
        '-- Gerado por scripts/campanhas-md.mjs a partir dos MDs. Para mudar uma aula,',
        '-- mude o MD e gere de novo. Pode ser rodado de novo sem estrago.',
        '',
        'begin;',
        '',
    ];
    for (const campanha of CAMPANHAS) {
        const c = lerCampanha(campanha);
        partes.push(
            `-- ${c.titulo} (${campanha.arquivo})`,
            'update public.codex_catalog set',
            `  title = ${textoSql(c.titulo)},`,
            `  description = ${textoSql(c.descricao)},`,
            `  duration_days = ${c.duracaoDias},`,
            `  template = template || jsonb_build_object(`,
            `    'title', ${textoSql(c.titulo)},`,
            `    'description', ${textoSql(c.descricao)},`,
            `    'durationDays', ${c.duracaoDias},`,
            `    'levels', ${comoSql(c.levels)})`,
            `where id = '${campanha.id}';`,
            '',
        );
    }
    for (const solta of AULAS_SOLTAS) {
        partes.push(
            `update public.codex_catalog`,
            `set template = jsonb_set(template, '{levels,${solta.fase},actions,${solta.acao},briefing}', to_jsonb(${textoSql(solta.texto)}::text))`,
            `where id = '${solta.id}' and coalesce(template #>> '{levels,${solta.fase},actions,${solta.acao},briefing}', '') = '';`,
            '',
        );
    }
    partes.push(
        'commit;',
        '',
        '-- CONFERENCIA (so le): nenhuma campanha com aula prometida e texto vazio.',
        'select c.title, count(*) as aulas_vazias',
        'from public.codex_catalog c,',
        "     jsonb_array_elements(c.template -> 'levels') l,",
        "     jsonb_array_elements(l -> 'actions') a",
        "where coalesce(trim(a ->> 'briefing'), '') = '' and (a ->> 'description') ~* '^\\s*leia (a|o) (aula|texto)'",
        'group by c.title;',
        '',
    );
    return partes.join('\n');
};

export const MIGRACAO = new URL('../supabase/migrations/20261126150000_aulas_das_campanhas.sql', import.meta.url);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    writeFileSync(MIGRACAO, montarMigracao());
    console.log(`ok - ${fileURLToPath(MIGRACAO)}`);
}
