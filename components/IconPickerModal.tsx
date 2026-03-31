import React, { useState } from 'react';
import { Portal } from './Portal';
import { GlassCard } from './GlassCard';
import { EmojiGlyph } from './EmojiGlyph';
import { ICON_PICKER_CATEGORIES } from '../constants/assetVisuals';
import { useGame } from '../contexts/GameContext';
import './core-ui.css';

interface IconPickerModalProps {
    onSelect: (icon: string) => void;
    onClose: () => void;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({ onSelect, onClose }) => {
    const { activeTheme } = useGame();
    const [activeCategory, setActiveCategory] = useState<(typeof ICON_PICKER_CATEGORIES)[number]['id']>('sugeridos');
    const currentCategory = ICON_PICKER_CATEGORIES.find(category => category.id === activeCategory) || ICON_PICKER_CATEGORIES[0];
    const isLightTheme = activeTheme === 'LIGHT';
    const categoryTextColor = isLightTheme ? '#27364a' : '#ffffff';
    const categoryMutedTextColor = isLightTheme ? 'rgba(39,54,74,0.8)' : 'rgba(209,213,219,0.88)';

    return (
        <Portal>
            <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="core-surface-strong m-4 w-full max-w-3xl space-y-4 rounded-[28px]" onClick={e => e.stopPropagation()}>
                    <div className="space-y-1">
                        <h2 className={`text-base text-center font-semibold tracking-[0.08em] ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>Selecionar ícone</h2>
                        <p className={`text-center text-xs ${isLightTheme ? 'text-slate-600' : 'text-gray-400'}`}>A biblioteca agora segue os 10 ativos para deixar as arenas mais legíveis.</p>
                    </div>

                    <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
                        {ICON_PICKER_CATEGORIES.map(category => {
                            const isActive = activeCategory === category.id;
                            const categoryColor = isActive ? categoryTextColor : categoryMutedTextColor;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`min-w-fit rounded-xl border px-3 py-2 transition-all ${
                                        isActive
                                            ? isLightTheme
                                                ? 'shadow-[0_10px_24px_rgba(15,23,42,0.12)]'
                                                : 'text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)]'
                                            : isLightTheme
                                                ? 'hover:-translate-y-[1px]'
                                                : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                    style={{
                                        background: isActive
                                            ? isLightTheme
                                                ? `linear-gradient(135deg, ${category.color}3a, rgba(255,255,255,0.98))`
                                                : `linear-gradient(135deg, ${category.color}55, rgba(10,10,10,0.92))`
                                            : isLightTheme
                                                ? 'rgba(255,255,255,0.62)'
                                                : 'rgba(255,255,255,0.03)',
                                        borderColor: isActive
                                            ? `${category.color}aa`
                                            : isLightTheme
                                                ? 'rgba(39,54,74,0.14)'
                                                : 'rgba(255,255,255,0.08)',
                                        color: categoryColor,
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <EmojiGlyph
                                            symbol={category.tabIcon}
                                            size="badge"
                                            className={isLightTheme ? '' : (isActive ? 'text-white' : 'text-gray-300')}
                                            style={isLightTheme ? { color: categoryColor } : undefined}
                                        />
                                        <span
                                            className="whitespace-nowrap text-[11px] font-black tracking-[0.08em]"
                                            style={isLightTheme ? { color: categoryColor } : undefined}
                                        >
                                            {category.label}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className={`rounded-2xl border p-3 ${isLightTheme ? 'border-slate-300/40 bg-white/55' : 'border-white/8 bg-black/25'}`}>
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <EmojiGlyph symbol={currentCategory.tabIcon} size="badge" />
                                <span className={`text-sm font-semibold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>{currentCategory.label}</span>
                            </div>
                            <span className={`text-[11px] ${isLightTheme ? 'text-slate-600' : 'text-gray-500'}`}>{currentCategory.icons.length} opções</span>
                        </div>

                        <div className="grid max-h-72 grid-cols-6 gap-2 overflow-y-auto pr-1 sm:grid-cols-8">
                            {currentCategory.icons.map(icon => (
                                <button
                                    key={`${currentCategory.id}-${icon}`}
                                    onClick={() => onSelect(icon)}
                                    className={`aspect-square rounded-xl border flex items-center justify-center transition-transform hover:scale-105 ${
                                        isLightTheme
                                            ? 'border-slate-300/30 bg-white/58 hover:bg-white/78 hover:border-slate-400/35'
                                            : 'border-white/6 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/12'
                                    }`}
                                >
                                    <EmojiGlyph symbol={icon} size="picker" />
                                </button>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
