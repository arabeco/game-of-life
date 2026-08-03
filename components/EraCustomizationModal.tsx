import React, { useEffect, useMemo, useState } from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { EraRibbon, ERA_RIBBON_SKINS } from './EraRibbon';
import { EraCycleStrip } from './EraCycleStrip';
import type { LegacyEraCycleDigest, LegacyEraSummary } from './LegacyExportDocument';

interface EraCustomizationModalProps {
    era: LegacyEraSummary;
    initialName: string;
    initialDescription: string;
    initialFinalSummary: string;
    aiSummary: string;
    cycles: LegacyEraCycleDigest[];
    selectedSkinId: string;
    defaultSkinId: string;
    hasPlatinumAccess: boolean;
    onClose: () => void;
    onSave: (payload: { name: string; skinId: string; description: string; finalSummary: string }) => void;
}

export const EraCustomizationModal: React.FC<EraCustomizationModalProps> = ({
    era,
    initialName,
    initialDescription,
    initialFinalSummary,
    aiSummary,
    cycles,
    selectedSkinId,
    defaultSkinId,
    hasPlatinumAccess,
    onClose,
    onSave,
}) => {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [finalSummary, setFinalSummary] = useState(initialFinalSummary);
    const [skinId, setSkinId] = useState(selectedSkinId);

    useEffect(() => {
        setName(initialName);
        setDescription(initialDescription);
        setFinalSummary(initialFinalSummary);
        setSkinId(selectedSkinId);
    }, [initialDescription, initialFinalSummary, initialName, selectedSkinId]);

    const availableSkins = useMemo(() => ERA_RIBBON_SKINS.map((skin) => ({
        ...skin,
        locked: skin.accessTier === 'platinum' && !hasPlatinumAccess,
    })), [hasPlatinumAccess]);

    const previewLabel = name.trim() || era.defaultLabel || era.label;
    const currentNarrative = finalSummary.trim() || description.trim() || aiSummary;

    return (
        <Portal>
            <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={onClose}>
                <GlassCard variant="neutral" className="m-4 w-full max-w-5xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
                    <div className="max-h-[min(92vh,920px)] space-y-5 overflow-y-auto p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-5">
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--skin-accent-color)]">Era</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight">{era.label}</h2>
                                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
                                    A Era continua sendo um marcador de fase: faixa, nome, skin e quais ciclos ela contem. O resumo mais pesado fica no legado, nao aqui.
                                </p>
                            </div>
                            <div className="hidden shrink-0 items-center gap-4 rounded-[24px] border border-white/10 bg-black/25 p-4 sm:flex">
                                <div className="h-32 w-10 overflow-hidden rounded-sm">
                                    <EraRibbon label="" skinId={skinId} className="h-full w-full" />
                                </div>
                                <div className="max-w-[220px]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-500">Preview</p>
                                    <p className="mt-2 text-sm font-black text-white">{previewLabel}</p>
                                    <p className="mt-1 text-xs text-gray-500">{era.cycleCount} ciclos Â· score mÃ©dio {era.avgScore}</p>
                                    <p className="mt-3 text-[11px] leading-relaxed text-gray-400">{currentNarrative}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Ciclos</p>
                                <p className="mt-2 text-3xl font-black">{era.cycleCount}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Score medio</p>
                                <p className="mt-2 text-3xl font-black" style={{ color: era.color }}>{era.avgScore}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Horas totais</p>
                                <p className="mt-2 text-3xl font-black">{Number.isInteger(era.totalHours) ? era.totalHours : era.totalHours.toFixed(1)}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Arena dominante</p>
                                <p className="mt-2 text-sm font-black leading-tight text-white">{era.dominantArena}</p>
                            </div>
                        </div>

                        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Nome da Era</label>
                                    <input
                                        id="era-customization-name"
                                        value={name}
                                        onChange={(event) => setName(event.target.value.slice(0, 48))}
                                        placeholder={era.defaultLabel || era.label}
                                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--skin-accent-color)]"
                                    />
                                    <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Deixe vazio para usar o nome padrao.</p>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-500">Leitura da fase</p>
                                            <p className="mt-1 text-xs text-gray-500">Resumo sintetico do periodo. Serve como contexto da Era, nao como novo relatorio.</p>
                                        </div>
                                        <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-gray-400">IA local</span>
                                    </div>
                                    <p id="era-customization-ai-summary" className="mt-4 text-sm leading-relaxed text-gray-200">
                                        {currentNarrative}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <label className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Skin da Era</label>
                                        {!hasPlatinumAccess && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/75">1 livre · 3 platinum</span>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {availableSkins.map((skin) => {
                                            const active = skinId === skin.id;
                                            const locked = skin.locked;
                                            return (
                                                <button
                                                    key={skin.id}
                                                    id={`era-skin-${skin.id}`}
                                                    type="button"
                                                    disabled={locked}
                                                    onClick={() => setSkinId(skin.id)}
                                                    className={`space-y-2 rounded-2xl border p-2 transition-all ${active ? 'border-[var(--skin-accent-color)] bg-white/8' : 'border-white/10 bg-black/20'} ${locked ? 'cursor-not-allowed opacity-60' : 'hover:border-white/20'}`}
                                                    title={locked ? 'Disponivel no platinum' : skin.name}
                                                >
                                                    <div className="mx-auto h-24 w-8 overflow-hidden rounded-sm">
                                                        <EraRibbon label="" skinId={skin.id} locked={locked} className="h-full w-full" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/90">{skin.name}</p>
                                                        <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-gray-500">{skin.accessTier === 'platinum' ? 'Platinum' : 'Livre'}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {hasPlatinumAccess && skinId !== defaultSkinId && (
                                        <button
                                            type="button"
                                            onClick={() => setSkinId(defaultSkinId)}
                                            className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white"
                                        >
                                            Voltar para a skin automatica
                                        </button>
                                    )}
                                </div>

                                <EraCycleStrip cycles={cycles} skinId={skinId} eraLabel={previewLabel} />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button id="era-customization-cancel" type="button" onClick={onClose} className="flex-1 rounded-xl luxe-button-secondary py-3 text-xs">Cancelar</button>
                            <button
                                id="era-customization-save"
                                type="button"
                                onClick={() => onSave({
                                    name: name.trim(),
                                    skinId,
                                    description,
                                    finalSummary,
                                })}
                                className="flex-1 rounded-xl luxe-skin-button py-3 text-xs"
                            >
                                Salvar Era
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};


