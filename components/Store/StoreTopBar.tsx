import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';

export type StoreTab = 'store' | 'forge' | 'codexes' | 'items';

type StoreTopBarProps = {
    activeTab: StoreTab;
    onTabChange: (tab: StoreTab) => void;
};

const STORE_TABS: Array<{ id: StoreTab; label: string; icon?: string }> = [
    { id: 'store', label: 'Ouro', icon: '\u{1FA99}' },
    { id: 'forge', label: 'Forja' },
    { id: 'codexes', label: 'Campanhas' },
    { id: 'items', label: 'Itens' },
];

export const StoreTopBar: React.FC<StoreTopBarProps> = ({ activeTab, onTabChange }) => {
    const { userProfile } = useGame();
    const { gold, fragments } = userProfile.wallet || { gold: 0, fragments: 0 };

    return (
        <GlassCard className="sticky top-0 z-50 mb-4 border-white/10 bg-black/40 p-2.5 backdrop-blur-md">
            <div className="flex items-center gap-2">
                <div className="shrink-0 rounded-2xl border border-white/10 bg-black/25 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <div className="flex items-center gap-1.5 text-[11px] font-black leading-none text-[var(--skin-accent-color)]">
                        <span className="text-sm">{'\u{1FA99}'}</span>
                        <span>{gold.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-black leading-none text-cyan-400">
                        <span className="text-sm">{'\u{1F48E}'}</span>
                        <span>{fragments.toLocaleString('pt-BR')}</span>
                    </div>
                </div>

                <div className="store-subtab-strip grid flex-1 grid-cols-4 gap-1.5 rounded-2xl bg-black/30 p-1.5">
                    {STORE_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            className={`store-subtab-button min-h-[38px] rounded-xl px-1.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition-all ${activeTab === tab.id ? 'luxe-skin-button store-subtab-button-active' : 'luxe-button-secondary store-subtab-button-inactive'}`}
                            aria-label={tab.label}
                            title={tab.label}
                        >
                            {tab.icon ? <span className="text-[14px] leading-none">{tab.icon}</span> : <span className="whitespace-nowrap leading-none">{tab.label}</span>}
                        </button>
                    ))}
                </div>
            </div>
        </GlassCard>
    );
};
