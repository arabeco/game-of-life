import React from 'react';
import { CATALOG_AVATAR_ROOT, CATALOG_INTERFACE_ROOT } from '../constants/catalogAssets';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';

/**
 * COMO VOCE PREFERE EVOLUIR? (27/10/2026, com o Afonso)
 *
 * Uma pagina do onboarding, em tela cheia e SEM rolagem: dois cartoes. No
 * celular um embaixo do outro; em tela larga, lado a lado. Cada um tem uma
 * previa feita com pecas do Glyph e duas linhas curtas do que tem e do que nao
 * tem. O progresso e o mesmo; da para trocar depois em Configuracoes.
 */
type Modo = 'imersivo' | 'essencial';

// Previas com pecas DO GLYPH (o bau, a insignia e um artefato do catalogo; o
// planner e as barras do ciclo nas cores das areas), nao um painel generico.
const PreviaImersiva: React.FC = () => (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_62%,rgba(243,212,138,0.22),rgba(8,10,12,0)_58%),linear-gradient(180deg,#15110b,#07080a)]">
        <img src={`${CATALOG_INTERFACE_ROOT}/insignia_missao_prata.webp`} alt="" className="absolute left-[9%] top-[22%] h-14 w-14 -rotate-6 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.7)] md:h-16 md:w-16" />
        <img src={`${CATALOG_INTERFACE_ROOT}/bau_raro.webp`} alt="" className="relative h-[70%] max-h-36 w-auto object-contain drop-shadow-[0_10px_28px_rgba(243,212,138,0.35)]" />
        <img src={`${CATALOG_AVATAR_ROOT}/ARTEFATO_T4_DRAGAO_BEBE.png`} alt="" className="absolute right-[8%] top-[18%] h-16 w-16 rotate-6 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.7)] md:h-20 md:w-20" />
        <span className="absolute bottom-3 left-3 rounded-full border border-[#f3d48a]/40 bg-black/50 px-2 py-0.5 text-[10px] font-black text-[#f6dfab]">+300 EXP</span>
        <span className="absolute bottom-3 right-3 rounded-full border border-amber-300/40 bg-black/50 px-2 py-0.5 text-[10px] font-black text-amber-200">🪙 +25</span>
    </div>
);

const AREA = (id: string) => ASSET_ACCENT_COLORS[id as keyof typeof ASSET_ACCENT_COLORS] || '#d5b878';
const BLOCOS = [
    { hora: '07:00', nome: 'Treino', icone: '💪', area: 'saude', topo: 4, altura: 26 },
    { hora: '09:00', nome: 'Foco no projeto', icone: '💼', area: 'trabalho', topo: 34, altura: 34 },
    { hora: '19:30', nome: 'Leitura', icone: '📘', area: 'proposito', topo: 76, altura: 18 },
];
const BARRAS = [['saude', 82], ['trabalho', 64], ['relacoes', 48], ['proposito', 90], ['lazer', 55]] as const;

const PreviaEssencial: React.FC = () => (
    <div className="flex h-full gap-3 bg-[linear-gradient(180deg,#11141a,#0a0c10)] p-3">
        {/* Um dia do planner */}
        <div className="relative flex-1 overflow-hidden rounded-lg border border-white/8 bg-black/25">
            {BLOCOS.map((bloco) => (
                <div
                    key={bloco.nome}
                    className="absolute left-1.5 right-1.5 flex items-center gap-1.5 rounded-md px-2"
                    style={{ top: `${bloco.topo}%`, height: `${bloco.altura}%`, background: `linear-gradient(135deg, ${AREA(bloco.area)}cc, ${AREA(bloco.area)}66)` }}
                >
                    <span className="text-[11px]" aria-hidden="true">{bloco.icone}</span>
                    <span className="truncate text-[10px] font-bold text-white">{bloco.nome}</span>
                    <span className="ml-auto text-[8px] text-white/70">{bloco.hora}</span>
                </div>
            ))}
        </div>
        {/* As barras do ciclo, uma por area */}
        <div className="flex w-[38%] flex-col justify-center gap-1.5">
            <div className="text-[8px] font-black uppercase tracking-[0.14em] text-white/45">Ciclo · 86%</div>
            {BARRAS.map(([area, valor]) => (
                <div key={area} className="h-2 rounded-full bg-white/8">
                    <div className="h-full rounded-full" style={{ width: `${valor}%`, background: AREA(area) }} />
                </div>
            ))}
        </div>
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
