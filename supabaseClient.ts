
import { createClient } from '@supabase/supabase-js';
import { Season, SeasonMission } from './types';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabase;

// --- MOCK DATA AND STATE ---

const initialMockClans = [
    { id: 'clan_01', name: 'The Seekers', icon: '👁️', description: 'Um clã para aqueles que buscam conhecimento.', clan_type: 'Focado' as const, recruitment_status: 'Aberto' as const, exp: 42500, rank_id: 'provincia' },
    { id: 'clan_02', name: 'Dragon Guard', icon: '🐲', description: 'Defensores do antigo pacto dos dragões.', clan_type: 'Competitivo' as const, recruitment_status: 'Aberto' as const, exp: 150000, rank_id: 'principado' },
    { id: 'clan_03', name: 'Shadow Syndicate', icon: '⚔️', description: 'Operamos nas sombras para manter o equilíbrio.', clan_type: 'Competitivo' as const, recruitment_status: 'Privado' as const, exp: 800000, rank_id: 'reino' },
];

const initialMockSeasons: Season[] = [
    { id: 'season_0', name: 'Season 0 - Aquário', start_date: '2024-01-01', end_date: '2026-02-18', background_png_url: 'https://i.imgur.com/6c2z3uH.jpeg', lore_text: 'Um tempo de purificação e novos começos, onde a fluidez da água nos ensina a adaptar e superar.', is_active: true }
];

const initialMockSeasonMissions: SeasonMission[] = [
    { id: 'sm_1', season_id: 'season_0', title: 'O Peregrino', description: 'Correr um total de 50km.', goal_type: 'km_run', goal_value: 50, reward_type: 'exp', reward_value: 1000 },
    { id: 'sm_2', season_id: 'season_0', title: 'O Sábio', description: 'Ler 1 livro completo.', goal_type: 'books_read', goal_value: 1, reward_type: 'exp', reward_value: 500 },
    { id: 'sm_3', season_id: 'season_0', title: 'O Monge', description: 'Meditar por 20 dias.', goal_type: 'meditation_days', goal_value: 20, reward_type: 'exp', reward_value: 750 },
];

const getMockData = <T>(key: string, initialData: T): T => {
    try {
        const saved = localStorage.getItem(key);
        if (saved) {
            return JSON.parse(saved);
        } else {
            localStorage.setItem(key, JSON.stringify(initialData));
            return initialData;
        }
    } catch (e) {
        console.error(`Failed to load mock data for ${key}`, e);
        return initialData;
    }
};

const setMockData = <T>(key: string, data: T) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch(e) {
        console.error(`Failed to save mock data for ${key}`, e);
    }
};

let MOCK_CLANS_DATA = getMockData('mock_clans', initialMockClans);
let MOCK_CLAN_MEMBERS_DATA: any[] = getMockData('mock_clan_members', []);
let MOCK_SEASONS_DATA = getMockData('mock_seasons', initialMockSeasons);
let MOCK_SEASON_MISSIONS_DATA = getMockData('mock_season_missions', initialMockSeasonMissions);

