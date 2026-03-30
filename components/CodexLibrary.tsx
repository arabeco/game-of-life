import React, { useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { CodexShareDeliveryMethod, UserCodex } from '../types';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { ArchiveBoxIcon, CheckIcon, DollarSignIcon, EyeIcon, FolderIcon, LayersIcon, LinkIcon, PlusIcon, ShareIcon, Trash2Icon, XIcon } from './Icons';
import { CampaignsCodex } from './CampaignsCodex';
import { buildCodexCampaignPreview, CodexCampaignPreview } from '../utils/codexPreview';
import { CodexModal } from './CodexModal';
import { CampaignArenaStack } from './CampaignArenaStack';
import { CodexCoverArt as SharedCodexCoverArt } from './CodexCoverArt';

interface CodexLibraryProps {
  mode?: 'page' | 'modal';
  onClose?: () => void;
}

const isCreatedCodex = (codex: UserCodex) => (codex.source_type || (codex.catalog_id ? 'catalog' : 'created')) === 'created';
const isShareableCodex = (codex: UserCodex) => Array.isArray(codex.template?.levels) && codex.template.levels.length > 0;
const isProbablyImageUrl = (value?: string | null) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('/') || normalized.startsWith('data:image/');
};

const SourceBadge: React.FC<{ label: string }> = ({ label }) => (
  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/65">
    {label}
  </span>
);

const CodexCoverArt: React.FC<{ cover?: string; title: string }> = ({ cover, title }) => {
  if (isProbablyImageUrl(cover)) {
    return <img src={cover} alt={title} className="absolute inset-0 h-full w-full object-cover" />;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_58%),linear-gradient(180deg,rgba(33,24,16,0.95),rgba(10,8,10,0.98))] text-[3.2rem]">
      {cover || '📜'}
    </div>
  );
};

const EmptyShelf: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <GlassCard variant="neutral" className="rounded-3xl border border-dashed border-white/10 p-8 text-center opacity-80">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-3xl">
      <ArchiveBoxIcon className="h-7 w-7 text-white/45" />
    </div>
    <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
    <p className="mt-2 text-sm text-gray-400">{description}</p>
  </GlassCard>
);

