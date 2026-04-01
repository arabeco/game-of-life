import { useEffect, useState } from 'react';
import {
  DEFAULT_LEGACY_PREVIEW_LAYOUT,
  getStoredLegacyPreviewLayoutConfig,
  LEGACY_PREVIEW_LAYOUT_UPDATED_EVENT,
  type LegacyPreviewLayoutConfig,
} from '../utils/legacyLayoutLab';

export const useLegacyPreviewLayoutConfig = (): LegacyPreviewLayoutConfig => {
  const [config, setConfig] = useState<LegacyPreviewLayoutConfig>(() => getStoredLegacyPreviewLayoutConfig());

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<LegacyPreviewLayoutConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
        return;
      }
      setConfig(getStoredLegacyPreviewLayoutConfig());
    };

    window.addEventListener(LEGACY_PREVIEW_LAYOUT_UPDATED_EVENT, handleUpdate as EventListener);
    return () => window.removeEventListener(LEGACY_PREVIEW_LAYOUT_UPDATED_EVENT, handleUpdate as EventListener);
  }, []);

  return config || DEFAULT_LEGACY_PREVIEW_LAYOUT;
};
