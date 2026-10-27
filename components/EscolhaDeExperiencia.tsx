import React from 'react';
import { CATALOG_INTERFACE_ROOT } from '../constants/catalogAssets';

/**
 * COMO VOCE PREFERE EVOLUIR? (27/10/2026, com o Afonso)
 *
 * Uma pagina do onboarding, em tela cheia: dois cartoes grandes. No celular um
 * embaixo do outro; em tela larga, lado a lado. O mesmo Glyph nas duas — o que
 * muda e a camada de jogo (recompensas, inventario, avatar, jardim, missoes).
 * Da para trocar depois em Configuracoes.
 */
type Modo = 'imersivo' | 'essencial';

const PreviaImersiva: React.FC = () => (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_60%,rgba(74,222,128,0.28),rgba(8,10,12,0)_60%),linear-gradient(180deg,#0d1612,#06080a)]">
        <img src={`${CATALOG_INTERFACE_ROOT}/bau_raro.webp`} alt="" className="h-[72%] max-h-40 w-auto object-contain drop-shadow-[0_10px_30px_rgba(74,222,128,0.45)]" />
        <span className="absolute left-3 top-3 rounded-full border border-emerald-300/40 bg-black/40 px-2 py-0.5 text-[10px] font-black text-emerald-200">+300 EXP</span>
        <span className="absolute right-3 top-3 rounded-full border border-amber-300/40 bg-black/40 px-2 py-0.5 text-[10px] font-black text-amber-200">🏅 Conquista</span>
        <div className="absolute inset-x-3 bottom-3 flex justify-center gap-1.5" aria-hidden="true">
            {['✓', '✓', '★', '✓', '🎁'].map((icone, i) => (
                <span key={i} className="flex h-6 w-6 items-center justify-center rounded-md border border-emerald-300/30 bg-black/50 text-[11px] text-emerald-200">{icone}</span>
            ))}
        </div>
    </div>
);

const PreviaEssencial: React.FC = () => (
    <div className="flex h-full flex-col gap-2 bg-[linear-gradient(180deg,#101820,#0a0f14)] p-3">
        <div className="grid grid-cols-3 gap-1.5">
            {[['Concluídas', '30'], ['Ciclo', '86%'], ['Sequência', '11']].map(([rotulo, valor], i) => (
                <div key={rotulo} className={`rounded-md border px-2 py-1.5 ${i === 0 ? 'border-amber-300/50 bg-amber-300/15' : 'border-white/10 bg-white/[0.03]'}`}>
                    <div className="text-[8px] uppercase tracking-[0.1em] text-white/45">{rotulo}</div>
                    <div className="text-base font-black leading-tight text-white">{valor}</div>
                </div>
            ))}
        </div>
        <svg viewBox="0 0 200 60" className="w-full flex-1" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 45 C 25 20, 45 50, 70 30 S 115 10, 140 28 S 180 40, 200 15" fill="none" stroke="#e6c76a" strokeWidth="2.5" />
            <path d="M0 45 C 25 20, 45 50, 70 30 S 115 10, 140 28 S 180 40, 200 15 V60 H0 Z" fill="rgba(230,199,106,0.12)" />
        </svg>
        <div className="space-y-1" aria-hidden="true">
            {[78, 52, 90].map((largura) => (
                <div key={largura} className="h-1.5 rounded-full bg-white/8"><div className="h-full rounded-full bg-amber-300/70" style={{ width: `${largura}%` }} /></div>
            ))}
        </div>
    </div>
);

const OPCOES: Array<{ id: Modo; nome: string; texto: string; Previa: React.FC }> = [
    { id: 'imersivo', nome: 'Imersivo', texto: 'Sua evolução vira uma jornada: recompensas, conquistas, baús, avatar e o seu jardim.', Previa: PreviaImersiva },
    { id: 'essencial', nome: 'Essencial', texto: 'Foco nas metas, no planejamento e nos resultados, com uma interface discreta.', Previa: PreviaEssencial },
];

export const EscolhaDeExperiencia: React.FC<{ onEscolher: (modo: Modo) => void }> = ({ onEscolher }) => (
    <div
        className="fixed inset-0 z-[10040] overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(243,212,138,0.08),transparent_55%),#07080a] px-4"
        style={{ paddingTop: 'calc(1.5rem + var(--safe-area-top, 0px))', paddingBottom: 'calc(1.5rem + var(--safe-area-bottom, 0px))' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="escolha-experiencia-titulo"
    >
        <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center">
            <h1 id="escolha-experiencia-titulo" className="text-center text-xl font-black text-white md:text-2xl">Como você prefere evoluir?</h1>
            <p className="mt-1.5 text-center text-sm text-white/55">Escolha a experiência que combina com você. Dá para mudar depois.</p>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                {OPCOES.map(({ id, nome, texto, Previa }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onEscolher(id)}
                        className="group overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] text-left transition-all hover:border-[#f3d48a]/55 focus-visible:border-[#f3d48a] active:scale-[0.99]"
                    >
                        <div className="h-36 overflow-hidden border-b border-white/8 md:h-48">
                            <Previa />
                        </div>
                        <div className="p-4">
                            <div className="text-base font-black text-white">{nome}</div>
                            <p className="mt-1 text-[13px] leading-snug text-white/60">{texto}</p>
                        </div>
                    </button>
                ))}
            </div>
            <p className="mt-4 text-center text-[11px] text-white/35">O seu progresso é o mesmo nas duas. Muda só o jeito de ver.</p>
        </div>
    </div>
);
