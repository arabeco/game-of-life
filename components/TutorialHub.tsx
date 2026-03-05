import React from 'react';
import { useTutorial } from '../contexts/TutorialContext';
import { Portal } from './Portal';
import { AssetIcon, ArenaIcon, SocialIcon, ConfigIcon } from './Icons';

interface HubCardProps {
    title: string;
    description: string;
    category: 'ALICERCE' | 'IDENTIDADE' | 'MUNDO' | 'ARQUITETO';
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
}

const HubCard: React.FC<HubCardProps> = ({ title, description, category, icon, color, onClick }) => (
    <div
        onClick={onClick}
        className="group relative p-6 rounded-[24px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col justify-between"
    >
        <div className="relative z-10 space-y-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 bg-black/40 text-gray-400 group-hover:scale-110`} style={{ color }}>
                {icon}
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-widest uppercase text-white group-hover:text-[var(--skin-accent-color)] transition-colors">
                        {title}
                    </h3>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">
                    Estação: {category}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed font-medium mt-3">
                    {description}
                </p>
            </div>
        </div>

        <div className="mt-6 flex justify-end items-center relative z-10">
            <div className="text-white transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                INICIAR TREINAMENTO →
            </div>
        </div>

        {/* Decorative Background Blob */}
        <div
            className="absolute -top-10 -right-10 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500"
            style={{ backgroundColor: color }}
        />
    </div>
);

export const TutorialHub: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { startTutorial } = useTutorial();

    if (!isOpen) return null;

    const basicCards = [
        {
            category: 'ALICERCE' as const,
            title: 'O Alicerce',
            description: 'A fundação da sua soberania. Domine Arenas, Ações e o Ciclo de Execução.',
            icon: <ArenaIcon className="w-6 h-6" />,
            color: '#3B82F6',
            startIndex: 1
        },
        {
            category: 'ARQUITETO' as const,
            title: 'O Arquiteto',
            description: 'Para mestres do domínio. Planejamento de longo prazo, Vínculos e Metas.',
            icon: <ConfigIcon className="w-6 h-6" />,
            color: '#8B5CF6',
            startIndex: 20
        }
    ];

    const gameCards = [
        {
            category: 'IDENTIDADE' as const,
            title: 'A Identidade',
            description: 'Desperte seu Soberano. Explore Patentes, Maestria de Ativos e Arsenal.',
            icon: <AssetIcon className="w-6 h-6" />,
            color: '#FFD700',
            startIndex: 9
        },
        {
            category: 'MUNDO' as const,
            title: 'O Mundo',
            description: 'Conecte-se com Aliados, entre em Clãs e dispute Temporadas Épicas.',
            icon: <SocialIcon className="w-6 h-6" />,
            color: '#10B981',
            startIndex: 16
        }
    ];

    const onCardClick = (category: string, startIndex: number) => {
        let view: any = 'arenas';
        if (category === 'IDENTIDADE') view = 'assets';
        if (category === 'MUNDO') view = 'social';
        if (category === 'ARQUITETO') view = 'planner';

        window.dispatchEvent(new CustomEvent('tutorialNavigate', {
            detail: { view }
        }));

        startTutorial(startIndex);
    };

    return (
        <Portal>
            <div
                className="fixed inset-0 z-[15000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <div className="relative w-full max-w-5xl space-y-8 animate-fade-in-up max-h-[90vh] overflow-y-auto px-2 custom-scrollbar py-8">
                    <button
                        onClick={onClose}
                        className="absolute top-0 right-4 text-gray-500 hover:text-white transition-colors text-sm font-black tracking-widest uppercase z-50"
                    >
                        FECHAR [ESC]
                    </button>

                    <div className="text-center space-y-4 pt-4">
                        <h2 className="text-4xl font-black uppercase tracking-[0.4em] text-white luxe-title-ornate">
                            VITRINE DE INICIAÇÃO
                        </h2>
                        <p className="text-gray-400 text-sm tracking-widest uppercase max-w-2xl mx-auto leading-relaxed">
                            Domine os sistemas do GLYPH escolhendo sua estação de treinamento.
                        </p>
                    </div>

                    <div className="space-y-12">
                        {/* Seção 1: Básico */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4 px-2">
                                <h3 className="text-xs font-black tracking-[0.3em] text-blue-400 uppercase">Acesso Universal</h3>
                                <div className="h-px flex-1 bg-blue-500/20" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {basicCards.map((card, i) => (
                                    <HubCard
                                        key={i}
                                        {...card}
                                        onClick={() => onCardClick(card.category, card.startIndex)}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Seção 2: Game Mode */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4 px-2">
                                <h3 className="text-xs font-black tracking-[0.3em] text-[var(--skin-accent-color)] uppercase">Expansão Soberana [ REQUER MODO GAME ]</h3>
                                <div className="h-px flex-1 bg-[var(--skin-accent-color)]/20" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {gameCards.map((card, i) => (
                                    <HubCard
                                        key={i}
                                        {...card}
                                        onClick={() => onCardClick(card.category, card.startIndex)}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="text-center pt-8">
                        <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em]">
                            * Retorne a esta vitrine a qualquer momento pelo menu de configurações.
                        </p>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
