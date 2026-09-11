/**
 * A BANCADA DOS MODAIS DE CONQUISTA.
 *
 * A folha os-modais.html descreve os acontecimentos; esta pagina monta o
 * COMPONENTE DE VERDADE, com o mesmo AchievementModal que o jogo usa. Descricao
 * e desenho sao coisas diferentes, e so a segunda deixa decidir o que mudar.
 *
 * O modal le quatro coisas do GameContext — toast, feed e as duas preferencias.
 * Aqui elas vem de um provedor de mentira: nada toca banco, rede ou conta.
 *
 * Nao entra no build do app: o `npm run build` empacota so o index.html da raiz,
 * e esta pagina vive em tools/, que e a raiz de OUTRO servidor.
 * Suba com `npm run bancada` e abra http://localhost:3010/modais-bancada.html
 */
import '../index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GameContext } from '../contexts/GameContext';
import { AchievementModal } from '../components/AchievementModal';
import { MasteryResultModal } from '../components/MasteryResultModal';
import { RewardPackModal } from '../components/RewardPackModal';
import { MasteryWheel } from '../components/MasteryWheel';
import { AssetPentagon } from '../components/AssetPentagon';
import { LIFE_AREAS } from '../constants/lifeAreas';
import '../views/mastery-quiz.css';

type Cenario = { id: string; rotulo: string; nota: string; type: string; data: Record<string, unknown> };

/** As dez frases de Saude, como o jogo as escreve. */
const FRASES_DE_EXEMPLO = [
    'Você evita o assunto. Passa semanas sem pensar nisso, e quando pensa, é com culpa.',
    'Você tenta às vezes, mas não sustenta. Começa e para, começa e para.',
    'Você mantém o mínimo. Não avança, mas também não desmorona.',
    'Você tem uma rotina que funciona na maior parte das semanas.',
    'Você é consistente. Falha pouco e retoma rápido quando falha.',
    'Você está acima da média das pessoas que conhece nessa área.',
    'Você tem domínio. As decisões saem naturais e quase nunca erra o rumo.',
    'Você é referência para quem está perto. Procuram você para aprender.',
    'Você opera num nível que poucos alcançam, com resultado visível.',
    'Isso virou obra. O que você construiu aqui sobrevive a você.',
];

/** Recompensa de exemplo, no formato que o modal espera. */
const premio = (items: string[], exp = 0) => ({
    exp,
    items,
    rewardDetails: [
        { category: 'ui_skins', itemId: 'AURORA', name: 'Tema: Aurora Boreal' },
        { category: 'borders', itemId: 'item_border_t3_mistico', name: 'Borda: Místico' },
    ],
});

const CENARIOS: Cenario[] = [
    {
        id: 'patente', rotulo: 'Nova patente', nota: 'com vídeo · 4,5s',
        type: 'PLAYER_RANK_UP',
        data: { name: 'Cavaleiro', expTotalRequired: 15000, reward: premio(['insignia_rank_3_cavaleiro', 'item_border_t3_mistico']) },
    },
    {
        id: 'patente-sem-video', rotulo: 'Nova patente', nota: 'semVideo — o encadeamento',
        type: 'PLAYER_RANK_UP',
        data: { name: 'Cavaleiro', semVideo: true, reward: premio(['insignia_rank_3_cavaleiro']) },
    },
    {
        id: 'missao', rotulo: 'Missão concluída', nota: 'com vídeo',
        type: 'QUEST_COMPLETED',
        data: { title: 'Cinco dias em movimento', icon: '🎯', reward: premio(['item_glyph_3_002'], 150) },
    },
    {
        id: 'relatorio', rotulo: 'Relatório concluído', nota: 'com vídeo',
        type: 'REPORT_COMPLETED',
        data: { title: 'Relatório de Ciclo', reward: premio([], 3240) },
    },
    {
        id: 'marco', rotulo: 'Marco concluído', nota: 'sem vídeo',
        type: 'MILESTONE_COMPLETED',
        data: { name: 'Correr 10 km', icon: '🏁' },
    },
    {
        id: 'arena', rotulo: 'Arena concluída', nota: 'sem vídeo',
        type: 'ARENA_COMPLETED',
        data: { name: 'Academia e dieta', icon: '💪' },
    },
    {
        id: 'venceu', rotulo: 'Desafio vencido', nota: 'competição',
        type: 'COMPETITION_COMPLETED',
        data: { result: 'winner', challengeName: 'Semana de leitura', opponentNickname: 'joana', myScore: 4, opponentScore: 3, target: 5 },
    },
    {
        id: 'empate', rotulo: 'Empate', nota: 'competição',
        type: 'COMPETITION_COMPLETED',
        data: { result: 'draw', challengeName: 'Semana de leitura', opponentNickname: 'joana', myScore: 3, opponentScore: 3, target: 5 },
    },
    {
        id: 'perdeu', rotulo: 'Desafio encerrado', nota: 'competição · derrota',
        type: 'COMPETITION_COMPLETED',
        data: { result: 'loser', challengeName: 'Semana de leitura', opponentNickname: 'joana', myScore: 2, opponentScore: 5, target: 5 },
    },
    {
        id: 'cla', rotulo: 'Patente do grupo', nota: 'mesmo título do marco',
        type: 'CLAN_RANK_UP',
        data: { name: 'Ordem de Ferro' },
    },
];

