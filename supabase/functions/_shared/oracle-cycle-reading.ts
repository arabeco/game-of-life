// A LEITURA DO CICLO — UM MOTOR SO.
//
// O push da manha (supabase/functions/oracle) e o botao do chat
// (utils/leituraDoCiclo.ts) liam o mesmo ciclo com tres contas diferentes: o
// servidor dividia pelo que estava agendado, o chat pelo que os relatorios
// diarios somavam, e a tela pelo prometido. A mesma pessoa via 45% no widget e
// ouvia "atrasado" de manha.
//
// Agora os dois perguntam aqui. Cada lado junta os FATOS com o acesso a dados
// que tem; o que dizer sobre eles, e com que regua, mora so neste arquivo.
//
// SEM IMPORT NENHUM: este arquivo roda no Deno (funcao), no Vite (app) e no
// Node (testes), e qualquer import amarraria ele a um dos tres.

/** O que cada lado precisa juntar antes de pedir a leitura. */
export interface FatosDaLeitura {
  /** O dia operacional: tudo que esta no planner hoje, e quanto ja foi feito. */
  hoje: { agendadas: number; feitas: number };
  /** Nulo sem ciclo aberto, ou com ciclo que ainda nao comecou. */
  ciclo: null | {
    /** 1 no primeiro dia; nunca passa de totalDias. */
    dia: number;
    totalDias: number;
    /** Repeticoes prometidas ja feitas — a regua da tela (utils/cycleCommitment.ts). */
    feitas: number;
    prometidas: number;
    /** O prazo passou e o ciclo ainda nao foi fechado. */
    prazoAcabou: boolean;
  };
}

export type EstadoDoDia = 'dia_vazio' | 'dia_planejado' | 'dia_andando' | 'dia_completo';

export type EstadoDoCiclo =
  | 'sem_ciclo'
  | 'ciclo_sem_meta'
  | 'ciclo_comeca'
  | 'ciclo_indo_bem'
  | 'ciclo_abaixo'
  | 'ciclo_prazo_acabou';

/** So o chat usa: a pessoa apertou o botao e nao ha dia nem ciclo para ler. */
export type EstadoSemNada = 'nada_para_ler';

export type EstadoDaLeitura = EstadoDoDia | EstadoDoCiclo | EstadoSemNada;

/**
 * A FOLGA DA REGUA.
 *
 * O ritmo esperado e uma linha reta do primeiro ao ultimo dia, e a linha reta
 * cobra quem planejou o ciclo com dias mais cheios no fim. Dois dias de folga
 * querem dizer: no dia 6, a conta e onde voce deveria estar no dia 4.
 */
export const FOLGA_EM_DIAS = 2;

/**
 * AS FRASES.
 *
 * Cada estado tem as suas. Estado com lista vazia nao fala: sem nada no planner
 * a linha do dia some, em vez de anunciar que nao ha nada. Quando ha mais de
 * uma frase, sai uma que a pessoa nao leu nas ultimas vezes.
 *
 * Os numeros entram por marcador, e frase com marcador sem valor nao sai:
 *   {feitas} {agendadas} {faltam}                — o dia, so o numero
 *   {feitas_acoes} {agendadas_acoes} {faltam_acoes} — o dia, com "ação/ações"
 *   {dia} {total_dias} {faltam_dias} {pct}       — o ciclo
 *
 * Nada de bronca: nenhuma frase manda cortar, abandonar ou diz que a pessoa
 * esta para tras. O teste leitura-do-ciclo confere.
 */
export const FRASES_DA_LEITURA: Record<EstadoDaLeitura, string[]> = {
  dia_vazio: [],
  dia_planejado: ['Hoje tem {agendadas_acoes} no seu planner.'],
  dia_andando: ['Hoje: {feitas} de {agendadas} feitas.'],
  dia_completo: ['Planner de hoje completo: {feitas} de {agendadas}.'],

  sem_ciclo: [],
  ciclo_sem_meta: ['Dia {dia} de {total_dias} do seu ciclo.'],
  ciclo_comeca: ['Dia 1 de {total_dias}: seu ciclo começa hoje.'],
  ciclo_indo_bem: ['Seu ciclo está indo bem: {pct}%, dia {dia} de {total_dias}.'],
  ciclo_abaixo: ['Dia {dia} de {total_dias} do seu ciclo, {pct}% feito.'],
  ciclo_prazo_acabou: ['O prazo do ciclo acabou com {pct}% feito. Falta fechar.'],

  nada_para_ler: ['Hoje não tem nada no planner, e nenhum ciclo está aberto.'],
};

