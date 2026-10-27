import React, { useEffect, useState } from 'react';

/**
 * COMO VOCE PREFERE EVOLUIR? (27/10/2026, com o Afonso)
 *
 * Uma pagina do onboarding, em tela cheia: dois cartoes grandes. No celular um
 * embaixo do outro; em tela larga, lado a lado. Cada cartao passa prints DE
 * VERDADE do app (os mesmos do glyph.life) e diz o que tem e o que nao tem.
 * O progresso por tras e o mesmo; da para trocar depois em Configuracoes.
 */
type Modo = 'imersivo' | 'essencial';

const PRINTS: Record<Modo, string[]> = {
    imersivo: ['imersivo-skins', 'imersivo-avatar', 'imersivo-conquistas', 'imersivo-feitos'],
    essencial: ['essencial-planner', 'essencial-painel', 'essencial-execucao', 'essencial-semana', 'essencial-maestria'],
};

// Onde enquadrar cada print (o planner tem o cabecalho em cima; o que importa vem abaixo).
const ENQUADRAMENTO: Record<string, string> = {
    'essencial-planner': 'center 38%',
    'essencial-semana': 'center 30%',
    'essencial-painel': 'center 10%',
    'imersivo-conquistas': 'center 42%',
    'essencial-execucao': 'center 30%',
};

const Slideshow: React.FC<{ prints: string[]; atraso: number }> = ({ prints, atraso }) => {
    const [atual, setAtual] = useState(0);
    useEffect(() => {
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        let relogio: number | undefined;
        const inicio = window.setTimeout(() => {
            relogio = window.setInterval(() => setAtual((i) => (i + 1) % prints.length), 2600);
        }, atraso);
        return () => { window.clearTimeout(inicio); if (relogio) window.clearInterval(relogio); };
    }, [prints.length, atraso]);
    return (
        <div className="relative h-full w-full overflow-hidden bg-black">
            {prints.map((nome, i) => (
                <img
                    key={nome}
                    src={`/assets/onboarding/${nome}.webp`}
                    alt=""
                    loading={i === 0 ? 'eager' : 'lazy'}
                    style={{ objectPosition: ENQUADRAMENTO[nome] || 'center top' }}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === atual ? 'opacity-100' : 'opacity-0'}`}
                />
            ))}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1" aria-hidden="true">
                {prints.map((nome, i) => (
                    <span key={nome} className={`h-1 rounded-full transition-all ${i === atual ? 'w-4 bg-white/80' : 'w-1 bg-white/35'}`} />
                ))}
            </div>
        </div>
    );
};

/** O que cada experiencia tem — e o que o Essencial deixa de fora. */
const TEM = ['Arenas e metas', 'Planner', 'Ciclos e relatórios', 'Oráculo', 'Maestria', 'Campanhas', 'Clã e amigos'];
const SO_NO_IMERSIVO = ['Recompensas e baús', 'Avatar e skins', 'Arsenal de itens', 'Jardim', 'Missões'];

const OPCOES: Array<{ id: Modo; nome: string; texto: string }> = [
    { id: 'imersivo', nome: 'Imersivo', texto: 'Sua evolução vira uma jornada, com recompensas, conquistas e personalização.' },
    { id: 'essencial', nome: 'Essencial', texto: 'Foco nas metas, no planejamento e nos resultados, com uma interface discreta.' },
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
                {OPCOES.map(({ id, nome, texto }, indice) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onEscolher(id)}
                        className="group overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] text-left transition-all hover:border-[#f3d48a]/55 focus-visible:border-[#f3d48a] active:scale-[0.99]"
                    >
                        <div className="h-44 border-b border-white/8 md:h-56">
                            <Slideshow prints={PRINTS[id]} atraso={indice * 1300} />
                        </div>
                        <div className="p-4">
                            <div className="text-base font-black text-white">{nome}</div>
                            <p className="mt-1 text-[13px] leading-snug text-white/60">{texto}</p>
                            {id === 'imersivo' && <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">Tudo do Essencial, mais:</p>}
                            <ul className={`${id === 'imersivo' ? 'mt-1.5' : 'mt-3'} flex flex-wrap gap-1.5`} aria-label={`O que o ${nome} tem`}>
                                {(id === 'imersivo' ? SO_NO_IMERSIVO : TEM).map((item) => (
                                    <li key={item} className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] px-2 py-0.5 text-[10px] font-semibold text-emerald-100/85">✓ {item}</li>
                                ))}
                                {id === 'essencial' && SO_NO_IMERSIVO.map((item) => (
                                    <li key={item} className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-white/35 line-through decoration-white/30">{item}</li>
                                ))}
                            </ul>
                        </div>
                    </button>
                ))}
            </div>
            <p className="mt-4 text-center text-[11px] text-white/35">O seu progresso é o mesmo nas duas. Muda só o jeito de ver.</p>
        </div>
    </div>
);
