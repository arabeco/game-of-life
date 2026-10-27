import React, { useEffect, useRef, useState } from 'react';
import { Portal } from './Portal';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from './Icons';
import type { EntradaDoDiario } from '../utils/diario';

/**
 * LER O DIARIO EM TELA CHEIA (27/10/2026).
 *
 * O mesmo papel do leitor de aula (ActionModal): uma entrada por pagina, da
 * mais antiga para a mais nova, como um livro. Passa tocando nas laterais,
 * arrastando para o lado ou nas setas (teclado tambem). So le: editar continua
 * no botao Editar da pagina.
 */
export const LeitorDoDiario: React.FC<{ entradas: EntradaDoDiario[]; pagina: number | null; onFechar: () => void }> = ({ entradas, pagina, onFechar }) => {
    const [indice, setIndice] = useState(0);
    const inicioDoToque = useRef<{ x: number; y: number } | null>(null);
    const total = entradas.length;
    const ir = (proximo: number) => setIndice(Math.max(0, Math.min(total - 1, proximo)));

    useEffect(() => {
        const teclas = (event: KeyboardEvent) => {
            if (event.key === 'ArrowRight') ir(indice + 1);
            else if (event.key === 'ArrowLeft') ir(indice - 1);
            else if (event.key === 'Escape') onFechar();
        };
        window.addEventListener('keydown', teclas);
        return () => window.removeEventListener('keydown', teclas);
    });

    if (!total) return null;
    const entrada = entradas[indice];
    const cabecalho = [entrada.data, entrada.humor, entrada.tag].filter(Boolean).join(' · ');

    return (
        <Portal>
            <div className="fixed inset-0 z-[10050] bg-black/88 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={`Diário, página ${pagina ?? ''}`}>
                <div className="flex h-full w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,245,214,0.94)_0%,_rgba(245,228,186,0.98)_38%,_rgba(230,206,156,0.98)_100%)]">
                    <div className="flex items-center justify-between border-b border-[#8a6b38]/25 bg-[linear-gradient(180deg,rgba(255,251,234,0.84),rgba(241,219,174,0.78))] px-4 py-4" style={{ paddingTop: 'calc(1rem + var(--safe-area-top, 0px))' }}>
                        <div className="min-w-0">
                            <div className="text-[11px] font-bold uppercase tracking-[0.36em] text-[#7e6234]">Diário</div>
                            <div className="truncate pt-1 text-base font-black uppercase tracking-[0.14em] text-[#3f2b13]">Página {pagina}</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="rounded-full border border-[#8a6b38]/30 bg-white/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#6d532b]">
                                {indice + 1}/{total}
                            </div>
                            <button type="button" onClick={onFechar} aria-label="Fechar leitura" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#8a6b38]/35 bg-white/35 text-[#4b3318] hover:bg-white/55">
                                <XIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div
                        className="relative flex-1 overflow-y-auto px-6 py-8"
                        onTouchStart={(event) => { inicioDoToque.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
                        onTouchEnd={(event) => {
                            const inicio = inicioDoToque.current;
                            inicioDoToque.current = null;
                            if (!inicio) return;
                            const dx = event.changedTouches[0].clientX - inicio.x;
                            const dy = event.changedTouches[0].clientY - inicio.y;
                            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) ir(indice + (dx < 0 ? 1 : -1));
                        }}
                        onClick={(event) => {
                            if (window.getSelection()?.toString()) return;
                            const largura = event.currentTarget.clientWidth;
                            const x = event.clientX - event.currentTarget.getBoundingClientRect().left;
                            if (x < largura * 0.22) ir(indice - 1);
                            else if (x > largura * 0.78) ir(indice + 1);
                        }}
                    >
                        <div className="mx-auto max-w-xl">
                            {cabecalho && <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#7d6237]">{cabecalho}</div>}
                            <p className="whitespace-pre-wrap font-serif text-[17px] leading-8 text-[#3d2a14]">{entrada.texto || '…'}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2.5 border-t border-[#8a6b38]/20 px-4 py-4" style={{ paddingBottom: 'calc(1rem + var(--safe-area-bottom, 0px))' }}>
                        <button type="button" onClick={() => ir(indice - 1)} disabled={indice === 0} aria-label="Entrada anterior" className="reader-nav-button inline-flex h-10 min-w-[3rem] items-center justify-center rounded-xl px-3 disabled:cursor-not-allowed disabled:opacity-40">
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        <div className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-[#7d6237]">Toque nas laterais ou arraste</div>
                        <button type="button" onClick={() => ir(indice + 1)} disabled={indice >= total - 1} aria-label="Próxima entrada" className="reader-nav-button inline-flex h-10 min-w-[3rem] items-center justify-center rounded-xl px-3 disabled:cursor-not-allowed disabled:opacity-40">
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
