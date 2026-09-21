/**
 * OS SEIS QUADROS DO RELATORIO, LADO A LADO.
 *
 * O carrossel do fim de ciclo so existe DEPOIS de fechar um ciclo de verdade, e
 * um ciclo leva dias. Mexer na composicao dele as cegas e como acertar o
 * encaixe do cabelo sem abrir o alinhador: da para ler o codigo e nao da para
 * ver o resultado.
 *
 * Aqui os seis saem de uma vez, com os numeros do ciclo de 14 a 20/09/2026 — os
 * do video que mostrou o problema. E saem em TODOS os patamares, porque o
 * acabamento vem da nota: um ciclo A e dourado, um E e terroso, e o rodape de
 * dados tem de se ler nos dois.
 *
 * Nao entra no build: o `npm run build` empacota so o index.html da raiz.
 */
import '../index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SlideCartaz } from '../components/SlideCartaz';

const PATAMARES = ['S', 'A', 'B', 'C', 'D', 'E'];

/** Os seis quadros, com os numeros do ciclo do video. */
const QUADROS = [
    {
        id: 'execucao',
        titulo: 'EXECUÇÃO',
        numero: '100',
        sufixo: '%',
        rotulo: 'das ações planejadas viraram feito',
        progresso: 100,
        legenda: [
            { rotulo: 'Ações', valor: '66/66' },
            { rotulo: 'Carga', valor: '55h', nota: '9.1h por dia' },
            { rotulo: 'Presença', valor: '7/7', nota: 'nenhum dia zerado', tom: 'bom' as const },
            { rotulo: 'Ritmo', valor: '0', nota: 'no compasso' },
        ],
    },
    {
        id: 'atlas',
        titulo: 'ATLAS',
        figura: (
            <div className="mx-auto flex h-[190px] w-full max-w-[300px] items-center justify-center rounded-xl border border-white/10 bg-black/30 text-[10px] uppercase tracking-[0.2em] text-white/30">
                a grade do ciclo
            </div>
        ),
        rotulo: 'o ciclo inteiro, dia a dia',
        legenda: [
            { rotulo: 'Semanas', valor: '1' },
            { rotulo: 'Dias ativos', valor: '7/7' },
            { rotulo: 'Feitas', valor: '66/66' },
            { rotulo: 'Carga', valor: '55h' },
        ],
    },
    {
        id: 'territorio',
        titulo: 'TERRITÓRIO',
        figura: (
            <div className="mx-auto flex h-[190px] w-full max-w-[300px] items-center justify-center rounded-xl border border-white/10 bg-black/30 text-[10px] uppercase tracking-[0.2em] text-white/30">
                o pentágono das áreas
            </div>
        ),
        rotulo: 'academia e dieta puxou o ciclo',
        // TRES itens, de proposito: e o quadro que mostrava o ultimo sozinho na
        // coluna da esquerda, com um buraco do lado.
        legenda: [
            { rotulo: 'I · Meditação Zen', valor: '7x' },
            { rotulo: 'II · Conexão', valor: '7x' },
            { rotulo: 'III · Pentágono', valor: '7x' },
        ],
    },
    {
        id: 'conquistas',
        titulo: 'CONQUISTAS',
        numero: '+3359',
        sufixo: 'EXP',
        rotulo: 'depositados na sua nobreza',
        legenda: [
            { rotulo: 'Metas', valor: '7/7', nota: 'todas seladas', tom: 'bom' as const },
            { rotulo: 'Desafios', valor: '0' },
            { rotulo: 'Ouro', valor: '+5' },
        ],
    },
    {
        id: 'veredito',
        titulo: 'VEREDITO',
        numero: 'A',
        rotulo: '14/09/2026 — 20/09/2026 · 7 dias',
        // O rodape do Veredito trocou junto com a regua: o indice de 100 pontos
        // saiu e entrou a conclusao, que e de onde a letra vem agora. A bancada
        // ficou mostrando o indice por um tempo e me fez cacar um bug ja morto —
        // mock velho mente com a mesma cara de bug vivo.
        legenda: [
            { rotulo: 'Conclusão', valor: '100%' },
            { rotulo: 'Ações', valor: '66/66' },
        ],
        barras: [
            { rotulo: 'Honra', pts: 40, max: 40 },
            { rotulo: 'Metas', pts: 30, max: 30 },
            { rotulo: 'Cadência', pts: 15, max: 15 },
            { rotulo: 'Realismo', pts: 10, max: 10 },
            { rotulo: 'Ascensão', pts: 4, max: 5 },
        ],
        remate: 'Execução sólida. O ciclo foi honrado.',
    },
];

const Bancada: React.FC = () => {
    const [rank, setRank] = useState('A');

    return (
        <div className="min-h-screen bg-[#0b0b0c] p-6 text-white">
            <header className="mx-auto mb-6 max-w-[1400px]">
                <h1 className="m-0 text-[17px] font-bold">Os quadros do relatório</h1>
                <p className="mt-1 max-w-[70ch] text-[12.5px] text-white/50">
                    O carrossel do fim de ciclo, fora do ciclo. Os números são os do ciclo de
                    14 a 20/09/2026. O acabamento vem da <strong>nota</strong>, não do tema — troque
                    o patamar e os seis mudam junto.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {PATAMARES.map((p) => (
                        <button
                            key={p}
                            onClick={() => setRank(p)}
                            className={`rounded-lg border px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${
                                rank === p
                                    ? 'border-[#d8b44c] bg-[#d8b44c] text-black'
                                    : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </header>

            <div className="mx-auto flex max-w-[1400px] flex-wrap justify-center gap-6">
                {QUADROS.map((q) => (
                    <figure key={q.id} className="m-0 w-[340px]">
                        <div style={{ ['--altura-do-slide' as string]: '34rem' }}>
                            <SlideCartaz {...q} rank={rank} />
                        </div>
                        <figcaption className="mt-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                            {q.titulo}
                        </figcaption>
                    </figure>
                ))}
            </div>
        </div>
    );
};

createRoot(document.getElementById('raiz')!).render(<Bancada />);
