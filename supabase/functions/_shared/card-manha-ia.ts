/**
 * O CARD DA MANHA COM IA (17/11/2026, com o Afonso). So para Premium e Platinum.
 *
 * O codigo escolhe o assunto e calcula o FATO; a IA so escreve, no tom que a
 * pessoa escolheu. Assim o card nao inventa conta, nao repete e custa pouco
 * (uns 450 tokens de entrada: so a fatia de dados do assunto do dia).
 *
 * As regras vieram do ensaio (docs/oraculo-ia/ensaio-card-manha.md):
 *   - falha e feito contra PROMETIDO (o ritmo declarado da acao), SO NO CICLO
 *     ATUAL, e conta o que nunca foi para o planner. A janela de 28 dias
 *     atravessava ciclos: a Correr 4km, nova, apareceu como "1 de 4" porque o
 *     historico ficou na Correr 3km;
 *   - acao nova conta a partir de quando entrou;
 *   - so vira assunto com 3 ou mais esperadas, abaixo de 80% e 3 de diferenca
 *     ("14 de 16" nao e falha);
 *   - nada de sugerir horario: a pessoa e quem conhece o proprio dia;
 *   - o tipo de ontem nao volta; o mesmo assunto, so depois de 3 dias;
 *   - joinha e polegar para baixo pesam na escolha do tipo.
 *
 * Pura, fora `gerarCardDaManha` (que chama a rede): da para testar.
 */
import { montarPadroes, type AcaoCrua, type ArenaCrua, type CicloCru, type NivelCru, type TarefaCrua } from './oraculo-ia-padroes.ts';
import { MODELO, TOM_EM_PALAVRAS, type Tom } from './oraculo-ia-nucleo.ts';

export type TipoDoCard = 'esquecida' | 'ancora' | 'ciclo' | 'degrau' | 'conquista';

export interface Candidato {
  tipo: TipoDoCard;
  relevancia: number;
  /** A conta pronta, que a IA so pode repetir. */
  fato: string;
  /** O pedido do tipo, em uma linha. */
  pede: string;
  /** Ex.: "acao:<id>", "ciclo:ritmo", "degrau:saude". Nao repete em 3 dias. */
  assunto: string;
}

export interface CardAnterior {
  data: string;
  tipo: string;
  assunto: string;
  texto: string;
  /** 1 = joinha, -1 = polegar para baixo. */
  nota?: number | null;
}

export interface EntradaDoCard {
  hoje: string;
  ciclos: CicloCru[];
  acoes: Array<AcaoCrua & { created_at?: string | null }>;
  arenas: Array<ArenaCrua & { is_archived?: boolean | null }>;
  tarefas: TarefaCrua[];
  niveis?: NivelCru[];
  perfilDasAreas?: Record<string, unknown> | null;
}

const NOME_DA_AREA: Record<string, string> = {
  proposito: 'Propósito', relacoes: 'Relações', trabalho: 'Trabalho e estudos', lazer: 'Lazer e bem-estar', saude: 'Saúde',
};

const somarDias = (data: string, dias: number) => {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};
const diasEntre = (inicio: string, fim: string) =>
  Math.round((Date.parse(`${fim}T12:00:00Z`) - Date.parse(`${inicio}T12:00:00Z`)) / 86400000) + 1;
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

/** O mesmo jeito de dizer o ritmo que o chat usa ("4 por semana", "todo dia"). */
const ritmo = (prometido: number, totalDias: number) => {
  const porDia = prometido / totalDias;
  if (porDia >= 1.9) return `${Math.round(porDia)} por dia`;
  if (porDia >= 0.9) return 'todo dia';
  const porSemana = Math.max(1, Math.round(porDia * 7));
  return porSemana >= 7 ? 'todo dia' : `${porSemana} por semana`;
};

const MINIMO_ESPERADAS = 3;
const ABAIXO_DE = 0.8;
const DIFERENCA_MINIMA = 3;