const ShareCodexModal: React.FC<{ codex: UserCodex; onClose: () => void }> = ({ codex, onClose }) => {
  const { createCodexShareLink, sendCodexToNickname, userProfile, showToast } = useGame();
  const [method, setMethod] = useState<CodexShareDeliveryMethod>('external_link');
  const [nickname, setNickname] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast('Link copiado.', 'success');
    } catch (error) {
      console.error('Clipboard write failed:', error);
      showToast('Nao foi possivel copiar o link.', 'warning');
    }
  };

  const handleGenerateLink = async () => {
    setSubmitting(true);
    const payload = await createCodexShareLink(codex.id);
    setSubmitting(false);
    if (!payload) return;
    setGeneratedLink(payload.url);
    await copyToClipboard(payload.url);
  };

  const handleSend = async () => {
    setSubmitting(true);
    const success = await sendCodexToNickname(codex.id, nickname);
    setSubmitting(false);
    if (!success) return;
    onClose();
  };

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10030] flex items-center justify-center animate-fade-in" onClick={onClose}>
        <GlassCard variant="neutral" className="w-full max-w-sm m-4 rounded-3xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Compartilhar campanha</div>
              <h3 className="mt-1 text-lg font-bold text-white">{codex.name}</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-gray-300">
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="rounded-2xl border border-[var(--skin-accent-color)]/20 bg-[var(--skin-accent-color)]/10 px-4 py-3 flex items-center justify-between text-sm text-white/85">
              <span className="font-semibold">Gas fee</span>
              <span className="inline-flex items-center gap-2 font-bold uppercase tracking-[0.16em]"><DollarSignIcon className="w-4 h-4" />50 Ouro</span>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/25 p-1.5 border border-white/10">
              <button
                onClick={() => setMethod('external_link')}
                className={`rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${method === 'external_link' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                Link externo
              </button>
              <button
                onClick={() => setMethod('in_app')}
                className={`rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${method === 'in_app' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                Entrega in-app
              </button>
            </div>

            {method === 'external_link' ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Gera um link seguro de 1 uso. Assim que alguem reivindicar, ele expira.
                </p>
                {generatedLink && (
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-gray-300 break-all">
                    {generatedLink}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={handleGenerateLink} disabled={isSubmitting} className="flex-1 py-3 rounded-xl luxe-skin-button disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold">
                    {generatedLink ? 'Gerar novo link' : isSubmitting ? 'Forjando...' : 'Forjar link'}
                  </button>
                  {generatedLink && (
                    <button onClick={() => copyToClipboard(generatedLink)} className="px-4 py-3 rounded-xl luxe-button-secondary text-xs font-bold">
                      Copiar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Envia direto para a central de notificacoes do soberano pelo @nickname.
                </p>
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="@nickname"
                  className="w-full h-12 px-4 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] text-white"
                />
                <button onClick={handleSend} disabled={isSubmitting || !nickname.trim()} className="w-full py-3 rounded-xl luxe-skin-button disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold">
                  {isSubmitting ? 'Enviando...' : 'Entregar campanha'}
                </button>
              </div>
            )}

            <div className="text-xs text-gray-500 text-right">Ouro atual: {userProfile.wallet?.gold ?? 0}</div>
          </div>
        </GlassCard>
      </div>
    </Portal>
  );
};

const CodexCard: React.FC<{
  codex: UserCodex;
  kind: 'created' | 'imported';
  onPreview: () => void;
  onInstall: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}> = ({ codex, kind, onPreview, onInstall, onShare, onDelete }) => {
  const levels = Array.isArray(codex.template?.levels) ? codex.template.levels : [];
  const shareable = isShareableCodex(codex);
  const sourceLabel = kind === 'created' ? 'Criado' : codex.source_type === 'catalog' ? 'Loja' : 'Recebido';
  const actionCount = levels.reduce((total, level) => total + (Array.isArray(level.actions) ? level.actions.length : 0), 0);
  const sourceDescription = kind === 'created'
    ? 'Campanha autoral da sua forja.'
    : codex.source_type === 'catalog'
      ? 'Comprada na loja. Pode ser adaptada na sua execucao.'
      : 'Recebida de outro soberano. Mantida em modo protegido.';

  return (
    <GlassCard variant="neutral" className="p-4 rounded-3xl h-full flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="relative w-14 h-14 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
            {codex.template?.coverImage || '📜'}
            <SharedCodexCoverArt
              cover={codex.template?.coverImage}
              title={codex.name}
              emojiSize="cover-sm"
              backgroundClassName="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_58%),linear-gradient(180deg,rgba(33,24,16,0.95),rgba(10,8,10,0.98))]"
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge label={sourceLabel} />
              {!shareable && <SourceBadge label="Rascunho" />}
            </div>
            <h3 className="mt-2 text-lg font-bold text-white truncate">{codex.name}</h3>
            <p className="mt-1 text-sm text-gray-400 line-clamp-2">{codex.description || 'Sem descricao registrada.'}</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/40 line-clamp-2">{sourceDescription}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Fases</div>
          <div className="mt-1 text-base font-bold text-white">{levels.length}</div>
        </div>
        <div className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Acoes</div>
          <div className="mt-1 text-xs font-bold text-white truncate">{actionCount}</div>
        </div>
        <div className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Origem</div>
          <div className="mt-1 text-xs font-bold text-white">{kind === 'created' ? 'Forja' : sourceLabel}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Resumo das arenas</div>
        {levels.length > 0 ? levels.slice(0, 3).map((level) => (
          <div key={`${codex.id}-${level.level}`} className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{level.title}</div>
              <div className="text-[11px] text-gray-500">Fase {level.level}</div>
            </div>
            <div className="text-[11px] text-gray-400 whitespace-nowrap">{Array.isArray(level.actions) ? level.actions.length : 0} acoes</div>
          </div>
        )) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-gray-500">
            Essa campanha ainda nao esta pronta para instalar ou compartilhar.
          </div>
        )}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1">
        <button onClick={onPreview} className="py-2.5 rounded-xl luxe-button-secondary text-[11px] font-bold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2">
          <EyeIcon className="w-4 h-4" /> Ver
        </button>
        <button onClick={onInstall} disabled={!shareable} className="py-2.5 rounded-xl luxe-skin-button disabled:opacity-50 disabled:cursor-not-allowed text-[11px] font-bold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2">
          <CheckIcon className="w-4 h-4" /> Instalar
        </button>
        {onShare && (
          <button onClick={onShare} disabled={!shareable} className="py-2.5 rounded-xl bg-black/30 border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-[11px] font-bold uppercase tracking-[0.14em] text-white inline-flex items-center justify-center gap-2 transition-colors">
            <ShareIcon className="w-4 h-4" /> Compartilhar
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="py-2.5 rounded-xl bg-red-950/30 border border-red-500/20 hover:bg-red-900/40 text-[11px] font-bold uppercase tracking-[0.14em] text-red-200 inline-flex items-center justify-center gap-2 transition-colors">
            <Trash2Icon className="w-4 h-4" /> Excluir
          </button>
        )}
      </div>
    </GlassCard>
  );
};

export const CodexLibrary: React.FC<CodexLibraryProps> = ({ mode = 'page', onClose }) => {
  const {
    userCodexes,
    installCodex,
    deleteUserCodex,
    showToast,
    userProfile,
    refreshCodexes,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'created' | 'imported'>('created');
  const [campaignPreview, setCampaignPreview] = useState<CodexCampaignPreview | null>(null);
  const [previewCodex, setPreviewCodex] = useState<UserCodex | null>(null);
  const [isCreatorOpen, setCreatorOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<UserCodex | null>(null);

  const createdCodexes = useMemo(() => userCodexes.filter(isCreatedCodex), [userCodexes]);
  const importedCodexes = useMemo(() => userCodexes.filter((codex) => !isCreatedCodex(codex)), [userCodexes]);
  const totalCampaigns = createdCodexes.length + importedCodexes.length;

  const openPreview = (codex: UserCodex) => {
    if (!isShareableCodex(codex)) {
      showToast('Essa campanha ainda nao tem trilha pronta para visualizar.', 'warning');
      return;
    }

    setPreviewCodex(codex);
    setCampaignPreview(buildCodexCampaignPreview(codex.id, codex.template));
  };

  const handleInstall = async (codex: UserCodex) => {
    if (!isShareableCodex(codex)) {
      showToast('Finalize a campanha antes de instalar.', 'warning');
      return;
    }

    await installCodex(codex.id);
  };

  const handleDelete = async (codex: UserCodex) => {
    if (!confirm(`Excluir ${codex.name}? Essa acao remove a campanha da sua biblioteca.`)) return;
    await deleteUserCodex(codex.id);
  };

  const handleCreatorClose = async () => {
    setCreatorOpen(false);
    await refreshCodexes();
  };

  const currentItems = activeTab === 'created' ? createdCodexes : importedCodexes;

  const listContent = currentItems.length === 0 ? (
    <EmptyShelf
      title={activeTab === 'created' ? 'Nenhuma campanha criada ainda' : 'Nenhuma campanha recebida ainda'}
      description={activeTab === 'created'
        ? 'Use a forja para montar suas campanhas autorais.'
        : 'Presentes de amigos e compras da loja vao aparecer aqui automaticamente.'}
    />
  ) : (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {currentItems.map((codex) => (
        <CodexCard
          key={codex.id}
          codex={codex}
          kind={activeTab === 'created' ? 'created' : 'imported'}
          onPreview={() => openPreview(codex)}
          onInstall={() => handleInstall(codex)}
          onShare={activeTab === 'created' ? () => setShareTarget(codex) : undefined}
          onDelete={activeTab === 'created' ? () => handleDelete(codex) : undefined}
        />
      ))}
    </div>
  );

  const body = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-4">
        <GlassCard variant="neutral" className="rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_42%),linear-gradient(160deg,rgba(34,28,24,0.94),rgba(8,8,11,0.98))] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">A Forja e a Biblioteca</div>
              <h2 className="mt-1 text-xl font-bold text-white">Minhas campanhas</h2>
              <p className="mt-1 text-sm text-gray-400">Campanhas autorais ficam separadas das recebidas e das compradas.</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Biblioteca</div>
              <div className="mt-1 text-2xl font-black text-white">{totalCampaigns}</div>
              <div className="text-xs text-gray-500 mt-1">{createdCodexes.length} autorais · {importedCodexes.length} recebidas</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setCreatorOpen(true)} className="px-4 py-2.5 rounded-xl luxe-skin-button text-xs font-bold inline-flex items-center gap-2">
              <PlusIcon className="w-4 h-4" /> Criar novo
            </button>
          </div>
        </GlassCard>

        <GlassCard variant="neutral" className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.18))] p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Leitura rapida</div>
          <div className="mt-3 space-y-2">
            <div className="rounded-2xl bg-black/25 border border-white/10 px-3 py-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm text-gray-300"><LayersIcon className="w-4 h-4" />Criados</span>
              <span className="text-lg font-bold text-white">{createdCodexes.length}</span>
            </div>
            <div className="rounded-2xl bg-black/25 border border-white/10 px-3 py-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm text-gray-300"><ArchiveBoxIcon className="w-4 h-4" />Dos outros</span>
              <span className="text-lg font-bold text-white">{importedCodexes.length}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="flex gap-2 rounded-[1.4rem] bg-black/30 border border-white/10 p-1.5">
        <button
          onClick={() => setActiveTab('created')}
          className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition-colors ${activeTab === 'created' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          Criados
        </button>
        <button
          onClick={() => setActiveTab('imported')}
          className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition-colors ${activeTab === 'imported' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          Dos outros
        </button>
      </div>

      <GlassCard variant="neutral" className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.18))] px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          {activeTab === 'created' ? 'Regra da forja' : 'Regra da biblioteca'}
        </p>
        <p className="mt-2 text-sm text-gray-300">
          {activeTab === 'created'
            ? 'So campanhas autorais podem ser compartilhadas. Campanha comprada ou recebida nao entra na forja como produto revendavel.'
            : 'Campanha comprada pode ser adaptada na sua execucao. Campanha recebida entra como biblioteca protegida e nao abre edicao.'}
        </p>
      </GlassCard>

      {listContent}
    </div>
  );

  return (
    <>
      {mode === 'modal' ? (
        <Portal>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10010] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-6xl m-4 rounded-3xl h-[88vh] flex flex-col overflow-hidden" onClick={(event) => event.stopPropagation()}>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Biblioteca</div>
                  <h2 className="mt-1 text-lg font-bold text-white">Campanhas</h2>
                </div>
                <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-gray-300">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {body}
              </div>
            </GlassCard>
          </div>
        </Portal>
      ) : (
        <div className="space-y-4 animate-fade-in pb-10">{body}</div>
      )}

      {campaignPreview && (
        <CampaignsCodex
          onClose={() => {
            setCampaignPreview(null);
            setPreviewCodex(null);
          }}
          initialCampaignId={campaignPreview.campaign.id}
          previewCampaign={campaignPreview.campaign}
          previewArenas={campaignPreview.arenas}
          previewActions={campaignPreview.actions}
          previewMeta={{
            coverImage: previewCodex?.template?.coverImage,
            badgeLabel: activeTab === 'created' ? 'Forja autoral' : 'Biblioteca',
            author: previewCodex?.author || 'Autor desconhecido',
            note: activeTab === 'created'
              ? 'Sua campanha esta pronta para ser instalada ou refinada.'
              : 'Voce ja possui esta campanha na biblioteca e pode explorar a trilha completa.',
          }}
        />
      )}

      {shareTarget && <ShareCodexModal codex={shareTarget} onClose={() => setShareTarget(null)} />}

      {isCreatorOpen && (
        <CodexModal onClose={handleCreatorClose} />
      )}
    </>
  );
};
