import { Capacitor, registerPlugin } from '@capacitor/core';
import { extrairCodigoDoReferrer } from './referrerDoConvite';

/**
 * CONVITE, ETAPA 2 (10/10/2026): o app aplica sozinho o codigo de quem
 * instalou pelo link.
 *
 * 1. Na primeira abertura, le o referrer da Play Store (InstallReferrerPlugin).
 * 2. Se ele traz `convite=CODIGO`, guarda o codigo no aparelho.
 * 3. Com a conta pronta, o GameContext usa o codigo e so entao o esquece.
 *
 * O codigo fica guardado ate o servidor responder — fechar o app no meio do
 * cadastro ou perder a conexao nao perde o convite. E o servidor nao paga duas
 * vezes: uma conta usa um convite so.
 *
 * Quem ja tinha o app, ou instalou sem o link, digita o codigo no campo de cupom.
 */

interface InstallReferrerPlugin {
    getReferrer(): Promise<{ referrer?: string; erro?: string }>;
}

const InstallReferrer = registerPlugin<InstallReferrerPlugin>('InstallReferrer');

const CHAVE_LIDO = 'glyph:referrer-lido-v1';
const CHAVE_PENDENTE = 'glyph:convite-pendente-v1';

const ler = (chave: string) => {
    try { return window.localStorage.getItem(chave); } catch { return null; }
};
const gravar = (chave: string, valor: string) => {
    try { window.localStorage.setItem(chave, valor); } catch { /* sem armazenamento, sem convite automatico */ }
};
const apagar = (chave: string) => {
    try { window.localStorage.removeItem(chave); } catch { /* idem */ }
};

/** Le o referrer UMA vez por instalacao e guarda o codigo, se vier um. */
export const lerConviteDaInstalacao = async (): Promise<void> => {
    if (Capacitor.getPlatform() !== 'android') return;
    if (ler(CHAVE_LIDO)) return;

    const resposta = await Promise.race([
        InstallReferrer.getReferrer().catch(() => ({ erro: 'PLUGIN_AUSENTE' } as { referrer?: string; erro?: string })),
        new Promise<{ erro: string }>((resolver) => setTimeout(() => resolver({ erro: 'TEMPO_ESGOTADO' }), 8000)),
    ]);

    // Servico da Play fora do ar: nao marca como lido, tenta na proxima abertura.
    // Os outros erros (aparelho sem Play, binario sem o plugin) nao melhoram com
    // o tempo — marca e segue.
    const passageiro = resposta.erro === 'SERVICE_UNAVAILABLE'
        || resposta.erro === 'SERVICE_DISCONNECTED'
        || resposta.erro === 'TEMPO_ESGOTADO';
    if (passageiro) return;

    gravar(CHAVE_LIDO, new Date().toISOString());
    const codigo = extrairCodigoDoReferrer((resposta as { referrer?: string }).referrer);
    if (codigo) gravar(CHAVE_PENDENTE, codigo);
};

export const conviteDaInstalacaoPendente = () => ler(CHAVE_PENDENTE);
export const esquecerConviteDaInstalacao = () => apagar(CHAVE_PENDENTE);
