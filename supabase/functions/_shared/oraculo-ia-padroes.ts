/**
 * OS PADROES DA PESSOA, EM TEXTO, PARA O ORACULO COM IA (02/11/2026).
 *
 * A IA decide o que dizer; o app so entrega os dados. Esta funcao pega as
 * linhas cruas do banco (ciclos, acoes, arenas, tarefas agendadas) e devolve
 * um resumo curto, com os numeros ja contados:
 *
 *   - cada ciclo fechado (os 3 ultimos): agendadas → feitas por arena;
 *   - o ciclo aberto: em que dia esta e como cada arena vai;
 *   - sem ciclo: os ultimos 28 dias por arena;
 *   - em que faixa de horario e em que dia da semana a pessoa cumpre;
 *   - a faixa de horario em que cada arena costuma ficar;
 *   - o que tem hoje no planner.
 *
 * Acao Livre fica de fora das contas: ela nao tem alvo.
 * Pura: sem rede e sem banco, para dar para testar.
 */

export type TarefaCrua = { action_id: string; date: string; start_time: number | null; completed: boolean };
export type AcaoCrua = { id: string; arena_id: string | null; name: string; action_type: string | null };
export type ArenaCrua = { id: string; name: string };
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

export const montarPadroes = (entrada: {
  hoje: string;
  ciclos: CicloCru[];
  acoes: AcaoCrua[];
  arenas: ArenaCrua[];
  tarefas: TarefaCrua[];
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

  // Ciclos fechados, do mais antigo para o mais novo.
  const fechados = entrada.ciclos
    .filter((c) => c.report_data != null && c.start_date && c.end_date)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .slice(0, 3)
    .reverse();
  if (fechados.length) {
    linhas.push('ciclos anteriores (agendadas → feitas, por arena):');
    fechados.forEach((c) => {
      const doCiclo = medidas.filter((t) => t.date >= c.start_date && t.date <= c.end_date);
      linhas.push(`- ${c.name || 'Ciclo'} (${diasEntre(c.start_date, c.end_date)} dias): ${porArena(doCiclo) || 'nada agendado'}`);
    });
  }

  // O ciclo aberto, ou os ultimos 28 dias.
  const aberto = entrada.ciclos.find((c) => c.report_data == null && c.start_date <= hoje && c.end_date >= hoje);
  if (aberto) {
    const doCiclo = medidas.filter((t) => t.date >= aberto.start_date && t.date <= aberto.end_date);
    linhas.push(`ciclo atual (dia ${diasEntre(aberto.start_date, hoje)} de ${diasEntre(aberto.start_date, aberto.end_date)}), agendadas no ciclo inteiro → feitas até hoje: ${porArena(doCiclo) || 'nada agendado'}`);
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
  }

  const porDia = DIAS_DA_SEMANA.map((nome, indice) => {
    const doDia = passadas.filter((t) => new Date(`${t.date}T12:00:00Z`).getUTCDay() === indice);
    return { nome, total: doDia.length, feitas: doDia.filter((t) => t.completed).length };
  }).filter((d) => d.total >= MINIMO_PARA_PADRAO);
  if (porDia.length) {
    linhas.push(`dias da semana (feitas do que foi agendado): ${porDia.map((d) => `${d.nome} ${pct(d.feitas, d.total)}%`).join(' · ')}`);
  }

  // Em que faixa cada arena costuma ficar, quando a maioria cai numa so.
  const faixaDasArenas: string[] = [];
  [...new Set(passadas.map(arenaDa))].forEach((arena) => {
    const daArena = passadas.filter((t) => arenaDa(t) === arena && faixaDoHorario(t.start_time));
    if (daArena.length < MINIMO_PARA_PADRAO) return;
    const contagem = new Map<string, number>();
    daArena.forEach((t) => { const f = faixaDoHorario(t.start_time)!.nome; contagem.set(f, (contagem.get(f) || 0) + 1); });
    const [faixa, n] = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0];
    if (n / daArena.length >= 0.6) faixaDasArenas.push(`${arena}: ${pct(n, daArena.length)}% agendadas ${faixa}`);
  });
  if (faixaDasArenas.length) linhas.push(`onde cada arena costuma ficar: ${faixaDasArenas.join(' · ')}`);

  // Hoje no planner.
  const deHoje = entrada.tarefas
    .filter((t) => t.date === hoje && acaoPorId.has(t.action_id))
    .sort((a, b) => (a.start_time ?? 9999) - (b.start_time ?? 9999));
  if (deHoje.length) {
    const lista = deHoje.map((t) => `${acaoPorId.get(t.action_id)!.name} (${horaLegivel(t.start_time)}, ${t.completed ? 'feita' : 'pendente'})`);
    linhas.push(`hoje: ${lista.join(' · ')}`);
  } else {
    linhas.push('hoje: nada agendado no planner');
  }

  return linhas.join('\n');
};
