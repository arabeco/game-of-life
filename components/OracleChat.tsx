import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { XIcon, SendIcon, SparklesIcon, ZapIcon, EyeIcon, CrownIcon, LightbulbIcon, CheckIcon, PlannerIcon } from './Icons';
import { ORACLE_MODES } from '../constants/oracle';
import { OracleContext, OracleMode } from '../types';
import { Portal } from './Portal';

// API Key from gateway.ts (hardcoded for now as per instructions)
const API_KEY = "AIzaSyAryjNyDFBRrwfvsHdQWvUTCRm1-yx83zo";

const google = createGoogleGenerativeAI({
  apiKey: API_KEY
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: OracleMode;
}

const MODE_VISUALS: Record<OracleMode, { icon: React.FC<{ className?: string }>, color: string, bg: string, border: string }> = {
    neutro: { 
        icon: SparklesIcon, 
        color: "text-amber-200", 
        bg: "bg-black/40", 
        border: "border-white/5" 
    },
    coach: { 
        icon: ZapIcon, 
        color: "text-yellow-400", 
        bg: "bg-yellow-900/20", 
        border: "border-yellow-500/30" 
    },
    calmo: { 
        icon: EyeIcon, 
        color: "text-blue-300", 
        bg: "bg-blue-900/20", 
        border: "border-blue-500/30" 
    },
    reflexivo: { 
        icon: LightbulbIcon, 
        color: "text-purple-300", 
        bg: "bg-purple-900/20", 
        border: "border-purple-500/30" 
    },
    tatico: { 
        icon: CheckIcon, 
        color: "text-green-400", 
        bg: "bg-green-900/20", 
        border: "border-green-500/30" 
    },
    estrategico: { 
        icon: PlannerIcon, 
        color: "text-indigo-400", 
        bg: "bg-indigo-900/20", 
        border: "border-indigo-500/30" 
    },
    personalizado: { 
        icon: CrownIcon, 
        color: "text-pink-400", 
        bg: "bg-pink-900/20", 
        border: "border-pink-500/30" 
    }
};

export const OracleChat: React.FC<{ onClose: () => void; hideHeader?: boolean; isEmbedded?: boolean }> = ({ onClose, hideHeader = false, isEmbedded = false }) => {
  const { userProfile, assets, actions, tasks, reports, activeCycle, oraclePreferences, oracleMessages } = useGame();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [currentMode, setCurrentMode] = useState<OracleMode>(oraclePreferences?.activeMode || 'neutro');

  // Update mode when preferences change
  useEffect(() => {
    if (oraclePreferences?.activeMode) {
      setCurrentMode(oraclePreferences.activeMode);
    }
  }, [oraclePreferences?.activeMode]);

  // Load initial messages from history and set mode based on last message
  useEffect(() => {
    if (oracleMessages && oracleMessages.length > 0) {
        const history: Message[] = oracleMessages
            .filter(m => m.deliveryType === 'feed') // Show feed messages
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map(m => ({
                role: 'assistant',
                content: m.content,
                timestamp: new Date(m.createdAt),
                mode: m.mode // Store mode for display
            }));
        setMessages(history);

        // Set current chat mode to the last message's mode if available
        const lastMsg = history[history.length - 1];
        if (lastMsg && lastMsg.mode) {
            setCurrentMode(lastMsg.mode);
        }
    }
  }, [oracleMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build System Prompt based on Mode
  const systemPrompt = useMemo(() => {
    const config = ORACLE_MODES[currentMode];
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay: "madrugada" | "manhã" | "tarde" | "noite" = "manhã";
    if (hour >= 0 && hour < 6) timeOfDay = "madrugada";
    else if (hour >= 6 && hour < 12) timeOfDay = "manhã";
    else if (hour >= 12 && hour < 18) timeOfDay = "tarde";
    else timeOfDay = "noite";

    const contextData: OracleContext = {
        currentTime: now.toISOString(),
        timeOfDay,
        hasCycle: !!activeCycle,
        cycleDayNumber: activeCycle ? Math.floor((now.getTime() - new Date(activeCycle.startDate).getTime()) / (1000 * 60 * 60 * 24)) : null,
        cycleTotalDays: activeCycle ? Math.floor((new Date(activeCycle.endDate).getTime() - new Date(activeCycle.startDate).getTime()) / (1000 * 60 * 60 * 24)) : null,
        cycleCompletionPercent: null, // Calculate if needed
        hasArenas: assets.some(a => a.arenas.length > 0),
        totalArenas: assets.reduce((acc, a) => acc + a.arenas.length, 0),
        arenaNames: assets.flatMap(a => a.arenas.map(ar => ar.name)),
        staleArenas: [], // Logic to find stale arenas
        completedActionsInCycle: 0, // Logic needed
        pendingActionsToday: tasks.filter(t => t.date === now.toISOString().split('T')[0] && !t.completed).length,
        overdueActions: 0, // Logic needed
        activeMode: currentMode,
        customModeInstructions: oraclePreferences?.customModeInstructions || null,
        enabledCategories: oraclePreferences?.enabledCategories || [],
        username: userProfile.nickname,
        level: userProfile.level,
        sephirotLevels: assets.reduce((acc, a) => ({ ...acc, [a.name]: a.level }), {}),
        clanName: null, // Get from clan state if available
        seasonName: null,
        pendingChests: userProfile.chests?.reduce((acc, c) => acc + c.count, 0) || 0
    };

    return config.systemPromptTemplate(contextData);
  }, [currentMode, userProfile, assets, actions, tasks, reports, activeCycle, oraclePreferences]);

  const handleCommand = (cmd: string): string | null => {
    const lowerCmd = cmd.toLowerCase().trim();
    
    // Help Command
    if (lowerCmd === '?ajuda' || lowerCmd === '?help') {
        return "🤖 **Comandos do Oráculo**\n\nUse **?** para saber o que é algo.\nUse **!** para ver seus dados.\n\nExemplos:\n• **?arenas** - O que são Arenas?\n• **!arenas** - Ver minhas Arenas\n\nExperimente também conversar naturalmente comigo!";
    }

    // Explanation Commands (?)
    if (lowerCmd === '?arenas') {
        return "🏛️ **Sobre as Arenas**\n\nAs Arenas são os domínios da sua vida onde você busca maestria (ex: Saúde, Trabalho, Finanças). Cada Arena contém suas Ações e Missões.\n\nElas representam as áreas que você deseja evoluir no GLYPH. Você pode criar novas Arenas no Inventário.";
    }

    // List Commands (!)
    if (lowerCmd === '!arenas') {
        const arenaList = assets.flatMap(a => a.arenas.map(ar => ar.name));
        if (arenaList.length === 0) {
            return "📜 **Suas Arenas**\n\nVocê ainda não possui Arenas ativas. Vá até o Inventário para criar sua primeira Arena.";
        }
        return `📜 **Suas Arenas Ativas**\n\n${arenaList.map(name => `• ${name}`).join('\n')}`;
    }

    return null;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Check for commands
    if (input.startsWith('?') || input.startsWith('!')) {
        const commandResponse = handleCommand(input);
        if (commandResponse) {
             // Simulate small delay for natural feel
             setTimeout(() => {
                 setMessages(prev => [...prev, { role: 'assistant', content: commandResponse, timestamp: new Date() }]);
                 setIsLoading(false);
             }, 600);
             return;
        }
    }

    try {
      const result = await streamText({
        model: google('models/gemini-3-flash-preview'),
        system: systemPrompt,
        messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
      });

      let fullResponse = '';
      const assistantMessage: Message = { role: 'assistant', content: '', timestamp: new Date(), mode: currentMode };
      setMessages(prev => [...prev, assistantMessage]);

      for await (const textPart of result.textStream) {
        fullResponse += textPart;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = fullResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Oracle Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'O Oráculo está em silêncio momentâneo. Tente novamente.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const HeaderIcon = MODE_VISUALS[currentMode].icon || SparklesIcon;
  
  const content = (
      <>
        {/* Header */}
        {!hideHeader && (
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${MODE_VISUALS[currentMode].border} ${MODE_VISUALS[currentMode].bg}`}>
               <HeaderIcon className={`w-4 h-4 ${MODE_VISUALS[currentMode].color}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-200 tracking-wider">ORÁCULO</h3>
              <div className="flex flex-col">
                  <span className={`text-[10px] uppercase tracking-widest ${MODE_VISUALS[currentMode].color}`}>{ORACLE_MODES[currentMode].name}</span>
                  <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Online</span>
                  </div>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-50">
              <SparklesIcon className="w-12 h-12 mb-4 text-gray-600" />
              <p className="text-sm text-gray-500">O Oráculo aguarda sua consulta, Soberano.</p>
              <p className="text-xs text-gray-600 mt-2 max-w-[200px]">Modo atual: {ORACLE_MODES[currentMode].description}</p>
            </div>
          )}
          
          {messages.map((msg, idx) => {
             const msgMode = msg.role === 'assistant' ? (msg.mode || 'neutro') : 'neutro';
             const visuals = MODE_VISUALS[msgMode];
             const ModeIcon = visuals.icon;

             return (
            <div 
              key={idx} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} mb-4`}
            >
              {msg.role === 'assistant' && (
                 <div className="flex items-center gap-2 mb-1 ml-1">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${visuals.bg} border ${visuals.border}`}>
                        <ModeIcon className={`w-2.5 h-2.5 ${visuals.color}`} />
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest ${visuals.color}`}>
                        {ORACLE_MODES[msgMode].name}
                    </span>
                 </div>
              )}
              <div 
                className={`
                  max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-white/10 text-white rounded-tr-sm border border-white/5' 
                    : `${visuals.bg} ${visuals.color.replace('text-', 'text-white/90 ')} rounded-tl-sm border ${visuals.border} shadow-inner`}
                `}
              >
                {msg.content}
              </div>
            </div>
          )})}
          
          {isLoading && (
            <div className="flex justify-start">
                <div className="bg-black/40 text-gray-300 rounded-tl-sm border border-white/5 shadow-inner p-3 rounded-2xl flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-xs text-gray-500 animate-pulse ml-1">
                    {["Consultando os astros...", "Ouvindo os sussurros...", "Decifrando o destino...", "Conectando ao éter..."][Math.floor(Math.random() * 4)]}
                  </span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-black/40">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Consulte o Oráculo..."
              disabled={isLoading}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-lg transition-colors text-amber-200"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </>
  );

  if (isEmbedded) {
      return <div className="flex flex-col h-full w-full">{content}</div>;
  }

  return (
    <Portal>
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 pointer-events-none">
            {/* Backdrop for mobile mostly, but let's keep it clickable through except the chat */}
            <div className="absolute inset-0 bg-transparent" onClick={onClose} />
            
            <div className="pointer-events-auto w-full max-w-sm mt-16 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[80vh] animate-in slide-in-from-top-5 fade-in duration-300">
                {content}
            </div>
        </div>
    </Portal>
  );
};
