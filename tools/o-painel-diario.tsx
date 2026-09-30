import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DailyPanelBoard, type DailyBoardStat } from '../components/DailyPanelBoard';
import { DailySummaryCard } from '../components/DailySummaryCard';
import { buildHistoricalDailyInsight, buildTodayDailyReading } from '../utils/dailyInsights';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';
import '../index.css';

/**
 * Dados ILUSTRATIVOS, componentes de VERDADE.
 *
 * O painel e a placa nao dependem de contexto nenhum — recebem tudo por prop —
 * e e exatamente por isso que da pra olhar os dois aqui sem entrar na conta.
 * Nenhum valor abaixo sai do banco; a forma de todos sai de DailyPanelContent.
 */

const ARENAS = [
    { id: 'a1', name: 'Academia', family: 'saude', icon: '🏋️' },
    { id: 'a2', name: 'Leitura', family: 'proposito', icon: '📖' },
    { id: 'a3', name: 'Projeto Glyph', family: 'trabalho', icon: '💻' },
    { id: 'a4', name: 'Casa', family: 'lazer', icon: '🏡' },
] as const;

const ACOES = [
    { name: 'Treino de perna', icon: '🏋️', arena: 0 },
    { name: 'Mobilidade', icon: '🤸', arena: 0 },
    { name: 'Caminhada', icon: '🚶', arena: 0 },
    { name: 'Ler 20 páginas', icon: '📚', arena: 1 },
    { name: 'Diário', icon: '📓', arena: 1 },
    { name: 'Revisar PR', icon: '💻', arena: 2 },
    { name: 'Escrever spec', icon: '📝', arena: 2 },
    { name: 'Desenhar placa', icon: '🎨', arena: 2 },
    { name: 'Lavar louça', icon: '🥗', arena: 3 },
    { name: 'Regar plantas', icon: '🌱', arena: 3 },
    { name: 'Meditar', icon: '🧘', arena: 1 },
    { name: 'Beber água', icon: '💧', arena: 0 },
];

const fundoDaFamilia = (familia: string) =>
    `linear-gradient(135deg, ${ASSET_ACCENT_COLORS[familia as keyof typeof ASSET_ACCENT_COLORS]} 0%, #141820 130%)`;

