
import { createClient } from '@supabase/supabase-js';
import { Season, SeasonMission } from './types';
import { GM_CONFIG } from './constants';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabase;

// --- MOCK DATA AND STATE ---

const initialMockClans: any[] = [];

const initialMockSeasons: Season[] = GM_CONFIG.seasons.map(season => ({ ...season }));

const initialMockSeasonMissions: SeasonMission[] = GM_CONFIG.seasonMissions.map(mission => ({ ...mission }));

const initialMockUserProfiles: any[] = [];

const initialMockClanMembers: any[] = [];

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
let MOCK_CLAN_MEMBERS_DATA: any[] = getMockData('mock_clan_members', initialMockClanMembers);
let MOCK_SEASONS_DATA = getMockData('mock_seasons', initialMockSeasons);
let MOCK_SEASON_MISSIONS_DATA = getMockData('mock_season_missions', initialMockSeasonMissions);
let MOCK_USER_PROFILES_DATA = getMockData('mock_user_profiles', initialMockUserProfiles);
let MOCK_FRIENDS_DATA: any[] = getMockData('mock_friends', []);
let MOCK_FRIEND_REQUESTS_DATA: any[] = getMockData('mock_friend_requests', []);
let MOCK_CLAN_QUEST_PROGRESS_DATA: any[] = getMockData('mock_clan_quest_progress', []);
let MOCK_CLAN_JOIN_REQUESTS_DATA: any[] = getMockData('mock_clan_join_requests', []);

const mockClanIdsToRemove = new Set(['clan_01', 'clan_02', 'clan_03']);
const mockUserIdsToRemove = new Set(['mock_user_1', 'mock_user_2', 'mock_user_3']);

const nextMockClans = MOCK_CLANS_DATA.filter((clan: any) => !mockClanIdsToRemove.has(clan.id));
if (nextMockClans.length !== MOCK_CLANS_DATA.length) {
    MOCK_CLANS_DATA = nextMockClans;
    setMockData('mock_clans', MOCK_CLANS_DATA);
}

const nextMockUsers = MOCK_USER_PROFILES_DATA.filter((profile: any) => !mockUserIdsToRemove.has(profile.id));
if (nextMockUsers.length !== MOCK_USER_PROFILES_DATA.length) {
    MOCK_USER_PROFILES_DATA = nextMockUsers;
    setMockData('mock_user_profiles', MOCK_USER_PROFILES_DATA);
}

const nextMockMembers = MOCK_CLAN_MEMBERS_DATA.filter((member: any) => !mockClanIdsToRemove.has(member.clan_id) && !mockUserIdsToRemove.has(member.user_id));
if (nextMockMembers.length !== MOCK_CLAN_MEMBERS_DATA.length) {
    MOCK_CLAN_MEMBERS_DATA = nextMockMembers;
    setMockData('mock_clan_members', MOCK_CLAN_MEMBERS_DATA);
}

const buildMockProfile = (id: string) => ({
    id: id,
    email: `${id}@mock.com`,
    nickname: id === 'placeholder_user' ? 'Sovereign' : `User_${id.slice(-4)}`,
    sovereign: { body: 'male_base', skinTone: '#E2A984', hairStyle: 'none', hairColor: '#2C1608', outfit: 'none', head_under: 'none', helmet: 'none', head_over: 'none', artifact: 'none' },
    avatar_url: `https://picsum.photos/seed/${id}/100/100`,
    border: 'default', level: 1, background_url: '', is_online: true, visible_widgets: [], skin: 'default', nobility: { exp: 0, rankId: 'vagante' }, mood: 50, role: 'user', banner_url: ''
});

