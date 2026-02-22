import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { OracleMode, OracleCategory, OraclePreferences } from '../types';
import { GlassCard } from './GlassCard';
import { XIcon, SparklesIcon, CheckIcon } from './Icons';
import { ORACLE_MODES } from '../constants/oracle';

interface OracleSettingsModalProps {
    onClose: () => void;
    onOpenChat?: () => void;
    variant?: 'preferences' | 'assistant';
}

export const OracleSettingsModal: React.FC<OracleSettingsModalProps> = ({ onClose, onOpenChat, variant = 'preferences' }) => {
    const { oraclePreferences, updateOraclePreferences, userProfile } = useGame();
    // Default tab depends on variant
    const [activeTab, setActiveTab] = useState<'geral' | 'modos' | 'categorias'>(variant === 'preferences' ? 'geral' : 'modos');

    if (!oraclePreferences) return null;

    const handleToggle = (key: keyof OraclePreferences) => {
        updateOraclePreferences({ [key]: !oraclePreferences[key] });
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

    const isPremium = userProfile.isPremium || userProfile.role === 'admin' || userProfile.role === 'gm';

    const renderGeral = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${oraclePreferences.iaEnabled ? 'bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)]' : 'bg-white/5 text-gray-500'}`}>
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">Oráculo IA</div>
                        <div className="text-xs text-gray-400">Gerar mensagens personalizadas</div>
                    </div>
                </div>
                <button 
                    onClick={() => handleToggle('iaEnabled')}
                    className={`w-12 h-6 rounded-full transition-colors relative ${oraclePreferences.iaEnabled ? 'bg-[var(--skin-accent-color)]' : 'bg-gray-700'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${oraclePreferences.iaEnabled ? 'left-7' : 'left-1'}`} />
                </button>
            </div>

            <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Sensorial</h3>
                {[
                    { key: 'notificationsEnabled', label: 'Notificações Push', icon: '🔔' },
                    { key: 'animationsEnabled', label: 'Animações', icon: '✨' },
                    { key: 'soundsEnabled', label: 'Sons', icon: '🔊' },
                    { key: 'hapticsEnabled', label: 'Vibração', icon: '📳' },
                ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-black/20 rounded-xl hover:bg-black/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-sm font-semibold text-gray-300">{item.label}</span>
                        </div>
                        <button 
                            onClick={() => handleToggle(item.key as keyof OraclePreferences)}
                            className={`w-10 h-5 rounded-full transition-colors relative ${oraclePreferences[item.key as keyof OraclePreferences] ? 'bg-green-500/50' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${oraclePreferences[item.key as keyof OraclePreferences] ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderModos = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
                {Object.values(ORACLE_MODES).map((mode) => {
                    const isSelected = oraclePreferences.activeMode === mode.id;
                    const isLocked = !isPremium && mode.id !== 'neutro';

                    return (
                        <button
                            key={mode.id}
                            onClick={() => !isLocked && handleModeSelect(mode.id)}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left relative overflow-hidden ${
                                isSelected 
                                ? 'bg-[var(--skin-accent-color)]/10 border-[var(--skin-accent-color)]' 
                                : 'bg-black/20 border-white/5 hover:bg-white/5'
                            } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-[var(--skin-accent-color)]' : 'border-gray-500'}`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--skin-accent-color)]" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{mode.name}</span>
                                    {isLocked && <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-amber-500 border border-amber-500/20">PREMIUM</span>}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{mode.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
            {oraclePreferences.activeMode === 'personalizado' && (
                <div className="mt-4 p-4 bg-black/20 rounded-xl border border-white/10 animate-fade-in">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Instruções Personalizadas</label>
                    <textarea
                        className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-[var(--skin-accent-color)] resize-none"
                        placeholder="Ex: Fale como um mestre zen, use metáforas de água..."
                        value={oraclePreferences.customModeInstructions || ''}
                        onChange={(e) => updateOraclePreferences({ customModeInstructions: e.target.value })}
                    />
                    <p className="text-[10px] text-gray-600 mt-2">O Oráculo tentará seguir este tom em todas as mensagens.</p>
                </div>
            )}
        </div>
    );

    const renderCategorias = () => {
        const categories: { id: OracleCategory, label: string, icon: string }[] = [
            { id: 'frases_inspiradoras', label: 'Frases Inspiradoras', icon: '🔥' },
            { id: 'reflexoes_filosoficas', label: 'Reflexões Filosóficas', icon: '🧠' },
            { id: 'fragmentos_sabedoria', label: 'Sabedoria Antiga', icon: '📜' },
            { id: 'dicas_produtividade', label: 'Produtividade', icon: '🎯' },
            { id: 'rituais_lifestyle', label: 'Lifestyle & Rituais', icon: '🌿' },
            { id: 'provocacoes', label: 'Provocações', icon: '⚡' },
            { id: 'sussurros_maestria', label: 'Sussurros da Maestria', icon: '👁️' },
            { id: 'analise_padroes', label: 'Análise de Padrões', icon: '🔀' },
        ];

        return (
            <div className="space-y-2">
                {categories.map((cat) => {
                    const isEnabled = oraclePreferences.enabledCategories.includes(cat.id);
                    return (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryToggle(cat.id)}
                            className={`flex items-center justify-between w-full p-3 rounded-xl border transition-all ${
                                isEnabled 
                                ? 'bg-white/10 border-white/20' 
                                : 'bg-black/20 border-transparent hover:bg-black/30'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{cat.icon}</span>
                                <span className={`text-sm font-medium ${isEnabled ? 'text-white' : 'text-gray-400'}`}>{cat.label}</span>
                            </div>
                            {isEnabled && <CheckIcon className="w-4 h-4 text-[var(--skin-accent-color)]" />}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 rounded-3xl flex flex-col max-h-[85vh] overflow-hidden !p-0" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                    <h2 className="text-sm font-black uppercase tracking-widest text-[var(--skin-accent-color)]">
                        {variant === 'preferences' ? 'Preferências' : 'Configurar Oráculo'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <XIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Tabs - Only show if variant is assistant */}
                {variant === 'assistant' && (
                    <div className="flex p-2 gap-1 border-b border-white/5 bg-black/20 flex-shrink-0">
                        {(['modos', 'categorias'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {variant === 'preferences' ? (
                        // Only show Notification toggles in Preferences mode
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Sensorial & Sistema</h3>
                                {[
                                    { key: 'iaEnabled', label: 'Oráculo IA', icon: '✨' },
                                    { key: 'notificationsEnabled', label: 'Notificações Push', icon: '🔔' },
                                    { key: 'animationsEnabled', label: 'Animações', icon: '✨' },
                                    { key: 'soundsEnabled', label: 'Sons', icon: '🔊' },
                                    { key: 'hapticsEnabled', label: 'Vibração', icon: '📳' },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between p-3 bg-black/20 rounded-xl hover:bg-black/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{item.icon}</span>
                                            <span className="text-sm font-semibold text-gray-300">{item.label}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleToggle(item.key as keyof OraclePreferences)}
                                            className={`w-10 h-5 rounded-full transition-colors relative ${oraclePreferences[item.key as keyof OraclePreferences] ? 'bg-[var(--skin-accent-color)]' : 'bg-gray-700'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${oraclePreferences[item.key as keyof OraclePreferences] ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Assistant Mode Content
                        <>
                            {activeTab === 'modos' && renderModos()}
                            {activeTab === 'categorias' && renderCategorias()}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-black/20 flex-shrink-0 space-y-2">
                    {onOpenChat && variant === 'assistant' && (
                        <button
                            onClick={() => {
                                onClose();
                                onOpenChat();
                            }}
                            className="w-full py-3 rounded-xl luxe-skin-button flex items-center justify-center gap-2"
                        >
                            <span>💬</span>
                            <span className="text-xs font-bold tracking-widest">ABRIR CHAT</span>
                        </button>
                    )}
                    
                    {/* OK Button for Preferences Mode */}
                    {variant === 'preferences' && (
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl luxe-skin-button flex items-center justify-center gap-2"
                        >
                            <span className="text-xs font-bold tracking-widest">OK</span>
                        </button>
                    )}
                </div>

            </GlassCard>
        </div>
    );
};
