/**
 * OS PADROES DA PESSOA, EM TEXTO, PARA O ORACULO COM IA (02/11/2026).
 *
 * A IA decide o que dizer; o app so entrega os dados. Esta funcao pega as
 * linhas cruas do banco (ciclos, acoes, arenas, tarefas agendadas) e devolve
 * um resumo curto, com os numeros ja contados:
 *
 *   - as arenas, a area da vida de cada uma e a maestria (0 a 10) de cada area;
 *   - cada ciclo fechado (os 3 ultimos): planejado → feito por area, do
 *     relatorio gravado no fecho (as tarefas que sobram no banco nao servem:
 *     o que nao foi feito some ao fechar, e a conta dava 100% sempre);
 *   - o ciclo aberto ATE HOJE, com o dia em que esta: contar o ciclo inteiro
 *     contra o feito ate hoje fazia um ciclo de um dia parecer parado;
 *   - sem ciclo: os ultimos 28 dias por arena;
 *   - em que faixa de horario e em que dia da semana a pessoa cumpre;
 *   - a faixa de horario em que cada arena costuma ficar;
 *   - como a pessoa usa o tempo no planner: horas por area na semana, a que
 *     horas o dia costuma comecar e acabar, e os proximos 7 dias;
 *   - o que tem hoje no planner.
 *
 * Acao Livre fica de fora das contas: ela nao tem alvo.
 * Pura: sem rede e sem banco, para dar para testar.
 */

export type TarefaCrua = { action_id: string; date: string; start_time: number | null; completed: boolean; duration?: number | null };
export type AcaoCrua = { id: string; arena_id: string | null; name: string; action_type: string | null; repetitions?: number | null; source_quest_id?: string | null; origin_codex_id?: string | null };
export type ArenaCrua = { id: string; name: string; asset_id?: string | null; completed_at?: string | null };
export type NivelCru = { asset_id: string; level: number | null };

const NOME_DA_AREA: Record<string, string> = {
  proposito: 'Propósito', relacoes: 'Relações', trabalho: 'Trabalho e estudos', lazer: 'Lazer e bem-estar', saude: 'Saúde',
};
export type CicloCru = { name: string | null; start_date: string; end_date: string; report_data: unknown };

const FAIXAS = [
  { nome: 'de manhã (4h às 12h)', de: 4, ate: 12 },
  { nome: 'à tarde (12h às 18h)', de: 12, ate: 18 },
  { nome: 'à noite (18h às 21h)', de: 18, ate: 21 },
  { nome: 'depois das 21h', de: 21, ate: 28 },
];
const DIAS_DA_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MINIMO_PARA_PADRAO = 5;

const pct = (feitas: number, total: number) => (total > 0 ? Math.round((feitas / total) * 100) : 0);

