/**
 * O CODIGO DE CONVITE DENTRO DO REFERRER DA PLAY STORE.
 *
 * O link de convite e `...details?id=life.glyph.app&referrer=convite%3DCODIGO`.
 * A Play Store entrega o valor do `referrer` ja decodificado uma vez
 * ("convite=CODIGO"), mas ha lojas e versoes que o devolvem ainda codificado —
 * entao aceita os dois. Quem instalou sem link recebe algo como
 * "utm_source=google-play&utm_medium=organic", e isso nao e convite.
 *
 * Sem dependencia nenhuma, para o teste conseguir carregar direto.
 */
const FORMATO_DO_CODIGO = /^[A-Z0-9]{1,8}-[A-Z0-9]{3}$/;

export const extrairCodigoDoReferrer = (referrer?: string | null): string | null => {
    let texto = String(referrer || '').trim();
    if (!texto) return null;
    if (/%[0-9a-f]{2}/i.test(texto)) {
        try {
            texto = decodeURIComponent(texto);
        } catch {
            return null;
        }
    }
    const codigo = (new URLSearchParams(texto).get('convite') || '').trim().toUpperCase();
    return FORMATO_DO_CODIGO.test(codigo) ? codigo : null;
};

/**
 * O que fazer com o codigo guardado depois de tentar usar.
 *
 * Erro DEFINITIVO (o servidor respondeu "nao"): esquecer — tentar de novo nunca
 * daria certo. Falha de rede ou servidor fora: GUARDAR, e tentar na proxima
 * abertura. O servidor ja impede pagar duas vezes (um convite por conta).
 */
export const conviteDeveSerEsquecido = (resultado: { ok: boolean; definitivo?: boolean }) => (
    resultado.ok || Boolean(resultado.definitivo)
);
