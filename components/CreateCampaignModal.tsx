import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Campaign } from '../types';
import { CheckIcon, XIcon } from './Icons';
import { Portal } from './Portal';
import { GlassCard } from './GlassCard';

interface CreateCampaignModalProps {
    selectedArenaIds?: string[];
    availableArenaIds?: string[];
    targetCampaign?: Campaign | null;
    onClose: () => void;
    onCreated?: (campaign: Campaign) => void;
    onAttached?: (arenaIds: string[]) => void;
}

const buildDefaultArenaConfig = (arenaIds: string[], currentConfig: Campaign['arenaConfig'] = {}) => (
    arenaIds.reduce<NonNullable<Campaign['arenaConfig']>>((acc, arenaId) => {
        acc[arenaId] = currentConfig?.[arenaId] || {
            isLocked: false,
            isHidden: false,
        };
        return acc;
    }, { ...(currentConfig || {}) })
);

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
    selectedArenaIds = [],
    availableArenaIds,
    targetCampaign = null,
    onClose,
    onCreated,
    onAttached,
}) => {
    const { getArenas, campaigns, addCampaign, updateCampaign, showToast } = useGame();
    const isAttachMode = Boolean(targetCampaign);
    const allArenas = getArenas();
    const availableArenaIdSet = useMemo(
        () => new Set((availableArenaIds || allArenas.map((arena) => arena.id)).filter(Boolean)),
        [allArenas, availableArenaIds],
    );
    const availableArenas = useMemo(
        () => allArenas.filter((arena) => availableArenaIdSet.has(arena.id)),
        [allArenas, availableArenaIdSet],
    );
    const [title, setTitle] = useState(() => `Nova Campanha ${campaigns.length + 1}`);
    const [titleTouched, setTitleTouched] = useState(false);
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const selectedArenaIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const selectedArenas = useMemo(
        () => availableArenas.filter((arena) => selectedArenaIdSet.has(arena.id)),
        [availableArenas, selectedArenaIdSet],
    );
    const selectedArenaNames = useMemo(
        () => selectedArenas.map((arena) => arena.name).filter(Boolean),
        [selectedArenas],
    );
    const primaryButtonLabel = isAttachMode
        ? `Adicionar ${selectedIds.length || ''}`.trim()
        : selectedIds.length > 0
            ? `Criar com ${selectedIds.length}`
            : 'Criar vazia';
    const targetCampaignArenaIdSet = useMemo(
        () => new Set(targetCampaign?.arenaIds || []),
        [targetCampaign?.arenaIds],
    );

    useEffect(() => {
        const nextSelected = selectedArenaIds.filter((arenaId) => availableArenaIdSet.has(arenaId));
        setSelectedIds(Array.from(new Set(nextSelected)));
    }, [availableArenaIdSet, selectedArenaIds]);

    useEffect(() => {
        if (!isAttachMode) {
            setTitle(`Nova Campanha ${campaigns.length + 1}`);
            setTitleTouched(false);
            return;
        }
        setTitle(targetCampaign?.title || '');
        setTitleTouched(true);
        setDescription(targetCampaign?.description || '');
        setDeadline(targetCampaign?.deadline || '');
    }, [campaigns.length, isAttachMode, targetCampaign?.deadline, targetCampaign?.description, targetCampaign?.title]);

    useEffect(() => {
        if (isAttachMode || titleTouched || selectedArenaNames.length < 2) return;
        setTitle(`${selectedArenaNames[0]} + ${selectedArenaNames[1]}`);
    }, [isAttachMode, selectedArenaNames, titleTouched]);

    const toggleArena = (arenaId: string) => {
        setSelectedIds((current) => (
            current.includes(arenaId)
                ? current.filter((id) => id !== arenaId)
                : [...current, arenaId]
        ));
    };

    const handleSelectAll = () => {
        setSelectedIds(availableArenas.map((arena) => arena.id));
    };

    const handleClearSelection = () => {
        setSelectedIds([]);
    };

    const handleSave = async () => {
        if (isAttachMode) {
            if (!targetCampaign || selectedIds.length === 0) return;
            const nextArenaIds = [...targetCampaign.arenaIds, ...selectedIds.filter((arenaId) => !targetCampaignArenaIdSet.has(arenaId))];
            const nextArenaConfig = buildDefaultArenaConfig(nextArenaIds, targetCampaign.arenaConfig || {});
            const success = await updateCampaign(targetCampaign.id, {
                arenaIds: nextArenaIds,
                arenaConfig: nextArenaConfig,
            });

            if (!success) return;
            showToast(`${selectedIds.length} arena${selectedIds.length === 1 ? '' : 's'} adicionada${selectedIds.length === 1 ? '' : 's'} a ${targetCampaign.title}.`, 'success');
            onAttached?.(selectedIds);
            onClose();
            return;
        }

        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        const orderedSelectedArenaIds = availableArenas
            .filter((arena) => selectedArenaIdSet.has(arena.id))
            .map((arena) => arena.id);
        const arenaConfig = buildDefaultArenaConfig(orderedSelectedArenaIds);

        try {
            const mediumPriorityCampaigns = campaigns.filter((campaign) => (campaign.priority ?? 'media') === 'media');
            const createdCampaign = await addCampaign({
                title: trimmedTitle,
                description: description.trim(),
                deadline: deadline || undefined,
                arenaIds: orderedSelectedArenaIds,
                arenaConfig,
                type: 'parallel',
                priority: 'media',
                order: campaigns.length,
                priorityOrder: mediumPriorityCampaigns.length,
            });

            showToast(
                orderedSelectedArenaIds.length > 0
                    ? `Campanha ${trimmedTitle} criada com ${orderedSelectedArenaIds.length} arena${orderedSelectedArenaIds.length === 1 ? '' : 's'}.`
                    : `Campanha ${trimmedTitle} criada. Agora voce pode montar ela do seu jeito.`,
                'success',
            );
            onCreated?.(createdCampaign);
            onClose();
        } catch (error) {
            console.error('Failed to create campaign:', error);
        }
    };

    const submitDisabled = isAttachMode ? selectedIds.length === 0 : !title.trim();

    return (
        <Portal>
            <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
                <GlassCard
                    variant="neutral"
                    className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/10 shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="border-b border-white/10 bg-black/25 px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
                                    {isAttachMode ? 'Adicionar arenas' : 'Nova campanha'}
                                </div>
                                <h3 className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-white">
                                    {isAttachMode ? `Arenas para ${targetCampaign?.title || 'campanha'}` : 'Criar campanha'}
                                </h3>
                            </div>
                            <button onClick={onClose} className="rounded-full border border-white/12 bg-black/20 p-2 text-white/70 transition-all hover:bg-white/8 hover:text-white">
                                <XIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[78vh] overflow-y-auto px-5 py-4 custom-scrollbar">
                        {!isAttachMode && (
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Nome</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(event) => {
                                            setTitleTouched(true);
                                            setTitle(event.target.value);
                                        }}
                                        placeholder="Nome da campanha"
                                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[var(--skin-accent-color)]/35"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Prazo</label>
                                    <input
                                        type="date"
                                        value={deadline}
                                        onChange={(event) => setDeadline(event.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[var(--skin-accent-color)]/35"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Descrição</label>
                                    <textarea
                                        value={description}
                                        onChange={(event) => setDescription(event.target.value)}
                                        placeholder="Objetivo da campanha"
                                        rows={3}
                                        className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[var(--skin-accent-color)]/35"
                                    />
                                </div>
                            </div>
                        )}

                        <div className={`${isAttachMode ? '' : 'mt-4'} rounded-[1.3rem] border border-white/10 bg-black/18 p-3`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                                        {isAttachMode ? 'Arenas livres' : 'Escolher arenas'}
                                    </div>
                                    <div className="mt-1 text-sm text-white/72">
                                        {selectedIds.length} selecionada{selectedIds.length === 1 ? '' : 's'}
                                        {!isAttachMode && selectedIds.length >= 2 ? ' para formar a campanha' : ''}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleClearSelection}
                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/72 transition-all hover:bg-white/10"
                                    >
                                        Limpar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        disabled={availableArenas.length === 0}
                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/72 transition-all hover:bg-white/10 disabled:opacity-40"
                                    >
                                        Todas
                                    </button>
                                </div>
                            </div>

                            {availableArenas.length === 0 ? (
                                <div className="mt-3 rounded-[1rem] border border-dashed border-white/10 bg-black/18 px-4 py-6 text-center">
                                    <div className="text-sm font-semibold text-white/76">
                                        {isAttachMode ? 'Nenhuma arena livre agora.' : 'Nenhuma arena livre para puxar agora.'}
                                    </div>
                                    <div className="mt-1 text-xs text-white/45">
                                        {isAttachMode
                                            ? 'Todas as arenas disponiveis ja estao em campanhas.'
                                            : 'Voce ainda pode criar a campanha vazia e montar depois.'}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    {availableArenas.map((arena) => {
                                        const selected = selectedArenaIdSet.has(arena.id);
                                        return (
                                            <button
                                                key={arena.id}
                                                type="button"
                                                onClick={() => toggleArena(arena.id)}
                                                className={`rounded-[1rem] border px-3 py-3 text-left transition-all ${selected ? 'border-[var(--skin-accent-color)]/40 bg-[var(--skin-accent-color)]/12' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg ${selected ? 'border-[var(--skin-accent-color)]/45 bg-[var(--skin-accent-color)]/14' : 'border-white/10 bg-white/5'}`}>
                                                        {arena.icon}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-sm font-black text-white">{arena.name}</div>
                                                        <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/48">
                                                            {arena.description || 'Sem descricao.'}
                                                        </div>
                                                    </div>
                                                    <div className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] ${selected ? 'border-[var(--skin-accent-color)]/50 bg-[var(--skin-accent-color)]/18 text-[var(--skin-accent-color)]' : 'border-white/10 bg-white/5 text-white/34'}`}>
                                                        {selected ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {selectedArenas.length > 0 && (
                            <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-black/16 p-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Na campanha</div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {selectedArenas.map((arena) => (
                                        <span key={arena.id} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/80">
                                            <span>{arena.icon}</span>
                                            <span>{arena.name}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/25 px-5 py-4">
                        <div className="text-[11px] text-white/45">
                            {isAttachMode
                                ? 'Escolha arenas livres para entrar nessa campanha.'
                                : selectedIds.length > 0
                                    ? 'Revise o nome e confirme. Nada e criado antes deste botao.'
                                    : 'Se quiser, crie agora e anexe as arenas depois.'}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/78 transition-all hover:bg-white/10"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => { void handleSave(); }}
                                disabled={submitDisabled}
                                className="luxe-skin-button rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] disabled:opacity-50"
                            >
                                {isAttachMode ? `Adicionar ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}` : primaryButtonLabel}
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
