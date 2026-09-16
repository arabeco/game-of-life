import React from 'react';
import { Portal } from './Portal';
import { GlassCard } from './GlassCard';
import {
    DEFAULT_LEGACY_BACKDROP_SKIN_ID,
    LEGACY_BACKDROP_SKINS,
    type LegacyBackdropSkinId,
} from '../constants/legacyBackdropSkins';
import { DEFAULT_LEGACY_PLAQUE_COLOR_ID, LEGACY_PLAQUE_COLORS } from '../constants/legacyPlaqueColors';

interface LegacyProjectionConfirmModalProps {
    selectedSkinId: LegacyBackdropSkinId;
    sceneGoldCost?: number | null;
    isProcessing?: boolean;
    kickerLabel?: string;
    title?: string;
    description?: string;
    confirmLabel?: string;
    onSelectSkin: (skinId: LegacyBackdropSkinId) => void;
    /** Cor escolhida para a placa, ou `auto` para acompanhar o patamar. */
    selectedPlaqueColorId?: string;
    /** Ausente = o seletor de cor nao aparece. */
    onSelectPlaqueColor?: (colorId: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export const LegacyProjectionConfirmModal: React.FC<LegacyProjectionConfirmModalProps> = ({
    selectedSkinId,
    sceneGoldCost,
    isProcessing = false,
    kickerLabel = 'Legado premium',
    title = 'Gerar a cena do legado?',
    description = 'Escolha a pele de fundo da projeção. A placa e a timeline serão abertas sobre esse ambiente.',
    confirmLabel = 'Gerar a cena',
    selectedPlaqueColorId,
    onSelectPlaqueColor,
    onSelectSkin,
    onConfirm,
    onCancel,
}) => {
    return (
        <Portal>
            <div className="fixed inset-0 z-[10005] bg-black/75 backdrop-blur-md" onClick={onCancel}>
                <div className="flex h-full items-center justify-center p-4" onClick={(event) => event.stopPropagation()}>
                    <GlassCard variant="neutral" className="w-full max-w-md border-white/10 p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[var(--skin-accent-color)]">{kickerLabel}</p>
                        <h3 className="mt-3 text-2xl font-black tracking-tight text-white">{title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-gray-300">
                            {description}
                        </p>

                        {typeof sceneGoldCost === 'number' && sceneGoldCost > 0 && (
                            <div className="mt-4 inline-flex items-center rounded-full border border-[var(--skin-accent-color)]/22 bg-[var(--skin-accent-color)]/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--skin-accent-color)]">
                                {sceneGoldCost <= 25 ? `Custo premium ${sceneGoldCost} ouro` : `Custo ${sceneGoldCost} ouro`}
                            </div>
                        )}

                        <div className="mt-5 grid grid-cols-5 gap-3">
                            {LEGACY_BACKDROP_SKINS.map((skin) => {
                                const active = skin.id === selectedSkinId;
                                return (
                                    <button
                                        key={skin.id}
                                        type="button"
                                        disabled={isProcessing}
                                        onClick={() => onSelectSkin(skin.id)}
                                        className={`group flex flex-col items-center gap-2 rounded-[18px] border px-2 py-3 transition-all ${active ? 'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/10 shadow-[0_0_22px_rgba(212,175,55,0.12)]' : 'border-white/10 bg-white/[0.03] hover:border-white/20'} ${isProcessing ? 'cursor-wait opacity-60' : ''}`}
                                        title={skin.name}
                                    >
                                        <span
                                            className={`inline-flex h-5 w-5 rounded-full border ${active ? 'border-white/70' : 'border-black/30'}`}
                                            style={{ background: skin.previewFill }}
                                        />
                                        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/80">{skin.shortLabel}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Skin selecionada</p>
                            <p className="mt-2 text-sm font-black text-white">{LEGACY_BACKDROP_SKINS.find((skin) => skin.id === selectedSkinId)?.name || LEGACY_BACKDROP_SKINS.find((skin) => skin.id === DEFAULT_LEGACY_BACKDROP_SKIN_ID)?.name}</p>
                        </div>

                        {/*
                          * A COR DA PLACA MORA AQUI, e nao no historico.
                          *
                          * Esta e a unica tela em que a pessoa esta PRESTES a ver a cena e
                          * ainda nao viu — que e quando escolher aparencia custa mais
                          * barato. No historico ela escolheria num lugar para conferir
                          * noutro; dentro da cena, estaria editando justamente a coisa que
                          * esta julgando.
                          *
                          * Diferente da pele de fundo, esta escolha e SALVA no perfil: a
                          * pele e humor do dia ("hoje quero ver neste salao"), a cor da
                          * placa e identidade — se resetasse a cada abertura, o seletor
                          * seria enfeite.
                          */}
                        {onSelectPlaqueColor && (
                            <div className="mt-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Cor da placa</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {LEGACY_PLAQUE_COLORS.map((cor) => {
                                        const ativa = (selectedPlaqueColorId || DEFAULT_LEGACY_PLAQUE_COLOR_ID) === cor.id;
                                        return (
                                            <button
                                                key={cor.id}
                                                type="button"
                                                disabled={isProcessing}
                                                onClick={() => onSelectPlaqueColor(cor.id)}
                                                aria-pressed={ativa}
                                                title={cor.name}
                                                className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] transition-all ${ativa ? 'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/12 text-white' : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20'} ${isProcessing ? 'cursor-wait opacity-60' : ''}`}
                                            >
                                                <span className="inline-flex h-3.5 w-3.5 shrink-0 rounded-full border border-black/40" style={{ background: cor.plate }} />
                                                {cor.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="mt-5 flex gap-3">
                            <button type="button" disabled={isProcessing} onClick={onCancel} className="flex-1 rounded-xl luxe-button-secondary px-4 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-50">
                                Cancelar
                            </button>
                            <button type="button" disabled={isProcessing} onClick={onConfirm} className="flex-1 rounded-xl luxe-skin-button px-4 py-3 text-xs disabled:cursor-wait disabled:opacity-70">
                                {isProcessing ? 'Gerando...' : confirmLabel}
                            </button>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </Portal>
    );
};