const isSupabaseMock = !(supabaseUrl && supabaseAnonKey);

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
                                } else if (table === 'friends') {
                                    MOCK_FRIENDS_DATA.push(newRecord as any);
                                    setMockData('mock_friends', MOCK_FRIENDS_DATA);
                                } else if (table === 'friend_requests') {
                                    const request = { ...newRecord, created_at: new Date().toISOString(), responded_at: null };
                                    MOCK_FRIEND_REQUESTS_DATA.push(request as any);
                                    setMockData('mock_friend_requests', MOCK_FRIEND_REQUESTS_DATA);
                                    resolve({ data: request, error: null });
                                    return;
                                } else if (table === 'clan_join_requests') {
                                    const request = { ...newRecord, created_at: new Date().toISOString(), responded_at: null };
                                    MOCK_CLAN_JOIN_REQUESTS_DATA.push(request as any);
                                    setMockData('mock_clan_join_requests', MOCK_CLAN_JOIN_REQUESTS_DATA);
                                    resolve({ data: request, error: null });
                                    return;
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
                        } else if (table === 'friends') {
                            const newFriends = Array.isArray(data) ? data : [data];
                            newFriends.forEach(friend => MOCK_FRIENDS_DATA.push({ ...friend, id: `friends_${Date.now()}` }));
                            setMockData('mock_friends', MOCK_FRIENDS_DATA);
                            resolve({ data: newFriends, error: null });
                        } else if (table === 'friend_requests') {
                            const newRequestData = Array.isArray(data) ? data[0] : data;
                            const newRequest = { ...newRequestData, id: `friend_requests_${Date.now()}`, created_at: new Date().toISOString(), responded_at: null };
                            MOCK_FRIEND_REQUESTS_DATA.push(newRequest as any);
                            setMockData('mock_friend_requests', MOCK_FRIEND_REQUESTS_DATA);
                            resolve({ data: [newRequest], error: null });
                        } else if (table === 'clan_join_requests') {
                            const newRequestData = Array.isArray(data) ? data[0] : data;
                            const newRequest = { ...newRequestData, id: `clan_join_requests_${Date.now()}`, created_at: new Date().toISOString(), responded_at: null };
                            MOCK_CLAN_JOIN_REQUESTS_DATA.push(newRequest as any);
                            setMockData('mock_clan_join_requests', MOCK_CLAN_JOIN_REQUESTS_DATA);
                            resolve({ data: [newRequest], error: null });
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
                             if (table === 'friend_requests') {
                                const idx = MOCK_FRIEND_REQUESTS_DATA.findIndex((r: any) => r[column] === value);
                                if (idx > -1) {
                                    MOCK_FRIEND_REQUESTS_DATA[idx] = { ...MOCK_FRIEND_REQUESTS_DATA[idx], ...data };
                                    setMockData('mock_friend_requests', MOCK_FRIEND_REQUESTS_DATA);
                                    return Promise.resolve({ data: [MOCK_FRIEND_REQUESTS_DATA[idx]], error: null });
                                }
                            }
                             if (table === 'clan_join_requests') {
                                const idx = MOCK_CLAN_JOIN_REQUESTS_DATA.findIndex((r: any) => r[column] === value);
                                if (idx > -1) {
                                    MOCK_CLAN_JOIN_REQUESTS_DATA[idx] = { ...MOCK_CLAN_JOIN_REQUESTS_DATA[idx], ...data };
                                    setMockData('mock_clan_join_requests', MOCK_CLAN_JOIN_REQUESTS_DATA);
                                    return Promise.resolve({ data: [MOCK_CLAN_JOIN_REQUESTS_DATA[idx]], error: null });
                                }
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
                upsert: (data: any) => {
                    if (table === 'clan_quest_progress') {
                        const payload = Array.isArray(data) ? data[0] : data;
                        const idx = MOCK_CLAN_QUEST_PROGRESS_DATA.findIndex(row => row.clan_id === payload.clan_id && row.quest_id === payload.quest_id);
                        if (idx > -1) {
                            MOCK_CLAN_QUEST_PROGRESS_DATA[idx] = { ...MOCK_CLAN_QUEST_PROGRESS_DATA[idx], ...payload };
                        } else {
                            MOCK_CLAN_QUEST_PROGRESS_DATA.push(payload);
                        }
                        setMockData('mock_clan_quest_progress', MOCK_CLAN_QUEST_PROGRESS_DATA);
                        return Promise.resolve({ data: [payload], error: null });
                    }
                    return Promise.resolve({ data: [data], error: null });
                },
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
                    if (table === 'clan_quest_progress' && eqFilter) {
                        const progressRows = MOCK_CLAN_QUEST_PROGRESS_DATA.filter(row => row[eqFilter!.column] === eqFilter!.value);
                        resolve({ data: progressRows, error: null });
                        return;
                    }
                    if (table === 'friends' && eqFilter) {
                        const friendRows = MOCK_FRIENDS_DATA.filter(f => f[eqFilter!.column] === eqFilter!.value);
                        resolve({ data: friendRows, error: null });
                        return;
                    }
                    if (table === 'friend_requests' && eqFilter) {
                        const requestRows = MOCK_FRIEND_REQUESTS_DATA.filter(r => r[eqFilter!.column] === eqFilter!.value);
                        resolve({ data: requestRows, error: null });
                        return;
                    }
                    if (table === 'clan_join_requests' && eqFilter) {
                        const requestRows = MOCK_CLAN_JOIN_REQUESTS_DATA.filter(r => r[eqFilter!.column] === eqFilter!.value);
                        resolve({ data: requestRows, error: null });
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
                    if (table === 'user_profiles' && ilikeFilter) {
                        const query = ilikeFilter.value.replace(/%/g, '').toLowerCase();
                        const filteredProfiles = MOCK_USER_PROFILES_DATA.filter(profile => {
                            if (ilikeFilter?.column === 'email') {
                                return (profile.email || '').toLowerCase().includes(query);
                            }
                            return profile.nickname.toLowerCase().includes(query);
                        });
                        resolve({ data: filteredProfiles, error: null });
                        return;
                    }
                    if (table === 'user_profiles' && inFilter) {
                        const profiles = inFilter.values.map(id => {
                            const existing = MOCK_USER_PROFILES_DATA.find(profile => profile.id === id);
                            return existing || buildMockProfile(id);
                        });
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

export { supabase, isSupabaseMock };
