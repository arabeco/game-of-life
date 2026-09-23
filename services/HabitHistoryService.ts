import { supabase } from '../supabaseClient';

/**
 * A HISTORIA DO HABITO, QUE O APP NAO TINHA.
 *
 * O checklist guardava um dia so, sobrescrito toda noite; a sequencia guardava
 * o contador, sem as datas. Entao "17 de 30 dias" nao era consulta dificil: era
 * impossivel, porque ninguem nunca anotou.
 *
 * Aqui e uma linha por habito por dia, e a leitura e sempre por JANELA — o
 * fecho de ciclo pergunta pelos dias daquele ciclo. Nada disso entra na
 * hidratacao de abertura do app, pelo mesmo motivo do diario: dado que so
 * cresce nao pode ser baixado por quem nao pediu para ler.
 */

export type TipoDeHabito = 'checklist' | 'sequencia';

export interface DiaDeHabito {
  markedOn: string;
  kind: TipoDeHabito;
  itemId: string;
  title: string;
}

/** Resumo de um habito dentro de uma janela — e o que o relatorio mostra. */
export interface HabitoNoCiclo {
  kind: TipoDeHabito;
  itemId: string;
  title: string;
  /** Em quantos dias da janela foi marcado. O "17" de "17/30". */
  dias: number;
  /** A maior corrida de dias consecutivos dentro da janela. */
  maiorSequencia: number;
}

/**
 * Marca o dia. Idempotente: marcar duas vezes nao cria duas linhas.
 *
 * Falha em silencio de proposito — anotar historico nao pode atrapalhar o
 * gesto de marcar um item. Se a linha nao gravar, o relatorio mostra um dia a
 * menos; se o toast de erro aparecesse, a pessoa acharia que o item nao foi
 * marcado.
 */
export const marcarHabito = async (
  userId: string,
  markedOn: string,
  kind: TipoDeHabito,
  itemId: string,
  title: string,
): Promise<void> => {
  if (!userId || !markedOn || !itemId) return;
  const { error } = await supabase
    .from('habit_marks')
    .upsert(
      { user_id: userId, marked_on: markedOn, kind, item_id: itemId, title: String(title || '').slice(0, 120) },
      { onConflict: 'user_id,marked_on,kind,item_id' },
    );
  if (error) console.warn('[habito] nao consegui anotar a marca:', error.message);
};

/** Desmarcou: a linha sai. Nao ha estado intermediario. */
export const desmarcarHabito = async (
  userId: string,
  markedOn: string,
  kind: TipoDeHabito,
  itemId: string,
): Promise<void> => {
  if (!userId || !markedOn || !itemId) return;
  const { error } = await supabase
    .from('habit_marks')
    .delete()
    .eq('user_id', userId)
    .eq('marked_on', markedOn)
    .eq('kind', kind)
    .eq('item_id', itemId);
  if (error) console.warn('[habito] nao consegui apagar a marca:', error.message);
};

/** Dias entre duas datas ISO, inclusive nas pontas. E o "30" de "17/30". */
export const diasDaJanela = (inicio: string, fim: string): number => {
  const a = Date.parse(inicio + 'T12:00:00');
  const b = Date.parse(fim + 'T12:00:00');
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.round((b - a) / 86400000) + 1;
};

/**
 * O que cada habito fez dentro da janela.
 *
 * A maior sequencia e contada AQUI e nao lida de `sequence_items.days`, e a
 * diferenca importa: aquele campo e o contador VIVO, que atravessa ciclos e
 * some quando a pessoa zera. O relatorio fala de um ciclo, entao a corrida que
 * ele mostra tem de ser a que aconteceu dentro dele.
 */
export const resumoDoCiclo = async (
  userId: string,
  inicio: string,
  fim: string,
): Promise<HabitoNoCiclo[]> => {
  if (!userId || !inicio || !fim) return [];

  const { data, error } = await supabase
    .from('habit_marks')
    .select('marked_on, kind, item_id, title')
    .eq('user_id', userId)
    .gte('marked_on', inicio)
    .lte('marked_on', fim)
    .order('marked_on', { ascending: true });

  if (error) {
    console.warn('[habito] nao consegui ler a janela:', error.message);
    return [];
  }

  const porItem = new Map<string, { kind: TipoDeHabito; itemId: string; title: string; datas: string[] }>();
  for (const linha of (data || []) as any[]) {
    const chave = `${linha.kind}:${linha.item_id}`;
    const atual = porItem.get(chave) || {
      kind: linha.kind as TipoDeHabito,
      itemId: String(linha.item_id),
      // O ultimo titulo visto vence: se a pessoa renomeou no meio do ciclo, o
      // relatorio usa o nome com que ela terminou.
      title: String(linha.title || ''),
      datas: [] as string[],
    };
    atual.title = String(linha.title || atual.title);
    atual.datas.push(String(linha.marked_on).slice(0, 10));
    porItem.set(chave, atual);
  }

  const resumo: HabitoNoCiclo[] = [];
  for (const item of porItem.values()) {
    const unicas = [...new Set(item.datas)].sort();
    let maior = 0;
    let corrida = 0;
    let anterior: number | null = null;
    for (const dia of unicas) {
      const t = Date.parse(dia + 'T12:00:00');
      corrida = anterior !== null && Math.round((t - anterior) / 86400000) === 1 ? corrida + 1 : 1;
      if (corrida > maior) maior = corrida;
      anterior = t;
    }
    resumo.push({
      kind: item.kind,
      itemId: item.itemId,
      title: item.title,
      dias: unicas.length,
      maiorSequencia: maior,
    });
  }

  // Quem apareceu mais dias primeiro: o relatorio tem espaco curto, e o que
  // sustentou o ciclo interessa mais que o que foi tentado uma vez.
  return resumo.sort((a, b) => b.dias - a.dias || b.maiorSequencia - a.maiorSequencia);
};