export const candidatosDoCard = (e: EntradaDoCard): Candidato[] => {
  const candidatos: Candidato[] = [];
  const { hoje } = e;
  const ontem = somarDias(hoje, -1);
  const arenaAtiva = new Map(e.arenas.filter((a) => !a.completed_at && !a.is_archived).map((a) => [a.id, a]));
  const aberto = e.ciclos.find((c) => c.report_data == null && c.start_date <= hoje && c.end_date >= hoje);

  if (aberto) {
    const total = diasEntre(aberto.start_date, aberto.end_date);
    const dia = diasEntre(aberto.start_date, hoje);
    const restam = total - dia + 1;
    const pessoais = e.acoes.filter((a) => a.action_type !== 'Livre' && !a.source_quest_id && !a.origin_codex_id && a.arena_id && arenaAtiva.has(a.arena_id));

    const medidas = pessoais.map((acao) => {
      const prometido = Math.max(1, Math.floor(Number(acao.repetitions) || 1));
      const criada = acao.created_at && /^\d{4}-\d{2}-\d{2}/.test(acao.created_at) ? acao.created_at.slice(0, 10) : null;
      // Acao nova conta a partir de quando entrou no ciclo.
      const inicio = criada && criada > aberto.start_date ? criada : aberto.start_date;
      const diasAtivos = ontem >= inicio ? diasEntre(inicio, ontem) : 0;
      const taxa = prometido / total;
      const esperado = Math.min(prometido, Math.floor(taxa * diasAtivos));
      const daAcao = e.tarefas.filter((t) => t.action_id === acao.id && t.date >= inicio && t.date <= hoje);
      const feitas = Math.min(prometido, daAcao.filter((t) => t.completed).length);
      const agendadas = daAcao.length;
      const ultimos7 = e.tarefas.filter((t) => t.action_id === acao.id && t.completed && t.date >= somarDias(hoje, -7) && t.date <= ontem).length;
      return { acao, prometido, inicio, diasAtivos, taxa, esperado, feitas, agendadas, ultimos7, arena: arenaAtiva.get(acao.arena_id!)! };
    });

    const fracas = medidas
      .filter((m) => m.esperado >= MINIMO_ESPERADAS && m.feitas < m.esperado * ABAIXO_DE && m.esperado - m.feitas >= DIFERENCA_MINIMA)
      .sort((a, b) => (b.esperado - b.feitas) - (a.esperado - a.feitas) || a.feitas / a.esperado - b.feitas / b.esperado);
    const firmes = medidas
      .filter((m) => m.diasAtivos >= 7 && m.esperado >= 5 && m.feitas >= m.esperado)
      .sort((a, b) => b.esperado - a.esperado);

    const fraca = fracas[0];
    if (fraca) {
      const falta = fraca.esperado - fraca.feitas;
      const planner = fraca.agendadas === 0
        ? ' Não foi para o planner nenhuma vez neste ciclo.'
        : fraca.agendadas < fraca.esperado / 2 ? ` Foi para o planner ${fraca.agendadas} ${fraca.agendadas === 1 ? 'vez' : 'vezes'}.` : '';
      candidatos.push({
        tipo: 'esquecida',
        relevancia: 55 + Math.min(20, falta * 3),
        pede: 'A AÇÃO ESQUECIDA: a ação prometida que está ficando para trás neste ciclo.',
        fato: `${fraca.acao.name} (arena ${fraca.arena.name}): prometida ${fraca.prometido} vezes no ciclo (${ritmo(fraca.prometido, total)}). Até ontem o esperado era ${fraca.esperado}, e foram feitas ${fraca.feitas}.${planner}`,
        assunto: `acao:${fraca.acao.id}`,
      });
      // A ancora: o habito que nao falha, de preferencia na mesma area.
      const firme = firmes.find((m) => m.arena.asset_id === fraca.arena.asset_id && m.acao.id !== fraca.acao.id)
        || firmes.find((m) => m.acao.id !== fraca.acao.id);
      if (firme) {
        candidatos.push({
          tipo: 'ancora',
          relevancia: 45 + Math.min(15, falta * 2),
          pede: 'ÂNCORA: a ação que está ficando para trás pode se apoiar no hábito que não falha. Convide a pensar nisso, sem dizer quando.',
          fato: `Ficando para trás: ${fraca.acao.name} (${fraca.feitas} de ${fraca.esperado} esperadas até ontem). Não falha neste ciclo: ${firme.acao.name} (${firme.feitas} de ${firme.esperado}).`,
          assunto: `acao:${fraca.acao.id}`,
        });
      }
    }

    // O CICLO: comeco, reta final ou ritmo caindo. Ritmo bom nao vira card.
    const prometidas = medidas.reduce((s, m) => s + m.prometido, 0);
    const esperadas = medidas.reduce((s, m) => s + m.esperado, 0);
    const feitas = medidas.reduce((s, m) => s + m.feitas, 0);
    const esperadas7 = medidas.reduce((s, m) => s + m.taxa * Math.min(7, m.diasAtivos), 0);
    const feitas7 = medidas.reduce((s, m) => s + m.ultimos7, 0);
    if (prometidas > 0) {
      if (dia <= 2) {
        candidatos.push({
          tipo: 'ciclo', relevancia: 75, assunto: 'ciclo:inicio',
          pede: 'COMEÇO DE CICLO: o que foi prometido e o que conta agora (pegar ritmo, não o placar).',
          fato: `Ciclo de ${total} dias, ${dia === 1 ? 'começa hoje' : 'começou ontem'}: ${prometidas} ações prometidas, em ${new Set(medidas.map((m) => m.arena.name)).size} arenas.`,
        });
      } else if (restam <= 3) {
        const para90 = Math.max(0, Math.ceil(prometidas * 0.9) - feitas);
        candidatos.push({
          tipo: 'ciclo', relevancia: 72, assunto: 'ciclo:reta',
          pede: 'RETA FINAL DO CICLO: onde ele está e o que ainda muda o fechamento.',
          fato: `Faltam ${restam} ${restam === 1 ? 'dia' : 'dias'}, contando hoje. Feitas ${feitas} de ${prometidas} prometidas (${pct(feitas, prometidas)}%).${para90 > 0 ? ` Para fechar em 90% faltam ${para90}.` : ' Já passou de 90%.'}`,
        });
      } else if (dia >= 5 && esperadas >= 5) {
        const ritmoGeral = feitas / esperadas;
        const ritmo7 = esperadas7 > 0 ? feitas7 / esperadas7 : ritmoGeral;
        if (ritmoGeral < 0.85 || ritmo7 < ritmoGeral - 0.15) {
          const projecao = Math.min(prometidas, Math.round(feitas + (feitas7 / 7) * restam));
          candidatos.push({
            tipo: 'ciclo', relevancia: 60 + Math.min(25, Math.round((0.9 - Math.min(ritmoGeral, ritmo7)) * 100)), assunto: 'ciclo:ritmo',
            pede: 'O RITMO DO CICLO: onde ele fecha se nada mudar, e o que muda o final.',
            fato: `Dia ${dia} de ${total}. Até ontem: ${feitas} de ${esperadas} esperadas (${pct(feitas, esperadas)}%). Últimos 7 dias: ${pct(feitas7, esperadas7)}%. No ritmo dos últimos 7 dias, o ciclo fecha perto de ${pct(projecao, prometidas)}% do prometido.`,
          });
        }
      }
    }

    // Conquista dentro do ciclo: a acao que nao falhou nenhuma vez.
    const semFalha = firmes.find((m) => m.esperado >= 10);
    if (semFalha) {
      candidatos.push({
        tipo: 'conquista', relevancia: 35, assunto: `acao:${semFalha.acao.id}`,
        pede: 'CONQUISTA QUE NINGUÉM VIU: reconheça um feito dos números, sem exagero.',
        fato: `${semFalha.acao.name}: ${semFalha.feitas} de ${semFalha.esperado} esperadas neste ciclo, sem falhar.`,
      });
    }
  }

  // Conquista do ciclo que acabou de fechar (ultimos 7 dias): nota e sequencia.
  const recemFechado = e.ciclos
    .filter((c) => c.report_data != null && c.end_date >= somarDias(hoje, -7) && c.end_date <= hoje)
    .sort((a, b) => b.end_date.localeCompare(a.end_date))[0];
  if (recemFechado) {
    const r = (recemFechado.report_data || {}) as Record<string, unknown>;
    const m = (r.metrics || {}) as Record<string, unknown>;
    const h = (r.highlight || {}) as Record<string, unknown>;
    const partes: string[] = [];
    if (typeof r.grade === 'string' && r.grade) partes.push(`nota ${r.grade}`);
    const seq = Number(m.max_streak ?? m.maxStreak);
    if (Number.isFinite(seq) && seq > 1) partes.push(`maior sequência ${seq} dias`);
    const repetida = String(h.most_repeated_action ?? h.mostRepeatedAction ?? '').trim();
    if (repetida) partes.push(`ação mais repetida ${repetida}`);
    const habitos = (m.habitos_consolidados ?? m.habitosConsolidados) as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(habitos) && habitos.length) partes.push(`hábitos consolidados: ${habitos.map((x) => String(x.nome || x.name || '')).filter(Boolean).join(', ')}`);
    if (partes.length) {
      candidatos.push({
        tipo: 'conquista', relevancia: 65, assunto: `conquista:ciclo:${recemFechado.start_date}`,
        pede: 'CONQUISTA QUE NINGUÉM VIU: o ciclo que fechou, sem exagero.',
        fato: `O ciclo ${recemFechado.name || ''} fechou: ${partes.join(' · ')}.`.replace('  ', ' '),
      });
    }
  }

  // O proximo degrau da area mais baixa que tem arena: a ficha que o chat usa.
  const niveis = (e.niveis || [])
    .filter((n) => NOME_DA_AREA[n.asset_id] && Number(n.level) > 0 && Number(n.level) < 10)
    .filter((n) => e.arenas.some((a) => a.asset_id === n.asset_id && !a.completed_at && !a.is_archived))
    .sort((a, b) => Number(a.level) - Number(b.level));
  if (niveis.length) {
    const area = niveis[0].asset_id;
    const padroes = montarPadroes({
      hoje, ciclos: e.ciclos, acoes: e.acoes, arenas: e.arenas.filter((a) => !a.is_archived),
      tarefas: e.tarefas, niveis: e.niveis, perfilDasAreas: e.perfilDasAreas,
    });
    const linha = padroes.split('\n').find((l) => l.startsWith(`- ${NOME_DA_AREA[area]} ${Math.round(Number(niveis[0].level))},`));
    if (linha) {
      candidatos.push({
        tipo: 'degrau', relevancia: 40, assunto: `degrau:${area}`,
        pede: 'PRÓXIMO DEGRAU: a lacuna, a parte da frase do próximo degrau que nenhuma ação cobre, como um passo pequeno.',
        fato: linha.slice(2),
      });
    }
  }

  return candidatos;
};