function Bancada() {
    const [aberto, setAberto] = useState<Cenario | null>(null);
    const [animacoes, setAnimacoes] = useState(true);
    const [maestria, setMaestria] = useState<'primeira' | 'comparando' | null>(null);
    const [pacote, setPacote] = useState(false);
    const [nivelDaRoda, setNivelDaRoda] = useState(6);
    const [previaDaRoda, setPreviaDaRoda] = useState(6);

    // O provedor de mentira: so o que o modal realmente le.
    const contexto = {
        addFeedEvent: (evento: unknown) => console.log('[bancada] addFeedEvent', evento),
        showToast: (mensagem: string) => console.log('[bancada] toast:', mensagem),
        oraclePreferences: { animationsEnabled: animacoes, celebrationScreensEnabled: true },
        userProfile: { id: 'bancada' },
        assets: [
            { id: 'proposito', name: 'PROPÓSITO', level: 7, levelDescriptions: {}, arenas: [], slots: [] },
            { id: 'relacoes', name: 'RELAÇÕES', level: 4, levelDescriptions: {}, arenas: [], slots: [] },
            { id: 'trabalho', name: 'TRABALHO', level: 8, levelDescriptions: {}, arenas: [], slots: [] },
            { id: 'lazer', name: 'LAZER', level: 5, levelDescriptions: {}, arenas: [], slots: [] },
            { id: 'saude', name: 'SAÚDE', level: 6, levelDescriptions: {}, arenas: [], slots: [] },
        ],
        updateOraclePreferences: (p: unknown) => console.log('[bancada] preferencias', p),
    } as never;

    return (
        <GameContext.Provider value={contexto}>
            <header>
                <h1>Os modais de conquista</h1>
                <p>
                    O componente de verdade, com dados de mentira. Clique num acontecimento para
                    abrir. Nada toca banco, rede ou conta — o toast e o feed só imprimem no console.
                </p>
                <label className="interruptor">
                    <input type="checkbox" checked={animacoes} onChange={(e) => setAnimacoes(e.target.checked)} />
                    <span>Animações ligadas <em>(desligado = sem vídeo, entra direto na placa)</em></span>
                </label>
            </header>

            <div className="grade">
                {CENARIOS.map((cenario) => (
                    <button key={cenario.id} type="button" className="cartao" onClick={() => setAberto(cenario)}>
                        <strong>{cenario.rotulo}</strong>
                        <small>{cenario.nota}</small>
                        <code>{cenario.type}</code>
                    </button>
                ))}
            </div>

            <h2 className="titulo-secao">A roda dos níveis</h2>
            <p className="nota-secao">
                O seletor do questionário de maestria. Role com o dedo ou com a roda do mouse —
                a escolhida fica inteira, as vizinhas de leve, o resto ao fundo.
            </p>
            <div
                className="roda-palco"
                style={{ ['--mastery-accent' as string]: '#d4af37' }}
            >
                <AssetPentagon assets={LIFE_AREAS.map(area => ({...area, level: 3}))} tempLevels={{saude: previaDaRoda}} showCentralLevel={false} size={190} />
                <MasteryWheel
                    compacto
                    onVisualizar={setPreviaDaRoda}
                    niveis={FRASES_DE_EXEMPLO.length}
                    selecionado={nivelDaRoda}
                    frases={FRASES_DE_EXEMPLO}
                    onSelecionar={setNivelDaRoda}
                    hapticos={false}
                />
                <p className="roda-leitura">
                    escolhido: <b>nível {nivelDaRoda * 2}</b> (degrau {nivelDaRoda})
                </p>
            </div>

            <h2 className="titulo-secao">A placa de recompensa avulsa</h2>
            <div className="grade">
                <button type="button" className="cartao" onClick={() => setPacote(true)}>
                    <strong>Pacote de itens</strong><small>a placa sem acontecimento por trás</small><code>RewardPackModal</code>
                </button>
            </div>

            {pacote && (
                <RewardPackModal
                    open
                    onClose={() => setPacote(false)}
                    fallbackEyebrow="Baú aberto"
                    fallbackTitle="Você recebeu"
                    fallbackSummary="Os itens já estão no seu arsenal."
                    fallbackButtonLabel="Receber"
                    payload={{
                        itemIds: ['item_glyph_3_002', 'item_border_t3_mistico'],
                        rewardDetails: [
                            { category: 'ui_skins', itemId: 'AURORA', name: 'Tema: Aurora Boreal' },
                        ],
                    } as never}
                    tom="234,179,8"
                />
            )}

            <h2 className="titulo-secao">A tela que fecha a avaliação</h2>
            <div className="grade">
                <button type="button" className="cartao" onClick={() => setMaestria('primeira')}>
                    <strong>Maestria</strong><small>primeiro retrato · sem comparação</small><code>MasteryResultModal</code>
                </button>
                <button type="button" className="cartao" onClick={() => setMaestria('comparando')}>
                    <strong>Maestria</strong><small>com o retrato anterior</small><code>MasteryResultModal</code>
                </button>
            </div>

            {maestria && (
                <MasteryResultModal
                    onClose={() => setMaestria(null)}
                    retratoAnteriorDaBancada={maestria === 'comparando' ? {
                        levels: { saude: 5, trabalho: 7, proposito: 6, relacoes: 3, lazer: 5 },
                        mastery_index: 52,
                        taken_at: new Date(Date.now() - 92 * 86400000).toISOString(),
                    } : undefined}
                />
            )}

            {aberto && (
                <AchievementModal
                    achievement={{ type: aberto.type as never, data: aberto.data }}
                    onClose={() => setAberto(null)}
                />
            )}
        </GameContext.Provider>
    );
}

createRoot(document.getElementById('raiz')!).render(<Bancada />);
