import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { ditadoDisponivel, ouvirUmaFrase } from '../utils/ditado';
import { EVENTO_COTA_DO_ORACULO, PERGUNTAS_PRONTAS, perguntarAoOraculo } from '../utils/oraculoIa';
import { avisoDoOraculo } from '../utils/oraculoIaAvisos';

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
    /** Sem internet, erro ou conversas esgotadas: o Oraculo avisa no proprio chat. */
    onAviso: (texto: string, comPremium: boolean) => void;
    /** O primeiro card: a leitura do dia e do ciclo (cai na leitura por regras sem cota). */
    onLerMeuDia: () => void;
    lendoMeuDia: boolean;
}> = ({ tom, gratis, onPergunta, onResposta, onAviso, onLerMeuDia, lendoMeuDia }) => {
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [cota, setCota] = useState<Cota | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);
    const [temDitado, setTemDitado] = useState(false);
    const [ouvindo, setOuvindo] = useState(false);

    useEffect(() => {
        let vivo = true;
        void ditadoDisponivel().then((sim) => { if (vivo) setTemDitado(sim); });
        return () => { vivo = false; };
    }, []);

    // Fala e vira texto na caixa; a pessoa confere e manda.
    const ditar = useCallback(async () => {
        if (ouvindo || enviando) return;
        setOuvindo(true);
        setAviso(null);
        try {
            const falado = await ouvirUmaFrase();
            if (falado) setTexto((atual) => (atual ? `${atual} ${falado}` : falado).slice(0, 400));
        } catch (erro) {
            setAviso((erro as Error)?.message === 'SEM_PERMISSAO'
                ? 'Para falar a pergunta, libere o microfone para o Glyph.'
                : 'Não deu para ouvir agora. Tente de novo ou digite.');
        } finally {
            setOuvindo(false);
        }
    }, [enviando, ouvindo]);

    useEffect(() => {
        let vivo = true;
        void supabase.rpc('oraculo_ia_restantes').then(({ data }) => {
            if (vivo && data && typeof data.limite === 'number') setCota({ usadas: Number(data.usadas) || 0, limite: data.limite });
        });
        // O "Ler meu ciclo e arenas" gasta da mesma cota: o contador acompanha.
        const aoMudarCota = (evento: Event) => {
            const detalhe = (evento as CustomEvent<Cota>).detail;
            if (vivo && detalhe && typeof detalhe.limite === 'number') setCota(detalhe);
        };
        window.addEventListener(EVENTO_COTA_DO_ORACULO, aoMudarCota);
        return () => { vivo = false; window.removeEventListener(EVENTO_COTA_DO_ORACULO, aoMudarCota); };
    }, []);

    const acabou = Boolean(cota && cota.usadas >= cota.limite);

    const enviar = useCallback(async (pronta?: string) => {
        const pergunta = (pronta ?? texto).trim();
        if (!pergunta || enviando) return;
        if (acabou) {
            const aviso = avisoDoOraculo('LIMITE', { gratis, tom, limite: cota?.limite });
            onAviso(aviso.texto, aviso.premium);
            return;
        }
        setEnviando(true);
        setAviso(null);
        onPergunta(pergunta);
        if (!pronta) setTexto('');
        const resultado = await perguntarAoOraculo(pergunta, tom);
        setEnviando(false);
        if (resultado.ok) {
            onResposta(resultado.resposta);
            return;
        }
        const erro = 'erro' in resultado ? resultado.erro : 'FALHOU';
        const aviso = avisoDoOraculo(erro, { gratis, tom, limite: 'limite' in resultado ? resultado.limite : undefined });
        onAviso(aviso.texto, aviso.premium);
        // Sem internet ou erro: a pergunta volta para a caixa, pronta para mandar de novo.
        if (erro !== 'LIMITE' && !pronta) setTexto(pergunta);
    }, [acabou, cota?.limite, enviando, gratis, onAviso, onPergunta, onResposta, texto, tom]);

    // Os cards de pergunta pronta: uma fileira que desliza para o lado, acima da caixa.
    const cards = (
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]" role="group" aria-label="Perguntas prontas">
            <button
                id="oracle-read-my-day"
                type="button"
                onClick={onLerMeuDia}
                disabled={lendoMeuDia || enviando}
                className="shrink-0 rounded-full border border-[var(--skin-accent-color)]/45 bg-[var(--skin-accent-color)]/12 px-3 py-1.5 text-[11px] font-bold text-[var(--skin-accent-color)] disabled:opacity-50"
            >
                {lendoMeuDia ? 'Lendo seu dia…' : 'Ler meu dia e ciclo'}
            </button>
            {PERGUNTAS_PRONTAS.map(({ rotulo, pergunta }) => (
                <button
                    key={rotulo}
                    type="button"
                    onClick={() => { void enviar(pergunta); }}
                    disabled={enviando || lendoMeuDia}
                    className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/80 disabled:opacity-50"
                >
                    {rotulo}
                </button>
            ))}
        </div>
    );

    return (
        <div className="shrink-0 space-y-2 border-t border-white/10 bg-black/20 p-3">
            {cards}
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
                        placeholder="Pergunte ao Oráculo…"
                        aria-label="Pergunta ao Oráculo"
                        disabled={enviando}
                        className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[var(--skin-accent-color)]/60 focus:outline-none"
                    />
                    {temDitado && (
                        <button
                            type="button"
                            onClick={() => { void ditar(); }}
                            disabled={enviando}
                            aria-label={ouvindo ? 'Ouvindo' : 'Falar a pergunta'}
                            className={`grid min-h-11 w-11 shrink-0 place-items-center rounded-xl border transition-colors disabled:opacity-40 ${ouvindo ? 'animate-pulse border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)]' : 'border-white/15 bg-white/5 text-white/70'}`}
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="9" y="3" width="6" height="11" rx="3" />
                                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                            </svg>
                        </button>
                    )}
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
