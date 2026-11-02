import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

/**
 * PERGUNTE AO ORACULO (02/11/2026, com o Afonso).
 *
 * A caixa do chat com IA, no rodape da aba "Dia e ciclo". A pergunta vai para
 * a funcao oraculo-ia, que olha os padroes da pessoa e responde. A cota e do
 * servidor: gratis 1 por dia, Premium 5, Platinum 15. Acabou, a caixa diz
 * quando volta e, no gratis, mostra o Premium.
 */
type Cota = { usadas: number; limite: number };

export const PerguntaAoOraculo: React.FC<{
    tom: string;
    gratis: boolean;
    onPergunta: (pergunta: string) => void;
    onResposta: (resposta: string) => void;
}> = ({ tom, gratis, onPergunta, onResposta }) => {
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [cota, setCota] = useState<Cota | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);

    useEffect(() => {
        let vivo = true;
        void supabase.rpc('oraculo_ia_restantes').then(({ data }) => {
            if (vivo && data && typeof data.limite === 'number') setCota({ usadas: Number(data.usadas) || 0, limite: data.limite });
        });
        return () => { vivo = false; };
    }, []);

    const acabou = Boolean(cota && cota.usadas >= cota.limite);

    const enviar = useCallback(async () => {
        const pergunta = texto.trim();
        if (!pergunta || enviando || acabou) return;
        setEnviando(true);
        setAviso(null);
        onPergunta(pergunta);
        setTexto('');
        const { data, error } = await supabase.functions.invoke('oraculo-ia', { body: { pergunta, tom } });
        setEnviando(false);
        if (data?.resposta) {
            onResposta(String(data.resposta));
            setCota({ usadas: data.usadas, limite: data.limite });
            return;
        }
        // O corpo do erro vem no contexto da resposta.
        let erro: { erro?: string; usadas?: number; limite?: number } | null = null;
        try { erro = await (error as { context?: Response })?.context?.json(); } catch { erro = null; }
        if (erro?.erro === 'LIMITE') {
            setCota({ usadas: erro.usadas ?? 0, limite: erro.limite ?? 1 });
            setAviso(null);
            return;
        }
        setTexto(pergunta);
        setAviso('O Oráculo não respondeu agora. Tente de novo em instantes; a pergunta não foi gasta.');
    }, [acabou, enviando, onPergunta, onResposta, texto, tom]);

    return (
        <div className="shrink-0 space-y-2 border-t border-white/10 bg-black/20 p-3">
            {acabou ? (
                <div className="space-y-2 text-center">
                    <p className="text-[11px] leading-relaxed text-white/60">
                        {gratis
                            ? 'Sua pergunta de hoje já foi. Amanhã tem outra. No Premium são 5 por dia, e o Oráculo responde no tom que você escolher.'
                            : `Você fez as ${cota?.limite} perguntas de hoje. Amanhã tem mais.`}
                    </p>
                    {gratis && (
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-store', { detail: { tab: 'membership', section: 'premium' } }))}
                            className="min-h-10 w-full rounded-xl border border-[var(--skin-accent-color)]/40 bg-[var(--skin-accent-color)]/10 px-3 text-xs font-bold text-[var(--skin-accent-color)]"
                        >
                            Ver o Premium
                        </button>
                    )}
                </div>
            ) : (
                <form
                    className="flex items-end gap-2"
                    onSubmit={(event) => { event.preventDefault(); void enviar(); }}
                >
                    <textarea
                        value={texto}
                        onChange={(event) => setTexto(event.target.value.slice(0, 400))}
                        onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void enviar(); } }}
                        rows={1}
                        placeholder="Pergunte ao Oráculo sobre seus padrões…"
                        aria-label="Pergunta ao Oráculo"
                        disabled={enviando}
                        className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[var(--skin-accent-color)]/60 focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={enviando || !texto.trim()}
                        className="min-h-11 shrink-0 rounded-xl bg-[var(--skin-accent-color)] px-4 text-xs font-black text-black disabled:opacity-40"
                    >
                        {enviando ? '…' : 'Perguntar'}
                    </button>
                </form>
            )}
            {!acabou && cota && (
                <p className="text-center text-[10px] text-white/40">
                    {cota.limite - cota.usadas} de {cota.limite} {cota.limite === 1 ? 'pergunta' : 'perguntas'} hoje
                </p>
            )}
            {aviso && <p className="text-center text-[11px] text-amber-200/80">{aviso}</p>}
        </div>
    );
};
