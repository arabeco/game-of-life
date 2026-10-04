import React from 'react';
import type { RelationshipLinkType } from '../types';
import { CrownIcon, FlagIcon, FocusIcon, TrophyIcon, UsersIcon } from './Icons';

interface ArenaStatusTagsProps {
    relationshipType?: RelationshipLinkType | null;
    hasPersonalPact?: boolean;
    hasSeasonMission?: boolean;
    compact?: boolean;
    className?: string;
}

/**
 * SELLOS DE ESTADO DA ARENA.
 *
 * Eles nao mudam a cor do ativo nem explicam prazo ou placar. So dizem que a
 * arena esta ligada a alguma frente viva; os detalhes continuam em Vinculos,
 * Oraculo e Temporada.
 */
export const ArenaStatusTags: React.FC<ArenaStatusTagsProps> = ({
    relationshipType = null,
    hasPersonalPact = false,
    hasSeasonMission = false,
    compact = false,
    className = '',
}) => {
    const box = compact
        ? 'h-[13px] w-[13px] rounded-full border'
        : 'h-[19px] w-[19px] rounded-full border';
    const icon = compact ? 'h-[7px] w-[7px]' : 'h-[10px] w-[10px]';
    const seal = (label: string, tone: string, graphic: React.ReactNode) => (
        <span
            key={label}
            title={label}
            aria-label={`Arena com ${label.toLowerCase()}`}
            className={`inline-flex items-center justify-center backdrop-blur-[2px] shadow-[0_4px_10px_rgba(0,0,0,0.18)] ${box} ${tone}`}
        >
            {graphic}
        </span>
    );

    const tags = [
        hasPersonalPact
            ? seal('Pacto do Oráculo', 'border-amber-200/50 bg-amber-500/25 text-amber-100', <FocusIcon className={icon} />)
            : null,
        relationshipType === 'mentoria'
            ? seal('Mentoria', 'border-emerald-300/45 bg-emerald-500/28 text-emerald-200', <CrownIcon className={icon} />)
            : null,
        relationshipType === 'parceria'
            ? seal('Parceria', 'border-sky-300/45 bg-sky-500/28 text-sky-200', <UsersIcon className={icon} />)
            : null,
        relationshipType === 'competicao'
            ? seal('Competição', 'border-rose-300/45 bg-rose-500/28 text-rose-200', <TrophyIcon className={icon} />)
            : null,
        hasSeasonMission
            ? seal('Missão de temporada', 'border-violet-300/45 bg-violet-500/28 text-violet-100', <FlagIcon className={icon} />)
            : null,
    ].filter(Boolean);

    if (tags.length === 0) return null;
    return <span className={`inline-flex items-center gap-1 ${className}`}>{tags}</span>;
};
