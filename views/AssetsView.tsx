import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Asset } from '../types';
import { AssetDossier } from '../components/AssetDossier';
import { Sephirot } from '../components/Sephirot';

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

const TreeLinesSVG: React.FC = () => (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 -z-10">
        <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{stopColor: '#2a211c', stopOpacity: 0.5}} />
                <stop offset="50%" style={{stopColor: '#2a211c', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: '#2a211c', stopOpacity: 0.5}} />
            </linearGradient>
        </defs>
        <line x1="50%" y1="7%" x2="50%" y2="93%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="16.66%" y1="21.5%" x2="16.66%" y2="64.5%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="83.33%" y1="21.5%" x2="83.33%" y2="64.5%" stroke="url(#lineGrad)" strokeWidth="1" />
        
        <line x1="16.66%" y1="21.5%" x2="83.33%" y2="21.5%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="16.66%" y1="35.5%" x2="83.33%" y2="35.5%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="16.66%" y1="64.5%" x2="83.33%" y2="64.5%" stroke="url(#lineGrad)" strokeWidth="1" />

        <line x1="16.66%" y1="21.5%" x2="50%" y2="49.5%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="83.33%" y1="21.5%" x2="50%" y2="49.5%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="16.66%" y1="35.5%" x2="50%" y2="49.5%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="83.33%" y1="35.5%" x2="50%" y2="49.5%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="16.66%" y1="64.5%" x2="50%" y2="78.5%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="83.33%" y1="64.5%" x2="50%" y2="78.5%" stroke="url(#lineGrad)" strokeWidth="1" />
    </svg>
);


export const AssetsView: React.FC = () => {
  const { assets } = useGame();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

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
    <div className="flex justify-center items-center h-full">
        <div className="relative w-full aspect-[9/16]">
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
            <TreeLinesSVG />
        </div>
    </div>
  );
};