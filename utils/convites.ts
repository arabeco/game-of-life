import { Capacitor } from '@capacitor/core';
import { Share as CapacitorShare } from '@capacitor/share';

/**
 * CONVIDE UM AMIGO (10/10/2026).
 *
 * O amigo digita o codigo no campo de cupom e ganha 10 de ouro; quem convidou
 * so conta o amigo quando ele completa os sete dias no app. A barrinha tem duas
 * bolinhas: 5 amigos pagam um bau Raro, 10 pagam 25 de ouro. Quem decide tudo
 * isso e o servidor (supabase/migrations/20261010150000_convite_de_amigo.sql);
 * aqui so se mostra e se chama.
 */

export const MARCOS_DE_CONVITE = [5, 10] as const;
export type MarcoDeConvite = typeof MARCOS_DE_CONVITE[number];
export const PREMIO_DO_MARCO: Record<MarcoDeConvite, string> = { 5: 'Baú Raro', 10: '25 de ouro' };

export interface MeusConvites {
    codigo: string;
    entraram: number;
    completaram: number;
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
        recebeu5: Boolean(bruto.recebeu_5),
        recebeu10: Boolean(bruto.recebeu_10),
    };
};

export const marcoRecebido = (convites: MeusConvites, marco: MarcoDeConvite) => (
    marco === 5 ? convites.recebeu5 : convites.recebeu10
);

/**
 * O link vai direto para a Play Store, com o codigo no `referrer`. Por enquanto
 * o app ainda nao le esse campo (etapa 2, nativa): o amigo digita o codigo, que
 * vai escrito na propria mensagem.
 */
export const linkDoConvite = (codigo: string) => (
    `https://play.google.com/store/apps/details?id=life.glyph.app&referrer=${encodeURIComponent(`convite=${codigo}`)}`
);

export const mensagemDoConvite = (codigo: string) => (
    `Bora usar o Glyph comigo: ${linkDoConvite(codigo)}\nMeu código de convite: ${codigo} (em Ajustes > Resgatar código)`
);

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
