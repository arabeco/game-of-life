import type { Action, RelationshipLinkType } from '../types';

export type ActionSurfaceBadge = {
    label: string;
    tone: 'group' | 'office' | 'mentor' | 'partner' | 'competition';
};

export const resolveActionSurfaceBadge = (
    action: Action,
    relationshipLinkType?: RelationshipLinkType | null,
): ActionSurfaceBadge | null => {
    const clanTask = action.context?.clanTask;
    if (clanTask || action.originCodexId?.startsWith('clan_quest:')) {
        const isOffice = clanTask?.clanType === 'Office';
        return {
            label: isOffice ? 'Equipe' : 'Grupo',
            tone: isOffice ? 'office' : 'group',
        };
    }

    if (relationshipLinkType === 'mentoria') {
        return { label: 'Mentoria', tone: 'mentor' };
    }
    if (relationshipLinkType === 'parceria') {
        return { label: 'Parceria', tone: 'partner' };
    }
    if (relationshipLinkType === 'competicao') {
        return { label: 'Duelo', tone: 'competition' };
    }

    return null;
};

export const getActionSurfaceBadgeClassName = (tone: ActionSurfaceBadge['tone']) => {
    switch (tone) {
        case 'office':
            return 'border-amber-300/30 bg-amber-500/16 text-amber-100';
        case 'group':
            return 'border-emerald-300/30 bg-emerald-500/14 text-emerald-100';
        case 'mentor':
            return 'border-violet-300/30 bg-violet-500/16 text-violet-100';
        case 'partner':
            return 'border-cyan-300/30 bg-cyan-500/14 text-cyan-100';
        case 'competition':
            return 'border-rose-300/30 bg-rose-500/16 text-rose-100';
        default:
            return 'border-white/15 bg-white/10 text-white/80';
    }
};
