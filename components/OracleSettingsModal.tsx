import React, { useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { OracleCategory, OracleMode, OraclePreferences, OraclePresenceLevel } from '../types';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { XIcon, CheckIcon } from './Icons';
import {
    disableAppPushRegistration,
    getAppPushPermission,
    getNativePushPlatform,
    getNativePushProviderLabel,
    getAppPushSupport,
    requestAppPushPermission,
    syncAppPushRegistration,
    type AppPushPermission,
    type AppPushSyncResult,
} from '../utils/pushRuntime';
import {
    ORACLE_FREE_TONE,
    ORACLE_PREMIUM_TONES,
    ORACLE_TONE_LABELS,
    type OracleSpeechTone,
} from '../constants/oracleSpeechLibrary';
import { hasPremiumAccess } from '../utils/premiumAccess';
import { DEFAULT_ORACLE_PRESENCE_LEVEL } from '../utils/oracleFeedUtils';
import { ORACLE_PRESENCE_ORDER, ORACLE_PRESENCE_RULES } from '../constants/oraclePresencePolicy';

interface OracleSettingsModalProps {
    onClose: () => void;
    onOpenChat?: () => void;
    variant?: 'preferences' | 'assistant';
}

type ToggleKey = 'dailyFocusCardEnabled' | 'dmNotificationsEnabled' | 'animationsEnabled' | 'soundsEnabled' | 'hapticsEnabled';

// Os textos e as regras vivem em constants/oraclePresencePolicy: o que cada
// nivel faz estava espalhado entre este modal, o cron e o portao de push, e por
// isso nao batia entre si.
const ORACLE_PRESENCE_LEVELS = ORACLE_PRESENCE_ORDER.map((value) => ORACLE_PRESENCE_RULES[value]);


const PUSH_PERMISSION_LABEL: Record<AppPushPermission, string> = {
    prompt: 'Aguardando permissao',
    granted: 'Permitido no aparelho',
    denied: 'Bloqueado no aparelho',
    unsupported: 'Sem suporte neste aparelho',
};

const MANUAL_LIBRARY_CATEGORIES: { id: OracleCategory; label: string; icon: string }[] = [
    { id: 'frases_inspiradoras', label: 'Frases Inspiradoras', icon: '🔥' },
    { id: 'reflexoes_filosoficas', label: 'Reflexões Filosóficas', icon: '🧠' },
    { id: 'fragmentos_sabedoria', label: 'Fragmentos de Sabedoria', icon: '📜' },
    { id: 'rituais_lifestyle', label: 'Dicas de Vida', icon: '🌿' },
    { id: 'sussurros_maestria', label: 'Sussurros da Maestria', icon: '👁️' },
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
    .replaceAll('\u00C3\u00A1', 'a')
    .replaceAll('\u00C3\u00A2', 'a')
    .replaceAll('\u00C3\u00A3', 'a')
    .replaceAll('\u00C3\u00A0', 'a')
    .replaceAll('\u00C3\u00A7', 'c')
    .replaceAll('\u00C3\u00A9', 'e')
    .replaceAll('\u00C3\u00AA', 'e')
    .replaceAll('\u00C3\u00AD', 'i')
    .replaceAll('\u00C3\u00B3', 'o')
    .replaceAll('\u00C3\u00B4', 'o')
    .replaceAll('\u00C3\u00B5', 'o')
    .replaceAll('\u00C3\u00BA', 'u')
    .replaceAll('\u00C2\u00B0', 'o')
    .replaceAll('\u00C2', '')
    .replaceAll('\u00E2\u20AC\u00A6', '...')
    .replaceAll('\u00E2\u20AC\u201D', '-')
    .replaceAll('\u00E2\u20AC\u201C', '-')
    .replaceAll('\u00E2\u2020\u2019', '->');

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
    const { oraclePreferences, updateOraclePreferences, userProfile, showToast } = useGame();
    const [pushPermission, setPushPermission] = useState<AppPushPermission>('default');

    const isPremium = hasPremiumAccess(userProfile);
    const pushSupport = getAppPushSupport();

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            const permission = await getAppPushPermission();
            if (!cancelled) {
                setPushPermission(permission);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [oraclePreferences?.pushEnabled]);

    // As preferencias chegam do banco depois da primeira renderizacao, e ate
    // chegarem este `return` fica no caminho. Ele precisa vir DEPOIS dos hooks:
    // acima deles a contagem de hooks mudava entre uma renderizacao e outra, o
    // que o React nao aceita.
    //
    // E ele nao devolve mais vazio. Vazio era o bug que se via: o toque em
    // "Oraculo & Alertas" marcava o modal como aberto, o componente desenhava
    // nada, e a tela ficava igual — parecia botao morto. No navegador as
    // preferencias ja estao carregadas quando se chega em Ajustes; num aparelho
    // recem-instalado, nao.
    if (!oraclePreferences) {
        return (
            <Portal>
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
                    <GlassCard variant="neutral" className="w-full max-w-sm rounded-3xl border border-white/10 p-6 text-center">
                        <div className="mx-auto h-8 w-8 animate-pulse rounded-full border border-[var(--skin-accent-color)]/35 bg-[var(--skin-accent-color)]/12" />
                        <div className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/70">
                            Carregando preferencias
                        </div>
                    </GlassCard>
                </div>
            </Portal>
        );
    }

    const handleToggle = (key: ToggleKey) => {
        if (key === 'dailyFocusCardEnabled') {
            const nextEnabled = !Boolean(oraclePreferences.dailyFocusCardEnabled);
            updateOraclePreferences({ dailyFocusCardEnabled: nextEnabled });
            return;
        }

        updateOraclePreferences({ [key]: !Boolean(oraclePreferences[key]) } as Partial<OraclePreferences>);
    };

    const handlePushToggle = async () => {
        const nextEnabled = !Boolean(oraclePreferences.pushEnabled);

        if (!nextEnabled) {
            await disableAppPushRegistration();
            await updateOraclePreferences({ pushEnabled: false });
            showToast('Push no aparelho desativado.', 'info');
            return;
        }

        const permission = await requestAppPushPermission();
        setPushPermission(permission);

        if (permission !== 'granted') {
            await updateOraclePreferences({ pushEnabled: false });
            showToast('Permissao de push negada. Os avisos continuam dentro do app.', 'warning');
            return;
        }

        const remoteSync = await syncAppPushRegistration();
        await updateOraclePreferences({ pushEnabled: true, notificationsEnabled: true });

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


    const handlePresenceChange = (level: OraclePresenceLevel) => {
        updateOraclePreferences({
            presenceLevel: level,
            notificationsEnabled: true,
        });
    };

    const handleToneChange = (tone: OracleSpeechTone) => {
        if (tone !== ORACLE_FREE_TONE && !isPremium) return;
        updateOraclePreferences({ speechTone: tone });
    };

    const handleCategoryToggle = (category: OracleCategory) => {
        // Escolher tema passou a ser O beneficio do Premium. O card automatico
        // virou um por dia para todo mundo — a pool tem 3 variacoes por estado, e
        // volume maior entregaria repeticao — entao o que se vende agora e
        // profundidade: escolher o assunto e poder pedir na hora.
        if (!isPremium) {
            showToast('Escolher temas e do Premium. O card do dia continua entrando de qualquer forma.', 'info');
            return;
        }
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


    // Jeito de falar: muda so o texto que o Oraculo solta no momento do evento.
    // Nao mexe nos cards de conteudo nem nos avisos de sistema.
    const renderToneChooser = () => {
        const saved = oraclePreferences.speechTone;
        const current: OracleSpeechTone = saved && (saved === ORACLE_FREE_TONE || (isPremium && ORACLE_PREMIUM_TONES.includes(saved)))
            ? saved
            : ORACLE_FREE_TONE;
        const tones: OracleSpeechTone[] = [ORACLE_FREE_TONE, ...ORACLE_PREMIUM_TONES];

        return (
            <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Jeito de falar</div>
                        <div className="mt-1 text-sm font-black text-white">{ORACLE_TONE_LABELS[current].name}</div>
                    </div>
                    {!isPremium && (
                        <span className="rounded-full border border-amber-400/30 bg-amber-400/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-amber-200">
                            Premium
                        </span>
                    )}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{ORACLE_TONE_LABELS[current].hint}</p>
                <div className="mt-3 grid grid-cols-2 gap-1 text-center">
                    {tones.map((tone) => {
                        const locked = tone !== ORACLE_FREE_TONE && !isPremium;
                        return (
                            <button
                                key={tone}
                                type="button"
                                onClick={() => handleToneChange(tone)}
                                disabled={locked}
                                className={`rounded-lg px-1 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] transition-colors ${
                                    current === tone
                                        ? 'bg-[var(--skin-accent-color)]/16 text-white'
                                        : locked
                                            ? 'cursor-not-allowed bg-white/[0.02] text-white/20'
                                            : 'bg-white/[0.035] text-white/38 hover:text-white/70'
                                }`}
                            >
                                {ORACLE_TONE_LABELS[tone].name}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderPresenceSlider = () => {
        const storedLevel = oraclePreferences.presenceLevel ?? DEFAULT_ORACLE_PRESENCE_LEVEL;
        const currentLevel: OraclePresenceLevel = storedLevel <= 0 ? 0 : storedLevel >= 3 ? 3 : 2;
        const current = ORACLE_PRESENCE_LEVELS.find((level) => level.value === currentLevel) || ORACLE_PRESENCE_LEVELS[1];

        return (
            <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Presenca</div>
                        <div className="mt-1 text-sm font-black text-white">{current.label}</div>
                    </div>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{current.caption}</p>
                <div className="mt-3 grid grid-cols-3 gap-1 text-center">
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

    const renderManualLibraryCategories = () => (
            <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Temas assinados</div>
                    <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
                        {isPremium
                            ? 'Um card por dia entra sozinho. Aqui voce escolhe de que assunto ele fala, e pode pedir mais na hora.'
                            : 'Um card por dia entra sozinho, sempre. Escolher o assunto e pedir na hora e do Premium.'}
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
                            } ${isPremium ? '' : 'opacity-45'}`}
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


                    <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
                        {variant === 'preferences' ? (
                            <div className="space-y-4">
                                {renderPresenceSlider()}
                                {renderToneChooser()}

                                <div className="space-y-2 pt-1">
                                    <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-gray-500">Temas dos cards</h3>
                                    {renderSwitchRow({
                                        icon: 'CD',
                                        label: 'Receber conteudo automaticamente',
                                        description: 'No maximo um por dia. No chat, ainda da para pedir um de cada tema.',
                                        enabled: Boolean(oraclePreferences.dailyFocusCardEnabled),
                                        onToggle: () => handleToggle('dailyFocusCardEnabled'),
                                        accentClass: 'bg-amber-500/70',
                                    })}
                                    {renderManualLibraryCategories()}
                                </div>

                                <div className="space-y-1 pt-1">
                                    <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-gray-500">Avisos</h3>
                                    {renderSwitchRow({
                                        icon: 'DM',
                                        label: 'Mensagens e convites',
                                        description: 'Independem do jeito de falar e da presenca do Oraculo.',
                                        enabled: Boolean(oraclePreferences.dmNotificationsEnabled),
                                        onToggle: () => handleToggle('dmNotificationsEnabled'),
                                        accentClass: 'bg-sky-500/70',
                                    })}
                                    {renderSwitchRow({
                                        icon: 'P',
                                        label: 'Avisos no aparelho',
                                        description: `Só o push. Desligado, a fala continua e espera no Oráculo. ${PUSH_PERMISSION_LABEL[pushPermission]}`,
                                        enabled: Boolean(oraclePreferences.pushEnabled),
                                        onToggle: handlePushToggle,
                                        accentClass: 'bg-emerald-500/70',
                                    })}
                                </div>

                                <div className="space-y-2">
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
                                        icon: '🎉',
                                        label: 'Telas de comemoracao',
                                        description: 'Desligado, o feito vira toast e a recompensa entra do mesmo jeito.',
                                        enabled: oraclePreferences.celebrationScreensEnabled !== false,
                                        onToggle: () => updateOraclePreferences({
                                            celebrationScreensEnabled: oraclePreferences.celebrationScreensEnabled === false,
                                        }),
                                    })}
                                    {renderSwitchRow({
                                        icon: '📳',
                                        label: 'Vibracao',
                                        description: 'Usa resposta tatil em eventos importantes, quando suportado.',
                                        enabled: Boolean(oraclePreferences.hapticsEnabled),
                                        onToggle: () => handleToggle('hapticsEnabled'),
                                    })}
                                </div>
                            </div>
                        ) : (
                            renderManualLibraryCategories()
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
