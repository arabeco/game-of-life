import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../supabaseClient';
import { useSensoryFeedback } from '../hooks/useSensoryFeedback';
import { LockIcon, SendIcon, UnlockIcon } from './Icons';
import { ConfirmationModal } from './ConfirmationModal';
import { ModerationReportModal } from './ModerationReportModal';

interface ClanMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  is_optimistic?: boolean;
}

interface BlockTarget {
  userId: string;
  nickname: string;
}

export const ClanChat: React.FC = () => {
  const {
    userProfile,
    clan,
    enrichedClanMembers,
    blockedUserIds,
    blockUser,
    unblockUser,
    submitModerationReport,
  } = useGame();
  const { trigger } = useSensoryFeedback();
  const [messages, setMessages] = useState<ClanMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blockTarget, setBlockTarget] = useState<BlockTarget | null>(null);
  const [reportTarget, setReportTarget] = useState<{ message: ClanMessage; senderName: string } | null>(null);
  const [isModerationBusy, setIsModerationBusy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const blockedSet = useMemo(() => new Set(blockedUserIds), [blockedUserIds]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!clan?.id) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from('clan_messages')
        .select('*')
        .eq('clan_id', clan.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (data) {
        setMessages(data);
        setTimeout(() => scrollToBottom('auto'), 100);
      }
    };

    void loadMessages();

    const channel = supabase
      .channel(`clan_chat:${clan.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clan_messages',
          filter: `clan_id=eq.${clan.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ClanMessage;

          if (newMsg.user_id !== userProfile.id && !blockedSet.has(newMsg.user_id)) {
            trigger('notification');
          }

          setMessages((prev) => {
            if (prev.some((message) => message.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [blockedSet, clan?.id, trigger, userProfile.id]);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [isAtBottom, messages]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !clan?.id) return;

    trigger('click');

    const tempId = crypto.randomUUID();
    const message = inputValue.trim();
    const optimisticMessage: ClanMessage = {
      id: tempId,
      user_id: userProfile.id,
      message,
      created_at: new Date().toISOString(),
      is_optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputValue('');
    setIsAtBottom(true);

    const { error } = await supabase
      .from('clan_messages')
      .insert({
        clan_id: clan.id,
        user_id: userProfile.id,
        message,
      });

    if (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((entry) => entry.id !== tempId));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleToggleBlock = async () => {
    if (!blockTarget) return;
    setIsModerationBusy(true);

    if (blockedSet.has(blockTarget.userId)) {
      await unblockUser(blockTarget.userId);
    } else {
      await blockUser(blockTarget.userId);
    }

    setIsModerationBusy(false);
    setShowBlockConfirm(false);
    setBlockTarget(null);
  };

  const handleSubmitReport = async ({ reason, details }: { reason: any; details: string }) => {
    if (!reportTarget) return;

    setIsModerationBusy(true);
    await submitModerationReport({
      targetUserId: reportTarget.message.user_id,
      targetKind: 'clan_message',
      channelKind: 'clan',
      targetId: reportTarget.message.id,
      reason,
      details,
      metadata: {
        surface: 'clan_chat',
        clanId: clan?.id || null,
        messagePreview: reportTarget.message.message.slice(0, 180),
      },
    });
    setIsModerationBusy(false);
    setReportTarget(null);
  };

  if (!clan) {
    return <div className="p-4 text-center text-xs text-gray-500">Voce precisa estar em um grupo para acessar o chat.</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-white/5 bg-black/20">
      <div
        ref={containerRef}
        className="custom-scrollbar flex-1 min-h-0 space-y-3 overflow-y-auto p-3"
        onScroll={handleScroll}
      >
        {messages.length === 0 && (
          <div className="mt-4 text-center text-xs italic text-gray-600">
            Nenhuma mensagem ainda. Diga oi no grupo!
          </div>
        )}

        {messages.map((message, index) => {
          const isMe = message.user_id === userProfile.id;
          const sender = enrichedClanMembers.find((member) => member.id === message.user_id);
          const senderName = sender?.nickname || 'Membro';
          const showHeader = index === 0 || messages[index - 1].user_id !== message.user_id;
          const isBlockedSender = !isMe && blockedSet.has(message.user_id);

          return (
            <div key={message.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {showHeader && !isMe && (
                <div className="mb-1 ml-1 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400">{senderName}</span>
                  <button
                    type="button"
                    onClick={() => setReportTarget({ message, senderName })}
                    className="text-[10px] font-black uppercase tracking-[0.14em] text-white/32 transition-colors hover:text-red-200"
                  >
                    Denunciar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBlockTarget({ userId: message.user_id, nickname: senderName });
                      setShowBlockConfirm(true);
                    }}
                    className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${
                      isBlockedSender ? 'text-emerald-200 hover:text-emerald-100' : 'text-white/42 hover:text-white'
                    }`}
                  >
                    {isBlockedSender ? <UnlockIcon className="h-3 w-3" /> : <LockIcon className="h-3 w-3" />}
                    {isBlockedSender ? 'Desbloquear' : 'Bloquear'}
                  </button>
                </div>
              )}

              {isBlockedSender ? (
                <div className="max-w-[85%] rounded-2xl rounded-tl-none border border-red-500/12 bg-red-500/8 px-3 py-2 text-[11px] leading-relaxed text-red-100/80">
                  Mensagem oculta de usuario bloqueado.
                </div>
              ) : (
                <div
                  className={`
                    max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed
                    ${isMe
                      ? 'rounded-tr-none border border-[var(--skin-accent-color)]/30 bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)]'
                      : 'rounded-tl-none border border-white/5 bg-white/10 text-gray-200'}
                    ${message.is_optimistic ? 'opacity-70' : 'opacity-100'}
                  `}
                >
                  {message.message}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 border-t border-white/10 bg-black/40 px-2 pb-[calc(0.5rem+var(--safe-area-bottom))] pt-2">
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mensagem para o grupo..."
          className="flex-1 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-white transition-colors placeholder-gray-600 focus:border-[var(--skin-accent-color)]/50 focus:outline-none"
        />
        <button
          onClick={() => void handleSend()}
          disabled={!inputValue.trim()}
          className="rounded-full bg-[var(--skin-accent-color)]/20 p-2 text-[var(--skin-accent-color)] transition-colors hover:bg-[var(--skin-accent-color)]/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </div>

      {showBlockConfirm && blockTarget && (
        <ConfirmationModal
          title={blockedSet.has(blockTarget.userId) ? 'Desbloquear usuario' : 'Bloquear usuario'}
          message={blockedSet.has(blockTarget.userId)
            ? `Deseja voltar a ver as mensagens de ${blockTarget.nickname}?`
            : `As mensagens de ${blockTarget.nickname} ficarao ocultas no chat do grupo e o contato direto sera bloqueado.`}
          onConfirm={() => void handleToggleBlock()}
          onCancel={() => {
            setShowBlockConfirm(false);
            setBlockTarget(null);
          }}
          confirmLabel={blockedSet.has(blockTarget.userId) ? 'DESBLOQUEAR' : 'BLOQUEAR'}
        />
      )}

      <ModerationReportModal
        open={!!reportTarget}
        title="Denunciar mensagem"
        subjectLabel={`${reportTarget?.senderName || 'Membro'} · "${reportTarget?.message.message.slice(0, 42) || ''}${(reportTarget?.message.message || '').length > 42 ? '...' : ''}"`}
        submitting={isModerationBusy}
        onClose={() => !isModerationBusy && setReportTarget(null)}
        onSubmit={handleSubmitReport}
      />
    </div>
  );
};
