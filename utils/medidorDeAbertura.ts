/**
 * O PESO DE CADA ABERTURA (11/10/2026) — passo 0 do "egress de abertura".
 *
 * Mede quanto o app baixa do Supabase nos primeiros 30 segundos depois de abrir
 * do zero, para cada melhoria virar numero (0,4 MB -> ?), e nao chute.
 *
 * NAO PODE DAR ERRO, entao:
 *   - so OBSERVA: o pedido sai e volta igual, e a resposta devolvida e a mesma;
 *   - le o tamanho de uma COPIA da resposta (clone), em segundo plano;
 *   - qualquer falha da medicao e engolida — ela nunca chega ao pedido;
 *   - depois dos 30 segundos, para de medir de vez.
 *
 * O numero e guardado no aparelho e vai junto do registro da PROXIMA abertura
 * (metadata do shell_ready em app_runtime_events) — sem tabela nova, sem
 * gravacao a mais no banco.
 *
 * E o tamanho do JSON ja descompactado: um teto do que trafega. Serve para
 * comparar uma versao com a outra, que e o que importa.
 */

const JANELA_MS = 30_000;
const CHAVE = 'glyph:egress-abertura-v1';

const inicio = Date.now();
let bytes = 0;
let pedidos = 0;
let fechado = false;

const dentroDaJanela = () => !fechado && Date.now() - inicio <= JANELA_MS;

const fechar = () => {
    if (fechado) return;
    fechado = true;
    try {
        window.localStorage.setItem(CHAVE, JSON.stringify({ bytes, pedidos, janelaMs: JANELA_MS }));
    } catch {
        // Sem armazenamento, sem medicao. O app segue igual.
    }
};

// Dois segundos de folga para as copias ainda sendo lidas terminarem de somar.
if (typeof window !== 'undefined') {
    try { window.setTimeout(fechar, JANELA_MS + 2000); } catch { /* idem */ }
}

/** Envolve o fetch do Supabase sem mudar nada no pedido nem na resposta. */
export const medirFetch = (base: typeof fetch): typeof fetch => async (input, init) => {
    const resposta = await base(input, init);
    try {
        if (dentroDaJanela()) {
            pedidos += 1;
            void resposta.clone().arrayBuffer()
                .then((corpo) => { bytes += corpo.byteLength; })
                .catch(() => { /* copia ilegivel: so nao soma */ });
        }
    } catch {
        // A medicao nunca atrapalha o pedido.
    }
    return resposta;
};

/** O que esta abertura ja somou (para o teste e para conferir no console). */
export const pesoAteAgora = () => ({ bytes, pedidos, fechado });

/**
 * O peso da abertura ANTERIOR, para ir no registro desta. Le e apaga: cada
 * medicao entra uma vez so.
 */
export const pesoDaAberturaAnterior = (): { egress_anterior_kb: number; egress_anterior_pedidos: number } | null => {
    try {
        const bruto = window.localStorage.getItem(CHAVE);
        if (!bruto) return null;
        window.localStorage.removeItem(CHAVE);
        const dados = JSON.parse(bruto) as { bytes?: number; pedidos?: number };
        const kb = Math.round(Number(dados.bytes || 0) / 1024);
        const quantos = Math.round(Number(dados.pedidos || 0));
        if (!Number.isFinite(kb) || !Number.isFinite(quantos)) return null;
        return { egress_anterior_kb: kb, egress_anterior_pedidos: quantos };
    } catch {
        return null;
    }
};
