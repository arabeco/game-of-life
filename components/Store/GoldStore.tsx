import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { ECONOMY } from '../../constants/economy';
import { CheckIcon, CrownIcon } from '../Icons';
import { MercadoPagoBrick } from './MercadoPagoBrick';

export const GoldStore: React.FC = () => {
    const { buyStoreItem, userProfile } = useGame();
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedPack, setSelectedPack] = useState<{ amount: number; goldAmount: number } | null>(null);

    const handleBuyPack = async (packId: string) => {
        const pack = ECONOMY.gold_packs.find(p => p.id === packId);
        if (!pack) return;

        setSelectedPack({ amount: pack.price_brl, goldAmount: pack.total });
    };

    const handleBuyPremium = async () => {
        if (loading) return;
        setLoading('premium');
        try {
            await buyStoreItem('premium_30d', 'premium');
        } catch (error) {
            console.error('Premium purchase failed', error);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <GlassCard className="relative overflow-hidden border-yellow-500/30">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/20 via-yellow-500/5 to-transparent pointer-events-none" />
                <div className="relative z-10 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-black/40 rounded-full border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.25)]">
                            <CrownIcon className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-yellow-100 uppercase tracking-tight">Premium Soberano</h2>
                            <p className="text-yellow-500/80 text-sm font-bold uppercase tracking-wider">Assinatura mensal</p>
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
                        {userProfile.isPremium || userProfile.role === 'admin' || userProfile.role === 'gm' ? (
                            <button disabled className="w-full py-3 bg-green-500/20 border border-green-500/50 text-green-400 font-black uppercase tracking-wider rounded-xl cursor-default">
                                ATIVO
                            </button>
                        ) : (
                            <button
                                onClick={handleBuyPremium}
                                disabled={!!loading}
                                className="luxe-skin-button inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className="text-[12px] leading-none">🪙</span>
                                <span>{loading === 'premium' ? '...' : ECONOMY.gold_products.premium_monthly.cost}</span>
                            </button>
                        )}
                        <span className="text-[10px] text-gray-500 uppercase font-bold">30 dias</span>
                    </div>
                </div>
            </GlassCard>

            <div>
                <h3 className="text-lg font-bold text-white mb-4">Pacotes de Ouro</h3>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {ECONOMY.gold_packs.map((pack) => (
                        <GlassCard key={pack.id} className="p-3 flex flex-col items-center text-center space-y-2 hover:bg-white/5 transition-colors group relative overflow-hidden">
                            {pack.bonus > 0 && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-[9px] font-bold text-green-400 uppercase tracking-wider">
                                    +{pack.bonus} bonus
                                </div>
                            )}

                            <div className="text-4xl group-hover:scale-110 transition-transform duration-300 filter drop-shadow-[0_0_10px_rgba(255,215,0,0.25)]">
                                {pack.icon}
                            </div>

                            <div>
                                <h4 className="font-bold text-white">{pack.name}</h4>
                                <div className="text-2xl font-black text-[var(--gold)]">{pack.total}</div>
                            </div>

                            <button
                                onClick={() => handleBuyPack(pack.id)}
                                disabled={!!loading}
                                className="luxe-skin-button w-full rounded-xl py-2 text-sm font-bold disabled:opacity-50"
                            >
                                {loading === pack.id ? '...' : `R$ ${pack.price_brl.toFixed(2)}`}
                            </button>
                        </GlassCard>
                    ))}
                </div>
            </div>

            <GlassCard className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-white">Boosts de XP</h3>
                        <p className="text-sm text-gray-500">Aceleradores simples para fases de execução pesada.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5 gap-3">
                        <div>
                            <div className="font-bold text-purple-300">Boost 24h (2x XP)</div>
                            <div className="text-xs text-gray-500">Dobra os ganhos por 1 dia.</div>
                        </div>
                        <button onClick={() => buyStoreItem('boost_xp_24h', 'boost')} className="luxe-skin-button inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold">
                            <span className="text-[11px] leading-none">🪙</span>
                            <span>{ECONOMY.gold_products.boost_24h}</span>
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5 gap-3">
                        <div>
                            <div className="font-bold text-purple-300">Boost 7 dias (2x XP)</div>
                            <div className="text-xs text-gray-500">Dobra os ganhos por uma semana.</div>
                        </div>
                        <button onClick={() => buyStoreItem('boost_xp_7d', 'boost')} className="luxe-skin-button inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold">
                            <span className="text-[11px] leading-none">🪙</span>
                            <span>{ECONOMY.gold_products.boost_7d}</span>
                        </button>
                    </div>
                </div>
            </GlassCard>

            {selectedPack && <MercadoPagoBrick amount={selectedPack.amount} goldAmount={selectedPack.goldAmount} onClose={() => setSelectedPack(null)} />}
        </div>
    );
};
