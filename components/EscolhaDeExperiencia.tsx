import React from 'react';
import { CATALOG_INTERFACE_ROOT } from '../constants/catalogAssets';

/**
 * COMO VOCE PREFERE EVOLUIR? (27/10/2026, com o Afonso)
 *
 * Uma pagina do onboarding, em tela cheia e SEM rolagem: dois cartoes. No
 * celular um embaixo do outro; em tela larga, lado a lado. Cada um tem uma
 * previa feita com pecas do Glyph e duas linhas curtas do que tem e do que nao
 * tem. O progresso e o mesmo; da para trocar depois em Configuracoes.
 */
type Modo = 'imersivo' | 'essencial';

// Previas com pecas DO GLYPH. Imersivo: o jardim zen ao fundo, com o bau, a
// insignia por cima (sem exagerar no fantastico). Essencial: recortes de telas reais — o
// planner, duas arenas e a placa do ciclo com brilho (public/assets/onboarding).
const ONBOARDING = '/assets/onboarding';

const PreviaImersiva: React.FC = () => (
    <div className="relative h-full overflow-hidden bg-[#0b0d10]">
        <img src={`${ONBOARDING}/jardim-cena.webp`} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_40%]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,10,0.55),rgba(7,8,10,0.05)_45%,rgba(7,8,10,0.35)),linear-gradient(0deg,rgba(7,8,10,0.75),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_62%_100%,rgba(243,212,138,0.38),transparent_65%)]" />
        <img src={`${CATALOG_INTERFACE_ROOT}/bau_raro.webp`} alt="" className="absolute bottom-[4%] left-1/2 h-[62%] w-auto -translate-x-[10%] object-contain drop-shadow-[0_10px_24px_rgba(243,212,138,0.45)]" />
        <img src={`${CATALOG_INTERFACE_ROOT}/insignia_missao_prata.webp`} alt="" className="absolute left-[6%] top-[10%] h-[38%] w-auto -rotate-6 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.75)]" />
        <span className="absolute bottom-2.5 left-3 text-[11px] font-black text-[#f6dfab] [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">+300 EXP · 🪙 +25</span>
    </div>
);

const PreviaEssencial: React.FC = () => (
    <div className="flex h-full items-center gap-2 bg-[linear-gradient(180deg,#121317,#08090b)] px-3 py-2.5">
        {/* O planner de verdade: as horas e duas acoes */}
        <img src={`${ONBOARDING}/pedaco-planner.webp`} alt="" className="h-full min-w-0 flex-[1.35] rounded-lg border border-white/10 object-cover object-left-top" />
        {/* Duas arenas */}
        <div className="flex h-full min-w-0 flex-1 flex-col justify-center gap-1.5">
            <img src={`${ONBOARDING}/arena-corpo.webp`} alt="" className="min-h-0 w-full flex-1 object-contain" />
            <img src={`${ONBOARDING}/arena-projeto.webp`} alt="" className="min-h-0 w-full flex-1 object-contain" />
        </div>
        {/* A placa do ciclo, reta, com o brilho dourado atras */}
        <div className="relative flex h-full shrink-0 items-center justify-center px-1">
            <div className="absolute inset-[-30%] bg-[radial-gradient(circle,rgba(243,212,138,0.32),rgba(8,10,12,0)_62%)]" />
            <img src={`${ONBOARDING}/placa-ciclo.webp`} alt="" className="relative h-full w-auto object-contain drop-shadow-[0_8px_22px_rgba(243,212,138,0.35)]" />
        </div>
    </div>
);

// Cada cartao tem a sua cor para nao sumir no fundo: dourado no Imersivo (recompensas),
// prata no Essencial (limpo). Borda, brilho e fundo tingido; o fundo escuro segue por baixo.
const ACENTO: Record<Modo, { borda: string; brilho: string; fundo: string; nome: string }> = {
    imersivo: {
        borda: 'rgba(226,191,106,0.6)',
        brilho: '0 0 28px rgba(226,191,106,0.2)',
        fundo: 'linear-gradient(180deg, rgba(226,191,106,0.16), #0d0f12 48%)',
        nome: '#f3d48a',
    },
    essencial: {
        borda: 'rgba(206,214,224,0.55)',
        brilho: '0 0 28px rgba(206,214,224,0.16)',
        fundo: 'linear-gradient(180deg, rgba(206,214,224,0.14), #0d0f12 48%)',
        nome: '#e3e8ef',
    },
};

const OPCOES: Array<{ id: Modo; nome: string; texto: string; tem: string; semIsso?: string; Previa: React.FC }> = [
    { id: 'imersivo', nome: 'Imersivo', texto: 'Sua evolução vira uma jornada.', tem: 'Tudo, com recompensas, baús, avatar, jardim e missões.', Previa: PreviaImersiva },
    { id: 'essencial', nome: 'Essencial', texto: 'Metas, planner e resultados, sem distração.', tem: 'Arenas, planner, ciclos, Oráculo e campanhas.', semIsso: 'Sem recompensas, avatar, jardim e missões.', Previa: PreviaEssencial },
];

export const EscolhaDeExperiencia: React.FC<{ onEscolher: (modo: Modo) => void }> = ({ onEscolher }) => (
    <div
        className="fixed inset-0 z-[10040] flex items-center justify-center overflow-hidden px-4"
        style={{ background: 'radial-gradient(circle at top, rgba(243,212,138,0.08), transparent 55%), #07080a', paddingTop: 'calc(1rem + var(--safe-area-top, 0px))', paddingBottom: 'calc(1rem + var(--safe-area-bottom, 0px))' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="escolha-experiencia-titulo"
    >
        <div className="flex w-full max-w-3xl flex-col">
            <h1 id="escolha-experiencia-titulo" className="text-center text-xl font-black text-white md:text-2xl">Como você prefere evoluir?</h1>
            <p className="mt-1 text-center text-[13px] text-white/50">Dá para mudar depois nas Configurações.</p>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                {OPCOES.map(({ id, nome, texto, tem, semIsso, Previa }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onEscolher(id)}
                        className="overflow-hidden rounded-2xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3d48a]/70 active:scale-[0.99]"
                        style={{ borderColor: ACENTO[id].borda, boxShadow: ACENTO[id].brilho, background: ACENTO[id].fundo }}
                    >
                        <div className="h-[clamp(6.5rem,17svh,11rem)] overflow-hidden border-b border-white/8">
                            <Previa />
                        </div>
                        <div className="px-4 py-3">
                            <div className="flex items-baseline gap-2">
                                <span className="text-base font-black" style={{ color: ACENTO[id].nome }}>{nome}</span>
                                <span className="text-[12px] text-white/55">{texto}</span>
                            </div>
                            <p className="mt-1.5 text-[12px] leading-snug text-emerald-200/80"><span aria-hidden="true">✓ </span>{tem}</p>
                            {semIsso && <p className="mt-0.5 text-[12px] leading-snug text-white/40"><span aria-hidden="true">✕ </span>{semIsso}</p>}
                        </div>
                    </button>
                ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-white/35">O seu progresso é o mesmo nas duas.</p>
        </div>
    </div>
);
