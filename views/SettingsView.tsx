import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useGame, STORAGE_KEY_PROFILE, STORAGE_KEY_ASSET_LEVELS, getLocalDateString, PROFILE_FLAG_TERMS_ACCEPTED, PROFILE_FLAG_TUTORIAL_COMPLETED } from '../contexts/GameContext';
import { useTutorial } from '../contexts/TutorialContext';
import { GM_CONFIG, SKINS_DATA } from '../constants';
import { GOLD_PLATINUM_PRODUCT, GOLD_PREMIUM_PRODUCT } from '../constants/goldCatalog';
import { SovereignConfig, RelationshipLink, RelationshipLinkInvite, LinkNotificationType, UserProfile, ProfileVisibilityScope, Arena, Action, ScheduledTask } from '../types';
import { ChevronRightIcon, XIcon, LightbulbIcon, ClockIcon, TrashIcon, CheckIcon, SendIcon, CrownIcon } from '../components/Icons';
import { GlassCard } from '../components/GlassCard';
import { CodexLibrary } from '../components/CodexLibrary';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { OracleSettingsModal } from '../components/OracleSettingsModal';
import { BillingCheckoutGate } from '../components/Store/BillingCheckoutGate';
import { supabase } from '../supabaseClient';
import { SpectatorArenaModal } from '../components/SpectatorArenaModal';
import { CODEXES, getCatalogItemsByCategory } from '../constants/items';
import { Portal } from '../components/Portal';
import { SupabaseService } from '../services/SupabaseService';
import { RelationshipHubModal } from '../components/RelationshipHubModal';
import { LEGAL_PRIVACY_URL_PLACEHOLDER, LEGAL_TERMS_URL_PLACEHOLDER } from '../constants/legal';
import { TUTORIAL_SECTIONS } from '../constants/tutorialSteps';
import { clearSupabaseSessionStorage, signOutAndClearSupabaseSession } from '../utils/authSession';
import { getActiveSubscriptionTier, getPremiumDaysRemaining, hasPlatinumAccess, hasPremiumAccess } from '../utils/premiumAccess';
import { getMoneyCheckoutSalesCopy } from '../utils/billingRuntime';
import { buildUiSkinTokens, resolveUiSkinId } from '../utils/uiSkinTokens';
import {
    SCREEN_INTRO_TIP_CONTEXT_EVENT,
    SCREEN_INTRO_TIP_LIST,
    SCREEN_INTRO_TIPS_SETTINGS_CHANGED_EVENT,
    areScreenIntroTipsEnabled,
    setScreenIntroTipsEnabled,
    type ScreenIntroTipId,
} from '../utils/screenIntroTips';
import { CodexCoverArt as SharedCodexCoverArt } from '../components/CodexCoverArt';
import './settings-ui.css';

const OracleChat = lazy(() =>
    import('../components/OracleChat').then((module) => ({ default: module.OracleChat }))
);
const MasteryView = lazy(() =>
    import('./MasteryView').then((module) => ({ default: module.MasteryView }))
);
const SovereignCustomizer = lazy(() =>
    import('../components/SovereignCustomizer').then((module) => ({ default: module.SovereignCustomizer }))
);

const GOLD_SYMBOL = '\u{1FA99}';
const SovereignPanelView = lazy(() =>
    import('./SovereignPanelView').then((module) => ({ default: module.SovereignPanelView }))
);
const NewArenaModal = lazy(() =>
    import('../components/NewArenaModal').then((module) => ({ default: module.NewArenaModal }))
);
const CodexModal = lazy(() =>
    import('../components/CodexModal').then((module) => ({ default: module.CodexModal }))
);
const CampaignsCodex = lazy(() =>
    import('../components/CampaignsCodex').then((module) => ({ default: module.CampaignsCodex }))
);
const AssetDecagon = lazy(() =>
    import('../components/AssetDecagon').then((module) => ({ default: module.AssetDecagon }))
);

type SettingsTab = 'Geral' | 'Preferências' | 'Premium' | 'Temporada';
type NotificationMode = 'Silencioso' | 'Reflexivo' | 'Essencial' | 'Militar';
type ProfileVisibilityOption = ProfileVisibilityScope;
type UiSettingsSkinOption = { id: string; name: string };

const splitBenefitsIntoColumns = (benefits: readonly string[]) => {
    const midpoint = Math.ceil(benefits.length / 2);
    return [benefits.slice(0, midpoint), benefits.slice(midpoint)];
};
const formatBrl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const BASIC_MEMBERSHIP_BENEFIT_LIMIT = 4;

const UI_SKIN_SELECTOR_ORDER = ['BASIC', 'GOLD', 'FROST', 'EMBER', 'CYBER', 'AURORA', 'VOID', 'GENESIS', 'item_theme_nebulosa'] as const;
const UI_SKIN_SELECTOR_META: Record<string, { label: string; title: string; previewSkinId?: string; prefersLightText?: boolean; }> = {
    BASIC: { label: 'BÁSICO', title: 'Básico Profissional' },
    GOLD: { label: 'OURO', title: 'Ouro Soberano' },
    FROST: { label: 'GELO', title: 'Gelo Eterno' },
    EMBER: { label: 'CHAMA', title: 'Chama Viva', prefersLightText: true },
    CYBER: { label: 'CYBER', title: 'Cyberpunk', prefersLightText: true },
    AURORA: { label: 'AURORA', title: 'Aurora Boreal', prefersLightText: true },
    VOID: { label: 'VAZIO', title: 'Vazio Primordial', prefersLightText: true },
    GENESIS: { label: 'GÊNESIS', title: 'Gênesis', prefersLightText: true },
    item_theme_nebulosa: { label: 'NEBULOSA', title: 'Nebulosa Astral', prefersLightText: true },
};

const notificationModes: { id: NotificationMode, name: string, icon: string, description: string }[] = [
    { id: 'Silencioso', name: 'O Monge', icon: '🧘', description: "Nenhuma notificação será enviada. O sistema aguarda sua busca ativa." },
    { id: 'Reflexivo', name: 'O Estoico', icon: '⚖️', description: "Um resumo diário com seu score e ações restantes é enviado à noite." },
    { id: 'Essencial', name: 'O Executivo', icon: '👔', description: "Apenas alertas para compromissos com horário fixo." },
    { id: 'Militar', name: 'O Soldado', icon: '⚔️', description: "Modo ativo com lembretes para planejar, executar e revisar seu dia." },
];

const NotificationCard: React.FC<{ icon: React.ReactNode, title: string, time?: string, message: string, fixedAtTop?: boolean, stackIndex?: number }> = ({ icon, title, time, message, fixedAtTop = true, stackIndex = 0 }) => {
    const topClasses = ['top-[88px]', 'top-[168px]', 'top-[248px]'];
    const topClass = topClasses[Math.max(0, Math.min(stackIndex, topClasses.length - 1))];
    const fixedClasses = fixedAtTop ? `fixed left-1/2 -translate-x-1/2 z-[90] w-[min(360px,92vw)] ${topClass}` : '';

    return (
        <GlassCard variant="neutral" className={`p-3 animate-fade-in ${fixedClasses}`}>
            <div className="flex items-start space-x-3">
                <div className="mt-1">{icon}</div>
                <div className="flex-grow">
                    <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-sm text-white">{title}</h4>
                        {time && <p className="text-xs text-gray-400">{time}</p>}
                    </div>
                    <p className="text-sm text-gray-300">{message}</p>
                </div>
                <button className="p-1 text-gray-500 hover:text-white"><XIcon className="w-4 h-4" /></button>
            </div>
        </GlassCard>
    );
};

const NotificationSettingsModal: React.FC<{ currentMode: NotificationMode, onSave: (mode: NotificationMode) => void, onClose: () => void }> = ({ currentMode, onSave, onClose }) => {
    const [selectedMode, setSelectedMode] = useState<NotificationMode>(currentMode);

    const handleSave = () => { onSave(selectedMode); onClose(); };

    const renderPreview = () => {
        switch (selectedMode) {
            case 'Silencioso': return (<div className="text-center text-gray-400 space-y-2 p-4"><svg viewBox="0 0 100 20" className="w-24 mx-auto"><path d="M 0 10 Q 25 10, 50 10 T 100 10" stroke="currentColor" strokeWidth="2" fill="none" /></svg><p className="text-sm">{notificationModes.find(m => m.id === 'Silencioso')?.description}</p></div>);
            case 'Reflexivo': return (<NotificationCard icon={<ClockIcon className="w-5 h-5 accent-text" />} title="O Boletim Diário" time="20:00" message="Score: 85 | Ações restantes: 2. 'A felicidade da sua vida depende da qualidade dos seus pensamentos.'" fixedAtTop stackIndex={0} />);
            case 'Essencial': return (<NotificationCard icon={<ClockIcon className="w-5 h-5 text-blue-400" />} title="Alerta de Compromisso" time="12:00" message="Reunião de Alinhamento em 2h." fixedAtTop stackIndex={0} />);
            case 'Militar': return (
                <>
                    <NotificationCard icon={<LightbulbIcon className="w-5 h-5 text-green-400" />} title="Alvorada (Planning)" time="08:00" message="Inicie o Planejamento Tático. Verifique o Grid ou o Painel Diário." fixedAtTop stackIndex={0} />
                    <NotificationCard icon={<ClockIcon className="w-5 h-5 text-orange-400" />} title="Radar de Batalha" time="09:00" message="Próxima ação: Treino de Força (11:00). Prepare-se." fixedAtTop stackIndex={1} />
                    <NotificationCard icon={<ClockIcon className="w-5 h-5 accent-text" />} title="O Boletim Diário" time="20:00" message="Score: 85 | Ações restantes: 2." fixedAtTop stackIndex={2} />
                </>
            );
            default: return null;
        }
    };

    return (
        <Portal>
            <div className="settings-overlay-shell animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-center">Configurar Notificações</h2>
                    <div className="grid grid-cols-2 gap-2">
                        {notificationModes.map(mode => (<button key={mode.id} onClick={() => setSelectedMode(mode.id)} className={`p-3 rounded-xl transition-colors text-center ${selectedMode === mode.id ? 'bg-white/20 ring-2 ring-white/30' : 'bg-black/20 hover:bg-white/10'}`}><span className="text-2xl">{mode.icon}</span><p className="text-sm font-bold">{mode.name}</p></button>))}
                    </div>
                    <div className="settings-panel-card settings-preview-surface">{renderPreview()}</div>
                    <button onClick={handleSave} className="w-full py-2 rounded-xl luxe-skin-button">SALVAR</button>
                </GlassCard>
            </div>
        </Portal>
    );
};

const SettingSelector: React.FC<{ label: string; value: string; onClick: () => void; }> = ({ label, value, onClick }) => (
    <div className="settings-panel-card">
        <div className="flex justify-between items-center">
            <label className="text-sm font-semibold">{label}</label>
            <button
                onClick={onClick}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--skin-accent-color)]/25 bg-[var(--skin-accent-color)]/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[var(--ui-text-accent)] transition-all hover:bg-[var(--skin-accent-color)]/16 hover:border-[var(--skin-accent-color)]/38"
            >
                <span>{value}</span>
                <ChevronRightIcon className="w-4 h-4" />
            </button>
        </div>
    </div>
);

const PreferenceToggleChip: React.FC<{
    label: string;
    enabled: boolean;
    onClick: () => void;
    lightTheme?: boolean;
}> = ({ label, enabled, onClick, lightTheme = false }) => {
    const className = lightTheme
        ? `inline-flex min-w-0 items-center justify-between gap-2 rounded-full border px-2.5 py-2.5 text-[10px] font-black uppercase tracking-[0.05em] transition-all ${
            enabled
                ? 'border-slate-800/18 bg-white/90 text-slate-950 shadow-[0_10px_22px_rgba(43,53,69,0.16)]'
                : 'border-slate-700/16 bg-white/78 text-slate-900 hover:bg-white/90'
        }`
        : `inline-flex min-w-0 items-center justify-between gap-2 rounded-full border px-2.5 py-2 text-[9px] font-black uppercase tracking-[0.14em] transition-all ${
            enabled
                ? 'border-[var(--skin-accent-color)]/35 bg-[var(--skin-accent-color)]/12 text-[var(--ui-text-accent)]'
                : 'border-white/10 bg-black/20 text-gray-400 hover:bg-white/5 hover:text-white'
        }`;

    const style = lightTheme
        ? enabled
            ? {
                background: 'color-mix(in srgb, var(--skin-accent-color) 24%, rgba(255,255,255,0.94))',
                borderColor: 'color-mix(in srgb, var(--skin-accent-color) 38%, rgba(30,41,59,0.16))',
                color: '#20160f',
            }
            : {
                background: 'rgba(255,255,255,0.8)',
                borderColor: 'rgba(71,85,105,0.14)',
                color: '#231a13',
            }
        : undefined;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={enabled}
            className={className}
            style={style}
        >
            <span className="truncate">{label}</span>
            <span className={`h-2.5 w-2.5 rounded-full ${enabled ? 'bg-[var(--skin-accent-color)] shadow-[0_0_8px_var(--sephirot-glow-color)]' : lightTheme ? 'bg-slate-500/25' : 'bg-white/15'}`} />
        </button>
    );
};

const VISIBILITY_OPTIONS: { value: ProfileVisibilityOption; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'friends', label: 'Amigos' },
    { value: 'nobody', label: 'Ninguem' },
];

