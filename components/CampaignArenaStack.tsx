import React from 'react';
import { Action, Arena } from '../types';
import { useGame } from '../contexts/GameContext';
import { EmojiGlyph } from './EmojiGlyph';
import { getArenaTone } from '../utils/arenaTones';
import './campaign-plate.css';

interface CampaignArenaStackProps {
    arenas: Arena[];
    size?: 'xs' | 'sm' | 'md';
    actions?: Action[];
    maxVisible?: number;
}

/** Readable arena summaries shared by campaign thumbnails and previews. */
export const CampaignArenaStack: React.FC<CampaignArenaStackProps> = ({ arenas, size = 'sm', actions: actionsOverride, maxVisible }) => {
    const { actions } = useGame();
    const visible = arenas.slice(0, maxVisible ?? (size === 'md' ? 6 : size === 'xs' ? 3 : 4));
    const remaining = arenas.length - visible.length;
    const source = actionsOverride || actions;
    if (!visible.length) return <div className="campaign-arena-empty">Sem arenas</div>;
    return (
        <div className={`campaign-arena-list campaign-arena-list--${size}`}>
            {visible.map(arena => {
                const count = source.filter(action => action.arenaId === arena.id).length;
                return <div key={arena.id} className="campaign-arena-summary" style={{ '--campaign-accent': getArenaTone(arena) } as React.CSSProperties}>
                    <span className="campaign-arena-label">Arena</span>
                    <span className="campaign-arena-name"><span className="campaign-contained-emoji" aria-hidden><EmojiGlyph symbol={arena.icon || "◇"} size="milestone" /></span>{arena.name}</span>
                    <span className="campaign-arena-count">{count} {count === 1 ? 'ação' : 'ações'}</span>
                </div>;
            })}
            {remaining > 0 && <span className="campaign-arena-more">+{remaining} {remaining === 1 ? 'arena' : 'arenas'}</span>}
        </div>
    );
};
