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
import { SovereignVitrine } from './SovereignVitrine';

interface SovereignCustomizerProps {
    initialConfig?: SovereignConfig;
    onSave: (config: SovereignConfig) => void;
    onClose: () => void;
}

type EditMode = 'sovereign' | 'artifact';
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
            <button aria-label="Anterior" onClick={onPrev} className="p-2 hover:bg-white/10 rounded-md transition-colors text-white/70 hover:text-white">
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

            <button aria-label="Próximo" onClick={onNext} className="p-2 hover:bg-white/10 rounded-md transition-colors text-white/70 hover:text-white">
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
        artifacts: {},
        codexes: {},
        skins: {},
        borders: {},
        banners: {},
        auras: {},
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
            if (unlockCategory === 'hairStyles') return true;
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
    const getAuraName = (id: string) => SOVEREIGN_ASSETS.auras.find(a => a.id === id)?.name || id;
    const getPlateName = (id: string) => SOVEREIGN_ASSETS.plates?.find(p => p.id === id)?.name || id;
    const getSharedPlateId = () => config.sovereignPlate || config.artifactPlate || 'none';

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

        const bodiesForGender = BODY_DB
            .filter(b => b.gender === currentBodyDef.gender)
            .sort((a, b) => Number(a.toneId) - Number(b.toneId));
        const currentIndex = bodiesForGender.findIndex(b => b.id === currentBodyDef.id);
        const newIndex = (currentIndex + direction + bodiesForGender.length) % bodiesForGender.length;
        const nextBody = bodiesForGender[newIndex];

        if (nextBody) {
             setConfig(p => ({ ...p, body: nextBody.id, skinTone: nextBody.toneId }));
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

    const cycleAura = (direction: number) => {
        const newAura = cycle(config.aura, SOVEREIGN_ASSETS.auras, direction, 'auras');
        setConfig(p => ({ ...p, aura: newAura }));
    };

    const cyclePlate = (direction: number, type: 'sovereign' | 'artifact' | 'shared') => {
        const plates = SOVEREIGN_ASSETS.plates || [];
        if (type === 'shared') {
            const newPlate = cycle(getSharedPlateId(), plates, direction, 'plates');
            setConfig(p => ({
                ...p,
                sovereignPlate: newPlate,
                artifactPlate: newPlate,
            }));
        } else if (type === 'sovereign') {
            const newPlate = cycle(config.sovereignPlate, plates, direction, 'plates');
            setConfig(p => ({ ...p, sovereignPlate: newPlate }));
        } else if (type === 'artifact') {
            const newPlate = cycle(config.artifactPlate, plates, direction, 'plates');
            setConfig(p => ({ ...p, artifactPlate: newPlate }));
        }
    };

    // Derived assets for preview
    const sharedPlateId = getSharedPlateId();
    const equippedSharedPlate = SOVEREIGN_ASSETS.plates?.find(p => p.id === sharedPlateId);

    /*
     * VER ANTES DE MEXER.
     *
     * A tela abria com corpo, cabelo, pele e roupa todos em seletor, de uma vez.
     * Quem so queria olhar o que montou nao tinha onde — e quem chegava aqui
     * pelo soberano de OUTRA pessoa nao podia chegar, porque nao havia caminho.
     *
     * Agora ela nasce vitrine. Os seletores continuam os mesmos, um toque
     * depois.
     */
    const [modo, setModo] = useState<'vitrine' | 'edicao'>('vitrine');

    /*
     * QUAL DAS TRES VAGAS A GRADE ESTA ENCHENDO.
     *
     * A grade de artefatos escrevia sempre em `config.artifact`. Com tres vagas
     * ela precisa saber em qual esta mexendo, senao escolher o segundo apagaria
     * o primeiro — e a pessoa descobriria isso depois, olhando a vitrine.
     *
     * Zero e o DESTAQUE, que e o unico que o perfil mostra.
     */
    const [slotAtivo, setSlotAtivo] = useState(0);

    const artefatoDoSlot = (indice: number) => (
        indice === 0 ? (config.artifact || 'none') : (config.extraArtifacts?.[indice - 1] || 'none')
    );

    /*
     * ARTEFATO JA POSTO NAO SE ESCOLHE DE NOVO.
     *
     * A primeira versao disto aceitava o clique e esvaziava a vaga antiga. Era
     * correto e era ruim: a pessoa punha na vaga 2 e a vaga 1 esvaziava sem ela
     * ter pedido, e so ia entender olhando a vitrine.
     *
     * Agora a peca ja usada aparece afundada na grade e nao aceita clique.
     * `none` e a excecao obvia: vaga vazia nao ocupa nada, e varias podem
     * estar vazias ao mesmo tempo.
     */
    const usadoEmOutraVaga = (id: string) => {
        if (id === 'none') return false;
        return [0, 1, 2].some(indice => indice !== slotAtivo && artefatoDoSlot(indice) === id);
    };

    const porArtefatoNoSlot = (id: string) => {
        if (usadoEmOutraVaga(id)) return;
        setConfig(anterior => {
            if (slotAtivo === 0) return { ...anterior, artifact: id };
            const extras = [...(anterior.extraArtifacts || [])];
            while (extras.length < 2) extras.push('none');
            extras[slotAtivo - 1] = id;
            return { ...anterior, extraArtifacts: extras };
        });
    };

    /*
     * MOSTRAR NO PERFIL E UMA ESCOLHA, E ELA MORA NO MESMO CAMPO.
     *
     * O perfil agora mostra soberano e artefato juntos. `primaryDisplay`
     * continua guardando a unica escolha necessaria: exibir ou ocultar.
     */
    const apareceNoPerfil = config.primaryDisplay !== 'none';
    const alternarAparicao = () => {
        setConfig(p => ({
            ...p,
            primaryDisplay: p.primaryDisplay === 'none' ? 'sovereign' : 'none',
        }));
    };

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
                    <button aria-label="Fechar" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <XIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {modo === 'vitrine' && (
                    <div className="flex-1 overflow-y-auto p-5">
                        <SovereignVitrine config={config} onEditar={() => setModo('edicao')} />
                    </div>
                )}

                {modo === 'edicao' && (<>
                {/* O editor espelha a vitrine: soberano central e tres artefatos abaixo. */}
                <div className="flex shrink-0 flex-col items-center gap-2 border-b border-white/5 bg-black/20 px-4 py-3">
                    <button
                        type="button"
                        onClick={() => setActiveMode('sovereign')}
                        aria-label="Editar Soberano"
                        className="relative h-52 w-40 overflow-hidden rounded-xl border-2 bg-black/40 transition-colors hover:border-white/30"
                        style={{ borderColor: activeMode === 'sovereign' ? 'var(--skin-accent-color)' : 'rgba(255,255,255,0.1)' }}
                    >
                        <CanvasAvatar
                            sovereignConfig={{ ...config, artifact: 'none', artifactPlate: 'none', sovereignPlate: sharedPlateId }}
                            width={200}
                            height={300}
                            className="h-full w-full object-contain"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/65 p-1 text-center text-[9px] font-bold uppercase tracking-wider text-gray-200">Soberano</span>
                    </button>
                    <div className="flex justify-center gap-2" aria-label="Artefatos equipados">
                        {[0, 1, 2].map(indice => {
                            const id = artefatoDoSlot(indice);
                            const artefato = SOVEREIGN_ASSETS.artifacts?.find(item => item.id === id);
                            const ativo = activeMode === 'artifact' && slotAtivo === indice;
                            return (
                                <button
                                    key={indice}
                                    type="button"
                                    onClick={() => { setActiveMode('artifact'); setSlotAtivo(indice); }}
                                    aria-label={`Editar ${indice === 0 ? 'artefato em destaque' : `artefato da vaga ${indice + 1}`}`}
                                    className="flex w-[4.75rem] flex-col items-center gap-1"
                                >
                                    <span
                                        className="relative grid h-[4.75rem] w-[4.75rem] place-items-center overflow-hidden rounded-xl border-2 bg-black/40 transition-colors hover:border-white/30"
                                        style={{ borderColor: ativo ? 'var(--skin-accent-color)' : 'rgba(255,255,255,0.12)' }}
                                    >
                                        {equippedSharedPlate?.url && <img src={equippedSharedPlate.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-85" />}
                                        {artefato?.url ? (
                                            <ItemArt src={artefato.url} alt={artefato.name} className="relative z-10 grid h-full w-full place-items-center p-2" imgClassName="h-full w-full object-contain" />
                                        ) : <span className="relative z-10 text-[9px] font-bold uppercase text-white/45">Vazio</span>}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase tracking-wider ${indice === 0 ? 'text-[var(--skin-accent-color)]' : 'text-white/50'}`}>
                                        {indice === 0 ? 'Destaque' : `Vaga ${indice + 1}`}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* O interruptor fica junto dos previews, que e onde a pessoa
                    acabou de decidir o que mostrar — e nao perdido no fim da
                    lista de pecas. */}
                <div className="flex items-center justify-between gap-3 border-b border-white/5 bg-black/20 px-4 py-2.5 shrink-0">
                    <div className="min-w-0">
                        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-white/78">Mostrar no perfil</div>
                        <div className="mt-0.5 text-[9px] leading-[1.35] text-white/42">
                            {/* A frase diz PERFIL e nao "em todo lugar", porque a lista
                                de membros do grupo monta o soberano com
                                `primaryDisplay: 'sovereign'` fixo e ignora esta
                                escolha. Prometer mais do que o interruptor faz
                                seria pior do que ele nao existir. */}
                            {apareceNoPerfil ? 'Soberano e artefato de destaque aparecem no seu perfil.' : 'Seu perfil não mostra o Soberano nem o artefato.'}
                        </div>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={apareceNoPerfil}
                        aria-label="Mostrar Soberano e artefato no perfil"
                        onClick={alternarAparicao}
                        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                            apareceNoPerfil
                                ? 'border-[var(--skin-accent-color)]/60 bg-[var(--skin-accent-color)]/30'
                                : 'border-white/15 bg-white/8'
                        }`}
                    >
                        <span
                            className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all ${
                                apareceNoPerfil
                                    ? 'left-[22px] bg-[var(--skin-accent-color)]'
                                    : 'left-[3px] bg-white/45'
                            }`}
                        />
                    </button>
                </div>

                {/* Controls Section */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative">
                    <div className="mb-3 space-y-2 rounded-xl border border-white/5 bg-black/20 p-2.5">
                        <Selector
                            label="Aura Compartilhada"
                            value={getAuraName(config.aura)}
                            onPrev={() => cycleAura(-1)}
                            onNext={() => cycleAura(1)}
                        />
                        <div className="h-px bg-white/5 w-full" />
                        <Selector
                            label="Placa Compartilhada"
                            value={getPlateName(sharedPlateId)}
                            onPrev={() => cyclePlate(-1, 'shared')}
                            onNext={() => cyclePlate(1, 'shared')}
                        />
                    </div>
                    
                    {/* SOVEREIGN CONTROLS */}
                    {activeMode === 'sovereign' && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Sub-Tabs for Sovereign */}
                            <div className="flex gap-2 mb-3 bg-black/40 p-1 rounded-lg">
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
                                <div className="space-y-3">
                                    <Selector 
                                        label="Gênero"
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
                                <div className="space-y-3">
                                    <Selector 
                                        label="Estilo" 
                                        value={getHairName(config.hairStyle)} 
                                        onPrev={() => cycleHairStyle(-1)} 
                                        onNext={() => cycleHairStyle(1)} 
                                    />
                                    <Selector 
                                        label="Variação" 
                                        value={getHairColorName(config.hairColor)} 
                                        onPrev={() => cycleHairColor(-1)} 
                                        onNext={() => cycleHairColor(1)}
                                        // No color circle for variations
                                    />
                                </div>
                            )}

                            {sovereignSubTab === 'Skin' && (
                                <div className="space-y-3">
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
                        <div className="space-y-3 animate-fade-in h-full flex flex-col">
                            <div className="flex-1 flex flex-col min-h-0">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block text-center mb-2">Selecione um Artefato</span>

                                {/* As tres vagas. A grade abaixo enche a que estiver
                                    escolhida — sem isto, escolher o segundo apagaria
                                    o primeiro sem aviso. */}
                                <div className="mb-2 flex justify-center gap-1.5">
                                    {[0, 1, 2].map(indice => {
                                        const ocupado = artefatoDoSlot(indice) !== 'none';
                                        const ativo = slotAtivo === indice;
                                        return (
                                            <button
                                                key={`vaga-${indice}`}
                                                type="button"
                                                onClick={() => setSlotAtivo(indice)}
                                                className={`rounded-lg border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] transition-colors ${
                                                    ativo
                                                        ? 'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/18 text-[var(--skin-accent-color)]'
                                                        : 'border-white/12 text-white/45 hover:border-white/25 hover:text-white/70'
                                                }`}
                                            >
                                                {indice === 0 ? 'Destaque' : `Vaga ${indice + 1}`}
                                                {ocupado && <span className="ml-1 opacity-60">•</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="grid grid-cols-5 gap-2 overflow-y-auto pr-1 pb-2 custom-scrollbar">
                                    {getOwnedList(SOVEREIGN_ASSETS.artifacts, 'artifacts').map(item => {
                                        const isSelected = artefatoDoSlot(slotAtivo) === item.id;
                                        const jaUsado = usadoEmOutraVaga(item.id);
                                        const assetWithRarity = item as any;
                                        const rarityVisual = getRarityVisual(assetWithRarity.rarity);
                                        
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => porArtefatoNoSlot(item.id)}
                                                disabled={jaUsado}
                                                title={jaUsado ? 'Já está em outra vaga' : item.name}
                                                /* Afundado: sombra para dentro, sem brilho e sem
                                                   hover. Ele nao some da grade de proposito — some
                                                   pareceria que a peca foi perdida, e ela esta ali
                                                   do lado, numa vaga. */
                                                className={`relative aspect-square rounded-md border flex flex-col items-center justify-center transition-all ${
                                                    jaUsado
                                                        ? 'cursor-not-allowed border-black/50 bg-black/70 opacity-40 shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)]'
                                                        : isSelected
                                                            ? 'border-white bg-white/10 bg-black/40'
                                                            : 'border-white/10 bg-black/40 hover:bg-white/5'
                                                }`}
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

                </div>

                </>)}

                {/* Footer Buttons */}
                {/* Na vitrine nao ha o que cancelar nem salvar: nada foi mexido.
                    Oferecer "Salvar" antes de existir mudanca ensina a clicar sem
                    ler, e depois o clique que importa passa batido. */}
                <div className="p-4 bg-black/40 border-t border-white/10 flex gap-3">
                    {modo === 'vitrine' ? (
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition-colors uppercase tracking-widest"
                        >
                            Fechar
                        </button>
                    ) : (<>
                        <button
                            onClick={() => setModo('vitrine')}
                            className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition-colors uppercase tracking-widest"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={() => onSave(config)}
                            className="flex-1 py-3 rounded-xl luxe-skin-button"
                        >
                            Salvar
                        </button>
                    </>)}
                </div>
            </GlassCard>

        </div>
        </Portal>
    );
};
