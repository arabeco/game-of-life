import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { SovereignConfig, UnlockCategory, UserUnlocks } from '../types';
import { SOVEREIGN_ASSETS, DEFAULT_SOVEREIGN_CONFIG } from '../constants/avatar';
import { BODY_DB, HAIR_DB } from '../constants/skins';
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon, EditIcon, XIcon } from './Icons';
import { GlassCard } from './GlassCard';
import { CanvasAvatar } from './CanvasAvatar';
import { ImagePreloader } from './ImagePreloader';
import { Portal } from './Portal';
import { getRarityVisual, withAlpha } from '../constants/rarityVisuals';
import { ItemArt } from './ItemArt';

interface SovereignCustomizerProps {
    initialConfig?: SovereignConfig;
    onSave: (config: SovereignConfig) => void;
    onClose: () => void;
}

type EditMode = 'sovereign' | 'artifact' | 'glyph';
type SovereignSubTab = 'Corpo' | 'Cabelo' | 'Skin';

// Reusable Left/Right Selector
const Selector: React.FC<{
    label: string;
    value: string;
    onNext: () => void;
    onPrev: () => void;
    color?: string; // Optional color circle
}> = ({ label, value, onNext, onPrev, color }) => (
    <div className="flex flex-col items-center gap-1 w-full">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
        <div className="flex items-center justify-between w-full bg-black/20 rounded-lg p-1 border border-white/5">
            <button onClick={onPrev} className="p-2 hover:bg-white/10 rounded-md transition-colors text-white/70 hover:text-white">
                <ChevronLeftIcon className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2 justify-center flex-1 overflow-hidden px-2">
                {color && (
                    <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm flex-shrink-0" style={{ backgroundColor: color }} />
                )}
                <span className="text-xs font-bold text-white truncate text-center">
                    {value}
                </span>
            </div>

            <button onClick={onNext} className="p-2 hover:bg-white/10 rounded-md transition-colors text-white/70 hover:text-white">
                <ChevronRightIcon className="w-4 h-4" />
            </button>
        </div>
    </div>
);