/** "a, b e c": a lista do jeito que se fala. */
const emLista = (nomes: string[]) => (nomes.length <= 1 ? nomes.join('') : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`);

/**
 * O MAIS E O MENOS, COM EMPATE (03/11/2026). Escolher um so quando tres
 * empatam em 100% fazia a IA dizer "a tarde e o seu horario mais forte"
 * para quem cumpre tudo de manha, de tarde e de noite.
 */
const extremos = <T,>(itens: T[], nome: (item: T) => string, valor: (item: T) => number) => {
  const valores = itens.map(valor);
  const maior = Math.max(...valores);
  const menor = Math.min(...valores);
  return {
    mais: `${emLista(itens.filter((i) => valor(i) === maior).map(nome))} (${maior}%)`,
    menos: `${emLista(itens.filter((i) => valor(i) === menor).map(nome))} (${menor}%)`,
    empateGeral: maior === menor,
  };
};

const somarDias = (data: string, dias: number) => {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

const diasEntre = (inicio: string, fim: string) =>
  Math.round((Date.parse(`${fim}T12:00:00Z`) - Date.parse(`${inicio}T12:00:00Z`)) / 86400000) + 1;

/** A faixa do horario, no dia do Glyph: de 0h a 4h ainda e "depois das 21h". */
const faixaDoHorario = (minutos: number | null) => {
  if (minutos == null || !Number.isFinite(minutos)) return null;
  let hora = Math.floor(minutos / 60) % 24;
  if (hora < 4) hora += 24;
  return FAIXAS.find((faixa) => hora >= faixa.de && hora < faixa.ate) || null;
};

const horaLegivel = (minutos: number | null) => {
  if (minutos == null || !Number.isFinite(minutos)) return 'sem horário';
  const m = ((minutos % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** "PROPÓSITO & ESPIRITUALIDADE" (o nome gravado no relatorio) vira "Propósito". */
const nomeDaArea = (bruto: string) => {
  const t = bruto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (t.includes('proposito')) return NOME_DA_AREA.proposito;
  if (t.includes('relac')) return NOME_DA_AREA.relacoes;
  if (t.includes('trabalho') || t.includes('estud')) return NOME_DA_AREA.trabalho;
  if (t.includes('lazer') || t.includes('bem-estar')) return NOME_DA_AREA.lazer;
  if (t.includes('saude')) return NOME_DA_AREA.saude;
  return NOME_DA_AREA[t] || bruto;
};

/** O planejado e o feito por area, do relatorio gravado (snake ou camel). */
const progressoDoRelatorio = (relatorio: unknown): string => {
  const r = (relatorio || {}) as Record<string, unknown>;
  const lista = (r.asset_progress || r.assetProgress) as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(lista)) return '';
  return lista
    .map((item) => {
      const planejado = Number(item.total_planned ?? item.totalPlanned ?? 0);
      const feito = Number(item.total_completed ?? item.totalCompleted ?? 0);
      const nome = nomeDaArea(String(item.asset || item.asset_id || item.assetId || '').trim());
      return { nome, planejado, feito };
    })
    .filter((a) => a.nome && a.planejado > 0)
    .map((a) => `${a.nome} ${a.planejado} → ${a.feito} (${pct(a.feito, a.planejado)}%)`)
    .join(' · ');
};

/** O que mais o relatorio do ciclo guardou: nota, execucao, sequencia, habitos. */
const destaquesDoRelatorio = (relatorio: unknown): string => {
  const r = (relatorio || {}) as Record<string, unknown>;
  const m = ((r.metrics || {}) as Record<string, unknown>);
  const h = ((r.highlight || {}) as Record<string, unknown>);
  const partes: string[] = [];
  if (typeof r.grade === 'string' && r.grade) partes.push(`nota ${r.grade}`);
  const execucao = Number(m.execution_rate_pct ?? m.executionRatePct);
  if (Number.isFinite(execucao) && execucao > 0) partes.push(`execução ${Math.round(execucao)}%`);
  const sequencia = Number(m.max_streak ?? m.maxStreak);
  if (Number.isFinite(sequencia) && sequencia > 1) partes.push(`maior sequência ${sequencia} dias`);
  const maisRepetida = String(h.most_repeated_action ?? h.mostRepeatedAction ?? '').trim();
  const vezes = Number(h.most_repeated_action_count ?? h.mostRepeatedActionCount);
  if (maisRepetida) partes.push(`ação mais repetida ${maisRepetida}${Number.isFinite(vezes) && vezes > 0 ? ` (${vezes}x)` : ''}`);
  const habitos = (m.habitos_consolidados ?? m.habitosConsolidados) as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(habitos) && habitos.length) partes.push(`hábitos consolidados: ${habitos.map((x) => String(x.nome || '')).filter(Boolean).join(', ')}`);
  return partes.join(' · ');
};

export const montarPadroes = (entrada: {
  hoje: string;
  agora?: string;
  ciclos: CicloCru[];
  acoes: AcaoCrua[];
  arenas: ArenaCrua[];
  tarefas: TarefaCrua[];
  niveis?: NivelCru[];
}): string => {
  const { hoje } = entrada;
  const nomeDaArena = new Map(entrada.arenas.map((arena) => [arena.id, arena.name]));
  const acaoPorId = new Map(entrada.acoes.map((acao) => [acao.id, acao]));
  const medidas = entrada.tarefas.filter((t) => {
    const acao = acaoPorId.get(t.action_id);
    return acao && acao.action_type !== 'Livre' && acao.arena_id && nomeDaArena.has(acao.arena_id);
  });
  const arenaDa = (t: TarefaCrua) => nomeDaArena.get(acaoPorId.get(t.action_id)!.arena_id!)!;

  const porArena = (tarefas: TarefaCrua[]) => {
    const contas = new Map<string, { agendadas: number; feitas: number }>();
    tarefas.forEach((t) => {
      const c = contas.get(arenaDa(t)) || { agendadas: 0, feitas: 0 };
      c.agendadas += 1;
      if (t.completed) c.feitas += 1;
      contas.set(arenaDa(t), c);
    });
    return [...contas.entries()]
      .sort((a, b) => b[1].agendadas - a[1].agendadas)
      .map(([nome, c]) => `${nome} ${c.agendadas} → ${c.feitas} (${pct(c.feitas, c.agendadas)}%)`)
      .join(' · ');
  };

  const linhas: string[] = [];
  if (entrada.agora) linhas.push(`agora: ${entrada.agora}`);

  // As arenas e a area de cada uma; a maestria por area; as areas sem arena.
  if (entrada.arenas.length) {
    // Arena so de acoes Livres tem horas no planner, mas nao entra no planejado:
    // sem a marca, a IA dizia que a area "quase nao aparece".
    const soLivre = (arenaId: string) => {
      const daArena = entrada.acoes.filter((a) => a.arena_id === arenaId);
      return daArena.length > 0 && daArena.every((a) => a.action_type === 'Livre');
    };
    linhas.push(`arenas: ${entrada.arenas.map((a) => `${a.name} (${NOME_DA_AREA[a.asset_id || ''] || 'sem área'}${soLivre(a.id) ? ', só ações Livres: registro, sem meta' : ''})`).join(' · ')}`);
  }
  const niveis = (entrada.niveis || []).filter((n) => NOME_DA_AREA[n.asset_id] && Number.isFinite(Number(n.level)));
  if (niveis.length) {
    linhas.push(`maestria por área (0 a 10, a pessoa se avalia): ${niveis.map((n) => `${NOME_DA_AREA[n.asset_id]} ${n.level}`).join(' · ')}`);
  }
  const areasComArena = new Set(entrada.arenas.map((a) => a.asset_id));
  const semArena = Object.keys(NOME_DA_AREA).filter((id) => !areasComArena.has(id)).map((id) => NOME_DA_AREA[id]);
  if (entrada.arenas.length && semArena.length) linhas.push(`áreas sem nenhuma arena: ${semArena.join(', ')}`);

  // Ciclos fechados, do mais antigo para o mais novo.
  const fechados = entrada.ciclos
    .filter((c) => c.report_data != null && c.start_date && c.end_date)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .slice(0, 3)
    .reverse();
  if (fechados.length) {
    linhas.push('ciclos anteriores (planejado → feito, por área, do relatório do ciclo):');
    fechados.forEach((c) => {
      const doRelatorio = progressoDoRelatorio(c.report_data);
      const destaques = destaquesDoRelatorio(c.report_data);
      linhas.push(`- ${c.name || 'Ciclo'} (${diasEntre(c.start_date, c.end_date)} dias): ${doRelatorio || 'sem detalhe por área'}${destaques ? ` · ${destaques}` : ''}`);
    });
    // A META FOLGADA (03/11/2026): area que fecha 100% em todo ciclo e o gancho
    // do coach para provocar ("domina ou a meta ficou pequena?"). Sem o fato
    // nos dados ele so elogiava.
    const porAreaEmTodos = new Map<string, number[]>();
    fechados.forEach((c) => {
      const lista = ((c.report_data as Record<string, unknown>)?.asset_progress || (c.report_data as Record<string, unknown>)?.assetProgress) as Array<Record<string, unknown>> | undefined;
      (Array.isArray(lista) ? lista : []).forEach((item) => {
        const planejado = Number(item.total_planned ?? item.totalPlanned ?? 0);
        if (planejado <= 0) return;
        const nome = nomeDaArea(String(item.asset || '').trim());
        porAreaEmTodos.set(nome, [...(porAreaEmTodos.get(nome) || []), pct(Number(item.total_completed ?? item.totalCompleted ?? 0), planejado)]);
      });
    });
    const folgadas = [...porAreaEmTodos.entries()].filter(([, v]) => v.length >= 2 && v.every((x) => x >= 100)).map(([nome]) => nome);
    if (folgadas.length) {
      linhas.push(`áreas em 100% em todos os ${fechados.length} ciclos fechados: ${emLista(folgadas)} — ou a pessoa já domina, ou a meta ficou folgada`);
    }

    // A area que mais e a que menos cumpriu no ultimo ciclo fechado, ja comparadas.
    const ultimo = fechados[fechados.length - 1];
    const lista = ((ultimo.report_data as Record<string, unknown>)?.asset_progress || (ultimo.report_data as Record<string, unknown>)?.assetProgress) as Array<Record<string, unknown>> | undefined;
    const areas = (Array.isArray(lista) ? lista : [])
      .map((item) => ({ nome: nomeDaArea(String(item.asset || '').trim()), planejado: Number(item.total_planned ?? item.totalPlanned ?? 0), feito: Number(item.total_completed ?? item.totalCompleted ?? 0) }))
      .filter((a) => a.nome && a.planejado > 0)
      .sort((a, b) => pct(b.feito, b.planejado) - pct(a.feito, a.planejado));
    if (areas.length >= 2) {
      const [mais, menos] = [areas[0], areas[areas.length - 1]];
      linhas.push(`no último ciclo, a área que mais cumpriu foi ${mais.nome} (${pct(mais.feito, mais.planejado)}%) e a que menos cumpriu foi ${menos.nome} (${pct(menos.feito, menos.planejado)}%)`);
    }
  }

  // O ciclo aberto, ou os ultimos 28 dias.
  const aberto = entrada.ciclos.find((c) => c.report_data == null && c.start_date <= hoje && c.end_date >= hoje);
  if (aberto) {
    const dia = diasEntre(aberto.start_date, hoje);
    const total = diasEntre(aberto.start_date, aberto.end_date);
    const ateHoje = medidas.filter((t) => t.date >= aberto.start_date && t.date <= hoje);
    const depois = medidas.filter((t) => t.date > hoje && t.date <= aberto.end_date).length;
    // O CICLO PELO PROMETIDO (02/11/2026, com o Afonso). O planner mostra so o
    // que ela agendou; o que conta e o que prometeu em cada arena (as
    // repeticoes de cada acao pessoal) e quantas por dia faltam para fechar.
    // Mesma regra do app (utils/cycleCommitment.ts): fora Livre, missao,
    // campanha e arena ja concluida; feito conta ate o prometido.
    const arenaAtiva = new Map(entrada.arenas.filter((a) => !a.completed_at).map((a) => [a.id, a.name]));
    const pessoais = entrada.acoes.filter((a) => a.action_type !== 'Livre' && !a.source_quest_id && !a.origin_codex_id && a.arena_id && arenaAtiva.has(a.arena_id));
    const feitasPorAcao = new Map<string, number>();
    entrada.tarefas.forEach((t) => {
      if (t.completed && t.date >= aberto.start_date && t.date <= hoje) feitasPorAcao.set(t.action_id, (feitasPorAcao.get(t.action_id) || 0) + 1);
    });
    // O RITMO E DE CADA ACAO (02/11/2026, com o Afonso): 28 meditacoes num
    // ciclo de 28 dias e "todo dia"; 12 treinos e "3 por semana". Nada de
    // media geral de acoes por dia, que nao diz nada a ninguem.
    const ritmoDaAcao = (prometido: number) => {
      const porDia = prometido / total;
      if (porDia >= 1.9) return `${Math.round(porDia)} por dia`;
      if (porDia >= 0.9) return 'todo dia';
      const porSemana = Math.max(1, Math.round(porDia * 7));
      return porSemana >= 7 ? 'todo dia' : `${porSemana} por semana`;
    };
    const comeco = dia <= 3;
    const restam = Math.max(1, total - dia + 1);
    linhas.push(`ciclo atual: dia ${dia} de ${total} (faltam ${restam} dias, contando hoje).${comeco ? ' É começo de ciclo: o que conta agora é pegar ritmo, não o placar.' : ''}`);
    // O horario em que cada acao costuma ficar (60%+ numa faixa, ultimos 84
    // dias): sem isso a IA sugeria mudar "a meditacao para a noite" para quem
    // ja medita depois das 21h, o horario mais fraco.
    const faixaDaAcao = (acaoId: string) => {
      const daAcao = entrada.tarefas.filter((t) => t.action_id === acaoId && t.date >= somarDias(hoje, -83) && faixaDoHorario(t.start_time));
      if (daAcao.length < 3) return '';
      const contagem = new Map<string, number>();
      daAcao.forEach((t) => { const f = faixaDoHorario(t.start_time)!.nome; contagem.set(f, (contagem.get(f) || 0) + 1); });
      const [faixa, n] = [...contagem.entries()].sort((x, y) => y[1] - x[1])[0];
      return n / daAcao.length >= 0.6 ? `, costuma ficar ${faixa}` : '';
    };
    const porArenaAcoes = new Map<string, string[]>();
    pessoais.forEach((a) => {
      const prometido = Math.max(1, Math.floor(Number(a.repetitions) || 1));
      const feito = Math.min(prometido, feitasPorAcao.get(a.id) || 0);
      const nome = arenaAtiva.get(a.arena_id!)!;
      // Nos 3 primeiros dias o feito nao vai: "71 → 1" virava "parado".
      const texto = comeco
        ? `${a.name} ${prometido}x (${ritmoDaAcao(prometido)}${faixaDaAcao(a.id)})`
        : `${a.name} ${feito} de ${prometido} (${ritmoDaAcao(prometido)}${faixaDaAcao(a.id)})`;
      porArenaAcoes.set(nome, [...(porArenaAcoes.get(nome) || []), texto]);
    });
    if (porArenaAcoes.size) {
      const titulo = comeco ? 'o que ela planejou no ciclo, por arena e ação (com o ritmo de cada uma)' : 'planejado no ciclo, por arena e ação: feito de planejado (ritmo)';
      linhas.push(`${titulo}: ${[...porArenaAcoes.entries()].map(([arena, lista]) => `${arena}: ${lista.join(', ')}`).join(' · ')}`);
    }
  } else {
    const desde = somarDias(hoje, -27);
    const recentes = medidas.filter((t) => t.date >= desde && t.date <= hoje);
    linhas.push(`sem ciclo aberto. últimos 28 dias (agendadas → feitas): ${porArena(recentes) || 'nada agendado'}`);
  }

  // Padroes de horario e de dia da semana: so o que ja passou, ultimos 84 dias.
  const desde84 = somarDias(hoje, -83);
  const passadas = medidas.filter((t) => t.date >= desde84 && t.date < hoje);

  const porFaixa = FAIXAS.map((faixa) => {
    const daFaixa = passadas.filter((t) => faixaDoHorario(t.start_time) === faixa);
    return { faixa, total: daFaixa.length, feitas: daFaixa.filter((t) => t.completed).length };
  }).filter((f) => f.total >= MINIMO_PARA_PADRAO);
  if (porFaixa.length) {
    linhas.push(`horários (feitas do que foi agendado): ${porFaixa.map((f) => `${f.faixa.nome} ${pct(f.feitas, f.total)}%`).join(' · ')}`);
    // A comparacao ja feita: a IA errava "o maior" e "o menor".
    if (porFaixa.length >= 2) {
      const e = extremos(porFaixa, (f) => f.faixa.nome, (f) => pct(f.feitas, f.total));
      linhas.push(e.empateGeral
        ? `horários: cumpre igual em todas as faixas (${pct(porFaixa[0].feitas, porFaixa[0].total)}%)`
        : `horário em que mais cumpre: ${e.mais}; em que menos cumpre: ${e.menos}`);
    }
  }

  const porDia = DIAS_DA_SEMANA.map((nome, indice) => {
    const doDia = passadas.filter((t) => new Date(`${t.date}T12:00:00Z`).getUTCDay() === indice);
    return { nome, total: doDia.length, feitas: doDia.filter((t) => t.completed).length };
  }).filter((d) => d.total >= MINIMO_PARA_PADRAO);
  if (porDia.length) {
    linhas.push(`dias da semana (feitas do que foi agendado): ${porDia.map((d) => `${d.nome} ${pct(d.feitas, d.total)}%`).join(' · ')}`);
    if (porDia.length >= 2) {
      const e = extremos(porDia, (d) => d.nome, (d) => pct(d.feitas, d.total));
      linhas.push(e.empateGeral
        ? `dias da semana: cumpre igual todos os dias (${pct(porDia[0].feitas, porDia[0].total)}%)`
        : `dia da semana mais forte: ${e.mais}; mais fraco: ${e.menos}`);
    }
  }

  // Em que faixa cada arena costuma ficar, quando a maioria cai numa so.
  const faixaDasArenas: string[] = [];
  [...new Set(passadas.map(arenaDa))].forEach((arena) => {
    const daArena = passadas.filter((t) => arenaDa(t) === arena && faixaDoHorario(t.start_time));
    if (daArena.length < MINIMO_PARA_PADRAO) return;
    const contagem = new Map<string, number>();
    daArena.forEach((t) => { const f = faixaDoHorario(t.start_time)!.nome; contagem.set(f, (contagem.get(f) || 0) + 1); });
    const [faixa, n] = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0];
    // Sem porcentagem: "100% agendadas de manha" virava "cumpre 100%" na IA.
    if (n / daArena.length >= 0.6) faixaDasArenas.push(`${arena} fica ${faixa}`);
  });
  if (faixaDasArenas.length) linhas.push(`em que horário cada arena costuma estar agendada (não é o quanto cumpre): ${faixaDasArenas.join(' · ')}`);

  // O USO DO TEMPO no planner (02/11/2026): o que foi agendado nos ultimos 28
  // dias, em horas por semana por area, e o desenho do dia (primeiro e ultimo
  // horario, em mediana, nos dias que tiveram algo agendado).
  const desde28 = somarDias(hoje, -27);
  const ultimas = entrada.tarefas.filter((t) => t.date >= desde28 && t.date <= hoje && acaoPorId.has(t.action_id));
  const areaDaTarefa = (t: TarefaCrua) => {
    const acao = acaoPorId.get(t.action_id);
    const arena = entrada.arenas.find((a) => a.id === acao?.arena_id);
    return NOME_DA_AREA[arena?.asset_id || ''] || null;
  };
  const minutosPorArea = new Map<string, number>();
  ultimas.forEach((t) => {
    const area = areaDaTarefa(t);
    const minutos = Number(t.duration) || 0;
    if (area && minutos > 0) minutosPorArea.set(area, (minutosPorArea.get(area) || 0) + minutos);
  });
  if (minutosPorArea.size) {
    const porSemana = [...minutosPorArea.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([area, minutos]) => `${area} ${(minutos / 60 / 4).toFixed(1).replace('.', ',')}h`);
    const totalSemana = [...minutosPorArea.values()].reduce((s, m) => s + m, 0) / 60 / 4;
    linhas.push(`tempo agendado por semana (média dos últimos 28 dias): ${porSemana.join(' · ')} — total ${totalSemana.toFixed(1).replace('.', ',')}h`);
  }
  const mediana = (valores: number[]) => {
    const v = [...valores].sort((a, b) => a - b);
    return v.length ? v[Math.floor(v.length / 2)] : null;
  };
  const horariosPorDia = new Map<string, number[]>();
  ultimas.forEach((t) => {
    if (t.start_time == null || !Number.isFinite(t.start_time)) return;
    // No dia do Glyph, de 0h a 4h ainda e a noite anterior.
    const minuto = t.start_time < 240 ? t.start_time + 1440 : t.start_time;
    horariosPorDia.set(t.date, [...(horariosPorDia.get(t.date) || []), minuto]);
  });
  if (horariosPorDia.size >= MINIMO_PARA_PADRAO) {
    const primeiros = [...horariosPorDia.values()].map((m) => Math.min(...m));
    const ultimos = [...horariosPorDia.values()].map((m) => Math.max(...m));
    linhas.push(`dia típico no planner: primeira ação por volta de ${horaLegivel(mediana(primeiros))}, última por volta de ${horaLegivel(mediana(ultimos))}`);
  }
  const proximos = Array.from({ length: 7 }, (_, i) => somarDias(hoje, i + 1)).map((data) => {
    const doDia = entrada.tarefas.filter((t) => t.date === data && acaoPorId.has(t.action_id));
    const minutos = doDia.reduce((soma, t) => soma + (Number(t.duration) || 0), 0);
    const nome = DIAS_DA_SEMANA[new Date(`${data}T12:00:00Z`).getUTCDay()];
    return doDia.length ? `${nome} ${doDia.length} (${Math.round(minutos / 60 * 10) / 10}h)`.replace('.', ',') : `${nome} livre`;
  });
  linhas.push(`próximos 7 dias no planner (ações e horas): ${proximos.join(' · ')}`);

  // Hoje no planner.
  const deHoje = entrada.tarefas
    .filter((t) => t.date === hoje && acaoPorId.has(t.action_id))
    .sort((a, b) => (a.start_time ?? 9999) - (b.start_time ?? 9999));
  if (deHoje.length) {
    const lista = deHoje.map((t) => `${acaoPorId.get(t.action_id)!.name} (${horaLegivel(t.start_time)}, ${t.completed ? 'feita' : 'pendente'})`);
    linhas.push(`agendado no planner para hoje (só o que ela marcou com horário; pode haver ação planejada sem horário): ${lista.join(' · ')}`);
  } else {
    linhas.push('agendado no planner para hoje: nada (isso não quer dizer que não haja ação planejada)');
  }

  return linhas.join('\n');
};
