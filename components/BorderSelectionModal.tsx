import React from 'react';
import { GlassCard } from './GlassCard';
import { SKINS_DATA, BORDERS_DATA } from '../constants';
import { Skin } from '../types';

interface BorderSelectionModalProps {
    currentBorder: string;
    onClose: () => void;
    onSelect: (borderId: string) => void;
}

export const BorderSelectionModal: React.FC<BorderSelectionModalProps> = ({ currentBorder, onClose, onSelect }) => {
    const allBorders = [
        { id: 'default', name: 'Padrão', color: 'var(--skin-accent-color)' }, 
        ...SKINS_DATA, 
        ...BORDERS_DATA
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-center">Selecionar Borda</h2>
                <div className="grid grid-cols-3 gap-4 p-4">
                    {allBorders.map(border => (
                        <div key={border.id} className="text-center space-y-2">
                            <button 
                                onClick={() => onSelect(border.id)}
                                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${currentBorder === border.id ? 'ring-4 ring-offset-2 ring-offset-gray-800' : ''}`}
                                style={
                                    border.imageUrl
                                    ? {
                                        border: '4px solid transparent', // Fallback for image border
                                        backgroundImage: `url(${border.imageUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        '--tw-ring-color': border.color,
                                    } as React.CSSProperties
                                    : {
                                        borderColor: border.color,
                                        borderWidth: '8px',
                                        '--tw-ring-color': border.color,
                                    } as React.CSSProperties
                                }
                            >
                            </button>
                            <p className="text-xs font-semibold">{border.name}</p>
                        </div>
                    ))}
                </div>
                 <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-primary">
                    FECHAR
                </button>
            </GlassCard>
        </div>
    );
};