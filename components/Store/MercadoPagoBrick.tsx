import React, { useEffect, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { XIcon } from '../Icons';
import { Portal } from '../Portal';

interface MercadoPagoBrickProps {
    amount: number;
    goldAmount: number;
    onClose: () => void;
}

declare global {
    interface Window {
        MercadoPago: any;
    }
}

// URL da sua Edge Function no Supabase (substitua pelo seu ID do projeto se necessário)
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0];
const EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/mercadopago`;

export const MercadoPagoBrick: React.FC<MercadoPagoBrickProps> = ({ amount, goldAmount, onClose }) => {
    const { userProfile, showToast } = useGame();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://sdk.mercadopago.com/js/v2";
        script.async = true;
        script.onload = () => initMP();
        document.body.appendChild(script);

        const initMP = async () => {
            try {
                const mp = new window.MercadoPago(import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY);
                const bricksBuilder = mp.bricks();

                // 1. Buscar o Preference ID da Edge Function
                const preferenceId = await fetchPreferenceId();

                if (!preferenceId) {
                    showToast("Erro ao gerar preferência de pagamento.");
                    onClose();
                    return;
                }

                // 2. Renderizar o Checkout Brick
                const settings = {
                    initialization: {
                        amount: amount,
                        preferenceId: preferenceId,
                    },
                    customization: {
                        visual: {
                            theme: 'dark', // Skin Dark solicitada
                        },
                        paymentMethods: {
                            ticket: "all",
                            bankTransfer: "all",
                            creditCard: "all",
                            mercadoPago: "all",
                        },
                    },
                    callbacks: {
                        onReady: () => setLoading(false),
                        onSubmit: ({ formData }: any) => {
                            // O processamento real acontece via Webhook, 
                            // mas o MP exige este callback no Checkout Pro/Bricks.
                            console.log("Pagamento enviado:", formData);
                            return Promise.resolve();
                        },
                        onError: (error: any) => {
                            console.error("MP Error:", error);
                            showToast("Erro no checkout do Mercado Pago.");
                        },
                    },
                };

                await bricksBuilder.create("payment", "paymentBrick_container", settings);
            } catch (err) {
                console.error("MP Init Error:", err);
                showToast("Falha ao carregar o sistema de pagamentos.");
            }
        };

        const fetchPreferenceId = async () => {
            try {
                const response = await fetch(`${EDGE_FUNCTION_URL}/checkout`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY // Necessário para Edge Functions
                    },
                    body: JSON.stringify({
                        userId: userProfile.id,
                        goldAmount: goldAmount,
                        amount: amount
                    }),
                });
                const data = await response.json();
                return data.preferenceId;
            } catch (err) {
                console.error("Fetch Preference Error:", err);
                return null;
            }
        };

        return () => {
            const container = document.getElementById('paymentBrick_container');
            if (container) container.innerHTML = '';
            document.body.removeChild(script);
        };
    }, [amount, goldAmount, userProfile.id]);

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[11000] flex items-center justify-center p-4 animate-fade-in">
                <GlassCard className="w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh] border-[var(--skin-accent-color)]/20">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Finalizar Compra</h2>
                            <p className="text-xs text-[var(--skin-accent-color)] font-bold uppercase tracking-wider">
                                {goldAmount} Ouros • R$ {amount.toFixed(2)}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/40 min-h-[400px]">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="w-12 h-12 border-4 border-[var(--skin-accent-color)] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Iniciando Conexão Segura...</p>
                            </div>
                        )}
                        <div id="paymentBrick_container"></div>
                    </div>

                    <div className="p-4 border-t border-white/10 text-center bg-black/20">
                        <p className="text-[9px] text-gray-500 uppercase font-bold tracking-[0.3em] opacity-50">
                            Ambiente Criptografado • Mercado Pago
                        </p>
                    </div>
                </GlassCard>
            </div>

            <style>{`
                #paymentBrick_container {
                    --mp-theme-color-primary: var(--skin-accent-color);
                    --mp-theme-color-secondary: #111;
                    --mp-theme-color-text: #fff;
                    --mp-theme-color-background: transparent;
                }
                .svelte-payment-brick {
                    background: transparent !important;
                }
                /* Ajuste para inputs do MP ficarem dark */
                .mp-brick-payment-form input {
                    background-color: rgba(255,255,255,0.05) !important;
                    border-color: rgba(255,255,255,0.1) !important;
                    color: white !important;
                }
            `}</style>
        </Portal>
    );
};
