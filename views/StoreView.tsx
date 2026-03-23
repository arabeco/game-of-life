import React, { useState } from 'react';
import { StoreTopBar } from '../components/Store/StoreTopBar';
import { GoldStore } from '../components/Store/GoldStore';
import { TheForge } from '../components/Store/TheForge';
import { CodexStore } from '../components/Store/CodexStore';
import { ItemsStore } from '../components/Store/ItemsStore';

export const StoreView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'store' | 'forge' | 'codexes' | 'items'>('store');
  const [scrollRequest, setScrollRequest] = useState<{ section: string; nonce: number } | null>(null);

  React.useEffect(() => {
    const handleStoreViewRequest = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: 'store' | 'forge' | 'codexes' | 'items'; section?: string | null }>).detail || {};
      if (detail.tab) {
        setActiveTab(detail.tab);
      }
      if (detail.section) {
        setScrollRequest({ section: detail.section, nonce: Date.now() });
      }
    };

    window.addEventListener('store-view-request', handleStoreViewRequest);
    return () => window.removeEventListener('store-view-request', handleStoreViewRequest);
  }, []);

  return (
    <div className="store-view-root space-y-6 pb-20 animate-fade-in">
      <StoreTopBar />

      <div className="flex items-center justify-between overflow-x-auto px-2">
        <div className="store-subtab-strip flex space-x-2 rounded-xl bg-black/30 p-1.5">
            <button
              onClick={() => setActiveTab('store')}
              className={`store-subtab-button min-w-[3rem] rounded-xl px-3 py-2 text-xs font-bold transition-all ${activeTab === 'store' ? 'luxe-skin-button store-subtab-button-active' : 'luxe-button-secondary store-subtab-button-inactive'}`}
              aria-label="Ouro"
              title="Ouro"
            >
              <span className="text-[14px] leading-none">🪙</span>
            </button>
            <button onClick={() => setActiveTab('forge')} className={`store-subtab-button rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'forge' ? 'luxe-skin-button store-subtab-button-active' : 'luxe-button-secondary store-subtab-button-inactive'}`}>
                FORJA
            </button>
            <button onClick={() => setActiveTab('codexes')} className={`store-subtab-button rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'codexes' ? 'luxe-skin-button store-subtab-button-active' : 'luxe-button-secondary store-subtab-button-inactive'}`}>
                CAMPANHAS
            </button>
            <button onClick={() => setActiveTab('items')} className={`store-subtab-button rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'items' ? 'luxe-skin-button store-subtab-button-active' : 'luxe-button-secondary store-subtab-button-inactive'}`}>
                ITEMS
            </button>
        </div>
      </div>

      <div className="min-h-[500px]">
          {activeTab === 'store' && <GoldStore scrollRequest={scrollRequest} />}
          {activeTab === 'forge' && <TheForge />}
          {activeTab === 'codexes' && <CodexStore />}
          {activeTab === 'items' && <ItemsStore />}
      </div>
    </div>
  );
};
