import React, { useLayoutEffect, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Asset } from '../types';
import { AssetDossier } from '../components/AssetDossier';
import { Sephirot } from '../components/Sephirot';
import { SKINS_DATA } from '../constants';
import { SephirotFog } from '../components/SephirotFog';

const assetPositions: Record<string, { row: number; col: number }> = {
  consciencia: { row: 1, col: 2 },
  'espaco-mental': { row: 2, col: 1 },
  espiritualidade: { row: 2, col: 3 },
  proposito: { row: 3, col: 1 },
  projetos: { row: 3, col: 3 },
  conexoes: { row: 4, col: 2 },
  trabalho: { row: 5, col: 1 },
  financas: { row: 5, col: 3 },
  hobbies: { row: 6, col: 2 },
  fisico: { row: 7, col: 2 },
};

// Sephirot coordinates for the Fog Shader (0-100 scale)
// ID is used to map asset levels
const SEPHIROT_COORDS = [
    { id: 'consciencia', x: 50, y: 7 },      // Keter
    { id: 'espaco-mental', x: 16.66, y: 21.5 }, // Binah
    { id: 'espiritualidade', x: 83.33, y: 21.5 }, // Chokmah
    { id: 'proposito', x: 16.66, y: 35.5 }, // Gevurah
    { id: 'projetos', x: 83.33, y: 35.5 }, // Chesed
    { id: 'conexoes', x: 50, y: 49.5 },    // Tiphereth
    { id: 'trabalho', x: 16.66, y: 64.5 }, // Hod
    { id: 'financas', x: 83.33, y: 64.5 }, // Netzach
    { id: 'hobbies', x: 50, y: 78.5 },    // Yesod
    { id: 'fisico', x: 50, y: 93 }       // Malkuth
];

export const AssetsView: React.FC = () => {
  const { assets, userProfile, appMode, clan } = useGame();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  const isBasicMode = appMode === 'BASIC';
  const isBasicSkin = userProfile.skin === 'BASIC' || userProfile.skin === 'default' || !userProfile.skin;
  const showWhiteSmoke = isBasicMode || isBasicSkin;

  // Get user skin color or default to GOLD
  const skinColor = SKINS_DATA.find(s => s.id === userProfile.skin)?.color || '#d4af37';
  
  // Use white color and office mode for BASIC mode or BASIC skin
  const finalSmokeColor = showWhiteSmoke ? '#ffffff' : skinColor;
  const finalSmokeMode = showWhiteSmoke ? 'office' : 'sephirot';

  // Prepare points with levels for the shader
  const baseAspect = 9 / 16;
  const containerAspect = containerSize.width > 0 && containerSize.height > 0
      ? containerSize.width / containerSize.height
      : baseAspect;
  const stretchY = containerAspect < baseAspect ? baseAspect / containerAspect : 1;
  const layoutCoords = SEPHIROT_COORDS.map(coord => {
      const yNorm = coord.y / 100;
      const yStretched = Math.min(1, Math.max(0, (yNorm - 0.5) * stretchY + 0.5));
      return {
          id: coord.id,
          x: coord.x,
          y: yStretched * 100
      };
  });
  const assetById = new Map<string, Asset>(assets.map(asset => [asset.id, asset]));
  const fogPoints = layoutCoords.map(coord => {
      const asset = assetById.get(coord.id);
      return {
          x: coord.x,
          y: coord.y,
          level: asset ? asset.level : 1
      };
  });

  const handleSphereClick = (asset: Asset) => setSelectedAssetId(asset.id);
  const handleBack = () => setSelectedAssetId(null);
  
  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  useLayoutEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const updateSize = () => {
          const rect = container.getBoundingClientRect();
          setContainerSize({ width: rect.width, height: rect.height });
      };

      updateSize();

      if (typeof ResizeObserver !== 'undefined') {
          const observer = new ResizeObserver(() => updateSize());
          observer.observe(container);
          return () => observer.disconnect();
      }

      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (selectedAsset) {
    return (
        <div className="px-4 h-full">
            <AssetDossier asset={selectedAsset} onBack={handleBack} />
        </div>
    );
  }

  return (
    <div
        ref={containerRef}
        className="flex justify-center items-center h-full relative bg-black"
        style={{ height: 'calc(100vh - 80px - var(--safe-area-top) - 64px - var(--safe-area-bottom))' }}
    >
        {/* Background Fog Shader */}
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-black" />
            <SephirotFog 
                points={fogPoints} 
                color={finalSmokeColor} 
                mode={finalSmokeMode}
            />
        </div>
        
        <div className="relative z-10 w-full h-full">
            <div id="assets-grid" className="relative w-full h-full">
                {layoutCoords.map(coord => {
                    const asset = assetById.get(coord.id);
                    if (!asset) return null;
                    return (
                        <div key={asset.id} className="absolute flex items-center justify-center" style={{ left: `${coord.x}%`, top: `${coord.y}%`, transform: 'translate(-50%, -50%)' }}>
                            <Sephirot 
                                asset={asset} 
                                onClick={() => handleSphereClick(asset)} 
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};
