import React, { useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { OracleCategory, OracleMode, OraclePreferences, OraclePresenceLevel } from '../types';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { XIcon, CheckIcon } from './Icons';
import { ORACLE_MODES } from '../constants/oracle';
import {
    disableAppPushRegistration,
    getAppPushSetupHint,
    getAppPushPermission,
    getNativePushPlatform,
    getNativePushProviderLabel,
    hasAppPushRemoteDeliveryReady,
    getAppPushSupport,
    requestAppPushPermission,
    sendAppPushRemoteTest,
    syncAppPushRegistration,
    type AppPushPermission,
    type AppPushSyncResult,
} from '../utils/pushRuntime';
import { scheduleLocalNotification } from '../utils/localNotification';
import { buildOracleWidgetSnapshot } from '../utils/widgetSnapshots';
import { hasPremiumAccess } from '../utils/premiumAccess';

interface OracleSettingsModalProps {
    onClose: () => void;
    onOpenChat?: () => void;
    variant?: 'preferences' | 'assistant';
}

type SettingsTab = 'modos' | 'categorias';
type ToggleKey = 'iaEnabled' | 'notificationsEnabled' | 'dailyFocusCardEnabled' | 'dmNotificationsEnabled' | 'animationsEnabled' | 'soundsEnabled' | 'hapticsEnabled';

const ORACLE_PRESENCE_LEVELS: Array<{
    value: OraclePresenceLevel;
    label: string;
    caption: string;
}> = [
    { value: 0, label: 'Silencioso', caption: 'So avisos humanos, convites, mensagens e alertas criticos.' },
    { value: 1, label: 'Leve', caption: 'Poucos sinais. Sem cards automaticos de rotina.' },
    { value: 2, label: 'Equilibrado', caption: 'Padrao recomendado. Pulso de foco quando fizer sentido.' },
    { value: 3, label: 'Presente', caption: 'Mais companion, ainda com limite e sem spam.' },
];

const PUSH_PERMISSION_LABEL: Record<AppPushPermission, string> = {
    prompt: 'Aguardando permissao',
    granted: 'Permitido no aparelho',
    denied: 'Bloqueado no aparelho',
    unsupported: 'Sem suporte neste aparelho',
};

const getPushDeliveryLabel = ({
    pushEnabled,
    isNative,
    remoteReady,
    permission,
}: {
    pushEnabled: boolean;
    isNative: boolean;
    remoteReady: boolean;
    permission: AppPushPermission;
}) => {
    if (!pushEnabled) return 'Push desligado neste aparelho';
    if (permission === 'denied') return 'O aparelho bloqueou notificacoes';
    if (permission === 'unsupported') return 'Este aparelho nao suporta este tipo de push';

    if (isNative) {
        return remoteReady
            ? 'Entrega remota pronta neste aparelho'
            : 'Push local pronto. Remoto ainda em sincronizacao';
    }

    return remoteReady
        ? 'Push remoto pronto neste navegador'
        : 'Push local habilitado neste navegador';
};

const getPushDeliveryTone = ({
    pushEnabled,
    remoteReady,
    permission,
}: {
    pushEnabled: boolean;
    remoteReady: boolean;
    permission: AppPushPermission;
}) => {
    if (!pushEnabled) return 'border-white/10 bg-white/5 text-gray-400';
    if (permission === 'denied' || permission === 'unsupported') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
    if (remoteReady) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
    return 'border-sky-500/30 bg-sky-500/10 text-sky-200';
};

const MANUAL_LIBRARY_CATEGORIES: { id: OracleCategory; label: string; icon: string }[] = [
    { id: 'frases_inspiradoras', label: 'Frases Inspiradoras', icon: '🔥' },
    { id: 'reflexoes_filosoficas', label: 'Reflexões Filosóficas', icon: '🧠' },
    { id: 'fragmentos_sabedoria', label: 'Fragmentos de Sabedoria', icon: '📜' },
    { id: 'rituais_lifestyle', label: 'Dicas de Vida', icon: '🌿' },
    { id: 'sussurros_maestria', label: 'Sussurros da Maestria', icon: '👁️' },
];

const ORACLE_MESSAGE_RULES = [
    {
        title: 'Push real',
        body: 'So para horario, risco forte, DM, convite ou aviso importante.',
        tone: 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-100',
    },
    {
        title: 'Automatico opcional',
        body: 'Cards de foco, resumo de ciclo e provocacoes do modo escolhido.',
        tone: 'border-amber-400/20 bg-amber-400/[0.08] text-amber-100',
    },
    {
        title: 'No chat do Oraculo',
        body: 'Frases, reflexoes, analises longas e cards por tema.',
        tone: 'border-white/10 bg-white/[0.04] text-gray-300',
    },
];

const ORACLE_USE_STEPS = [
    {
        title: '1. Escolha o tom',
        body: 'Neutro no gratis. Premium libera coach, tatico, calmo, reflexivo e personalizado.',
    },
    {
        title: '2. Marque os temas',
        body: 'Os temas dizem que tipo de card o Oraculo pode puxar quando voce pedir ou liberar automatico.',
    },
    {
        title: '3. Ligue push se quiser',
        body: 'Push e so para tirar voce do mundo real quando existe algo acionavel.',
    },
];

const getRemotePushFailureMessage = (result: AppPushSyncResult): string => {
    const nativePlatform = getNativePushPlatform();
    const providerLabel = getNativePushProviderLabel();

    switch (result.status) {
        case 'not_signed_in':
            return 'Push local ativado, mas a sessao expirou antes do registro remoto.';
        case 'permission_denied':
            return 'Push local ativado, mas este aparelho nao liberou notificacoes.';
        case 'missing_public_key':
            return 'Push local ativado, mas a chave publica do push remoto nao entrou neste build.';
        case 'unsupported':
            return 'Push local ativado. Este aparelho nao suporta push remoto completo.';
        case 'invoke_failed':
            return `Push local ativado, mas o backend recusou o registro remoto${result.detail ? `: ${result.detail}` : '.'}`;
        case 'subscribe_failed':
            return `Push local ativado, mas o navegador nao conseguiu criar uma subscription valida${result.detail ? `: ${result.detail}` : '.'}`;
        case 'native_permission_denied':
            return 'Push nativo negado no aparelho.';
        case 'native_permission_prompt':
            return 'O aparelho ainda nao liberou a permissao de push.';
        case 'native_register_failed':
            return `${nativePlatform === 'ios' ? 'O iPhone' : 'O Android'} nao conseguiu registrar o push nativo${result.detail ? `: ${result.detail}` : '.'}`;
        case 'native_backend_register_failed':
            return `O aparelho gerou o token nativo, mas o backend ainda nao conseguiu salvar esse aparelho${result.detail ? `: ${result.detail}` : '.'}`;
        case 'native_remote_pending':
            return `O aparelho ja gerou o token nativo. Falta concluir a trilha ${providerLabel}/backend para o push remoto chegar com o app fechado.`;
        case 'native_ok':
            return 'Push nativo do aparelho pronto para entrega remota.';
        default:
            return 'Push ativado, mas o registro remoto do aparelho falhou. Fora do app ainda pode falhar.';
    }
};

const normalizeOracleCopy = (value: string) => value
    .replaceAll('Ã¡', 'a')
    .replaceAll('Ã¢', 'a')
    .replaceAll('Ã£', 'a')
    .replaceAll('Ã ', 'a')
    .replaceAll('Ã§', 'c')
    .replaceAll('Ã©', 'e')
    .replaceAll('Ãª', 'e')
    .replaceAll('Ã­', 'i')
    .replaceAll('Ã³', 'o')
    .replaceAll('Ã´', 'o')
    .replaceAll('Ãµ', 'o')
    .replaceAll('Ãº', 'u')
    .replaceAll('Â°', 'o')
    .replaceAll('Â', '')
    .replaceAll('â€¦', '...')
    .replaceAll('â€”', '-')
    .replaceAll('â€“', '-')
    .replaceAll('â†’', '->');

const normalizeOracleIcon = (value: string) => {
    const iconMap: Record<string, string> = {
        'ðŸ”¥': '\u{1F525}',
        'ðŸ§ ': '\u{1F9E0}',
        'ðŸ“œ': '\u{1F4DC}',
        'ðŸŒ¿': '\u{1F33F}',
        'ðŸ‘ï¸': '\u{1F441}\u{FE0F}',
        'âœ¨': '\u{2728}',
        'ðŸ””': '\u{1F514}',
        'ðŸ’¬': '\u{1F4AC}',
        'ðŸ“²': '\u{1F4F2}',
        'ðŸ”Š': '\u{1F50A}',
        'ðŸ“³': '\u{1F4F3}',
    };
    return iconMap[value] || value;
};

export const OracleSettingsModal: React.FC<OracleSettingsModalProps> = ({
    onClose,
    onOpenChat,
    variant = 'preferences',
}) => {
    const { oraclePreferences, oracleMessages, updateOraclePreferences, userProfile, showToast } = useGame();
    const [activeTab, setActiveTab] = useState<SettingsTab>('modos');
    const [pushPermission, setPushPermission] = useState<AppPushPermission>('default');
    const [pushRemoteReady, setPushRemoteReady] = useState(false);
    const [isTestingPush, setIsTestingPush] = useState(false);

    if (!oraclePreferences) return null;

    const isPremium = hasPremiumAccess(userProfile);
    const activeModeConfig = ORACLE_MODES[oraclePreferences.activeMode] || ORACLE_MODES.neutro;
    const oracleSnapshot = buildOracleWidgetSnapshot({ oraclePreferences, oracleMessages });
    const pushSupport = getAppPushSupport();

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            const [permission, remoteReady] = await Promise.all([
                getAppPushPermission(),
                hasAppPushRemoteDeliveryReady(),
            ]);
            if (!cancelled) {
                setPushPermission(permission);
                setPushRemoteReady(remoteReady);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [oraclePreferences.pushEnabled]);

    const handleToggle = (key: ToggleKey) => {
        if (key === 'dailyFocusCardEnabled') {
            const nextEnabled = !Boolean(oraclePreferences.dailyFocusCardEnabled);
            updateOraclePreferences({
                dailyFocusCardEnabled: nextEnabled,
                presenceLevel: nextEnabled
                    ? (Math.max(2, oraclePreferences.presenceLevel ?? 1) as OraclePresenceLevel)
                    : oraclePreferences.presenceLevel,
            });
            return;
        }

        updateOraclePreferences({ [key]: !Boolean(oraclePreferences[key]) } as Partial<OraclePreferences>);
    };

    const handlePushToggle = async () => {
        const nextEnabled = !Boolean(oraclePreferences.pushEnabled);

        if (!nextEnabled) {
            await disableAppPushRegistration();
            await updateOraclePreferences({ pushEnabled: false });
            setPushRemoteReady(false);
            showToast('Push no aparelho desativado.', 'info');
            return;
        }

        const permission = await requestAppPushPermission();
        setPushPermission(permission);

        if (permission !== 'granted') {
            await updateOraclePreferences({ pushEnabled: false });
            setPushRemoteReady(false);
            showToast('Permissao de push negada. Os avisos continuam dentro do app.', 'warning');
            return;
        }

        const remoteSync = await syncAppPushRegistration();
        await updateOraclePreferences({ pushEnabled: true });
        setPushRemoteReady(remoteSync.remoteDeliveryReady);

        if (!pushSupport.supported) {
            showToast('Push local ativado. Este aparelho nao suporta push remoto completo.', 'warning');
            return;
        }

        if (!pushSupport.configured) {
            showToast('Push local ativado. Falta configurar a chave publica do push remoto.', 'warning');
            return;
        }

        if (!remoteSync.ok) {
            showToast(getRemotePushFailureMessage(remoteSync), 'warning');
            return;
        }

        if (!remoteSync.remoteDeliveryReady && remoteSync.isNative) {
            showToast(getRemotePushFailureMessage(remoteSync), 'info');
            return;
        }

        showToast('Push no aparelho ativado.', 'success');
    };

    const handleLocalPushTest = async () => {
        setIsTestingPush(true);
        try {
            const permission = await requestAppPushPermission();
            setPushPermission(permission);

            if (permission !== 'granted') {
                showToast('Permissao de notificacao nao liberada neste aparelho.', 'warning');
                return;
            }

            const delivered = await scheduleLocalNotification({
                title: 'Teste GLYPH',
                body: 'Teste local com atraso de 15s: permissao e canal funcionando.',
                tag: 'glyph-local-push-test',
                url: '/?oracle=notifications',
            }, 15000);

            showToast(delivered ? 'Teste local agendado para daqui 15 segundos.' : 'Nao foi possivel agendar o teste local.', delivered ? 'success' : 'warning');
        } finally {
            setIsTestingPush(false);
        }
    };

    const handleRemotePushTest = async () => {
        setIsTestingPush(true);
        try {
            const permission = await requestAppPushPermission();
            setPushPermission(permission);

            if (permission !== 'granted') {
                showToast('Permissao de push nao liberada neste aparelho.', 'warning');
                return;
            }

            const remoteSync = await syncAppPushRegistration();
            await updateOraclePreferences({ pushEnabled: true });
            setPushRemoteReady(remoteSync.remoteDeliveryReady);

            if (!remoteSync.ok) {
                showToast(getRemotePushFailureMessage(remoteSync), 'warning');
                return;
            }

            showToast('Teste remoto armado. Vou disparar em 15 segundos.', 'info');
            await new Promise(resolve => window.setTimeout(resolve, 15000));

            const testResult = await sendAppPushRemoteTest();
            if (testResult.ok && testResult.sent > 0) {
                setPushRemoteReady(true);
                showToast('Teste remoto enviado. Se o app estiver em segundo plano, ele deve chegar pelo aparelho.', 'success');
                return;
            }

            const detail = testResult.error || testResult.detail || `sent:${testResult.sent} failed:${testResult.failed} skipped:${testResult.skipped}`;
            showToast(`Teste remoto nao confirmou entrega: ${detail}`, 'warning');
        } finally {
            setIsTestingPush(false);
        }
    };

    const handleModeSelect = (mode: OracleMode) => {
        updateOraclePreferences({ activeMode: mode });
    };

    const handlePresenceChange = (level: OraclePresenceLevel) => {
        updateOraclePreferences({
            presenceLevel: level,
            notificationsEnabled: true,
            dailyFocusCardEnabled: level >= 2,
            dmNotificationsEnabled: true,
        });
    };

    const handleCategoryToggle = (category: OracleCategory) => {
        const current = oraclePreferences.enabledCategories || [];
        const next = current.includes(category)
            ? current.filter(c => c !== category)
            : [...current, category];
        updateOraclePreferences({ enabledCategories: next });
    };

    const renderSwitchRow = ({
        icon,
        label,
        description,
        enabled,
        onToggle,
        accentClass = 'bg-[var(--skin-accent-color)]',
    }: {
        icon: string;
        label: string;
        description?: string;
        enabled: boolean;
        onToggle: () => void;
        accentClass?: string;
    }) => (
        <div className="flex items-center justify-between rounded-[14px] bg-black/20 px-3 py-2 transition-colors hover:bg-black/30">
            <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{normalizeOracleIcon(icon)}</span>
                    <span className="text-sm font-semibold text-gray-200">{normalizeOracleCopy(label)}</span>
                </div>
                {description ? <p className="mt-0.5 pl-7 text-[11px] leading-relaxed text-gray-500">{normalizeOracleCopy(description)}</p> : null}
            </div>
            <button
                onClick={onToggle}
                className={`relative h-5 w-9 rounded-full transition-colors ${enabled ? accentClass : 'bg-gray-700'}`}
            >
                <div className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-transform ${enabled ? 'left-5' : 'left-1'}`} />
            </button>
        </div>
    );

    const renderModeSummaryCard = () => (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Modo atual</div>
            <div className="mt-1 text-sm font-bold text-white">{normalizeOracleCopy(activeModeConfig.name)}</div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400">{normalizeOracleCopy(activeModeConfig.description)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-300">
                    Auto {normalizeOracleCopy(activeModeConfig.attentionProfile)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-300">
                    Push {normalizeOracleCopy(activeModeConfig.pushProfile)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-300">
                    Feed {oracleSnapshot.unreadCount} nao lidos
                </span>
            </div>
        </div>
    );

    const renderMessagePolicyCards = () => (
        <div className="grid grid-cols-1 gap-2">
            {ORACLE_MESSAGE_RULES.map((rule) => (
                <div key={rule.title} className={`rounded-xl border px-3 py-2 ${rule.tone}`}>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em]">{rule.title}</div>
                    <p className="mt-1 text-[11px] leading-relaxed opacity-80">{rule.body}</p>
                </div>
            ))}
        </div>
    );

    const renderPresenceSlider = () => {
        const currentLevel = oraclePreferences.presenceLevel ?? (oraclePreferences.dailyFocusCardEnabled ? 2 : 1);
        const current = ORACLE_PRESENCE_LEVELS.find((level) => level.value === currentLevel) || ORACLE_PRESENCE_LEVELS[1];

        return (
            <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Presenca</div>
                        <div className="mt-1 text-sm font-black text-white">{current.label}</div>
                    </div>
                    <span className="rounded-full border border-[var(--skin-accent-color)]/20 bg-[var(--skin-accent-color)]/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ui-text-accent)]">
                        {currentLevel}/3
                    </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{current.caption}</p>
                <input
                    type="range"
                    min={0}
                    max={3}
                    step={1}
                    value={currentLevel}
                    onChange={(event) => handlePresenceChange(Number(event.target.value) as OraclePresenceLevel)}
                    className="mt-3 h-2 w-full appearance-none rounded-full bg-gradient-to-r from-gray-700 via-[var(--skin-accent-color)]/55 to-emerald-300/70 outline-none"
                    aria-label="Nivel de presenca do Oraculo"
                />
                <div className="mt-2 grid grid-cols-4 gap-1 text-center">
                    {ORACLE_PRESENCE_LEVELS.map((level) => (
                        <button
                            key={level.value}
                            type="button"
                            onClick={() => handlePresenceChange(level.value)}
                            className={`rounded-lg px-1 py-1 text-[9px] font-black uppercase tracking-[0.08em] transition-colors ${
                                currentLevel === level.value
                                    ? 'bg-[var(--skin-accent-color)]/16 text-white'
                                    : 'bg-white/[0.035] text-white/38 hover:text-white/70'
                            }`}
                        >
                            {level.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderUseGuide = () => (
        <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Como usar</div>
            <div className="mt-2 grid grid-cols-1 gap-2">
                {ORACLE_USE_STEPS.map((step) => (
                    <div key={step.title} className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--ui-text-accent)]">{step.title}</div>
                        <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{step.body}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderModes = () => (
        <div className="space-y-3.5">
            {renderModeSummaryCard()}

            <div className="grid grid-cols-1 gap-1">
                {Object.values(ORACLE_MODES).map((mode) => {
                    const isSelected = oraclePreferences.activeMode === mode.id;
                    const isLocked = !isPremium && mode.id !== 'neutro';

                    return (
                        <button
                            key={mode.id}
                            onClick={() => !isLocked && handleModeSelect(mode.id)}
                            className={`relative overflow-hidden rounded-[14px] border px-3 py-2 text-left transition-all ${
                                isSelected
                                    ? 'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/10'
                                    : 'border-white/5 bg-black/20 hover:bg-white/5'
                            } ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                            <div className="flex items-start gap-2.5">
                                <div className={`mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-[var(--skin-accent-color)]' : 'border-gray-500'}`}>
                                    {isSelected && <div className="h-2 w-2 rounded-full bg-[var(--skin-accent-color)]" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{normalizeOracleCopy(mode.name)}</span>
                                        {isLocked && (
                                            <span className="rounded border border-amber-500/20 bg-black/40 px-2 py-0.5 text-[10px] text-amber-500">
                                                PREMIUM
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 text-[10px] leading-relaxed text-gray-500">{normalizeOracleCopy(mode.description)}</p>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-[3px] text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
                                            {normalizeOracleCopy(mode.attentionProfile)}
                                        </span>
                                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-[3px] text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
                                            Push {normalizeOracleCopy(mode.pushProfile)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {oraclePreferences.activeMode === 'personalizado' && (
                <div className="animate-fade-in rounded-xl border border-white/10 bg-black/20 p-4">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Instrucoes Personalizadas</label>
                    <textarea
                        className="h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-gray-200 focus:border-[var(--skin-accent-color)] focus:outline-none"
                        placeholder="Ex: Fale como um mestre zen, use metaforas de agua..."
                        value={oraclePreferences.customModeInstructions || ''}
                        onChange={(e) => updateOraclePreferences({ customModeInstructions: e.target.value })}
                    />
                    <p className="mt-2 text-[10px] text-gray-600">O Oraculo segue esse tom sem perder a leitura operacional.</p>
                </div>
            )}
        </div>
    );

    const renderManualLibraryCategories = () => (
            <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Biblioteca manual</div>
                    <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
                        O automático tenta girar 1 pulso por tema marcado ao longo do dia. No Premium, o botão manual pode puxar até 5 cards por dia.
                    </p>
                </div>
                {MANUAL_LIBRARY_CATEGORIES.map((cat) => {
                    const isEnabled = oraclePreferences.enabledCategories.includes(cat.id);
                    return (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryToggle(cat.id)}
                            className={`flex w-full items-center justify-between rounded-[14px] border px-3 py-2 transition-all ${
                                isEnabled
                                    ? 'border-white/20 bg-white/10'
                                    : 'border-transparent bg-black/20 hover:bg-black/30'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-base leading-none">{normalizeOracleIcon(cat.icon)}</span>
                                <span className={`text-sm font-medium ${isEnabled ? 'text-white' : 'text-gray-400'}`}>{normalizeOracleCopy(cat.label)}</span>
                            </div>
                            {isEnabled && <CheckIcon className="h-4 w-4 text-[var(--skin-accent-color)]" />}
                        </button>
                );
            })}
        </div>
    );

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
                <GlassCard
                    id="oracle-settings-modal-content"
                    variant="neutral"
                    className="m-4 flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl !p-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 p-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--skin-accent-color)]">
                            {variant === 'preferences' ? 'Preferências do Oráculo' : 'Configurar Oráculo'}
                        </h2>
                        <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-white/10">
                            <XIcon className="h-5 w-5 text-gray-400" />
                        </button>
                    </div>

                    {variant === 'assistant' && (
                        <div className="flex flex-shrink-0 gap-1 border-b border-white/5 bg-black/20 p-2">
                            {(['modos', 'categorias'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                                        activeTab === tab
                                            ? 'border border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/14 text-[var(--ui-text-accent)] shadow-[0_0_12px_var(--sephirot-glow-color-soft)]'
                                            : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
                        {variant === 'preferences' ? (
                            <div className="space-y-4">
                                {renderUseGuide()}
                                {renderPresenceSlider()}

                                <div className="space-y-2">
                                    <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-gray-500">Modo do Oráculo</h3>
                                    {renderModes()}
                                </div>

                                <div className="space-y-2 pt-1">
                                    <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-gray-500">Temas dos cards</h3>
                                    {renderManualLibraryCategories()}
                                </div>

                                <div className="space-y-2 pt-1">
                                    <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-gray-500">Regra de mensagens</h3>
                                    {renderMessagePolicyCards()}
                                </div>

                                <div className="space-y-1 pt-1">
                                    <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-gray-500">Controles</h3>
                                    {renderSwitchRow({
                                        icon: 'IA',
                                        label: 'IA do Oraculo',
                                        description: `Permite chat e cards usando o modo ${activeModeConfig.name}.`,
                                        enabled: Boolean(oraclePreferences.iaEnabled),
                                        onToggle: () => handleToggle('iaEnabled'),
                                    })}
                                    {renderSwitchRow({
                                        icon: 'IN',
                                        label: 'Avisos internos',
                                        description: 'Sinais do sistema e do Oraculo dentro do app.',
                                        enabled: Boolean(oraclePreferences.notificationsEnabled),
                                        onToggle: () => handleToggle('notificationsEnabled'),
                                    })}
                                    {renderSwitchRow({
                                        icon: 'CD',
                                        label: 'Cards automaticos',
                                        description: 'Opt-in: cards de foco e temas marcados, respeitando silencio.',
                                        enabled: Boolean(oraclePreferences.dailyFocusCardEnabled),
                                        onToggle: () => handleToggle('dailyFocusCardEnabled'),
                                        accentClass: 'bg-amber-500/70',
                                    })}
                                    {renderSwitchRow({
                                        icon: 'DM',
                                        label: 'DMs e convites',
                                        description: 'Aviso e push para mensagens diretas e interacoes humanas.',
                                        enabled: Boolean(oraclePreferences.dmNotificationsEnabled),
                                        onToggle: () => handleToggle('dmNotificationsEnabled'),
                                        accentClass: 'bg-sky-500/70',
                                    })}
                                    {renderSwitchRow({
                                        icon: 'P',
                                        label: 'Push real no aparelho',
                                        description: PUSH_PERMISSION_LABEL[pushPermission],
                                        enabled: Boolean(oraclePreferences.pushEnabled),
                                        onToggle: handlePushToggle,
                                        accentClass: 'bg-emerald-500/70',
                                    })}
                                    <div
                                        className={`ml-7 rounded-xl border px-3 py-2 text-[11px] font-semibold ${getPushDeliveryTone({
                                            pushEnabled: Boolean(oraclePreferences.pushEnabled),
                                            remoteReady: pushRemoteReady,
                                            permission: pushPermission,
                                        })}`}
                                    >
                                        {getPushDeliveryLabel({
                                            pushEnabled: Boolean(oraclePreferences.pushEnabled),
                                            isNative: pushSupport.isNative,
                                            remoteReady: pushRemoteReady,
                                            permission: pushPermission,
                                        })}
                                    </div>
                                    <div className="ml-7 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[10px] leading-relaxed text-gray-400">
                                        {getAppPushSetupHint()}
                                    </div>
                                    <details className="ml-7 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                                        <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.16em] text-white/62">Testes de push</summary>
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                disabled={isTestingPush}
                                                onClick={handleLocalPushTest}
                                                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/62 transition-colors hover:border-white/20 hover:text-white disabled:cursor-wait disabled:opacity-50"
                                            >
                                                Local
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isTestingPush}
                                                onClick={handleRemotePushTest}
                                                className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100 transition-colors hover:bg-emerald-400/[0.12] disabled:cursor-wait disabled:opacity-50"
                                            >
                                                Remoto
                                            </button>
                                        </div>
                                    </details>
                                </div>

                                {false && <div className="space-y-2">
                                    <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-gray-500">Sensorial</h3>
                                    {renderSwitchRow({
                                        icon: '✨',
                                        label: 'Animacoes',
                                        description: 'Mantem glows, sheens e transicoes do sistema.',
                                        enabled: Boolean(oraclePreferences.animationsEnabled),
                                        onToggle: () => handleToggle('animationsEnabled'),
                                    })}
                                    {renderSwitchRow({
                                        icon: '🔊',
                                        label: 'Sons',
                                        description: 'Ativa cliques, alertas e retornos sonoros do app.',
                                        enabled: Boolean(oraclePreferences.soundsEnabled),
                                        onToggle: () => handleToggle('soundsEnabled'),
                                    })}
                                    {renderSwitchRow({
                                        icon: '📳',
                                        label: 'Vibracao',
                                        description: 'Usa resposta tatil em eventos importantes, quando suportado.',
                                        enabled: Boolean(oraclePreferences.hapticsEnabled),
                                        onToggle: () => handleToggle('hapticsEnabled'),
                                    })}
                                </div>}
                            </div>
                        ) : (
                            <>
                                {activeTab === 'modos' && renderModes()}
                                {activeTab === 'categorias' && renderManualLibraryCategories()}
                            </>
                        )}
                    </div>

                    <div className="flex-shrink-0 space-y-2 border-t border-white/10 bg-black/20 p-4">
                        {onOpenChat && variant === 'assistant' && (
                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenChat();
                                }}
                                className="luxe-skin-button flex w-full items-center justify-center gap-2 rounded-xl py-3"
                            >
                                <span>💬</span>
                                <span className="text-xs font-bold tracking-widest">ABRIR CHAT</span>
                            </button>
                        )}

                        {variant === 'preferences' && (
                            <button
                                onClick={onClose}
                                className="luxe-skin-button flex w-full items-center justify-center gap-2 rounded-xl py-3"
                            >
                                <span className="text-xs font-bold tracking-widest">OK</span>
                            </button>
                        )}
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
