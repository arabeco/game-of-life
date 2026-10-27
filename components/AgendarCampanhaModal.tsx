import React, { useEffect, useState } from 'react';
import { Portal } from './Portal';
import { useGame, getLocalDateString } from '../contexts/GameContext';
import type { UserCodex } from '../types';
import { EVENTO_AGENDAR_CAMPANHA } from '../utils/agendaDaCampanha';

/**
 * AGENDAR A CAMPANHA AO INICIAR (27/10/2026, decidido com o Afonso).
 *
 * Campanha cujo modelo diz o dia de cada acao pergunta antes de instalar:
 * agendar tudo, e a partir de quando. Aceitando, cada acao cai no planner no
 * dia dela, no horario sugerido (a pessoa muda o horario depois). Recusando,
 * instala como sempre e a pessoa agenda a mao.
 */
export { EVENTO_AGENDAR_CAMPANHA };

type Pedido = { codexId: string; titulo: string; source?: UserCodex };

const somarUmDia = (data: string) => {
    const [a, m, d] = data.split('-').map(Number);
    return new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10);
};

export const AgendarCampanhaModal: React.FC = () => {
    const { installCodex } = useGame();
    const [pedido, setPedido] = useState<Pedido | null>(null);
    const hoje = getLocalDateString();
    const amanha = somarUmDia(hoje);
    const [inicio, setInicio] = useState(hoje);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        const ouvir = (event: Event) => {
            const detalhe = (event as CustomEvent<Pedido>).detail;
            if (!detalhe?.codexId) return;
            setInicio(getLocalDateString());
            setPedido(detalhe);
        };
        window.addEventListener(EVENTO_AGENDAR_CAMPANHA, ouvir);
        return () => window.removeEventListener(EVENTO_AGENDAR_CAMPANHA, ouvir);
    }, []);

    if (!pedido) return null;
    const iniciar = async (agendarEm: string | null) => {
        if (enviando) return;
        setEnviando(true);
        try {
            await installCodex(pedido.codexId, pedido.source, { agendarEm });
            setPedido(null);
        } finally {
            setEnviando(false);
        }
    };
    const escolha = (valor: string, rotulo: string) => (
        <button
            type="button"
            aria-pressed={inicio === valor}
            onClick={() => setInicio(valor)}
            className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold ${inicio === valor ? 'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/15 text-white' : 'border-white/12 bg-black/25 text-white/65'}`}
        >
            {rotulo}
        </button>
    );

    return (
        <Portal>
            <div className="ui-modal-backdrop z-[120] flex items-center justify-center p-4" onClick={() => !enviando && setPedido(null)}>
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="agendar-campanha-titulo"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm rounded-2xl border border-[var(--skin-accent-color)]/35 bg-[#0d0f13] p-5 text-center shadow-2xl"
                >
                    <h2 id="agendar-campanha-titulo" className="text-base font-black text-white">Agendar "{pedido.titulo}"?</h2>
                    <p className="mt-2 text-xs leading-relaxed text-white/60">
                        Cada ação entra no planner no dia dela, no horário sugerido. Você muda o horário de qualquer uma depois. As próximas fases entram quando abrirem.
                    </p>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Começar em</p>
                    <div className="mt-2 flex gap-2">
                        {escolha(hoje, 'Hoje')}
                        {escolha(amanha, 'Amanhã')}
                        <label className={`flex flex-1 items-center justify-center rounded-xl border px-2 py-2 text-xs font-bold ${inicio !== hoje && inicio !== amanha ? 'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/15 text-white' : 'border-white/12 bg-black/25 text-white/65'}`}>
                            <span className="sr-only">Outro dia</span>
                            <input
                                type="date"
                                min={hoje}
                                value={inicio !== hoje && inicio !== amanha ? inicio : ''}
                                onChange={(e) => e.target.value && setInicio(e.target.value)}
                                className="w-full bg-transparent text-center text-xs text-inherit outline-none"
                                aria-label="Outro dia"
                            />
                        </label>
                    </div>
                    <button type="button" disabled={enviando} onClick={() => void iniciar(inicio)} className="luxe-skin-button mt-5 w-full rounded-xl py-3 text-xs font-black uppercase tracking-widest">
                        {enviando ? 'Iniciando…' : 'Agendar e iniciar'}
                    </button>
                    <button type="button" disabled={enviando} onClick={() => void iniciar(null)} className="mt-2 w-full py-2 text-xs font-bold text-white/55 hover:text-white">
                        Iniciar sem agendar
                    </button>
                </div>
            </div>
        </Portal>
    );
};
