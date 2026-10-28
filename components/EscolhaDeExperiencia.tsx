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
// planner, a faixa da arena e a placa do ciclo (public/assets/onboarding).
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
    <div className="relative h-full overflow-hidden bg-[linear-gradient(180deg,#14120d,#0a0b0e)]">
        {/* O planner de verdade, com as horas e duas acoes */}
        <img src={`${ONBOARDING}/pedaco-planner.webp`} alt="" className="absolute bottom-0 left-0 h-[62%] w-[74%] rounded-tr-lg border-r border-t border-white/10 object-cover object-left-top" />
        {/* A faixa da arena */}
        <img src={`${ONBOARDING}/faixa-arena.webp`} alt="" className="absolute left-[4%] top-[7%] h-[30%] w-auto max-w-[68%] rounded-md object-contain shadow-[0_8px_18px_rgba(0,0,0,0.6)]" />
        {/* A placa do ciclo, levemente girada por cima */}
        <img src={`${ONBOARDING}/placa-ciclo.webp`} alt="" className="absolute right-[5%] top-1/2 h-[92%] w-auto -translate-y-1/2 rotate-[4deg] rounded-md object-contain shadow-[0_12px_28px_rgba(0,0,0,0.75)]" />
    </div>
);

const OPCOES: Array<{ id: Modo; nome: string; texto: string; tem: string; semIsso?: string; Previa: React.FC }> = [
    { id: 'imersivo', nome: 'Imersivo', texto: 'Sua evolução vira uma jornada.', tem: 'Tudo, com recompensas, baús, avatar, jardim e missões.', Previa: PreviaImersiva },
    { id: 'essencial', nome: 'Essencial', texto: 'Metas, planner e resultados, sem distração.', tem: 'Arenas, planner, ciclos, Oráculo e campanhas.', semIsso: 'Sem recompensas, avatar, jardim e missões.', Previa: PreviaEssencial },
];

export const EscolhaDeExperiencia: React.FC<{ onEscolher: (modo: Modo) => void }> = ({ onEscolher }) => (
    <div
        className="fixed inset-0 z-[10040] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(243,212,138,0.08),transparent_55%),#07080a] px-4"
        style={{ paddingTop: 'calc(1rem + var(--safe-area-top, 0px))', paddingBottom: 'calc(1rem + var(--safe-area-bottom, 0px))' }}
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
                        className="overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] text-left transition-all hover:border-[#f3d48a]/55 focus-visible:border-[#f3d48a] active:scale-[0.99]"
                    >
                        <div className="h-[clamp(6.5rem,17svh,11rem)] overflow-hidden border-b border-white/8">
                            <Previa />
                        </div>
                        <div className="px-4 py-3">
                            <div className="flex items-baseline gap-2">
                                <span className="text-base font-black text-white">{nome}</span>
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
