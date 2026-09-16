import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GameContext, GameContextType } from '../../contexts/GameContext';
import { FeedEventCard } from '../../components/FeedEventCard';
import { FeedEvent } from '../../types';
import '../../index.css';

const samples: FeedEvent[] = [
    { type: 'ARENA_COMPLETED', content: { title: 'Meditação Zen', assetId: 'proposito', actionCount: 5, deliveries: 21, days: 7, minutes: 210 } },
    { type: 'ARENA_COMPLETED', content: { title: 'Cuidar de Mim', assetId: 'saude', actionCount: 4, deliveries: 12, days: 6, minutes: 360 } },
    { type: 'ARENA_COMPLETED', content: { title: 'Projeto em Movimento', assetId: 'trabalho', actionCount: 8, deliveries: 24, days: 10, minutes: 720 } },
    { type: 'ARENA_COMPLETED', content: { title: 'Tempo Juntos', assetId: 'relacoes', actionCount: 3, deliveries: 9, days: 5 } },
    { type: 'ARENA_COMPLETED', content: { title: 'Espaço para Criar', assetId: 'lazer', actionCount: 2, deliveries: 6, days: 3 } },
    { type: 'QUEST_COMPLETED', content: { title: 'Sequência Perfeita', exp: 150 } },
    { type: 'QUEST_COMPLETED', content: { title: 'Despertar da Aurora', seasonId: 'season-aurora-1-2026', exp: 300 } },
    { type: 'QUEST_COMPLETED', content: { title: 'O Primeiro Passo', seasonId: 'season-genesis-0', exp: 250 } },
    { type: 'CYCLE_COMPLETED', content: { title: 'Ciclo de Junho', days: 21, deliveries: 34, exp: 1240 } },
    { type: 'PLAYER_RANK_UP', content: { title: 'Duque', rankName: 'Duque' } },
].map((sample, i) => ({ ...sample, type: sample.type as FeedEvent['type'], id: String(i), userId: 'demo', authorNickname: 'Mister X', timestamp: new Date(Date.now() - (i + 1) * 120000).toISOString(), likes: i + 1 }));

function Preview() {
    const [events, setEvents] = useState(samples);
    const context = {
        friends: [], userProfile: { id: 'demo', nickname: 'Mister X' }, showToast: () => {},
        toggleFeedLike: async (id: string) => setEvents(rows => rows.map(row => row.id === id ? { ...row, likedByMe: !row.likedByMe, likes: (row.likes || 0) + (row.likedByMe ? -1 : 1) } : row)),
        deleteFeedEvent: async (id: string) => setEvents(rows => rows.filter(row => row.id !== id)),
    } as unknown as GameContextType;
    return <GameContext.Provider value={context}>
        <main style={{ height: '100dvh', overflowY: 'auto', background: '#080a0c', color: '#eee', padding: '28px 12px' }}>
            <div style={{ maxWidth: 540, margin: 'auto' }}>
                <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#efdab0', textAlign: 'center' }}>Feitos</h1>
                <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, margin: '8px 0 24px' }}>Prévia com dados ilustrativos · cards reais do app</p>
                <div style={{ display: 'grid', gap: 20 }}>{events.map(event => <FeedEventCard key={event.id} event={event} />)}</div>
            </div>
        </main>
    </GameContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
