import { supabase } from '../supabaseClient';

/**
 * O DIARIO NAO PASSA PELO GameContext, E ISSO E A FEATURE.
 *
 * Tudo o que o contexto carrega, ele carrega na ABERTURA do app, para todo
 * mundo. Se as paginas entrassem ali, quem nunca abre o diario pagaria egress
 * por texto que nunca leu — e com o tempo isso cresce sozinho, porque diario e
 * a unica coisa do app que so aumenta.
 *
 * Por isso este servico e chamado direto pela tela, quando ela abre. Nenhuma
 * pagina existe em memoria antes de alguem pedir para ler.
 *
 * O teste `journal-egress` guarda essa regra.
 */

export const JOURNAL_MAX_PAGINAS = 99;
export const JOURNAL_MAX_CARACTERES = 10000;

/** O que o indice mostra de cada pagina, sem trazer o conteudo. */
export interface ResumoDePagina {
  pageNumber: number;
  updatedAt: string;
  /** Primeiros caracteres, so para a pessoa reconhecer a pagina na lista. */
  previa: string;
}

const PREVIA = 60;

/**
 * O indice. Le numero, data e um pedaco curto — nunca o texto inteiro.
 *
 * `left(content, 60)` nao existe no client do Supabase, entao o corte acontece
 * aqui. O custo disso e real mas pequeno: sao 99 linhas no pior caso, e a
 * alternativa (uma view ou uma RPC) trocaria bytes por uma peca a mais para
 * manter. Se um dia o indice pesar, a troca e essa.
 */
export const listarPaginas = async (userId: string): Promise<ResumoDePagina[]> => {
  const { data, error } = await supabase
    .from('journal_pages')
    .select('page_number, updated_at, content')
    .eq('user_id', userId)
    .order('page_number', { ascending: true });

  if (error) {
    console.error('[journal] falha ao listar paginas:', error);
    return [];
  }

  return (data || []).map((linha: any) => ({
    pageNumber: Number(linha.page_number),
    updatedAt: String(linha.updated_at || ''),
    previa: String(linha.content || '').slice(0, PREVIA).replace(/\s+/g, ' ').trim(),
  }));
};

/** Uma pagina, uma linha. Pagina que nunca foi escrita volta vazia. */
export const lerPagina = async (userId: string, pageNumber: number): Promise<string> => {
  const { data, error } = await supabase
    .from('journal_pages')
    .select('content')
    .eq('user_id', userId)
    .eq('page_number', pageNumber)
    .maybeSingle();

  if (error) {
    console.error('[journal] falha ao ler pagina:', error);
    return '';
  }

  return String(data?.content || '');
};

/**
 * Grava so a pagina que mudou.
 *
 * `upsert` porque a primeira escrita cria a linha e as seguintes atualizam, e
 * a tela nao precisa saber em qual dos dois casos esta.
 */
export const salvarPagina = async (
  userId: string,
  pageNumber: number,
  content: string,
): Promise<boolean> => {
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > JOURNAL_MAX_PAGINAS) return false;

  const texto = String(content || '').slice(0, JOURNAL_MAX_CARACTERES);
  const { error } = await supabase
    .from('journal_pages')
    .upsert(
      { user_id: userId, page_number: pageNumber, content: texto, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,page_number' },
    );

  if (error) {
    console.error('[journal] falha ao salvar pagina:', error);
    return false;
  }
  return true;
};

export const apagarPagina = async (userId: string, pageNumber: number): Promise<boolean> => {
  const { error } = await supabase
    .from('journal_pages')
    .delete()
    .eq('user_id', userId)
    .eq('page_number', pageNumber);

  if (error) {
    console.error('[journal] falha ao apagar pagina:', error);
    return false;
  }
  return true;
};

/** A data de hoje no formato que o app usa na tela, para o cabecalho da entrada. */
export const cabecalhoDeHoje = (agora: Date = new Date()): string => {
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${agora.getFullYear()}`;
};

/**
 * O SEPARADOR ENTRE ENTRADAS. Tambem serve para achar a ultima ao reler.
 */
export const SEPARADOR_DE_ENTRADA = '--------------';

/**
 * Anexa uma entrada na pagina corrente — a de numero mais alto que ainda cabe.
 *
 * Nao existe "pagina de hoje": a pessoa escolhe como preencher, e uma pagina
 * pode guardar um dia ou um ano. O que este helper faz e o gesto minimo de um
 * diario — continuar de onde parou.
 */
export const anexarEntrada = async (
  userId: string,
  cabecalho: string,
  texto: string,
): Promise<boolean> => {
  const paginas = await listarPaginas(userId);
  const ultima = paginas.length ? Math.max(...paginas.map((p) => p.pageNumber)) : 0;

  const entrada = `${cabecalho}\n${texto}`.trim();
  let numero = ultima || 1;
  let conteudo = ultima ? await lerPagina(userId, ultima) : '';

  // Nao cabe? A entrada comeca numa pagina nova em vez de ser cortada no meio.
  if (conteudo && conteudo.length + entrada.length + SEPARADOR_DE_ENTRADA.length + 4 > JOURNAL_MAX_CARACTERES) {
    if (ultima >= JOURNAL_MAX_PAGINAS) return false;
    numero = ultima + 1;
    conteudo = '';
  }

  const junto = conteudo.trim()
    ? `${conteudo.replace(/\s+$/, '')}\n\n${SEPARADOR_DE_ENTRADA}\n${entrada}\n`
    : `${entrada}\n`;

  return salvarPagina(userId, numero, junto);
};

/**
 * A COR VEM DO TEXTO, e nao de uma coluna.
 *
 * O cabecalho de cada entrada carrega o nome do humor — "22/09/2026 · Coragem".
 * Guardar o numero do humor numa coluna a parte criaria duas versoes da mesma
 * informacao, e um dia elas discordariam; assim a entrada e a fonte, e a cor e
 * derivada dela. Quem editar o texto a mao muda a cor junto, que e o
 * comportamento honesto.
 */
export const humorDaEntrada = (trecho: string): string | null => {
  const linhas = String(trecho || '').split('\n');
  for (const linha of linhas) {
    const achado = linha.match(/^\s*\d{2}\/\d{2}\/\d{4}\s+·\s+(.+?)\s*$/);
    if (achado) return achado[1];
  }
  return null;
};
