import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import { XIcon, SendIcon, SparklesIcon, ZapIcon, EyeIcon, CrownIcon, LightbulbIcon, CheckIcon, PlannerIcon, GameLogoIcon } from './Icons';
import { ORACLE_MODES } from '../constants/oracle';
import { OracleContext, OracleMode } from '../types';
import { Portal } from './Portal';
import { supabase } from '../supabaseClient';
import { buildActionPoolByDate } from '../utils/coreLoopUtils.js';
import { isTaskInPool } from '../utils/taskDomain.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: OracleMode;
}
const readResponseBody = async (response: Response): Promise<unknown> => {
  try {
    return await response.clone().json();
  } catch {
    try {
      return await response.clone().text();
    } catch {
      return null;
    }
  }
};

const parseOracleFunctionError = async (error: unknown): Promise<{ status: number | null; message: string; details: unknown }> => {
  const rawError = error as { message?: string; context?: Response };
  const response = rawError?.context;

  if (!response || typeof response.status !== 'number') {
    return {
      status: null,
      message: rawError?.message || 'Oracle function failed.',
      details: null,
    };
  }

  const details = await readResponseBody(response);
  let message = rawError?.message || `Oracle HTTP ${response.status}`;

  if (details && typeof details === 'object' && 'error' in details) {
    const errorMessage = (details as { error?: unknown }).error;
    if (typeof errorMessage === 'string' && errorMessage.trim()) {
      message = errorMessage;
    }
  }

  return {
    status: response.status,
    message,
    details,
  };
};
const MODE_VISUALS: Record<OracleMode, { icon: React.FC<{ className?: string }>, color: string, bg: string, border: string }> = {
    neutro: { 
        icon: GameLogoIcon, 
        color: "text-[var(--skin-accent-color)]", 
        bg: "bg-black/60", 
        border: "border-[var(--skin-accent-color)]/30" 
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
  const { userProfile, assets, actions, tasks, taskPool, reports, activeCycle, cycleProgress, oraclePreferences, oracleMessages, addArena, addAction } = useGame();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isInitialLoadRef = useRef(true);
  const firstConversationNotice = 'Aviso: o Oráculo usa IA externa. Evite compartilhar dados sensíveis nas conversas.';
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [currentMode, setCurrentMode] = useState<OracleMode>(oraclePreferences?.activeMode || 'neutro');

  const availableTaskPool = useMemo(() => buildActionPoolByDate(actions, taskPool, tasks, null), [actions, taskPool, tasks]);
  const bayAreaTasks = useMemo(() => tasks.filter(isTaskInPool), [tasks]);
  const bayAreaVisibleCount = useMemo(() => {
    const unified = { ...availableTaskPool };

    bayAreaTasks.forEach((task) => {
      if (!unified[task.actionId]) {
        unified[task.actionId] = { count: 0, isUnlimited: false, taskIds: [] };
      }

      if (!unified[task.actionId].taskIds) {
        unified[task.actionId].taskIds = [];
      }

      unified[task.actionId].taskIds.push(task.id);
    });

    return Object.values(unified).filter((payload: any) => payload.count > 0 || ((payload.taskIds?.length || 0) > 0)).length;
  }, [availableTaskPool, bayAreaTasks]);

  // Update mode when preferences change
  useEffect(() => {
    if (oraclePreferences?.activeMode) {
      setCurrentMode(oraclePreferences.activeMode);
    }
  }, [oraclePreferences?.activeMode]);

  // Load initial messages from history and set mode based on last message
  useEffect(() => {
    if (isInitialLoadRef.current && oracleMessages && oracleMessages.length > 0) {
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
        isInitialLoadRef.current = false;
    }
  }, [oracleMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    // Only focus if NOT embedded to avoid keyboard popping up on mobile feed open
    if (!isEmbedded) {
        inputRef.current?.focus();
    }
  }, [isEmbedded]);

  // Build System Prompt based on Mode
  const systemPrompt = useMemo(() => {
    const config = ORACLE_MODES[currentMode];
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay: "madrugada" | "manha" | "tarde" | "noite" = "manha";
    if (hour >= 0 && hour < 6) timeOfDay = "madrugada";
    else if (hour >= 6 && hour < 12) timeOfDay = "manha";
    else if (hour >= 12 && hour < 18) timeOfDay = "tarde";
    else timeOfDay = "noite";

    const contextData: OracleContext = {
        currentTime: now.toISOString(),
        timeOfDay,
        hasCycle: !!activeCycle,
        cycleDayNumber: activeCycle ? Math.max(0, Math.floor((now.getTime() - new Date(activeCycle.startDate).getTime()) / (1000 * 60 * 60 * 24))) : 0,
        cycleTotalDays: activeCycle ? Math.max(1, Math.floor((new Date(activeCycle.endDate).getTime() - new Date(activeCycle.startDate).getTime()) / (1000 * 60 * 60 * 24))) : 0,
        cycleCompletionPercent: activeCycle ? cycleProgress : null,
        hasArenas: assets.some(a => a.arenas.length > 0),
        totalArenas: assets.reduce((acc, a) => acc + a.arenas.length, 0),
        arenaNames: assets.flatMap(a => a.arenas.map(ar => ar.name)),
        staleArenas: [], // Logic to find stale arenas
        completedActionsInCycle: 0, // Logic needed
        // Fix: pendingActionsToday should count ALL scheduled tasks for today that are not completed
        pendingActionsToday: tasks.filter(t => {
            if (!t.date) return false;
            // Normalize dates to YYYY-MM-DD for comparison
            const taskDate = t.date.split('T')[0];
            const todayStr = now.toISOString().split('T')[0];
            return taskDate === todayStr && !t.completed;
        }).length,
        overdueActions: 0, // Logic needed
        activeMode: currentMode,
        customModeInstructions: oraclePreferences?.customModeInstructions || null,
        enabledCategories: oraclePreferences?.enabledCategories || [],
        username: userProfile.nickname || 'Viajante',
        level: userProfile.level || 1,
        sephirotLevels: assets.reduce((acc, a) => ({ ...acc, [a.name]: a.level }), {}),
        clanName: null, // Get from clan state if available
        seasonName: null,
        pendingChests: userProfile.chests?.reduce((acc, c) => acc + (c.count || 0), 0) || 0
    };

    return config.systemPromptTemplate(contextData);
  }, [currentMode, userProfile, assets, actions, tasks, reports, activeCycle, cycleProgress, oraclePreferences]);

  const buildRecoveryFastPath = useCallback((rawInput: string): string | null => {
    const normalized = rawInput
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    const soundsExhausted = /exaust|esgotad|sobrecarregad|cansad|sem energia|no limite|destru[ií]d/.test(normalized);
    const mentionsTomorrow = /amanh/.test(normalized);

    if (!soundsExhausted || !mentionsTomorrow) {
      return null;
    }

    const now = new Date();
    const hourLabel = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];

    const mentalAssetName = assets.find((asset) => {
      const assetLabel = `${asset.id} ${asset.name}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      return assetLabel.includes('espaco mental') || assetLabel.includes('mental');
    })?.name || 'Espaço Mental';

    const pendingToday = tasks.filter((task) => {
      if (!task.date || task.completed) return false;
      return task.date.split('T')[0] === todayStr;
    }).length;

    const bayLine = bayAreaVisibleCount > 0
      ? ` ação em espera`
      : 'estoque de ações limpo';

    const pendingLine = pendingToday > 0
      ? `${pendingToday} pendência${pendingToday === 1 ? '' : 's'} hoje`
      : 'nenhuma pendência hoje';

    const cycleLine = !activeCycle
      ? 'Sem ciclo ativo no momento.'
      : cycleProgress >= 70
        ? `Seu ciclo está em bom ritmo (${cycleProgress}%).`
        : cycleProgress >= 40
          ? `Seu ciclo está em ritmo médio (${cycleProgress}%).`
          : `Seu ciclo pede contenção (${cycleProgress}%).`;

    return `${mentalAssetName} pedindo contenção às ${hourLabel}. Vejo ${bayLine} e ${pendingLine}. ${cycleLine} Amanhã, preserve só 1 missão crítica e encaixe 30 min de Tela de Descanso antes de reacelerar.`;
  }, [activeCycle, assets, bayAreaVisibleCount, cycleProgress, tasks]);

  const handleCommand = async (cmd: string): Promise<string | null> => {
    const lowerCmd = cmd.toLowerCase().trim();
    
    // Help Command
    if (lowerCmd === '?ajuda' || lowerCmd === '?help') {
        return "?? **Comandos do Oráculo**\n\nUse **?** para saber o que é algo.\nUse **!** para ver seus dados ou criar novos elementos.\n\nExemplos:\n• **?arenas** - O que são Arenas?\n• **!arenas** - Ver minhas Arenas\n• **!assets** - Ver Categorias (Assets)\n• **!criar-arena <nome> <id_categoria>** - Criar nova Arena\n• **!criar-acao <nome> <id_arena>** - Criar nova Ação\n\nExperimente também conversar naturalmente comigo!";
    }

    // Explanation Commands (?)
    if (lowerCmd === '?arenas') {
        return "??? **Sobre as Arenas**\n\nAs Arenas são os domínios da sua vida onde você busca maestria (ex: Saúde, Trabalho, Finanças). Cada Arena contém suas Ações e Missões.\n\nElas representam as áreas que você deseja evoluir no GLYPH. Você pode criar novas Arenas no Inventário.";
    }

    // List Commands (!)
    if (lowerCmd === '!arenas') {
        const arenaList = assets.flatMap(a => a.arenas.map(ar => ({ name: ar.name, id: ar.id, asset: a.name })));
        if (arenaList.length === 0) {
            return "?? **Suas Arenas**\n\nVocê ainda não possui Arenas ativas. Vá até o Inventário para criar sua primeira Arena.";
        }
        return `?? **Suas Arenas Ativas**\n\n${arenaList.map(a => `• **${a.name}** (ID: \`${a.id.slice(0,8)}\`) - Categoria: ${a.asset}`).join('\n')}`;
    }

    if (lowerCmd === '!assets') {
        if (assets.length === 0) return "Categorias não encontradas.";
        return `?? **Categorias Disponíveis (Assets)**\n\n${assets.map(a => `• **${a.name}** (ID: \`${a.id}\`)`).join('\n')}`;
    }

    // Creation Commands
    if (lowerCmd.startsWith('!criar-arena')) {
        const parts = cmd.split(' ');
        if (parts.length < 3) return "? Formato inválido. Use: `!criar-arena <nome> <id_categoria>`\nEx: `!criar-arena Corrida saude`";
        
        const name = parts[1];
        const assetId = parts[2].toLowerCase();
        
        // Find asset by ID or Name
        const targetAsset = assets.find(a => a.id.toLowerCase() === assetId || a.name.toLowerCase() === assetId);
        
        if (!targetAsset) return `? Categoria \`${assetId}\` não encontrada. Use \`!assets\` para ver as disponíveis.`;
        
        try {
            const newArena = await addArena(targetAsset.id, {
                name,
                description: "Criada via Oráculo",
                icon: "Sparkles",
            });
            return `? **Arena Criada!**\n\nNome: ${newArena.name}\nCategoria: ${targetAsset.name}\nID: \`${newArena.id.slice(0,8)}\``;
        } catch (e) {
            return "? Erro ao criar arena. Verifique os logs.";
        }
    }

    if (lowerCmd.startsWith('!criar-acao')) {
        const parts = cmd.split(' ');
        if (parts.length < 3) return "? Formato inválido. Use: `!criar-acao <nome> <id_arena>`\nEx: `!criar-acao Meditar <id_da_arena>`";
        
        const name = parts[1];
        const arenaIdPart = parts[2].toLowerCase();
        
        // Find arena by ID (partial or full) or Name
        const allArenas = assets.flatMap(a => a.arenas);
        const targetArena = allArenas.find(a => 
            a.id.toLowerCase().startsWith(arenaIdPart) || 
            a.name.toLowerCase() === arenaIdPart
        );
        
        if (!targetArena) return `? Arena \`${arenaIdPart}\` não encontrada. Use \`!arenas\` para ver as disponíveis.`;
        
        try {
            const newAction = await addAction({
                arenaId: targetArena.id,
                name,
                description: "Criada via Oráculo",
                icon: "Activity",
                duration: 30,
                repetitions: 1,
                actionType: 'Ação',
                difficulty: 'Média'
            });
            return `? **Ação Criada!**\n\nNome: ${newAction.name}\nArena: ${targetArena.name}\nID: \`${newAction.id.slice(0,8)}\``;
        } catch (e) {
            return "? Erro ao criar ação. Verifique os logs.";
        }
    }

    return null;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (input.startsWith('?') || input.startsWith('!')) {
        const commandResponse = await handleCommand(input);
        if (commandResponse) {
             setTimeout(() => {
                 setMessages(prev => [...prev, { role: 'assistant', content: commandResponse, timestamp: new Date() }]);
                 setIsLoading(false);
             }, 600);
             return;
        }
    }

    const recoveryFastPath = buildRecoveryFastPath(input);
    if (recoveryFastPath) {
      window.setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: recoveryFastPath,
          timestamp: new Date(),
          mode: currentMode,
        }]);
        setIsLoading(false);
      }, 850);
      return;
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (sessionError || !accessToken) {
        throw new Error('Sessao autenticada ausente para consultar o Oraculo.');
      }

      const { data, error } = await supabase.functions.invoke('oracle', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          systemPrompt,
          userPrompt: userMessage.content,
        }
      });

      if (error) {
        throw error;
      }

      const text = String(data?.text || '').trim();
      if (!text) {
        throw new Error('Oracle function returned empty content.');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: text,
        timestamp: new Date(),
        mode: currentMode,
      }]);
    } catch (error) {
      const parsedError = await parseOracleFunctionError(error);
      console.error('Oracle Error:', parsedError, error);

      let fallbackMessage = 'O Oraculo esta em silencio momentaneo. Tente novamente.';
      if (parsedError.status === 401) fallbackMessage = 'Sessao expirada no Oraculo. Entre novamente na conta e tente de novo.';
      if (parsedError.status === 403) fallbackMessage = 'Oraculo bloqueado para esta origem. Verifique o dominio liberado no Supabase.';
      if (parsedError.status === 500) fallbackMessage = 'Oraculo indisponivel: configuracao ausente no servidor.';
      if (parsedError.status === 502) fallbackMessage = 'Oraculo indisponivel no provedor de IA. Tente novamente em instantes.';

      setMessages(prev => [...prev, { role: 'assistant', content: fallbackMessage, timestamp: new Date() }]);
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

  const HeaderIcon = MODE_VISUALS[currentMode].icon || GameLogoIcon;
  
  // Custom header for Embedded mode (since default header might be hidden)
  // If isEmbedded is true, we render a smaller status bar inside the chat area if header is hidden
  const showStatusPill = isEmbedded || hideHeader;

  const content = (
      <>
        {/* Main Header (Only if NOT hidden) */}
        {!hideHeader && (
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${MODE_VISUALS[currentMode].border} ${MODE_VISUALS[currentMode].bg} shadow-lg`}>
               <HeaderIcon className={`w-6 h-6 ${MODE_VISUALS[currentMode].color}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--skin-accent-color)] tracking-wider">ORÁCULO</h3>
              <div className="flex flex-col">
                  <span className={`text-[10px] uppercase tracking-widest text-gray-400`}>{ORACLE_MODES[currentMode].name}</span>
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

        {/* Embedded Status Bar (If header is hidden) */}
        {showStatusPill && (
            <div className="flex-none px-4 py-2 bg-black/20 border-b border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)] animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Modo: <span className={`${MODE_VISUALS[currentMode].color}`}>{ORACLE_MODES[currentMode].name}</span>
                    </span>
                 </div>
                 {isEmbedded && (
                     <div className="flex items-center gap-1 text-[9px] text-gray-600">
                         <HeaderIcon className={`w-3 h-3 ${MODE_VISUALS[currentMode].color}`} />
                         <span>v2.0</span>
                     </div>
                 )}
            </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {messages.length === 0 && (
            <div className="flex min-h-full flex-col items-center justify-center p-6 text-center">
              <div className="mb-5 max-w-[300px] rounded-2xl rounded-tl-sm border border-amber-400/20 bg-amber-500/5 px-4 py-3 text-left text-[11px] italic leading-relaxed text-amber-100/75 shadow-inner">
                {firstConversationNotice}
              </div>
              <div className="opacity-50">
              <HeaderIcon className={`w-16 h-16 mb-4 ${MODE_VISUALS[currentMode].color} drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]`} />
              <p className="text-sm text-gray-400 font-bold">O Oráculo aguarda sua consulta, Soberano.</p>
              <p className="text-xs text-gray-600 mt-2 max-w-[200px]">Modo atual: {ORACLE_MODES[currentMode].description}</p>
              </div>
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
        <div className="p-4 border-t border-white/10 bg-black/40 flex-shrink-0">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Consulte o Oráculo..."
              disabled={isLoading}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[var(--skin-accent-color)]/50 focus:ring-1 focus:ring-[var(--skin-accent-color)]/20 transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-lg transition-colors text-[var(--skin-accent-color)]"
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