if (supabaseUrl && supabaseAnonKey) {
    // We have credentials, use the real client
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn("Supabase URL/Key not found. Falling back to stateful offline mock client.");

    const mockSupabase = {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Modo Offline: Cadastro desabilitado.', name: 'OfflineError', status: 503 } }),
            signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Modo Offline: Login desabilitado.', name: 'OfflineError', status: 503 } }),
            signOut: () => Promise.resolve({ error: null }),
        },
        from: (table: string) => {
            let isSingle = false;
            let ilikeFilter: { column: string; value: string } | null = null;
            let eqFilter: { column: string; value: any } | null = null;
            let inFilter: { column: string; values: any[] } | null = null;

            const queryBuilder: any = {
                select: function() { return this; },
                insert: function(data: any) {
                    const selectBuilder = {
                        single: () => {
                            return new Promise((resolve) => {
                                const newRecordData = Array.isArray(data) ? data[0] : data;
                                const newRecord = { ...newRecordData, id: `${table}_${Date.now()}` };

                                if (table === 'clans') {
                                    MOCK_CLANS_DATA.push(newRecord as any);
                                    setMockData('mock_clans', MOCK_CLANS_DATA);
                                } else if (table === 'seasons') {
                                    MOCK_SEASONS_DATA.push(newRecord as any);
                                    setMockData('mock_seasons', MOCK_SEASONS_DATA);
                                } else if (table === 'season_missions') {
                                    MOCK_SEASON_MISSIONS_DATA.push(newRecord as any);
                                    setMockData('mock_season_missions', MOCK_SEASON_MISSIONS_DATA);
                                }
                                resolve({ data: newRecord, error: null });
                            });
                        }
                    };

                    const thenable = new Promise((resolve) => {
                         if (table === 'clan_members') {
                            const newMembers = Array.isArray(data) ? data : [data];
                            newMembers.forEach(member => MOCK_CLAN_MEMBERS_DATA.push({ ...member, joined_at: new Date().toISOString() }));
                             setMockData('mock_clan_members', MOCK_CLAN_MEMBERS_DATA);
                             resolve({ data: newMembers, error: null });
                        } else {
                            // Generic insert for non-single selects
                            const newRecordData = Array.isArray(data) ? data[0] : data;
                            const newRecord = { ...newRecordData, id: `${table}_${Date.now()}` };

                            if (table === 'seasons') {
                                MOCK_SEASONS_DATA.push(newRecord as any);
                                setMockData('mock_seasons', MOCK_SEASONS_DATA);
                            } else if (table === 'season_missions') {
                                MOCK_SEASON_MISSIONS_DATA.push(newRecord as any);
                                setMockData('mock_season_missions', MOCK_SEASON_MISSIONS_DATA);
                            }
                            resolve({ data: [newRecord], error: null });
                        }
                    });

                    return {
                        select: () => selectBuilder,
                        then: (onfulfilled: any) => thenable.then(onfulfilled),
                    };
                },
                update: function(data: any) {
                    const builder = {
                        eq: (column: string, value: any) => {
                             if (table === 'clans') {
                                const idx = MOCK_CLANS_DATA.findIndex((c: any) => c[column] === value);
                                if (idx > -1) { MOCK_CLANS_DATA[idx] = { ...MOCK_CLANS_DATA[idx], ...data }; setMockData('mock_clans', MOCK_CLANS_DATA); return Promise.resolve({ data: [MOCK_CLANS_DATA[idx]], error: null }); }
                            }
                             if (table === 'seasons') {
                                const idx = MOCK_SEASONS_DATA.findIndex((s: any) => s[column] === value);
                                if (idx > -1) { MOCK_SEASONS_DATA[idx] = { ...MOCK_SEASONS_DATA[idx], ...data }; setMockData('mock_seasons', MOCK_SEASONS_DATA); return Promise.resolve({ data: [MOCK_SEASONS_DATA[idx]], error: null }); }
                            }
                             if (table === 'season_missions') {
                                const idx = MOCK_SEASON_MISSIONS_DATA.findIndex((m: any) => m[column] === value);
                                if (idx > -1) { MOCK_SEASON_MISSIONS_DATA[idx] = { ...MOCK_SEASON_MISSIONS_DATA[idx], ...data }; setMockData('mock_season_missions', MOCK_SEASON_MISSIONS_DATA); return Promise.resolve({ data: [MOCK_SEASON_MISSIONS_DATA[idx]], error: null }); }
                            }
                            return Promise.resolve({ data: null, error: { message: 'Not Found' } });
                        },
                    };
                    return builder;
                },
                delete: function() {
                    const builder = {
                        eq: (column: string, value: any) => {
                            if (table === 'clan_members') {
                                MOCK_CLAN_MEMBERS_DATA = MOCK_CLAN_MEMBERS_DATA.filter(m => m[column] !== value);
                                setMockData('mock_clan_members', MOCK_CLAN_MEMBERS_DATA);
                            }
                            return Promise.resolve({ data: [], error: null });
                        },
                    };
                    return builder;
                },
                upsert: (data: any) => Promise.resolve({ data: [data], error: null }),
                eq: function(column: string, value: any) { eqFilter = { column, value }; return this; },
                in: function(column: string, values: any[]) { inFilter = { column, values }; return this; },
                order: function() { return this; },
                ilike: function(column: string, value: string) { ilikeFilter = { column, value }; return this; },
                limit: function() { return this; },
                single: function() { isSingle = true; return this; },

                then: function(resolve: (value: any) => void) {
                    if (table === 'clans' && ilikeFilter) {
                        const query = ilikeFilter.value.replace(/%/g, '').toLowerCase();
                        const filteredData = MOCK_CLANS_DATA.filter(clan => clan.name.toLowerCase().includes(query));
                        resolve({ data: filteredData, error: null });
                        return;
                    }
                    if (table === 'clans' && eqFilter && isSingle) {
                        const clan = MOCK_CLANS_DATA.find(c => c.id === eqFilter!.value);
                        resolve({ data: clan || null, error: clan ? null : { message: 'Not found' } });
                        return;
                    }
                    if (table === 'clan_members' && eqFilter) {
                        const members = MOCK_CLAN_MEMBERS_DATA.filter(m => m[eqFilter!.column] === eqFilter!.value);
                         if (isSingle) {
                            resolve({ data: members[0] || null, error: null });
                        } else {
                            resolve({ data: members, error: null });
                        }
                        return;
                    }
                    if (table === 'seasons' && !eqFilter) {
                         resolve({ data: MOCK_SEASONS_DATA, error: null });
                         return;
                    }
                    if (table === 'season_missions' && eqFilter) {
                        const missions = MOCK_SEASON_MISSIONS_DATA.filter(m => m[eqFilter!.column] === eqFilter!.value);
                        resolve({ data: missions, error: null });
                        return;
                    }
                    if (table === 'user_profiles' && inFilter) {
                        const profiles = inFilter.values.map(id => ({
                            id: id,
                            email: `${id}@mock.com`,
                            nickname: id === 'placeholder_user' ? 'Sovereign' : `User_${id.slice(-4)}`,
                            sovereign: { body: 'male_base', skinTone: '#E2A984', hairStyle: 'none', hairColor: '#2C1608', outfit: 'none', head_under: 'none', helmet: 'none', head_over: 'none', artifact: 'none' },
                            avatarUrl: `https://picsum.photos/seed/${id}/100/100`,
                            border: 'default', level: 1, backgroundUrl: '', isOnline: true, visibleWidgets: [], skin: 'default', nobility: { exp: 0, rankId: 'vagante' }, mood: 50, role: 'user'
                        }));
                        resolve({ data: profiles, error: null });
                        return;
                    }
                    if (isSingle) {
                        resolve({ data: null, error: { message: 'Not found' } });
                    } else {
                        resolve({ data: [], error: null });
                    }
                },
            };
            return queryBuilder;
        },
    };
    supabase = mockSupabase as any;
}

export { supabase };