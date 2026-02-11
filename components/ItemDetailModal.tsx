import React from 'react';
import { GlassCard } from './GlassCard';
import { XIcon } from './Icons';

interface ItemDetailModalProps {
    item: { name: string; url?: string; imageUrl?: string; color?: string };
    type: string;
    onClose: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, type, onClose }) => {
    const imageUrl = item.url || item.imageUrl;

    const handleAction = (action: string) => {
        alert(`${action} não implementado.`);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold uppercase tracking-wider">{item.name}</h2>
                    <p className="text-sm font-semibold text-gray-400">{type}</p>
                </div>
                
                <div className="aspect-square w-full bg-black/20 rounded-xl flex items-center justify-center p-4">
                    {imageUrl ? (
                        <img src={imageUrl} alt={item.name} className="max-w-full max-h-full object-contain" />
                    ) : item.color ? (
                        <div className="w-3/4 h-3/4 rounded-full" style={{ backgroundColor: item.color }} />
                    ) : (
                        <span className="text-6xl">?</span>
                    )}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleAction('Doar')} className="py-2 rounded-xl luxe-button-secondary text-sm">Doar</button>
                    <button onClick={() => handleAction('Excluir')} className="py-2 rounded-xl bg-red-800/50 text-red-300 hover:bg-red-800/80 text-sm">Excluir</button>
                    <button onClick={onClose} className="py-2 rounded-xl luxe-button-primary text-sm">OK</button>
                </div>
            </GlassCard>
        </div>
    );
};