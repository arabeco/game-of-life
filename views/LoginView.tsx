
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { PROFILE_FLAG_TERMS_PENDING, useGame } from '../contexts/GameContext';
import { SupabaseService } from '../services/SupabaseService';
import { GoldenInvite, UserProfile, AppMode } from '../types';
import { GM_CONFIG } from '../constants';
import { AssetIcon, ArenaIcon, PlannerIcon, SocialIcon, ConfigIcon, GoogleIcon } from '../components/Icons';
import { AchievementModal } from '../components/AchievementModal';
import { parseBooleanEnvFlag } from '../utils/envFlags';

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
    const disableGoldInviteByEnv = parseBooleanEnvFlag(import.meta.env.VITE_DISABLE_GOLD_INVITE);
    const isGoldenInviteGateEnabled = !import.meta.env.DEV && !disableGoldInviteByEnv;

    // Auto-seed golden invites when login page is opened
    React.useEffect(() => {
        const seedInvites = async () => {
            const seedCodes = (GM_CONFIG.goldenInvites as any)?.seedCodes;
            if (seedCodes && Array.isArray(seedCodes) && seedCodes.length > 0) {
                console.log('Liberando convites dourados iniciais...');
                await SupabaseService.seedGoldenInvites(seedCodes);
                console.log('Convites liberados com sucesso.');
            }
        };
        seedInvites();
    }, []);

    const getPasswordStrength = (pass: string) => {
        if (pass.length === 0) return { score: 0, label: '', color: 'bg-gray-800' };
        if (pass.length < 8) return { score: 1, label: 'RUIM', color: 'bg-red-500' };

        const hasNumber = /\d/.test(pass);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

        if (hasNumber || hasSpecial) return { score: 3, label: 'FORTE', color: 'bg-green-500' };
        return { score: 2, label: 'MÃ‰DIA', color: 'bg-yellow-500' };
    };

    const handleSignUp = async () => {
        const normalizedInvite = inviteCode.trim();
        let inviteRecord: GoldenInvite | null = null;

        if (isGoldenInviteGateEnabled && !normalizedInvite) {
            setError('Informe um Convite Dourado.');
            return;
        }

        // Password Validation
        const strength = getPasswordStrength(password);
        if (strength.score < 3) {
            setError('A senha deve ter pelo menos 8 caracteres e incluir um nÃºmero ou caractere especial.');
            return;
        }

        const multiUseCodes = (GM_CONFIG.goldenInvites as any)?.multiUseCodes as string[] | undefined;
        const isMultiUseInvite = isGoldenInviteGateEnabled && (multiUseCodes || []).includes(normalizedInvite);

        if (isGoldenInviteGateEnabled) {
            console.log('Validando convite:', normalizedInvite);
            if (!isMultiUseInvite) {
                inviteRecord = await SupabaseService.getGoldenInviteByCode(normalizedInvite);
                console.log('Resultado da busca no DB:', inviteRecord);
                if (!inviteRecord) {
                    setError(`Convite Dourado "${normalizedInvite}" nÃ£o encontrado no banco de dados.`);
                    return;
                }
                if (inviteRecord.is_used) {
                    setError('Convite Dourado jÃ¡ utilizado.');
                    return;
                }
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
                if (isGoldenInviteGateEnabled && !isMultiUseInvite && inviteRecord) {
                    const consumed = await SupabaseService.consumeGoldenInvite(inviteRecord.id, data.user.id);
                    if (!consumed) {
                        setError('Convite Dourado jÃ¡ utilizado.');
                        await supabase.auth.signOut();
                        setLoading(false);
                        return;
                    }
                }
                // Criar perfil do usuÃ¡rio
                const newProfile: UserProfile = {
                    id: data.user.id,
                    username: email.split('@')[0],
                    email: data.user.email,
                    nickname: nickname || email.split('@')[0],
                    avatarUrl: `https://picsum.photos/seed/${data.user.id}/100/100`,
                    border: 'default',
                    level: 1,
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
                        banners: {},
                        glyphs: {},
                        auras: {},
                        orbs: {},
                        plates: {},
                        ornament: {},
                        insignias: {},
                        ui_skins: { 'BASIC': true },
                    },
                    completedSeasonMissions: [PROFILE_FLAG_TERMS_PENDING],
                    nobility: { exp: 0, rankId: 'vagante' },
                    wallet: { gold: 0, fragments: 0 },
                    mood: 50,
                    chests: [
                        { type: 'Comum', count: 1 },
                        { type: 'Skin Comum', count: 1 }
                    ],
                    inventory: [],
                    role: 'user',
                    isPremium: false
                };

                // Initialize unlocked items with Starter Kit
                newProfile.unlockedItems.hairStyles = {
                    'cachos': true,
                    'medio_reto': true,
                    'grunge_longo': true,
                    'textured_crop': true
                };
                newProfile.unlockedItems.orbs = {
                    'item_orb_1_002': true // Orbe de Cobre
                };
                newProfile.unlockedItems.plates = {
                    'item_plate_1_001': true // Placa Madeira
                };

                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .insert([{
                        id: newProfile.id,
                        email: newProfile.email,
                        nickname: newProfile.nickname,
                        app_mode: null,
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
            const identifier = email.trim();
            let emailForLogin = identifier;

            if (!identifier.includes('@')) {
                const { data: profileByNickname, error: nicknameLookupError } = await supabase
                    .from('user_profiles')
                    .select('email')
                    .ilike('nickname', identifier)
                    .limit(1)
                    .maybeSingle();

                if (nicknameLookupError) throw nicknameLookupError;
                if (!profileByNickname?.email) throw new Error('Nickname nï¿½o encontrado');

                emailForLogin = profileByNickname.email;
            }

            const { data, error } = await supabase.auth.signInWithPassword({ email: emailForLogin, password });

            if (error) throw error;

            if (data.user) {
                // Buscar perfil do usuÃ¡rio
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profile) {
                    const userProfileForState: UserProfile = {
                        id: profile.id,
                        email: profile.email,
                        appMode: profile.app_mode,
                        themePreference: profile.theme_preference,
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
                            codexes: {},
                            skins: {},
                            borders: {},
                            banners: {},
                            glyphs: {},
                            auras: {},
                            orbs: {},
                            plates: {},
                            ornament: {},
                            insignias: {},
                            ui_skins: {},
                        },
                        username: profile.username || profile.email?.split('@')[0] || 'anon',
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

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error: any) {
            setError(error.message || 'Erro no login com Google');
        } finally {
            setLoading(false);
        }
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
                // Criar conta admin se nÃ£o existir
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
                            body: 'body_masc_1',
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
                            banners: {},
                            glyphs: {},
                            auras: {},
                            orbs: {},
                            plates: {},
                            ornament: {},
                            insignias: {},
                            ui_skins: { 'GAME': true, 'BASIC': true },
                        },
                        username: 'admin',
                        completedSeasonMissions: [],
                        nobility: { exp: 999999, rankId: 'soberano' },
                        mood: 100,
                        chests: [
                            { type: 'Comum', count: 99 },
                            { type: 'Raro', count: 50 },
                            { type: 'Épico', count: 25 },
                            { type: 'Lendário', count: 10 }
                        ],
                        wallet: { gold: 0, fragments: 0 },
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
                            codexes: {},
                            skins: {},
                            borders: {},
                            banners: {},
                            glyphs: {},
                            auras: {},
                            orbs: {},
                            plates: {},
                            ornament: {},
                            insignias: {},
                            ui_skins: {},
                        },
                        username: profile.username || 'admin',
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

    const handleResetPassword = async () => {
        if (!email) {
            setError('Digite seu email para recuperar a senha.');
            return;
        }
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback`,
            });
            if (error) throw error;
            setMessage('Email de recuperaÃ§Ã£o enviado! Verifique sua caixa de entrada.');
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar email de recuperaÃ§Ã£o.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black animate-fade-in">
            <div className="w-full max-w-sm mx-auto text-center border border-[var(--skin-accent-color)]/50 rounded-2xl p-6 space-y-6 overflow-hidden bg-black/50 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.6)]">
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
                        type="text"
                        placeholder="Email ou Nickname"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] transition-colors placeholder-gray-500"
                    />
                    <div className="space-y-1">
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] transition-colors placeholder-gray-500"
                        />
                        {isSigningUp && password.length > 0 && (
                            <div className="px-1 py-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">ForÃ§a da Senha</span>
                                    <span className={`text-[10px] font-black tracking-widest uppercase ${getPasswordStrength(password).label === 'FORTE' ? 'text-green-500' : getPasswordStrength(password).label === 'MÃ‰DIA' ? 'text-yellow-500' : 'text-red-500'}`}>
                                        {getPasswordStrength(password).label}
                                    </span>
                                </div>
                                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden flex gap-1">
                                    <div className={`h-full transition-all duration-500 ${getPasswordStrength(password).score >= 1 ? getPasswordStrength(password).color : 'bg-transparent'}`} style={{ width: '33.33%' }} />
                                    <div className={`h-full transition-all duration-500 ${getPasswordStrength(password).score >= 2 ? getPasswordStrength(password).color : 'bg-transparent'}`} style={{ width: '33.33%' }} />
                                    <div className={`h-full transition-all duration-500 ${getPasswordStrength(password).score >= 3 ? getPasswordStrength(password).color : 'bg-transparent'}`} style={{ width: '33.33%' }} />
                                </div>
                            </div>
                        )}
                        {!isSigningUp && (
                            <div className="flex justify-end px-1">
                                <button
                                    onClick={handleResetPassword}
                                    className="text-[10px] font-bold text-white/40 hover:text-[var(--skin-accent-color)] transition-colors uppercase tracking-widest"
                                >
                                    Esqueci minha senha
                                </button>
                            </div>
                        )}
                    </div>
                    {isSigningUp && (
                        <input
                            type="text"
                            placeholder="Nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full px-4 py-3 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] transition-colors placeholder-gray-500"
                        />
                    )}
                    {isSigningUp && isGoldenInviteGateEnabled && (
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

                <div className="space-y-4">
                    <button
                        onClick={isSigningUp ? handleSignUp : handleLogin}
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl luxe-skin-button font-black text-sm transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-4 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            isSigningUp ? 'CRIAR PERFIL' : 'ENTRAR'
                        )}
                    </button>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition-all shadow-[0_4px_15px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span className="text-sm">
                                {isSigningUp ? 'Criar conta com Google' : 'Entrar com Google'}
                            </span>
                        </button>

                        <button
                            onClick={() => setIsSigningUp(!isSigningUp)}
                            className="w-full py-2 text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
                        >
                            {isSigningUp ? 'JÃ¡ tem uma conta? Entrar' : 'NÃ£o tem conta? Cadastrar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