export const SovereignCustomizer: React.FC<SovereignCustomizerProps> = ({ initialConfig, onSave, onClose }) => {
    const { inventory, userProfile } = useGame();
    const [config, setConfig] = useState<SovereignConfig>({
        ...DEFAULT_SOVEREIGN_CONFIG,
        ...(initialConfig || {}),
    });
    const [activeMode, setActiveMode] = useState<EditMode>('sovereign');
    const [sovereignSubTab, setSovereignSubTab] = useState<SovereignSubTab>('Corpo');
    
    // Parse initial body state for selectors
    useEffect(() => {
        // Validation: Ensure body exists in DB (Handle legacy/invalid IDs)
        const bodyExists = BODY_DB.find(b => b.id === config.body);
        if (!bodyExists) {
             console.warn(`Body ID ${config.body} not found in DB. Resetting to default.`);
             // Default to male 1
             setConfig(p => ({ ...p, body: 'body_masc_1', skinTone: '1' }));
             return;
        }

        // Initial sync: Ensure body and skin tone match
        if (!config.body) return;
        const currentBodyDef = BODY_DB.find(b => b.id === config.body);
        
        // If the current body's tone doesn't match the configured skin tone
        if (currentBodyDef && currentBodyDef.toneId !== config.skinTone) {
             // Try to find a body that matches the configured skin tone (Tone is King)
             const matchingBody = BODY_DB.find(b => b.gender === currentBodyDef.gender && b.toneId === config.skinTone);
             
             if (matchingBody) {
                 setConfig(p => ({ ...p, body: matchingBody.id }));
             } else {
                 // If no matching body for that tone, update tone to match current body (Body is King fallback)
                 setConfig(p => ({ ...p, skinTone: currentBodyDef.toneId }));
             }
        }
    }, []);

    const isStaff = userProfile.role === 'admin' || userProfile.role === 'gm' || userProfile.role === 'admin_gm';
    const unlockedItems: UserUnlocks = userProfile.unlockedItems || {
        bodyStyles: {},
        hairStyles: {},
        outfits: {},
        head_under_items: {},
        helmets: {},
        head_over_items: {},
        artifacts: {},
        codexes: {},
        skins: {},
        borders: {},
        banners: {},
        glyphs: {},
        auras: {},
        orbs: {},
        plates: {},
        ornament: {},
        insignias: {},
        ui_skins: {},
    };

    const hasUnlockInAnyBucket = (itemId: string) => Object.values(unlockedItems).some(bucket => !!bucket?.[itemId]);

    // Helpers
    const getOwnedList = (allItems: any[], unlockCategory?: UnlockCategory) => {
        if (!allItems) return [];
        return allItems.filter(item => {
            if (item.id === 'none') return true;
            if (isStaff) return true;
            // Allow if in inventory
            if (inventory?.some(inv => inv.id === item.id)) return true;
            // Allow legacy unlock maps as fallback while the migration is incomplete
            if (unlockCategory && unlockedItems[unlockCategory]?.[item.id]) return true;
            if (hasUnlockInAnyBucket(item.id)) return true;
            return false;
        });
    };

    const cycle = (currentId: string | undefined, options: any[], direction: number, unlockCategory?: UnlockCategory): string => {
        // Filter options by ownership
        const ownedOptions = getOwnedList(options, unlockCategory);
        
        if (!ownedOptions || ownedOptions.length === 0) return currentId || 'none';
        const validOptions = ownedOptions.map(o => o.id);
        const idx = validOptions.indexOf(currentId || 'none');
        // If current not found, start at 0
        const startIdx = idx === -1 ? 0 : idx;
        const newIdx = (startIdx + direction + validOptions.length) % validOptions.length;
        return validOptions[newIdx];
    };

    // Getters for display names
    const getBodyName = (id: string) => {
        const assets = SOVEREIGN_ASSETS as any;
        return assets.bodyStyles?.find((b: any) => b.id === id)?.name || assets.bodies?.find((b: any) => b.id === id)?.name || id;
    };
    const getGenderLabel = (id: string) => {
        const body = BODY_DB.find(b => b.id === id);
        return body?.gender === 'female' ? 'Feminino' : 'Masculino';
    };
    const getBodyTypeName = (id: string) => {
        const body = BODY_DB.find(b => b.id === id);
        return body ? `Tipo ${body.toneId}` : 'Tipo 1';
    };
    const getHairColorName = (id: string) => {
        // Just return "Tipo X" regardless of internal mapping
        // The id is now an index+1 (1, 2, 3...)
        return `Tipo ${id}`;
    };
    const getHairName = (id: string) => {
        const assets = SOVEREIGN_ASSETS as any;
        return assets.hairStyles?.find((h: any) => h.id === id)?.name || id;
    };
    const getOutfitName = (id: string) => SOVEREIGN_ASSETS.outfits.find(o => o.id === id)?.name || id;
    const getGlyphName = (id: string) => SOVEREIGN_ASSETS.glyphs.find(g => g.id === id)?.name || id;
    const getAuraName = (id: string) => SOVEREIGN_ASSETS.auras.find(a => a.id === id)?.name || id;
    const getOrbName = (id: string) => (SOVEREIGN_ASSETS as any).orbs?.find((o: any) => o.id === id)?.name || id;
    const getPlateName = (id: string) => SOVEREIGN_ASSETS.plates?.find(p => p.id === id)?.name || id;

    // Specific Cyclers
    const cycleGender = (direction: number) => {
        const currentBodyDef = BODY_DB.find(b => b.id === config.body);
        const currentGender = currentBodyDef?.gender || 'male';
        const newGender = currentGender === 'male' ? 'female' : 'male';
        
        // Find body of new gender with SAME tone (if possible) or default
        const currentTone = currentBodyDef?.toneId || '1';
        const matchingBody = BODY_DB.find(b => b.gender === newGender && b.toneId === currentTone);
        // Fallback to first body of new gender if match not found
        const fallbackBody = BODY_DB.find(b => b.gender === newGender);
        const newBody = matchingBody ? matchingBody.id : (fallbackBody ? fallbackBody.id : (newGender === 'male' ? 'body_masc_1' : 'body_fem_1'));
        
        setConfig(p => ({ ...p, body: newBody }));
    };

    const cycleBodyType = (direction: number) => {
        const currentBodyDef = BODY_DB.find(b => b.id === config.body);
        if (!currentBodyDef) return;

        const currentToneId = parseInt(currentBodyDef.toneId);
        // Assuming tones are 1, 2, 3
        const maxTone = 3; 
        let newToneId = currentToneId + direction;
        
        if (newToneId > maxTone) newToneId = 1;
        if (newToneId < 1) newToneId = maxTone;

        const newToneStr = newToneId.toString();
        
        const matchingBody = BODY_DB.find(b => b.gender === currentBodyDef.gender && b.toneId === newToneStr);
        if (matchingBody) {
             setConfig(p => ({ ...p, body: matchingBody.id }));
        }
    };

    const cycleHairStyle = (direction: number) => {
        const assets = SOVEREIGN_ASSETS as any;
        const newHairId = cycle(config.hairStyle, assets.hairStyles || [], direction, 'hairStyles');
        
        // Clamp color if needed
        const newHairDef = HAIR_DB.find(h => h.id === newHairId);
        const maxColors = newHairDef?.availableColors?.length || 6;
        let currentColor = parseInt(config.hairColor) || 1;
        if (currentColor > maxColors) currentColor = 1;

        setConfig(p => ({ ...p, hairStyle: newHairId, hairColor: currentColor.toString() }));
    };

    const cycleHairColor = (direction: number) => {
        // Find current hair to know how many colors it has
        const currentHair = HAIR_DB.find(h => h.id === config.hairStyle);
        // Default to 6 if not defined (legacy behavior) or actual count
        const maxColors = currentHair?.availableColors?.length || 6;
        
        const currentColorId = parseInt(config.hairColor) || 1;
        
        let newColorId = currentColorId + direction;
        if (newColorId > maxColors) newColorId = 1;
        if (newColorId < 1) newColorId = maxColors;
        
        setConfig(p => ({ ...p, hairColor: newColorId.toString() }));
    };

    const cycleOutfit = (direction: number) => {
        const newOutfit = cycle(config.outfit, SOVEREIGN_ASSETS.outfits, direction, 'outfits');
        setConfig(p => ({ ...p, outfit: newOutfit }));
    };

    const cycleGlyph = (direction: number) => {
        const newGlyph = cycle(config.glyph, SOVEREIGN_ASSETS.glyphs, direction, 'glyphs');
        setConfig(p => ({ ...p, glyph: newGlyph }));
    };

    const cycleAura = (direction: number) => {
        const newAura = cycle(config.aura, SOVEREIGN_ASSETS.auras, direction, 'auras');
        setConfig(p => ({ ...p, aura: newAura }));
    };

    const cycleOrb = (direction: number) => {
        const orbs = (SOVEREIGN_ASSETS as any).orbs || [];
        const newOrb = cycle(config.orb, orbs, direction, 'orbs');
        setConfig(p => ({ ...p, orb: newOrb }));
    };

    const cyclePlate = (direction: number, type: 'sovereign' | 'artifact' | 'glyph') => {
        const plates = SOVEREIGN_ASSETS.plates || [];
        if (type === 'sovereign') {
            const newPlate = cycle(config.sovereignPlate, plates, direction, 'plates');
            setConfig(p => ({ ...p, sovereignPlate: newPlate }));
        } else if (type === 'artifact') {
            const newPlate = cycle(config.artifactPlate, plates, direction, 'plates');
            setConfig(p => ({ ...p, artifactPlate: newPlate }));
        } else if (type === 'glyph') {
            const newPlate = cycle(config.glyphPlate, plates, direction, 'plates');
            setConfig(p => ({ ...p, glyphPlate: newPlate }));
        }
    };

    // Derived assets for preview
    const equippedArtifact = SOVEREIGN_ASSETS.artifacts?.find(a => a.id === config.artifact);
    const equippedGlyph = SOVEREIGN_ASSETS.glyphs?.find(g => g.id === config.glyph);
    const equippedArtifactPlate = SOVEREIGN_ASSETS.plates?.find(p => p.id === config.artifactPlate);
    const equippedGlyphPlate = SOVEREIGN_ASSETS.plates?.find(p => p.id === config.glyphPlate);
    const equippedOrb = SOVEREIGN_ASSETS.orbs?.find(o => o.id === config.orb);
    
    // Primary Display Handler
    const setPrimary = (type: 'sovereign' | 'item' | 'glyph') => {
        setConfig(p => ({ ...p, primaryDisplay: type }));
        // Also switch mode to edit that item
        if (type === 'sovereign') setActiveMode('sovereign');
        if (type === 'item') setActiveMode('artifact');
        if (type === 'glyph') setActiveMode('glyph');
    };

    const primary = config.primaryDisplay || 'sovereign';

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <ImagePreloader />
                <GlassCard variant="neutral" className="w-full max-w-md m-4 rounded-3xl flex flex-col max-h-[90vh] overflow-hidden border-2" onClick={e => e.stopPropagation()} style={{ borderColor: 'var(--skin-accent-color)' }}>
                    
                    {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <EditIcon className="w-5 h-5 text-[var(--skin-accent-color)]" />
                        Customizar
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <XIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Preview Section (3 Slots) */}
                <div className="p-4 bg-black/20 border-b border-white/5 flex gap-4 justify-center items-stretch shrink-0">
                    
                    {/* 1. Sovereign Card (Left) */}
                    <div 
                        onClick={() => setPrimary('sovereign')}
                        className={`relative w-32 h-48 bg-black/40 border-2 rounded-xl overflow-hidden cursor-pointer transition-all group hover:border-white/30 flex-shrink-0`}
                        style={{
                            borderColor: primary === 'sovereign' ? 'var(--skin-accent-color)' : 'rgba(255,255,255,0.1)',
                            boxShadow: primary === 'sovereign' ? '0 0 15px var(--skin-accent-color)' : undefined
                        }}
                    >
                        <CanvasAvatar 
                            sovereignConfig={{
                                ...config,
                                artifact: 'none',
                                glyph: 'none',
                                aura: 'none',
                                orb: 'none',
                                artifactPlate: 'none',
                                glyphPlate: 'none',
                            }} 
                            width={200} 
                            height={300} 
                            className="w-full h-full object-contain"
                        />
                         <div 
                            className={`absolute top-2 right-2 w-5 h-5 rounded-full border border-black/50 flex items-center justify-center transition-colors shadow-md z-10`}
                            style={{ backgroundColor: primary === 'sovereign' ? 'var(--skin-accent-color)' : 'rgba(0,0,0,0.6)' }}
                        >
                            {primary === 'sovereign' && <CheckIcon className="w-3 h-3 text-black" />}
                        </div>
                        {/* Label */}
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 text-[9px] text-center font-bold text-gray-300 uppercase tracking-wider">
                            Soberano
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col justify-between w-24 h-48 gap-2">
                        
                        {/* 2. Artifact Card (Top Right) */}
                        <div 
                            onClick={() => setPrimary('item')}
                            className={`relative flex-1 bg-black/40 border-2 rounded-xl flex items-center justify-center cursor-pointer transition-all group hover:border-white/30`}
                            style={{
                                borderColor: primary === 'item' ? 'var(--skin-accent-color)' : 'rgba(255,255,255,0.1)',
                                boxShadow: primary === 'item' ? '0 0 15px var(--skin-accent-color)' : undefined
                            }}
                        >
                            {equippedArtifactPlate?.url && (
                                <img
                                    src={equippedArtifactPlate.url}
                                    alt="Placa"
                                    className="absolute inset-0 w-full h-full object-contain opacity-90"
                                    onError={(event) => {
                                        event.currentTarget.style.display = 'none';
                                    }}
                                />
                            )}
                            <ItemArt
                                src={equippedArtifact?.url}
                                alt={equippedArtifact?.name || 'Artefato'}
                                className="relative z-10 w-12 h-12 flex items-center justify-center"
                                imgClassName="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                                textClassName="text-[9px] text-gray-600 font-bold uppercase"
                                fallbackText="Vazio"
                            />
                            
                            <div 
                                className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full border border-black/50 flex items-center justify-center transition-colors shadow-md`}
                                style={{ backgroundColor: primary === 'item' ? 'var(--skin-accent-color)' : 'rgba(0,0,0,0.6)' }}
                            >
                                {primary === 'item' && <CheckIcon className="w-2.5 h-2.5 text-black" />}
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 p-0.5 text-[8px] text-center font-bold text-gray-300 uppercase tracking-wider">
                                Artefato
                            </div>
                        </div>

                        {/* 3. Glyph Card (Bottom Right) */}
                        <div 
                            onClick={() => setPrimary('glyph')}
                            className={`relative flex-1 bg-black/40 border-2 rounded-xl flex items-center justify-center cursor-pointer transition-all group hover:border-white/30`}
                            style={{
                                borderColor: primary === 'glyph' ? 'var(--skin-accent-color)' : 'rgba(255,255,255,0.1)',
                                boxShadow: primary === 'glyph' ? '0 0 15px var(--skin-accent-color)' : undefined
                            }}
                        >
                            {equippedGlyphPlate?.url && (
                                <img
                                    src={equippedGlyphPlate.url}
                                    alt="Placa"
                                    className="absolute inset-0 w-full h-full object-contain opacity-90"
                                    onError={(event) => {
                                        event.currentTarget.style.display = 'none';
                                    }}
                                />
                            )}
                            <ItemArt
                                src={equippedGlyph?.url}
                                alt={equippedGlyph?.name || 'Glifo'}
                                className="relative z-10 w-12 h-12 flex items-center justify-center"
                                imgClassName="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                textClassName="text-[9px] text-gray-600 font-bold uppercase"
                                fallbackText="Vazio"
                            />
                            {equippedOrb?.url && (
                                <img
                                    src={equippedOrb.url}
                                    alt="Orbe"
                                    className="absolute inset-0 w-full h-full object-contain z-20 scale-75 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]"
                                    onError={(event) => {
                                        event.currentTarget.style.display = 'none';
                                    }}
                                />
                            )}
                            
                            <div 
                                className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full border border-black/50 flex items-center justify-center transition-colors shadow-md`}
                                style={{ backgroundColor: primary === 'glyph' ? 'var(--skin-accent-color)' : 'rgba(0,0,0,0.6)' }}
                            >
                                {primary === 'glyph' && <CheckIcon className="w-2.5 h-2.5 text-black" />}
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 p-0.5 text-[8px] text-center font-bold text-gray-300 uppercase tracking-wider">
                                Glifo
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative">
                    
                    {/* SOVEREIGN CONTROLS */}
                    {activeMode === 'sovereign' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Sub-Tabs for Sovereign */}
                            <div className="flex gap-2 mb-4 bg-black/40 p-1 rounded-lg">
                                {(['Corpo', 'Cabelo', 'Skin'] as SovereignSubTab[]).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setSovereignSubTab(tab)}
                                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                                            sovereignSubTab === tab 
                                            ? 'bg-white/10 text-white shadow-sm' 
                                            : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {sovereignSubTab === 'Corpo' && (
                                <div className="space-y-4">
                                    <Selector 
                                        label="GÃªnero" 
                                        value={getGenderLabel(config.body)} 
                                        onPrev={() => cycleGender(-1)} 
                                        onNext={() => cycleGender(1)} 
                                    />
                                    <Selector 
                                        label="Tipo" 
                                        value={getBodyTypeName(config.body)} 
                                        onPrev={() => cycleBodyType(-1)} 
                                        onNext={() => cycleBodyType(1)}
                                    />
                                </div>
                            )}

                            {sovereignSubTab === 'Cabelo' && (
                                <div className="space-y-4">
                                    <Selector 
                                        label="Estilo" 
                                        value={getHairName(config.hairStyle)} 
                                        onPrev={() => cycleHairStyle(-1)} 
                                        onNext={() => cycleHairStyle(1)} 
                                    />
                                    <Selector 
                                        label="VariaÃ§Ã£o" 
                                        value={getHairColorName(config.hairColor)} 
                                        onPrev={() => cycleHairColor(-1)} 
                                        onNext={() => cycleHairColor(1)}
                                        // No color circle for variations
                                    />
                                </div>
                            )}

                            {sovereignSubTab === 'Skin' && (
                                <div className="space-y-4">
                                    <Selector 
                                        label="Placa (Fundo)" 
                                        value={getPlateName(config.sovereignPlate || 'none')} 
                                        onPrev={() => cyclePlate(-1, 'sovereign')} 
                                        onNext={() => cyclePlate(1, 'sovereign')} 
                                    />
                                    <Selector 
                                        label="Traje" 
                                        value={getOutfitName(config.outfit)} 
                                        onPrev={() => cycleOutfit(-1)} 
                                        onNext={() => cycleOutfit(1)} 
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* ARTIFACT CONTROLS */}
                    {activeMode === 'artifact' && (
                        <div className="space-y-4 animate-fade-in h-full flex flex-col">
                            <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                                <Selector 
                                    label="Placa (Fundo)" 
                                    value={getPlateName(config.artifactPlate || 'none')} 
                                    onPrev={() => cyclePlate(-1, 'artifact')} 
                                    onNext={() => cyclePlate(1, 'artifact')} 
                                />
                            </div>

                            <div className="flex-1 flex flex-col min-h-0">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block text-center mb-2">Selecione um Artefato</span>
                                <div className="grid grid-cols-5 gap-2 overflow-y-auto pr-1 pb-2 custom-scrollbar">
                                    {getOwnedList(SOVEREIGN_ASSETS.artifacts, 'artifacts').map(item => {
                                        const isSelected = config.artifact === item.id;
                                        const assetWithRarity = item as any;
                                        const rarityVisual = getRarityVisual(assetWithRarity.rarity);
                                        
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => setConfig(p => ({ ...p, artifact: item.id }))}
                                                className={`relative aspect-square rounded-md border flex flex-col items-center justify-center bg-black/40 transition-all ${isSelected ? 'border-white bg-white/10' : 'border-white/10 hover:bg-white/5'}`}
                                            >
                                                <div className="flex items-center justify-center w-full h-full p-1">
                                                    <ItemArt
                                                        src={item.url}
                                                        alt={item.name}
                                                        className="w-full h-full flex items-center justify-center"
                                                        imgClassName="w-full h-full object-contain"
                                                        textClassName="text-[8px] text-gray-500"
                                                        fallbackText="N/A"
                                                    />
                                                </div>
                                                
                                                {isSelected && (
                                                    <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center shadow-sm z-10">
                                                        <CheckIcon className="w-2 h-2 text-white" />
                                                    </div>
                                                )}

                                                <div
                                                    className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full"
                                                    style={{
                                                        backgroundColor: rarityVisual.hex,
                                                        boxShadow: assetWithRarity.rarity === 'legendary' ? `0 0 4px ${withAlpha(rarityVisual.rgb, 0.55)}` : undefined,
                                                    }}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GLYPH CONTROLS */}
                    {activeMode === 'glyph' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-4">
                                <Selector 
                                    label="Placa (Fundo)" 
                                    value={getPlateName(config.glyphPlate || 'none')} 
                                    onPrev={() => cyclePlate(-1, 'glyph')} 
                                    onNext={() => cyclePlate(1, 'glyph')} 
                                />
                                <div className="h-px bg-white/5 w-full" />
                                <Selector 
                                    label="Moldura (Glifo)" 
                                    value={getGlyphName(config.glyph)} 
                                    onPrev={() => cycleGlyph(-1)} 
                                    onNext={() => cycleGlyph(1)} 
                                />
                                <div className="h-px bg-white/5 w-full" />
                                <Selector 
                                    label="Aura" 
                                    value={getAuraName(config.aura)} 
                                    onPrev={() => cycleAura(-1)} 
                                    onNext={() => cycleAura(1)} 
                                />
                                <div className="h-px bg-white/5 w-full" />
                                <Selector 
                                    label="Orbe" 
                                    value={getOrbName(config.orb || 'none')} 
                                    onPrev={() => cycleOrb(-1)} 
                                    onNext={() => cycleOrb(1)} 
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-black/40 border-t border-white/10 flex gap-3">
                     <button 
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition-colors uppercase tracking-widest"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => onSave(config)}
                        className="flex-1 py-3 rounded-xl luxe-skin-button"
                    >
                        Salvar
                    </button>
                </div>
            </GlassCard>

        </div>
        </Portal>
    );
};