const duracao = (minutos: number) => {
    const total = Math.max(0, Math.round(minutos));
    const horas = Math.floor(total / 60);
    const resto = total % 60;
    if (horas <= 0) return `${resto}min`;
    return resto > 0 ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h`;
};

function Bancada() {
    const [total, setTotal] = useState(9);
    const [feitas, setFeitas] = useState(7);
    const [ehHoje, setEhHoje] = useState(true);
    const [comCiclo, setComCiclo] = useState(true);
    const [comSelo, setComSelo] = useState(false);
    const [comFala, setComFala] = useState(true);
    const [altura, setAltura] = useState<'curta' | 'alta'>('alta');

    const totalSeguro = Math.max(0, Math.min(ACOES.length, total));
    const feitasSeguras = Math.max(0, Math.min(totalSeguro, feitas));

    type ArenaDaBancada = {
        id: string; name: string; icon: string; background: string;
        completed: number; total: number; exp: number;
        actions: { id: string; name: string; icon: string; completed: boolean; background: string }[];
    };

    const arenas = useMemo<ArenaDaBancada[]>(() => {
        const mapa = new Map<string, ArenaDaBancada>();
        ACOES.slice(0, totalSeguro).forEach((acao, i) => {
            const arena = ARENAS[acao.arena];
            const fundo = fundoDaFamilia(arena.family);
            const atual = mapa.get(arena.id) || {
                id: arena.id, name: arena.name, icon: arena.icon,
                background: fundo, completed: 0, total: 0, exp: 0, actions: [],
            };
            atual.total += 1;
            atual.actions.push({ id: String(i), name: acao.name, icon: acao.icon, completed: i < feitasSeguras, background: fundo });
            if (i < feitasSeguras) { atual.completed += 1; atual.exp += 15; }
            mapa.set(arena.id, atual);
        });
        for (const entrada of mapa.values()) {
            entrada.actions.sort((a, b) => (a.completed === b.completed ? a.name.localeCompare(b.name) : (a.completed ? -1 : 1)));
        }
        return [...mapa.values()].sort((a, b) => (b.completed - a.completed) || (b.exp - a.exp));
    }, [feitasSeguras, totalSeguro]);

    // A lista plana sobrou so pra placa, que continua sendo uma grade unica.
    const acoes = useMemo(() => arenas.flatMap((arena) => arena.actions), [arenas]);

    const xp = feitasSeguras * 15;
    const minutos = feitasSeguras * 18;

    const stats = useMemo<DailyBoardStat[]>(() => {
        const tocadas = arenas.filter((a) => a.completed > 0).length;
        const lista: DailyBoardStat[] = [
            { id: 'tempo', label: 'Tempo', value: minutos > 0 ? duracao(minutos) : '—', hint: 'registrado' },
            { id: 'exp', label: 'EXP', value: xp > 0 ? `+${xp}` : '0', hint: 'no dia' },
            { id: 'arenas', label: tocadas === 1 ? 'Arena' : 'Arenas', value: String(tocadas), hint: 'tocadas' },
        ];
        if (comCiclo) lista.push({ id: 'dias', label: 'Dias ativos', value: '2', hint: 'de 3 dias' });
        return lista;
    }, [arenas, comCiclo, minutos, xp]);

    const leitura = ehHoje
        ? buildTodayDailyReading({
            completedCount: feitasSeguras,
            plannedCount: totalSeguro,
            distinctArenaCount: arenas.filter((a) => a.completed > 0).length,
            topArenaName: arenas[0]?.name || null,
            streakCurrent: 1,
        }, 'premium').text
        : buildHistoricalDailyInsight({
            completedCount: feitasSeguras,
            plannedCount: totalSeguro,
            distinctArenaCount: arenas.filter((a) => a.completed > 0).length,
            arenaNames: arenas.filter((a) => a.completed > 0).map((a) => a.name),
            topArenaName: arenas[0]?.name || null,
            topArenaCompleted: arenas[0]?.completed || 0,
            previousActiveDaysAverage: 5,
        });

    const selo = comSelo && feitasSeguras > 0 ? 'Top 3% em ações hoje' : undefined;
    const fala = comFala && ehHoje ? 'O dia ainda tem espaço. O que você escolher agora, escolheu.' : undefined;

    const snapshot = {
        version: 1 as const,
        date: ehHoje ? '2026-09-30' : '2026-09-29',
        dateLabel: ehHoje ? 'ter., 30/09' : 'seg., 29/09',
        completed: feitasSeguras,
        total: totalSeguro,
        minutes: minutos,
        xp,
        bayCount: 3,
        reading: leitura || undefined,
        comparisonLabel: selo,
        actions: acoes,
    };

    return (
        <>
            <header>
                <h1>Painel diário</h1>
                <p>
                    À esquerda o <code>DailyPanelBoard</code>, que é o que a pessoa abre e lê — ele rola.
                    À direita o <code>DailySummaryCard</code>, que é a placa de compartilhar — ela tem
                    altura fechada porque vira PNG. Eram a mesma peça até hoje, e é daí que vinha a tela vazia.
                </p>
            </header>

            <div className="controles">
                <label>Caso
                    <span className="presets">
                        {([
                            ['Marcou e cumpriu parte', 9, 7],
                            ['Não marcou nada, só registrou', 5, 5],
                            ['Marcou e não fez', 9, 0],
                        ] as const).map(([nome, t, f]) => (
                            <button key={nome} type="button" onClick={() => { setTotal(t); setFeitas(f); }}>{nome}</button>
                        ))}
                    </span>
                </label>
                <label>Ações no dia
                    <input type="number" min={0} max={ACOES.length} value={total} onChange={(e) => setTotal(Number(e.target.value))} />
                </label>
                <label>Concluídas
                    <input type="number" min={0} max={ACOES.length} value={feitas} onChange={(e) => setFeitas(Number(e.target.value))} />
                </label>
                <label>Altura do painel
                    <select value={altura} onChange={(e) => setAltura(e.target.value as 'curta' | 'alta')}>
                        <option value="alta">Tela normal (660px)</option>
                        <option value="curta">Aparelho curto (420px)</option>
                    </select>
                </label>
                <label className="linha"><input type="checkbox" checked={ehHoje} onChange={(e) => setEhHoje(e.target.checked)} /> É hoje</label>
                <label className="linha"><input type="checkbox" checked={comCiclo} onChange={(e) => setComCiclo(e.target.checked)} /> Com ciclo aberto</label>
                <label className="linha"><input type="checkbox" checked={comFala} onChange={(e) => setComFala(e.target.checked)} /> Fala do Oráculo</label>
                <label className="linha"><input type="checkbox" checked={comSelo} onChange={(e) => setComSelo(e.target.checked)} /> Selo Top 3%</label>
            </div>

            <main>
                <div className="palco">
                    <h2>Painel · o que se abre e lê</h2>
                    <p>Rola quando não cabe. Nenhuma conta de capacidade.</p>
                    <div className={`moldura ${altura}`}>
                        <div className="daily-review daily-board-layout">
                            <DailyPanelBoard
                                date={snapshot.date}
                                dateLabel={snapshot.dateLabel}
                                isToday={ehHoje}
                                completed={feitasSeguras}
                                total={totalSeguro}
                                durationLabel={minutos > 0 ? duracao(minutos) : ''}
                                xp={xp}
                                stats={stats}
                                arenas={arenas}
                                cycleName={comCiclo ? 'Ciclo da retomada' : undefined}
                                cycleDayLabel={comCiclo ? 'Dia 3/7' : undefined}
                                greeting={fala}
                                reading={leitura}
                                comparisonLabel={selo}
                                onShare={ehHoje ? undefined : () => window.alert('Abriria a folha de compartilhar.')}
                            />
                        </div>
                    </div>
                </div>

                <div className="palco">
                    <h2>Placa · o que virá PNG</h2>
                    <p>Duas fileiras de pastilhas, teto vindo do CSS.</p>
                    <div className="placa-palco">
                        <div className="daily-review daily-postcard-layout" style={{ width: '100%', height: '100%' }}>
                            <DailySummaryCard snapshot={snapshot} isToday={ehHoje} />
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

createRoot(document.getElementById('raiz')!).render(<Bancada />);
