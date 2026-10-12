import React, { useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { metaBatida, podeReceber, rotuloDaMissao } from '../utils/missaoDoCla';

/**
 * A MISSAO DO CLA, NA TELA DO CLA (12/10/2026).
 * Mesma cara das missoes da temporada; barra do grupo em X/Y; quem entrou e
 * quanto cada um fez; botao Entrar no estilo do botao de missao do Oraculo.
 */
export const MissaoDoClaCard: React.FC = () => {
    const { missoesDeClaAtivas, missoesDoCla, entrarNaMissaoDoCla, receberPremioDaMissaoDoCla, atualizarMissaoDoCla, carregarHumorDoCla } = useGame();
    const [ocupado, setOcupado] = useState(false);
    const quest = missoesDeClaAtivas[0];
    // Abrir o cla recontar o grupo e o humor: o que os outros marcaram desde a
    // ultima vez aparece aqui, sem precisar fechar o app.
    useEffect(() => {
        if (quest) void atualizarMissaoDoCla(quest.id);
        void carregarHumorDoCla();
    }, [quest?.id]); // eslint-disable-line react-hooks/exhaustive-deps
    const status = quest ? missoesDoCla[quest.id] : undefined;
    if (!quest || !status || !status.temCla) return null;
    if (status.vencida && !metaBatida(status)) return null;

    const percentual = Math.min(100, (status.total / status.meta) * 100);
    const agir = async (fazer: () => Promise<boolean>) => {
        if (ocupado) return;
        setOcupado(true);
        try { await fazer(); } finally { setOcupado(false); }
    };

    return (
        <section className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-4" aria-labelledby="missao-do-cla-titulo">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--skin-accent-color)]">Missão do clã</p>
            <h3 id="missao-do-cla-titulo" className="mt-1 text-base font-bold text-white">{quest.title}</h3>
            <p className="mt-1 text-xs text-white/60">{quest.description}</p>
            <div className="mt-3">
                <div className="mb-1.5 flex justify-between text-[11px] text-white/65">
                    <span>Grupo</span>
                    <strong className="tabular-nums text-[var(--skin-accent-color)]">{rotuloDaMissao(status)}</strong>
                </div>
                <div role="progressbar" aria-label="Progresso do grupo" aria-valuemin={0} aria-valuemax={status.meta} aria-valuenow={Math.min(status.total, status.meta)} className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[var(--skin-accent-color)] transition-all" style={{ width: `${percentual}%` }} />
                </div>
            </div>
            {status.membros.length > 0 && (
                <ul className="mt-3 space-y-1">
                    {status.membros.map((membro) => (
                        <li key={membro.userId} className={`flex justify-between text-[11px] ${membro.ativo ? 'text-white/70' : 'text-white/35'}`}>
                            <span className="truncate">{membro.nickname}{membro.ativo ? '' : ' (saiu)'}</span>
                            <span className="tabular-nums text-white/50">{membro.feito}</span>
                        </li>
                    ))}
                </ul>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                <span className="text-[11px] text-white/55">Prêmio: 1 baú Raro para quem entrou</span>
                {!status.entrei && !status.vencida && (
                    <button type="button" disabled={ocupado} onClick={() => void agir(() => entrarNaMissaoDoCla(quest.id))} className="luxe-skin-button min-h-11 px-4 text-xs font-bold disabled:opacity-50">Entrar</button>
                )}
                {podeReceber(status) && (
                    <button type="button" disabled={ocupado} onClick={() => void agir(() => receberPremioDaMissaoDoCla(quest.id))} className="luxe-skin-button min-h-11 px-4 text-xs font-bold disabled:opacity-50">Receber</button>
                )}
                {status.entrei && !podeReceber(status) && (
                    <span className="text-[11px] font-bold text-white/60">{status.recebi ? 'Recebido' : 'Você está dentro'}</span>
                )}
            </div>
        </section>
    );
};
