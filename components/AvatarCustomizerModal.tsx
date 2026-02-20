import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { DEFAULT_SOVEREIGN_CONFIG } from '../constants/avatar';
import { SovereignConfig } from '../types';
import { GlassCard } from './GlassCard';
import { CanvasAvatar } from './CanvasAvatar';
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon, EditIcon, EyeIcon } from './Icons';
import { SOVEREIGN_ASSETS } from '../constants/avatar';
import { ITEMS_DB } from '../constants/items';
import { ItemDetailModal } from './ItemDetailModal';

interface SovereignEditorModalProps {
    onClose: () => void;
    onSave: (newConfig: SovereignConfig) => void;
}

type Category = 'Corpo' | 'Cabelo' | 'Roupa' | 'Artefato';
type EditorTab = 'sovereign' | 'glyph';

const ColorPalette: React.FC<{ colors: readonly string[]; selectedColor: string; onSelect: (color: string) => void; }> = ({ colors, selectedColor, onSelect }) => (
    <div className="grid grid-cols-7 gap-2">
        {colors.map(color => (
            <button
                key={color}
                onClick={() => onSelect(color)}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
            />
        ))}
    </div>
);

export const SovereignEditorModal: React.FC<SovereignEditorModalProps> = ({ onClose, onSave }) => {
    const { userProfile, inventory } = useGame();
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [activeTab, setActiveTab] = useState<EditorTab>('sovereign');
    const [selectedItemForDetail, setSelectedItemForDetail] = useState<{ id: string; category: string } | null>(null);
    
    // Sovereign State
    const [activeCategory, setActiveCategory] = useState<Category>('Corpo');
    const [tempSovereign, setTempSovereign] = useState<SovereignConfig>(() => {
        const baseConfig = userProfile.sovereign || DEFAULT_SOVEREIGN_CONFIG;
        const oldAccessory = (baseConfig as any).accessory;

        const newConfig: SovereignConfig = {
            ...DEFAULT_SOVEREIGN_CONFIG,
            ...baseConfig,
            primaryDisplay: baseConfig.primaryDisplay || 'sovereign'
        };

        if (oldAccessory && oldAccessory !== 'none') {
            if (['glasses', 'eyepatch'].includes(oldAccessory) && newConfig.head_under === 'none') {
                 newConfig.head_under = oldAccessory;
            }
        }
        delete (newConfig as any).accessory;
        return newConfig;
    });

    const categories: Category[] = ['Corpo', 'Cabelo', 'Roupa', 'Artefato'];
    const isGM = userProfile?.role === 'admin' || userProfile?.role === 'gm';

    // Helper to get owned items for a category
    const getOwnedItems = (category: string) => {
        const ownedIds = new Set<string>();
        
        if (isGM) {
            return ITEMS_DB.filter(i => i.category === category);
        }

        inventory.forEach(inst => {
            if (inst.id) ownedIds.add(inst.id);
        });
        
        return ITEMS_DB.filter(i => i.category === category && (ownedIds.has(i.id) || i.tier === 1));
    };

    const handleNextCategory = () => {
        const idx = categories.indexOf(activeCategory);
        const nextIdx = (idx + 1) % categories.length;
        setActiveCategory(categories[nextIdx]);
    };

    const handlePrevCategory = () => {
        const idx = categories.indexOf(activeCategory);
        const prevIdx = (idx - 1 + categories.length) % categories.length;
        setActiveCategory(categories[prevIdx]);
    };

    const createCycleHandler = (assetKey: keyof typeof SOVEREIGN_ASSETS, currentId: string, direction: number) => {
        const assets = SOVEREIGN_ASSETS[assetKey];
        if (!assets) return;

        // Handle color arrays
        if (assetKey === 'skinTones' || assetKey === 'hairColors') {
             const colorAssets = assets as readonly string[];
             const currentIndex = colorAssets.indexOf(currentId);
             let nextIndex = currentIndex + direction;
             if (nextIndex < 0) nextIndex = colorAssets.length - 1;
             if (nextIndex >= colorAssets.length) nextIndex = 0;
             const nextColor = colorAssets[nextIndex];

             if (assetKey === 'skinTones') setTempSovereign(p => ({ ...p, skinTone: nextColor }));
             if (assetKey === 'hairColors') setTempSovereign(p => ({ ...p, hairColor: nextColor }));
             return;
        }

        // Handle object arrays
        const itemAssets = assets as { id: string }[];
        const currentIndex = itemAssets.findIndex(a => a.id === currentId);
        let nextIndex = currentIndex + direction;
        if (nextIndex < 0) nextIndex = itemAssets.length - 1;
        if (nextIndex >= itemAssets.length) nextIndex = 0;
        const nextId = itemAssets[nextIndex].id;

        if (assetKey === 'bodyStyles') setTempSovereign(p => ({ ...p, body: nextId }));
    };

    const renderItemGrid = (category: string, currentId: string, onSelect: (id: string) => void) => {
        const items = getOwnedItems(category);
        
        if (items.length === 0) return <div className="text-center text-gray-500 py-4 text-xs">Nenhum item encontrado.</div>;

        return (
            <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700">
                {items.map(item => {
                    const isSelected = currentId === item.id;
                    const tierColor = item.tier === 5 ? 'bg-yellow-500 shadow-[0_0_4px_rgba(234,179,8,0.5)]' : 
                                      item.tier === 4 ? 'bg-purple-500' :
                                      item.tier === 3 ? 'bg-blue-500' :
                                      item.tier === 2 ? 'bg-green-500' : 'bg-gray-600';
                    
                    return (
                        <div key={item.id} className="relative group">
                            <button
                                onClick={() => onSelect(item.id)}
                                className={`relative w-full aspect-square rounded-md border flex flex-col items-center justify-center bg-black/40 transition-all ${isSelected ? 'border-white bg-white/10' : 'border-white/10 hover:bg-white/5'}`}
                            >
                                <div className="flex items-center justify-center w-full h-full overflow-hidden rounded-md">
                                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-contain"/> : <span className="text-2xl">{item.icon}</span>}
                                </div>
                                
                                {isSelected && (
                                    <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center shadow-sm z-10">
                                        <CheckIcon className="w-2 h-2 text-white" />
                                    </div>
                                )}

                                {/* Discrete Rarity Indicator */}
                                <div className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${tierColor}`} />
                            </button>
                            
                            {/* Info Button - Opens Detail Modal */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItemForDetail({ id: item.id, category });
                                }}
                                className="absolute top-1 left-1 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white/70 hover:text-white transition-colors z-20 opacity-0 group-hover:opacity-100"
                                title="Ver Detalhes"
                            >
                                <EyeIcon className="w-3 h-3" />
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderOptions = () => {
        switch (activeCategory) {
            case 'Corpo':
                const currentBody = SOVEREIGN_ASSETS.bodyStyles.find(b => b.id === tempSovereign.body)?.name || 'N/A';
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg">
                            <span className="text-xs font-semibold text-gray-400">Modelo</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => createCycleHandler('bodyStyles', tempSovereign.body, -1)} className="p-1 hover:bg-white/10 rounded"><ChevronLeftIcon className="w-4 h-4" /></button>
                                <span className="text-xs font-bold w-24 text-center truncate">{currentBody}</span>
                                <button onClick={() => createCycleHandler('bodyStyles', tempSovereign.body, 1)} className="p-1 hover:bg-white/10 rounded"><ChevronRightIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-400 mb-2 block">Tom de Pele</label>
                            <ColorPalette colors={SOVEREIGN_ASSETS.skinTones} selectedColor={tempSovereign.skinTone} onSelect={color => setTempSovereign(p => ({ ...p, skinTone: color }))} />
                        </div>
                    </div>
                );
            case 'Cabelo':
                return (
                    <div className="space-y-4">
                         <div>
                            <label className="text-xs font-semibold text-gray-400 mb-2 block">Estilo</label>
                            {renderItemGrid('hair', tempSovereign.hairStyle, (id) => setTempSovereign(p => ({ ...p, hairStyle: id })))}
                         </div>
                         <div>
                            <label className="text-xs font-semibold text-gray-400 mt-2 block">Cor</label>
                            <ColorPalette colors={SOVEREIGN_ASSETS.hairColors} selectedColor={tempSovereign.hairColor} onSelect={color => setTempSovereign(p => ({ ...p, hairColor: color }))} />
                         </div>
                    </div>
                );
            case 'Roupa':
                return (
                    <div className="space-y-4">
                        <label className="text-xs font-semibold text-gray-400 mb-2 block">Traje</label>
                        {renderItemGrid('skin', tempSovereign.outfit, (id) => setTempSovereign(p => ({ ...p, outfit: id })))}
                    </div>
                );
            case 'Artefato':
                return (
                    <div className="space-y-4">
                        <label className="text-xs font-semibold text-gray-400 mb-2 block">Artefato de Mão</label>
                        <div className="grid grid-cols-5 gap-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700">
                            {SOVEREIGN_ASSETS.artifacts.map(item => {
                                const isSelected = tempSovereign.artifact === item.id;
                                const tierColor = item.rarity === 'legendary' ? 'bg-yellow-500 shadow-[0_0_4px_rgba(234,179,8,0.5)]' : 
                                                  item.rarity === 'epic' ? 'bg-purple-500' :
                                                  item.rarity === 'rare' ? 'bg-blue-500' :
                                                  item.rarity === 'uncommon' ? 'bg-green-500' : 'bg-gray-600';
                                
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setTempSovereign(p => ({ ...p, artifact: item.id }))}
                                        className={`relative aspect-square rounded-md border flex flex-col items-center justify-center bg-black/40 transition-all ${isSelected ? 'border-white bg-white/10' : 'border-white/10 hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center justify-center w-full h-full p-1">
                                            {item.url ? <img src={item.url} alt={item.name} className="w-full h-full object-contain"/> : <span className="text-xs text-gray-500">N/A</span>}
                                        </div>
                                        
                                        {isSelected && (
                                            <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                                <CheckIcon className="w-2 h-2 text-white" />
                                            </div>
                                        )}

                                        <div className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${tierColor}`} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderSovereignPreview = () => {
        const equippedArtifact = SOVEREIGN_ASSETS.artifacts?.find(a => a.id === tempSovereign.artifact);
        const equippedGlyph = SOVEREIGN_ASSETS.glyphs?.find(g => g.id === tempSovereign.glyph);
        const primary = tempSovereign.primaryDisplay || 'sovereign';

        const setPrimary = (type: 'sovereign' | 'item' | 'glyph') => {
            setTempSovereign(p => ({ ...p, primaryDisplay: type }));
            
            if (mode === 'edit') {
                if (type === 'sovereign') {
                    setActiveTab('sovereign');
                    if (activeCategory === 'Artefato') setActiveCategory('Corpo');
                } else if (type === 'item') {
                    setActiveTab('sovereign');
                    setActiveCategory('Artefato');
                } else if (type === 'glyph') {
                    setActiveTab('glyph');
                }
            }
        };

        return (
            <div className="flex gap-4 items-stretch justify-center my-4 w-full px-2 flex-shrink-0">
                {/* 1. Avatar (Left, Tall) - Clean, no artifact/glyph */}
                <div 
                    onClick={() => setPrimary('sovereign')}
                    className={`relative w-40 h-64 dossier-bg border-2 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg cursor-pointer transition-all hover:border-white/30`}
                    style={{
                        borderColor: primary === 'sovereign' ? 'var(--skin-accent-color)' : (primary === 'sovereign' ? undefined : '#4a3a11'),
                        boxShadow: primary === 'sovereign' ? '0 0 15px var(--skin-accent-color)' : undefined
                    }}
                >
                    <CanvasAvatar 
                        sovereignConfig={{ ...tempSovereign, artifact: 'none', glyph: 'none' }} 
                        width={300} 
                        height={300} 
                        className="w-full h-full object-contain"
                    />
                    
                    {/* Selection Indicator */}
                    <div 
                        className={`absolute top-2 right-2 w-4 h-4 rounded-full border border-black/50 flex items-center justify-center transition-colors`}
                        style={{ backgroundColor: primary === 'sovereign' ? 'var(--skin-accent-color)' : 'rgba(0,0,0,0.4)' }}
                    >
                        {primary === 'sovereign' && <CheckIcon className="w-3 h-3 text-black" />}
                    </div>
                </div>

                {/* 2. Right Column (Item & Glyph) */}
                <div className="flex flex-col justify-between w-28 h-64">
                    {/* Item (Top) */}
                    <div 
                        onClick={() => setPrimary('item')}
                        className={`relative h-28 bg-black/40 border-2 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:border-white/30`}
                        style={{
                            borderColor: primary === 'item' ? 'var(--skin-accent-color)' : 'rgba(255,255,255,0.1)',
                            boxShadow: primary === 'item' ? '0 0 15px var(--skin-accent-color)' : undefined
                        }}
                    >
                         {equippedArtifact?.url ? (
                            <img src={equippedArtifact.url} alt="Artifact" className="w-16 h-16 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                         ) : (
                             <span className="text-[10px] text-gray-600 font-bold uppercase">Vazio</span>
                         )}
                         
                        <div 
                            className={`absolute top-2 right-2 w-4 h-4 rounded-full border border-black/50 flex items-center justify-center transition-colors`}
                            style={{ backgroundColor: primary === 'item' ? 'var(--skin-accent-color)' : 'rgba(0,0,0,0.4)' }}
                        >
                            {primary === 'item' && <CheckIcon className="w-3 h-3 text-black" />}
                        </div>
                    </div>

                    {/* Glyph (Bottom) */}
                    <div 
                        onClick={() => setPrimary('glyph')}
                        className={`relative h-28 bg-black/40 border-2 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:border-white/30`}
                        style={{
                            borderColor: primary === 'glyph' ? 'var(--skin-accent-color)' : 'rgba(255,255,255,0.1)',
                            boxShadow: primary === 'glyph' ? '0 0 15px var(--skin-accent-color)' : undefined
                        }}
                    >
                        {equippedGlyph?.url ? (
                            <img src={equippedGlyph.url} alt="Glyph" className="w-16 h-16 object-contain p-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                        ) : (
                            <span className="text-2xl opacity-20">💠</span>
                        )}
                        
                        <div 
                            className={`absolute top-2 right-2 w-4 h-4 rounded-full border border-black/50 flex items-center justify-center transition-colors`}
                            style={{ backgroundColor: primary === 'glyph' ? 'var(--skin-accent-color)' : 'rgba(0,0,0,0.4)' }}
                        >
                            {primary === 'glyph' && <CheckIcon className="w-3 h-3 text-black" />}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 rounded-3xl flex flex-col max-h-[90vh] overflow-hidden border-2" onClick={e => e.stopPropagation()} style={{ borderColor: 'var(--skin-accent-color)' }}>
                
                {selectedItemForDetail && (
                    <ItemDetailModal 
                        item={ITEMS_DB.find(i => i.id === selectedItemForDetail.id) || { id: selectedItemForDetail.id, name: 'Item', category: selectedItemForDetail.category as any, tier: 1, rarity: 'common' }}
                        type={selectedItemForDetail.category}
                        onClose={() => setSelectedItemForDetail(null)}
                    />
                )}

                {mode === 'view' ? (
                    <>
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative p-4 flex flex-col items-center">
                            <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-2">Seu Soberano</h2>
                            
                            {renderSovereignPreview()}

                            <p className="text-[10px] text-gray-500 text-center mt-2 px-8">
                                Clique em uma das molduras acima para escolher qual será exibida no seu perfil.
                            </p>
                        </div>

                        <div className="flex space-x-2 p-4 pt-2 border-t border-white/5 bg-black/20 backdrop-blur-sm flex-shrink-0 z-10">
                            <button onClick={onClose} className="flex-1 py-3 rounded-xl luxe-button-secondary text-xs font-bold">
                                FECHAR
                            </button>
                            <button onClick={() => setMode('edit')} className="flex-1 py-3 rounded-xl luxe-skin-button text-xs font-bold flex items-center justify-center gap-2">
                                <EditIcon className="w-4 h-4" />
                                EDITAR
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                         {/* Preview Area (Always Visible) */}
                        <div className="bg-black/20 pb-2 border-b border-white/5 flex-shrink-0">
                            {renderSovereignPreview()}
                            <p className="text-[10px] text-gray-500 text-center -mt-2 mb-2">
                                Clique na moldura para editar
                            </p>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                            {activeTab === 'glyph' ? (
                                <div className="p-4 space-y-4 h-full flex flex-col">
                                    <div className="flex items-center justify-between px-2 mb-4 border-b border-white/10 pb-2">
                                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Selecione seu Glifo</h3>
                                        <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded">
                                            {SOVEREIGN_ASSETS.glyphs?.find(g => g.id === tempSovereign.glyph)?.name || 'Nenhum'}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700 pb-4">
                                        {SOVEREIGN_ASSETS.glyphs?.map(glyph => (
                                            <button
                                                key={glyph.id}
                                                onClick={() => setTempSovereign(p => ({ ...p, glyph: glyph.id }))}
                                                className={`relative aspect-square rounded-xl border-2 flex items-center justify-center bg-black/40 transition-all group ${tempSovereign.glyph === glyph.id ? 'border-cyan-500 bg-cyan-900/20 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-white/10 hover:border-cyan-500/50'}`}
                                            >
                                                <img src={glyph.url} alt={glyph.name} className="w-3/4 h-3/4 object-contain drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] group-hover:scale-110 transition-transform" />
                                                
                                                {tempSovereign.glyph === glyph.id && (
                                                    <div className="absolute top-1 right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center shadow-sm">
                                                        <CheckIcon className="w-3 h-3 text-black" />
                                                    </div>
                                                )}
                                                <span className="absolute bottom-1 text-[8px] text-cyan-200/70 font-bold uppercase tracking-wider">{glyph.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 space-y-6">
                                    {/* Category Navigation */}
                                    <div className="flex items-center justify-between bg-black/40 rounded-xl p-2 border border-white/5">
                                        <button onClick={handlePrevCategory} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeftIcon className="w-5 h-5 text-gray-400" /></button>
                                        <span className="text-sm font-bold uppercase tracking-widest text-[var(--skin-accent-color)]">{activeCategory}</span>
                                        <button onClick={handleNextCategory} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronRightIcon className="w-5 h-5 text-gray-400" /></button>
                                    </div>

                                    {/* Options Grid */}
                                    <div className="min-h-[200px]">
                                        {renderOptions()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-sm flex justify-between items-center gap-4 flex-shrink-0 z-10">
                            <button onClick={() => setMode('view')} className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-colors">
                                VOLTAR
                            </button>
                            <button 
                                onClick={() => onSave(tempSovereign)}
                                className="flex-1 py-3 bg-[var(--skin-accent-color)] text-black rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(192,160,77,0.4)] flex items-center justify-center gap-2"
                            >
                                <CheckIcon className="w-4 h-4" />
                                Salvar Alterações
                            </button>
                        </div>
                    </>
                )}
            </GlassCard>
        </div>
    );
};
