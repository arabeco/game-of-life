import React, { useEffect, useMemo, useState } from 'react';
import { GlassCard } from './GlassCard';
import { CheckIcon } from './Icons';
import { useGame } from '../contexts/GameContext';
import { Season, SeasonMission, SeasonQuest } from '../types';
import { MissionCompletionModal } from './MissionCompletionModal';
import { Portal } from './Portal';
import type { SeasonConfig, SeasonLaunchHighlights } from '../constants/seasonContent';
import { buildSeasonFromConfig, getEraCalendarYears, getNextSeasonConfig, getSeasonConfigById, isGenesisSeason, resolveSeasonArchiveLogEntry, resolveSeasonBackgroundUrl, resolveSeasonLoreText } from '../utils/seasonPresentation';

const DetailModalShell: React.FC<{
    title: string;
    icon?: string;
    description: string;
    badge: string;
    progress: number;
    onClose: () => void;
    children?: React.ReactNode;
    footer: React.ReactNode;
}> = ({ title, icon, description, badge, progress, onClose, children, footer }) => (
    <Portal>
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div className="relative flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-[20px] border border-[var(--skin-accent-color)]/20 bg-[linear-gradient(180deg,rgba(14,14,14,0.98),rgba(4,4,4,0.99))] shadow-[0_0_50px_rgba(0,0,0,0.8)]" onClick={(event) => event.stopPropagation()}>
                <div className="flex justify-end p-4 pb-0">
                    <button onClick={onClose} className="rounded-[10px] border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/80 transition-colors hover:bg-black/60">
                        OK
                    </button>
                </div>
                <div className="custom-scrollbar flex-1 overflow-y-auto px-5 pb-5 pt-4">
                    <div className="space-y-4 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[16px] border border-[var(--skin-accent-color)]/35 bg-white/5 text-3xl shadow-[0_0_20px_var(--sephirot-glow-color)]">
                            {icon || 'o'}
                        </div>
                        <div className="space-y-2">
                            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/68">
                                {badge}
                            </span>
                            <h3 className="text-xl font-black uppercase tracking-[0.16em] text-white luxe-title-shadow">{title}</h3>
                            <p className="text-sm leading-relaxed text-white/72">"{description}"</p>
                        </div>
                        <div className="space-y-2 rounded-[16px] border border-white/8 bg-white/[0.03] p-4 text-left">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-white/54">
                                <span>Progresso</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full border border-white/5 bg-black/40 p-[1px]">
                                <div className="h-full rounded-full bg-gradient-to-r from-[var(--skin-accent-color)] to-white transition-all duration-700" style={{ width: `${Math.min(100, progress)}%` }} />
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
                <div className="border-t border-white/8 p-4">{footer}</div>
            </div>
        </div>
    </Portal>
);

export const QuestDetailModal: React.FC<{
    quest: SeasonQuest;
    progress: number;
    isActive: boolean;
    participants?: number;
    onClose: () => void;
    onTake: () => void;
    onAbandon?: () => void;
    onClaim?: () => void;
    canClaim?: boolean;
}> = ({ quest, progress, isActive, participants, onClose, onTake, onAbandon, onClaim, canClaim }) => (
    <DetailModalShell
        title={quest.title}
        icon={quest.actionTemplate?.icon}
        description={quest.description}
        badge={quest.type === 'clan' ? 'Jornada de grupo' : 'Jornada pessoal'}
        progress={progress}
        onClose={onClose}
        footer={
            canClaim ? (
                <button onClick={onClaim} className="w-full rounded-xl bg-green-600 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-colors hover:bg-green-500">
                    Resgatar
                </button>
            ) : !isActive ? (
                quest.type === 'clan' ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-white/58">
                        Ative pelo menu do grupo
                    </div>
                ) : (
                    <button onClick={onTake} className="w-full rounded-xl py-3 text-xs font-black uppercase tracking-[0.2em] text-black shadow-[0_0_20px_var(--sephirot-glow-color)] luxe-skin-button">
                        Aceitar missao
                    </button>
                )
            ) : onAbandon ? (
                <div className="grid grid-cols-2 gap-3">
                    <button className="cursor-not-allowed rounded-xl border border-white/8 bg-white/5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">
                        Em andamento
                    </button>
                    <button onClick={onAbandon} className="rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-red-300 transition-colors hover:bg-red-500/20">
                        Abandonar
                    </button>
                </div>
            ) : (
                <button onClick={onClose} className="w-full rounded-xl border border-white/8 bg-white/5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 transition-colors hover:bg-white/10">
                    Voltar
                </button>
            )
        }
    >
        <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3 text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/48">XP</div>
                <div className="mt-1 text-lg font-black text-white">+{quest.rewards.xp}</div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3 text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/48">Status</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/76">{isActive ? 'Ativa' : 'Pendente'}</div>
            </div>
        </div>
        {typeof participants === 'number' && (
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3 text-center text-xs font-bold text-white/68">
                {participants} ativos agora
            </div>
        )}
    </DetailModalShell>
);

