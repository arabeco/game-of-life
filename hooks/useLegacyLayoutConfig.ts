import { useEffect, useState } from 'react';
import {
  DEFAULT_LEGACY_LAYOUT,
  getStoredLegacyLayoutConfig,
  LEGACY_LAYOUT_UPDATED_EVENT,
  type LegacyLayoutConfig,
} from '../utils/legacyLayoutLab';

export const useLegacyLayoutConfig = (): LegacyLayoutConfig => {
  const [config, setConfig] = useState<LegacyLayoutConfig>(() => getStoredLegacyLayoutConfig());

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<LegacyLayoutConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
        return;
      }
      setConfig(getStoredLegacyLayoutConfig());
    };

    window.addEventListener(LEGACY_LAYOUT_UPDATED_EVENT, handleUpdate as EventListener);
    return () => window.removeEventListener(LEGACY_LAYOUT_UPDATED_EVENT, handleUpdate as EventListener);
  }, []);

  return config || DEFAULT_LEGACY_LAYOUT;
};
