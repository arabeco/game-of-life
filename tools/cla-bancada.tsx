/**
 * A BANCADA DA ABA CLA (13/10/2026).
 *
 * Monta o ClanOverviewModal EMBUTIDO, como a aba Cla da tela Mundo usa, com um
 * contexto de mentira: nada toca banco nem conta. Serve para ver a tela sem
 * moldura ("tela dentro de tela" saiu).
 * Suba com `npm run bancada` e abra http://localhost:3010/cla-bancada.html
 */
import '../index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { GameContext } from '../contexts/GameContext';
import { ClanOverviewModal } from '../components/ClanOverviewModal';

const membro = (id: string, nickname: string, role: string, season: number, total: number) => ({
    id, nickname, role, level: 12, avatarUrl: '', sovereign: null,
    seasonContributionPoints: season, contributionPoints: total,
});
const membros = [
    membro('eu', 'Mister X', 'leader', 1840, 9200),
    membro('a', 'Luna', 'member', 1210, 4100),
    membro('b', 'Rafa', 'member', 640, 2300),
];

function Bancada() {
    const contexto = {
        clan: { id: 'c1', name: 'Os Lobos', icon: '🐺', rankId: 'bastiao', exp: 26400, totalExp: 26400 },
        clanRanks: [
            { id: 'feudo', name: 'Feudo', expRequired: 0 },
            { id: 'bastiao', name: 'Bastião', expRequired: 20000 },
            { id: 'provincia', name: 'Província', expRequired: 50000 },
        ],
        humorDoCla: { eu: 70, a: 45, b: null },
        enrichedClanMembers: membros,
        loadClanAndMembers: async () => {},
        leaveClan: async () => {},
        userProfile: { id: 'eu', nickname: 'Mister X' },
        missoesDeClaAtivas: [], missoesDoCla: {}, entrarNaMissaoDoCla: async () => {},
        receberPremioDaMissaoDoCla: async () => {}, atualizarMissaoDoCla: async () => {}, carregarHumorDoCla: async () => {},
        updateClan: async () => {}, kickClanMember: async () => {}, deleteClan: async () => {},
    };
    return (
        <GameContext.Provider value={contexto as never}>
            <div style={{ padding: '12px 16px', color: '#aaa', fontSize: 11, letterSpacing: '0.14em' }}>PESSOAS · MENSAGENS · <b style={{ color: '#f1d595' }}>CLÃ</b></div>
            <div className="flex flex-col items-center gap-3 px-4">
                <ClanOverviewModal embedded onClose={() => undefined} />
            </div>
        </GameContext.Provider>
    );
}
createRoot(document.getElementById('root')!).render(<Bancada />);
