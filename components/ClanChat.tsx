import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../supabaseClient';
import { useSensoryFeedback } from '../hooks/useSensoryFeedback';
import { SendIcon } from './Icons';

interface ClanMessage {
    id: string;
    user_id: string;
    message: string;
    created_at: string;
    is_optimistic?: boolean;
}

export const ClanChat: React.FC = () => {
    const { userProfile, clan, enrichedClanMembers } = useGame();
    const { trigger } = useSensoryFeedback();
    const [messages, setMessages] = useState<ClanMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);

    // Scroll to bottom helper
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    // Load initial messages
    useEffect(() => {
        if (!clan?.id) return;

        const loadMessages = async () => {
            const { data, error } = await supabase
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

        loadMessages();

        // Subscribe to Realtime
        const channel = supabase
            .channel(`clan_chat:${clan.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'clan_messages',
                    filter: `clan_id=eq.${clan.id}`
                },
                (payload) => {
                    const newMsg = payload.new as ClanMessage;
                    
                    // Se a mensagem não é minha, toca som/vibra
                    if (newMsg.user_id !== userProfile.id) {
                        trigger('notification');
                    }

                    setMessages(prev => {
                        // Evita duplicatas se já adicionamos otimisticamente (pelo ID temporário ou real)
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        // Remove otimista se houver correspondência (assumindo que o ID otimista é diferente, mas aqui simplificamos)
                        // Na prática, a mensagem real substitui a otimista se gerenciarmos IDs temporários,
                        // mas para simplificar, vamos apenas adicionar se não existir.
                        return [...prev, newMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [clan?.id, userProfile.id, trigger]);

    // Auto-scroll on new messages if near bottom
    useEffect(() => {
        if (isAtBottom) {
            scrollToBottom();
        }
    }, [messages, isAtBottom]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const isBottom = scrollHeight - scrollTop - clientHeight < 50;
        setIsAtBottom(isBottom);
    };

    const handleSend = async () => {
        if (!inputValue.trim() || !clan?.id) return;

        trigger('click');

        const tempId = crypto.randomUUID();
        const newMessage: ClanMessage = {
            id: tempId,
            user_id: userProfile.id,
            message: inputValue.trim(),
            created_at: new Date().toISOString(),
            is_optimistic: true
        };

        // Optimistic update
        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
        setIsAtBottom(true);

        const { error } = await supabase
            .from('clan_messages')
            .insert({
                clan_id: clan.id,
                user_id: userProfile.id,
                message: newMessage.message
            });

        if (error) {
            console.error('Error sending message:', error);
            // Revert on error (could be improved)
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!clan) return <div className="p-4 text-center text-gray-500 text-xs">Voc� precisa estar em um grupo para acessar o chat.</div>;

    return (
        <div className="flex flex-col h-full bg-black/20 rounded-lg overflow-hidden border border-white/5">
            {/* Header (Opcional, se já estiver em aba não precisa) */}
            
            {/* Messages Area */}
            <div 
                ref={containerRef}
                className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar"
                onScroll={handleScroll}
            >
                {messages.length === 0 && (
                    <div className="text-center text-gray-600 text-xs italic mt-4">
                        Nenhuma mensagem ainda. Diga oi no grupo!
                    </div>
                )}
                
                {messages.map((msg, index) => {
                    const isMe = msg.user_id === userProfile.id;
                    const sender = enrichedClanMembers.find(m => m.id === msg.user_id);
                    const showHeader = index === 0 || messages[index - 1].user_id !== msg.user_id;
                    const isSystem = false; // Futuro: mensagens de sistema (ex: fulano entrou)

                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {showHeader && !isMe && (
                                <span className="text-[10px] text-gray-400 ml-1 mb-0.5 font-bold">
                                    {sender?.nickname || 'Membro Desconhecido'}
                                </span>
                            )}
                            
                            <div className={`
                                max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed
                                ${isMe 
                                    ? 'bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)] rounded-tr-none border border-[var(--skin-accent-color)]/30' 
                                    : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'}
                                ${msg.is_optimistic ? 'opacity-70' : 'opacity-100'}
                            `}>
                                {msg.message}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-2 bg-black/40 border-t border-white/10 flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Mensagem para o grupo..."
                    className="flex-1 bg-black/30 border border-white/10 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:border-[var(--skin-accent-color)]/50 transition-colors placeholder-gray-600"
                />
                <button 
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="p-2 rounded-full bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)] hover:bg-[var(--skin-accent-color)]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <SendIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
