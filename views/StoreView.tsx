import React, { useState } from 'react';
import { StoreTopBar, type StoreTab } from '../components/Store/StoreTopBar';
import { GoldStore } from '../components/Store/GoldStore';
import { TheForge } from '../components/Store/TheForge';
import { CodexStore } from '../components/Store/CodexStore';
import { ItemsStore } from '../components/Store/ItemsStore';
import { useGame } from '../contexts/GameContext';
import { SCREEN_INTRO_TIP_CONTEXT_EVENT, type ScreenIntroTipId } from '../utils/screenIntroTips';

export const StoreView: React.FC = () => {
  const { appMode } = useGame();
  const [activeTab, setActiveTab] = useState<StoreTab>('codexes');
  const [scrollRequest, setScrollRequest] = useState<{ section: string; nonce: number } | null>(null);
  const allowedTabs = appMode === 'BASIC'
    ? (['codexes', 'store'] as const)
    : (['codexes', 'items', 'forge', 'store'] as const);

  const sanitizeTab = React.useCallback((tab?: StoreTab | null): StoreTab => {
    if (!tab || !allowedTabs.includes(tab)) {
      return 'codexes';
    }
    return tab;
  }, [allowedTabs]);

  React.useEffect(() => {
    const safeTab = sanitizeTab(activeTab);
    if (safeTab !== activeTab) {
      setActiveTab(safeTab);
    }
  }, [activeTab, sanitizeTab]);

  React.useEffect(() => {
    const tipId: ScreenIntroTipId =
      activeTab === 'forge'
        ? 'store_forge'
        : activeTab === 'items'
          ? 'store_items'
          : activeTab === 'codexes'
            ? 'store_codexes'
            : 'store_gold';

    window.dispatchEvent(new CustomEvent(SCREEN_INTRO_TIP_CONTEXT_EVENT, {
      detail: { tipId },
    }));
  }, [activeTab]);

  React.useEffect(() => {
    const handleStoreViewRequest = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: StoreTab; section?: string | null }>).detail || {};
      if (detail.tab) {
        setActiveTab(sanitizeTab(detail.tab));
      }
      if (detail.section) {
        setScrollRequest({ section: detail.section, nonce: Date.now() });
      }
    };

    window.addEventListener('store-view-request', handleStoreViewRequest);
    return () => window.removeEventListener('store-view-request', handleStoreViewRequest);
  }, []);

  return (
    <div className="store-view-root space-y-4 pb-20 animate-fade-in">
      <StoreTopBar activeTab={activeTab} onTabChange={(tab) => setActiveTab(sanitizeTab(tab))} />

      <div className="min-h-[500px]">
          {activeTab === 'store' && <GoldStore scrollRequest={scrollRequest} />}
          {activeTab === 'forge' && <TheForge />}
          {activeTab === 'codexes' && <CodexStore />}
          {activeTab === 'items' && <ItemsStore />}
      </div>
    </div>
  );
};
