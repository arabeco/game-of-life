import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { OracleMode, OracleCategory, OraclePreferences } from '../types';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { XIcon, CheckIcon } from './Icons';
import { ORACLE_MODES } from '../constants/oracle';
import {
    getLocalNotificationPermission,
    requestLocalNotificationPermission,
} from '../utils/localNotification';

interface OracleSettingsModalProps {
    onClose: () => void;
    onOpenChat?: () => void;
    variant?: 'preferences' | 'assistant';
}

type SettingsTab = 'modos' | 'categorias';
type ToggleKey = 'iaEnabled' | 'notificationsEnabled' | 'animationsEnabled' | 'soundsEnabled' | 'hapticsEnabled';

const SENTINEL_LABELS: Record<NonNullable<OraclePreferences['sentinelMode']>, string> = {
    soberano_ativo: 'Soberano Ativo',
    apenas_necessarias: 'Apenas Necessárias',
    nao_ia: 'Não-IA',
};

const PUSH_PERMISSION_LABEL: Record<ReturnType<typeof getLocalNotificationPermission>, string> = {
    default: 'Aguardando permissão',
    granted: 'Permitido no navegador',
    denied: 'Bloqueado no navegador',
    unsupported: 'Sem suporte neste aparelho',
};

export const OracleSettingsModal: React.FC<OracleSettingsModalProps> = ({
    onClose,
    onOpenChat,
    variant = 'preferences',
}) => {
    const { oraclePreferences, updateOraclePreferences, userProfile, showToast } = useGame();
    const [activeTab, setActiveTab] = useState<SettingsTab>('modos');
    const [pushPermission, setPushPermission] = useState(getLocalNotificationPermission());

    if (!oraclePreferences) return null;

    const isPremium = userProfile.isPremium || userProfile.role === 'admin' || userProfile.role === 'gm';
    const activeModeConfig = ORACLE_MODES[oraclePreferences.activeMode] || ORACLE_MODES.neutro;
    const currentSentinelMode = oraclePreferences.sentinelMode || 'soberano_ativo';

    const handleToggle = (key: ToggleKey) => {
        updateOraclePreferences({ [key]: !Boolean(oraclePreferences[key]) } as Partial<OraclePreferences>);
    };

    const handlePushToggle = async () => {
        const nextEnabled = !Boolean(oraclePreferences.pushEnabled);

        if (!nextEnabled) {
            await updateOraclePreferences({ pushEnabled: false });
            showToast('Push no aparelho desativado.', 'info');
            return;
        }

        const permission = await requestLocalNotificationPermission();
        setPushPermission(permission);

        if (permission !== 'granted') {
            await updateOraclePreferences({ pushEnabled: false });
            showToast('Permissão de push negada. Os avisos continuam dentro do app.', 'warning');
            return;
        }

        await updateOraclePreferences({ pushEnabled: true });
        showToast('Push no aparelho ativado.', 'success');
    };

    const handleModeSelect = (mode: OracleMode) => {
        updateOraclePreferences({ activeMode: mode });
    };

    const handleCategoryToggle = (category: OracleCategory) => {
        const current = oraclePreferences.enabledCategories || [];
        const next = current.includes(category)
            ? current.filter(c => c !== category)
            : [...current, category];
        updateOraclePreferences({ enabledCategories: next });
    };

    const handleSentinelModeSelect = (mode: NonNullable<OraclePreferences['sentinelMode']>) => {
        updateOraclePreferences({ sentinelMode: mode });
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
        description: string;
        enabled: boolean;
        onToggle: () => void;
        accentClass?: string;
    }) => (
        <div className="flex items-center justify-between rounded-xl bg-black/20 p-3 transition-colors hover:bg-black/30">
            <div className="min-w-0 pr-3">
                <div className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-semibold text-gray-200">{label}</span>
                </div>
                <p className="mt-1 pl-8 text-xs text-gray-500">{description}</p>
            </div>
            <button
                onClick={onToggle}
                className={`relative h-5 w-10 rounded-full transition-colors ${enabled ? accentClass : 'bg-gray-700'}`}
            >
                <div className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-transform ${enabled ? 'left-6' : 'left-1'}`} />
            </button>
        </div>
    );

    const renderModes = () => (
        <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Leitura Atual</div>
                <div className="mt-2 text-sm font-bold text-white">{activeModeConfig.name}</div>
                <p className="mt-1 text-xs text-gray-400">{activeModeConfig.description}</p>
                <p className="mt-2 text-xs text-gray-500">
                    Os avisos do Oráculo seguem esse modo junto do Sentinela em <span className="font-semibold text-gray-300">{SENTINEL_LABELS[currentSentinelMode]}</span>.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {Object.values(ORACLE_MODES).map((mode) => {
                    const isSelected = oraclePreferences.activeMode === mode.id;
                    const isLocked = !isPremium && mode.id !== 'neutro';

                    return (
                        <button
                            key={mode.id}
                            onClick={() => !isLocked && handleModeSelect(mode.id)}
                            className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
                                isSelected
                                    ? 'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/10'
                                    : 'border-white/5 bg-black/20 hover:bg-white/5'
                            } ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-[var(--skin-accent-color)]' : 'border-gray-500'}`}>
                                    {isSelected && <div className="h-2 w-2 rounded-full bg-[var(--skin-accent-color)]" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{mode.name}</span>
                                        {isLocked && (
                                            <span className="rounded border border-amber-500/20 bg-black/40 px-2 py-0.5 text-[10px] text-amber-500">
                                                PREMIUM
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">{mode.description}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {oraclePreferences.activeMode === 'personalizado' && (
                <div className="animate-fade-in rounded-xl border border-white/10 bg-black/20 p-4">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Instruções Personalizadas</label>
                    <textarea
                        className="h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-gray-200 focus:border-[var(--skin-accent-color)] focus:outline-none"
                        placeholder="Ex: Fale como um mestre zen, use metáforas de água..."
                        value={oraclePreferences.customModeInstructions || ''}
                        onChange={(e) => updateOraclePreferences({ customModeInstructions: e.target.value })}
                    />
                    <p className="mt-2 text-[10px] text-gray-600">O Oráculo tentará seguir esse tom nas mensagens.</p>
                </div>
            )}
        </div>
    );

    const renderCategories = () => {
        const categories: { id: OracleCategory; label: string; icon: string }[] = [
            { id: 'frases_inspiradoras', label: 'Frases Inspiradoras', icon: '🔥' },
            { id: 'reflexoes_filosoficas', label: 'Reflexões Filosóficas', icon: '🧠' },
            { id: 'fragmentos_sabedoria', label: 'Sabedoria Antiga', icon: '📜' },
            { id: 'dicas_produtividade', label: 'Produtividade', icon: '🎯' },
            { id: 'rituais_lifestyle', label: 'Lifestyle e Rituais', icon: '🌿' },
            { id: 'provocacoes', label: 'Provocações', icon: '⚡' },
            { id: 'sussurros_maestria', label: 'Sussurros da Maestria', icon: '👁️' },
            { id: 'analise_padroes', label: 'Análise de Padrões', icon: '🔄' },
        ];

        return (
            <div className="space-y-2">
                {categories.map((cat) => {
                    const isEnabled = oraclePreferences.enabledCategories.includes(cat.id);
                    return (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryToggle(cat.id)}
                            className={`flex w-full items-center justify-between rounded-xl border p-3 transition-all ${
                                isEnabled
                                    ? 'border-white/20 bg-white/10'
                                    : 'border-transparent bg-black/20 hover:bg-black/30'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{cat.icon}</span>
                                <span className={`text-sm font-medium ${isEnabled ? 'text-white' : 'text-gray-400'}`}>{cat.label}</span>
                            </div>
                            {isEnabled && <CheckIcon className="h-4 w-4 text-[var(--skin-accent-color)]" />}
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderManualLibraryCategories = () => {
        const categories: { id: OracleCategory; label: string; icon: string }[] = [
            { id: 'frases_inspiradoras', label: 'Frases Inspiradoras', icon: '🔥' },
            { id: 'reflexoes_filosoficas', label: 'Reflexões Filosóficas', icon: '🧠' },
            { id: 'fragmentos_sabedoria', label: 'Fragmentos de Sabedoria', icon: '📜' },
            { id: 'rituais_lifestyle', label: 'Dicas de Vida', icon: '🌿' },
            { id: 'sussurros_maestria', label: 'Sussurros da Maestria', icon: '👁️' },
        ];

        return (
            <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Biblioteca manual</div>
                    <p className="mt-2 text-xs leading-relaxed text-gray-400">
                        Esses são os cards de frases, reflexão e vida do botão manual.
                        Foco, análise e choque continuam no disparo automático do Oráculo.
                    </p>
                </div>
                {categories.map((cat) => {
                    const isEnabled = oraclePreferences.enabledCategories.includes(cat.id);
                    return (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryToggle(cat.id)}
                            className={`flex w-full items-center justify-between rounded-xl border p-3 transition-all ${
                                isEnabled
                                    ? 'border-white/20 bg-white/10'
                                    : 'border-transparent bg-black/20 hover:bg-black/30'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{cat.icon}</span>
                                <span className={`text-sm font-medium ${isEnabled ? 'text-white' : 'text-gray-400'}`}>{cat.label}</span>
                            </div>
                            {isEnabled && <CheckIcon className="h-4 w-4 text-[var(--skin-accent-color)]" />}
                        </button>
                    );
                })}
            </div>
        );
    };

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
                                            ? 'bg-white/10 text-white shadow-sm'
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
                                <div className="space-y-2">
                                    <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-gray-500">Oráculo</h3>
                                    {renderSwitchRow({
                                        icon: '✨',
                                        label: 'Oráculo IA',
                                        description: `Gera mensagens personalizadas no modo ${activeModeConfig.name}.`,
                                        enabled: Boolean(oraclePreferences.iaEnabled),
                                        onToggle: () => handleToggle('iaEnabled'),
                                    })}
                                    {renderSwitchRow({
                                        icon: '🔔',
                                        label: 'Avisos do Oráculo',
                                        description: `Controla avisos internos, feed e chamadas do Sentinela em ${SENTINEL_LABELS[currentSentinelMode]}.`,
                                        enabled: Boolean(oraclePreferences.notificationsEnabled),
                                        onToggle: () => handleToggle('notificationsEnabled'),
                                    })}
                                    {renderSwitchRow({
                                        icon: '📲',
                                        label: 'Push no aparelho',
                                        description: `${PUSH_PERMISSION_LABEL[pushPermission]}. Usa os avisos liberados pelo Oráculo fora do app.`,
                                        enabled: Boolean(oraclePreferences.pushEnabled),
                                        onToggle: handlePushToggle,
                                        accentClass: 'bg-emerald-500/70',
                                    })}
                                </div>

                                <div className="space-y-2">
                                    <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-gray-500">Sensorial</h3>
                                    {renderSwitchRow({
                                        icon: '✨',
                                        label: 'Animações',
                                        description: 'Mantém glows, sheens e transições do sistema.',
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
                                        label: 'Vibração',
                                        description: 'Usa resposta tátil em eventos importantes, quando suportado.',
                                        enabled: Boolean(oraclePreferences.hapticsEnabled),
                                        onToggle: () => handleToggle('hapticsEnabled'),
                                    })}
                                </div>

                                <div className="space-y-2">
                                    <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-gray-500">Oráculo Sentinela</h3>
                                    {[
                                        { id: 'soberano_ativo', label: 'Soberano Ativo', desc: 'Proativo, com alertas de fadiga, streak e santuário.' },
                                        { id: 'apenas_necessarias', label: 'Apenas Necessárias', desc: 'Filtra tudo, exceto gatilhos críticos de ciclo e Office.' },
                                        { id: 'nao_ia', label: 'Não-IA', desc: 'Troca as falas do Oráculo por avisos sistêmicos.' },
                                    ].map((mode) => {
                                        const selected = currentSentinelMode === mode.id;
                                        return (
                                            <button
                                                key={mode.id}
                                                onClick={() => handleSentinelModeSelect(mode.id as NonNullable<OraclePreferences['sentinelMode']>)}
                                                className={`w-full rounded-xl border p-3 text-left transition-all ${
                                                    selected
                                                        ? 'border-[var(--skin-accent-color)] bg-white/10 text-white'
                                                        : 'border-white/10 bg-black/20 text-gray-300 hover:bg-black/30'
                                                }`}
                                            >
                                                <div className="text-sm font-semibold">{mode.label}</div>
                                                <div className="mt-1 text-xs text-gray-400">{mode.desc}</div>
                                            </button>
                                        );
                                    })}
                                </div>
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
