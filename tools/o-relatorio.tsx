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
import { GraficoDeDiasDoCiclo } from '../components/GraficoDeDiasDoCiclo';
import { ReportRadarChart } from '../components/ReportRadarChart';

/**
 * As areas, em FATIA do ciclo — as cinco somam 100.
 *
 * O "equilibrado" e o caso que expunha o defeito: 20 em cada uma desenhava um
 * pentagono do tamanho de uma moeda contra uma escala de 100, e quem espalhou
 * bem o esforco via o grafico dizer que nao fez nada.
 */
const AREAS_DE_MENTIRA: Record<string, { subject: string; A: number; fullMark: number }[]> = {
    'áreas · equilibrado': [
        { subject: 'Corpo', A: 21, fullMark: 100 },
        { subject: 'Mente', A: 20, fullMark: 100 },
        { subject: 'Trabalho', A: 19, fullMark: 100 },
        { subject: 'Relações', A: 20, fullMark: 100 },
        { subject: 'Espírito', A: 20, fullMark: 100 },
    ],
    'áreas · puxado por uma': [
        { subject: 'Corpo', A: 52, fullMark: 100 },
        { subject: 'Mente', A: 14, fullMark: 100 },
        { subject: 'Trabalho', A: 22, fullMark: 100 },
        { subject: 'Relações', A: 8, fullMark: 100 },
        { subject: 'Espírito', A: 4, fullMark: 100 },
    ],
};

const PATAMARES = ['S', 'A', 'B', 'C', 'D', 'E'];

/**
 * Dois ciclos de mentira para o grafico de dias, porque um so esconde metade.
 *
 * O de 7 dias e o do video: cumprido inteiro, e nele a sombra do planejado fica
 * invisivel por baixo do feito — que e o certo. O de 28 e o que mostra o resto:
 * dias furados, dias pela metade, a virada de semana e a barra fina.
 */
const semanaDeMentira = (inicio: number, pares: [number, number][], indice: number) => ({
    weekIndex: indice,
    startDate: '2026-09-14',
    endDate: '2026-09-20',
    plannedCount: pares.reduce((t, [, p]) => t + p, 0),
    completedCount: pares.reduce((t, [f]) => t + f, 0),
    plannedMinutes: 0,
    completedMinutes: 0,
    dominantArenaName: 'Academia e dieta',
    days: pares.map(([feito, planejado], i) => ({
        date: `2026-09-${String(inicio + i).padStart(2, '0')}`,
        plannedCount: planejado,
        completedCount: feito,
        plannedMinutes: 0,
        completedMinutes: 0,
        arenaBuckets: [],
        scheduledItems: [],
        unscheduledItems: [],
    })),
});

const CICLOS_DE_MENTIRA: Record<string, any[]> = {
    '7 dias · 100%': [
        semanaDeMentira(14, [[8, 8], [9, 9], [14, 14], [7, 7], [12, 12], [10, 10], [6, 6]], 0),
    ],
    '28 dias · com falhas': [
        semanaDeMentira(1, [[5, 6], [7, 7], [3, 8], [6, 6], [0, 4], [9, 9], [4, 5]], 0),
        semanaDeMentira(8, [[8, 8], [11, 11], [6, 9], [0, 5], [0, 3], [7, 7], [9, 9]], 1),
        semanaDeMentira(15, [[12, 12], [10, 10], [15, 15], [8, 8], [6, 10], [0, 6], [3, 7]], 2),
        semanaDeMentira(22, [[9, 9], [7, 7], [4, 9], [11, 11], [5, 5], [2, 8], [6, 6]], 3),
    ],
};

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
            { rotulo: 'Melhor dia', valor: 'qui 18/09', nota: '14 entregas' },
        ],
    },
    {
        id: 'atlas',
        titulo: 'ATLAS',
        rotulo: 'um dia por barra — a mais alta foi o seu pico',
        legenda: [
            { rotulo: 'Semanas', valor: '1' },
            { rotulo: 'Maior sequência', valor: '7', nota: 'dias seguidos', tom: 'bom' as const },
        ],
    },
    {
        id: 'territorio',
        titulo: 'TERRITÓRIO',
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
            { rotulo: 'vs. 3 ciclos', valor: '+12%', nota: 'mediana 88%', tom: 'bom' as const },
        ],
        remate: 'Execução sólida. O ciclo foi honrado.',
    },
];

const Bancada: React.FC = () => {
    const [rank, setRank] = useState('A');
    const [cicloDeMentira, setCicloDeMentira] = useState('7 dias · 100%');
    const [areasDeMentira, setAreasDeMentira] = useState('áreas · equilibrado');

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
                <div className="mt-2 flex flex-wrap gap-2">
                    {[...Object.keys(CICLOS_DE_MENTIRA), ...Object.keys(AREAS_DE_MENTIRA)].map((nome) => (
                        <button
                            key={nome}
                            onClick={() => (CICLOS_DE_MENTIRA[nome] ? setCicloDeMentira(nome) : setAreasDeMentira(nome))}
                            className={`rounded-lg border px-3 py-1.5 text-[10.5px] font-bold transition-all ${
                                cicloDeMentira === nome || areasDeMentira === nome
                                    ? 'border-white/40 bg-white/15 text-white'
                                    : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                            }`}
                        >
                            {nome}
                        </button>
                    ))}
                </div>
            </header>

            <div className="mx-auto flex max-w-[1400px] flex-wrap justify-center gap-6">
                {QUADROS.map((q) => (
                    <figure key={q.id} className="m-0 w-[340px]">
                        <div style={{ ['--altura-do-slide' as string]: '34rem' }}>
                            <SlideCartaz
                                {...q}
                                rank={rank}
                                figura={q.id === 'atlas'
                                    ? <GraficoDeDiasDoCiclo weeks={CICLOS_DE_MENTIRA[cicloDeMentira]} rank={rank} />
                                    : q.id === 'territorio'
                                        ? <ReportRadarChart data={AREAS_DE_MENTIRA[areasDeMentira]} />
                                        : q.figura}
                            />
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
