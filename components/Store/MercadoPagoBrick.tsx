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
    const [paymentResult, setPaymentResult] = useState<any>(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://sdk.mercadopago.com/js/v2";
        script.async = true;
        script.onload = () => initMP();
        document.body.appendChild(script);

        const initMP = async () => {
            try {
                // Força locale pt-BR para garantir termos em português e suporte nativo ao Pix
                const mp = new window.MercadoPago(import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY, {
                    locale: 'pt-BR'
                });
                const bricksBuilder = mp.bricks();

                // 1. Buscar o Preference ID da Edge Function
                const preferenceId = await fetchPreferenceId();

                if (!preferenceId) {
                    showToast("Erro ao gerar preferência de pagamento.");
                    onClose();
                    return;
                }

                // 2. Renderizar o Checkout Brick com melhorias de UX
                const settings = {
                    initialization: {
                        amount: amount,
                        preferenceId: preferenceId,
                    },
                    customization: {
                        visual: {
                            theme: 'dark',
                            style: {
                                customVariables: {
                                    formPadding: '12px',
                                    baseColor: 'var(--skin-accent-color)',
                                }
                            }
                        },
                        paymentMethods: {
                            ticket: "all",
                            bankTransfer: ["pix"],
                            creditCard: "all",
                            mercadoPago: "all",
                            maxInstallments: 1
                        },
                    },
                    callbacks: {
                        onReady: () => setLoading(false),
                        onSubmit: async ({ formData }: any) => {
                            try {
                                // Se estivermos em Sandbox, enviamos um e-mail que o MP aceite
                                const testEmail = "comprador_teste_glyph@test.com";
                                formData.payer.email = testEmail;

                                const response = await fetch(`${EDGE_FUNCTION_URL}/process_payment`, {
                                    method: "POST",
                                    headers: { 
                                        "Content-Type": "application/json",
                                        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
                                        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                                    },
                                    body: JSON.stringify({
                                        formData,
                                        userId: userProfile.id,
                                        goldAmount: goldAmount,
                                        amount: amount
                                    }),
                                });

                                const result = await response.json();
                                
                                if (result.id) {
                                    setPaymentResult(result);
                                    return result;
                                } else {
                                    throw new Error(result.error || 'Erro no processamento');
                                }
                            } catch (error: any) {
                                console.error("Erro no processamento:", error);
                                showToast(error.message || "Falha na comunicação");
                                throw error;
                            }
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
                        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
                        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
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
                <GlassCard className="relative flex max-h-[86vh] w-full max-w-md flex-col overflow-hidden rounded-[30px] border-[var(--skin-accent-color)]/20 shadow-2xl">
                    <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-md">
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">
                                {paymentResult ? 'Aguardando Pagamento' : 'Pagamento Seguro'}
                            </h2>
                            <p className="text-[10px] text-[var(--skin-accent-color)] font-bold uppercase tracking-widest">
                                🪙 {goldAmount} • R$ {amount.toFixed(2)}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white hover:scale-110">
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="custom-scrollbar flex min-h-[320px] flex-1 flex-col overflow-y-auto bg-black/60 p-2 scroll-smooth">
                        {loading && !paymentResult && (
                            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                <div className="w-10 h-10 border-4 border-[var(--skin-accent-color)] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.3em] animate-pulse">Conectando ao Mercado Pago...</p>
                            </div>
                        )}

                        {paymentResult ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-10 px-6 text-center space-y-6 animate-fade-in">
                                <div className="w-20 h-20 bg-[var(--skin-accent-color)]/10 rounded-full flex items-center justify-center border border-[var(--skin-accent-color)]/30">
                                    <div className="w-12 h-12 border-4 border-[var(--skin-accent-color)] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">QR Code Pix Gerado!</h3>
                                    <p className="text-sm text-gray-400">
                                        O QR Code foi enviado ao seu e-mail. Se estiver em produção, ele aparecerá aqui. 
                                        Para testes, aprove no seu 
                                        <a href="https://www.mercadopago.com.br/developers/panel/activities" target="_blank" className="text-[var(--skin-accent-color)] ml-1 underline">Painel do Mercado Pago</a>.
                                    </p>
                                </div>

                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 w-full space-y-3">
                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider">
                                        <span className="text-gray-500">Status</span>
                                        <span className="text-yellow-500 animate-pulse">Pendente</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider">
                                        <span className="text-gray-500">ID da Transação</span>
                                        <span className="text-gray-300">{paymentResult.id}</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={onClose}
                                    className="luxe-skin-button w-full rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-all"
                                >
                                    Fechar e Aguardar Ouro
                                </button>
                            </div>
                        ) : (
                            <div id="paymentBrick_container" className="transition-opacity duration-500"></div>
                        )}
                    </div>

                    <div className="p-2 border-t border-white/5 text-center bg-black/40 backdrop-blur-md">
                        <p className="text-[8px] text-gray-500 uppercase font-bold tracking-[0.4em] opacity-40">
                            Tecnologia Mercado Pago • Pix Instantâneo
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
