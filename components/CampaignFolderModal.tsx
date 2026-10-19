import React, { useEffect, useRef } from 'react';
import { Arena, Campaign, ScheduledTask } from '../types';
import { getCampaignArenaStates } from '../utils/progressUtils';
import { useGame } from '../contexts/GameContext';
import { ArenaCard } from './ArenaCard';
import { Portal } from './Portal';
import './campaign-plate.css';

export const CampaignFolderModal: React.FC<{
    campaign: Campaign;
    arenas: Arena[];
    tasks: ScheduledTask[];
    onClose: () => void;
    onOpenArena: (id: string) => void;
    onDetails: () => void;
}> = ({ campaign, arenas, tasks, onClose, onOpenArena, onDetails }) => {
    const { getActionsForArena, getClanQuestsForArena, getClanQuestProgress, getSharedActionPoolProgress } = useGame();
    const states = getCampaignArenaStates({ campaign, tasks,
        arenasById: Object.fromEntries(arenas.map(arena => [arena.id, arena])),
        actionsByArena: Object.fromEntries(arenas.map(arena => [arena.id, getActionsForArena(arena.id)])),
        getClanQuestsForArena, getClanQuestProgress, getSharedActionPoolProgress,
    });
    const availableArenas = arenas.filter(arena => !states[arena.id]?.isLocked && !arena.isArchived);
    const panel = useRef<HTMLDivElement>(null);
    const close = useRef(onClose);
    close.current = onClose;
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        const frame = requestAnimationFrame(() => panel.current?.querySelector<HTMLButtonElement>('button')?.focus());
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') { event.preventDefault(); close.current(); }
            if (event.key !== 'Tab') return;
            const targets = panel.current?.querySelectorAll<HTMLElement>('button, [tabindex="0"]');
            if (!targets?.length) return;
            const first = targets[0], last = targets[targets.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', onKey);
        return () => { cancelAnimationFrame(frame); document.removeEventListener('keydown', onKey); previous?.focus(); };
    }, []);
    return <Portal>
        <div className="campaign-folder-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
            <div ref={panel} className="campaign-folder-panel" role="dialog" aria-modal="true" aria-labelledby="campaign-folder-title">
                <header><div><small>{availableArenas.length} {availableArenas.length === 1 ? 'arena liberada' : 'arenas liberadas'}</small><h2 id="campaign-folder-title">{campaign.title}</h2></div><button autoFocus onClick={onClose} aria-label="Fechar pasta">×</button></header>
                <div className="campaign-folder-grid">
                    {availableArenas.map(arena => <div key={arena.id} role="button" tabIndex={0} aria-disabled={states[arena.id]?.isLocked} aria-label={`Abrir arena ${arena.name}`} onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!states[arena.id]?.isLocked) onOpenArena(arena.id); }
                    }}><ArenaCard arena={arena} actions={getActionsForArena(arena.id)} tasks={tasks} variant="overview" onClick={() => { if (!states[arena.id]?.isLocked) onOpenArena(arena.id); }} disableAnimatedBackground />{states[arena.id]?.isLocked && <small>🔒 Complete os requisitos</small>}</div>)}
                </div>
                {!availableArenas.length && <p>Nenhuma arena liberada no momento. Consulte as fases nos detalhes.</p>}
                <footer><button onClick={onDetails}>Detalhes da campanha →</button></footer>
            </div>
        </div>
    </Portal>;
};
