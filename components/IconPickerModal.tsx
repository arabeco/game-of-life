
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

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10002] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-3xl m-4 space-y-4 rounded-[28px] core-surface-strong" onClick={e => e.stopPropagation()}>
                    <div className="space-y-1">
                        <h2 className="text-base font-semibold tracking-[0.08em] text-center text-white">Selecionar ícone</h2>
                        <p className="text-xs text-center text-gray-400">A biblioteca agora segue os 10 ativos para deixar as arenas mais legíveis.</p>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {ICON_PICKER_CATEGORIES.map(category => {
                            const isActive = activeCategory === category.id;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`min-w-fit px-3 py-2 rounded-xl border transition-all ${
                                        isActive
                                            ? isLightTheme
                                                ? 'text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.12)]'
                                                : 'text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)]'
                                            : isLightTheme
                                                ? 'text-slate-500 hover:text-slate-700'
                                                : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                    style={{
                                        background: isActive
                                            ? isLightTheme
                                                ? `linear-gradient(135deg, ${category.color}2f, rgba(255,255,255,0.96))`
                                                : `linear-gradient(135deg, ${category.color}55, rgba(10,10,10,0.92))`
                                            : isLightTheme
                                                ? 'rgba(15,23,42,0.04)'
                                                : 'rgba(255,255,255,0.03)',
                                        borderColor: isActive
                                            ? `${category.color}aa`
                                            : isLightTheme
                                                ? 'rgba(15,23,42,0.12)'
                                                : 'rgba(255,255,255,0.08)',
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <EmojiGlyph
                                            symbol={category.tabIcon}
                                            size="badge"
                                            className={
                                                isActive
                                                    ? isLightTheme
                                                        ? 'text-slate-900'
                                                        : 'text-white'
                                                    : isLightTheme
                                                        ? 'text-slate-500'
                                                        : 'text-gray-300'
                                            }
                                        />
                                        <span className="text-[11px] font-semibold tracking-[0.08em] whitespace-nowrap">{category.label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-black/25 p-3">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <EmojiGlyph symbol={currentCategory.tabIcon} size="badge" />
                                <span className="text-sm font-semibold text-white">{currentCategory.label}</span>
                            </div>
                            <span className="text-[11px] text-gray-500">{currentCategory.icons.length} opções</span>
                        </div>

                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-72 overflow-y-auto pr-1">
                            {currentCategory.icons.map(icon => (
                                <button
                                    key={`${currentCategory.id}-${icon}`}
                                    onClick={() => onSelect(icon)}
                                    className="aspect-square rounded-xl border border-white/6 bg-white/[0.03] flex items-center justify-center transition-transform hover:scale-105 hover:bg-white/[0.06] hover:border-white/12"
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
