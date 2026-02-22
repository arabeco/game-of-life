import React, { useState } from 'react';
import { StoreTopBar } from '../components/Store/StoreTopBar';
import { GoldStore } from '../components/Store/GoldStore';
import { TheForge } from '../components/Store/TheForge';
import { CodexStore } from '../components/Store/CodexStore';

// --- Store Component ---

export const StoreView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'store' | 'forge' | 'codexes'>('store');
  
  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <StoreTopBar />

      {/* Navigation */}
      <div className="flex items-center justify-between px-2 overflow-x-auto">
        <div className="flex space-x-2 bg-black/30 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('store')}
                className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'store' ? 'bg-[var(--gold)]/20 text-[var(--gold)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
                OURO
            </button>
            <button 
                onClick={() => setActiveTab('forge')}
                className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'forge' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
                FORJA
            </button>
            <button 
                onClick={() => setActiveTab('codexes')}
                className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'codexes' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
                CODEXES
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
          {activeTab === 'store' && <GoldStore />}
          {activeTab === 'forge' && <TheForge />}
          {activeTab === 'codexes' && <CodexStore />}
      </div>
    </div>
  );
};
