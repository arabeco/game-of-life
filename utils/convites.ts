import { Capacitor } from '@capacitor/core';
import { Share as CapacitorShare } from '@capacitor/share';

/** Convites contam ao vincular a conta: prêmios nos marcos 1, 5 e 10. */

export const MARCOS_DE_CONVITE = [1, 5, 10] as const;
export type MarcoDeConvite = typeof MARCOS_DE_CONVITE[number];
// Baratos de proposito (12/10/2026): o amigo conta ao por o codigo, entao conta
// falsa nao pode render nada de valor.
export const PREMIO_DO_MARCO: Record<MarcoDeConvite, string> = { 1: '10 fragmentos', 5: 'Baú Comum', 10: 'Baú Incomum' };

export interface MeusConvites {
    codigo: string;
    entraram: number;
    completaram: number;
    recebeu1: boolean;
    recebeu5: boolean;
    recebeu10: boolean;
}

export const lerMeusConvites = (data: unknown): MeusConvites | null => {
    const bruto = (data || {}) as Record<string, unknown>;
    const codigo = typeof bruto.codigo === 'string' ? bruto.codigo : '';
    if (!codigo) return null;
    return {
        codigo,
        entraram: Number(bruto.entraram || 0),
        completaram: Number(bruto.completaram || 0),
        recebeu1: Boolean(bruto.recebeu_1),
        recebeu5: Boolean(bruto.recebeu_5),
        recebeu10: Boolean(bruto.recebeu_10),
    };
};

export const marcoRecebido = (convites: MeusConvites, marco: MarcoDeConvite) => (
    marco === 1 ? convites.recebeu1 : marco === 5 ? convites.recebeu5 : convites.recebeu10
);

/**
 * O link vai direto para a Play Store, com o codigo no `referrer`. A leitura nativa guarda o código até o cadastro; a mensagem também traz o código para digitar.
 */
export const linkDoConvite = (codigo: string) => (
    `https://play.google.com/store/apps/details?id=life.glyph.app&referrer=${encodeURIComponent(`convite=${codigo}`)}`
);

// Liberar somente após confirmar a página pública de produção na Play.
export const ANDROID_PUBLICO_DISPONIVEL = false;
export const mensagemDoConvite = (codigo: string) => ANDROID_PUBLICO_DISPONIVEL
    ? `Bora usar o Glyph comigo: ${linkDoConvite(codigo)}\nMeu código de convite: ${codigo} (em Ajustes > Resgatar código)`
    : `Meu código de convite no Glyph: ${codigo}\nSe você já tem acesso ao app, crie sua conta e use o código em Ajustes > Resgatar código. O download público estará disponível em breve.`;

/** Abre a bandeja de compartilhar do celular; sem ela, copia a mensagem. */
export const compartilharConvite = async (codigo: string): Promise<'compartilhado' | 'copiado' | 'cancelado'> => {
    const text = mensagemDoConvite(codigo);
    try {
        if (Capacitor.isNativePlatform()) {
            await CapacitorShare.share({ title: 'Convite para o Glyph', text, dialogTitle: 'Convidar um amigo' });
            return 'compartilhado';
        }
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            await navigator.share({ title: 'Convite para o Glyph', text });
            return 'compartilhado';
        }
    } catch (erro) {
        const mensagem = String((erro as Error)?.message || erro || '');
        if (/cancel|abort/i.test(mensagem)) return 'cancelado';
    }
    await copiarTexto(text);
    return 'copiado';
};

export const copiarTexto = async (texto: string) => {
    try {
        await navigator.clipboard.writeText(texto);
        return;
    } catch {
        // Sem a API (contexto inseguro ou WebView antiga): o caminho velho.
        const campo = document.createElement('textarea');
        campo.value = texto;
        campo.style.position = 'fixed';
        campo.style.opacity = '0';
        document.body.appendChild(campo);
        campo.select();
        document.execCommand('copy');
        campo.remove();
    }
};

/**
 * O que a pessoa le quando o codigo nao entra. Antes o modal de cupom mostrava
 * o erro cru do servidor ("CODE_NOT_FOUND").
 */
export const mensagemDoErroDeCodigo = (erro?: string | null): string => {
    switch (erro) {
        case 'CODE_NOT_FOUND': return 'Código não encontrado.';
        case 'CODE_INACTIVE': return 'Este código está desligado.';
        case 'CODE_NOT_STARTED': return 'Este código ainda não começou a valer.';
        case 'CODE_EXPIRED': return 'Este código já venceu.';
        case 'CODE_LIMIT_REACHED': return 'As vagas deste código acabaram.';
        case 'CODE_ALREADY_REDEEMED': return 'Você já resgatou este código.';
        case 'OWN_CODE': return 'Esse é o seu código. Mande para um amigo usar.';
        case 'INVITE_ALREADY_USED': return 'Você já usou um código de convite.';
        case 'ACCOUNT_TOO_OLD': return 'Código de convite vale só para contas criadas há até 7 dias.';
        default: return erro || 'Não consegui resgatar esse código agora.';
    }
};
