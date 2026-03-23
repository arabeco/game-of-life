import { useEffect, useState } from 'react';
import {
  ASSET_OVERVIEW_LAYOUT_UPDATED_EVENT,
  DEFAULT_ASSET_OVERVIEW_LAYOUT,
  getStoredAssetOverviewLayoutConfig,
  type AssetOverviewLayoutConfig,
} from '../utils/assetsOverviewLayoutLab';

export const useAssetsOverviewLayoutConfig = (): AssetOverviewLayoutConfig => {
  const [config, setConfig] = useState<AssetOverviewLayoutConfig>(() => getStoredAssetOverviewLayoutConfig());

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<AssetOverviewLayoutConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
        return;
      }
      setConfig(getStoredAssetOverviewLayoutConfig());
    };

    window.addEventListener(ASSET_OVERVIEW_LAYOUT_UPDATED_EVENT, handleUpdate as EventListener);
    return () => window.removeEventListener(ASSET_OVERVIEW_LAYOUT_UPDATED_EVENT, handleUpdate as EventListener);
  }, []);

  return config || DEFAULT_ASSET_OVERVIEW_LAYOUT;
};
