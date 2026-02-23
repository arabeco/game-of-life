
import React from 'react';
import { Clan } from '../types';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';

interface ClanSearchResultCardProps {
    clan: Clan;
    onJoin: () => void;
}

export const ClanSearchResultCard: React.FC<ClanSearchResultCardProps> = ({ clan, onJoin }) => {
    const { clanRanks, clan: userClan, clanJoinRequestsOutgoing } = useGame();
    const rank = clanRanks.find(r => r.id === clan.rankId);

    const isMemberOfThisClan = userClan?.id === clan.id;
    const isMemberOfAnyClan = !!userClan;
    const isPrivate = clan.recruitment_status === 'Privado';
    const hasPendingRequest = clanJoinRequestsOutgoing.some(request => request.clanId === clan.id && request.status === 'pending');

    let buttonText = 'Entrar';
    let isDisabled = false;

    if (isMemberOfThisClan) {
        buttonText = 'Membro';
        isDisabled = true;
    } else if (isMemberOfAnyClan) {
        buttonText = 'Em um clã';
        isDisabled = true;
    } else if (hasPendingRequest) {
        buttonText = 'Solicitado';
        isDisabled = true;
    } else if (isPrivate) {
        buttonText = 'Solicitar';
    }

    return (
        <GlassCard variant="neutral" className="p-3">
            <div className="flex items-center space-x-4">
                <span className="text-4xl">{clan.icon}</span>
                <div className="flex-grow">
                    <h4 className="font-bold text-white">{clan.name}</h4>
                    <p className="text-xs text-gray-400">{rank?.name || 'N/A'} • {clan.clanType} • {clan.recruitmentStatus}</p>
                </div>
                <button 
                    onClick={onJoin} 
                    disabled={isDisabled}
                    className="px-4 py-2 bg-white/10 text-sm font-bold rounded-lg hover:bg-white/20 disabled:bg-black/20 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    {buttonText}
                </button>
            </div>
        </GlassCard>
    );
};
