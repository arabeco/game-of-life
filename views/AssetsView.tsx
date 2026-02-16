import React, { useState } from 'react';
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
  const { assets, userProfile } = useGame();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Get user skin color or default to GOLD
  const skinColor = SKINS_DATA.find(s => s.id === userProfile.skin)?.color || '#d4af37';

  // Prepare points with levels for the shader
  const fogPoints = SEPHIROT_COORDS.map(coord => {
      const asset = assets.find(a => a.id === coord.id);
      return {
          x: coord.x,
          y: coord.y,
          level: asset ? asset.level : 1 // Default level 1 if not found
      };
  });

  const handleSphereClick = (asset: Asset) => setSelectedAssetId(asset.id);
  const handleBack = () => setSelectedAssetId(null);
  
  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  if (selectedAsset) {
    return (
        <div className="px-4 h-full">
            <AssetDossier asset={selectedAsset} onBack={handleBack} />
        </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-full relative overflow-hidden bg-black">
        {/* Background Fog Shader */}
        <div className="absolute inset-0 z-0">
            <SephirotFog points={fogPoints} color={skinColor} />
        </div>
        
        <div className="relative w-full aspect-[9/16] z-10">
            <div className="grid grid-cols-3 grid-rows-7 w-full h-full">
                {assets.map(asset => {
                    const pos = assetPositions[asset.id];
                    if (!pos) return null;
                    return (
                        <div key={asset.id} style={{ gridRow: pos.row, gridColumn: pos.col }} className="flex items-center justify-center">
                            <Sephirot 
                                asset={asset} 
                                onClick={() => handleSphereClick(asset)} 
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    </div>
  );
};