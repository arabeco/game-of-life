
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { PROFILE_FLAG_TERMS_PENDING, useGame } from '../contexts/GameContext';
import { SupabaseService } from '../services/SupabaseService';
import { GoldenInvite, UserProfile } from '../types';
import { GM_CONFIG } from '../constants';
import { AssetIcon, ArenaIcon, PlannerIcon, SocialIcon, ConfigIcon } from '../components/Icons';
import { AchievementModal } from '../components/AchievementModal';

export const LoginView: React.FC = () => {
    const { updateUserProfile } = useGame();
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    
    const handleSignUp = async () => {
        const normalizedInvite = inviteCode.trim();
        let inviteRecord: GoldenInvite | null = null;

        if (!normalizedInvite) {
            setError('Informe um Convite Dourado.');
            return;
        }

        const multiUseCodes = (GM_CONFIG.goldenInvites as any)?.multiUseCodes as string[] | undefined;
        const isMultiUseInvite = (multiUseCodes || []).includes(normalizedInvite);

        if (!isMultiUseInvite) {
            inviteRecord = await SupabaseService.getGoldenInviteByCode(normalizedInvite);
            if (!inviteRecord) {
                setError('Convite Dourado inválido.');
                return;
            }
            if (inviteRecord.is_used) {
                setError('Convite Dourado já utilizado.');
                return;
            }
        }
        setLoading(true);
        setError(null);
        setMessage(null);
        
        try {
            const { data, error } = await supabase.auth.signUp({ 
                email, 
                password,
                options: {
                    data: {
                        nickname: nickname || email.split('@')[0]
                    }
                }
            });
            
            if (error) throw error;
            
            if (data.user) {
                if (!isMultiUseInvite && inviteRecord) {
                    const consumed = await SupabaseService.consumeGoldenInvite(inviteRecord.id, data.user.id);
                    if (!consumed) {
                        setError('Convite Dourado já utilizado.');
                        await supabase.auth.signOut();
                        setLoading(false);
                        return;
                    }
                }
                // Criar perfil do usuário
                const newProfile: UserProfile = {
                    id: data.user.id,
                    email: data.user.email,
                    nickname: nickname || email.split('@')[0],
                    avatarUrl: `https://picsum.photos/seed/${data.user.id}/100/100`,
                    border: 'default',
                    level: 0,
                    backgroundUrl: `https://picsum.photos/seed/bg-${data.user.id}/400/150`,
                    isOnline: true,
                    visibleWidgets: ['consciencia.lema'],
                    skin: 'GOLD',
                    unlockedSkins: { GOLD: true },
                    unlockedItems: {
                        bodyStyles: {},
                        hairStyles: {},
                        outfits: {},
                        head_under_items: {},
                        helmets: {},
                        head_over_items: {},
                        artifacts: {},
                        codexes: {},
                        skins: {},
                        borders: {},
                        glyphs: {},
                        auras: {},
                    },
                    completedSeasonMissions: [PROFILE_FLAG_TERMS_PENDING],
                    nobility: { exp: 0, rankId: 'vagante' },
                    wallet: { gold: 0, fragments: 0 },
                    mood: 50,
                    chests: [{ type: 'Comum', count: 1 }],
                    inventory: [],
                    role: 'user',
                    isPremium: false
                };

                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .insert([{
                        id: newProfile.id,
                        email: newProfile.email,
                        nickname: newProfile.nickname,
                        avatar_url: newProfile.avatarUrl,
                        border: newProfile.border,
                        level: newProfile.level,
                        background_url: newProfile.backgroundUrl,
                        is_online: newProfile.isOnline,
                        visible_widgets: newProfile.visibleWidgets,
                        skin: newProfile.skin,
                        unlocked_skins: newProfile.unlockedSkins,
                        unlocked_items: newProfile.unlockedItems,
                        completed_season_missions: newProfile.completedSeasonMissions,
                        nobility: newProfile.nobility,
                        mood: newProfile.mood,
                        chests: newProfile.chests,
                        role: newProfile.role,
                        is_premium: newProfile.isPremium ?? false,
                    }]);

                if (profileError) throw profileError;
                setMessage('Cadastro realizado! Verifique seu email para confirmar a conta.');
                setIsSigningUp(false);
            }
        } catch (error: any) {
            setError(error.message || 'Erro no cadastro');
        }
        
        setLoading(false);
    };

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            
            if (error) throw error;
            
            if (data.user) {
                // Buscar perfil do usuário
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profile) {
                    const userProfileForState: UserProfile = {
                        id: profile.id,
                        email: profile.email,
                        sovereign: profile.sovereign,
                        avatarUrl: profile.avatar_url,
                        border: profile.border,
                        nickname: profile.nickname,
                        level: profile.level,
                        backgroundUrl: profile.background_url,
                        bannerUrl: profile.banner_url,
                        isOnline: profile.is_online,
                        visibleWidgets: profile.visible_widgets,
                        skin: profile.skin,
                        unlockedSkins: profile.unlocked_skins ?? {},
                        unlockedItems: profile.unlocked_items ?? {
                            bodyStyles: {},
                            hairStyles: {},
                            outfits: {},
                            head_under_items: {},
                            helmets: {},
                            head_over_items: {},
                            artifacts: {},
                        },
                        completedSeasonMissions: profile.completed_season_missions ?? [],
                        lastLevelUpdate: profile.last_level_update,
                        nobility: profile.nobility,
                        mood: profile.mood,
                        chests: profile.chests,
                        wallet: profile.wallet ?? { gold: 0, fragments: 0 },
                        inventory: [],
                        role: profile.role,
                        isPremium: profile.is_premium ?? false,
                    };
                    updateUserProfile(userProfileForState);
                }
            }
        } catch (error: any) {
            setError(error.message || 'Erro no login');
        }
        
        setLoading(false);
    };

    const loginAsAdmin = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const adminEmail = 'admin@gol.local';
            const adminPassword = 'admin123';

            // Tentar login primeiro
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: adminEmail,
                password: adminPassword,
            });

            if (signInError && (signInError.message.includes('Invalid login credentials') || signInError.message.includes('User not found'))) {
                // Criar conta admin se não existir
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: adminEmail,
                    password: adminPassword,
                    options: {
                        data: {
                            nickname: 'Admin',
                        }
                    }
                });

                if (signUpError) throw signUpError;

                if (signUpData.user) {
                     const adminProfileForState: UserProfile = {
                        id: signUpData.user.id,
                        email: adminEmail,
                        nickname: 'Admin',
                        sovereign: {
                            body: 'male_base',
                            skinTone: '#FDBCB4',
                            hairStyle: 'short',
                            hairColor: '#2C1810',
                            outfit: 'royal_robes',
                            head_under: 'none',
                            helmet: 'none',
                            head_over: 'crown',
                            artifact: 'none',
                            glyph: 'none',
                            aura: 'none'
                        },
                        avatarUrl: 'https://picsum.photos/seed/admin/100/100',
                        border: 'GOLD',
                        level: 99,
                        backgroundUrl: 'https://picsum.photos/seed/admin-bg/400/150',
                        isOnline: true,
                        visibleWidgets: ['consciencia.lema', 'espiritualidade.sistema'],
                        skin: 'GOLD',
                        unlockedSkins: {},
                        unlockedItems: {
                            bodyStyles: {},
                            hairStyles: {},
                            outfits: {},
                            head_under_items: {},
                            helmets: {},
                            head_over_items: {},
                            artifacts: {},
                            codexes: {},
                            skins: {},
                            borders: {},
                            glyphs: {},
                            auras: {},
                        },
                        completedSeasonMissions: [],
                        nobility: { exp: 999999, rankId: 'soberano' },
                        mood: 100,
                        chests: [
                            { type: 'Comum', count: 99 },
                            { type: 'Raro', count: 50 },
                            { type: 'Épico', count: 25 },
                            { type: 'Lendário', count: 10 }
                        ],
                        wallet: { gold: 99999, fragments: 99999 },
                        inventory: [],
                        role: 'admin',
                        isPremium: true
                    };

                    const adminProfileForDB = {
                        id: adminProfileForState.id,
                        email: adminProfileForState.email,
                        nickname: adminProfileForState.nickname,
                        sovereign: adminProfileForState.sovereign,
                        avatar_url: adminProfileForState.avatarUrl,
                        border: adminProfileForState.border,
                        level: adminProfileForState.level,
                        background_url: adminProfileForState.backgroundUrl,
                        is_online: adminProfileForState.isOnline,
                        visible_widgets: adminProfileForState.visibleWidgets,
                        skin: adminProfileForState.skin,
                        unlocked_skins: adminProfileForState.unlockedSkins,
                        unlocked_items: adminProfileForState.unlockedItems,
                        completed_season_missions: adminProfileForState.completedSeasonMissions,
                        nobility: adminProfileForState.nobility,
                        mood: adminProfileForState.mood,
                        chests: adminProfileForState.chests,
                        role: adminProfileForState.role,
                        is_premium: adminProfileForState.isPremium ?? true
                    };
                    
                    const { error: profileError } = await supabase
                        .from('user_profiles')
                        .insert([adminProfileForDB]);

                    if (profileError) throw profileError;

                    updateUserProfile(adminProfileForState);
                }
            } else if (signInData.user) {
                // Buscar perfil admin existente
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', signInData.user.id)
                    .single();

                if (profile) {
                    const userProfileForState: UserProfile = {
                        id: profile.id,
                        email: profile.email,
                        sovereign: profile.sovereign,
                        avatarUrl: profile.avatar_url,
                        border: profile.border,
                        nickname: profile.nickname,
                        level: profile.level,
                        backgroundUrl: profile.background_url,
                        bannerUrl: profile.banner_url,
                        isOnline: profile.is_online,
                        visibleWidgets: profile.visible_widgets,
                        skin: profile.skin,
                        unlockedSkins: profile.unlocked_skins ?? {},
                        unlockedItems: profile.unlocked_items ?? {
                            bodyStyles: {},
                            hairStyles: {},
                            outfits: {},
                            head_under_items: {},
                            helmets: {},
                            head_over_items: {},
                            artifacts: {},
                        },
                        completedSeasonMissions: profile.completed_season_missions ?? [],
                        lastLevelUpdate: profile.last_level_update,
                        nobility: profile.nobility,
                        mood: profile.mood,
                        chests: profile.chests,
                        wallet: profile.wallet ?? { gold: 0, fragments: 0 },
                        inventory: [],
                        role: profile.role,
                        isPremium: profile.is_premium ?? false,
                    };
                    updateUserProfile(userProfileForState);
                }
            } else if (signInError) {
                throw signInError;
            }
        } catch (error: any) {
            setError(error.message || 'Erro ao fazer login como admin');
        } finally {
            setLoading(false);
        }
    };

    const clearForm = () => {
        setEmail('');
        setPassword('');
        setNickname('');
        setInviteCode('');
        setError(null);
        setMessage(null);
    };

    const toggleMode = () => {
        clearForm();
        setIsSigningUp(!isSigningUp);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black animate-fade-in">
            <div className="w-full max-w-sm mx-auto text-center border border-[var(--skin-accent-color)]/50 rounded-2xl p-6 space-y-6 overflow-hidden">
                <div className="relative w-40 h-40 mx-auto flex items-center justify-center mb-8">
                    <div className="absolute w-[190%] h-[190%] rounded-full bg-[radial-gradient(circle,var(--skin-accent-color)_0%,transparent_70%)] opacity-20 blur-2xl aura-glow"></div>
                    <div className="absolute w-[210%] h-[210%] rounded-full bg-[conic-gradient(from_0deg,var(--skin-accent-color),transparent,var(--skin-accent-color))] opacity-10 blur-3xl aura-plasma"></div>
                    <img
                        src="/logo-diamond.png"
                        alt="GLYPH"
                        className="w-full h-full drop-shadow-[0_0_15px_var(--skin-accent-color)]"
                        style={{ transform: 'scale(1.35)' }}
                    />
                    <div className="absolute w-[135%] h-[135%] animate-spin" style={{ animationDuration: '12s' }}>
                        <img
                            src="/logo-core.png"
                            alt="GLYPH Core"
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                </div>

                <h1 className="luxe-title-ornate text-4xl font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-b from-[var(--skin-accent-color)] to-white/50 drop-shadow-[0_0_15px_var(--skin-accent-color)] transform scale-110 mb-8">
                    GLYPH
                </h1>

                <div className="space-y-4">
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] transition-colors placeholder-gray-500"
                    />
                    <input 
                        type="password" 
                        placeholder="Senha" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] transition-colors placeholder-gray-500"
                    />
                    {isSigningUp && (
                        <input 
                            type="text" 
                            placeholder="Nickname" 
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full px-4 py-3 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] transition-colors placeholder-gray-500"
                        />
                    )}
                    {isSigningUp && (
                        <input 
                            type="text" 
                            placeholder="Cole aqui seu Convite Dourado..." 
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            className="w-full px-4 py-3 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] transition-colors placeholder-gray-500"
                        />
                    )}
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
                {message && <p className="text-green-400 text-sm">{message}</p>}

                <div className="space-y-3">
                    {isSigningUp ? (
                        <button 
                            onClick={handleSignUp} 
                            disabled={loading}
                            className="w-full py-3 rounded-xl luxe-skin-button disabled:opacity-50"
                        >
                            {loading ? 'CADASTRANDO...' : 'CADASTRAR'}
                        </button>
                    ) : (
                        <button 
                            onClick={handleLogin} 
                            disabled={loading}
                            className="w-full py-3 rounded-xl luxe-skin-button disabled:opacity-50"
                        >
                            {loading ? 'ENTRANDO...' : 'ENTRAR'}
                        </button>
                    )}
                    <button onClick={toggleMode} className="text-xs text-gray-400 hover:text-white">
                        {isSigningUp ? 'Já tem uma conta? Entrar.' : 'Não tem conta? Cadastre-se com um convite.'}
                    </button>
                </div>

            </div>
        </div>
    );
};
