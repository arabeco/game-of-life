import React from 'react';
import { UserProfile } from '../types';

import { ProfileBackgroundSurface } from './ProfileBackgroundSurface';
import { UserAvatar } from './UserAvatar';
import { resolveCatalogAssetUrl } from '../constants/catalogAssets';
import { ClanEmblem } from './ClanEmblem';
import { CrownIcon } from './Icons';
import { useCoroa } from '../utils/coroas';

export const SocialCard: React.FC<{
    profile: UserProfile;
    subtitle?: string;
    badges?: React.ReactNode;
    actions?: React.ReactNode;
    onClick?: () => void;
    /** Forca a coroa (ex.: o proprio perfil); sem isso, pergunta ao servidor. */
    coroa?: boolean;
}> = ({ profile, subtitle, badges, actions, onClick, coroa }) => {
    const coroaDoServidor = useCoroa(coroa === undefined ? profile.id : null);
    const temCoroa = coroa ?? coroaDoServidor;
    return (
        <div
            /* `h-16` fixo com `overflow-hidden` cortava o proprio conteudo. A coluna
               do meio empilha nome, selos e banner, e tres coisas nao cabem em
               64px — o que sobrava era aparado sem aviso. `min-h-16` mantem a
               altura de sempre para o card simples e deixa crescer quando ha
               selo, em vez de esconder. */
            className={`min-h-16 rounded-3xl relative overflow-hidden border border-[var(--glass-border)] group ${onClick ? 'cursor-pointer hover:border-white/30 transition-colors' : ''}`}
            onClick={onClick}
        >
            <div className="absolute inset-0">
                <ProfileBackgroundSurface value={profile.backgroundUrl} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.3)_100%)]" />
            </div>

            <div className="relative z-10 flex h-full items-center gap-3 px-3 py-2">
                <UserAvatar avatarUrl={profile.avatarUrl} nickname={profile.nickname} className="w-12 h-12" isOnline={false} level={profile.level} borderId={profile.border} />

                <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <h3 className="social-card-title flex min-w-0 items-center gap-1 font-bold text-lg text-white leading-tight">
                        <span className="truncate">{profile.nickname}</span>
                        {temCoroa && <CrownIcon className="h-4 w-4 flex-shrink-0 text-yellow-400 drop-shadow-[0_0_4px_rgba(234,179,8,0.6)]" />}
                    </h3>

                    {badges && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                            {badges}
                        </div>
                    )}

                    {profile.bannerUrl && (
                        <div className="mt-0.5 h-6 self-start">
                            <img
                                src={resolveCatalogAssetUrl(profile.bannerUrl)}
                                alt="Banner"
                                className="h-full object-contain drop-shadow-sm opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    )}
                </div>

                <div className="flex max-w-[7.75rem] flex-col items-end justify-center text-right pr-1 shrink-0">
                    <span className="social-card-kicker text-[9px] font-bold text-gray-500 uppercase tracking-widest opacity-60 mb-0.5">
                        {/* O GRUPO PERDIA A VAGA PARA UMA INFORMACAO REPETIDA.
                            Quem tem vinculo tem subtitulo, e o subtitulo dizia o
                            MESMO que os selos ao lado do nome — "Parceria" duas
                            vezes no mesmo card, e o grupo sumindo para caber a
                            repeticao. O grupo vem primeiro: ele so existe aqui. */}
                        {profile.clanName ? 'GRUPO' : (subtitle ? 'INFO' : '')}
                    </span>
                    <div className="social-card-meta max-w-full text-[10px] text-gray-300 flex items-center gap-1 opacity-90 bg-black/20 px-1.5 py-0.5 rounded-md border border-white/5">
                        {profile.clanName ? (
                            <>
                                {profile.clanIcon && <ClanEmblem value={profile.clanIcon} className="h-4 w-4 text-xs" />}
                                <span className="max-w-[70px] truncate font-medium">{profile.clanName}</span>
                            </>
                        ) : (subtitle ?? <span className="max-w-[70px] truncate font-medium">Sem Grupo</span>)}
                    </div>
                </div>

                {actions && <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>{actions}</div>}
            </div>
        </div>
    );
};
