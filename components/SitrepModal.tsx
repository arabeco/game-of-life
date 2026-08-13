
import React from 'react';
import { GlassCard } from './GlassCard';
import { XIcon, LightbulbIcon } from './Icons';
import { Portal } from './Portal';
import { SitrepContent } from './SitrepContent';

export const SitrepModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="dossier" className="w-full max-w-md m-4 rounded-3xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="relative flex items-center justify-center p-4 border-b border-white/10 shrink-0">
                        <div className="flex items-center space-x-2">
                            <LightbulbIcon className="w-6 h-6 accent-text" />
                            <h2 className="text-lg font-bold uppercase tracking-wider text-center">Resumo Diario</h2>
                        </div>
                        <button onClick={onClose} className="absolute right-4 p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                        <SitrepContent onClose={onClose} />
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
