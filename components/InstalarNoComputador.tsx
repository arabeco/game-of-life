import React, { useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { promptForInstall } from '../utils/installPrompt';
import { isCapacitorNativeRuntime } from '../utils/runtimePlatform';

/**
 * GLYPH NO COMPUTADOR (27/10/2026).
 *
 * Quem usa o Glyph pelo navegador do PC pode instalar como programa (PWA):
 * icone na area de trabalho e janela propria. A oferta so existe quando faz
 * sentido — nunca no app Android, nunca quando ja esta instalado, nunca no
 * celular, e so quando o navegador disse que da (`beforeinstallprompt`).
 *
 * Duas portas: o cartao fixo nas Configuracoes e um convite que aparece UMA
 * vez, no terceiro dia de uso no PC. "Agora nao" fecha o convite para sempre;
 * o cartao das Configuracoes continua la.
 */

const jaInstalado = () => typeof window !== 'undefined' && (
    window.matchMedia?.('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
);
const ehComputador = () => typeof navigator !== 'undefined'
    && !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    && window.matchMedia?.('(pointer: fine)').matches !== false;

/** O navegador deixou instalar, e e um PC usando o Glyph pelo navegador. */
export const useInstalacaoNoComputador = () => {
    const { installPrompt, showToast } = useGame();
    const pode = Boolean(installPrompt) && !isCapacitorNativeRuntime() && !jaInstalado() && ehComputador();
    const instalar = async () => {
        const aceitou = await promptForInstall();
        if (aceitou) showToast('Glyph instalado. Ele abre como um programa no seu computador.', 'success');
        return aceitou;
    };
    return { pode, instalar };
};

const TEXTO = 'Abra o Glyph como um programa: ícone na área de trabalho, janela própria e longe das abas do navegador.';

/** O cartao das Configuracoes. */
export const CartaoInstalarNoComputador: React.FC = () => {
    const { pode, instalar } = useInstalacaoNoComputador();
    if (!pode) return null;
    return (
        <section className="space-y-3">
            <h2 className="text-sm font-bold accent-text uppercase tracking-widest px-1 border-b border-white/5 pb-2">Glyph no computador</h2>
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--skin-accent-color)]/35 bg-[var(--skin-accent-color)]/[0.07] p-4">
                <span className="text-3xl" aria-hidden="true">💻</span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">Instale o Glyph neste computador</p>
                    <p className="mt-1 text-xs leading-snug text-white/60">{TEXTO}</p>
                </div>
                <button type="button" onClick={() => void instalar()} className="luxe-skin-button shrink-0 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest">
                    Instalar
                </button>
            </div>
        </section>
    );
};

const CHAVE_DIAS = 'glyph-web-dias-de-uso';
const CHAVE_CONVITE = 'glyph-convite-instalar';
const DIAS_PARA_CONVIDAR = 3;

const lerDias = (): string[] => {
    try { const v = JSON.parse(localStorage.getItem(CHAVE_DIAS) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
};

/** O convite de uma vez so. Fica fora da tela de Configuracoes. */
export const ConviteInstalarNoComputador: React.FC<{ pausado?: boolean }> = ({ pausado = false }) => {
    const { pode, instalar } = useInstalacaoNoComputador();
    const [aberto, setAberto] = useState(false);

    useEffect(() => {
        if (!pode) return;
        try {
            if (localStorage.getItem(CHAVE_CONVITE)) return;
            const hoje = new Date().toISOString().slice(0, 10);
            const dias = lerDias();
            if (!dias.includes(hoje)) {
                dias.push(hoje);
                localStorage.setItem(CHAVE_DIAS, JSON.stringify(dias.slice(-DIAS_PARA_CONVIDAR)));
            }
            if (dias.length >= DIAS_PARA_CONVIDAR) setAberto(true);
        } catch { /* sem armazenamento, sem convite: o cartao das Configuracoes basta */ }
    }, [pode]);

    if (!aberto || !pode || pausado) return null;
    const fechar = () => {
        try { localStorage.setItem(CHAVE_CONVITE, 'visto'); } catch { /* segue */ }
        setAberto(false);
    };
    return (
        <div
            role="dialog"
            aria-label="Instalar o Glyph no computador"
            className="fixed left-4 z-[60] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[var(--skin-accent-color)]/40 bg-[#0d0f13]/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-md animate-fade-in"
            style={{ bottom: 'calc(5rem + var(--safe-area-bottom, 0px))' }}
        >
            <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden="true">💻</span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">Usa o Glyph no computador?</p>
                    <p className="mt-1 text-xs leading-snug text-white/60">{TEXTO}</p>
                </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={fechar} className="rounded-xl px-3 py-2 text-xs font-bold text-white/55 hover:text-white">Agora não</button>
                <button type="button" onClick={async () => { await instalar(); fechar(); }} className="luxe-skin-button rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest">Instalar</button>
            </div>
        </div>
    );
};
