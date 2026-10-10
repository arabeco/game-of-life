import React, { useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import {
    MARCOS_DE_CONVITE,
    PREMIO_DO_MARCO,
    compartilharConvite,
    copiarTexto,
    marcoRecebido,
    type MarcoDeConvite,
    type MeusConvites,
} from '../utils/convites';

/**
 * O CONVITE, LOGO ABAIXO DO CAMPO DE CUPOM (10/10/2026).
 *
 * O codigo com copiar e compartilhar, e uma barrinha discreta com bolinha no 5
 * e no 10. A barrinha conta so quem completou os sete dias no app: e assim que
 * o servidor paga. Sem a migracao do convite, o bloco simplesmente nao aparece.
 */
/** Um risquinho por amigo, menos onde ja tem bolinha. */
const RISQUINHOS = Array.from({ length: 9 }, (_, i) => i + 1)
    .filter((n) => !(MARCOS_DE_CONVITE as readonly number[]).includes(n));

export const ConviteDeAmigo: React.FC = () => {
    const { buscarMeusConvites, receberPremioDeConvite, showToast } = useGame();
    const [convites, setConvites] = useState<MeusConvites | null>(null);
    const [recebendo, setRecebendo] = useState<MarcoDeConvite | null>(null);

    useEffect(() => {
        let vivo = true;
        void buscarMeusConvites().then((dados) => { if (vivo) setConvites(dados); });
        return () => { vivo = false; };
        // Busca uma vez por abertura do modal.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!convites) return null;

    const meta = MARCOS_DE_CONVITE[MARCOS_DE_CONVITE.length - 1];
    const preenchido = Math.min(100, (convites.completaram / meta) * 100);

    const copiar = async () => {
        await copiarTexto(convites.codigo);
        showToast('Código copiado.', 'success');
    };

    const compartilhar = async () => {
        const resultado = await compartilharConvite(convites.codigo);
        if (resultado === 'copiado') showToast('Convite copiado. Cole onde quiser mandar.', 'success');
    };

    const receber = async (marco: MarcoDeConvite) => {
        setRecebendo(marco);
        const ok = await receberPremioDeConvite(marco);
        setRecebendo(null);
        if (ok) setConvites(await buscarMeusConvites());
    };

    return (
        <div className="space-y-3 border-t border-white/8 pt-4" data-testid="convite-de-amigo">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--ui-card-text-soft)]">
                Seu código de convite
            </div>
            <div className="flex items-center gap-2">
                <span className="flex-1 truncate rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center text-sm font-black tracking-[0.16em] text-white">
                    {convites.codigo}
                </span>
                <button
                    type="button"
                    onClick={() => void copiar()}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/72"
                >
                    Copiar
                </button>
                <button
                    type="button"
                    onClick={() => void compartilhar()}
                    className="rounded-xl border border-[var(--skin-accent-color)]/30 bg-[var(--skin-accent-color)]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--skin-accent-color)]"
                >
                    Enviar
                </button>
            </div>

            {/* A barrinha (pedido de 10/10/2026): trilho fundo, um risquinho para
                cada amigo, gradiente no que ja contou, e o 5 e o 10 escritos
                dentro das bolinhas. */}
            <div
                className="relative mx-3 mt-3 h-[6px] rounded-full bg-white/[0.07] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
                aria-label={`${convites.completaram} de ${meta} amigos`}
            >
                <div
                    className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
                    style={{
                        width: `${preenchido}%`,
                        background: 'linear-gradient(90deg, color-mix(in srgb, var(--skin-accent-color) 30%, transparent), var(--skin-accent-color) 70%, color-mix(in srgb, var(--skin-accent-color) 65%, #fff))',
                        boxShadow: preenchido > 0 ? '0 0 10px color-mix(in srgb, var(--skin-accent-color) 55%, transparent)' : 'none',
                    }}
                />
                {RISQUINHOS.map((n) => (
                    <span
                        key={n}
                        className={`absolute top-1/2 h-[10px] w-px -translate-x-1/2 -translate-y-1/2 rounded-full ${convites.completaram >= n ? 'bg-black/35' : 'bg-white/[0.18]'}`}
                        style={{ left: `${(n / meta) * 100}%` }}
                    />
                ))}
                {MARCOS_DE_CONVITE.map((marco) => {
                    const recebido = marcoRecebido(convites, marco);
                    const pronto = !recebido && convites.completaram >= marco;
                    return (
                        <button
                            key={marco}
                            type="button"
                            disabled={!pronto || recebendo !== null}
                            onClick={() => void receber(marco)}
                            aria-label={pronto ? `Receber ${PREMIO_DO_MARCO[marco]}` : `${marco} amigos: ${PREMIO_DO_MARCO[marco]}`}
                            className={`absolute top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[9px] font-black tabular-nums transition-all ${
                                pronto
                                    ? 'animate-pulse border-transparent text-black'
                                    : recebido
                                        ? 'border-[var(--skin-accent-color)]/60 bg-[#1b1c20] text-[var(--skin-accent-color)]'
                                        : 'border-white/15 bg-[#15181d] text-white/45'
                            }`}
                            style={{
                                left: `${(marco / meta) * 100}%`,
                                ...(pronto ? {
                                    background: 'radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--skin-accent-color) 55%, #fff), var(--skin-accent-color) 60%, color-mix(in srgb, var(--skin-accent-color) 70%, #000))',
                                    boxShadow: '0 0 12px color-mix(in srgb, var(--skin-accent-color) 70%, transparent)',
                                } : {}),
                            }}
                        >
                            {marco}
                        </button>
                    );
                })}
            </div>
            <div className="relative mx-3 mt-1 h-6 text-[9px] leading-tight text-white/45">
                {MARCOS_DE_CONVITE.map((marco) => {
                    const recebido = marcoRecebido(convites, marco);
                    const pronto = !recebido && convites.completaram >= marco;
                    return (
                        <span
                            key={marco}
                            // A do fim alinha pela direita, senao o texto vaza do modal.
                            className={`absolute whitespace-nowrap ${marco === meta ? '-translate-x-full text-right' : '-translate-x-1/2 text-center'} ${pronto ? 'font-bold text-[var(--skin-accent-color)]' : ''}`}
                            style={{ left: `${(marco / meta) * 100}%` }}
                        >
                            {recebido ? 'recebido' : pronto ? 'toque para receber' : PREMIO_DO_MARCO[marco]}
                        </span>
                    );
                })}
            </div>
            <p className="text-[10px] leading-snug text-white/40">
                {convites.entraram} {convites.entraram === 1 ? 'amigo entrou' : 'amigos entraram'} · {convites.completaram} {convites.completaram === 1 ? 'completou' : 'completaram'} os 7 dias.
                {' '}O amigo ganha 10 de ouro ao usar seu código; ele conta aqui quando completar os 7 dias no app.
            </p>
        </div>
    );
};