/** Calmo nunca sugere subir degrau (o NAO FAZ do tom). */
const FORA_DO_TOM: Partial<Record<Tom, TipoDoCard[]>> = { calmo: ['degrau'] };

export const escolherCandidato = (
  candidatos: Candidato[],
  { tom, hoje, historico }: { tom: Tom; hoje: string; historico: CardAnterior[] },
): Candidato | null => {
  const ontem = somarDias(hoje, -1);
  const tresDias = somarDias(hoje, -3);
  const tipoDeOntem = historico.find((c) => c.data >= ontem && c.data < hoje)?.tipo;
  const assuntosRecentes = new Set(historico.filter((c) => c.data >= tresDias && c.data < hoje).map((c) => c.assunto));
  const peso = (tipo: string) => historico.slice(0, 20)
    .filter((c) => c.tipo === tipo && (c.nota === 1 || c.nota === -1))
    .reduce((s, c) => s + (c.nota === 1 ? 8 : -12), 0);
  const possiveis = candidatos
    .filter((c) => !FORA_DO_TOM[tom]?.includes(c.tipo))
    .filter((c) => c.tipo !== tipoDeOntem && !assuntosRecentes.has(c.assunto))
    .map((c) => ({ c, nota: c.relevancia + peso(c.tipo) }));
  if (!possiveis.length) return null;
  // Empate fica com o que veio primeiro: a ordem de candidatosDoCard e a de prioridade.
  return possiveis.reduce((melhor, atual) => (atual.nota > melhor.nota ? atual : melhor)).c;
};