/** Onde a pessoa deveria estar hoje, ja com a folga, em porcentagem. */
export const ritmoEsperado = (dia: number, totalDias: number): number =>
  totalDias > 0 ? Math.max(0, ((dia - 1 - FOLGA_EM_DIAS) / totalDias) * 100) : 0;

export const estadoDoDia = (hoje: FatosDaLeitura['hoje']): EstadoDoDia => {
  if (hoje.agendadas <= 0) return 'dia_vazio';
  if (hoje.feitas <= 0) return 'dia_planejado';
  return hoje.feitas >= hoje.agendadas ? 'dia_completo' : 'dia_andando';
};

export const estadoDoCiclo = (ciclo: FatosDaLeitura['ciclo']): EstadoDoCiclo => {
  if (!ciclo) return 'sem_ciclo';
  if (ciclo.prazoAcabou) return 'ciclo_prazo_acabou';
  if (ciclo.prometidas <= 0) return 'ciclo_sem_meta';
  if (ciclo.dia <= 1) return 'ciclo_comeca';
  // Zero feito nao e "indo bem" so porque a folga ainda cobre: o dia 3 com nada
  // feito le o numero, sem elogio.
  const pct = (ciclo.feitas / ciclo.prometidas) * 100;
  return ciclo.feitas > 0 && pct >= ritmoEsperado(ciclo.dia, ciclo.totalDias)
    ? 'ciclo_indo_bem'
    : 'ciclo_abaixo';
};

const acoes = (n: number): string => (n === 1 ? '1 ação' : `${n} ações`);

const numerosDaLeitura = (fatos: FatosDaLeitura): Record<string, string> => {
  const { agendadas, feitas } = fatos.hoje;
  const faltam = Math.max(0, agendadas - feitas);
  const numeros: Record<string, string> = {
    feitas: String(feitas),
    agendadas: String(agendadas),
    faltam: String(faltam),
    feitas_acoes: acoes(feitas),
    agendadas_acoes: acoes(agendadas),
    faltam_acoes: acoes(faltam),
  };
  if (fatos.ciclo) {
    const { dia, totalDias, feitas: feitasNoCiclo, prometidas } = fatos.ciclo;
    numeros.dia = String(dia);
    numeros.total_dias = String(totalDias);
    numeros.faltam_dias = String(Math.max(0, totalDias - dia));
    numeros.pct = String(prometidas > 0 ? Math.min(100, Math.round((feitasNoCiclo / prometidas) * 100)) : 0);
  }
  return numeros;
};

const preencher = (frase: string, numeros: Record<string, string>): string | null => {
  let faltou = false;
  const pronta = frase.replace(/\{([a-z_]+)\}/g, (_marca, nome: string) => {
    if (numeros[nome] === undefined) {
      faltou = true;
      return '';
    }
    return numeros[nome];
  });
  return faltou ? null : pronta;
};

const escolher = (
  estado: EstadoDaLeitura,
  numeros: Record<string, string>,
  recentes: string[],
  sortear: () => number,
): string | null => {
  const prontas = FRASES_DA_LEITURA[estado]
    .map((frase) => preencher(frase, numeros))
    .filter((frase): frase is string => Boolean(frase));
  if (prontas.length === 0) return null;
  const novas = prontas.filter((frase) => !recentes.some((lida) => lida.includes(frase)));
  const fila = novas.length > 0 ? novas : prontas;
  return fila[Math.min(fila.length - 1, Math.floor(sortear() * fila.length))];
};

export interface LeituraDoCiclo {
  /** Nulo quando nao ha dia nem ciclo para ler — o push fica em silencio. */
  texto: string | null;
  estados: { dia: EstadoDoDia; ciclo: EstadoDoCiclo };
}

