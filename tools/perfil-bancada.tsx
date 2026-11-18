/**
 * A BANCADA DO PERFIL (o que abre ao tocar no avatar la em cima).
 *
 * Monta o ProfileView DE VERDADE com um provedor de mentira, para ver nos
 * tamanhos de celular o que a area das abas mostra e o que corta. Nada toca
 * banco: o que o perfil pedir e nao estiver aqui vira lista vazia ou funcao
 * que nao faz nada.
 *
 *   npm run bancada  ->  http://localhost:3010/perfil-bancada.html
 *   ?soberano=0 tira o soberano; ?fundo=arquivo.webp troca o plano de fundo (0 = sem)
 */
import '../index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { GameContext } from '../contexts/GameContext';
import { ProfileView } from '../views/ProfileView';
import { SOVEREIGN_ASSETS } from '../constants/GMboard';

const q = new URLSearchParams(location.search);
const pega = (lista: { id: string }[], i: number) => lista[Math.min(i, lista.length - 1)]?.id || 'none';
const artefatos = SOVEREIGN_ASSETS.artifacts.filter((a) => a.id !== 'none');

const sovereign = q.get('soberano') === '0' ? undefined : {
    body: 'body_masc_1', skinTone: '#C68863', hairColor: '#2C1608',
    hairStyle: pega(SOVEREIGN_ASSETS.hairStyles, 3),
    outfit: pega(SOVEREIGN_ASSETS.outfits, 12),
    artifact: artefatos[2]?.id || 'none',
    extraArtifacts: [artefatos[5]?.id || 'none', artefatos[9]?.id || 'none'],
    aura: 'none', sovereignPlate: 'none', artifactPlate: 'none',
};

const arena = (id: string, acoes: number) => ({ id, name: id, actionIds: Array.from({ length: acoes }, (_, i) => `${id}-a${i}`) });
const assets = [
    { id: 'proposito', name: 'PROPÓSITO', level: 7, arenas: [arena('p1', 4), arena('p2', 3)], slots: [] },
    { id: 'relacoes', name: 'RELAÇÕES', level: 6, arenas: [arena('r1', 2)], slots: [] },
    { id: 'trabalho', name: 'TRABALHO', level: 8, arenas: [arena('t1', 5), arena('t2', 2)], slots: [] },
    { id: 'lazer', name: 'LAZER', level: 5, arenas: [arena('l1', 1)], slots: [] },
    { id: 'saude', name: 'SAÚDE', level: 7, arenas: [arena('s1', 6)], slots: [] },
];

const userProfile = {
    id: 'eu', nickname: 'Mister X', level: 33, exp: 52000, avatarUrl: '', sovereign,
    visibleWidgets: [], skin: 'basic', border: 'item_border_3_001', title: 'Conde',
    backgroundUrl: q.get('fundo') === '0' ? undefined : `/assets/backgrounds/${q.get('fundo') || 'rank06conde.webp'}`,
};

const base: Record<string, unknown> = {
    userProfile, assets, friends: [], inventory: [], clan: null, clanRanks: [], cycleProgress: 64,
    tasks: [], actions: [], arenas: [], reports: [], notifications: [], friendRequestsOutgoing: [],
    autoresDoFeed: {}, modoEssencial: false,
    getUserPublicData: async () => null,
    fetchLikesReceived: async () => 27,
    showToast: () => {},
};
const contexto = new Proxy(base, {
    get(alvo, chave: string) {
        if (chave in alvo) return alvo[chave];
        if (/^(is|has|can|should)[A-Z]/.test(chave)) return false;
        return () => undefined;
    },
});

createRoot(document.getElementById('root')!).render(
    <GameContext.Provider value={contexto as never}>
        <ProfileView onClose={() => {}} />
    </GameContext.Provider>,
);