export const promptDoCard = (candidato: Candidato, tom: Tom, historico: CardAnterior[] = []) => {
  const ontem = historico[0]?.texto ? `\nO CARD DE ONTEM (não repita o jeito de dizer, nem a frase do convite): "${historico[0].texto}"` : '';
  const extra = candidato.tipo === 'degrau'
    ? '\nNo FATO está a ficha da área: o degrau atual e o próximo com as frases, as ações e a rotina típica. Diga a lacuna em poucas palavras.'
    : '';
  return `Você é o Oráculo do Glyph e escreve o card da manhã, que chega como notificação no celular.

ASSUNTO DE HOJE: ${candidato.pede}
FATO (calculado pelo app, é verdade): ${candidato.fato}${extra}${ontem}

Responda só com JSON: {"titulo": "...", "texto": "..."}
- titulo: no máximo 5 palavras, sem verbo no imperativo, sem ponto final, sem emoji. Fale do assunto, com o nome da ação ou da área.
- texto: no máximo 20 palavras, em 1 ou 2 frases curtas. Conte as palavras antes de responder; passou de 20, corte.
- Só o FATO. Não invente número, horário, ferramenta, truque (alarme, lembrete, celular) nem atividade que não esteja nele.
- Cite pelo menos um nome de ação ou um número do FATO.
- Nomes de arena e ação exatamente como escritos; repita o nome em vez de "ela" ou "ele"; não interprete o que o nome quer dizer e não julgue o hábito.
- Não diga quando nem onde encaixar: nada de horário sugerido, "antes de", "depois de", "logo cedo". Quem conhece o próprio dia é a pessoa: convide a pensar ("talvez valha rever o lugar de...", "o que faria ... caber?", "dá para olhar onde ... entra na semana"), variando o jeito de dizer.
- Sugestão na primeira pessoa ou como convite, nunca no imperativo. Quem faz a ação é a pessoa, nunca "eu faço" ou "que tal eu".
- Sem saudação, sem "bom dia", sem o nome da pessoa.

TOM (a pessoa escolheu; manda no conteúdo, não só nas palavras): ${TOM_EM_PALAVRAS[tom]}
No card, o tom cabe em 20 palavras: só o essencial dele.`;
};

