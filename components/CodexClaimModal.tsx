import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { CodexSharePreview } from '../types';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { CheckIcon, EyeIcon, LinkIcon, XIcon } from './Icons';
import { CampaignsCodex } from './CampaignsCodex';
import { buildCodexCampaignPreview } from '../utils/codexPreview';

interface CodexClaimModalProps {
  onClose: () => void;
  token?: string;
  shareId?: string;
  onClaimed?: () => void;
}

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

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10040] flex items-center justify-center animate-fade-in" onClick={onClose}>
        <GlassCard variant="neutral" className="w-full max-w-lg m-4 rounded-3xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Codex recebido</div>
              <h2 className="mt-1 text-lg font-bold text-white">Reivindicar manuscrito</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-gray-300">
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-24 rounded-3xl bg-white/5" />
                <div className="h-20 rounded-2xl bg-white/5" />
                <div className="h-36 rounded-2xl bg-white/5" />
              </div>
            ) : !preview ? (
              <GlassCard variant="neutral" className="p-6 rounded-3xl text-center border border-red-500/20 bg-red-950/20">
                <h3 className="text-base font-bold text-white">Convite indisponivel</h3>
                <p className="mt-2 text-sm text-gray-400">Esse codex pode ter expirado ou ja ter sido reivindicado.</p>
              </GlassCard>
            ) : (
              <>
                <GlassCard variant="neutral" className="p-4 rounded-3xl">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center text-4xl shrink-0">
                      {preview.codexTemplate?.coverImage || '📜'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/65">
                          {preview.deliveryMethod === 'external_link' ? 'Link externo' : 'Entrega in-app'}
                        </span>
                        {preview.senderNickname && (
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/65">
                            de @{preview.senderNickname}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 text-xl font-bold text-white">{preview.codexName}</h3>
                      <p className="mt-2 text-sm text-gray-400">{preview.codexDescription || 'Sem descricao registrada para este codex.'}</p>
                      <div className="mt-3 text-xs text-gray-500">Autor: {preview.codexAuthor}</div>
                    </div>
                  </div>
                </GlassCard>

                <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-4">
                  <GlassCard variant="neutral" className="p-4 rounded-3xl">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Resumo da campanha</div>
                    <div className="mt-3 space-y-2">
                      {summaryLevels.length > 0 ? summaryLevels.slice(0, 4).map((level) => (
                        <div key={`${preview.shareId}-${level.level}`} className="rounded-2xl bg-black/25 border border-white/10 px-3 py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{level.title}</div>
                            <div className="text-[11px] text-gray-500">Fase {level.level}</div>
                          </div>
                          <div className="text-[11px] text-gray-400 whitespace-nowrap">{Array.isArray(level.actions) ? level.actions.length : 0} acoes</div>
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-gray-500">
                          Esse codex nao trouxe fases suficientes para exibir um resumo.
                        </div>
                      )}
                    </div>
                  </GlassCard>

                  <GlassCard variant="neutral" className="p-4 rounded-3xl">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Estado do envio</div>
                    <div className="mt-3 rounded-2xl bg-black/25 border border-white/10 px-4 py-4">
                      <div className="text-sm font-bold text-white">
                        {preview.status === 'claimed' ? 'Ja reivindicado' : preview.canClaim ? 'Pronto para reivindicar' : 'Indisponivel'}
                      </div>
                      <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                        {preview.canClaim
                          ? 'Esse codex entra na aba Dos Outros e nao consome slot de criacao.'
                          : 'Essa conta nao pode mais reivindicar este envio.'}
                      </p>
                    </div>
                  </GlassCard>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-1">
                  {campaignPreview && (
                    <button onClick={() => setShowCampaignPreview(true)} className="px-4 py-3 rounded-xl luxe-button-secondary text-xs font-bold inline-flex items-center justify-center gap-2">
                      <EyeIcon className="w-4 h-4" /> Ver campanha
                    </button>
                  )}
                  <button onClick={handleClaim} disabled={!preview.canClaim || isClaiming} className="px-4 py-3 rounded-xl luxe-skin-button disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold inline-flex items-center justify-center gap-2">
                    {preview.deliveryMethod === 'external_link' ? <LinkIcon className="w-4 h-4" /> : <CheckIcon className="w-4 h-4" />}
                    {isClaiming ? 'Reivindicando...' : preview.canClaim ? 'Reivindicar codex' : 'Indisponivel'}
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
        />
      )}
    </Portal>
  );
};