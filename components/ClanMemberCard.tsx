

import React from 'react';
import { UserProfile, EnrichedClanMember } from '../types';
import { useGame } from '../contexts/GameContext';
import { CrownIcon, XIcon } from './Icons';
import { UserAvatar } from './UserAvatar';

interface ClanMemberCardProps {
    member: EnrichedClanMember;
    isLeaderView?: boolean;
    onKick?: (member: EnrichedClanMember) => void;
}

export const ClanMemberCard: React.FC<ClanMemberCardProps> = ({ member, isLeaderView, onKick }) => {
    const { nobilityRanks, userProfile, clan, appMode } = useGame();
    const isBasicMode = appMode === 'BASIC';
    const isOfficeClan = clan?.clanType?.toLowerCase() === 'office';
    const rank = nobilityRanks.find(r => r.id === member.nobility.rankId);
    const isSelf = member.id === userProfile.id;

    const timeSince = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        const days = Math.floor(seconds / 86400);
        if (days > 1) return `${days} dias`;
        if (days === 1) return `1 dia`;
        const hours = Math.floor(seconds / 3600);
        if (hours > 1) return `${hours} horas`;
        return `algumas horas`;
    };

    return (
        <div className="bg-black/20 p-3 rounded-2xl flex items-center space-x-3 border border-white/10 animate-fade-in group">
            <UserAvatar avatarUrl={member.avatarUrl} nickname={member.nickname} className="w-12 h-12" level={member.level} isOnline={false} showBorder={false} />
            <div className="flex-grow min-w-0">
                <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-white truncate">{member.nickname}</h4>
                    {isSelf && <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold)] bg-[var(--gold)]/10 px-2 py-0.5 rounded-full flex-shrink-0">Você</span>}
                    {member.role === 'leader' && (
                        <span className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-yellow-300 bg-yellow-400/10 px-2 py-0.5 rounded-full flex-shrink-0">
                            {isOfficeClan ? null : <CrownIcon className="w-3 h-3" />}
                            <span>{isOfficeClan ? 'Diretor' : 'Líder'}</span>
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-400 truncate">{isOfficeClan ? 'Na equipe' : 'Membro'} há {timeSince(member.joined_at)}</p>
            </div>
            {isLeaderView && member.role !== 'leader' && onKick && (
                <button onClick={() => onKick(member)} className="p-1 text-red-500 hover:text-red-400">
                    <XIcon className="w-5 h-5" />
                </button>
            )}
            <div className="text-right flex-shrink-0">
                <p className="font-bold text-sm text-[var(--gold)]">{rank?.name || 'N/A'}</p>
                <p className="text-xs text-gray-500">{isOfficeClan ? 'Cargo' : 'Patente'}</p>
            </div>
        </div>
    );
};