const VisibilityScopeControl: React.FC<{
    label: string;
    value: ProfileVisibilityOption;
    onChange: (value: ProfileVisibilityOption) => void;
}> = ({ label, value, onChange }) => (
    <div className="space-y-1.5">
        <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{label}</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{VISIBILITY_OPTIONS.find(opt => opt.value === value)?.label || 'Todos'}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
            {VISIBILITY_OPTIONS.map(option => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${value === option.value
                        ? 'bg-[var(--skin-accent-color)]/18 border-[var(--skin-accent-color)] text-white'
                        : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    </div>
);

const PrivacyPreferencesModal: React.FC<{
    open: boolean;
    termsStatus: string;
    assetsVisibility: ProfileVisibilityOption;
    masteryVisibility: ProfileVisibilityOption;
    featsVisibility: ProfileVisibilityOption;
    gardenVisibility: ProfileVisibilityOption;
    onAssetsVisibilityChange: (value: ProfileVisibilityOption) => void;
    onMasteryVisibilityChange: (value: ProfileVisibilityOption) => void;
    onFeatsVisibilityChange: (value: ProfileVisibilityOption) => void;
    onGardenVisibilityChange: (value: ProfileVisibilityOption) => void;
    onClose: () => void;
}> = ({
    open,
    termsStatus,
    assetsVisibility,
    masteryVisibility,
    featsVisibility,
    gardenVisibility,
    onAssetsVisibilityChange,
    onMasteryVisibilityChange,
    onFeatsVisibilityChange,
    onGardenVisibilityChange,
    onClose,
}) => {
    if (!open) return null;

    const legalRows = [
        'Conta e perfil: usamos o minimo para autenticacao, sincronizacao e seguranca.',
        'Social e uploads: o que voce compartilhar pode aparecer para vinculos, grupos e links.',
        'Compras e exclusao: pagamentos passam por parceiro e a conta pode ser apagada sob solicitacao.',
    ];

    return (
        <Portal>
            <div className="settings-overlay-shell animate-fade-in" onClick={onClose}>
                <GlassCard
                    variant="neutral"
                    className="w-full max-w-md m-4 space-y-4 rounded-3xl"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Privacidade</div>
                            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Pacto e visibilidade</h2>
                            <p className="text-xs leading-relaxed text-gray-400">Revise o pacto do jogo e controle o que os outros conseguem ver.</p>
                        </div>
                        <button onClick={onClose} className="rounded-full border border-white/10 bg-black/20 p-2 text-gray-400 transition-colors hover:text-white">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="settings-panel-card space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Pacto do jogo</div>
                                <div className="mt-1 text-sm font-semibold text-white">Resumo legal do GLYPH</div>
                            </div>
                            <div className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${termsStatus === 'Aceito' ? 'border-emerald-400/30 bg-emerald-500/12 text-emerald-200' : 'border-amber-400/30 bg-amber-500/12 text-amber-100'}`}>
                                {termsStatus}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {legalRows.map((row) => (
                                <div key={row} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-[11px] leading-relaxed text-gray-300">
                                    {row}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <a
                                href={LEGAL_TERMS_URL_PLACEHOLDER}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-gray-200 transition-colors hover:bg-black/30"
                            >
                                Termos completos
                            </a>
                            <a
                                href={LEGAL_PRIVACY_URL_PLACEHOLDER}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-gray-200 transition-colors hover:bg-black/30"
                            >
                                Privacidade completa
                            </a>
                        </div>
                    </div>

                    <div className="settings-panel-card space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Visibilidade do perfil</div>
                                <div className="text-[11px] text-gray-500">Widgets seguem a visibilidade dos ativos; arenas ficam no controle proprio abaixo.</div>
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">So afeta o que outros veem</div>
                        </div>
                        <VisibilityScopeControl
                            label="Ativos e widgets"
                            value={assetsVisibility}
                            onChange={onAssetsVisibilityChange}
                        />
                        <VisibilityScopeControl
                            label="Arvore de maestria"
                            value={masteryVisibility}
                            onChange={onMasteryVisibilityChange}
                        />
                        <VisibilityScopeControl
                            label="Arenas do ativo"
                            value={featsVisibility}
                            onChange={onFeatsVisibilityChange}
                        />
                        <VisibilityScopeControl
                            label="Mostrar meu jardim"
                            value={gardenVisibility}
                            onChange={onGardenVisibilityChange}
                        />
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};

const UiPreferencesModal: React.FC<{
    open: boolean;
    appMode: 'BASIC' | 'GAME';
    activeTheme: 'LIGHT' | 'DARK';
    toggleTheme: () => void;
    uiSkinCatalog: UiSettingsSkinOption[];
    unlockedUiSkinIds: Set<string>;
    effectiveUiSkinId: string;
    oraclePreferences: { animationsEnabled?: boolean; soundsEnabled?: boolean; hapticsEnabled?: boolean } | null | undefined;
    updateOraclePreferences: (updates: Partial<{ animationsEnabled: boolean; soundsEnabled: boolean; hapticsEnabled: boolean }>) => void;
    onUiSkinOptionClick: (skinId: string, unlocked: boolean, disabledByMode: boolean) => void;
    onClose: () => void;
}> = ({
    open,
    appMode,
    activeTheme,
    toggleTheme,
    uiSkinCatalog,
    unlockedUiSkinIds,
    effectiveUiSkinId,
    oraclePreferences,
    updateOraclePreferences,
    onUiSkinOptionClick,
    onClose,
}) => {
    if (!open) return null;
    const isLightTheme = activeTheme === 'LIGHT';

    return (
        <Portal>
            <div className="settings-overlay-shell animate-fade-in" onClick={onClose}>
                <GlassCard
                    variant="neutral"
                    className="w-full max-w-md m-4 space-y-4 rounded-3xl"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Interface</div>
                            <h2 className="text-base font-black uppercase tracking-[0.14em]">Skins, tema e feedback</h2>
                        </div>
                        <button onClick={onClose} className="rounded-full border border-white/10 bg-black/20 p-2 text-white/70 transition-colors hover:bg-black/35 hover:text-white">
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="settings-panel-card space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Skins UI</div>
                                <div className="text-[11px] text-gray-500">No modo básico, a interface fica fixa no corte essencial.</div>
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
                                {appMode === 'BASIC' ? 'Básico fixo' : 'Tema livre'}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {uiSkinCatalog.map((skin) => {
                                const skinMeta: { label: string; title: string; previewSkinId?: string; prefersLightText?: boolean; } = UI_SKIN_SELECTOR_META[skin.id] || {
                                    label: skin.name.replace(/^Tema:\s*/i, '').replace(/^Interface\s*/i, '').toUpperCase(),
                                    title: skin.name,
                                };
                                const unlocked = unlockedUiSkinIds.has(skin.id);
                                const selected = effectiveUiSkinId === skin.id;
                                const disabledByMode = appMode === 'BASIC' && skin.id !== 'BASIC';
                                const previewSkinId = skinMeta.previewSkinId || resolveUiSkinId(skin.id);
                                const previewTokens = buildUiSkinTokens(previewSkinId, activeTheme === 'LIGHT' ? 'light' : 'dark');
                                return (
                                    <button
                                        key={skin.id}
                                        type="button"
                                        disabled={disabledByMode}
                                        onClick={() => onUiSkinOptionClick(skin.id, unlocked, disabledByMode)}
                                        title={skinMeta.title}
                                        aria-pressed={selected}
                                        className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-left text-[9px] font-black uppercase tracking-[0.14em] transition-all ${
                                            selected
                                                ? 'shadow-[0_0_16px_var(--ui-button-primary-glow)]'
                                                : unlocked && !disabledByMode
                                                    ? 'hover:-translate-y-0.5 hover:brightness-[1.04]'
                                                    : ''
                                        } ${disabledByMode ? 'cursor-default' : ''}`}
                                        style={{
                                            background: isLightTheme
                                                ? selected
                                                    ? `color-mix(in srgb, ${previewTokens.accentHex} 22%, rgba(255,255,255,0.94))`
                                                    : 'rgba(255,255,255,0.82)'
                                                : selected
                                                    ? previewTokens.cardStrongBackground
                                                    : 'rgba(255,255,255,0.03)',
                                            borderColor: isLightTheme
                                                ? selected
                                                    ? `color-mix(in srgb, ${previewTokens.accentHex} 42%, rgba(15,23,42,0.18))`
                                                    : 'rgba(71,85,105,0.16)'
                                                : selected
                                                    ? 'var(--ui-border-accent)'
                                                    : previewTokens.borderSoftColor,
                                            opacity: disabledByMode ? 0.42 : unlocked ? 1 : 0.72,
                                            boxShadow: selected
                                                ? isLightTheme
                                                    ? `0 10px 26px color-mix(in srgb, ${previewTokens.accentHex} 24%, rgba(37,99,235,0.08))`
                                                    : `0 0 20px ${previewTokens.buttonGlow}`
                                                : undefined,
                                        }}
                                    >
                                        <span
                                            className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full border border-white/15"
                                            style={{
                                                background: previewTokens.accentHex,
                                                boxShadow: `0 0 8px ${previewTokens.accentHex}`,
                                            }}
                                        />
                                        <span
                                            className="text-[9px] font-black uppercase tracking-[0.08em]"
                                            style={{
                                                color: isLightTheme ? '#211913' : 'rgba(255,255,255,0.84)',
                                                textShadow: undefined,
                                            }}
                                        >
                                            {skinMeta.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="settings-panel-card space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Tema visual</div>
                                <div className="text-[11px] text-gray-500">Escolha o contraste geral do app.</div>
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
                                {activeTheme === 'LIGHT' ? 'Modo claro' : 'Modo escuro'}
                            </div>
                        </div>
                        <div className="flex gap-2 p-1 bg-black/20 rounded-lg">
                            <button
                                onClick={() => activeTheme !== 'LIGHT' && toggleTheme()}
                                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${activeTheme === 'LIGHT' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                MODO CLARO
                            </button>
                            <button
                                onClick={() => activeTheme !== 'DARK' && toggleTheme()}
                                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${activeTheme === 'DARK' ? 'bg-slate-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                MODO ESCURO
                            </button>
                        </div>
                    </div>

                    <div className="settings-panel-card space-y-3">
                        <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Feedback sensorial</div>
                            <div className="text-[11px] text-gray-500">Controle o que anima, toca e vibra.</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <PreferenceToggleChip
                                label="Animações"
                                enabled={Boolean(oraclePreferences?.animationsEnabled)}
                                onClick={() => updateOraclePreferences({ animationsEnabled: !Boolean(oraclePreferences?.animationsEnabled) })}
                                lightTheme={isLightTheme}
                            />
                            <PreferenceToggleChip
                                label="Sons"
                                enabled={Boolean(oraclePreferences?.soundsEnabled)}
                                onClick={() => updateOraclePreferences({ soundsEnabled: !Boolean(oraclePreferences?.soundsEnabled) })}
                                lightTheme={isLightTheme}
                            />
                            <PreferenceToggleChip
                                label="Vibração"
                                enabled={Boolean(oraclePreferences?.hapticsEnabled)}
                                onClick={() => updateOraclePreferences({ hapticsEnabled: !Boolean(oraclePreferences?.hapticsEnabled) })}
                                lightTheme={isLightTheme}
                            />
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};

const TutorialSettings: React.FC<{ onStart?: () => void; onRequestModeGame?: () => void }> = ({ onStart, onRequestModeGame }) => {
    const { startTutorialLevel, isFlagCompleted } = useTutorial();
    const { appMode } = useGame();
    const isBasicMode = appMode !== 'GAME';
    const levels = TUTORIAL_SECTIONS;

    return (
        <div className="space-y-2.5">
            {levels.map((lvl) => {
                const isCompleted = isFlagCompleted(lvl.flag);
                return (
                    <div
                        key={lvl.id}
                        className="relative overflow-hidden rounded-[18px] border border-[rgba(231,236,244,0.40)] bg-[linear-gradient(180deg,rgba(203,209,220,0.97)_0%,rgba(138,147,161,0.93)_24%,rgba(51,58,71,0.95)_58%,rgba(10,13,19,0.98)_100%)] px-3.5 py-2.5 shadow-[0_16px_34px_rgba(0,0,0,0.22)]"
                        style={{ boxShadow: `0 16px 34px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -10px 22px rgba(255,255,255,0.03), 0 0 16px ${lvl.glow}` }}
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-18%,rgba(255,255,255,0.82),rgba(255,255,255,0.36)_24%,rgba(255,255,255,0.08)_46%,transparent_68%),linear-gradient(90deg,rgba(255,255,255,0.10),transparent_30%,transparent_72%,rgba(255,255,255,0.04))] pointer-events-none" />
                        <div className={`absolute left-0 top-0 h-full w-[35%] bg-gradient-to-r ${lvl.accent} opacity-52 pointer-events-none`} />
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent pointer-events-none" />

                        <div className="relative flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="inline-flex items-center rounded-full border border-white/14 bg-black/16 px-2 py-0.5 text-[8px] font-black tracking-[0.22em] text-white/84">
                                        CARD {lvl.id}
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-white/12 bg-white/10 px-2 py-0.5 text-[8px] font-black tracking-[0.18em] text-white/76">
                                        {lvl.badge}
                                    </span>
                                </div>
                                <h4 className="text-[14px] font-black tracking-[0.03em] text-white leading-none">
                                    {lvl.name}
                                </h4>
                                <p className="text-[10px] text-white/72 mt-1 truncate">
                                    {lvl.subtitle}
                                </p>
                                {lvl.gameOnly && (
                                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] mt-1 text-[var(--skin-accent-color)]/80">
                                        Modo Jogo
                                    </p>
                                )}
                                <p className={`text-[9px] font-bold uppercase tracking-[0.18em] mt-2 ${isCompleted ? 'text-green-300' : 'text-white/55'}`}>
                                    {isCompleted ? 'Concluido' : (isBasicMode && lvl.gameOnly ? 'Bloqueado' : 'Disponivel')}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    if (isBasicMode && lvl.gameOnly) {
                                        onRequestModeGame?.();
                                        return;
                                    }
                                    onStart?.();
                                    startTutorialLevel(lvl.id);
                                }}
                                className={`shrink-0 rounded-full border px-2.25 py-0.75 text-[7px] font-bold uppercase tracking-[0.18em] transition-all ${isBasicMode && lvl.gameOnly
                                    ? 'border-[var(--skin-accent-color)]/24 bg-[var(--skin-accent-color)]/10 text-[var(--ui-text-accent)] hover:bg-[var(--skin-accent-color)]/16'
                                    : 'border-white/12 bg-black/18 text-white/48 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {isBasicMode && lvl.gameOnly ? 'Ativar' : 'Reabrir'}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const TutorialSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { userProfile, showToast } = useGame();
    const [screenTipsEnabled, setScreenTipsEnabledState] = useState(() => areScreenIntroTipsEnabled(userProfile.id));

    useEffect(() => {
        setScreenTipsEnabledState(areScreenIntroTipsEnabled(userProfile.id));
    }, [userProfile.id]);

    const handleScreenTipsToggle = (enabled: boolean) => {
        setScreenIntroTipsEnabled(userProfile.id, enabled);
        setScreenTipsEnabledState(enabled);
        window.dispatchEvent(new CustomEvent(SCREEN_INTRO_TIPS_SETTINGS_CHANGED_EVENT, {
            detail: { enabled },
        }));
        showToast(
            enabled
                ? 'Dicas iniciais ligadas para as proximas telas ainda nao vistas.'
                : 'Dicas iniciais desligadas.',
            'info',
        );
    };

    const handleRequestModeGame = () => {
        onClose();
        window.dispatchEvent(new CustomEvent('tutorialTabChange', { detail: { tab: 'Preferências' } }));
        window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent('tutorialFocusModeGame'));
        }, 70);
    };

    return (
        <Portal>
            <div className="settings-overlay-shell animate-fade-in" onClick={onClose}>
                <GlassCard
                    variant="neutral"
                    className="relative m-4 flex max-h-[86svh] w-full max-w-[22.5rem] flex-col overflow-hidden rounded-3xl pt-4"
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={onClose} className="absolute top-4 right-4 inline-flex w-auto px-3.5 py-1.5 text-sm font-bold rounded-xl luxe-skin-button">OK</button>
                    <div className="px-4 pt-2">
                        <div className="mx-auto max-w-[15.75rem] text-center space-y-1">
                            <div className="text-[10px] font-black tracking-[0.28em] text-white/45 uppercase">Estacoes</div>
                            <h2 className="text-base font-black uppercase tracking-[0.14em] text-center">Tutoriais</h2>
                            <p className="text-[11px] text-white/55 leading-snug">
                                Aqui voce reabre os cards guiados do app. No basico voce revisita os cards 1 e 2. Ativando o Modo Jogo em Preferencias, entram os cards 3 e 4 com progresso, mundo e metajogo.
                            </p>
                        </div>
                    </div>
                    <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-3">
                        <div className="rounded-[18px] border border-white/10 bg-black/18 px-3.5 py-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <LightbulbIcon className="h-4 w-4 text-[var(--ui-text-accent)]" />
                                        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white">
                                            Dicas iniciais por tela
                                        </div>
                                    </div>
                                    <p className="mt-1 text-[10px] leading-snug text-white/58">
                                        Mostra um balao curto na primeira entrada em cada aba principal. Se a tela ja foi vista, nao repete.
                                    </p>
                                </div>
                                <div className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] ${screenTipsEnabled ? 'bg-[var(--skin-accent-color)]/14 text-[var(--ui-text-accent)]' : 'bg-white/8 text-white/50'}`}>
                                    {screenTipsEnabled ? 'Ligado' : 'Desligado'}
                                </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleScreenTipsToggle(true)}
                                    className={`flex-1 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${screenTipsEnabled ? 'luxe-skin-button' : 'border border-white/10 bg-white/[0.03] text-white/72 hover:bg-white/[0.06]'}`}
                                >
                                    On
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleScreenTipsToggle(false)}
                                    className={`flex-1 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${!screenTipsEnabled ? 'luxe-skin-button' : 'border border-white/10 bg-white/[0.03] text-white/72 hover:bg-white/[0.06]'}`}
                                >
                                    Off
                                </button>
                            </div>
                            <p className="mt-2 text-[9px] leading-snug text-white/40">
                                Se voce desligar no balao, religa por aqui.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/42">
                                Cobertura por tela
                            </div>
                            {SCREEN_INTRO_TIP_LIST.map((entry) => (
                                <div key={entry.id} className="rounded-[18px] border border-white/10 bg-black/16 px-3.5 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-[12px] font-black uppercase tracking-[0.12em] text-white">
                                            {entry.label}
                                        </div>
                                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-white/50">
                                            Tela
                                        </div>
                                    </div>
                                    <p className="mt-1 text-[10px] leading-snug text-white/52">
                                        {entry.summary}
                                    </p>
                                    <div className="mt-2 space-y-1.5">
                                        {entry.items.map((item) => (
                                            <div key={item} className="flex items-start gap-2 text-[10px] leading-snug text-white/74">
                                                <span className="mt-[4px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--skin-accent-color)]/88" />
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <TutorialSettings onStart={onClose} onRequestModeGame={handleRequestModeGame} />
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};

const RedeemCodeModal: React.FC<{
    open: boolean;
    onClose: () => void;
    onRedeem: (code: string) => Promise<void>;
}> = ({ open, onClose, onRedeem }) => {
    const [code, setCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setCode('');
            setSubmitting(false);
            setError(null);
        }
    }, [open]);

    if (!open) return null;

    const handleConfirm = async () => {
        const normalized = code.trim();
        if (!normalized) {
            setError('Digite um codigo.');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await onRedeem(normalized);
            onClose();
        } catch (redeemError: any) {
            setError(redeemError?.message || 'Nao consegui resgatar esse codigo agora.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Portal>
            <div className="settings-overlay-shell animate-fade-in" onClick={onClose}>
                <GlassCard
                    variant="neutral"
                    className="w-full max-w-sm m-4 space-y-4 rounded-3xl"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--ui-card-text-soft)]">
                            Resgatar codigo
                        </div>
                        <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Tenho um codigo</h2>
                        <p className="text-sm leading-relaxed text-white/62">
                            Digite seu codigo para liberar recompensas, campanhas ou vantagens especiais.
                        </p>
                    </div>

                    <input
                        type="text"
                        value={code}
                        onChange={(event) => setCode(event.target.value.toUpperCase())}
                        placeholder="Digite o codigo"
                        disabled={submitting}
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm uppercase tracking-[0.14em] text-white placeholder:text-white/28 focus:outline-none focus:border-[var(--skin-accent-color)] disabled:opacity-60"
                    />

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 disabled:opacity-60"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleConfirm()}
                            disabled={submitting}
                            className="flex-1 rounded-2xl bg-[var(--skin-accent-color)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_0_20px_rgba(212,175,55,0.25)] disabled:opacity-60"
                        >
                            {submitting ? 'OK...' : 'OK'}
                        </button>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const mapDbProfileToUserProfile = (row: any): UserProfile => {
    const normalizedRole = typeof row.role === 'string' ? row.role.toLowerCase() : 'user';
    const role = normalizedRole === 'admin' || normalizedRole === 'gm' ? normalizedRole : 'user';
    return {
        id: row.id,
        email: row.email ?? undefined,
        username: row.username ?? row.nickname ?? 'usuario',
        nickname: row.nickname ?? 'Usuario',
        avatarUrl: row.avatar_url ?? row.avatarUrl ?? '',
        border: row.border ?? 'default',
        level: typeof row.level === 'number' ? row.level : 1,
        backgroundUrl: row.background_url ?? row.backgroundUrl ?? '',
        bannerUrl: row.banner_url ?? row.bannerUrl ?? undefined,
        isOnline: !!(row.is_online ?? row.isOnline),
        visibleWidgets: row.visible_widgets ?? row.visibleWidgets ?? [],
        sequenceItems: row.sequence_items ?? row.sequenceItems ?? [],
        assetArtById: row.asset_art_by_id ?? row.assetArtById ?? {},
        assetWidgetValues: row.asset_widget_values ?? row.assetWidgetValues ?? {},
        assetsVisibility: row.assets_visibility ?? row.assetsVisibility ?? 'all',
        masteryVisibility: row.mastery_visibility ?? row.masteryVisibility ?? 'all',
        featsVisibility: row.feats_visibility ?? row.featsVisibility ?? 'friends',
        gardenVisibility: row.garden_visibility ?? row.gardenVisibility ?? 'friends',
        gardenState: row.garden_state ?? row.gardenState ?? undefined,
        skin: row.skin ?? 'default',
        sovereign: row.sovereign ?? undefined,
        nobility: row.nobility ?? { exp: 0, rankId: 'vagante' },
        mood: typeof row.mood === 'number' ? row.mood : 50,
        chests: row.chests ?? undefined,
        wallet: row.wallet ?? { gold: row.gold ?? 0, fragments: row.fragments ?? 0 },
        inventory: [],
        role,
        isPremium: row.is_premium ?? row.isPremium ?? false,
        premiumExpiresAt: row.premium_expires_at ?? row.premiumExpiresAt ?? null,
        subscriptionTier: row.subscription_tier ?? row.subscriptionTier ?? ((row.is_premium ?? row.isPremium) ? 'premium' : null),
        legacyProjectionSceneCredits: row.legacy_projection_scene_credits ?? row.legacyProjectionSceneCredits ?? 0,
        campaignQuizFreeCredits: row.campaign_quiz_free_credits ?? row.campaignQuizFreeCredits ?? 0,
        campaignQuizMediumCredits: row.campaign_quiz_medium_credits ?? row.campaignQuizMediumCredits ?? 0,
        completedSeasonMissions: Array.isArray(row.completed_season_missions) ? row.completed_season_missions : [],
    };
};

const mapToCamelCase = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(v => mapToCamelCase(v));
    if (obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));
            result[camelKey] = mapToCamelCase(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
};

const LinksModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { userProfile, friends, userCodexes, duplicateUserCodexToRecipient, showToast } = useGame();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invites, setInvites] = useState<RelationshipLinkInvite[]>([]);
    const [links, setLinks] = useState<RelationshipLink[]>([]);
    const [profilesById, setProfilesById] = useState<Record<string, UserProfile>>({});
    const [activeTab, setActiveTab] = useState<'mentoria' | 'parcerias' | 'desafios'>('mentoria');
    const [savingLinkId, setSavingLinkId] = useState<string | null>(null);
    const [sessionUid, setSessionUid] = useState<string | null>(null);
    const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
    const [spectatorData, setSpectatorData] = useState<{ arena: Arena, actions: Action[], tasks: ScheduledTask[], pupilName: string, link: RelationshipLink } | null>(null);
    const [selectedPupilLink, setSelectedPupilLink] = useState<RelationshipLink | null>(null);
    const [isMentorCreatorOpen, setMentorCreatorOpen] = useState(false);
    const [showMentorshipModal, setShowMentorshipModal] = useState(false);
    const [selectedFriendForMentorship, setSelectedFriendForMentorship] = useState<UserProfile | null>(null);
    const [showPartnershipModal, setShowPartnershipModal] = useState(false);
    const [selectedFriendForPartnership, setSelectedFriendForPartnership] = useState<UserProfile | null>(null);
    const canActAsMentor = true;

    const sessionReady = useMemo(() => !!sessionUid && isUuid(sessionUid), [sessionUid]);

    const hydrateProfiles = async (ids: string[]) => {
        const missing = ids.filter(id => !profilesById[id]);
        const toFetch = missing.filter(isUuid);
        if (toFetch.length === 0) return;

        const { data, error } = await supabase.from('user_profiles').select('*').in('id', toFetch);
        if (error || !data) return;
        setProfilesById(prev => {
            const next = { ...prev };
            for (const row of data as any[]) next[row.id] = mapDbProfileToUserProfile(row);
            return next;
        });
    };

    const refresh = async () => {
        setLoading(true);
        setError(null);

        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user.id;
        if (!uid || !isUuid(uid)) {
            setSessionUid(null);
            setInvites([]);
            setLinks([]);
            setLoading(false);
            return;
        }
        setSessionUid(uid);

        const [{ data: invitesData, error: invitesError }, { data: linksData, error: linksError }] = await Promise.all([
            supabase
                .from('relationship_link_invites')
                .select('*')
                .eq('recipient_id', uid)
                .eq('status', 'pending')
                .order('created_at', { ascending: false }),
            supabase
                .from('relationship_links')
                .select('*')
                .or(`mentor_id.eq.${uid},pupil_id.eq.${uid}`)
                .is('ended_at', null)
                .order('created_at', { ascending: false }),
        ]);

        if (invitesError) setError(invitesError.message);
        if (linksError) setError(linksError.message);

        const mappedInvites: RelationshipLinkInvite[] = (invitesData || []).map((r: any) => ({
            id: r.id,
            senderId: r.sender_id,
            recipientId: r.recipient_id,
            linkType: r.link_type,
            arenaId: r.arena_id,
            arenaSnapshot: r.arena_snapshot,
            status: r.status,
            createdAt: r.created_at,
            respondedAt: r.responded_at,
        }));
        const mappedLinks: RelationshipLink[] = (linksData || []).map((r: any) => ({
            id: r.id,
            mentorId: r.mentor_id,
            pupilId: r.pupil_id,
            linkType: r.link_type,
            arenaId: r.arena_id,
            arenaSnapshot: r.arena_snapshot,
            satisfactionLevel: typeof r.satisfaction_level === 'number' ? r.satisfaction_level : 50,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            endedAt: r.ended_at,
        }));

        setInvites(mappedInvites);
        setLinks(mappedLinks);
        setSliderValues(prev => {
            const next = { ...prev };
            for (const link of mappedLinks) {
                if (typeof next[link.id] !== 'number') next[link.id] = link.satisfactionLevel;
            }
            return next;
        });

        const idsToHydrate = [
            ...new Set([
                ...mappedInvites.flatMap(i => [i.senderId, i.recipientId]),
                ...mappedLinks.flatMap(l => [l.mentorId, l.pupilId]),
            ]),
        ];

        const prefilled: Record<string, UserProfile> = {};
        prefilled[userProfile.id] = userProfile;
        for (const friend of friends) prefilled[friend.id] = friend;
        setProfilesById(prev => ({ ...prefilled, ...prev }));
        await hydrateProfiles(idsToHydrate);
        setLoading(false);
    };

    useEffect(() => {
        refresh();
    }, []);

    const fetchSpectatorData = async (link: RelationshipLink, targetName: string) => {
        setLoading(true);
        try {
            const { data: arenaData, error: arenaError } = await supabase.from('arenas').select('*').eq('id', link.arenaId).single();
            if (arenaError || !arenaData) throw new Error("Arena não encontrada.");

            const { data: actionsData } = await supabase.from('actions').select('*').eq('arena_id', link.arenaId);

            const today = getLocalDateString();
            const { data: tasksData } = await supabase.from('scheduled_tasks').select('*').in('action_id', (actionsData || []).map((a: any) => a.id)).eq('date', today);

            setSpectatorData({
                arena: mapToCamelCase(arenaData),
                actions: mapToCamelCase(actionsData || []),
                tasks: mapToCamelCase(tasksData || []),
                pupilName: targetName,
                link
            });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const acceptInvite = async (invite: RelationshipLinkInvite) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user.id;
        if (!uid || !isUuid(uid)) return;

        const { error: updateError } = await supabase
            .from('relationship_link_invites')
            .update({ status: 'accepted', responded_at: new Date().toISOString() })
            .eq('id', invite.id)
            .eq('recipient_id', uid);
        if (updateError) {
            setError(updateError.message);
            return;
        }

        const { error: insertError } = await supabase.from('relationship_links').insert({
            mentor_id: invite.linkType === 'mentoria' ? invite.senderId : uid,
            pupil_id: invite.linkType === 'mentoria' ? uid : invite.senderId,
            link_type: invite.linkType,
            arena_id: invite.arenaId,
            arena_snapshot: invite.arenaSnapshot,
            satisfaction_level: 50,
        });
        if (insertError) setError(insertError.message);
        await refresh();
    };

    const declineInvite = async (invite: RelationshipLinkInvite) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user.id;
        if (!uid || !isUuid(uid)) return;

        const { error } = await supabase
            .from('relationship_link_invites')
            .update({ status: 'declined', responded_at: new Date().toISOString() })
            .eq('id', invite.id)
            .eq('recipient_id', uid);
        if (error) setError(error.message);
        await refresh();
    };

    const setSatisfaction = async (link: RelationshipLink, level: number) => {
        setSavingLinkId(link.id);
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user.id;
        if (!uid || !isUuid(uid)) {
            setSavingLinkId(null);
            return;
        }

        const clamped = Math.max(0, Math.min(100, Math.round(level)));
        const { error } = await supabase
            .from('relationship_links')
            .update({ satisfaction_level: clamped })
            .eq('id', link.id)
            .eq('mentor_id', uid);
        if (error) setError(error.message);
        await refresh();
        setSavingLinkId(null);
    };

    const sendSignal = async (link: RelationshipLink, notificationType: LinkNotificationType) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user.id;
        if (!uid || !isUuid(uid)) return;

        const recipientId = uid === link.mentorId ? link.pupilId : link.mentorId;
        const { error } = await supabase.from('link_notifications_log').insert({
            link_id: link.id,
            sender_id: uid,
            recipient_id: recipientId,
            notification_type: notificationType,
        });
        if (error) setError(error.message);
    };

    const myPupils = links.filter(l => l.linkType === 'mentoria' && !!sessionUid && l.mentorId === sessionUid);
    const myMentors = links.filter(l => l.linkType === 'mentoria' && !!sessionUid && l.pupilId === sessionUid);
    const myPartners = links.filter(l => l.linkType === 'parceria');
    const myCompetitions = links.filter(l => l.linkType === 'competicao');
    const authoredCodexes = userCodexes.filter((codex: any) => !codex.catalog_id && Array.isArray(codex.template?.levels) && codex.template.levels.length > 0);

    const getProfile = (id: string) => profilesById[id];

    const sliderColor = (value: number) => {
        if (value <= 33) return 'from-red-500/70 to-red-300/40';
        if (value <= 66) return 'from-[var(--skin-accent-color)]/70 to-[var(--skin-accent-color)]/40';
        return 'from-green-500/70 to-green-300/40';
    };

    const [showChallengeModal, setShowChallengeModal] = useState(false);
    const [selectedFriendForChallenge, setSelectedFriendForChallenge] = useState<UserProfile | null>(null);

    const handleCreateChallenge = (friend: UserProfile) => {
        setSelectedFriendForChallenge(friend);
        setShowChallengeModal(false);
    };

    const handleOpenChallengeModal = () => {
        setShowChallengeModal(true);
    };

    const handleCreateMentorship = (friend: UserProfile) => {
        setSelectedFriendForMentorship(friend);
        setShowMentorshipModal(false);
    };

    const handleOpenMentorshipModal = () => {
        setShowMentorshipModal(true);
    };

    const handleCreatePartnership = (friend: UserProfile) => {
        setSelectedFriendForPartnership(friend);
        setShowPartnershipModal(false);
    };

    const handleOpenPartnershipModal = () => {
        setShowPartnershipModal(true);
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                        <div className="text-xs font-bold uppercase tracking-wider accent-text">VÍNCULOS</div>
                        <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                    </div>

                    <div className="flex space-x-2">
                        <button id="links-tab-mentoria" onClick={() => setActiveTab('mentoria')} className={`w-full py-2 rounded-xl font-bold text-xs tracking-widest border border-white/10 ${activeTab === 'mentoria' ? 'bg-black/30 accent-text' : 'bg-black/10 text-gray-300 hover:bg-black/20'}`}>MENTORIA</button>
                        <button id="links-tab-parcerias" onClick={() => setActiveTab('parcerias')} className={`w-full py-2 rounded-xl font-bold text-xs tracking-widest border border-white/10 ${activeTab === 'parcerias' ? 'bg-black/30 accent-text' : 'bg-black/10 text-gray-300 hover:bg-black/20'}`}>PARCERIAS</button>
                        <button id="links-tab-desafios" onClick={() => setActiveTab('desafios')} className={`w-full py-2 rounded-xl font-bold text-xs tracking-widest border border-white/10 ${activeTab === 'desafios' ? 'bg-black/30 accent-text' : 'bg-black/10 text-gray-300 hover:bg-black/20'}`}>DESAFIOS</button>
                    </div>

                    {!sessionReady && (
                        <div className="text-center text-sm text-gray-400 bg-black/20 border border-white/10 rounded-xl p-3">
                            Faça login no Supabase para usar Vínculos.
                        </div>
                    )}

                    {sessionReady && (
                        <div className="space-y-4">
                            {error && <div className="text-xs text-red-400 bg-black/20 border border-red-500/20 rounded-xl p-2">{error}</div>}
                            {loading ? (
                                <div className="text-center text-sm text-gray-500 py-4">Carregando...</div>
                            ) : (
                                <>
                                    {activeTab === 'mentoria' && (
                                        <>
                                            {invites.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="text-[10px] font-black tracking-widest text-gray-400">CONVITES</div>
                                                    {invites.map(invite => {
                                                        const sender = getProfile(invite.senderId);
                                                        const senderNickname = sender?.nickname || (invite.senderId === sessionUid ? userProfile.nickname : 'Viajante');
                                                        return (
                                                            <div key={invite.id} className="bg-black/20 border border-white/10 rounded-2xl p-3 space-y-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                                                                        {sender?.avatarUrl ? <img src={sender.avatarUrl} alt={senderNickname} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-500">?</span>}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="text-sm font-bold text-white">{senderNickname}</div>
                                                                        <div className="text-xs text-gray-400">convoca você para observar {invite.arenaSnapshot?.name || 'uma arena'}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => declineInvite(invite)} className="w-full py-2 rounded-xl luxe-button-secondary">RECUSAR</button>
                                                                    <button onClick={() => acceptInvite(invite)} className="w-full py-2 rounded-xl luxe-skin-button">ACEITAR</button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <div className="text-[10px] font-black tracking-widest text-gray-400">MEUS PUPILOS</div>
                                                    <button
                                                        onClick={handleOpenMentorshipModal}
                                                        className="p-1 px-2 rounded-lg bg-white/5 border border-white/10 text-[var(--skin-accent-color)] text-[10px] font-black hover:bg-white/10 transition-all flex items-center gap-1"
                                                    >
                                                        <span>+</span> ADICIONAR
                                                    </button>
                                                </div>
                                                    <div className="text-[11px] leading-relaxed text-gray-400">
                                                        Mentoria ativa como mentor e envio de campanhas para pupilos aparecem aqui.
                                                    </div>
                                                {myPupils.length === 0 ? (
                                                    <div className="text-center text-sm text-gray-500 py-4">Nenhum vínculo ativo.</div>
                                                ) : (
                                                    myPupils.map(link => {
                                                        const pupil = getProfile(link.pupilId);
                                                        const localValue = typeof sliderValues[link.id] === 'number' ? sliderValues[link.id] : link.satisfactionLevel;
                                                        return (
                                                            <div key={link.id} className="bg-black/20 border border-white/10 rounded-2xl p-3 space-y-2 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => fetchSpectatorData(link, pupil?.nickname || 'Pupilo')}>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                                                                        {pupil?.avatarUrl ? <img src={pupil.avatarUrl} alt={pupil.nickname} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-500">?</span>}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="text-sm font-bold text-white">{pupil?.nickname || 'Pupilo'}</div>
                                                                        <div className="text-xs text-gray-400">{link.arenaSnapshot?.icon || '👁️'} {link.arenaSnapshot?.name || 'Arena'}</div>
                                                                    </div>
                                                                    <div className={`text-xs font-bold ${localValue <= 33 ? 'text-red-400' : localValue <= 66 ? 'text-yellow-400' : 'text-green-400'}`}>{Math.round(localValue)}%</div>
                                                                </div>

                                                                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full transition-all duration-500 ${localValue <= 33 ? 'bg-red-500' : localValue <= 66 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                                        style={{ width: `${localValue}%` }}
                                                                    />
                                                                </div>
                                                                <div className="flex justify-end">
                                                                    <button
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            setSelectedPupilLink(link);
                                                                        }}
                                                                        className="px-3 py-2 rounded-xl bg-[var(--skin-accent-color)]/10 border border-[var(--skin-accent-color)]/30 text-[10px] font-bold tracking-wider text-[var(--skin-accent-color)] hover:bg-[var(--skin-accent-color)]/20 transition-all"
                                                                    >
                                                                        NOVA CAMPANHA
                                                                    </button>
                                                                </div>
                                                                <div className="text-[10px] text-center text-gray-500 uppercase tracking-wider font-bold pt-1">
                                                                    Clique para Avaliar
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <div className="text-[10px] font-black tracking-widest text-gray-400">MEUS MENTORES</div>
                                                {myMentors.length === 0 ? (
                                                    <div className="text-center text-sm text-gray-500 py-4">Nenhum mentor te observando.</div>
                                                ) : (
                                                    myMentors.map(link => {
                                                        const mentor = getProfile(link.mentorId);
                                                        const value = link.satisfactionLevel;
                                                        return (
                                                            <div key={link.id} className="bg-black/20 border border-white/10 rounded-2xl p-3 space-y-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                                                                        {mentor?.avatarUrl ? <img src={mentor.avatarUrl} alt={mentor.nickname} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-500">?</span>}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="text-sm font-bold text-white">{mentor?.nickname || 'Mentor'}</div>
                                                                        <div className="text-xs text-gray-400">observa {link.arenaSnapshot?.icon || '👁️'} {link.arenaSnapshot?.name || 'Arena'}</div>
                                                                    </div>
                                                                    <div className={`text-xs font-bold ${value < 34 ? 'text-red-400' : value < 67 ? 'text-yellow-400' : 'text-green-400'}`}>{value}%</div>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    min={0}
                                                                    max={100}
                                                                    value={value}
                                                                    readOnly
                                                                    className={`w-full h-2 rounded-full appearance-none bg-gradient-to-r ${sliderColor(value)} outline-none opacity-80`}
                                                                />
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                            <div className="pt-2 border-t border-white/10">
                                                <button
                                                    id="links-new-mentorship-button"
                                                    onClick={handleOpenMentorshipModal}
                                                    className="w-full py-3 rounded-xl bg-[var(--skin-accent-color)]/10 border border-[var(--skin-accent-color)]/30 text-[var(--skin-accent-color)] text-xs font-bold hover:bg-[var(--skin-accent-color)]/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <span>💎</span>
                                                    NOVA MENTORIA
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {activeTab === 'parcerias' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <div className="text-[10px] font-black tracking-widest text-gray-400">VÍNCULOS DE SANGUE</div>
                                                <button
                                                    onClick={handleOpenPartnershipModal}
                                                    className="p-1 px-2 rounded-lg bg-white/5 border border-white/10 text-[var(--skin-accent-color)] text-[10px] font-black hover:bg-white/10 transition-all flex items-center gap-1"
                                                >
                                                    <span>+</span> ADICIONAR
                                                </button>
                                            </div>
                                            {myPartners.length === 0 ? (
                                                <div className="text-center text-sm text-gray-500 py-4">Nenhuma parceria ativa.</div>
                                            ) : (
                                                myPartners.map(link => {
                                                    const isMeMentor = link.mentorId === sessionUid;
                                                    const partnerId = isMeMentor ? link.pupilId : link.mentorId;
                                                    const partner = getProfile(partnerId);

                                                    return (
                                                        <div key={link.id} className="bg-black/20 border border-white/10 rounded-2xl p-3 space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                                                                    {partner?.avatarUrl ? <img src={partner.avatarUrl} alt={partner.nickname} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-500">?</span>}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-bold text-white">{partner?.nickname || 'Parceiro'}</div>
                                                                    <div className="text-xs text-gray-400">Parceria em {link.arenaSnapshot?.name || 'Arena'}</div>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <div className="flex-1 bg-black/30 rounded-xl p-2 text-center border border-white/5 cursor-pointer hover:border-white/20" onClick={() => isMeMentor ? null : fetchSpectatorData(link, partner?.nickname || 'Parceiro')}>
                                                                    <div className="text-[10px] text-gray-500 uppercase">Eu</div>
                                                                    <div className="text-sm font-bold text-white">{link.arenaSnapshot?.name}</div>
                                                                    {/* Sync status would go here */}
                                                                </div>
                                                                <div className="flex-1 bg-black/30 rounded-xl p-2 text-center border border-white/5 cursor-pointer hover:border-white/20" onClick={() => !isMeMentor ? null : fetchSpectatorData(link, partner?.nickname || 'Parceiro')}>
                                                                    <div className="text-[10px] text-gray-500 uppercase">Parceiro</div>
                                                                    <div className="text-sm font-bold text-white">{link.arenaSnapshot?.name}</div>
                                                                </div>
                                                            </div>

                                                            <div className="text-center text-[10px] text-gray-500 italic">
                                                                "Aguardando sincronia..."
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                            <div className="pt-2 border-t border-white/10">
                                                <button
                                                    onClick={handleOpenPartnershipModal}
                                                    className="w-full py-3 rounded-xl bg-[var(--skin-accent-color)]/10 border border-[var(--skin-accent-color)]/30 text-[var(--skin-accent-color)] text-xs font-bold hover:bg-[var(--skin-accent-color)]/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <span>🤝</span>
                                                    NOVA PARCERIA
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'desafios' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <div className="text-[10px] font-black tracking-widest text-gray-400">EVENTOS PVP</div>
                                                <button
                                                    onClick={handleOpenChallengeModal}
                                                    className="p-1 px-2 rounded-lg bg-white/5 border border-white/10 text-[var(--skin-accent-color)] text-[10px] font-black hover:bg-white/10 transition-all flex items-center gap-1"
                                                >
                                                    <span>+</span> ADICIONAR
                                                </button>
                                            </div>
                                            {myCompetitions.length === 0 ? (
                                                <div className="text-center text-sm text-gray-500 py-4">Nenhum desafio ativo.</div>
                                            ) : (
                                                myCompetitions.map(link => {
                                                    const isMeMentor = link.mentorId === sessionUid;
                                                    const opponentId = isMeMentor ? link.pupilId : link.mentorId;
                                                    const opponent = getProfile(opponentId);

                                                    return (
                                                        <div key={link.id} className="bg-black/20 border border-white/10 rounded-2xl p-4 text-center space-y-2 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => fetchSpectatorData(link, opponent?.nickname || 'Oponente')}>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xl">{link.arenaSnapshot?.icon || '⚔️'}</span>
                                                                    <div className="text-left">
                                                                        <div className="text-sm font-bold text-white leading-none">{link.arenaSnapshot?.name || 'Desafio'}</div>
                                                                        <div className="text-[10px] text-gray-400">vs {opponent?.nickname || 'Oponente'}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs font-bold text-[var(--skin-accent-color)]">EM ANDAMENTO</div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-blue-500 w-1/2"></div>
                                                                </div>
                                                                <div className="text-[10px] font-bold text-gray-500">VS</div>
                                                                <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-red-500 w-1/3"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                            <div className="pt-2 border-t border-white/10">
                                                <button
                                                    id="links-new-challenge-button"
                                                    onClick={handleOpenChallengeModal}
                                                    className="w-full py-3 rounded-xl bg-[var(--skin-accent-color)]/10 border border-[var(--skin-accent-color)]/30 text-[var(--skin-accent-color)] text-xs font-bold hover:bg-[var(--skin-accent-color)]/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <span>⚔️</span>
                                                    NOVO DESAFIO
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </GlassCard>
                {spectatorData && (
                    <SpectatorArenaModal
                        arena={spectatorData.arena}
                        actions={spectatorData.actions}
                        tasks={spectatorData.tasks}
                        pupilName={spectatorData.pupilName}
                        onClose={() => setSpectatorData(null)}
                        isMentor={activeTab === 'mentoria' && !!spectatorData.link && spectatorData.link.mentorId === sessionUid}
                        satisfactionLevel={typeof sliderValues[spectatorData.link.id] === 'number' ? sliderValues[spectatorData.link.id] : spectatorData.link.satisfactionLevel}
                        onSatisfactionChange={(val) => {
                            setSliderValues(prev => ({ ...prev, [spectatorData.link.id]: val }));
                            setSatisfaction(spectatorData.link, val);
                        }}
                        onSignal={(type) => sendSignal(spectatorData.link, type)}
                    />
                )}

                {showChallengeModal && (
                    <ChallengeSelectionModal
                        onClose={() => setShowChallengeModal(false)}
                        onSelectFriend={handleCreateChallenge}
                    />
                )}

                {showMentorshipModal && (
                    <ChallengeSelectionModal
                        title="Nova Mentoria"
                        onClose={() => setShowMentorshipModal(false)}
                        onSelectFriend={handleCreateMentorship}
                    />
                )}

                {showPartnershipModal && (
                    <ChallengeSelectionModal
                        title="Nova Parceria"
                        onClose={() => setShowPartnershipModal(false)}
                        onSelectFriend={handleCreatePartnership}
                    />
                )}

                {selectedFriendForChallenge && (
                    <Suspense fallback={<div className="fixed inset-0 z-[210] bg-black/40 backdrop-blur-sm" />}>
                        <NewArenaModal
                            isOpen={true}
                            onClose={() => {
                                setSelectedFriendForChallenge(null);
                                refresh(); // Refresh list after sharing arena
                            }}
                            initialRelationship={{
                                type: 'competition',
                                friendId: selectedFriendForChallenge.id,
                                friendName: selectedFriendForChallenge.nickname
                            }}
                        />
                    </Suspense>
                )}

                {selectedFriendForMentorship && (
                    <Suspense fallback={<div className="fixed inset-0 z-[210] bg-black/40 backdrop-blur-sm" />}>
                        <NewArenaModal
                            isOpen={true}
                            onClose={() => {
                                setSelectedFriendForMentorship(null);
                                refresh();
                            }}
                            initialRelationship={{
                                type: 'mentorship',
                                friendId: selectedFriendForMentorship.id,
                                friendName: selectedFriendForMentorship.nickname
                            }}
                        />
                    </Suspense>
                )}

                {selectedFriendForPartnership && (
                    <Suspense fallback={<div className="fixed inset-0 z-[210] bg-black/40 backdrop-blur-sm" />}>
                        <NewArenaModal
                            isOpen={true}
                            onClose={() => {
                                setSelectedFriendForPartnership(null);
                                refresh();
                            }}
                            initialRelationship={{
                                type: 'partnership',
                                friendId: selectedFriendForPartnership.id,
                                friendName: selectedFriendForPartnership.nickname
                            }}
                        />
                    </Suspense>
                )}

                {selectedPupilLink && (
                    <MentorCodexModal
                        link={selectedPupilLink}
                        pupil={getProfile(selectedPupilLink.pupilId)}
                        codexes={authoredCodexes}
                        canMentor={canActAsMentor}
                        onClose={() => {
                            setSelectedPupilLink(null);
                            setMentorCreatorOpen(false);
                        }}
                        onCreateNew={() => {
                            setMentorCreatorOpen(true);
                        }}
                        onGiveCodex={async (codexId) => {
                            const success = await duplicateUserCodexToRecipient(codexId, selectedPupilLink.pupilId, selectedPupilLink.id);
                            if (!success) return;
                            setSelectedPupilLink(null);
                        }}
                    />
                )}

                {selectedPupilLink && isMentorCreatorOpen && (
                    <Suspense fallback={<div className="fixed inset-0 z-[220] bg-black/40 backdrop-blur-sm" />}>
                        <CodexModal
                            onClose={() => setMentorCreatorOpen(false)}
                            recipientId={selectedPupilLink.pupilId}
                            recipientName={getProfile(selectedPupilLink.pupilId)?.nickname || 'Pupilo'}
                            relationshipLinkId={selectedPupilLink.id}
                            onDelivered={() => {
                                setMentorCreatorOpen(false);
                                setSelectedPupilLink(null);
                            }}
                        />
                    </Suspense>
                )}
            </div>
        </Portal>
    );
};

const ChallengeSelectionModal: React.FC<{ title?: string; onClose: () => void; onSelectFriend: (friend: UserProfile) => void }> = ({ title = 'Novo Desafio', onClose, onSelectFriend }) => {
    const { friends } = useGame();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFriends = friends.filter(f => f.nickname?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[210] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm max-h-[70vh] flex flex-col rounded-3xl p-4" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">{title}</h3>
                        <button onClick={onClose}><XIcon className="w-5 h-5 text-gray-400" /></button>
                    </div>

                    <input
                        id="challenge-search-input"
                        type="text"
                        placeholder="Buscar amigo..."
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white mb-4 focus:border-[var(--skin-accent-color)] outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />

                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                        {filteredFriends.length === 0 ? (
                            <div className="text-center text-gray-500 text-xs py-8">Nenhum amigo encontrado.</div>
                        ) : (
                            filteredFriends.map(friend => (
                                <div id={`challenge-friend-${friend.id}`} key={friend.id} onClick={() => onSelectFriend(friend)} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer border border-transparent hover:border-[var(--skin-accent-color)]/30 transition-all">
                                    <div className="w-10 h-10 rounded-full bg-black/30 overflow-hidden">
                                        {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">?</div>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-white">{friend.nickname}</div>
                                        <div className="text-[10px] text-gray-400">Nível {friend.level || 1}</div>
                                    </div>
                                    <div className="px-3 py-1 bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)] text-[10px] font-bold rounded-lg uppercase">
                                        Desafiar
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};

type FeedbackQuestion = { id: number; label: string; category: 'Core' | 'Dopamina' | 'Valor' };

const feedbackQuestions: FeedbackQuestion[] = [
    { id: 1, label: 'Fluidez do Campo de Batalha (Planner)', category: 'Core' },
    { id: 2, label: 'Estabilidade do Sistema (Bugs & Performance)', category: 'Core' },
    { id: 3, label: 'Ritualística (Painel Diário & Fechamento)', category: 'Core' },
    { id: 4, label: 'Senso de Progresso (XP & Níveis)', category: 'Dopamina' },
    { id: 5, label: 'Identidade Visual (UI & Avatar)', category: 'Dopamina' },
    { id: 6, label: 'Mecânica do Santuário (Manutenção)', category: 'Dopamina' },
    { id: 7, label: 'Pressão Social (Clãs & Vínculos)', category: 'Valor' },
    { id: 8, label: 'Utilidade das campanhas (templates)', category: 'Valor' },
    { id: 9, label: 'Impacto na Realidade', category: 'Valor' },
    { id: 10, label: 'Nível de Recomendação (NPS)', category: 'Valor' },
];

const getSovereignLabel = (value: number) => {
    const rounded = Math.max(1, Math.min(5, Math.round(value)));
    if (rounded === 1) return 'Péssimo / Caos';
    if (rounded === 2) return 'Fraco';
    if (rounded === 3) return 'Aceitável';
    if (rounded === 4) return 'Muito Bom';
    return 'Excelente / Soberano';
};

const getSovereignPhrase = (questionId: number, value: number) => {
    const rounded = Math.max(1, Math.min(5, Math.round(value)));
    const core = questionId <= 3;
    const dopamine = questionId >= 4 && questionId <= 6;
    const valueBlock = questionId >= 7;

    const prefix = core ? 'Motor:' : dopamine ? 'Dopamina:' : 'Valor:';

    if (rounded === 1) return `${prefix} em colapso. Precisa de reforço imediato.`;
    if (rounded === 2) return `${prefix} instável. Dá pra usar, mas sangra fricção.`;
    if (rounded === 3) return `${prefix} funcional. Ainda falta impacto e polimento.`;
    if (rounded === 4) return `${prefix} forte. Começa a parecer uma ferramenta séria.`;
    return `${prefix} soberano. Está virando extensão da mente.`;
};

const SovereignSlider: React.FC<{ value: number; onChange: (next: number) => void }> = ({ value, onChange }) => {
    const clamped = Math.max(1, Math.min(5, value));
    const pct = ((clamped - 1) / 4) * 100;
    const fill = pct < 20 ? 'rgba(239,68,68,0.85)' : pct < 70 ? 'var(--skin-accent-color)' : 'var(--skin-accent-color)';
    const track = `linear-gradient(90deg, ${fill} 0%, ${fill} ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`;

    return (
        <div className="relative w-full">
            <div className="h-3 rounded-full border border-white/10" style={{ background: track }} />
            <div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rotate-45 bg-black/70 border border-[var(--skin-accent-color)] shadow-[0_0_12px_var(--sephirot-glow-color)]"
                style={{ left: `calc(${pct}% - 10px)` }}
            />
            <input
                type="range"
                min={1}
                max={5}
                step={0.1}
                value={clamped}
                onChange={(e) => onChange(Number(e.target.value))}
                className="absolute inset-0 w-full h-6 opacity-0"
            />
        </div>
    );
};

const FeedbackBetaModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { userProfile } = useGame();
    const [answers, setAnswers] = useState<Record<number, number>>(() => {
        const initial: Record<number, number> = {};
        for (const q of feedbackQuestions) initial[q.id] = 3;
        return initial;
    });
    const [notes, setNotes] = useState('');
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const sendReport = async () => {
        setSending(true);
        setStatus('Enviando dados para o QG...');

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const uid = sessionData.session?.user.id;
            if (!uid || !isUuid(uid)) {
                setStatus('Faça login para enviar o relatório.');
                setSending(false);
                return;
            }

            const payload = {
                schemaVersion: 1,
                questions: feedbackQuestions.map(q => ({
                    id: q.id,
                    label: q.label,
                    category: q.category,
                    value: Number((answers[q.id] ?? 3).toFixed(1)),
                })),
                notes: notes.trim() || undefined,
                client: {
                    submittedAt: new Date().toISOString(),
                },
            };

            const { error } = await supabase.from('feedback_reports').insert({
                user_id: uid,
                responses: payload,
            });

            if (error) {
                setStatus(error.message);
                setSending(false);
                return;
            }

            setStatus('Relatório enviado.');
            window.setTimeout(() => {
                setSending(false);
                onClose();
            }, 700);
        } catch (e: any) {
            setStatus(e?.message || 'Falha ao enviar.');
            setSending(false);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider accent-text">Relatório de Inteligência Beta</div>
                            <div className="text-[10px] text-gray-500">ID: {userProfile.nickname}</div>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                    </div>

                    <div className="space-y-5 max-h-[62vh] overflow-y-auto pr-1">
                        {feedbackQuestions.map(q => {
                            const v = answers[q.id] ?? 3;
                            return (
                                <div key={q.id} className="bg-black/20 border border-white/10 rounded-2xl p-3 space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="text-[10px] font-black tracking-widest text-gray-500">{q.category.toUpperCase()}</div>
                                            <div className="text-sm font-bold text-white">{q.id}. {q.label}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black accent-text">{v.toFixed(1)}</div>
                                            <div className="text-[10px] font-bold text-gray-400">{getSovereignLabel(v)}</div>
                                        </div>
                                    </div>

                                    <SovereignSlider value={v} onChange={(next) => setAnswers(prev => ({ ...prev, [q.id]: next }))} />
                                    <div className="text-xs text-gray-400">{getSovereignPhrase(q.id, v)}</div>
                                </div>
                            );
                        })}

                        <div className="bg-black/20 border border-white/10 rounded-2xl p-3 space-y-2">
                        <div className="text-xs font-bold text-gray-400">Observações Táticas (Bugs ou Ideias)</div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={5}
                                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] text-sm"
                                placeholder="Descreva o bug, a ideia ou o ajuste que você quer ver no campo."
                            />
                        </div>
                    </div>

                    {status && (
                        <div className={`text-center text-xs ${sending ? 'text-[var(--skin-accent-color)] animate-pulse' : 'text-gray-400'}`}>{status}</div>
                    )}

                    <button
                        onClick={sendReport}
                        disabled={sending}
                        className="w-full py-3 rounded-xl luxe-skin-button disabled:opacity-60"
                    >
                        {sending ? 'ENVIANDO DADOS PARA O QG...' : 'ENVIAR RELATÓRIO'}
                    </button>
                </GlassCard>
            </div>
        </Portal>
    );
};

const NobrezaHierarchyView: React.FC = () => {
    const { userProfile, nobilityRanks } = useGame();
    const currentRank = nobilityRanks.find(r => r.id === userProfile.nobility.rankId);
    const nextRankIndex = nobilityRanks.findIndex(r => r.id === userProfile.nobility.rankId) + 1;
    const nextRank = nobilityRanks[nextRankIndex];
    const expForCurrentRank = currentRank?.expTotalRequired || 0;
    const expForNextRank = nextRank?.expTotalRequired || expForCurrentRank;
    const progressInRank = userProfile.nobility.exp - expForCurrentRank;
    const expToNextRank = expForNextRank - expForCurrentRank;
    const progressPercentage = expToNextRank > 0 ? (progressInRank / expToNextRank) * 100 : 100;

    return (
        <div className="space-y-6">
            <GlassCard variant="accent" className="text-center">
                <p className="text-sm uppercase tracking-wider" style={{ color: 'var(--ui-card-text-soft)' }}>NOBREZA</p>
                <h2 className="text-3xl font-black" style={{ color: 'var(--ui-card-text)' }}>{currentRank?.name || 'Vagante'}</h2>
                <div className="mt-4">
                    <div className="flex justify-between text-xs font-bold" style={{ color: 'var(--ui-card-text-soft)' }}>
                        <span>XP ATUAL: {userProfile.nobility.exp.toLocaleString('pt-BR')}</span>
                        <span>{nextRank ? `PRÓXIMO: ${nextRank.expTotalRequired.toLocaleString('pt-BR')} XP` : 'Topo'}</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2.5 mt-1">
                        <div className="bg-[var(--skin-accent-color)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] font-bold" style={{ color: 'var(--ui-card-text-soft)' }}>
                        <span>{currentRank ? `${currentRank.expTotalRequired.toLocaleString('pt-BR')} XP (patente)` : ''}</span>
                        <span>{nextRank ? `${nextRank.expTotalRequired.toLocaleString('pt-BR')} XP (próxima)` : 'Topo'}</span>
                    </div>
                </div>
            </GlassCard>
            <div>
                <h3 className="mb-2 text-lg font-bold tracking-wider" style={{ color: 'var(--ui-card-text)' }}>Hierarquia da Nobreza</h3>
                <div className="space-y-2">
                    {nobilityRanks.map(rank => (
                        <GlassCard key={rank.id} variant="neutral" className={`p-3 ${rank.id === currentRank?.id ? 'ring-2 ring-[var(--skin-accent-color)]' : 'opacity-70'}`}>
                            <div className="flex justify-between items-center">
                                <span className="font-bold" style={{ color: 'var(--ui-card-text)' }}>{rank.name}</span>
                                <span className="text-sm" style={{ color: 'var(--ui-card-text-soft)' }}>{rank.expTotalRequired.toLocaleString('pt-BR')} XP</span>
                            </div>
                            <div className="mt-1 flex justify-between items-center text-[10px] font-bold" style={{ color: 'var(--ui-card-text-soft)' }}>
                                <span>{rank.expTotalRequired.toLocaleString('pt-BR')} XP total</span>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
};

const GeralTab: React.FC = () => {
    const { userProfile, updateUserProfile, nobilityRanks, assets, showToast } = useGame();
    const { isTutorialActive, currentStep } = useTutorial();
    const [nickname, setNickname] = useState(() => userProfile.nickname);
    const [isHierarchyVisible, setIsHierarchyVisible] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [showMastery, setShowMastery] = useState(false);

    const handleSave = () => { updateUserProfile({ nickname }); alert("Perfil salvo!"); };

    const handleLogout = async () => {
        // Clear user-specific local storage
        if (userProfile.id) {
            localStorage.removeItem(`${STORAGE_KEY_PROFILE}_${userProfile.id}`);
            localStorage.removeItem(`${STORAGE_KEY_ASSET_LEVELS}_${userProfile.id}`);
        }

        await signOutAndClearSupabaseSession('global');

        // Force reload to clear in-memory state and reset context
        window.location.reload();
    };

    const handleDeleteAccount = async () => {
        const confirmation = window.prompt('Digite DELETAR para excluir sua conta permanentemente.');
        if (confirmation === null) return;

        if (confirmation.trim().toUpperCase() !== 'DELETAR') {
            showToast('Exclusão cancelada. Digite DELETAR para confirmar.', 'info');
            return;
        }

        setShowDeleteConfirm(false);
        setIsDeletingAccount(true);

        const result = await SupabaseService.deleteMyAccount({
            blockReentry: true,
            reason: 'user_requested_account_deletion',
        });
        if (!result.success) {
            setIsDeletingAccount(false);
            showToast(result.error || 'Não foi possível excluir a conta.', 'error');
            return;
        }

        if (userProfile.id) {
            localStorage.removeItem(`${STORAGE_KEY_PROFILE}_${userProfile.id}`);
            localStorage.removeItem(`${STORAGE_KEY_ASSET_LEVELS}_${userProfile.id}`);
        }

        clearSupabaseSessionStorage();
        await signOutAndClearSupabaseSession('local');

        showToast('Conta excluída. Encerrando sessão...', 'success');
        window.setTimeout(() => window.location.reload(), 900);
    };

    const currentRank = nobilityRanks.find(r => r.id === userProfile.nobility.rankId);
    const nextRankIndex = nobilityRanks.findIndex(r => r.id === userProfile.nobility.rankId) + 1;
    const nextRank = nobilityRanks[nextRankIndex];
    const expForCurrentRank = currentRank?.expTotalRequired || 0;
    const expForNextRank = nextRank?.expTotalRequired || expForCurrentRank;
    const progressInRank = userProfile.nobility.exp - expForCurrentRank;
    const expToNextRank = expForNextRank - expForCurrentRank;
    const progressPercentage = expToNextRank > 0 ? (progressInRank / expToNextRank) * 100 : 100;

    const masteryTotalLevel = assets
        .filter(a => a.id !== 'geral')
        .reduce((sum, a) => sum + (a.level === 0 ? 1 : (a.level || 1)), 0);

    useEffect(() => {
        // Listener for Tutorial Mastery Quiz Trigger (Step 11)
        const handleOpenMastery = () => {
            console.log('SettingsView: Received Mastery Quiz Trigger');
            setShowMastery(true);
        };
        window.addEventListener('tutorialOpenMasteryQuiz', handleOpenMastery);

        // Robustness: If we just mounted and we are already at step 11, open it
        if (isTutorialActive && currentStep === 11) {
            setShowMastery(true);
        }

        return () => window.removeEventListener('tutorialOpenMasteryQuiz', handleOpenMastery);
    }, [isTutorialActive, currentStep]);

    if (isHierarchyVisible) return (<div><button onClick={() => setIsHierarchyVisible(false)} className="mb-4 text-sm font-bold text-gray-400 hover:text-white">&larr; Voltar</button><NobrezaHierarchyView /></div>);

    return (
        <div className="space-y-6">
            {/* Legacy mode-game block removed
            <GlassCard variant="neutral" className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Modo Jogo</h3>
                    <div className={`text-[10px] px-2 py-0.5 rounded font-mono ${appMode === 'GAME' ? 'bg-[var(--skin-accent-color)]/15 text-[var(--ui-text-accent)]' : 'bg-white/10 text-gray-300'}`}>{appMode === 'GAME' ? 'LIGADO' : 'DESLIGADO'}</div>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-500">O core fica sempre ligado. O Modo Jogo adiciona quests, patentes, baús, inventário, Hall da Fama e soberano.</p>

                <div className="flex gap-2">
                    <button
                        onClick={() => setAppMode('BASIC')}
                        className={`flex-1 py-3 px-2 rounded-xl font-bold transition-all relative overflow-hidden group ${appMode === 'BASIC' ? 'bg-white text-black shadow-lg ring-1 ring-white/50' : 'bg-black/40 text-gray-500 hover:bg-white/5 border border-white/5'}`}
                    >
                        <div className="relative z-10 flex flex-col items-center">
                            <span className="text-xl mb-1">🎮</span>
                            <span className="text-xs tracking-widest">DESLIGADO</span>
                        </div>
                        {appMode === 'BASIC' && <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />}
                    </button>

                    <button
                        onClick={() => setAppMode('GAME')}
                        className={`flex-1 py-3 px-2 rounded-xl font-bold transition-all relative overflow-hidden ${appMode === 'GAME' ? 'bg-[var(--skin-accent-color)] text-black shadow-[0_0_15px_var(--sephirot-glow-color)] ring-1 ring-white/20' : 'bg-black/40 text-gray-500 hover:bg-white/5 border border-white/5'}`}
                    >
                        <div className="relative z-10 flex flex-col items-center">
                            <span className="text-xl mb-1">💼</span>
                            <span className="text-xs tracking-widest">LIGADO</span>
                        </div>
                        {appMode === 'GAME' && <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />}
                    </button>
                </div>

                <div className="pt-3 border-t border-white/5 animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Tema Visual</h4>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                            {activeTheme === 'LIGHT' ? 'Modo claro' : 'Modo escuro'}
                        </span>
                    </div>
                    <div className="flex gap-2 p-1 bg-black/20 rounded-lg mb-4">
                        <button
                            onClick={() => activeTheme !== 'LIGHT' && toggleTheme()}
                            className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${activeTheme === 'LIGHT' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            MODO CLARO
                        </button>
                        <button
                            onClick={() => activeTheme !== 'DARK' && toggleTheme()}
                            className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${activeTheme === 'DARK' ? 'bg-slate-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            MODO ESCURO
                        </button>
                    </div>
                </div>
            </GlassCard>
            */}

            <button
                type="button"
                id="mastery-sliders-button"
                onClick={() => setShowMastery(true)}
                className="block w-full text-left"
            >
                <GlassCard variant="neutral" className="relative overflow-hidden border-[var(--skin-accent-color)]/18 p-4 transition-all duration-300 hover:border-[var(--skin-accent-color)]/38 hover:bg-white/[0.03] hover:shadow-[0_0_24px_var(--sephirot-glow-color-soft)]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.18),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_48%)] pointer-events-none" />
                    <div className="relative grid grid-cols-[minmax(0,1fr)_8.75rem] items-center gap-3">
                        <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[var(--skin-accent-color)]/25 bg-[var(--skin-accent-color)]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--ui-text-accent)]">
                                    Maestria
                                </span>
                                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/55">
                                    Editar nivel
                                </span>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Seu nivel geral</div>
                                <div className="mt-1 flex items-end gap-2">
                                    <span className="text-4xl font-black leading-none text-white">{masteryTotalLevel}</span>
                                    <span className="pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--skin-accent-color)]">Legado</span>
                                </div>
                            </div>
                            <p className="max-w-[18rem] text-[11px] leading-relaxed text-gray-400">
                                Toque aqui para ajustar seu nivel por area e atualizar o mapa de maestria.
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <div className="flex h-[8.75rem] w-[8.75rem] items-center justify-center rounded-[1.6rem] border border-[var(--skin-accent-color)]/16 bg-black/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_24px_rgba(0,0,0,0.22)]">
                                <div className="h-[7.5rem] w-[7.5rem]">
                                    <Suspense fallback={<div className="h-full w-full rounded-full bg-white/5" />}>
                                        <AssetDecagon assets={assets} size="100%" />
                                    </Suspense>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </button>

            <GlassCard variant="accent" className="text-center cursor-pointer relative overflow-hidden group shadow-[0_0_20px_var(--sephirot-glow-color-soft)]" onClick={() => setIsHierarchyVisible(true)} id="profile-section">
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--sephirot-glow-color,rgba(0,0,0,0))] to-black/60 pointer-events-none" />
                <div className="relative z-10 p-2">
                    <p className="mb-1 text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--ui-card-text-soft)' }}>Sua Patente</p>
                    <h2 className="text-3xl font-black drop-shadow-lg tracking-tighter" style={{ color: 'var(--ui-card-text)' }}>{currentRank?.name || 'Vagante'}</h2>

                    <div className="mt-6 px-2">
                        <div className="mb-2 flex justify-between text-[10px] font-bold tracking-wider" style={{ color: 'var(--ui-card-text-soft)' }}>
                            <span>XP ATUAL: {userProfile.nobility.exp.toLocaleString('pt-BR')}</span>
                            <span>{nextRank ? `PRÓXIMO: ${nextRank.expTotalRequired.toLocaleString('pt-BR')}` : 'MÁXIMO'}</span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-3 p-0.5 border border-white/5">
                            <div className="bg-[var(--skin-accent-color)] h-full rounded-full transition-all duration-700 shadow-[0_0_10px_var(--sephirot-glow-color)]" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {false && (<div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-wider">Maestria</h2>
                    <button
                        id="mastery-sliders-button"
                        onClick={() => setShowMastery(true)}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
                    >
                        Abrir sliders
                    </button>
                </div>

                <GlassCard variant="neutral" className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Seu nível</div>
                            <div className="text-2xl font-black text-white">{masteryTotalLevel}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500">Legado / Soberano</div>
                            <div className="text-xs text-gray-400">Editar por área ao abrir</div>
                        </div>
                    </div>
                </GlassCard>
            </div>)}

            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                    <label className="text-sm font-semibold">Nickname</label>
                    <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="px-3 py-1 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:border-[var(--skin-accent-color)] transition-colors w-40 text-right" />
                </div>
                <div className="flex space-x-2">
                    <button onClick={handleSave} className="w-1/2 py-3 rounded-xl luxe-skin-button transition-transform hover:scale-105">SALVAR PERFIL</button>
                    <button onClick={handleLogout} className="w-1/2 py-3 rounded-xl bg-red-900/50 text-red-300 hover:bg-red-800/80 shadow-[0_0_8px_rgba(255,50,50,0.3)] transition-all">SAIR</button>
                </div>
            </div>

            <div className="text-center pt-4">
                <button onClick={() => setShowDeleteConfirm(true)} disabled={isDeletingAccount} className={`text-red-500 hover:text-red-400 text-sm font-semibold ${isDeletingAccount ? 'opacity-50 cursor-wait' : ''}`}>{isDeletingAccount ? 'Excluindo conta...' : 'Deletar Conta'}</button>
            </div>

            {showDeleteConfirm && (
                <ConfirmationModal
                    title="Deletar Conta"
                    message="Tem certeza? Esta ação é irreversível."
                    onConfirm={handleDeleteAccount}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}

            {showMastery && (
                <Portal>
                    <div className="fixed inset-0 z-[10000] flex flex-col animate-fade-in overflow-hidden">
                        <Suspense fallback={<div className="flex-1 bg-black" />}>
                            <MasteryView onClose={() => setShowMastery(false)} />
                        </Suspense>
                    </div>
                </Portal>
            )}
        </div>
    );
};

const PreferenciasTab: React.FC = () => {
    const { userProfile, oraclePreferences, updateOraclePreferences, updateUserProfile, appMode, setAppMode, activeTheme, toggleTheme, inventory, setCurrentSkin, showToast } = useGame();
    const [modal, setModal] = useState<'oracle' | 'tutorial' | 'privacy' | 'ui' | 'primer' | 'redeem' | null>(null);
    const [isFeedbackOpen, setFeedbackOpen] = useState(false);
    const [highlightModeGame, setHighlightModeGame] = useState(false);
    const modeGameRef = useRef<HTMLDivElement | null>(null);
    const normalizeAssetsVisibilityOption = (value?: ProfileVisibilityScope): ProfileVisibilityOption => {
        if (value === 'all' || value === 'friends' || value === 'nobody') return value;
        return 'nobody';
    };
    const normalizeMasteryVisibilityOption = (value?: ProfileVisibilityScope): ProfileVisibilityOption => {
        if (value === 'all' || value === 'friends' || value === 'nobody') return value;
        return 'friends';
    };
    const normalizeFeatsVisibilityOption = (value?: ProfileVisibilityScope): ProfileVisibilityOption => {
        if (value === 'all' || value === 'friends' || value === 'nobody') return value;
        return 'friends';
    };
    const normalizeGardenVisibilityOption = (value?: ProfileVisibilityScope): ProfileVisibilityOption => {
        if (value === 'all' || value === 'friends' || value === 'nobody') return value;
        return 'friends';
    };

    const [assetsVisibility, setAssetsVisibility] = useState<ProfileVisibilityOption>(
        normalizeAssetsVisibilityOption(userProfile.assetsVisibility)
    );
    const [masteryVisibility, setMasteryVisibility] = useState<ProfileVisibilityOption>(
        normalizeMasteryVisibilityOption(userProfile.masteryVisibility)
    );
    const [featsVisibility, setFeatsVisibility] = useState<ProfileVisibilityOption>(
        normalizeFeatsVisibilityOption(userProfile.featsVisibility)
    );
    const [gardenVisibility, setGardenVisibility] = useState<ProfileVisibilityOption>(
        normalizeGardenVisibilityOption(userProfile.gardenVisibility)
    );

    useEffect(() => {
        const handleTutorialOracle = (e: any) => {
            if (e.detail?.open !== undefined) {
                setModal(e.detail.open ? 'oracle' : null);
            }
        };
        const handleTutorialReturn = () => {
            setModal('tutorial');
        };
        window.addEventListener('tutorialOracleSettings', handleTutorialOracle);
        window.addEventListener('tutorialSettingsOpenModal', handleTutorialReturn);
        return () => {
            window.removeEventListener('tutorialOracleSettings', handleTutorialOracle);
            window.removeEventListener('tutorialSettingsOpenModal', handleTutorialReturn);
        };
    }, []);

    const activeModeName = oraclePreferences?.activeMode ? (oraclePreferences.activeMode.charAt(0).toUpperCase() + oraclePreferences.activeMode.slice(1)) : 'Neutro';
    const completedFlags = userProfile.completedSeasonMissions || [];
    const termsStatus = completedFlags.includes(PROFILE_FLAG_TERMS_ACCEPTED) ? 'Aceito' : 'Pendente';
    const tutorialStatus = completedFlags.includes(PROFILE_FLAG_TUTORIAL_COMPLETED) ? 'Assistido' : 'Pendente';
    const uiSkinCatalog = useMemo(() => {
        const byId = new Map(getCatalogItemsByCategory('ui_skin').map((item) => [item.id, item]));
        return UI_SKIN_SELECTOR_ORDER.flatMap((id) => {
            const item = byId.get(id);
            return item ? [item] : [];
        });
    }, []);
    const unlockedUiSkinIds = useMemo(() => {
        const unlocked = new Set<string>(['BASIC', userProfile.skin || 'BASIC']);
        Object.entries(userProfile.unlockedItems?.ui_skins || {}).forEach(([skinId, isUnlocked]) => {
            if (isUnlocked) unlocked.add(skinId);
        });
        inventory.forEach((item) => unlocked.add(item.id));
        return unlocked;
    }, [inventory, userProfile.skin, userProfile.unlockedItems]);
    const effectiveUiSkinId = appMode === 'BASIC' ? 'BASIC' : (userProfile.skin || 'BASIC');
    const currentUiSkinName = useMemo(() => {
        const selectedSkin = uiSkinCatalog.find((skin) => skin.id === effectiveUiSkinId);
        if (!selectedSkin) return appMode === 'BASIC' ? 'Basica' : 'Tema atual';
        return selectedSkin.name.replace(/^Tema:\s*/i, '').replace(/^Interface\s*/i, '');
    }, [appMode, effectiveUiSkinId, uiSkinCatalog]);
    const uiPreferencesSummary = `${currentUiSkinName} · ${activeTheme === 'LIGHT' ? 'Claro' : 'Escuro'}`;
    const modeGameSummary = appMode === 'GAME'
        ? 'Itens, missões, grupo casual e temas de UI.'
        : 'Apenas o necessário para produtividade.';

    useEffect(() => {
        setAssetsVisibility(normalizeAssetsVisibilityOption(userProfile.assetsVisibility));
        setMasteryVisibility(normalizeMasteryVisibilityOption(userProfile.masteryVisibility));
        setFeatsVisibility(normalizeFeatsVisibilityOption(userProfile.featsVisibility));
        setGardenVisibility(normalizeGardenVisibilityOption(userProfile.gardenVisibility));
    }, [userProfile.assetsVisibility, userProfile.masteryVisibility, userProfile.featsVisibility, userProfile.gardenVisibility]);

    useEffect(() => {
        const handleFocusModeGame = () => {
            modeGameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setHighlightModeGame(true);
            window.setTimeout(() => setHighlightModeGame(false), 1800);
        };

        window.addEventListener('tutorialFocusModeGame', handleFocusModeGame);
        return () => window.removeEventListener('tutorialFocusModeGame', handleFocusModeGame);
    }, []);

    const handleAssetsVisibilityChange = (value: ProfileVisibilityOption) => {
        setAssetsVisibility(value);
        updateUserProfile({ assetsVisibility: value });
    };

    const handleMasteryVisibilityChange = (value: ProfileVisibilityOption) => {
        setMasteryVisibility(value);
        updateUserProfile({ masteryVisibility: value });
    };

    const handleFeatsVisibilityChange = (value: ProfileVisibilityOption) => {
        setFeatsVisibility(value);
        updateUserProfile({ featsVisibility: value });
    };

    const handleGardenVisibilityChange = (value: ProfileVisibilityOption) => {
        setGardenVisibility(value);
        updateUserProfile({ gardenVisibility: value });
    };

    const handleRedeemCode = async (code: string) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;
        if (!userId) {
            throw new Error('Sua sessao nao foi encontrada para resgatar o codigo.');
        }

        const result = await SupabaseService.redeemRewardCode(code, userId);
        if (!result.success) {
            throw new Error(result.error || 'Nao consegui resgatar esse codigo agora.');
        }

        const { data: profileRow, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!profileError && profileRow) {
            const profile = mapDbProfileToUserProfile(profileRow);
            updateUserProfile({
                wallet: profile.wallet,
                isPremium: profile.isPremium,
                premiumExpiresAt: profile.premiumExpiresAt,
                subscriptionTier: profile.subscriptionTier,
                chests: profile.chests,
                unlockedItems: profile.unlockedItems,
                unlockedSkins: profile.unlockedSkins,
                completedSeasonMissions: profile.completedSeasonMissions,
                legacyProjectionSceneCredits: profile.legacyProjectionSceneCredits,
                campaignQuizFreeCredits: profile.campaignQuizFreeCredits,
                campaignQuizMediumCredits: profile.campaignQuizMediumCredits,
                vanguardWelcomePending: profile.vanguardWelcomePending,
                vanguardWelcomePayload: profile.vanguardWelcomePayload,
                vanguardWelcomeShownAt: profile.vanguardWelcomeShownAt,
            });
        }

        showToast(result.rewardSummary || `Codigo "${result.code}" resgatado.`, 'success');
    };

    const handleUiSkinOptionClick = (skinId: string, unlocked: boolean, disabledByMode: boolean) => {
        if (disabledByMode) return;
        if (!unlocked) {
            window.dispatchEvent(new CustomEvent('navigate-to-store', { detail: { tab: 'items' } }));
            return;
        }
        setCurrentSkin(skinId);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Grupo Geral */}
            <section className="space-y-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1 border-b border-white/5 pb-2">Preferências</h2>
                <div className="space-y-2">
                    <div
                        id="mode-game-toggle"
                        ref={modeGameRef}
                        className={`transition-all duration-300 ${highlightModeGame ? 'scale-[1.01]' : ''}`}
                    >
                        <GlassCard
                            variant="neutral"
                            className={`p-4 space-y-3 ${highlightModeGame ? 'ring-1 ring-[var(--skin-accent-color)] shadow-[0_0_24px_var(--sephirot-glow-color-soft)]' : ''}`}
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Modo Jogo</h3>
                                <div className={`text-[10px] px-2 py-0.5 rounded font-mono ${appMode === 'GAME' ? 'bg-[var(--skin-accent-color)]/15 text-[var(--ui-text-accent)]' : 'bg-white/10 text-gray-300'}`}>{appMode === 'GAME' ? 'LIGADO' : 'DESLIGADO'}</div>
                            </div>

                            <div className="flex gap-2 p-1 bg-black/20 rounded-lg">
                                <button
                                    onClick={() => setAppMode('BASIC')}
                                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${appMode === 'BASIC' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    MODO BÁSICO
                                </button>

                                <button
                                    onClick={() => setAppMode('GAME')}
                                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${appMode === 'GAME' ? 'bg-[var(--skin-accent-color)] text-black shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    MODO JOGO
                                </button>
                            </div>

                            <p className="text-[11px] leading-relaxed text-gray-400">
                                {modeGameSummary}
                            </p>

                        </GlassCard>
                    </div>
                    <SettingSelector label="Interface & Som" value={currentUiSkinName} onClick={() => setModal('ui')} />
                    <div id="oracle-preferences-setting">
                        <SettingSelector label="Oráculo & Alertas" value={activeModeName} onClick={() => setModal('oracle')} />
                    </div>
                    <SettingSelector label="Privacidade" value={termsStatus} onClick={() => setModal('privacy')} />
                    <SettingSelector label="Tutoriais" value={tutorialStatus} onClick={() => setModal('tutorial')} />
                </div>
            </section>

            {/* Grupo Feedback */}
            <section className="space-y-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1 border-b border-white/5 pb-2">Suporte</h2>
                <SettingSelector label="Resgatar codigo" value="Tenho um codigo" onClick={() => setModal('redeem')} />
                <button
                    onClick={() => setFeedbackOpen(true)}
                    className="w-full py-4 rounded-xl border border-white/10 bg-black/20 hover:bg-black/30 font-bold text-xs tracking-widest accent-text flex items-center justify-center gap-2 transition-all"
                >
                    <span>📊</span> ENVIAR FEEDBACK BETA
                </button>
            </section>

            {modal === 'ui' && (
                <UiPreferencesModal
                    open
                    appMode={appMode}
                    activeTheme={activeTheme}
                    toggleTheme={toggleTheme}
                    uiSkinCatalog={uiSkinCatalog}
                    unlockedUiSkinIds={unlockedUiSkinIds}
                    effectiveUiSkinId={effectiveUiSkinId}
                    oraclePreferences={oraclePreferences}
                    updateOraclePreferences={updateOraclePreferences}
                    onUiSkinOptionClick={handleUiSkinOptionClick}
                    onClose={() => setModal(null)}
                />
            )}
            {modal === 'oracle' && <OracleSettingsModal onClose={() => setModal(null)} variant="preferences" />}

            {modal === 'tutorial' && <TutorialSettingsModal onClose={() => setModal(null)} />}
            {modal === 'privacy' && (
                <PrivacyPreferencesModal
                    open
                    termsStatus={termsStatus}
                    assetsVisibility={assetsVisibility}
                    masteryVisibility={masteryVisibility}
                    featsVisibility={featsVisibility}
                    gardenVisibility={gardenVisibility}
                    onAssetsVisibilityChange={handleAssetsVisibilityChange}
                    onMasteryVisibilityChange={handleMasteryVisibilityChange}
                    onFeatsVisibilityChange={handleFeatsVisibilityChange}
                    onGardenVisibilityChange={handleGardenVisibilityChange}
                    onClose={() => setModal(null)}
                />
            )}
            {modal === 'redeem' && (
                <RedeemCodeModal
                    open
                    onClose={() => setModal(null)}
                    onRedeem={handleRedeemCode}
                />
            )}
            {isFeedbackOpen && <FeedbackBetaModal onClose={() => setFeedbackOpen(false)} />}
        </div>
    );
};

const LegacyPremiumTab: React.FC = () => {
    const { userProfile, oraclePreferences } = useGame();
    const [isLinksOpen, setLinksOpen] = useState(false);
    const [isOracleSettingsOpen, setOracleSettingsOpen] = useState(false);
    const [showCampaignsCodex, setShowCampaignsCodex] = useState(false);
    const [isOracleChatOpen, setOracleChatOpen] = useState(false);
    const [isCodexOpen, setCodexOpen] = useState(false);
    const isPremium = hasPremiumAccess(userProfile);
    const isIAEnabled = oraclePreferences?.iaEnabled ?? true;

    // Debug logs
    useEffect(() => {
        if (isOracleSettingsOpen) console.log("PremiumTab: Oracle Settings opened");
        if (isOracleChatOpen) console.log("PremiumTab: Oracle Chat opened");
    }, [isOracleSettingsOpen, isOracleChatOpen]);

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1 border-b border-[var(--skin-accent-color)]/20 pb-2">
                    <h2 className="text-sm font-bold accent-text uppercase tracking-widest">Premium</h2>
                    {!isPremium && <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">BLOQUEADO</span>}
                </div>

                <GlassCard variant="neutral" className="p-4 space-y-3">
                    <div id="premium-features-grid" className="grid grid-cols-2 gap-3">
                        <button
                            id="links-button"
                            onClick={() => setLinksOpen(true)}
                            className={`p-4 rounded-xl bg-black/40 border border-white/10 hover:border-[var(--skin-accent-color)]/50 transition-all flex flex-col items-center gap-2 text-center group aspect-square justify-center`}
                        >
                            <span className="text-3xl group-hover:scale-110 transition-transform">🔗</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 group-hover:text-white">Vínculos</span>
                            {!isPremium && <span className="text-[8px] text-[var(--skin-accent-color)] opacity-70">Convites</span>}
                        </button>
                        <button
                            id="codex-button"
                            onClick={() => setCodexOpen(true)}
                            className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-[var(--skin-accent-color)]/50 transition-all flex flex-col items-center gap-2 text-center group aspect-square justify-center"
                        >
                            <span className="text-3xl group-hover:scale-110 transition-transform">📜</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 group-hover:text-white">Biblioteca</span>
                        </button>
                        <button
                            id="assistant-button"
                            onClick={() => {
                                // Open Settings/Config for everyone
                                console.log("PremiumTab: Assistant button clicked -> Opening Settings");
                                setOracleSettingsOpen(true);
                            }}
                            className={`p-4 rounded-xl bg-black/40 border border-white/10 hover:border-[var(--skin-accent-color)]/50 transition-all flex flex-col items-center gap-2 text-center group aspect-square justify-center`}
                        >
                            <span className="text-3xl group-hover:scale-110 transition-transform">🤖</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 group-hover:text-white">
                                Assistente
                            </span>
                        </button>
                        <button
                            id="campaigns-button"
                            onClick={() => setShowCampaignsCodex(true)}
                            disabled={!isPremium}
                            className={`p-4 rounded-xl bg-black/40 border border-white/10 hover:border-[var(--skin-accent-color)]/50 transition-all flex flex-col items-center gap-2 text-center group aspect-square justify-center ${!isPremium ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                        >
                            <span className="text-3xl group-hover:scale-110 transition-transform">🎯</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 group-hover:text-white">Campanhas</span>
                        </button>
                    </div>
                    {!isPremium && (
                        <div className="text-center pt-2">
                            <p className="text-xs text-gray-400">Ative o Premium para desbloquear.</p>
                        </div>
                    )}
                </GlassCard>
            </section>
            {isLinksOpen && <RelationshipHubModal onClose={() => setLinksOpen(false)} />}

            {isOracleSettingsOpen && (
                <OracleSettingsModal
                    variant="assistant"
                    onClose={() => setOracleSettingsOpen(false)}
                    onOpenChat={() => {
                        if (!isIAEnabled) {
                            alert("Ative a IA na aba Geral para usar o Chat.");
                            // Re-open settings so they can enable it? 
                            // Or just let them figure it out. 
                            // Since the modal closes on button click, we might want to re-open it here if we really wanted to be helpful, 
                            // but let's stick to simple alert for now.
                        } else {
                            setOracleChatOpen(true);
                        }
                    }}
                />
            )}

            {isOracleChatOpen && (
                <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />}>
                    <OracleChat onClose={() => setOracleChatOpen(false)} />
                </Suspense>
            )}

            {isCodexOpen && <CodexListModal onClose={() => setCodexOpen(false)} />}
            {showCampaignsCodex && (
                <Suspense fallback={<div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" />}>
                    <CampaignsCodex onClose={() => setShowCampaignsCodex(false)} />
                </Suspense>
            )}
        </div>
    );
};

const PremiumTab: React.FC = () => {
    const { userProfile } = useGame();
    const [selectedMembership, setSelectedMembership] = useState<{
        tier: 'premium' | 'platinum';
        productId: 'premium_30d' | 'platinum_30d';
        amount: number;
        name: string;
        equivalentGold: number;
    } | null>(null);
    const [showAllPremiumBenefits, setShowAllPremiumBenefits] = useState(false);
    const [showAllPlatinumBenefits, setShowAllPlatinumBenefits] = useState(false);
    const isPremium = hasPremiumAccess(userProfile);
    const isPlatinum = hasPlatinumAccess(userProfile);
    const isBasicMode = (userProfile.appMode || 'GAME') !== 'GAME';
    const activeMembershipTier = getActiveSubscriptionTier(userProfile);
    const premiumLabel = isPremium ? 'ATIVO' : 'DISPONÍVEL';
    const premiumDaysRemaining = getPremiumDaysRemaining(userProfile);
    const premiumBenefits = [
        'Até 15 arenas ativas',
        'Fundos premium de perfil e ativos',
        'Todos os modos do Oráculo',
        'Cena do legado com 50% off',
        'Bônus de legado +10% XP',
        '1 baú raro + 1 ficha grátis por renovação',
    ];
    const platinumBenefits = [
        'Todas as vantagens do Premium',
        'Até 30 arenas ativas',
        '1 cena de legado grátis por renovação',
        '1 ficha média de quiz por renovação',
        'Todos os planos de fundo e aparências premium',
        '1 baú da Temporada + 1 baú raro por renovação',
    ];
    const visiblePremiumBenefits = useMemo(
        () => (isBasicMode && !showAllPremiumBenefits ? premiumBenefits.slice(0, BASIC_MEMBERSHIP_BENEFIT_LIMIT) : premiumBenefits),
        [isBasicMode, premiumBenefits, showAllPremiumBenefits],
    );
    const visiblePlatinumBenefits = useMemo(
        () => (isBasicMode && !showAllPlatinumBenefits ? platinumBenefits.slice(0, BASIC_MEMBERSHIP_BENEFIT_LIMIT) : platinumBenefits),
        [isBasicMode, platinumBenefits, showAllPlatinumBenefits],
    );
    const hiddenPremiumCount = Math.max(0, premiumBenefits.length - visiblePremiumBenefits.length);
    const hiddenPlatinumCount = Math.max(0, platinumBenefits.length - visiblePlatinumBenefits.length);
    const [premiumBenefitLeft, premiumBenefitRight] = useMemo(() => splitBenefitsIntoColumns(visiblePremiumBenefits), [visiblePremiumBenefits]);
    const [platinumBenefitLeft, platinumBenefitRight] = useMemo(() => splitBenefitsIntoColumns(visiblePlatinumBenefits), [visiblePlatinumBenefits]);
    const premiumExpiresLabel = userProfile.premiumExpiresAt
        ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(userProfile.premiumExpiresAt))
        : null;
    const premiumStatusCopy = isPremium
        ? premiumDaysRemaining != null
            ? `Expira em ${premiumDaysRemaining} dia${premiumDaysRemaining === 1 ? '' : 's'}`
            : premiumExpiresLabel
                ? `Válido até ${premiumExpiresLabel}`
                : null
        : '30 dias por ativação';
    const platinumStatusCopy = isPlatinum
        ? premiumDaysRemaining != null
            ? `Expira em ${premiumDaysRemaining} dia${premiumDaysRemaining === 1 ? '' : 's'}`
            : premiumExpiresLabel
                ? `Válido até ${premiumExpiresLabel}`
                : null
        : '30 dias por ativação';
    const premiumActionLabel = isPlatinum ? 'Platinum ativo' : isPremium ? 'Estender premium' : 'Ativar premium';
    const platinumActionLabel = isPlatinum ? 'Estender platinum' : activeMembershipTier === 'premium' ? 'Subir para platinum' : 'Ativar platinum';
    const isPremiumExpiringSoon = isPremium && premiumDaysRemaining != null && premiumDaysRemaining <= 7;
    const moneyCheckoutSalesCopy = getMoneyCheckoutSalesCopy();

    return (
        <>
        <div className="space-y-8 animate-fade-in pb-10">
            <section className="space-y-4">
                <div className="flex items-center px-1 border-b border-[var(--skin-accent-color)]/20 pb-2">
                    <h2 className="text-sm font-bold accent-text uppercase tracking-widest">Premium</h2>
                </div>

                <GlassCard variant="neutral" className="relative overflow-hidden border-[var(--ui-border-accent-soft)]">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-yellow-900/20 via-yellow-500/5 to-transparent" />
                    <div className="relative z-10 space-y-3 p-4">
                        <div className="flex items-start gap-3">
                            <div className="rounded-full border border-[var(--ui-border-accent)] bg-[var(--ui-core-surface-strong-bg)] p-3 shadow-[0_0_20px_var(--ui-button-primary-glow)]">
                                <CrownIcon className="h-6 w-6 text-[var(--ui-text-accent)]" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <h3 className="text-xl font-black uppercase tracking-[0.06em] text-[color:var(--ui-card-text)]">Premium</h3>
                                    <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${isPremium ? 'border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/12 text-[var(--ui-text-accent)]' : 'border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] text-[color:var(--ui-card-text-soft)]'}`}>
                                        {premiumLabel}
                                    </div>
                                </div>
                                {premiumStatusCopy && (
                                    <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isPremiumExpiringSoon ? 'text-red-200/88' : 'text-[color:var(--ui-card-text-soft)]'}`}>
                                        {premiumStatusCopy}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {[premiumBenefitLeft, premiumBenefitRight].map((column, columnIndex) => (
                                <div key={`premium-column-${columnIndex}`} className="space-y-2">
                                    {column.map((benefit) => (
                                        <div key={benefit} className="flex min-h-[38px] items-center gap-2 rounded-xl border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-2.5 py-2">
                                            <CheckIcon className="h-3.5 w-3.5 shrink-0 text-green-400" />
                                            <span className="text-[11px] leading-snug text-[color:var(--ui-card-text-soft)]">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        {isBasicMode && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowAllPremiumBenefits((current) => !current)}
                                    className="rounded-full border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ui-text-accent)] transition-all hover:border-[var(--skin-accent-color)]/45 hover:bg-[var(--skin-accent-color)]/10"
                                >
                                    {showAllPremiumBenefits ? 'Menos' : `Mais${hiddenPremiumCount > 0 ? ` +${hiddenPremiumCount}` : ''}`}
                                </button>
                            </div>
                        )}

                        <div className="flex min-w-[176px] flex-col items-stretch gap-1.5">
                            <button
                                onClick={() => setSelectedMembership({
                                    tier: 'premium',
                                    productId: 'premium_30d',
                                    amount: GOLD_PREMIUM_PRODUCT.priceBrl,
                                    name: GOLD_PREMIUM_PRODUCT.name,
                                    equivalentGold: GOLD_PREMIUM_PRODUCT.priceGold,
                                })}
                                disabled={isPlatinum}
                                className="luxe-skin-button inline-flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span>{premiumActionLabel}</span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-black/15 px-2 py-1 text-[11px]">
                                    <span>{formatBrl(GOLD_PREMIUM_PRODUCT.priceBrl)}</span>
                                </span>
                            </button>
                            <span className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ui-card-text-soft)]">
                                {isPlatinum ? 'Já incluso no plano maior' : moneyCheckoutSalesCopy}
                            </span>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard variant="neutral" className="relative overflow-hidden border-[var(--ui-border-accent)]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,244,206,0.18),transparent_56%),linear-gradient(135deg,rgba(186,144,255,0.12),transparent_46%)]" />
                    <div className="relative z-10 space-y-3 p-4">
                        <div className="flex items-start gap-3">
                            <div className="rounded-full border border-white/20 bg-white/10 p-3 shadow-[0_0_26px_rgba(240,218,160,0.2)]">
                                <CrownIcon className="h-6 w-6 text-amber-100" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <h3 className="text-xl font-black uppercase tracking-[0.06em] text-[color:var(--ui-card-text)]">Platinum</h3>
                                    <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${isPlatinum ? 'border-amber-200/30 bg-amber-200/12 text-amber-100' : 'border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] text-[color:var(--ui-card-text-soft)]'}`}>
                                        {isPlatinum ? 'ATIVO' : 'DISPONÍVEL'}
                                    </div>
                                </div>
                                {platinumStatusCopy && (
                                    <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isPlatinum && isPremiumExpiringSoon ? 'text-red-200/88' : 'text-[color:var(--ui-card-text-soft)]'}`}>
                                        {platinumStatusCopy}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {[platinumBenefitLeft, platinumBenefitRight].map((column, columnIndex) => (
                                <div key={`platinum-column-${columnIndex}`} className="space-y-2">
                                    {column.map((benefit) => (
                                        <div key={benefit} className="flex min-h-[38px] items-center gap-2 rounded-xl border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-2.5 py-2">
                                            <CheckIcon className="h-3.5 w-3.5 shrink-0 text-green-400" />
                                            <span className="text-[11px] leading-snug text-[color:var(--ui-card-text-soft)]">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        {isBasicMode && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowAllPlatinumBenefits((current) => !current)}
                                    className="rounded-full border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100 transition-all hover:border-amber-200/35 hover:bg-amber-200/10"
                                >
                                    {showAllPlatinumBenefits ? 'Menos' : `Mais${hiddenPlatinumCount > 0 ? ` +${hiddenPlatinumCount}` : ''}`}
                                </button>
                            </div>
                        )}

                        <div className="flex min-w-[176px] flex-col items-stretch gap-1.5">
                            <button
                                onClick={() => setSelectedMembership({
                                    tier: 'platinum',
                                    productId: 'platinum_30d',
                                    amount: GOLD_PLATINUM_PRODUCT.priceBrl,
                                    name: GOLD_PLATINUM_PRODUCT.name,
                                    equivalentGold: GOLD_PLATINUM_PRODUCT.priceGold,
                                })}
                                className="luxe-skin-button inline-flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span>{platinumActionLabel}</span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-black/15 px-2 py-1 text-[11px]">
                                    <span>{formatBrl(GOLD_PLATINUM_PRODUCT.priceBrl)}</span>
                                </span>
                            </button>
                            <span className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ui-card-text-soft)]">
                                {moneyCheckoutSalesCopy}
                            </span>
                        </div>
                    </div>
                </GlassCard>
            </section>

        </div>
        {selectedMembership && (
            <BillingCheckoutGate
                kind="membership"
                internalProductId={selectedMembership.productId}
                amount={selectedMembership.amount}
                membershipTier={selectedMembership.tier}
                membershipName={selectedMembership.name}
                equivalentGold={selectedMembership.equivalentGold}
                onClose={() => setSelectedMembership(null)}
            />
        )}
        </>
    );
};

interface CodexActionModalProps {
    codex: typeof CODEXES[0];
    onClose: () => void;
    onApply: () => void;
    onDelete: () => void;
    onDonate: (friendId: string) => void;
}

const MentorCodexModal: React.FC<{
    link: RelationshipLink;
    pupil?: UserProfile;
    codexes: any[];
    canMentor: boolean;
    onClose: () => void;
    onGiveCodex: (codexId: string) => Promise<boolean>;
    onCreateNew: () => void;
}> = ({ pupil, codexes, canMentor, onClose, onGiveCodex, onCreateNew }) => {
    const [selectedCodexId, setSelectedCodexId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!selectedCodexId) return;
        setIsSending(true);
        try {
            await onGiveCodex(selectedCodexId);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[215] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm m-4 p-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-[10px] font-black tracking-widest text-gray-400">MENTORIA</div>
                            <div className="text-base font-bold text-white">Campanha para {pupil?.nickname || 'Pupilo'}</div>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50">
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={onCreateNew}
                        className="w-full py-3 rounded-2xl bg-[var(--skin-accent-color)]/10 border border-[var(--skin-accent-color)]/30 text-[var(--skin-accent-color)] text-xs font-bold tracking-wider hover:bg-[var(--skin-accent-color)]/20 transition-all"
                    >
                        CRIAR NOVA CAMPANHA PARA ESTE PUPILO · 100 OURO
                    </button>

                    <div className="space-y-2">
                        <div className="text-[10px] font-black tracking-widest text-gray-400">MINHAS CAMPANHAS AUTORAIS</div>
                        {codexes.length === 0 ? (
                            <div className="text-center text-xs text-gray-500 py-6 bg-black/20 rounded-2xl border border-white/10">
                                Nenhuma campanha autoral pronta para enviar.
                            </div>
                        ) : (
                            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {codexes.map((codex) => (
                                    <button
                                        key={codex.id}
                                        onClick={() => setSelectedCodexId(codex.id)}
                                        className={`w-full p-3 rounded-2xl border text-left transition-all ${selectedCodexId === codex.id ? 'bg-white/10 border-[var(--skin-accent-color)]' : 'bg-black/20 border-white/10 hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-12 h-12 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center text-2xl overflow-hidden">
                                                {codex.template?.coverImage || codex.template?.icon || '📜'}
                                                <SharedCodexCoverArt
                                                    cover={codex.template?.coverImage || codex.template?.icon}
                                                    title={codex.name}
                                                    emojiSize="cover-sm"
                                                    backgroundClassName="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_58%),linear-gradient(180deg,rgba(33,24,16,0.95),rgba(10,8,10,0.98))]"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-white truncate">{codex.name}</div>
                                                <div className="text-[11px] text-gray-400 line-clamp-2">{codex.description || 'Sem descrição.'}</div>
                                                <div className="text-[10px] text-gray-500 mt-1">{codex.template?.levels?.length || 0} fases</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button onClick={onClose} className="flex-1 py-2 rounded-xl luxe-button-secondary text-xs font-bold">FECHAR</button>
                        <button
                            onClick={handleSend}
                            disabled={!canMentor || !selectedCodexId || isSending}
                            className="flex-1 py-2 rounded-xl luxe-skin-button text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSending ? 'ENVIANDO...' : 'ENVIAR CAMPANHA'}
                        </button>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};

const CodexActionModal: React.FC<CodexActionModalProps> = ({ codex, onClose, onApply, onDelete, onDonate }) => {
    const { friends } = useGame();
    const [view, setView] = useState<'main' | 'donate'>('main');
    const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

    const handleDonateClick = () => {
        if (!selectedFriend) return;
        onDonate(selectedFriend);
        onClose();
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm m-4 p-6 space-y-6 rounded-3xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                    {/* Background Glow */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-[var(--skin-accent-color)]/10 blur-[50px] pointer-events-none" />

                    <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full bg-black/20 hover:bg-black/50 z-10">
                        <XIcon className="w-6 h-6" />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                        <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-6xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                            {codex.icon}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{codex.name}</h2>
                            <p className="text-sm text-gray-400 mt-1">Campanha de conhecimento</p>
                        </div>
                    </div>

                    {view === 'main' ? (
                        <div className="grid grid-cols-3 gap-3 pt-4">
                            <button
                                onClick={onApply}
                                className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/40 border border-white/10 hover:bg-white/5 hover:border-green-500/50 transition-all group"
                            >
                                <CheckIcon className="w-6 h-6 text-green-400 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold text-gray-300">APLICAR</span>
                            </button>
                            <button
                                onClick={() => setView('donate')}
                                className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/40 border border-white/10 hover:bg-white/5 hover:border-blue-500/50 transition-all group"
                            >
                                <SendIcon className="w-6 h-6 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold text-gray-300">DOAR</span>
                            </button>
                            <button
                                onClick={onDelete}
                                className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/40 border border-white/10 hover:bg-red-900/20 hover:border-red-500/50 transition-all group"
                            >
                                <TrashIcon className="w-6 h-6 text-red-400 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold text-gray-300">DELETAR</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 pt-2">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center">Selecione o Aliado</h3>

                            {friends.length === 0 ? (
                                <div className="text-center text-xs text-gray-500 py-4">
                                    Você não possui aliados conectados.
                                </div>
                            ) : (
                                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1">
                                    {friends.map(friend => (
                                        <button
                                            key={friend.id}
                                            onClick={() => setSelectedFriend(friend.id)}
                                            className={`w-full flex items-center p-2 rounded-xl border transition-all ${selectedFriend === friend.id ? 'bg-white/10 border-[var(--skin-accent-color)]' : 'bg-black/30 border-white/5 hover:bg-white/5'}`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-black/50 overflow-hidden mr-3">
                                                {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">?</div>}
                                            </div>
                                            <span className="text-sm font-bold text-gray-200">{friend.nickname}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="flex space-x-2 pt-2">
                                <button onClick={() => setView('main')} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400">
                                    Voltar
                                </button>
                                <button
                                    onClick={handleDonateClick}
                                    disabled={!selectedFriend}
                                    className="flex-1 py-2 rounded-xl luxe-skin-button disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Enviar
                                </button>
                            </div>
                        </div>
                    )}
                </GlassCard>
            </div>
        </Portal>
    );
};

const CodexListModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return <CodexLibrary mode="modal" onClose={onClose} />;
};

export const SettingsView: React.FC = () => {
    const { updateUserProfile, userProfile } = useGame();
    const [activeTab, setActiveTab] = useState<SettingsTab>('Geral');
    const [isSovereignEditorOpen, setSovereignEditorOpen] = useState(false);
    const isStaff = ['admin', 'gm', 'admin_gm'].includes((userProfile?.role || '').toLowerCase());

    useEffect(() => {
        const tipId: ScreenIntroTipId =
            activeTab === 'Preferências'
                ? 'settings_preferences'
                : activeTab === 'Premium'
                    ? 'settings_premium'
                    : activeTab === 'Temporada'
                        ? 'settings_season'
                        : 'settings_general';

        window.dispatchEvent(new CustomEvent(SCREEN_INTRO_TIP_CONTEXT_EVENT, {
            detail: { tipId },
        }));
    }, [activeTab]);

    useEffect(() => {
        const handleTabChange = (e: any) => {
            const tab = e.detail?.tab;
            if (tab && ['Geral', 'Preferências', 'Premium'].includes(tab)) {
                setActiveTab(tab as SettingsTab);
            }
        };
        const handleSettingsReturn = () => {
            setActiveTab('Preferências');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('tutorialSettingsOpenModal'));
            }, 50);
        };
        window.addEventListener('tutorialTabChange', handleTabChange);
        window.addEventListener('tutorialSettingsReturn', handleSettingsReturn);
        return () => {
            window.removeEventListener('tutorialTabChange', handleTabChange);
            window.removeEventListener('tutorialSettingsReturn', handleSettingsReturn);
        };
    }, []);

    const handleSovereignSave = (newSovereignConfig: SovereignConfig) => {
        updateUserProfile({ sovereign: newSovereignConfig });
        setSovereignEditorOpen(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Geral': return <GeralTab />;
            case 'Preferências': return <PreferenciasTab />;
            case 'Premium': return <PremiumTab />;
            default: return null;
        }
    }

    let tabs: SettingsTab[] = ['Geral', 'Preferências', 'Premium'];

    return (
        <>
            <div id="settings-container" className="settings-view-root p-4 space-y-6 h-full flex flex-col">
                <div className="settings-tab-strip flex-shrink-0 flex items-center justify-center space-x-1 bg-black/20 p-1 rounded-2xl">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            id={`settings-tab-${tab.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]+/g, '-')}`}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full px-2 py-2 text-xs font-semibold rounded-xl transition-colors ${activeTab === tab ? 'bg-[var(--skin-accent-color)]/14 text-[var(--ui-text-accent)] border border-[var(--skin-accent-color)]/28 shadow-[0_0_14px_var(--sephirot-glow-color-soft)]' : 'text-gray-400 hover:bg-white/5'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="settings-content-shell flex-grow min-h-0 overflow-y-auto pb-32 pt-2">
                    {renderContent()}
                    {isStaff && activeTab === 'Geral' && (
                        <div className="pt-6 mt-6 border-t border-[var(--skin-accent-color)]/30">
                            <div className="mb-3 px-1">
                                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--ui-card-text-soft)]">
                                    Operacao GM
                                </div>
                                <div className="mt-1 text-xs text-[color:var(--ui-card-text-soft)]">
                                    Painel interno de staff. Nao faz parte dos beneficios do premium comum.
                                </div>
                            </div>
                            <Suspense fallback={<div className="h-24 rounded-2xl bg-black/20 animate-pulse" />}>
                                <SovereignPanelView />
                            </Suspense>
                        </div>
                    )}
                </div>
            </div>
            {isSovereignEditorOpen && (
                <Suspense fallback={<div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" />}>
                    <SovereignCustomizer
                        initialConfig={userProfile?.sovereign}
                        onClose={() => setSovereignEditorOpen(false)}
                        onSave={handleSovereignSave}
                    />
                </Suspense>
            )}
        </>
    );
};

