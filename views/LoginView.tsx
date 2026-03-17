import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { SupabaseService } from '../services/SupabaseService';
import { GoldenInvite, UserProfile } from '../types';
import {
    LEGAL_ACCEPT_SOURCE_INITIAL,
    LEGAL_PRIVACY_URL_PLACEHOLDER,
    LEGAL_PRIVACY_VERSION,
    LEGAL_TERMS_URL_PLACEHOLDER,
    LEGAL_TERMS_VERSION,
} from '../constants/legal';
import { clearClosedBetaGoogleRedirect, consumeClosedBetaGoogleRedirect } from '../utils/closedBetaAuth';
import { parseBooleanEnvFlag } from '../utils/envFlags';
import { getInstallPrompt, promptForInstall, startInstallPromptCapture, subscribeInstallPrompt } from '../utils/installPrompt';
import { signOutAndClearSupabaseSession } from '../utils/authSession';
import './login-ui.css';

const PROFILE_FLAG_TERMS_ACCEPTED = '__flag_terms_accepted_v1';

type ManualSignupDraft = {
    email: string;
    password: string;
    nickname: string;
};

export const LoginView: React.FC = () => {
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [manualEntryExpanded, setManualEntryExpanded] = useState(false);
    const [googleResumeMode, setGoogleResumeMode] = useState(false);
    const [googleResumeEmail, setGoogleResumeEmail] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [manualInviteCode, setManualInviteCode] = useState('');
    const [manualLegalAccepted, setManualLegalAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [goldenInviteGuide, setGoldenInviteGuide] = useState<{ title: string; text: string } | null>(null);
    const [installPromptAvailable, setInstallPromptAvailable] = useState(() => Boolean(getInstallPrompt()));
    const disableGoldInviteByEnv = parseBooleanEnvFlag(import.meta.env.VITE_DISABLE_GOLD_INVITE);
    const isGoldenInviteGateEnabled = !import.meta.env.DEV && !disableGoldInviteByEnv;

    React.useEffect(() => {
        startInstallPromptCapture();
        return subscribeInstallPrompt((prompt) => setInstallPromptAvailable(Boolean(prompt)));
    }, []);

    React.useEffect(() => {
        const redirectState = consumeClosedBetaGoogleRedirect();
        if (!redirectState) return;

        const isSignupRedirect = redirectState.mode === 'signup';
        const isBlockedGoogleRedirect = redirectState.message.toLowerCase().includes('nao pode entrar novamente');
        setIsSigningUp(isSignupRedirect);
        setManualEntryExpanded(isSignupRedirect);
        setGoogleResumeMode(!isSignupRedirect && !!redirectState.email && !isBlockedGoogleRedirect);
        setGoogleResumeEmail(!isSignupRedirect && !isBlockedGoogleRedirect ? (redirectState.email || '') : '');
        setEmail(isSignupRedirect ? (redirectState.email || '') : '');
        setPassword('');
        setNickname('');
        setManualInviteCode('');
        setManualLegalAccepted(false);
        setMessage(null);
        setError(redirectState.message);
        if (isSignupRedirect) {
            setGoldenInviteGuide({
                title: 'Conta nova detectada',
                text: 'Esse acesso ainda não tem conta no beta. Se vier pelo Google, o app vai pedir seu Bilhete Dourado logo depois da autenticação.',
            });
        } else if (redirectState.email) {
            setGoldenInviteGuide({
                title: 'Acesso com Google',
                text: 'Para entrar com Google no primeiro acesso, voce nao precisa preencher e-mail, nickname ou senha aqui. Ignore os campos abaixo, toque em Entrar com Google e valide o Bilhete Dourado no modal.',
            });
        }
    }, []);

    const findProfileAccess = async (identifier: string) => {
        const normalizedIdentifier = identifier.trim();
        if (!normalizedIdentifier) return null;

        if (normalizedIdentifier.includes('@')) {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('email, nickname')
                .ilike('email', normalizedIdentifier)
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            return data ?? null;
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .select('email, nickname')
            .ilike('nickname', normalizedIdentifier)
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data ?? null;
    };

    const getPasswordStrength = (pass: string) => {
        if (pass.length === 0) return { score: 0, label: '', color: 'bg-gray-800' };
        if (pass.length < 8) return { score: 1, label: 'RUIM', color: 'bg-red-500' };

        const hasNumber = /\d/.test(pass);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

        if (hasNumber || hasSpecial) return { score: 3, label: 'FORTE', color: 'bg-green-500' };
        return { score: 2, label: 'MÉDIA', color: 'bg-yellow-500' };
    };

    const isDeletedAccountBlocked = async (rawEmail: string) => {
        const normalizedEmail = rawEmail.trim();
        if (!normalizedEmail || !normalizedEmail.includes('@')) return false;

        const blockStatus = await SupabaseService.getDeletedAccountBlockStatus(normalizedEmail);
        return !!blockStatus?.blocked;
    };

    const validateManualSignupDraft = async (draft: ManualSignupDraft) => {
        const normalizedEmail = draft.email.trim();

        if (!normalizedEmail) {
            return 'Digite seu e-mail.';
        }

        if (await isDeletedAccountBlocked(normalizedEmail)) {
            return 'Essa conta foi excluida e nao pode criar um novo acesso com este e-mail.';
        }

        if (isGoldenInviteGateEnabled && !manualInviteCode.trim()) {
            return 'Informe seu Bilhete Dourado.';
        }

        const strength = getPasswordStrength(draft.password);
        if (strength.score < 3) {
            return 'A senha deve ter pelo menos 8 caracteres e incluir um numero ou caractere especial.';
        }

        if (!manualLegalAccepted) {
            return 'Aceite os Termos e a Privacidade para criar a conta.';
        }

        return null;
    };

    const handleSignUp = async (
        draft: ManualSignupDraft,
        inviteCode?: string,
    ) => {
        const normalizedInvite = inviteCode?.trim() || '';
        const acceptedAt = new Date().toISOString();
        let inviteRecord: GoldenInvite | null = null;

        if (isGoldenInviteGateEnabled && !normalizedInvite) {
            return { success: false, error: 'Informe um Convite Dourado.' };
        }

        if (isGoldenInviteGateEnabled) {
            inviteRecord = await SupabaseService.checkGoldenInvite(normalizedInvite);
            if (!inviteRecord) {
                return { success: false, error: `Convite Dourado "${normalizedInvite}" nao encontrado no banco de dados.` };
            }
            if (inviteRecord.is_used) {
                return { success: false, error: 'Convite Dourado ja utilizado.' };
            }
        }
        setLoading(true);
        setError(null);
        setMessage(null);
        setGoldenInviteGuide(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: draft.email,
                password: draft.password,
                options: {
                    data: {
                        nickname: draft.nickname || draft.email.split('@')[0]
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                if (isGoldenInviteGateEnabled && inviteRecord) {
                    const consumeResult = await SupabaseService.consumeGoldenInviteCodeDetailed(normalizedInvite, data.user.id);
                    if (!consumeResult.success) {
                        const consumeError = SupabaseService.describeGoldenInviteConsumeError(consumeResult.error);
                        setError(consumeError);
                        await signOutAndClearSupabaseSession('local');
                        setLoading(false);
                        return { success: false, error: consumeError };
                    }
                }
                // Criar perfil do usuário
                const newProfile: UserProfile = {
                    id: data.user.id,
                    username: draft.email.split('@')[0],
                    email: data.user.email,
                    nickname: draft.nickname || draft.email.split('@')[0],
                    avatarUrl: '',
                    border: 'default',
                    level: 1,
                    backgroundUrl: '',
                    isOnline: true,
                    visibleWidgets: ['consciencia.lema'],
                    assetsVisibility: 'nobody',
                    masteryVisibility: 'friends',
                    skin: 'BASIC',
                    unlockedSkins: { BASIC: true },
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
                    completedSeasonMissions: [PROFILE_FLAG_TERMS_ACCEPTED],
                    termsVersion: LEGAL_TERMS_VERSION,
                    termsAcceptedAt: acceptedAt,
                    termsAcceptSource: LEGAL_ACCEPT_SOURCE_INITIAL,
                    privacyVersion: LEGAL_PRIVACY_VERSION,
                    privacyAcceptedAt: acceptedAt,
                    privacyAcceptSource: LEGAL_ACCEPT_SOURCE_INITIAL,
                    nobility: { exp: 0, rankId: 'vagante' },
                    wallet: { gold: 0, fragments: 0 },
                    mood: 50,
                    chests: [],
                    inventory: [],
                    role: 'user',
                    isPremium: false,
                    starterRewardsPending: true,
                    vanguardWelcomePending: false,
                    vanguardWelcomePayload: null,
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
                        terms_version: newProfile.termsVersion,
                        terms_accepted_at: newProfile.termsAcceptedAt,
                        terms_accept_source: newProfile.termsAcceptSource,
                        privacy_version: newProfile.privacyVersion,
                        privacy_accepted_at: newProfile.privacyAcceptedAt,
                        privacy_accept_source: newProfile.privacyAcceptSource,
                        avatar_url: newProfile.avatarUrl,
                        border: newProfile.border,
                        level: newProfile.level,
                        background_url: newProfile.backgroundUrl,
                        is_online: newProfile.isOnline,
                        visible_widgets: newProfile.visibleWidgets,
                        assets_visibility: newProfile.assetsVisibility,
                        mastery_visibility: newProfile.masteryVisibility,
                        skin: newProfile.skin,
                        unlocked_skins: newProfile.unlockedSkins,
                        unlocked_items: newProfile.unlockedItems,
                        completed_season_missions: newProfile.completedSeasonMissions,
                        nobility: newProfile.nobility,
                        wallet: newProfile.wallet,
                        mood: newProfile.mood,
                        chests: newProfile.chests,
                        starter_rewards_pending: newProfile.starterRewardsPending ?? true,
                        vanguard_welcome_pending: newProfile.vanguardWelcomePending ?? false,
                        vanguard_welcome_payload: newProfile.vanguardWelcomePayload ?? {},
                        role: newProfile.role,
                        is_premium: newProfile.isPremium ?? false,
                    }]);

                if (profileError) throw profileError;

                let sessionReady = Boolean(data.session);

                if (!sessionReady) {
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email: draft.email,
                        password: draft.password,
                    });

                    if (!signInError && signInData.session) {
                        sessionReady = true;
                    } else if (signInError && /email.*confirm|confirm.*email|not confirmed/i.test(signInError.message || '')) {
                        setError('A conta foi criada, mas o Supabase ainda esta exigindo confirmacao de e-mail para login manual. Se quiser, eu te digo exatamente o que desligar no painel Auth para isso parar agora.');
                        setLoading(false);
                        return {
                            success: false,
                            error: signInError.message,
                        };
                    }
                }

                const finalizeSuccess = () => {
                    setMessage(sessionReady
                        ? 'Conta criada. Seu acesso ao beta foi liberado.'
                        : 'Conta criada. O bilhete foi aceito e o acesso ficou registrado.'
                    );
                    setIsSigningUp(false);
                    setManualEntryExpanded(false);
                    setManualInviteCode('');
                    setManualLegalAccepted(false);
                    setPassword('');
                };

                finalizeSuccess();
            }
        } catch (error: any) {
            const signupError = error.message || 'Erro no cadastro';
            setError(signupError);
            setLoading(false);
            return { success: false, error: signupError };
        }

        setLoading(false);
        return { success: true };
    };

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        setGoldenInviteGuide(null);

        try {
            const identifier = email.trim();

            if (await isDeletedAccountBlocked(identifier)) {
                setError('Essa conta foi excluida e nao pode entrar novamente com este e-mail.');
                setLoading(false);
                return;
            }

            const matchedProfile = await findProfileAccess(identifier);

            if (!matchedProfile?.email) {
                setIsSigningUp(true);
                setManualEntryExpanded(true);
                setPassword('');
                setError('Essa conta ainda não existe. Crie sua conta e informe o Convite Dourado primeiro.');
                setGoldenInviteGuide({
                    title: 'Primeiro acesso ao beta',
                    text: 'Voce pode criar a conta com Convite Dourado ou, se preferir, ignorar os campos abaixo e tocar em Entrar com Google. Nesse caso, o Bilhete Dourado sera pedido depois da autenticacao.',
                });
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.signInWithPassword({ email: matchedProfile.email, password });

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
                }
            }
        } catch (error: any) {
            setError(error.message || 'Erro no login');
        }

        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        clearClosedBetaGoogleRedirect();
        setLoading(true);
        setError(null);
        setMessage(null);
        setGoldenInviteGuide(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: window.location.href
                }
            });
            if (error) throw error;
        } catch (error: any) {
            setError(error.message || 'Erro no login com Google');
        } finally {
            setLoading(false);
        }
    };

    const handlePrimarySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (loading) return;

        if (isSigningUp) {
            const draft: ManualSignupDraft = {
                email: email.trim(),
                password,
                nickname: nickname.trim(),
            };
            const validationError = await validateManualSignupDraft(draft);
            if (validationError) {
                setError(validationError);
                return;
            }

            await handleSignUp(draft, manualInviteCode.trim());
            return;
        }

        await handleLogin();
    };

    const handleInstallApp = async () => {
        try {
            await promptForInstall();
        } catch (installError: any) {
            setError(installError?.message || 'Não foi possível abrir a instalação do app agora.');
        }
    };

    const clearForm = () => {
        setEmail('');
        setPassword('');
        setNickname('');
        setError(null);
        setMessage(null);
        setGoldenInviteGuide(null);
        setGoogleResumeMode(false);
        setGoogleResumeEmail('');
        setManualEntryExpanded(false);
        setManualInviteCode('');
        setManualLegalAccepted(false);
    };

    const showManualFields = !googleResumeMode && manualEntryExpanded;

    const openManualMode = (nextMode: 'login' | 'signup' = 'login') => {
        setGoogleResumeMode(false);
        setGoogleResumeEmail('');
        setError(null);
        setMessage(null);
        setGoldenInviteGuide(null);
        setManualEntryExpanded(true);
        setManualInviteCode('');
        setManualLegalAccepted(false);
        setIsSigningUp(nextMode === 'signup');
    };

    const handleResetPassword = async () => {
        if (!email) {
            setError('Digite seu e-mail para recuperar a senha.');
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
            setMessage('E-mail de recuperação enviado. Verifique sua caixa de entrada.');
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar e-mail de recuperação.');
        } finally {
            setLoading(false);
        }
    };

    const compactGuideTitle = googleResumeMode ? 'Google conectado' : goldenInviteGuide?.title;
    const compactGuideText = googleResumeMode
        ? `Falta validar o Bilhete Dourado para ${googleResumeEmail || 'essa conta'}.`
        : goldenInviteGuide?.text ?? null;

    return (
        <div className="login-shell animate-fade-in">
            <div className="login-card">
                {installPromptAvailable && (
                    <button
                        id="login-install-button"
                        onClick={handleInstallApp}
                        disabled={loading}
                        className="login-install-fab"
                        aria-label="Instalar app"
                        title="Instalar app"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 4V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M8 10L12 14L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5 18H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                )}
                <div className="login-content">
                    <div className="login-hero">
                        <span className="login-kicker">Beta fechado</span>
                        <div className="login-logo-stage">
                            <div className="login-logo-halo" />
                            <div className="login-logo-plasma" />
                            <img
                                src="/logo-diamond.png"
                                alt="GLYPH"
                                className="login-logo-diamond"
                            />
                            <div className="login-logo-core-ring">
                                <img
                                    src="/logo-core.png"
                                    alt="GLYPH Core"
                                />
                            </div>
                        </div>
                        <h1 className="login-title luxe-title-ornate">
                            GLYPH
                        </h1>
                        <p className="login-subtitle">
                            Google e o caminho mais rapido. Se preferir, crie sua conta com e-mail e bilhete.
                        </p>
                    </div>

                    {(compactGuideTitle && compactGuideText && !showManualFields) && (
                        <div className="login-status-strip login-status-strip--accent">
                            <div className="login-status-strip__header">
                                <span className="login-status-strip__title">{compactGuideTitle}</span>
                                {googleResumeEmail && <span className="login-status-strip__meta">{googleResumeEmail}</span>}
                            </div>
                            <p className="login-status-strip__text">{compactGuideText}</p>
                        </div>
                    )}

                    {error && (
                        <div className="login-status-strip login-status-strip--error">
                            <p className="login-status-strip__text">{error}</p>
                        </div>
                    )}
                    {message && (
                        <div className="login-status-strip login-status-strip--success">
                            <p className="login-status-strip__text">{message}</p>
                        </div>
                    )}

                    <form className="login-form" onSubmit={handlePrimarySubmit}>
                        <button
                            id="login-google-button"
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="login-google-button"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span className="text-sm">Entrar com Google</span>
                        </button>

                        {!showManualFields && (
                            <button
                                id="login-show-manual-button"
                                type="button"
                                onClick={() => openManualMode('signup')}
                                className="login-bridge-link"
                            >
                                Criar conta com e-mail
                            </button>
                        )}

                        {showManualFields && (
                            <div className="login-email-panel">
                                <div className="login-email-tabs" role="tablist" aria-label="Modo de acesso manual">
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={!isSigningUp}
                                        onClick={() => setIsSigningUp(false)}
                                        className={`login-email-tab ${!isSigningUp ? 'is-active' : ''}`}
                                    >
                                        Entrar
                                    </button>
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={isSigningUp}
                                        onClick={() => setIsSigningUp(true)}
                                        className={`login-email-tab ${isSigningUp ? 'is-active' : ''}`}
                                    >
                                        Criar conta
                                    </button>
                                </div>

                                <div className="login-email-fields">
                                    <input
                                        id="login-email-input"
                                        type="text"
                                        autoComplete={isSigningUp ? 'email' : 'username'}
                                        placeholder={isSigningUp ? 'E-mail' : 'E-mail ou nickname'}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="login-field"
                                    />

                                    {isSigningUp && (
                                        <input
                                            id="login-nickname-input"
                                            type="text"
                                            autoComplete="nickname"
                                            placeholder="Nickname"
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            className="login-field"
                                        />
                                    )}

                                    <div className="space-y-1">
                                        <input
                                            id="login-password-input"
                                            type="password"
                                            autoComplete={isSigningUp ? 'new-password' : 'current-password'}
                                            placeholder="Senha"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="login-field"
                                        />
                                        {!isSigningUp && (
                                            <div className="flex justify-end px-1">
                                                <button
                                                    type="button"
                                                    onClick={handleResetPassword}
                                                    className="login-forgot-link"
                                                >
                                                    Esqueci minha senha
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {isSigningUp && password.length > 0 && (
                                        <div className="login-password-meter">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Força da senha</span>
                                                <span className={`text-[10px] font-black tracking-widest uppercase ${getPasswordStrength(password).label === 'FORTE' ? 'text-green-500' : getPasswordStrength(password).label === 'MÉDIA' ? 'text-yellow-500' : 'text-red-500'}`}>
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

                                    {isSigningUp && isGoldenInviteGateEnabled && (
                                        <input
                                            id="login-invite-input"
                                            type="text"
                                            autoComplete="off"
                                            placeholder="Bilhete Dourado"
                                            value={manualInviteCode}
                                            onChange={(e) => setManualInviteCode(e.target.value)}
                                            className="login-field"
                                        />
                                    )}

                                    {isSigningUp && (
                                        <label className="login-consent">
                                            <input
                                                id="login-terms-checkbox"
                                                type="checkbox"
                                                checked={manualLegalAccepted}
                                                onChange={(e) => setManualLegalAccepted(e.target.checked)}
                                            />
                                            <span>Li e aceito os <a href={LEGAL_TERMS_URL_PLACEHOLDER} target="_blank" rel="noopener noreferrer">Termos</a> e a <a href={LEGAL_PRIVACY_URL_PLACEHOLDER} target="_blank" rel="noopener noreferrer">Politica de Privacidade</a>.</span>
                                        </label>
                                    )}

                                    {isSigningUp && (
                                        <p className="login-manual-hint">
                                            Cadastro manual do beta: e-mail, nickname, senha, bilhete e aceite na mesma etapa.
                                        </p>
                                    )}
                                </div>

                                <div className="login-email-actions">
                                    <button
                                        id="login-submit-button"
                                        type="submit"
                                        disabled={loading}
                                        className="login-primary-button luxe-skin-button flex items-center justify-center gap-2 text-sm font-black transition-all"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-4 border-black/30 border-t-black rounded-full animate-spin" />
                                        ) : (
                                            isSigningUp ? 'Criar conta' : 'Entrar com e-mail'
                                        )}
                                    </button>
                                    <button
                                        id="login-hide-manual-button"
                                        type="button"
                                        onClick={clearForm}
                                        className="login-secondary-link"
                                    >
                                        Voltar ao Google
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="login-legal">
                            <a
                                href={LEGAL_TERMS_URL_PLACEHOLDER}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-colors hover:text-[var(--skin-accent-color)]"
                            >
                                Termos
                            </a>
                            <span className="text-white/20">•</span>
                            <a
                                href={LEGAL_PRIVACY_URL_PLACEHOLDER}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-colors hover:text-[var(--skin-accent-color)]"
                            >
                                Privacidade
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
