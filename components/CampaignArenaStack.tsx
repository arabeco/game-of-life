import React from 'react';
import { Action, Arena, Campaign } from '../types';
import { useGame } from '../contexts/GameContext';
import { LockIcon } from './Icons';
import { EmojiGlyph } from './EmojiGlyph';
import { getArenaTone } from '../utils/arenaTones';
import './campaign-plate.css';

interface CampaignArenaStackProps {
    arenas: Arena[];
    size?: 'xs' | 'sm' | 'md';
    actions?: Action[];
    maxVisible?: number;
    campaign?: Campaign;
    arenaStates?: Record<string, { isLocked: boolean }>;
}

export function getCampaignArenaPhases(arenas: Arena[], campaign?: Campaign) {
    // Same phase precedence as the campaign detail: explicit phase, then prerequisites.
    const ids = new Set(arenas.map(arena => arena.id));
    const phases = new Map<string, number>();
    const phaseFor = (id: string, trail = new Set<string>()): number => {
        if (phases.has(id)) return phases.get(id)!;
        if (trail.has(id)) return 0;
        const config = campaign?.arenaConfig?.[id];
        if (typeof config?.phase === 'number') { phases.set(id, config.phase); return config.phase; }
        trail.add(id);
        const prereqs = (config?.prerequisiteArenaIds || []).filter(prereq => ids.has(prereq));
        const phase = prereqs.length ? Math.max(...prereqs.map(prereq => phaseFor(prereq, new Set(trail)))) + 1 : 0;
        phases.set(id, phase);
        return phase;
    };
    arenas.forEach(arena => phaseFor(arena.id));
    return phases;
}

/** Readable arena summaries shared by campaign thumbnails and previews. */
export const CampaignArenaStack: React.FC<CampaignArenaStackProps> = ({ arenas, size = 'sm', actions: actionsOverride, maxVisible, campaign, arenaStates }) => {
    const { actions } = useGame();
    const phases = getCampaignArenaPhases(arenas, campaign);
    const phaseFor = (id: string) => phases.get(id) ?? 0;
    const ordered = campaign ? [...arenas].sort((a, b) => phaseFor(a.id) - phaseFor(b.id)) : arenas;
    const visible = ordered.slice(0, maxVisible ?? (size === 'md' ? 6 : size === 'xs' ? 3 : 4));
    const remaining = arenas.length - visible.length;
    const source = actionsOverride || actions;
    if (!visible.length) return <div className="campaign-arena-empty">Sem arenas</div>;
    return (
        <div className={`campaign-arena-list campaign-arena-list--${size}`}>
            {visible.map((arena, index) => {
                const count = source.filter(action => action.arenaId === arena.id).length;
                const startsPhase = campaign && index > 0 && phaseFor(arena.id) !== phaseFor(visible[index - 1].id);
                return <React.Fragment key={arena.id}>
                    {startsPhase && <span className="campaign-phase-divider" role="separator" aria-orientation="vertical" aria-label={`Fase ${phaseFor(arena.id) + 1}`} title={`Fase ${phaseFor(arena.id) + 1}`} />}
                    <div className={`campaign-arena-summary${arenaStates?.[arena.id]?.isLocked ? ' campaign-arena-summary--locked' : ''}`} aria-label={arenaStates?.[arena.id]?.isLocked ? `${arena.name} — bloqueada: complete os requisitos` : undefined} title={arenaStates?.[arena.id]?.isLocked ? 'Complete as arenas anteriores para liberar' : arena.name} style={{ '--campaign-accent': getArenaTone(arena) } as React.CSSProperties}>
                    {arenaStates?.[arena.id]?.isLocked && <span className="campaign-arena-lock" aria-hidden><LockIcon /></span>}
                    <span className="campaign-arena-label">Arena</span>
                    <span className="campaign-arena-name"><span className="campaign-contained-emoji" aria-hidden><EmojiGlyph symbol={arena.icon || "◇"} size="milestone" /></span>{arena.name}</span>
                    <span className="campaign-arena-count">{count} {count === 1 ? 'ação' : 'ações'}</span>
                </div></React.Fragment>;
            })}
            {remaining > 0 && <span className="campaign-arena-more">+{remaining} {remaining === 1 ? 'arena' : 'arenas'}</span>}
        </div>
    );
};