/**
 * A leitura: primeiro o ciclo, depois o dia.
 *
 * `recentes` sao textos que a pessoa ja recebeu; uma frase contida neles fica
 * para depois. `nuncaVazia` e do botao do chat — quem apertou recebe resposta.
 */
export const montarLeituraDoCiclo = (
  fatos: FatosDaLeitura,
  opcoes: { recentes?: string[]; sortear?: () => number; nuncaVazia?: boolean } = {},
): LeituraDoCiclo => {
  const { recentes = [], sortear = Math.random, nuncaVazia = false } = opcoes;
  const estados = { dia: estadoDoDia(fatos.hoje), ciclo: estadoDoCiclo(fatos.ciclo) };
  const numeros = numerosDaLeitura(fatos);
  const linhas = [
    escolher(estados.ciclo, numeros, recentes, sortear),
    escolher(estados.dia, numeros, recentes, sortear),
  ].filter((linha): linha is string => Boolean(linha));

  if (linhas.length === 0 && nuncaVazia) {
    return { texto: escolher('nada_para_ler', numeros, [], sortear), estados };
  }
  return { texto: linhas.length > 0 ? linhas.join(' ') : null, estados };
};

// ------------------------------------------------------------ A REGUA DA TELA
//
// Copia de utils/cycleCommitment.ts para as linhas cruas do banco, porque o
// servidor nao enxerga o codigo do app. Duas copias da mesma conta divergem no
// primeiro dia em que alguem mexe numa so — por isso o teste leitura-do-ciclo
// roda as duas sobre o mesmo ciclo e exige o mesmo numero.
//
// O ciclo promete as REPETICOES declaradas de cada acao: fora acao Livre, arena
// arquivada e missao de temporada ou de cla.

export interface AcaoDoBanco {
  id: string;
  arena_id: string;
  repetitions?: number | null;
  action_type?: string | null;
  source_quest_id?: string | null;
}

export interface ArenaDoBanco {
  id: string;
  name?: string | null;
  is_archived?: boolean | null;
}

export interface TarefaDoBanco {
  id: string;
  action_id: string;
  date: string;
  completed?: boolean | null;
}

const normalizar = (texto: string | null | undefined): string =>
  String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Mesma regra de utils/taskDomain.js: arena de missao se reconhece pelo nome. */
const ehArenaDeMissao = (arena: ArenaDoBanco | undefined): boolean => {
  const nome = normalizar(arena?.name);
  return nome.includes('quests - season') || nome.includes('quests - cla');
};

export const medirCicloPrometido = ({ acoes, arenas, tarefas, inicio, fim }: {
  acoes: AcaoDoBanco[];
  arenas: ArenaDoBanco[];
  tarefas: TarefaDoBanco[];
  inicio: string;
  fim: string;
}): { feitas: number; prometidas: number } => {
  const arenaPorId = new Map(arenas.map((arena) => [arena.id, arena]));
  const arenasAtivas = new Set(arenas.filter((arena) => !arena.is_archived).map((arena) => arena.id));
  const acoesAtivas = acoes.filter((acao) => arenasAtivas.has(acao.arena_id));
  const prometidas = acoesAtivas.filter((acao) =>
    acao.action_type !== 'Livre' &&
    !acao.source_quest_id &&
    !ehArenaDeMissao(arenaPorId.get(acao.arena_id)));
  const idsPrometidos = new Set(prometidas.map((acao) => acao.id));

  const feitasPorAcao = new Map<string, number>();
  const vistas = new Set<string>();
  for (const tarefa of tarefas) {
    if (vistas.has(tarefa.id)) continue;
    vistas.add(tarefa.id);
    if (!idsPrometidos.has(tarefa.action_id)) continue;
    if (tarefa.date < inicio || tarefa.date > fim || tarefa.completed !== true) continue;
    feitasPorAcao.set(tarefa.action_id, (feitasPorAcao.get(tarefa.action_id) || 0) + 1);
  }

  let total = 0;
  let feitas = 0;
  for (const acao of prometidas) {
    const repeticoes = Math.max(1, Math.floor(Number(acao.repetitions) || 1));
    total += repeticoes;
    feitas += Math.min(repeticoes, feitasPorAcao.get(acao.id) || 0);
  }
  return { feitas, prometidas: total };
};
