import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { DMConversation, DirectMessage, UserProfile } from '../types';
import { SendIcon, MessageIcon, ChevronLeftIcon, SparklesIcon, UsersIcon, XCircleIcon } from './Icons';
import { UserAvatar } from './UserAvatar';
import { useSensoryFeedback } from '../hooks/useSensoryFeedback';
import { ConfirmationModal } from './ConfirmationModal';
import { ModerationReportModal } from './ModerationReportModal';

export const DirectMessages: React.FC<{ initialParticipantId?: string | null }> = ({ initialParticipantId = null }) => {
    const { 
        dmConversations, 
        directMessages, 
        sendDirectMessage, 
        markDMAsRead, 
        userProfile,
        friends,
        blockedUserIds,
        blockUser,
        unblockUser,
        submitModerationReport,
    } = useGame();
    
    const { trigger } = useSensoryFeedback();
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [reportTarget, setReportTarget] = useState<{ type: 'user' | 'message'; message?: DirectMessage } | null>(null);
    const [isModerationBusy, setIsModerationBusy] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Sort conversations by last message date
    const sortedConversations = [...dmConversations].sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    // Filter messages for selected conversation
    const activeMessages = selectedParticipantId 
        ? directMessages.filter(m => 
            (m.senderId === selectedParticipantId && m.recipientId === userProfile.id) ||
            (m.senderId === userProfile.id && m.recipientId === selectedParticipantId)
          ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        : [];

    const friendProfile = friends.find(f => f.id === selectedParticipantId);
    const selectedConversation = dmConversations.find(c => c.participantId === selectedParticipantId) || 
                                (friendProfile ? { participantId: friendProfile.id, profile: friendProfile, unreadCount: 0 } : null);
    const isSelectedUserBlocked = selectedParticipantId ? blockedUserIds.includes(selectedParticipantId) : false;

    useEffect(() => {
        const normalizedParticipantId = typeof initialParticipantId === 'string' ? initialParticipantId.trim() : '';
        if (!normalizedParticipantId) return;

        const participantExists = dmConversations.some((conversation) => conversation.participantId === normalizedParticipantId)
            || friends.some((friend) => friend.id === normalizedParticipantId);

        if (participantExists) {
            setSelectedParticipantId(normalizedParticipantId);
        }
    }, [dmConversations, friends, initialParticipantId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (selectedParticipantId) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            markDMAsRead(selectedParticipantId);
        }
    }, [activeMessages.length, selectedParticipantId, markDMAsRead]);

    // Animation state for switching conversations
    const [isChangingConversation, setIsChangingConversation] = useState(false);
    useEffect(() => {
        if (selectedParticipantId) {
            setIsChangingConversation(true);
            const timer = setTimeout(() => setIsChangingConversation(false), 300);
            return () => clearTimeout(timer);
        }
    }, [selectedParticipantId]);

    const handleSend = async () => {
        if (!inputValue.trim() || !selectedParticipantId) return;
        
        trigger('click');
        const content = inputValue.trim();
        setInputValue('');
        await sendDirectMessage(selectedParticipantId, content);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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
                    surface: 'direct_messages',
                    participantId: selectedParticipantId,
                },
            });
        } else if (reportTarget.message) {
            await submitModerationReport({
                targetUserId: reportTarget.message.senderId,
                targetKind: 'direct_message',
                channelKind: 'dm',
                targetId: reportTarget.message.id,
                reason,
                details,
                metadata: {
                    surface: 'direct_messages',
                    participantId: selectedParticipantId,
                    messagePreview: reportTarget.message.content.slice(0, 180),
                },
            });
        }
        setIsModerationBusy(false);
        setReportTarget(null);
    };

    // Helper to format time
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // If no conversations and no friends, show empty state
    if (dmConversations.length === 0 && friends.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center bg-black/20">
                <MessageIcon className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">Você ainda não tem mensagens.</p>
                <p className="text-[10px] mt-2 opacity-60 uppercase tracking-widest">ADICIONE AMIGOS PARA COMEÇAR A CONVERSAR</p>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-black/20 overflow-hidden">
            {/* SIDEBAR: Conversation List (Abinha Vertical) */}
            <div className="w-16 sm:w-24 flex-none border-r border-white/5 bg-black/40 flex flex-col overflow-y-auto no-scrollbar py-4 items-center gap-4 relative">
                {/* Active Indicator Slide */}
                {selectedParticipantId && (
                    <div 
                        className="absolute left-0 w-1 bg-[var(--skin-accent-color)] rounded-r-full transition-all duration-500 ease-in-out shadow-[0_0_10px_var(--skin-accent-color)]"
                        style={{ 
                            height: '24px',
                            top: `${(() => {
                                const index = sortedConversations.findIndex(c => c.participantId === selectedParticipantId);
                                if (index !== -1) return 16 + (index * 64) + 20; // 16 is padding-top, 64 is button height + gap, 20 is half button height
                                
                                const friendIndex = friends.filter(f => !dmConversations.some(c => c.participantId === f.id)).findIndex(f => f.id === selectedParticipantId);
                                if (friendIndex !== -1) {
                                    const sepHeight = dmConversations.length > 0 ? 17 : 0;
                                    return 16 + (sortedConversations.length * 64) + sepHeight + (friendIndex * 56) + 16;
                                }
                                return -100;
                            })()}px`,
                            transform: 'translateY(-50%)'
                        }}
                    />
                )}

                {/* Conversations with History */}
                {sortedConversations.map((conv, index) => (
                    <button
                        key={conv.participantId}
                        onClick={() => {
                            setSelectedParticipantId(conv.participantId);
                            trigger('click');
                        }}
                        className={`relative group p-1 transition-all duration-300 ${selectedParticipantId === conv.participantId ? 'scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                        title={conv.profile.nickname}
                    >
                        <UserAvatar 
                            nickname={conv.profile.nickname} 
                            avatarUrl={conv.profile.avatarUrl} 
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl transition-all ${selectedParticipantId === conv.participantId ? 'ring-2 ring-[var(--skin-accent-color)] ring-offset-2 ring-offset-black shadow-[0_0_15px_rgba(var(--skin-accent-rgb),0.3)]' : ''}`}
                            showBorder={false}
                            isOnline={conv.profile.isOnline}
                        />
                        {conv.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--skin-accent-color)] flex items-center justify-center text-[10px] font-bold text-black shadow-lg border-2 border-black animate-bounce z-10">
                                {conv.unreadCount}
                            </div>
                        )}
                        
                        {/* Tooltip for small screens/avatars */}
                        <div className="absolute left-full ml-4 px-2 py-1 bg-black/90 border border-white/10 rounded text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-[-10px] group-hover:translate-x-0 z-50 shadow-xl">
                            <div className="flex flex-col gap-0.5">
                                <span>{conv.profile.nickname}</span>
                                {conv.lastMessage && (
                                    <span className="text-[8px] text-gray-500 font-normal truncate max-w-[100px]">
                                        {conv.lastMessage.content}
                                    </span>
                                )}
                            </div>
                            {/* Tooltip Arrow */}
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-black border-l border-b border-white/10 rotate-45" />
                        </div>
                    </button>
                ))}

                {/* Separator if needed */}
                {friends.filter(f => !dmConversations.some(c => c.participantId === f.id)).length > 0 && (
                    <div className="w-8 h-px bg-white/10 my-2 shrink-0" />
                )}

                {/* Friends without history */}
                {friends
                    .filter(f => !dmConversations.some(c => c.participantId === f.id))
                    .map(friend => (
                        <button
                            key={friend.id}
                            onClick={() => {
                                setSelectedParticipantId(friend.id);
                                trigger('click');
                            }}
                            className={`relative group p-1 transition-all duration-300 ${selectedParticipantId === friend.id ? 'scale-110' : 'opacity-40 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0'}`}
                            title={friend.nickname}
                        >
                            <UserAvatar 
                                nickname={friend.nickname} 
                                avatarUrl={friend.avatarUrl} 
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl transition-all ${selectedParticipantId === friend.id ? 'ring-2 ring-[var(--skin-accent-color)] ring-offset-2 ring-offset-black' : ''}`}
                                showBorder={false}
                                isOnline={friend.isOnline}
                            />
                            <div className="absolute left-full ml-4 px-2 py-1 bg-black/90 border border-white/10 rounded text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-[-10px] group-hover:translate-x-0 z-50 shadow-xl">
                                {friend.nickname}
                                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-black border-l border-b border-white/10 rotate-45" />
                            </div>
                        </button>
                    ))
                }
            </div>

            {/* MAIN CONTENT: Chat Area */}
            <div className={`flex-1 flex flex-col bg-black/10 relative overflow-hidden transition-all duration-300 ${isChangingConversation ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                {!selectedParticipantId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center animate-in fade-in duration-500">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <MessageIcon className="w-8 h-8 opacity-20" />
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-widest">Suas Conversas</h3>
                        <p className="text-[10px] opacity-60 uppercase tracking-tighter">Selecione um contato para começar a falar</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="flex-none p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {selectedConversation && (
                                    <>
                                        <div className="relative">
                                            <UserAvatar 
                                                nickname={'profile' in selectedConversation ? selectedConversation.profile.nickname : (selectedConversation as UserProfile).nickname} 
                                                avatarUrl={'profile' in selectedConversation ? selectedConversation.profile.avatarUrl : (selectedConversation as UserProfile).avatarUrl} 
                                                className="w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-300 hover:scale-110"
                                                showBorder={false}
                                                isOnline={'profile' in selectedConversation ? selectedConversation.profile.isOnline : (selectedConversation as UserProfile).isOnline}
                                            />
                                            {('profile' in selectedConversation ? selectedConversation.profile.isOnline : (selectedConversation as UserProfile).isOnline) && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-black rounded-full animate-pulse" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white leading-tight">
                                                {'profile' in selectedConversation ? selectedConversation.profile.nickname : (selectedConversation as UserProfile).nickname}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[9px] uppercase tracking-widest font-medium transition-colors ${('profile' in selectedConversation ? selectedConversation.profile.isOnline : (selectedConversation as UserProfile).isOnline) ? 'text-green-500' : 'text-gray-500'}`}>
                                                    {('profile' in selectedConversation ? selectedConversation.profile.isOnline : (selectedConversation as UserProfile).isOnline) ? 'Online' : 'Offline'}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
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
                                    onClick={() => setSelectedParticipantId(null)}
                                    className="sm:hidden p-2 rounded-full hover:bg-white/10 text-gray-400 active:scale-90 transition-transform"
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]">
                            {isSelectedUserBlocked ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                                        <XCircleIcon className="w-8 h-8 text-red-300" />
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">Usuario bloqueado</p>
                                    <p className="mt-2 max-w-[240px] text-[11px] leading-relaxed text-white/55">
                                        As mensagens desta conversa ficaram ocultas. Desbloqueie para voltar a ver e responder.
                                    </p>
                                </div>
                            ) : activeMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-600 italic text-center p-8 animate-in zoom-in-95 duration-700">
                                    <SparklesIcon className="w-12 h-12 mb-4 opacity-5 animate-pulse" />
                                    <p className="text-xs max-w-[200px] leading-relaxed">
                                        Esta é a sua conexão privada com 
                                        <span className="text-[var(--skin-accent-color)] font-bold ml-1">
                                            {'profile' in selectedConversation! ? selectedConversation.profile.nickname : (selectedConversation as UserProfile).nickname}
                                        </span>.
                                        Envie sua primeira mensagem!
                                    </p>
                                </div>
                            ) : (
                                activeMessages.map((msg, index) => {
                                    const isMe = msg.senderId === userProfile.id;
                                    
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-4 fade-in duration-500 delay-[${Math.min(index * 50, 500)}ms]`}>
                                            <div className={`
                                                max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed relative group transition-all
                                                ${isMe 
                                                    ? 'bg-[var(--skin-accent-color)] text-black rounded-tr-none shadow-[0_4px_15px_rgba(var(--skin-accent-rgb),0.2)]' 
                                                    : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'}
                                            `}>
                                                {msg.content}
                                                <div className={`
                                                    text-[8px] mt-1 flex items-center gap-1
                                                    ${isMe ? 'text-black/50 justify-end' : 'text-gray-500 justify-start'}
                                                `}>
                                                    {formatTime(msg.createdAt)}
                                                    {isMe && (
                                                        <span className={`text-[10px] transition-colors ${msg.read ? 'text-blue-600' : 'text-black/30'}`}>
                                                            {msg.read ? '✓✓' : '✓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {!isMe && (
                                                <button
                                                    type="button"
                                                    onClick={() => setReportTarget({ type: 'message', message: msg })}
                                                    className="mt-1 mr-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/32 transition-colors hover:text-red-200"
                                                >
                                                    Denunciar mensagem
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-black/40 border-t border-white/5 flex gap-3 items-end">
                            <div className="flex-1 relative">
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Escreva sua mensagem..."
                                    rows={1}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-[13px] text-white focus:outline-none focus:border-[var(--skin-accent-color)]/50 focus:bg-white/10 transition-all placeholder-gray-600 resize-none max-h-32 custom-scrollbar"
                                    style={{ height: 'auto' }}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = `${target.scrollHeight}px`;
                                    }}
                                    disabled={isSelectedUserBlocked}
                                />
                            </div>
                            <button 
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isSelectedUserBlocked}
                                className="w-12 h-12 rounded-2xl bg-[var(--skin-accent-color)] flex items-center justify-center text-black hover:scale-105 active:scale-95 disabled:opacity-20 disabled:grayscale disabled:scale-100 transition-all shadow-xl"
                            >
                                <SendIcon className="w-6 h-6" />
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
                    ? (selectedConversation && 'profile' in selectedConversation ? selectedConversation.profile.nickname : friendProfile?.nickname || 'Contato')
                    : `"${reportTarget?.message?.content.slice(0, 48) || ''}${(reportTarget?.message?.content || '').length > 48 ? '…' : ''}"`}
                submitting={isModerationBusy}
                onClose={() => !isModerationBusy && setReportTarget(null)}
                onSubmit={handleSubmitReport}
            />
        </div>
    );
};
