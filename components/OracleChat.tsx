import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { XIcon, SendIcon, SparklesIcon } from './Icons';
import { ORACLE_MODES } from '../constants/oracle';

// API Key from gateway.ts (hardcoded for now as per instructions)
const API_KEY = "AIzaSyAryjNyDFBRrwfvsHdQWvUTCRm1-yx83zo";

const google = createGoogleGenerativeAI({
  apiKey: API_KEY
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const OracleChat: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { userProfile, assets, actions, tasks, reports, activeCycle, oracleMode } = useGame();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build System Prompt based on Mode
  const systemPrompt = useMemo(() => {
    const config = ORACLE_MODES[oracleMode];
    return config.systemPromptTemplate({
      userProfile,
      assets,
      actions,
      tasks,
      reports,
      activeCycle
    });
  }, [oracleMode, userProfile, assets, actions, tasks, reports, activeCycle]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await streamText({
        model: google('models/gemini-3-flash-preview'),
        system: systemPrompt,
        messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
      });

      let fullResponse = '';
      const assistantMessage: Message = { role: 'assistant', content: '', timestamp: new Date() };
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 pointer-events-none">
      {/* Backdrop for mobile mostly, but let's keep it clickable through except the chat */}
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      
      <div className="pointer-events-auto w-full max-w-sm mt-16 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[80vh] animate-in slide-in-from-top-5 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-600/20 flex items-center justify-center border border-white/10">
               <SparklesIcon className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-200 tracking-wider">ORÁCULO</h3>
              <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">Conectado</span>
                  <span className="text-[10px] text-amber-500/50 uppercase tracking-widest">• {ORACLE_MODES[oracleMode].name}</span>
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-50">
              <SparklesIcon className="w-12 h-12 mb-4 text-gray-600" />
              <p className="text-sm text-gray-500">O Oráculo aguarda sua consulta, Soberano.</p>
              <p className="text-xs text-gray-600 mt-2 max-w-[200px]">Modo atual: {ORACLE_MODES[oracleMode].description}</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`
                  max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-white/10 text-white rounded-tr-sm border border-white/5' 
                    : 'bg-black/40 text-gray-300 rounded-tl-sm border border-white/5 shadow-inner'}
                `}
              >
                {msg.content}
              </div>
            </div>
          ))}
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
      </div>
    </div>
  );
};
