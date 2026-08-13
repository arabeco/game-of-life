import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { ChevronLeftIcon, MessageIcon, SendIcon, UsersIcon, XCircleIcon } from './Icons';
import { UserAvatar } from './UserAvatar';
import { useSensoryFeedback } from '../hooks/useSensoryFeedback';
import { ClanChat } from './ClanChat';
import { ConfirmationModal } from './ConfirmationModal';
import { ModerationReportModal } from './ModerationReportModal';
import { PRODUCT_FEATURES } from '../constants/featureFlags';

type SocialSelection =
  | { type: 'dm'; participantId: string }
  | { type: 'clan' }
  | null;

export const OracleSocialPanel: React.FC<{ initialParticipantId?: string | null }> = ({ initialParticipantId = null }) => {
  const {
    clan,
    directMessages,
    dmConversations,
    friends,
    markDMAsRead,
    sendDirectMessage,
    userProfile,
    blockedUserIds,
    blockUser,
    unblockUser,
    submitModerationReport,
  } = useGame();
  const { trigger } = useSensoryFeedback();

  const [selection, setSelection] = useState<SocialSelection>(null);
  const [inputValue, setInputValue] = useState('');
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'user' | 'message'; messageId?: string; messageContent?: string; messageSenderId?: string } | null>(null);
  const [isModerationBusy, setIsModerationBusy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sortedConversations = useMemo(
    () => [...dmConversations].sort((a, b) => {
      const aDate = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bDate = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bDate - aDate;
    }),
    [dmConversations],
  );

  const availableFriends = useMemo(
    () => friends.filter((friend) => !dmConversations.some((conversation) => conversation.participantId === friend.id)),
    [dmConversations, friends],
  );

  const selectedParticipantId = selection?.type === 'dm' ? selection.participantId : null;
  const isSelectedUserBlocked = selectedParticipantId ? blockedUserIds.includes(selectedParticipantId) : false;

  const activeMessages = useMemo(() => {
    if (!selectedParticipantId) return [];
    return directMessages
      .filter((message) =>
        (message.senderId === selectedParticipantId && message.recipientId === userProfile.id)
        || (message.senderId === userProfile.id && message.recipientId === selectedParticipantId))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [directMessages, selectedParticipantId, userProfile.id]);

  const selectedConversation = useMemo(() => {
    if (!selectedParticipantId) return null;
    return dmConversations.find((conversation) => conversation.participantId === selectedParticipantId)
      || friends.find((friend) => friend.id === selectedParticipantId)
      || null;
  }, [dmConversations, friends, selectedParticipantId]);

  useEffect(() => {
    const normalizedParticipantId = typeof initialParticipantId === 'string' ? initialParticipantId.trim() : '';
    if (!normalizedParticipantId) return;

    const participantExists =
      dmConversations.some((conversation) => conversation.participantId === normalizedParticipantId)
      || friends.some((friend) => friend.id === normalizedParticipantId);

    if (!participantExists) return;

    setSelection((current) => (
      current?.type === 'dm' && current.participantId === normalizedParticipantId
        ? current
        : { type: 'dm', participantId: normalizedParticipantId }
    ));
  }, [dmConversations, friends, initialParticipantId]);

  useEffect(() => {
    if (selectedParticipantId) {
      void markDMAsRead(selectedParticipantId);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages.length, markDMAsRead, selectedParticipantId]);

  const handleSelectConversation = (participantId: string) => {
    trigger('click');
    setSelection({ type: 'dm', participantId });
  };

  const handleSend = async () => {
    if (!selectedParticipantId || !inputValue.trim()) return;
    const content = inputValue.trim();
    setInputValue('');
    trigger('click');
    await sendDirectMessage(selectedParticipantId, content);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedParticipantId) return;
    setIsModerationBusy(true);
    if (isSelectedUserBlocked) {
      await unblockUser(selectedParticipantId);
    } else {
      await blockUser(selectedParticipantId);
    }
    setIsModerationBusy(false);
    setShowBlockConfirm(false);
  };

  const handleSubmitReport = async ({ reason, details }: { reason: any; details: string }) => {
    if (!selectedParticipantId || !reportTarget) return;
    setIsModerationBusy(true);
    if (reportTarget.type === 'user') {
      await submitModerationReport({
        targetUserId: selectedParticipantId,
        targetKind: 'user',
        channelKind: 'dm',
        targetId: selectedParticipantId,
        reason,
        details,
        metadata: {
          surface: 'oracle_social_panel',
          participantId: selectedParticipantId,
        },
      });
    } else {
      await submitModerationReport({
        targetUserId: reportTarget.messageSenderId || selectedParticipantId,
        targetKind: 'direct_message',
        channelKind: 'dm',
        targetId: reportTarget.messageId || null,
        reason,
        details,
        metadata: {
          surface: 'oracle_social_panel',
          participantId: selectedParticipantId,
          messagePreview: reportTarget.messageContent?.slice(0, 180) || null,
        },
      });
    }
    setIsModerationBusy(false);
    setReportTarget(null);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (sortedConversations.length === 0 && availableFriends.length === 0 && (!PRODUCT_FEATURES.clanChat || !clan)) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-black/20 p-8 text-center text-gray-500">
        <MessageIcon className="mb-4 h-12 w-12 opacity-20" />
        <p className="text-sm">Nenhuma conversa ativa no momento.</p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-gray-600">
          Adicione amigos ou entre em um clã para usar essa aba
        </p>
      </div>
    );
  }

  const selectedNickname = selection?.type === 'clan'
    ? (clan?.name || 'Grupo')
    : selectedConversation
      ? ('profile' in selectedConversation ? selectedConversation.profile.nickname : selectedConversation.nickname)
      : null;

  const selectedAvatarUrl = selection?.type === 'clan'
    ? undefined
    : selectedConversation
      ? ('profile' in selectedConversation ? selectedConversation.profile.avatarUrl : selectedConversation.avatarUrl)
      : undefined;

  const selectedOnline = selection?.type === 'clan'
    ? false
    : selectedConversation
      ? ('profile' in selectedConversation ? selectedConversation.profile.isOnline : selectedConversation.isOnline)
      : false;

  return (
    <div className="flex h-full overflow-hidden bg-black/20">
      <div className="flex w-16 flex-none flex-col items-center gap-3 overflow-y-auto border-r border-white/5 bg-black/45 py-4 sm:w-24">
        {sortedConversations.map((conversation) => (
          <button
            key={conversation.participantId}
            onClick={() => handleSelectConversation(conversation.participantId)}
            className={`relative rounded-2xl p-1 transition-all ${
              selectedParticipantId === conversation.participantId && selection?.type === 'dm'
                ? 'scale-110'
                : 'opacity-65 hover:scale-105 hover:opacity-100'
            }`}
            title={conversation.profile.nickname}
          >
            <UserAvatar
              nickname={conversation.profile.nickname}
              avatarUrl={conversation.profile.avatarUrl}
              className={`h-10 w-10 rounded-xl transition-all sm:h-12 sm:w-12 ${
                selectedParticipantId === conversation.participantId && selection?.type === 'dm'
                  ? 'ring-2 ring-[var(--skin-accent-color)] ring-offset-2 ring-offset-black shadow-[0_0_15px_rgba(var(--skin-accent-rgb),0.3)]'
                  : ''
              }`}
              isOnline={conversation.profile.isOnline}
              showBorder={false}
            />
            {conversation.unreadCount > 0 && (
              <div className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-black bg-[var(--skin-accent-color)] px-1 text-[10px] font-bold text-black shadow-lg">
                {conversation.unreadCount}
              </div>
            )}
          </button>
        ))}

        {availableFriends.length > 0 && (
          <div className="my-1 h-px w-8 bg-white/10" />
        )}

        {availableFriends.map((friend) => (
          <button
            key={friend.id}
            onClick={() => handleSelectConversation(friend.id)}
            className={`rounded-2xl p-1 transition-all ${
              selectedParticipantId === friend.id && selection?.type === 'dm'
                ? 'scale-110'
                : 'opacity-45 grayscale hover:scale-105 hover:opacity-100 hover:grayscale-0'
            }`}
            title={friend.nickname}
          >
            <UserAvatar
              nickname={friend.nickname}
              avatarUrl={friend.avatarUrl}
              className={`h-8 w-8 rounded-xl transition-all sm:h-10 sm:w-10 ${
                selectedParticipantId === friend.id && selection?.type === 'dm'
                  ? 'ring-2 ring-[var(--skin-accent-color)] ring-offset-2 ring-offset-black'
                  : ''
              }`}
              isOnline={friend.isOnline}
              showBorder={false}
            />
          </button>
        ))}

        {PRODUCT_FEATURES.clanChat && clan && (
          <>
            <div className="my-1 h-px w-8 bg-white/10" />
            <button
              onClick={() => {
                trigger('click');
                setSelection({ type: 'clan' });
              }}
              className={`rounded-2xl border p-2 transition-all ${
                selection?.type === 'clan'
                  ? 'scale-105 border-[var(--skin-accent-color)]/45 bg-[var(--skin-accent-color)]/12 text-[var(--skin-accent-color)]'
                  : 'border-white/10 bg-black/25 text-gray-400 hover:border-white/20 hover:text-white'
              }`}
              title={clan.name}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/25 sm:h-12 sm:w-12">
                <UsersIcon className="h-5 w-5" />
              </div>
            </button>
          </>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-black/10">
        {!selection ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-gray-500">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <UsersIcon className="h-8 w-8 opacity-20" />
            </div>
            <h3 className="mb-1 text-sm font-bold uppercase tracking-[0.22em] text-white">Social</h3>
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
              Escolha uma conversa ou abra o clã pelo trilho lateral
            </p>
          </div>
        ) : selection.type === 'clan' ? (
          <>
            <div className="flex flex-none items-center justify-between border-b border-white/5 bg-black/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--skin-accent-color)]/20 bg-[var(--skin-accent-color)]/10 text-[var(--skin-accent-color)]">
                  <UsersIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white">{clan?.name || 'Grupo'}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Chat do clã</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedParticipantId && (
                  <>
                    <button
                      type="button"
                      onClick={() => setReportTarget({ type: 'user' })}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/72 transition-colors hover:border-white/20 hover:text-white"
                    >
                      Denunciar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBlockConfirm(true)}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${
                        isSelectedUserBlocked
                          ? 'border-emerald-500/30 bg-emerald-500/12 text-emerald-200 hover:border-emerald-400/45'
                          : 'border-red-500/25 bg-red-500/10 text-red-200 hover:border-red-400/40'
                      }`}
                    >
                      {isSelectedUserBlocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelection(null)}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 p-2">
              <ClanChat />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-none items-center justify-between border-b border-white/5 bg-black/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <UserAvatar
                    nickname={selectedNickname || 'Contato'}
                    avatarUrl={selectedAvatarUrl}
                    className="h-10 w-10"
                    isOnline={selectedOnline}
                    showBorder={false}
                  />
                  {selectedOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-black bg-green-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white">{selectedNickname}</div>
                  <div className={`text-[10px] uppercase tracking-[0.18em] ${selectedOnline ? 'text-green-400' : 'text-gray-500'}`}>
                    {selectedOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedParticipantId && (
                  <>
                    <button
                      type="button"
                      onClick={() => setReportTarget({ type: 'user' })}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/72 transition-colors hover:border-white/20 hover:text-white"
                    >
                      Denunciar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBlockConfirm(true)}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${
                        isSelectedUserBlocked
                          ? 'border-emerald-500/30 bg-emerald-500/12 text-emerald-200 hover:border-emerald-400/45'
                          : 'border-red-500/25 bg-red-500/10 text-red-200 hover:border-red-400/40'
                      }`}
                    >
                      {isSelectedUserBlocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelection(null)}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)] p-4">
              {isSelectedUserBlocked ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                    <XCircleIcon className="h-8 w-8 text-red-300" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">Usuario bloqueado</p>
                  <p className="mt-2 max-w-[240px] text-[11px] leading-relaxed text-white/55">
                    As mensagens desta conversa ficaram ocultas. Desbloqueie para voltar a ver e responder.
                  </p>
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-600">
                  <MessageIcon className="mb-4 h-12 w-12 opacity-10" />
                  <p className="text-xs leading-relaxed">
                    Esta conexão ainda está vazia. Envie a primeira mensagem para abrir o fio.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeMessages.map((message) => {
                    const isMe = message.senderId === userProfile.id;
                    return (
                      <div key={message.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                            isMe
                              ? 'rounded-tr-none bg-[var(--skin-accent-color)] text-black shadow-[0_4px_15px_rgba(var(--skin-accent-rgb),0.2)]'
                              : 'rounded-tl-none border border-white/5 bg-white/10 text-gray-200'
                          }`}
                        >
                          {message.content}
                          <div className={`mt-1 flex items-center gap-1 text-[8px] ${isMe ? 'justify-end text-black/50' : 'text-gray-500'}`}>
                            {formatTime(message.createdAt)}
                            {isMe && <span className={`text-[10px] ${message.read ? 'text-blue-700' : 'text-black/30'}`}>{message.read ? '✓✓' : '✓'}</span>}
                          </div>
                        </div>
                        {!isMe && (
                          <button
                            type="button"
                            onClick={() => setReportTarget({
                              type: 'message',
                              messageId: message.id,
                              messageContent: message.content,
                              messageSenderId: message.senderId,
                            })}
                            className="mr-1 mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/32 transition-colors hover:text-red-200"
                          >
                            Denunciar mensagem
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="flex items-end gap-3 border-t border-white/5 bg-black/40 p-4">
              <div className="relative flex-1">
                <textarea
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onInput={(event) => {
                    const target = event.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={isSelectedUserBlocked ? 'Desbloqueie para voltar a conversar...' : 'Mensagem direta...'}
                  rows={1}
                  className="max-h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-[13px] text-white transition-all placeholder-gray-600 focus:border-[var(--skin-accent-color)]/50 focus:bg-white/10 focus:outline-none"
                  disabled={isSelectedUserBlocked}
                />
              </div>
              <button
                onClick={() => void handleSend()}
                disabled={!inputValue.trim() || isSelectedUserBlocked}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--skin-accent-color)] text-black shadow-xl transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-20 disabled:hover:scale-100"
              >
                <SendIcon className="h-6 w-6" />
              </button>
            </div>
          </>
        )}
      </div>

      {showBlockConfirm && selectedParticipantId && (
        <ConfirmationModal
          title={isSelectedUserBlocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
          message={isSelectedUserBlocked
            ? 'Deseja permitir contato novamente nesta conversa?'
            : 'As mensagens dessa pessoa serao ocultadas e a conversa ficara bloqueada para envio.'}
          onConfirm={() => void handleToggleBlock()}
          onCancel={() => setShowBlockConfirm(false)}
          confirmLabel={isSelectedUserBlocked ? 'DESBLOQUEAR' : 'BLOQUEAR'}
        />
      )}

      <ModerationReportModal
        open={!!reportTarget && !!selectedParticipantId}
        title={reportTarget?.type === 'user' ? 'Denunciar usuario' : 'Denunciar mensagem'}
        subjectLabel={reportTarget?.type === 'user'
          ? (selectedConversation && 'profile' in selectedConversation ? selectedConversation.profile.nickname : 'Contato')
          : `"${reportTarget?.messageContent?.slice(0, 48) || ''}${(reportTarget?.messageContent || '').length > 48 ? '...' : ''}"`}
        submitting={isModerationBusy}
        onClose={() => !isModerationBusy && setReportTarget(null)}
        onSubmit={handleSubmitReport}
      />
    </div>
  );
};
