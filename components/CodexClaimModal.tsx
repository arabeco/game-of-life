import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { CodexSharePreview } from '../types';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { CheckIcon, EyeIcon, FolderIcon, LinkIcon, XIcon } from './Icons';
import { CampaignsCodex } from './CampaignsCodex';
import { buildCodexCampaignPreview, getCodexLevelDisplayTitle } from '../utils/codexPreview';
import { CampaignArenaStack } from './CampaignArenaStack';
import { CodexCoverArt as SharedCodexCoverArt } from './CodexCoverArt';

interface CodexClaimModalProps {
  onClose: () => void;
  token?: string;
  shareId?: string;
  onClaimed?: () => void;
}

const isProbablyImageUrl = (value?: string | null) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('/') || normalized.startsWith('data:image/');
};

const CodexCoverArt: React.FC<{ cover?: string; title: string }> = ({ cover, title }) => {
  if (isProbablyImageUrl(cover)) {
    return <img src={cover} alt={title} className="absolute inset-0 h-full w-full object-cover" />;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_58%),linear-gradient(180deg,rgba(33,24,16,0.95),rgba(10,8,10,0.98))] text-[3.4rem]">
      {cover || '📜'}
    </div>
  );
};

export const CodexClaimModal: React.FC<CodexClaimModalProps> = ({ onClose, token, shareId, onClaimed }) => {
  const { getCodexSharePreview, claimCodexShare } = useGame();
  const [preview, setPreview] = useState<CodexSharePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showCampaignPreview, setShowCampaignPreview] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setLoading(true);
      const data = await getCodexSharePreview({ token, shareId });
      if (!isMounted) return;
      setPreview(data);
      setLoading(false);
    };

    void run();
    return () => {
      isMounted = false;
    };
  }, [getCodexSharePreview, token, shareId]);

  const campaignPreview = useMemo(() => {
    if (!preview?.codexTemplate) return null;
    return buildCodexCampaignPreview(preview.codexId || preview.shareId, preview.codexTemplate, `__codex_claim_preview_${preview.shareId}__`);
  }, [preview]);

  const handleClaim = async () => {
    setIsClaiming(true);
    const success = await claimCodexShare({ token, shareId: preview?.shareId || shareId });
    setIsClaiming(false);
    if (!success) return;
    onClaimed?.();
    onClose();
  };

  const summaryLevels = Array.isArray(preview?.codexTemplate?.levels) ? preview.codexTemplate.levels : [];
  const previewActionCount = campaignPreview?.actions.length ?? 0;

  return (
    <Portal>
      <div className="fixed inset-0 z-[10040] flex items-center justify-center bg-black/84 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <GlassCard variant="neutral" className="m-4 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.85rem]" onClick={(event) => event.stopPropagation()}>
          <div className="border-b border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">Campanha recebida</div>
                <h2 className="mt-1 text-lg font-bold text-white">Reivindicar campanha</h2>
              </div>
              <button onClick={onClose} className="rounded-full bg-black/20 p-1 text-gray-300 hover:bg-black/40">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-[85vh] space-y-4 overflow-y-auto p-4 custom-scrollbar">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-40 rounded-3xl bg-white/5" />
                <div className="h-28 rounded-3xl bg-white/5" />
                <div className="h-36 rounded-3xl bg-white/5" />
              </div>
            ) : !preview ? (
              <GlassCard variant="neutral" className="rounded-3xl border border-red-500/20 bg-red-950/20 p-6 text-center">
                <h3 className="text-base font-bold text-white">Convite indisponivel</h3>
                <p className="mt-2 text-sm text-gray-400">Essa campanha pode ter expirado ou ja ter sido reivindicada.</p>
              </GlassCard>
            ) : (
              <>
                <GlassCard variant="neutral" className="relative overflow-hidden rounded-[1.6rem] border-white/10 p-4">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_38%)] pointer-events-none" />
                  <div className="absolute left-5 top-0 h-4 w-28 rounded-b-[1rem] border border-t-0 border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))] pointer-events-none" />

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/62">
                        <FolderIcon className="h-3.5 w-3.5" />
                        Manuscrito recebido
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/65">
                          {preview.deliveryMethod === 'external_link' ? 'Link externo' : 'Entrega in-app'}
                        </span>
                        {preview.senderNickname && (
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/65">
                            de @{preview.senderNickname}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                      <button
                        type="button"
                        onClick={() => campaignPreview && setShowCampaignPreview(true)}
                        className="group/cover relative min-h-[13rem] overflow-hidden rounded-[1.45rem] border border-white/10 bg-black/35 text-left"
                      >
                        <SharedCodexCoverArt cover={preview.codexTemplate?.coverImage} title={preview.codexName} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--skin-accent-color)]">
                            Campanha recebida
                          </div>
                          <div className="mt-2 text-xl font-black uppercase leading-tight text-white">
                            {preview.codexName}
                          </div>
                        </div>
                      </button>

                      <div className="space-y-3">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                            {preview.codexAuthor || 'Autor desconhecido'}
                          </div>
                          <h3 className="mt-2 text-xl font-black uppercase leading-tight text-white">
                            {preview.codexName}
                          </h3>
                          <p className="mt-3 text-sm leading-relaxed text-white/68">
                            {preview.codexDescription || 'Sem descricao registrada para esta campanha.'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                            {summaryLevels.length} fases
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                            {previewActionCount} acoes
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                            {preview.canClaim ? 'Pronto para receber' : 'Indisponivel'}
                          </span>
                        </div>

                        <div className="rounded-[1.1rem] border border-white/10 bg-black/20 px-3 py-3 text-xs leading-relaxed text-white/74">
                          Essa campanha vai para a aba <span className="font-bold text-white">Dos outros</span> e entra direto na sua biblioteca.
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.95fr_1.05fr]">
                  <GlassCard variant="neutral" className="rounded-[1.5rem] border-white/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                        Vista da campanha
                      </div>
                      <EyeIcon className="h-4 w-4 text-[var(--skin-accent-color)]" />
                    </div>
                    <button
                      type="button"
                      onClick={() => campaignPreview && setShowCampaignPreview(true)}
                      className="mt-3 w-full rounded-[1.15rem] border border-white/8 bg-[linear-gradient(180deg,rgba(212,175,55,0.12),rgba(10,10,12,0.18))] px-2 py-3 transition-all hover:border-[var(--skin-accent-color)]/35"
                    >
                      {campaignPreview ? (
                        <div className="flex items-center justify-center">
                          <CampaignArenaStack arenas={campaignPreview.arenas} size="md" />
                        </div>
                      ) : (
                        <div className="py-5 text-sm text-white/40">Campanha indisponivel para visualizacao.</div>
                      )}
                    </button>
                  </GlassCard>

                  <GlassCard variant="neutral" className="rounded-[1.5rem] border-white/10 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                      Fases em destaque
                    </div>
                    <div className="mt-3 space-y-2">
                      {summaryLevels.length > 0 ? summaryLevels.slice(0, 4).map((level) => (
                        <button
                          key={`${preview.shareId}-${level.level}`}
                          type="button"
                          onClick={() => campaignPreview && setShowCampaignPreview(true)}
                          className="flex w-full items-center justify-between gap-3 rounded-[1rem] border border-white/8 bg-white/[0.03] px-3 py-3 text-left transition-all hover:border-[var(--skin-accent-color)]/28 hover:bg-white/[0.05]"
                        >
                          <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--skin-accent-color)]">
                              Fase {level.level}
                            </div>
                            <div className="mt-1 truncate text-sm font-bold text-white">
                              {getCodexLevelDisplayTitle(level.title, level.level)}
                            </div>
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">
                            {Array.isArray(level.actions) ? level.actions.length : 0} acoes
                          </div>
                        </button>
                      )) : (
                        <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-gray-500">
                          Essa campanha nao trouxe fases suficientes para exibir um resumo.
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </div>

                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
                  {campaignPreview && (
                    <button onClick={() => setShowCampaignPreview(true)} className="inline-flex items-center justify-center gap-2 rounded-xl luxe-button-secondary px-4 py-3 text-xs font-bold">
                      <EyeIcon className="h-4 w-4" />
                      Ver campanha
                    </button>
                  )}
                  <button onClick={handleClaim} disabled={!preview.canClaim || isClaiming} className="inline-flex items-center justify-center gap-2 rounded-xl luxe-skin-button px-4 py-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50">
                    {preview.deliveryMethod === 'external_link' ? <LinkIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                    {isClaiming ? 'Reivindicando...' : preview.canClaim ? 'Reivindicar campanha' : 'Indisponivel'}
                  </button>
                </div>
              </>
            )}
          </div>
        </GlassCard>
      </div>

      {showCampaignPreview && campaignPreview && (
        <CampaignsCodex
          onClose={() => setShowCampaignPreview(false)}
          initialCampaignId={campaignPreview.campaign.id}
          previewCampaign={campaignPreview.campaign}
          previewArenas={campaignPreview.arenas}
          previewActions={campaignPreview.actions}
          previewMeta={{
            coverImage: preview?.codexTemplate?.coverImage,
            badgeLabel: 'Campanha recebida',
            author: preview?.codexAuthor,
            note: 'Voce pode inspecionar a estrutura completa antes de reivindicar este manuscrito.',
          }}
        />
      )}
    </Portal>
  );
};
