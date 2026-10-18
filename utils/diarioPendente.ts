import type { DestinoDaEntrada } from './diario';

/**
 * A FILA DO DIARIO (18/10/2026, pedido do Afonso depois do teste do Luigi).
 *
 * O app nao tem modo offline, mas o diario e o lugar onde mais se escreve sem
 * pensar em conexao. Sem internet, a entrada vai para esta fila no aparelho e
 * sai sozinha quando a conexao volta (useEnviarDiarioPendente), na ordem em que
 * foi escrita.
 *
 * Por que guardar a ENTRADA e nao a pagina pronta: a pagina pode mudar ate a
 * rede voltar (outro aparelho, o editor). Somar a entrada na hora do envio, com
 * a pagina lida naquele momento, e o que nunca grava por cima de nada.
 *
 * Fica no localStorage por conta. Se ele nao existir ou estiver cheio, a fila
 * diz que nao guardou, e a tela volta ao comportamento antigo: avisa e mantem
 * o texto no campo.
 */
export interface EntradaPendente {
  id: string;
  cabecalho: string;
  texto: string;
  destino: DestinoDaEntrada;
  /** O valor do humor, para a linha do tempo; null quando foi sem humor. */
  humor: number | null;
  criadaEm: string;
}

type Armazem = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const chave = (userId: string) => `glyph:diario-pendente:v1:${userId}`;

const armazemPadrao = (): Armazem | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

export const lerPendentes = (userId: string, armazem: Armazem | null = armazemPadrao()): EntradaPendente[] => {
  if (!armazem || !userId) return [];
  try {
    const lista = JSON.parse(armazem.getItem(chave(userId)) || '[]');
    return Array.isArray(lista) ? lista.filter((e) => e && typeof e.texto === 'string' && typeof e.id === 'string') : [];
  } catch {
    return [];
  }
};

const gravarLista = (userId: string, lista: EntradaPendente[], armazem: Armazem): boolean => {
  try {
    if (lista.length) armazem.setItem(chave(userId), JSON.stringify(lista));
    else armazem.removeItem(chave(userId));
    return true;
  } catch {
    return false;
  }
};

/** Poe a entrada no fim da fila. false quando o aparelho nao deixou guardar. */
export const guardarPendente = (
  userId: string,
  entrada: Omit<EntradaPendente, 'id' | 'criadaEm'>,
  armazem: Armazem | null = armazemPadrao(),
): boolean => {
  if (!armazem || !userId) return false;
  const nova: EntradaPendente = {
    ...entrada,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    criadaEm: new Date().toISOString(),
  };
  let atual: EntradaPendente[];
  try {
    atual = JSON.parse(armazem.getItem(chave(userId)) || '[]');
    if (!Array.isArray(atual)) atual = [];
  } catch {
    return false;
  }
  return gravarLista(userId, [...atual, nova], armazem);
};

const emEnvio = new Set<string>();

/**
 * Envia na ordem e para na primeira falha: o que nao saiu continua na fila, e a
 * proxima tentativa recomeca dali. Duas chamadas ao mesmo tempo (o app voltou do
 * fundo e a rede voltou juntos) nao enviam a mesma entrada duas vezes.
 *
 * Devolve quantas sairam.
 */
export const enviarPendentes = async (
  userId: string,
  enviar: (entrada: EntradaPendente) => Promise<boolean>,
  armazem: Armazem | null = armazemPadrao(),
): Promise<number> => {
  if (!armazem || !userId || emEnvio.has(userId)) return 0;
  emEnvio.add(userId);
  let enviadas = 0;
  try {
    for (const entrada of lerPendentes(userId, armazem)) {
      let ok = false;
      try {
        ok = await enviar(entrada);
      } catch {
        ok = false;
      }
      if (!ok) break;
      enviadas += 1;
      // Relida a cada passo: uma entrada pode ter entrado na fila no meio do envio.
      gravarLista(userId, lerPendentes(userId, armazem).filter((e) => e.id !== entrada.id), armazem);
    }
  } finally {
    emEnvio.delete(userId);
  }
  return enviadas;
};