const IMPERATIVO = /(?<!\p{L})(faça|tente|mova|comece|coloque|deixe|troque|reserve|proteja|encaixe|garanta|foque|mantenha|evite|bora|blinde|marque|crie|leia|procure)(?!\p{L})/iu;

export const validarCard = (bruto: string): { ok: true; titulo: string; texto: string } | { ok: false; motivo: string } => {
  let card: { titulo?: unknown; texto?: unknown };
  try {
    card = JSON.parse(String(bruto || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
  } catch {
    return { ok: false, motivo: 'json' };
  }
  const titulo = String(card?.titulo || '').trim().replace(/\.$/, '');
  const texto = String(card?.texto || '').trim();
  if (!titulo || titulo.length > 45 || titulo.split(/\s+/).length > 6) return { ok: false, motivo: 'titulo' };
  if (texto.length < 20 || texto.length > 170) return { ok: false, motivo: 'tamanho' };
  if (IMPERATIVO.test(`${titulo} ${texto}`)) return { ok: false, motivo: 'imperativo' };
  if (/alarme|lembrete|celular|bom dia/i.test(texto)) return { ok: false, motivo: 'inventou' };
  // "Progredir... onde ela entra": nome de acao nao tem genero; repete o nome.
  if (/(?<!\p{L})(ela|ele)(?!\p{L})/iu.test(texto)) return { ok: false, motivo: 'pronome' };
  return { ok: true, titulo, texto };
};

const chamar = async (chave: string, prompt: string): Promise<string | null> => {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), 15000);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controle.signal,
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://glyph.life', 'X-Title': 'Glyph' },
      body: JSON.stringify({
        model: MODELO, messages: [{ role: 'user', content: prompt }], max_tokens: 160, temperature: 0.8,
        reasoning: { enabled: false }, provider: { order: ['Anthropic'], allow_fallbacks: false },
      }),
    });
    const corpo = await res.json().catch(() => null);
    const texto = corpo?.choices?.[0]?.message?.content;
    return res.ok && typeof texto === 'string' ? texto : null;
  } catch {
    return null;
  } finally {
    clearTimeout(relogio);
  }
};

/**
 * Escolhe, pede e confere. Uma segunda chance se o primeiro voltar fora da
 * regra; se a segunda tambem falhar, devolve null e a rotina manda o card de
 * regras de sempre.
 */
export const gerarCardDaManha = async (chave: string, entrada: EntradaDoCard, tom: Tom, historico: CardAnterior[]) => {
  const candidato = escolherCandidato(candidatosDoCard(entrada), { tom, hoje: entrada.hoje, historico });
  if (!candidato) return null;
  const prompt = promptDoCard(candidato, tom, historico);
  for (const lembrete of ['', '\n\nA tentativa anterior saiu fora da regra: texto com no máximo 20 palavras e nenhum verbo no imperativo.']) {
    const bruto = await chamar(chave, prompt + lembrete);
    if (!bruto) return null;
    const card = validarCard(bruto);
    if (card.ok) return { titulo: card.titulo, texto: card.texto, tipo: candidato.tipo, assunto: candidato.assunto };
  }
  return null;
};
