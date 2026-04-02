import React from 'react';
import { GlassCard } from './GlassCard';
import { LockIcon } from './Icons';
import { Portal } from './Portal';
import { ProfileBackgroundSurface } from './ProfileBackgroundSurface';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../supabaseClient';
import { hasPlatinumAccess, hasPremiumAccess } from '../utils/premiumAccess';
import {
    PROFILE_BACKGROUND_BUCKET_FOLDER,
    PROFILE_BACKGROUND_BUCKET_NAME,
    PROFILE_BACKGROUND_OPTIONS,
    buildProfileBackgroundPublicUrl,
    getProfileBackgroundBasename,
    resolveProfileBackgroundValue,
    type ProfileBackgroundOption,
} from '../utils/profileBackgrounds';

interface BackgroundImageSelectionModalProps {
    currentBackground: string;
    onClose: () => void;
    onSelect: (backgroundValue: string) => void;
    options?: ProfileBackgroundOption[];
    title?: string;
    showUpload?: boolean;
    isPremiumUser?: boolean;
}

export const BackgroundImageSelectionModal: React.FC<BackgroundImageSelectionModalProps> = ({
    currentBackground,
    onClose,
    onSelect,
    options,
    title,
    showUpload,
    isPremiumUser: propIsPremium,
}) => {
    const { userProfile, showToast } = useGame();
    const isPremiumUser = propIsPremium ?? hasPremiumAccess(userProfile);
    const isPlatinumUser = hasPlatinumAccess(userProfile);

    const backgroundOptions = options ?? PROFILE_BACKGROUND_OPTIONS;
    const modalTitle = title ?? 'Selecionar Plano de Fundo';
    const [bucketBackgroundOptions, setBucketBackgroundOptions] = React.useState<ProfileBackgroundOption[]>([]);
    void showUpload;

    React.useEffect(() => {
        let isMounted = true;

        const getExtensionPriority = (fileName: string) => {
            const normalized = fileName.toLowerCase();
            if (normalized.endsWith('.png')) return 0;
            if (normalized.endsWith('.jpg')) return 1;
            if (normalized.endsWith('.jpeg')) return 2;
            if (normalized.endsWith('.webp')) return 3;
            return 4;
        };

        const humanizeBucketBackgroundName = (basename: string) => {
            if (/^\d+$/.test(basename)) {
                return `Horizonte ${basename}`;
            }

            const specialNames: Record<string, string> = {
                animeback: 'Anime',
                autunback: 'Outono',
                basic: 'Basic',
                blackback: 'Sombra',
                blueback: 'Azul',
                cyber: 'Cyber',
                darkblueback: 'Abismo',
                ember: 'Ember',
                frost: 'Frost',
                gardenaurora: 'Jardim Aurora',
                gardenember: 'Jardim Ember',
                gardenfrost: 'Jardim Frost',
                genesis: 'Genesis',
                gold: 'Ouro',
                goldback: 'Ouro',
                land01: 'Horizonte 01',
                land1: 'Horizonte 1',
                office1: 'Office 01',
                pinkback: 'Rosa',
                purpleback: 'Roxo',
                rubiback: 'Rubi',
                silverback: 'Prata',
                violetback: 'Violeta',
                whiteback: 'Branco',
            };

            if (specialNames[basename]) {
                return specialNames[basename];
            }

            return basename
                .replace(/[-_]+/g, ' ')
                .replace(/\b\w/g, (letter) => letter.toUpperCase());
        };

        const loadBucketBackgrounds = async () => {
            const { data, error } = await supabase.storage
                .from(PROFILE_BACKGROUND_BUCKET_NAME)
                .list(PROFILE_BACKGROUND_BUCKET_FOLDER, { limit: 200, sortBy: { column: 'name', order: 'asc' } });

            if (!isMounted || error || !data) {
                return;
            }

            const knownBasenames = new Set(
                backgroundOptions
                    .map((option) => getProfileBackgroundBasename(option.value))
                    .filter((basename): basename is string => Boolean(basename)),
            );

            const bestFileByBasename = new Map<string, string>();
            data.forEach((entry) => {
                const fileName = entry.name ?? '';
                if (!/\.(png|jpe?g|webp)$/i.test(fileName)) {
                    return;
                }

                const basename = fileName.replace(/\.[^.]+$/, '').toLowerCase();
                const currentFileName = bestFileByBasename.get(basename);
                if (!currentFileName || getExtensionPriority(fileName) < getExtensionPriority(currentFileName)) {
                    bestFileByBasename.set(basename, fileName);
                }
            });

            const dynamicOptions: ProfileBackgroundOption[] = Array.from(bestFileByBasename.entries())
                .filter(([basename]) => !knownBasenames.has(basename))
                .map(([basename, fileName]) => ({
                    id: `bucket-${basename}`,
                    name: humanizeBucketBackgroundName(basename),
                    value: buildProfileBackgroundPublicUrl(fileName),
                    accessTier: 'platinum',
                }));

            setBucketBackgroundOptions(dynamicOptions);
        };

        loadBucketBackgrounds();

        return () => {
            isMounted = false;
        };
    }, [backgroundOptions]);

    const renderedBackgroundOptions = React.useMemo(
        () => [...backgroundOptions, ...bucketBackgroundOptions],
        [backgroundOptions, bucketBackgroundOptions],
    );

    const canUseBackground = (bg: ProfileBackgroundOption) => {
        if (bg.accessTier === 'platinum') return isPlatinumUser;
        if (bg.accessTier === 'premium') return isPremiumUser;
        return true;
    };

    const handleSelect = (bg: ProfileBackgroundOption) => {
        if (!canUseBackground(bg)) {
            showToast(
                bg.accessTier === 'platinum'
                    ? 'Acesso negado. Recurso restrito ao Platinum.'
                    : 'Acesso negado. Recurso restrito ao Premium.',
                'error',
            );
            return;
        }
        onSelect(resolveProfileBackgroundValue(bg.value));
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-center">{modalTitle}</h2>
                    <div className="grid grid-cols-2 gap-2 p-2 max-h-64 overflow-y-auto">
                        {renderedBackgroundOptions.map(bg => {
                            const resolvedValue = resolveProfileBackgroundValue(bg.value);
                            const resolvedCurrent = resolveProfileBackgroundValue(currentBackground);
                            const isSelected = resolvedCurrent === resolvedValue;

                            return (
                                <div key={bg.id} className="text-center relative">
                                    <button
                                        onClick={() => handleSelect(bg)}
                                        className={`aspect-[16/9] w-full rounded-lg overflow-hidden transition-all duration-200 relative ${isSelected ? 'ring-4 ring-offset-2 ring-offset-gray-800 ring-white' : ''} ${!canUseBackground(bg) ? 'opacity-80 grayscale-[0.5]' : ''}`}
                                    >
                                        <ProfileBackgroundSurface
                                            value={resolvedValue}
                                            className="w-full h-full object-cover"
                                            alt={bg.name}
                                        />
                                        {!canUseBackground(bg) && (
                                            <div className="absolute top-1 right-1 bg-black/80 rounded-full w-5 h-5 flex items-center justify-center border border-yellow-500/50 shadow-lg">
                                                <LockIcon className="w-2.5 h-2.5 text-yellow-300" />
                                            </div>
                                        )}
                                    </button>
                                    <p className="text-xs mt-1 uppercase font-bold tracking-tighter opacity-70">{bg.name}</p>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={onClose} className="w-full py-2 rounded-xl luxe-skin-button">
                        FECHAR
                    </button>
                </GlassCard>
            </div>
        </Portal>
    );
};
