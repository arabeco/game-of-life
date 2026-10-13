import React, { useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { FeedEventCard } from '../components/FeedEventCard';
import { FeedEvent, FeedEventType, UserProfile } from '../types';
import { ProfileView } from './ProfileView';
import { filtrarFeed, type AbaDoFeed as FeedFilter } from '../utils/feedAbas';

const sectionLabelByType: Partial<Record<FeedEventType, string>> = {
    MILESTONE_COMPLETED: 'Marcos',
    CYCLE_COMPLETED: 'Marcos',
    PLAYER_RANK_UP: 'Ascensoes',
    CLAN_RANK_UP: 'Ascensoes',
    ARENA_COMPLETED: 'Avancos',
    LEVEL_UP: 'Avancos',
    QUEST_COMPLETED: 'Avancos',
    REPORT_COMPLETED: 'Relatos',
};

const formatFeedDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
    });
};

export const HallOfFameView: React.FC = () => {
    const { feed, userProfile, friends, clan } = useGame();
    const [filter, setFilter] = useState<FeedFilter>('Reino');
    // Tocar no nome ou na foto de quem publicou abre o perfil dele.
    const [perfilAberto, setPerfilAberto] = useState<UserProfile | null>(null);

    // As abas nao se repetem: o Reino e so de quem nao e amigo, nem do cla, nem voce.
    const filteredFeed = useMemo(
        () => filtrarFeed(feed, filter, { meuId: userProfile.id, amigos: friends, meuCla: clan?.name }),
        [clan?.name, feed, filter, friends, userProfile.id]
    );

    const groupedFeed = useMemo(() => {
        const groups = new Map<string, FeedEvent[]>();
        filteredFeed.forEach((event) => {
            const bucket = `${formatFeedDate(event.timestamp)} · ${sectionLabelByType[event.type] || 'Movimento'}`;
            const existing = groups.get(bucket);
            if (existing) {
                existing.push(event);
            } else {
                groups.set(bucket, [event]);
            }
        });
        return Array.from(groups.entries());
    }, [filteredFeed]);

    return (
        <div className="space-y-4">
            {/* O cabecalho inteiro saiu.
                "Sinais do reino" nomeava a tela — que ja e a aba selecionada — e o
                bloco "EVENTOS 14" contava quantos cartoes estao logo abaixo, um
                numero que a propria lista mostra. Juntos ocupavam a primeira dobra
                da tela sem entregar nada: o conteudo comecava so depois deles. */}
            <div className="flex items-center justify-center rounded-2xl bg-black/20 p-1">
                {(['Reino', 'Grupo', 'Aliados'] as FeedFilter[]).map((entry) => (
                    <button
                        key={entry}
                        onClick={() => setFilter(entry)}
                        className={`w-full rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                            filter === entry ? 'bg-white/10 text-white shadow-[0_10px_25px_rgba(0,0,0,0.18)]' : 'text-gray-400 hover:bg-white/5'
                        }`}
                    >
                        {entry}
                    </button>
                ))}
            </div>

            <div className="space-y-5">
                {groupedFeed.length > 0 ? (
                    groupedFeed.map(([bucket, events]) => (
                        <section key={bucket} className="space-y-3">
                            <div className="flex items-center gap-3 px-1">
                                <div className="h-px flex-1 bg-white/10" />
                                <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">{bucket}</p>
                                <div className="h-px flex-1 bg-white/10" />
                            </div>
                            <div className="space-y-3">
                                {events.map((event) => (
                                    <FeedEventCard key={event.id} event={event} onAbrirPerfil={setPerfilAberto} />
                                ))}
                            </div>
                        </section>
                    ))
                ) : (
                    <div className="rounded-[26px] border border-dashed border-white/12 bg-black/15 px-6 py-12 text-center">
                        <p className="text-sm font-medium text-white/75">Nada apareceu neste recorte ainda.</p>
                        <p className="mt-2 text-sm text-white/45">Quando o reino voltar a se mover, os sinais surgem aqui.</p>
                    </div>
                )}
            </div>
            {perfilAberto && <ProfileView profile={perfilAberto} onClose={() => setPerfilAberto(null)} />}
        </div>
    );
};
