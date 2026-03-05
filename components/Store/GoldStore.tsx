import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { ECONOMY } from '../../constants/economy';
import { CheckIcon, CrownIcon } from '../Icons';
import { MercadoPagoBrick } from './MercadoPagoBrick';

export const GoldStore: React.FC = () => {
    const { buyGoldPack, buyStoreItem, userProfile } = useGame();
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedPack, setSelectedPack] = useState<{ amount: number, goldAmount: number } | null>(null);

    const handleBuyPack = async (packId: string) => {
        const pack = ECONOMY.gold_packs.find(p => p.id === packId);
        if (!pack) return;
        
        setSelectedPack({
            amount: pack.price_brl,
            goldAmount: pack.total
        });
    };

    const handleBuyPremium = async () => {
        if (loading) return;
        setLoading('premium');
        try {
            await buyStoreItem('premium_30d', 'premium');
        } catch (error) {
            console.error("Premium purchase failed", error);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Premium Banner */}
            <GlassCard className="relative overflow-hidden border-yellow-500/30">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-yellow-900/20 to-transparent pointer-events-none" />
                <div className="relative z-10 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-black/40 rounded-full border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                            <CrownIcon className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-yellow-100 uppercase tracking-tight">Premium Soberano</h2>
                            <p className="text-yellow-500/80 text-sm font-bold uppercase tracking-wider">Assinatura Mensal</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-300">
                        {ECONOMY.gold_products.premium_monthly.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <CheckIcon className="w-4 h-4 text-green-400" />
                                <span>{benefit}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col items-center gap-2 min-w-[150px]">
                        {(userProfile.isPremium || userProfile.role === 'admin' || userProfile.role === 'gm') ? (
                            <button disabled className="w-full py-3 bg-green-500/20 border border-green-500/50 text-green-400 font-black uppercase tracking-wider rounded-xl cursor-default">
                                ATIVO
                            </button>
                        ) : (
                            <button 
                                onClick={handleBuyPremium}
                                disabled={!!loading}
                                className="w-full py-3 rounded-xl luxe-skin-button disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading === 'premium' ? '...' : `${ECONOMY.gold_products.premium_monthly.cost} 🪙`}
                            </button>
                        )}
                        <span className="text-[10px] text-gray-500 uppercase font-bold">30 Dias de Duração</span>
                    </div>
                </div>
            </GlassCard>

            {/* Gold Packs */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">💰</span> Pacotes de Ouro
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {ECONOMY.gold_packs.map((pack) => (
                        <GlassCard key={pack.id} className="p-3 flex flex-col items-center text-center space-y-2 hover:bg-white/5 transition-colors group relative overflow-hidden">
                            {pack.bonus > 0 && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-[9px] font-bold text-green-400 uppercase tracking-wider">
                                    +{pack.bonus} Bônus
                                </div>
                            )}
                            
                            <div className="text-4xl group-hover:scale-110 transition-transform duration-300 filter drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">
                                {pack.icon}
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-white">{pack.name}</h4>
                                <div className="text-2xl font-black text-[var(--gold)]">{pack.total}</div>
                            </div>

                            <button 
                                onClick={() => handleBuyPack(pack.id)}
                                disabled={!!loading}
                                className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
                            >
                                {loading === pack.id ? '...' : `R$ ${pack.price_brl.toFixed(2)}`}
                            </button>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Other Products (Boosts, Codexes) - Placeholder for now or implementation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Boosts */}
                <GlassCard className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>⚡</span> Boosts de XP
                    </h3>
                    <div className="space-y-3">
                         <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                            <div>
                                <div className="font-bold text-purple-300">Boost 24h (2x XP)</div>
                                <div className="text-xs text-gray-500">Dobre seus ganhos por 1 dia</div>
                            </div>
                            <button 
                                onClick={() => buyStoreItem('boost_xp_24h', 'boost')}
                                className="px-4 py-2 bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/30 rounded-lg text-sm font-bold hover:bg-[var(--gold)]/20"
                            >
                                {ECONOMY.gold_products.boost_24h} 🪙
                            </button>
                         </div>
                         <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                            <div>
                                <div className="font-bold text-purple-300">Boost 7 Dias (2x XP)</div>
                                <div className="text-xs text-gray-500">Dobre seus ganhos por uma semana</div>
                            </div>
                            <button 
                                onClick={() => buyStoreItem('boost_xp_7d', 'boost')}
                                className="px-4 py-2 bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/30 rounded-lg text-sm font-bold hover:bg-[var(--gold)]/20"
                            >
                                {ECONOMY.gold_products.boost_7d} 🪙
                            </button>
                         </div>
                    </div>
                </GlassCard>

                {/* Coming Soon */}
                <GlassCard className="p-6 flex flex-col items-center justify-center text-center opacity-60">
                    <div className="text-4xl mb-2">🎁</div>
                    <h3 className="text-lg font-bold text-gray-300">Items Exclusivos</h3>
                    <p className="text-sm text-gray-500">Ofertas rotativas em breve.</p>
                </GlassCard>
            </div>

            {selectedPack && (
                <MercadoPagoBrick
                    amount={selectedPack.amount}
                    goldAmount={selectedPack.goldAmount}
                    onClose={() => setSelectedPack(null)}
                />
            )}
        </div>
    );
};
