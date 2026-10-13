/**
 * A BANCADA DO DIARIO (12/10/2026).
 *
 * Monta o MoodModal de verdade (abas Humor e Paginas) com um contexto de
 * mentira e um banco de mentira na memoria: nada toca rede ou conta.
 * Suba com `npm run bancada` e abra http://localhost:3010/diario-bancada.html
 * (?aba=paginas abre direto nas Paginas).
 */
import '../index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GameContext } from '../contexts/GameContext';
import { MoodModal } from '../components/MoodModal';
import { supabase } from '../supabaseClient';

const paginas: Record<number, { content: string; updated_at: string }> = {
    1: {
        updated_at: '2026-10-05T10:00:00Z',
        content: '05/10/2026 · Medo\nSemana pesada, muita coisa pra entregar.\n\n--------------\n06/10/2026 · Coragem · Gratidão\nFechei a tabela das placas. Dá pra respirar.\n',
    },
    2: {
        updated_at: '2026-10-12T21:00:00Z',
        content: '11/10/2026 · Aceitação · Reflexão\nO clã precisa de dinâmica, não de mais tela.\n\n--------------\n12/10/2026 · Disposição · Ideia\nDiário com cor e tag. Bolinha do humor do lado do campo.\nE as páginas sem cara de Windows 98.\n\n--------------\n12/10/2026 · Alegria · Conquista\nMissão de clã no ar.\n\n--------------\n13/10/2026 · Coragem · Lembrete\nRodar o SQL do contador do site.\n',
    },
};

// O banco de mentira: so as chamadas que o JournalService faz.
(supabase as any).from = () => {
    const filtros: Record<string, unknown> = {};
    const q: any = {
        select: () => q,
        eq: (coluna: string, valor: unknown) => { filtros[coluna] = valor; return q; },
        order: () => Promise.resolve({ data: Object.entries(paginas).map(([n, p]) => ({ page_number: Number(n), ...p })), error: null }),
        maybeSingle: () => Promise.resolve({ data: paginas[Number(filtros.page_number)] || null, error: null }),
        upsert: (linha: any) => { paginas[linha.page_number] = { content: linha.content, updated_at: linha.updated_at }; return Promise.resolve({ error: null }); },
    };
    return q;
};

function Bancada() {
    const [mood, setMood] = useState(62);
    const historico = [40, 22, 50, 55, 33, 62].map((value, i) => ({ value, recordedAt: `2026-10-0${i + 1}T12:00:00Z` }));
    const contexto = {
        userProfile: { id: '00000000-0000-0000-0000-000000000123', mood },
        dailyCommitment: null,
        updateMood: setMood,
        updateOperationalScratch: () => {},
        recordMoodEntry: async () => {},
        fetchMoodHistory: async () => historico,
    };
    return (
        <GameContext.Provider value={contexto as never}>
            <MoodModal onClose={() => {}} />
        </GameContext.Provider>
    );
}
createRoot(document.getElementById('root')!).render(<Bancada />);
