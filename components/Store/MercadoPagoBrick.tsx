import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { supabase } from '../../supabaseClient';
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

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0];
const EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/mercadopago`;
const FALLBACK_TEST_EMAIL = 'comprador_teste_glyph@test.com';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MERCADO_PAGO_STATUS_LABELS: Record<string, string> = {
    pending: 'aguardando pagamento',
    pending_waiting_transfer: 'aguardando pagamento via Pix',
    in_process: 'validando pagamento',
    approved: 'pagamento aprovado',
    authorized: 'pagamento autorizado',
    rejected: 'pagamento rejeitado',
    cancelled: 'pagamento cancelado',
    charged_back: 'pagamento estornado',
    refunded: 'pagamento devolvido',
};

const getMercadoPagoStatusLabel = (paymentResult: any, creditDetected: boolean) => {
    if (creditDetected) return 'ouro adicionado a sua conta';

    const statusDetail = String(paymentResult?.status_detail || '').trim().toLowerCase();
    const status = String(paymentResult?.status || '').trim().toLowerCase();

    if (statusDetail && MERCADO_PAGO_STATUS_LABELS[statusDetail]) {
        return MERCADO_PAGO_STATUS_LABELS[statusDetail];
    }

    if (status && MERCADO_PAGO_STATUS_LABELS[status]) {
        return MERCADO_PAGO_STATUS_LABELS[status];
    }

    return 'aguardando confirmacao';
};

const isValidCheckoutEmail = (value: string) => EMAIL_REGEX.test(String(value || '').trim());

export const MercadoPagoBrick: React.FC<MercadoPagoBrickProps> = ({ amount, goldAmount, onClose }) => {
    const { userProfile, showToast, updateUserProfile } = useGame();
    const profileEmail = String(userProfile.email || '').trim();
    const initialCheckoutEmail = isValidCheckoutEmail(profileEmail) ? profileEmail : '';
    const [loading, setLoading] = useState(Boolean(initialCheckoutEmail));
    const [paymentResult, setPaymentResult] = useState<any>(null);
    const [creditDetected, setCreditDetected] = useState(false);
    const [emailInput, setEmailInput] = useState(initialCheckoutEmail);
    const [checkoutEmail, setCheckoutEmail] = useState(initialCheckoutEmail);
    const latestRefs = useRef({ onClose, showToast });
    const baselineGoldRef = useRef<number>(Number(userProfile.wallet?.gold || 0));
    const creditToastShownRef = useRef(false);
    const needsEmailStep = !isValidCheckoutEmail(checkoutEmail);

    const pixTransactionData = paymentResult?.point_of_interaction?.transaction_data ?? null;
    const pixQrCode = typeof pixTransactionData?.qr_code === 'string' ? pixTransactionData.qr_code : '';
    const pixQrCodeBase64 = typeof pixTransactionData?.qr_code_base64 === 'string' ? pixTransactionData.qr_code_base64 : '';
    const pixTicketUrl = typeof pixTransactionData?.ticket_url === 'string' ? pixTransactionData.ticket_url : '';
    const paymentStatusLabel = getMercadoPagoStatusLabel(paymentResult, creditDetected);

    useEffect(() => {
        latestRefs.current = { onClose, showToast };
    }, [onClose, showToast]);

    useEffect(() => {
        if (checkoutEmail) return;
        if (!isValidCheckoutEmail(profileEmail)) return;
        setEmailInput(profileEmail);
        setCheckoutEmail(profileEmail);
    }, [checkoutEmail, profileEmail]);

    useEffect(() => {
        baselineGoldRef.current = Number(userProfile.wallet?.gold || 0);
    }, []);

    const createPixCharge = async (payerEmail: string) => {
        const nextEmail = String(payerEmail || '').trim();
        if (!isValidCheckoutEmail(nextEmail)) {
            latestRefs.current.showToast('Digite um e-mail valido para continuar.', 'warning');
            return;
        }

        try {
            setLoading(true);
            setCheckoutEmail(nextEmail);
            setPaymentResult(null);

            const response = await fetch(`${EDGE_FUNCTION_URL}/process_payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                    formData: {
                        payer: {
                            email: nextEmail,
                        },
                    },
                    userId: userProfile.id,
                    goldAmount,
                    amount,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result?.id) {
                throw new Error(result?.error || 'Erro ao gerar o Pix.');
            }

            setPaymentResult(result);
        } catch (error: any) {
            console.error('Erro ao criar Pix:', error);
            latestRefs.current.showToast(error.message || 'Falha ao gerar o Pix.');
            setCheckoutEmail('');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isValidCheckoutEmail(initialCheckoutEmail)) {
            setLoading(false);
            return;
        }

        void createPixCharge(initialCheckoutEmail);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!paymentResult?.id || creditDetected) return;

        let cancelled = false;
        let attempts = 0;
        const maxAttempts = 45;

        const pollWallet = async () => {
            attempts += 1;
            const { data, error } = await supabase
                .from('user_profiles')
                .select('wallet')
                .eq('id', userProfile.id)
                .maybeSingle();

            if (cancelled) return;

            if (error) {
                console.warn('Erro ao verificar credito do Mercado Pago:', error.message);
                return;
            }

            const detectedGold = Number((data as any)?.wallet?.gold || 0);
            if (detectedGold > baselineGoldRef.current) {
                const gainedGold = detectedGold - baselineGoldRef.current;
                updateUserProfile({
                    wallet: {
                        ...(userProfile.wallet || { fragments: 0 }),
                        gold: detectedGold,
                        fragments: Number(userProfile.wallet?.fragments || 0),
                    },
                });
                setCreditDetected(true);
                if (!creditToastShownRef.current) {
                    creditToastShownRef.current = true;
                    showToast(`${gainedGold} de Ouro foram adicionados a sua conta.`, 'success');
                }
            }
        };

        void pollWallet();
        const interval = window.setInterval(() => {
            if (attempts >= maxAttempts || cancelled) {
                window.clearInterval(interval);
                return;
            }
            void pollWallet();
        }, 4000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [paymentResult?.id, creditDetected, showToast, updateUserProfile, userProfile.id, userProfile.wallet]);

    useEffect(() => {
        if (!creditDetected) return;

        const closeTimer = window.setTimeout(() => {
            onClose();
        }, 1600);

        return () => window.clearTimeout(closeTimer);
    }, [creditDetected, onClose]);

    const handleCopyPixCode = async () => {
        if (!pixQrCode) {
            showToast('O codigo Pix ainda nao foi retornado pelo Mercado Pago.', 'warning');
            return;
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(pixQrCode);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = pixQrCode;
                textarea.setAttribute('readonly', 'true');
                textarea.style.position = 'absolute';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            showToast('Codigo Pix copiado.', 'success');
        } catch (error) {
            console.error('Erro ao copiar codigo Pix:', error);
            showToast('Nao consegui copiar o codigo Pix.', 'error');
        }
    };

    const handleStartPayment = () => {
        const nextEmail = String(emailInput || '').trim();
        if (!isValidCheckoutEmail(nextEmail)) {
            showToast('Digite um e-mail valido para continuar.', 'warning');
            return;
        }
        void createPixCharge(nextEmail);
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/80 p-4 animate-fade-in backdrop-blur-md">
                <GlassCard className="relative flex max-h-[86vh] w-full max-w-md flex-col overflow-hidden rounded-[30px] border-[var(--skin-accent-color)]/20 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 bg-black/40 p-3 backdrop-blur-md">
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white">
                                {paymentResult ? (creditDetected ? 'Pagamento Confirmado' : 'Aguardando Pagamento') : 'Pagamento Seguro'}
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--skin-accent-color)]">
                                {goldAmount} ouro - R$ {amount.toFixed(2)}
                            </p>
                        </div>
                        <button onClick={onClose} className="rounded-full p-2 text-gray-400 transition-all hover:scale-110 hover:bg-white/10 hover:text-white">
                            <XIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="custom-scrollbar flex min-h-[320px] flex-1 flex-col overflow-y-auto bg-black/60 p-2 scroll-smooth">
                        {!paymentResult && needsEmailStep && !loading ? (
                            <div className="flex flex-1 flex-col justify-center gap-5 px-4 py-8">
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Digite o e-mail do pagador</h3>
                                    <p className="text-sm text-gray-400">
                                        O Mercado Pago precisa de um e-mail valido para gerar o Pix.
                                    </p>
                                </div>

                                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <label className="block text-left text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                                        E-mail
                                    </label>
                                    <input
                                        type="email"
                                        inputMode="email"
                                        autoComplete="email"
                                        placeholder="voce@exemplo.com"
                                        value={emailInput}
                                        onChange={(event) => setEmailInput(event.target.value)}
                                        disabled={loading}
                                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[var(--skin-accent-color)]"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleStartPayment}
                                        disabled={loading}
                                        className="luxe-skin-button w-full rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {loading ? 'Gerando Pix...' : 'Pagar'}
                                    </button>
                                </div>
                            </div>
                        ) : paymentResult ? (
                            <div className="flex flex-1 flex-col items-center justify-center space-y-6 px-6 py-10 text-center animate-fade-in">
                                <div className="w-full rounded-[28px] border border-[var(--skin-accent-color)]/25 bg-black/35 p-4 shadow-[0_0_30px_rgba(0,0,0,0.24)]">
                                    <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-[24px] border border-white/10 bg-white p-3 shadow-inner">
                                        {pixQrCodeBase64 ? (
                                            <img
                                                src={`data:image/png;base64,${pixQrCodeBase64}`}
                                                alt="QR Code Pix"
                                                className="h-full w-full rounded-[18px] object-contain"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full flex-col items-center justify-center rounded-[18px] bg-slate-950/90 px-4 text-center">
                                                <div className="h-10 w-10 rounded-full border-2 border-[var(--skin-accent-color)]/35 border-t-[var(--skin-accent-color)] animate-spin" />
                                                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">
                                                    QR aguardando retorno
                                                </p>
                                                <p className="mt-2 text-xs text-slate-500">
                                                    A cobranca foi criada, mas o QR ainda nao voltou nesta resposta.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">Pix pronto para pagar</h3>
                                    <p className="text-sm text-gray-400">
                                        Escaneie o QR Code ou copie o codigo Pix abaixo. O ouro entra depois da aprovacao do pagamento.
                                    </p>
                                </div>

                                <div className="w-full space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="text-left">
                                        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                                            Codigo Pix copia e cola
                                        </div>
                                        <div className="mt-2 break-all rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-white">
                                            {pixQrCode || 'O Mercado Pago ainda nao retornou o codigo copia e cola nesta resposta.'}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={handleCopyPixCode}
                                            disabled={!pixQrCode}
                                            className="luxe-skin-button flex-1 rounded-xl py-3 text-[11px] font-bold uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Copiar codigo Pix
                                        </button>
                                        {pixTicketUrl && (
                                            <a
                                                href={pixTicketUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-white/5"
                                            >
                                                Abrir cobranca
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="w-full space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                        <span className="text-gray-500">Status</span>
                                        <span className={creditDetected ? 'text-emerald-400' : 'animate-pulse text-yellow-500'}>
                                            {paymentStatusLabel}
                                        </span>
                                    </div>
                                    <div className="flex justify-between gap-3 text-[10px] font-bold uppercase tracking-wider">
                                        <span className="text-gray-500">ID da Transacao</span>
                                        <span className="break-all text-right text-gray-300">{paymentResult.id}</span>
                                    </div>
                                    {creditDetected && (
                                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                                            O ouro ja foi adicionado a sua conta.
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={onClose}
                                    className="luxe-skin-button w-full rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-all"
                                >
                                    {creditDetected ? 'Fechando...' : 'Fechar e Aguardar Ouro'}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
                                <div className="h-10 w-10 rounded-full border-4 border-[var(--skin-accent-color)] border-t-transparent animate-spin" />
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                                        E-mail do pagador
                                    </div>
                                    <div className="text-sm font-semibold text-white">{checkoutEmail}</div>
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">
                                    Gerando cobranca Pix...
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-white/5 bg-black/40 p-2 text-center backdrop-blur-md">
                        <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-gray-500 opacity-40">
                            Tecnologia Mercado Pago - Pix Instantaneo
                        </p>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