const MissionDetailModal: React.FC<{
    mission: SeasonMission;
    progress: number;
    isCompleted: boolean;
    onClose: () => void;
    onClaim: () => void;
}> = ({ mission, progress, isCompleted, onClose, onClaim }) => (
    <DetailModalShell
        title={mission.title}
        icon={mission.icon}
        description={mission.description}
        badge={mission.type === 'clan' ? 'Missao de grupo' : 'Missao de temporada'}
        progress={progress}
        onClose={onClose}
        footer={!isCompleted && progress >= 100 ? (
            <button onClick={onClaim} className="w-full rounded-xl bg-green-600 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-colors hover:bg-green-500">
                Resgatar
            </button>
        ) : (
            <button onClick={onClose} className="w-full rounded-xl border border-white/8 bg-white/5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 transition-colors hover:bg-white/10">
                Voltar
            </button>
        )}
    >
        <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/48">Recompensa</div>
            <div className="mt-1 text-lg font-black text-white">+{mission.reward_value}</div>
        </div>
    </DetailModalShell>
);

const CompactSeasonEntryCard: React.FC<{
    title: string;
    icon?: string;
    metaLabel: string;
    progress: number;
    isClaimed: boolean;
    participants?: number;
    onClick: () => void;
}> = ({ title, icon, metaLabel, progress, isClaimed, participants, onClick }) => {
    const isReadyToClaim = progress >= 100 && !isClaimed;

    return (
        <GlassCard variant="neutral" className="relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 p-3 transition-all duration-300 hover:border-white/20 hover:bg-white/5 active:scale-[0.99]" onClick={onClick}>
            <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/6 blur-2xl" />
            <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-xl shadow-inner">{icon || 'o'}</div>
                        <div className="min-w-0">
                            <h3 className="line-clamp-2 text-sm font-black uppercase tracking-[0.08em] text-white luxe-title-shadow">{title}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="rounded-md border border-white/8 bg-white/8 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-gray-300">{metaLabel}</span>
                                {typeof participants === 'number' && <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-gray-400">{participants} ativos</span>}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em]">
                            <span className="text-gray-400">Progresso</span>
                            <span className="font-mono text-white">{Math.round(progress)}%</span>
                        </div>
                        <div className="relative h-2 overflow-hidden rounded-full border border-white/5 bg-black/40 p-[1px]">
                            <div className={`h-full rounded-full transition-all duration-700 ${isClaimed ? 'bg-gradient-to-r from-green-400 to-green-200' : 'bg-gradient-to-r from-[var(--skin-accent-color)] to-white'}`} style={{ width: `${Math.min(100, progress)}%` }} />
                            {isReadyToClaim && <div className="absolute inset-0 bg-white/15 animate-pulse" />}
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center justify-center pt-1">
                    {isClaimed ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-green-500/30 bg-green-500/15"><CheckIcon className="h-4 w-4 text-green-400" /></div>
                    ) : isReadyToClaim ? (
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-green-500 blur-md opacity-35 animate-ping" />
                            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 shadow-[0_0_18px_rgba(34,197,94,0.5)]"><CheckIcon className="h-4 w-4 text-white" /></div>
                        </div>
                    ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-gray-400">&gt;</div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
};

const SectionTitle: React.FC<{ title: string; tone?: 'accent' | 'white' }> = ({ title, tone = 'accent' }) => (
    <div className="flex items-center gap-2 px-1">
        <span className={`h-2 w-2 rounded-full ${tone === 'accent' ? 'bg-[var(--skin-accent-color)]' : 'bg-white/60'}`} />
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/78">{title}</h3>
    </div>
);

const LaunchHighlightsBlock: React.FC<{
    highlights: SeasonLaunchHighlights;
    accent?: 'season' | 'amber';
}> = ({ highlights, accent = 'season' }) => {
    const wrapperClass = accent === 'amber'
        ? 'rounded-[14px] border border-amber-400/20 bg-amber-500/10 p-3'
        : 'rounded-[14px] border border-[var(--skin-accent-color)]/18 bg-white/[0.04] p-3';
    const titleClass = accent === 'amber'
        ? 'text-[10px] font-black uppercase tracking-[0.18em] text-amber-200'
        : 'text-[10px] font-black uppercase tracking-[0.18em] text-[var(--skin-accent-color)]';
    const summaryClass = accent === 'amber'
        ? 'text-[12px] leading-relaxed text-amber-100/90'
        : 'text-[12px] leading-relaxed text-white/76';
    const chipClass = accent === 'amber'
        ? 'rounded-full border border-amber-300/20 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-100'
        : 'rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/78';

    return (
        <div className={wrapperClass}>
            <div className="space-y-1">
                <div className={titleClass}>{highlights.title}</div>
                <p className={summaryClass}>{highlights.summary}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {highlights.itemLabels.map((itemLabel) => (
                    <span key={itemLabel} className={chipClass}>
                        {itemLabel}
                    </span>
                ))}
            </div>
        </div>
    );
};

const formatSeasonDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
};

const SeasonTransitionModal: React.FC<{
    fromSeason: Season;
    toSeason: SeasonConfig;
    onClose: () => void;
}> = ({ fromSeason, toSeason, onClose }) => {
    const [step, setStep] = useState<0 | 1>(0);
    const fromConfig = getSeasonConfigById(fromSeason.id);
    const fromArchive = resolveSeasonArchiveLogEntry(fromSeason);
    const fromBackground = resolveSeasonBackgroundUrl(fromSeason);
    const toSeasonLike = useMemo(() => buildSeasonFromConfig(toSeason), [toSeason]);
    const toBackground = resolveSeasonBackgroundUrl(toSeasonLike);

    const previousTitle = fromConfig?.celebrationTitle || `${fromSeason.name} encerrada`;
    const previousSummary = fromConfig?.celebrationSummary || 'Parabens por atravessar esta fase do GLYPH.';
    const nextTitle = toSeason.launchTitle || toSeason.name;
    const nextSummary = toSeason.launchSummary || toSeason.description || 'A proxima Temporada entra agora com uma nova trilha de quests, itens e identidade visual.';

    return (
        <Portal>
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in" onClick={onClose}>
                <div className="relative w-full max-w-[540px]" onClick={(event) => event.stopPropagation()}>
                    <div className="dossier-bg relative flex max-h-[92vh] flex-col overflow-hidden rounded-[20px] border border-[var(--skin-accent-color)]/22 shadow-2xl shadow-black/70">
                        <div className="flex items-center justify-between border-b border-white/8 bg-black/45 px-4 py-3">
                            <div className="space-y-1">
                                <div className="text-[9px] font-black uppercase tracking-[0.24em] text-white/50">Passagem de Era</div>
                                <div className="text-sm font-black uppercase tracking-[0.14em] text-white">{step === 0 ? 'Fechamento' : 'Nova abertura'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                    {[0, 1].map((index) => (
                                        <span
                                            key={index}
                                            className={`h-2.5 w-8 rounded-full border ${step === index ? 'border-[var(--skin-accent-color)]/30 bg-[var(--skin-accent-color)]' : 'border-white/10 bg-white/8'}`}
                                        />
                                    ))}
                                </div>
                                <button type="button" onClick={onClose} className="rounded-[10px] border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/75 transition-colors hover:bg-black/65">
                                    OK
                                </button>
                            </div>
                        </div>

                        <div className="custom-scrollbar flex-1 overflow-y-auto">
                            {step === 0 ? (
                                <div className="space-y-4 p-4">
                                    <div className="relative overflow-hidden rounded-[18px] border border-white/8">
                                        {fromBackground ? <img src={fromBackground} alt={fromSeason.name} className="h-[220px] w-full object-cover" /> : <div className="h-[220px] w-full bg-[linear-gradient(135deg,#111,#050505)]" />}
                                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.54)_42%,rgba(6,6,6,0.96)_100%)]" />
                                        <div className="absolute inset-x-0 bottom-0 p-4">
                                            <div className="space-y-2">
                                                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/65">Temporada encerrada</div>
                                                <div className="text-2xl font-black uppercase tracking-[0.14em] text-white luxe-title-shadow">{previousTitle}</div>
                                                <p className="max-w-[92%] text-[12px] leading-relaxed text-white/82">{previousSummary}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-[16px] border border-white/8 bg-black/24 p-4">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
                                                Inicio {formatSeasonDate(fromSeason.start_date)}
                                            </span>
                                            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
                                                Fim {formatSeasonDate(fromSeason.end_date)}
                                            </span>
                                        </div>
                                        {fromArchive?.rewardWindow && (
                                            <div className="mt-3">
                                                <LaunchHighlightsBlock
                                                    accent="amber"
                                                    highlights={{
                                                        title: fromArchive.rewardWindow.title,
                                                        summary: fromArchive.rewardWindow.summary,
                                                        itemLabels: fromArchive.rewardWindow.rewardLabels,
                                                        itemIds: fromArchive.rewardWindow.rewardItemIds,
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 p-4">
                                    <div className="relative overflow-hidden rounded-[18px] border border-white/8">
                                        {toBackground ? <img src={toBackground} alt={toSeason.name} className="h-[220px] w-full object-cover" /> : <div className="h-[220px] w-full bg-[linear-gradient(135deg,#111,#050505)]" />}
                                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.14)_0%,rgba(0,0,0,0.46)_40%,rgba(6,6,6,0.96)_100%)]" />
                                        <div className="absolute inset-x-0 bottom-0 p-4">
                                            <div className="space-y-2">
                                                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/65">Nova Temporada</div>
                                                <div className="text-2xl font-black uppercase tracking-[0.14em] text-white luxe-title-shadow">{nextTitle}</div>
                                                <p className="max-w-[92%] text-[12px] leading-relaxed text-white/82">{nextSummary}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-[16px] border border-white/8 bg-black/24 p-4">
                                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/52">Abre em</div>
                                            <div className="mt-1 text-lg font-black text-[var(--skin-accent-color)]">{formatSeasonDate(toSeason.startDate)}</div>
                                        </div>
                                        <div className="rounded-[16px] border border-white/8 bg-black/24 p-4">
                                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/52">Encerramento previsto</div>
                                            <div className="mt-1 text-lg font-black text-white">{formatSeasonDate(toSeason.endDate)}</div>
                                        </div>
                                    </div>

                                    {toSeason.launchHighlights ? (
                                        <LaunchHighlightsBlock highlights={toSeason.launchHighlights} />
                                    ) : (
                                        <div className="rounded-[16px] border border-white/8 bg-black/24 p-4 text-[12px] leading-relaxed text-white/72">
                                            Esta estrutura ja esta pronta para receber quests, itens, banner e borda proprios da nova Temporada, sem misturar com a Genesis.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-white/8 p-4">
                            {step === 0 ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <button onClick={onClose} className="rounded-[12px] border border-white/8 bg-white/5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/68 transition-colors hover:bg-white/10">
                                        Fechar
                                    </button>
                                    <button onClick={() => setStep(1)} className="rounded-[12px] py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black shadow-[0_0_20px_var(--sephirot-glow-color)] luxe-skin-button">
                                        Ver nova temporada
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <button onClick={() => setStep(0)} className="rounded-[12px] border border-white/8 bg-white/5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/68 transition-colors hover:bg-white/10">
                                        Voltar
                                    </button>
                                    <button onClick={onClose} className="rounded-[12px] py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black shadow-[0_0_20px_var(--sephirot-glow-color)] luxe-skin-button">
                                        Fechar passagem
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export const SeasonDetailModal: React.FC<{ season: Season; onClose: () => void; onOpenTransition?: () => void }> = ({ season, onClose, onOpenTransition }) => {
    const { claimSeasonMission, claimSeasonQuest, acceptSeasonQuest, abortSeasonQuest, userProfile, seasonMissions, seasonQuests, tasks, getArenas, getActionsForArena, getClanQuestProgress, userMissionParticipations, clanQuestParticipants, fetchClanQuestParticipants } = useGame();
    const [selectedMission, setSelectedMission] = useState<SeasonMission | null>(null);
    const [selectedQuest, setSelectedQuest] = useState<SeasonQuest | null>(null);
    const [completedMission, setCompletedMission] = useState<SeasonMission | null>(null);
    const [earnedInsignia, setEarnedInsignia] = useState<string | null>(null);

    const missionItems = useMemo(() => seasonMissions.filter((mission) => mission.season_id === season.id), [seasonMissions, season.id]);
    const questItems = useMemo(() => seasonQuests.filter((quest) => !quest.season_id || quest.season_id === season.id), [seasonQuests, season.id]);
    const allArenas = getArenas();
    const allActions = useMemo(() => allArenas.flatMap((arena) => getActionsForArena(arena.id)), [allArenas, getActionsForArena]);
    const seasonBackgroundUrl = resolveSeasonBackgroundUrl(season);
    const seasonLoreText = resolveSeasonLoreText(season);
    const seasonIsGenesis = isGenesisSeason(season);
    const seasonArchiveEntry = resolveSeasonArchiveLogEntry(season);
    const eraCalendarYears = useMemo(() => getEraCalendarYears(), []);
    const nextSeason = getNextSeasonConfig(season.id);

    useEffect(() => {
        questItems.filter((quest) => quest.type === 'clan').forEach((quest) => {
            if (quest.actionTemplate?.name) fetchClanQuestParticipants?.(quest.id, quest.actionTemplate.name);
        });
    }, [questItems, fetchClanQuestParticipants]);

    const countCompletedTasksForActionName = (actionName?: string, fallbackTitle?: string) => {
        const matchingActionIds = new Set(allActions.filter((action) => action.name === actionName || action.name === fallbackTitle).map((action) => action.id));
        if (matchingActionIds.size === 0) return 0;
        return tasks.filter((task) => matchingActionIds.has(task.actionId) && task.completed).length;
    };

    const hasQuestAction = (actionName?: string, fallbackTitle?: string) => allActions.some((action) => action.name === actionName || action.name === fallbackTitle);

    const getMissionProgress = (mission: SeasonMission) => {
        const goal = mission.requirements?.clanGoal || mission.goal_value || 1;
        if ((mission.type || 'individual') === 'clan') return Math.min(100, Math.round(((getClanQuestProgress?.(mission.id) || 0) / goal) * 100));
        if (mission.goal_type === 'actions_completed') return Math.min(100, Math.round((countCompletedTasksForActionName(mission.action_name, mission.title) / goal) * 100));
        return userProfile.completedSeasonMissions?.includes(mission.id) ? 100 : 0;
    };

    const getQuestProgress = (quest: SeasonQuest) => {
        const goal = quest.requirements?.clanGoal || quest.goal_value || quest.actionTemplate?.repetitions || 1;
        if (quest.type === 'clan') return Math.min(100, Math.round(((getClanQuestProgress?.(quest.id) || 0) / goal) * 100));
        return Math.min(100, Math.round((countCompletedTasksForActionName(quest.actionTemplate?.name, quest.title) / goal) * 100));
    };

    const isMissionCompleted = (mission: SeasonMission) => userProfile.completedSeasonMissions?.includes(mission.id) || false;
    const isQuestCompleted = (quest: SeasonQuest) => userProfile.completedSeasonMissions?.includes(quest.id) || false;
    const canClaimMission = (mission: SeasonMission) => getMissionProgress(mission) >= 100 && !isMissionCompleted(mission);
    const canClaimQuest = (quest: SeasonQuest) => getQuestProgress(quest) >= 100 && !isQuestCompleted(quest);
    const isQuestActive = (quest: SeasonQuest) => quest.type === 'clan' ? !!userMissionParticipations?.[quest.id] || hasQuestAction(quest.actionTemplate?.name, quest.title) : hasQuestAction(quest.actionTemplate?.name, quest.title);

    const handleClaimMission = async (mission: SeasonMission) => {
        await claimSeasonMission(mission.id);
        setEarnedInsignia('insignia_quest_master');
        setCompletedMission(mission);
        setSelectedMission(null);
    };

    const handleClaimQuest = async (quest: SeasonQuest) => {
        await claimSeasonQuest(quest.id);
        setEarnedInsignia('insignia_quest_incomum');
        setCompletedMission({ id: quest.id, season_id: season.id, title: quest.title, description: quest.description, icon: quest.actionTemplate.icon, reward_type: 'exp', reward_value: quest.rewards.xp || 0, goal_value: quest.goal_value || quest.requirements.totalReps || 1, goal_type: 'actions_completed', type: quest.type, requirements: quest.requirements });
        setSelectedQuest(null);
    };

    const totalTrackableIds = new Set([...missionItems, ...questItems].map((item) => item.id));
    const totalClaimed = Array.from(totalTrackableIds).filter((id) => userProfile.completedSeasonMissions?.includes(id)).length;
    const seasonProgressPercent = totalTrackableIds.size > 0 ? Math.round((totalClaimed / totalTrackableIds.size) * 100) : 0;

    return (
        <Portal>
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in" onClick={onClose}>
                <div className="w-full max-w-[520px]" onClick={(event) => event.stopPropagation()}>
                    <div className="dossier-bg relative flex max-h-[92vh] flex-col overflow-hidden rounded-[20px] border border-[color:var(--skin-accent-color)]/20 shadow-2xl shadow-black/60">
                        <div className="relative min-h-[236px] overflow-hidden">
                            {seasonBackgroundUrl ? <img src={seasonBackgroundUrl} alt={season.name} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-[linear-gradient(135deg,#0d0d0d_0%,#1b1b1b_40%,#050505_100%)]" />}
                            <div className={`absolute inset-0 ${seasonIsGenesis ? 'bg-[linear-gradient(180deg,rgba(14,6,25,0.24)_0%,rgba(22,7,40,0.58)_36%,rgba(7,3,13,0.96)_100%)]' : 'bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.54)_42%,rgba(6,6,6,0.96)_100%)]'}`} />
                            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/8 bg-black/22 p-3">
                                <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-white/72 backdrop-blur-sm">Temporada</span>
                                <button type="button" onClick={onClose} className="rounded-lg px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] luxe-skin-button">OK</button>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/70">Temporada ativa</p>
                                        <h2 className="luxe-title-ornate text-2xl font-black uppercase tracking-[0.16em] text-white luxe-title-shadow">{season.name}</h2>
                                        {seasonLoreText && <p className="max-w-[92%] text-[12px] leading-relaxed text-white/82">"{seasonLoreText}"</p>}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-bold text-white/75 backdrop-blur-sm">Inicio {new Date(season.start_date).toLocaleDateString('pt-BR')}</span>
                                        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-bold text-white/75 backdrop-blur-sm">Fim {new Date(season.end_date).toLocaleDateString('pt-BR')}</span>
                                        {seasonProgressPercent > 0 && <span className="rounded-full border border-[var(--skin-accent-color)]/25 bg-black/30 px-3 py-1 text-[10px] font-bold text-[var(--skin-accent-color)] backdrop-blur-sm">{seasonProgressPercent}% concluido</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="custom-scrollbar relative z-10 flex-1 space-y-5 overflow-y-auto px-4 pb-4 pt-4">
                            <div className="space-y-2 rounded-[16px] border border-white/8 bg-black/24 p-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/58">Descricao</div>
                                <p className="text-[13px] leading-relaxed text-white/76">{seasonLoreText || 'Uma nova fase esta ativa. Explore a imagem e desca para ver as missoes e jornadas disponiveis.'}</p>
                                <div className="h-2 overflow-hidden rounded-full border border-white/6 bg-black/40 p-[1px]">
                                    <div className="h-full rounded-full bg-gradient-to-r from-[var(--skin-accent-color)] to-white transition-all duration-700" style={{ width: `${Math.min(100, seasonProgressPercent)}%` }} />
                                </div>
                            </div>
                            {nextSeason && (
                                <div className="space-y-3">
                                    <SectionTitle title="Passagem de era" />
                                    <div className="rounded-[16px] border border-[var(--skin-accent-color)]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.22))] p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/52">Proxima abertura</div>
                                                <div className="mt-1 text-lg font-black uppercase tracking-[0.12em] text-white">{nextSeason.name}</div>
                                                <div className="mt-1 text-[12px] leading-relaxed text-white/70">{nextSeason.description}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onOpenTransition?.()}
                                                disabled={!onOpenTransition}
                                                className="rounded-[12px] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-[0_0_20px_var(--sephirot-glow-color)] luxe-skin-button"
                                            >
                                                Ver passagem
                                            </button>
                                        </div>
                                        {nextSeason.launchHighlights && (
                                            <div className="mt-3">
                                                <LaunchHighlightsBlock highlights={nextSeason.launchHighlights} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {seasonArchiveEntry && (
                                <div className="space-y-3">
                                    <SectionTitle title="Log da temporada" tone="white" />
                                    <div className="space-y-3 rounded-[16px] border border-[var(--skin-accent-color)]/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.22))] p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/78">{seasonArchiveEntry.label}</span>
                                            <span className="rounded-full border border-[var(--skin-accent-color)]/25 bg-[var(--skin-accent-color)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--skin-accent-color)]">
                                                {seasonArchiveEntry.status === 'legacy' ? 'Marco fundador' : seasonArchiveEntry.status}
                                            </span>
                                        </div>
                                        <p className="text-[13px] leading-relaxed text-white/76">{seasonArchiveEntry.summary}</p>
                                        {seasonArchiveEntry.rewardWindow && (
                                            <div className="space-y-3">
                                                <LaunchHighlightsBlock
                                                    accent="amber"
                                                    highlights={{
                                                        title: seasonArchiveEntry.rewardWindow.title,
                                                        summary: seasonArchiveEntry.rewardWindow.summary,
                                                        itemLabels: seasonArchiveEntry.rewardWindow.rewardLabels,
                                                        itemIds: seasonArchiveEntry.rewardWindow.rewardItemIds,
                                                    }}
                                                />
                                                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] leading-relaxed text-amber-100/88">
                                                    <span className="font-black uppercase tracking-[0.14em] text-amber-200">Janela ate {formatSeasonDate(seasonArchiveEntry.rewardWindow.eligibilityDeadline)}</span>
                                                    <div className="mt-1">{seasonArchiveEntry.rewardWindow.eligibilityRule}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {eraCalendarYears.length > 0 && (
                                <div className="space-y-3">
                                    <SectionTitle title="Calendario das eras" />
                                    <div className="space-y-3">
                                        {eraCalendarYears.map((eraYear) => (
                                            <div key={eraYear.year} className="rounded-[16px] border border-white/8 bg-black/24 p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">{eraYear.year}</div>
                                                        <div className="text-sm font-black uppercase tracking-[0.12em] text-white">{eraYear.label}</div>
                                                    </div>
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/68">
                                                        {eraYear.checkpoints.length} marcos
                                                    </span>
                                                </div>
                                                <div className="mt-3 space-y-2">
                                                    {eraYear.checkpoints.map((checkpoint) => (
                                                        <div key={checkpoint.id} className="rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-3">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <div className="text-[11px] font-black uppercase tracking-[0.12em] text-white/82">{checkpoint.label}</div>
                                                                <div className="text-[11px] font-bold text-[var(--skin-accent-color)]">{formatSeasonDate(checkpoint.date)}</div>
                                                            </div>
                                                            {checkpoint.note && (
                                                                <div className="mt-1 text-[11px] leading-relaxed text-white/55">{checkpoint.note}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {missionItems.length > 0 && (
                                <div className="space-y-3">
                                    <SectionTitle title="Missoes da temporada" tone="white" />
                                    <div className="space-y-2">
                                        {missionItems.map((mission) => <CompactSeasonEntryCard key={mission.id} title={mission.title} icon={mission.icon} metaLabel={mission.type === 'clan' ? 'Missao de grupo' : 'Missao de temporada'} progress={getMissionProgress(mission)} isClaimed={isMissionCompleted(mission)} onClick={() => setSelectedMission(mission)} />)}
                                    </div>
                                </div>
                            )}
                            {questItems.length > 0 && (
                                <div className="space-y-3">
                                    <SectionTitle title="Jornada" />
                                    <div className="space-y-2">
                                        {questItems.map((quest) => <CompactSeasonEntryCard key={quest.id} title={quest.title} icon={quest.actionTemplate?.icon} metaLabel={quest.type === 'clan' ? 'Jornada de grupo' : 'Jornada pessoal'} progress={getQuestProgress(quest)} isClaimed={isQuestCompleted(quest)} participants={quest.type === 'clan' ? clanQuestParticipants[quest.id] : undefined} onClick={() => setSelectedQuest(quest)} />)}
                                    </div>
                                </div>
                            )}
                            {missionItems.length === 0 && questItems.length === 0 && (
                                <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-white/8 bg-black/24 py-10 text-center text-white/50">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/8 bg-white/5 text-xl">?</div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em]">Nenhum conteudo disponivel</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {selectedMission && <MissionDetailModal mission={selectedMission} progress={getMissionProgress(selectedMission)} isCompleted={isMissionCompleted(selectedMission)} onClose={() => setSelectedMission(null)} onClaim={() => handleClaimMission(selectedMission)} />}
                {selectedQuest && <QuestDetailModal quest={selectedQuest} progress={getQuestProgress(selectedQuest)} isActive={isQuestActive(selectedQuest)} participants={clanQuestParticipants[selectedQuest.id]} onClose={() => setSelectedQuest(null)} onTake={() => { acceptSeasonQuest(selectedQuest.id); setSelectedQuest(null); }} onAbandon={() => { abortSeasonQuest(selectedQuest.id); setSelectedQuest(null); }} onClaim={() => handleClaimQuest(selectedQuest)} canClaim={canClaimQuest(selectedQuest)} />}
                {completedMission && <MissionCompletionModal mission={completedMission} insignia={earnedInsignia} onOk={() => { setCompletedMission(null); setEarnedInsignia(null); }} onClose={() => { setCompletedMission(null); setEarnedInsignia(null); }} />}
            </div>
        </Portal>
    );
};

export { SeasonTransitionModal };
