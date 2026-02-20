import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from '../components/GlassCard';
import { SovereignEditorModal } from '../components/AvatarCustomizerModal';
import { CodexLibrary } from '../components/CodexLibrary';
import { Inventory } from '../components/Store/Inventory';

export const ArsenalView: React.FC = () => {
    const { updateUserProfile } = useGame();
    const [activeTab, setActiveTab] = useState<'inventory' | 'library'>('inventory');
    const [isSovereignEditorOpen, setSovereignEditorOpen] = useState(false);

    const handleSovereignSave = (newSovereignConfig: any) => {
        updateUserProfile({ sovereign: newSovereignConfig });
        setSovereignEditorOpen(false);
    };

    return (
        <div className="space-y-6 pb-20">
             {/* Navigation */}
            <div className="flex items-center justify-center px-2">
                <div className="flex space-x-2 bg-black/30 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('inventory')}
                        className={`px-6 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'inventory' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        INVENTÁRIO
                    </button>
                    <button 
                        onClick={() => setActiveTab('library')}
                        className={`px-6 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'library' ? 'bg-green-500/20 text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        BIBLIOTECA
                    </button>
                </div>
            </div>

            {activeTab === 'inventory' && (
                <div className="space-y-6 animate-fade-in">
                    <Inventory />
                </div>
            )}
            {activeTab === 'library' && <CodexLibrary />}

            {isSovereignEditorOpen && <SovereignEditorModal onClose={() => setSovereignEditorOpen(false)} onSave={handleSovereignSave} />}
        </div>
    );
};
