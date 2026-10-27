import React, { useEffect } from 'react';
import { Portal } from './Portal';
import { ClockIcon, LightbulbIcon, MoonIcon, SparklesIcon, TrophyIcon, XIcon } from './Icons';
import { MOODS_DATA } from '../constants';
import type { EntradaDoDiario, TagDoDiario } from '../utils/diario';
import { useLeitorEscuro } from '../utils/leitorEscuro';
import './leitor.css';

/**
 * LER A PAGINA DO DIARIO EM TELA CHEIA (27/10/2026).
 *
 * A pagina inteira no papel do leitor de aula: as entradas empilhadas em
 * cartoes finos e afundados, na ordem em que foram escritas, cada um com a
 * bolinha na cor do humor e a tag do tipo de escrita. So le; editar continua
 * no botao Editar.
 */
export const corDoHumor = (humor: string | null): string | null =>
    (humor && MOODS_DATA.find((mood) => mood.label === humor)?.trackEnd) || null;

// O simbolo de cada tag.
export const ICONE_DA_TAG: Record<TagDoDiario, React.FC<{ className?: string }>> = {
    Ideia: LightbulbIcon,
    'Reflexão': MoonIcon,
    'Gratidão': SparklesIcon,
    Conquista: TrophyIcon,
    Lembrete: ClockIcon,
};

export const LeitorDoDiario: React.FC<{ entradas: EntradaDoDiario[]; pagina: number | null; onFechar: () => void }> = ({ entradas, pagina, onFechar }) => {
    const [escuro, alternarEscuro] = useLeitorEscuro();
    useEffect(() => {
        const teclas = (event: KeyboardEvent) => { if (event.key === 'Escape') onFechar(); };
        window.addEventListener('keydown', teclas);
        return () => window.removeEventListener('keydown', teclas);
    }, [onFechar]);

    return (
        <Portal>
            <div className={`fixed inset-0 z-[10050] bg-black/88 backdrop-blur-md ${escuro ? 'leitor-escuro' : ''}`} role="dialog" aria-modal="true" aria-label={`Diário, página ${pagina ?? ''}`}>
                <div className="leitor-papel flex h-full w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,245,214,0.94)_0%,_rgba(245,228,186,0.98)_38%,_rgba(230,206,156,0.98)_100%)]">
                    <div className="leitor-topo flex items-center justify-between border-b border-[#8a6b38]/25 bg-[linear-gradient(180deg,rgba(255,251,234,0.84),rgba(241,219,174,0.78))] px-4 py-4" style={{ paddingTop: 'calc(1rem + var(--safe-area-top, 0px))' }}>
                        <div className="min-w-0">
                            <div className="leitor-rotulo text-[11px] font-bold uppercase tracking-[0.36em] text-[#7e6234]">Diário</div>
                            <div className="leitor-titulo truncate pt-1 text-base font-black uppercase tracking-[0.14em] text-[#3f2b13]">Página {pagina}</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={alternarEscuro} aria-label={escuro ? 'Modo claro' : 'Modo escuro'} title={escuro ? 'Modo claro' : 'Modo escuro'} className="leitor-botao flex h-11 w-11 items-center justify-center rounded-full border border-[#8a6b38]/35 bg-white/35 text-lg text-[#4b3318] hover:bg-white/55">
                                {escuro ? '☀️' : '🌙'}
                            </button>
                            <div className="leitor-botao rounded-full border border-[#8a6b38]/30 bg-white/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#6d532b]">
                                {entradas.length} {entradas.length === 1 ? 'entrada' : 'entradas'}
                            </div>
                            <button type="button" onClick={onFechar} aria-label="Fechar leitura" className="leitor-botao flex h-11 w-11 items-center justify-center rounded-full border border-[#8a6b38]/35 bg-white/35 text-[#4b3318] hover:bg-white/55">
                                <XIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-5" style={{ paddingBottom: 'calc(1.25rem + var(--safe-area-bottom, 0px))' }}>
                        <div className="mx-auto flex max-w-xl flex-col gap-2">
                            {entradas.map((entrada, indice) => {
                                const cor = corDoHumor(entrada.humor);
                                const Icone = entrada.tag ? ICONE_DA_TAG[entrada.tag] : null;
                                return (
                                    <article
                                        key={indice}
                                        className="leitor-cartao relative flex items-center gap-3 overflow-hidden rounded-lg bg-[rgba(214,190,140,0.32)] px-3.5 py-2.5"
                                        style={{ boxShadow: 'inset 0 2px 7px rgba(63,43,19,0.22), inset 0 -1px 3px rgba(255,250,232,0.55), inset 0 0 0 1px rgba(138,107,56,0.14)' }}
                                    >
                                        {/* A bolinha do humor ao lado do texto, no meio da altura do card. */}
                                        {cor && <span role="img" aria-label={`Humor: ${entrada.humor}`} className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cor, boxShadow: `0 0 6px ${cor}aa` }} />}
                                        <div className="min-w-0 flex-1">
                                        {(entrada.data || entrada.tag || entrada.humor) && (
                                            <header className="leitor-rotulo mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#7d6237]">
                                                {Icone && <Icone className="h-3 w-3 shrink-0" />}
                                                {entrada.tag && <span className="leitor-rotulo-forte text-[#5c4321]">{entrada.tag}</span>}
                                                {entrada.tag && (entrada.data || entrada.humor) && <span aria-hidden="true">·</span>}
                                                <span>{[entrada.data, entrada.humor].filter(Boolean).join(' · ')}</span>
                                            </header>
                                        )}
                                        <p className="leitor-texto whitespace-pre-wrap font-serif text-[14px] leading-6 text-[#3d2a14]">{entrada.texto || '…'}</p>
                                        </div>
                                    </article>
                                );
                            })}
                            {/* Numero da pagina embaixo a direita, como em livro. */}
                            <div className="leitor-rotulo mt-3 text-right font-serif text-[13px] italic text-[#7d6237]">{pagina}</div>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
