import React, { useEffect, useState } from 'react';
import { Portal } from './Portal';
import { supabase } from '../supabaseClient';
import { useLongPress } from '../hooks/useLongPress';
import { LEGAL_PRIVACY_URL_PLACEHOLDER, LEGAL_TERMS_URL_PLACEHOLDER } from '../constants/legal';

const OracleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4Z" fill="url(#oracle-gradient-terms)" fillOpacity="0.2" />
        <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8Z" fill="url(#oracle-gradient-terms)" />
        <defs>
            <linearGradient id="oracle-gradient-terms" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFD700" />
                <stop offset="1" stopColor="#FF8C00" />
            </linearGradient>
        </defs>
    </svg>
);

export const TermsOverlay: React.FC<{ open: boolean; onAccept: () => void }> = ({ open, onAccept }) => {
    const clauses = [
        {
            title: 'O DESPERTAR DO SOBERANO',
            text: 'Ao seguir, voce confirma que leu este resumo de aceite. O uso do GLYPH tambem e regido pelos Termos de Uso e pela Politica de Privacidade completos, disponiveis para consulta permanente.',
        },
        {
            title: 'I. CONTA E DADOS ESSENCIAIS',
            text: 'Para criar e manter sua conta, tratamos dados como e-mail, autenticacao, nickname, perfil basico e registros necessarios para operar, sincronizar e proteger o app.',
        },
        {
            title: 'II. RECURSOS SOCIAIS E PARCEIROS',
            text: 'Mentoria, grupos, amizades, mensagens, uploads e Oraculo podem envolver compartilhamento de perfil, progresso, imagens e conteudo conforme sua acao no app. Uploads e anexos podem ficar acessiveis por link. Para viabilizar o servico, usamos parceiros de autenticacao, infraestrutura, IA e pagamento.',
        },
        {
            title: 'III. COMPRAS E LIMITES DO SERVICO',
            text: 'Compras de recursos digitais sao processadas por parceiro de pagamento e so geram credito apos confirmacao. O GLYPH e uma ferramenta de organizacao e jogo, nao substitui orientacao medica, psicologica, juridica ou financeira.',
        },
        {
            title: 'IV. SEUS DIREITOS E SUA SAIDA',
            text: 'Voce pode solicitar acesso, correcao e exclusao dos seus dados na forma da lei. A exclusao da conta pode preservar registros minimos exigidos por obrigacao legal, seguranca e prevencao a fraude. Ao selar, voce aceita estas condicoes.',
        },
    ];
    const [step, setStep] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isHolding, setIsHolding] = useState(false);
    const [isSealing, setIsSealing] = useState(false);
    const holdDurationMs = 800;
    const currentClause = clauses[step];
    const isLast = step === clauses.length - 1;

    useEffect(() => {
        if (!open) return;
        setTypedText('');
        setIsTyping(true);
        setIsHolding(false);
        let i = 0;
        const timer = window.setInterval(() => {
            i += 1;
            setTypedText(currentClause.text.slice(0, i));
            if (i >= currentClause.text.length) {
                window.clearInterval(timer);
                setIsTyping(false);
            }
        }, 20);
        return () => window.clearInterval(timer);
    }, [step, open, currentClause.text]);

    const handleAccept = () => {
        setIsHolding(false);
        setIsSealing(true);
        window.setTimeout(() => {
            setIsSealing(false);
            setStep(0);
            onAccept();
        }, 820);
    };

    const longPressEvents = useLongPress({
        onLongPress: () => {
            if (isTyping) {
                setTypedText(currentClause.text);
                setIsTyping(false);
            }
            if (isLast) handleAccept();
        },
        onLongPressCancel: () => setIsHolding(false),
        onLongPressRelease: () => setIsHolding(false),
        onClick: () => {
            setIsHolding(false);
            if (isTyping) {
                setTypedText(currentClause.text);
                setIsTyping(false);
                return;
            }
            if (!isLast) {
                setStep((prev) => Math.min(prev + 1, clauses.length - 1));
            }
        },
        delay: holdDurationMs,
        preventDefaultOnTouch: true,
    });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isLast) setIsHolding(true);
        longPressEvents.onMouseDown?.(e);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.cancelable) e.preventDefault();
        if (isLast) setIsHolding(true);
        longPressEvents.onTouchStart?.(e);
    };

    if (!open) return null;

    return (
        <Portal>
            <div
                className="fixed inset-0 z-[20000] flex items-center justify-center animate-fade-in"
                style={{ background: 'radial-gradient(circle at center, #0A0A0A 0%, #000000 72%)' }}
            >
                <div className="absolute inset-4 pointer-events-none rounded-[32px] border border-white/10" />
                {isSealing && <div className="absolute inset-0 z-40 animate-fade-in bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.18),rgba(0,0,0,0.96)_68%)]" />}

                <div className="relative mx-auto flex w-full max-w-[min(92vw,42rem)] flex-col items-center px-4 sm:px-6">
                    <div className="terms-contract-shell relative w-full">
                        {isSealing && (
                            <>
                                <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-[24px]">
                                    <div className="terms-seal-shutter terms-seal-shutter--top" />
                                    <div className="terms-seal-shutter terms-seal-shutter--bottom" />
                                </div>
                                <div className="terms-seal-emblem pointer-events-none absolute left-1/2 top-1/2 z-40 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[var(--gold)]/50 bg-[radial-gradient(circle,#fff4c2_0%,#f4cd67_42%,#6c4a06_100%)] text-black shadow-[0_0_40px_rgba(255,215,0,0.35)]">
                                    <OracleIcon className="h-9 w-9 opacity-90" />
                                    <span className="mt-1 text-[10px] font-black uppercase tracking-[0.28em]">PACTO</span>
                                </div>
                            </>
                        )}

                        <div className={`animate-fade-in-down flex w-full gap-4 rounded-[24px] border border-black/10 border-b-4 border-b-[var(--gold)] bg-white/90 p-4 shadow-2xl backdrop-blur-xl md:p-6 ${isSealing ? 'terms-contract-card--sealing' : ''}`}>
                        <div className="flex-shrink-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--gold)] bg-gradient-to-br from-gray-100 to-white shadow-lg md:h-16 md:w-16">
                                <OracleIcon className="h-8 w-8 opacity-80 md:h-10 md:w-10" />
                            </div>
                        </div>

                        <div className="flex min-h-[120px] flex-grow flex-col justify-between">
                            <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold)] drop-shadow-sm md:text-sm">
                                            {currentClause.title}
                                        </h3>
                                        <span className="font-mono text-[8px] text-gray-400 md:text-[10px]">
                                            CLÁUSULA {step + 1} / {clauses.length}
                                        </span>
                                    </div>
                                </div>
                                <p className="min-h-[80px] whitespace-pre-wrap font-mono text-xs font-medium leading-relaxed text-gray-900 md:text-sm">
                                    {typedText}
                                    {isTyping && <span className="ml-1 inline-block h-3 w-1 animate-pulse align-middle bg-[var(--gold)] opacity-70 md:h-4 md:w-2" />}
                                </p>
                            </div>

                            <div className="mt-4 flex w-full justify-center">
                                <div
                                    className={`relative flex cursor-pointer select-none flex-col items-center justify-center gap-1 border-2 border-[var(--gold)] shadow-[0_0_15px_rgba(184,134,11,0.2)] transition-all hover:shadow-[0_0_25px_rgba(184,134,11,0.4)] active:scale-95 ${
                                        isLast ? 'h-24 w-24 rounded-full md:h-32 md:w-32' : 'w-full rounded-xl px-10 py-4'
                                    }`}
                                    onMouseDown={handleMouseDown}
                                    onTouchStart={handleTouchStart}
                                    onContextMenu={longPressEvents.onContextMenu}
                                    style={{
                                        touchAction: 'none',
                                        userSelect: 'none',
                                        WebkitUserSelect: 'none',
                                        WebkitTouchCallout: 'none',
                                    } as React.CSSProperties}
                                >
                                    <span
                                        className={`luxe-title-shadow font-black uppercase text-[var(--gold)] ${
                                            isLast ? 'text-sm tracking-widest md:text-base' : 'text-xs tracking-[0.4em] md:text-sm'
                                        }`}
                                    >
                                        {isLast ? (isHolding ? 'FIRMAR...' : 'ACEITAR') : 'PRÓXIMO'}
                                    </span>
                                    <span className={`${isLast ? 'text-gray-400' : 'text-gray-500'} px-2 text-center text-[9px] font-bold uppercase tracking-[0.1em] md:text-[10px]`}>
                                        {isHolding ? 'ASSINANDO' : isLast ? 'SEGURE' : 'AVANÇAR'}
                                    </span>

                                    {isLast ? (
                                        <svg className="pointer-events-none absolute inset-0 h-full w-full -rotate-90">
                                            <circle
                                                cx="50%"
                                                cy="50%"
                                                r="48%"
                                                stroke="var(--gold)"
                                                strokeWidth="4"
                                                fill="transparent"
                                                className="transition-all duration-100 ease-linear"
                                                style={{ strokeDashoffset: isHolding ? 0 : 315, strokeDasharray: 315, opacity: isHolding ? 1 : 0 }}
                                            />
                                        </svg>
                                    ) : (
                                        <div
                                            className="absolute bottom-0 left-0 h-0.5 rounded-full bg-[var(--gold)] shadow-[0_0_15px_var(--gold)] transition-all duration-100 ease-linear"
                                            style={{ width: `${isHolding ? 100 : 0}%`, opacity: isHolding ? 1 : 0 }}
                                        />
                                    )}

                                    {isHolding && isLast && <div className="pointer-events-none absolute inset-0 animate-pulse rounded-full bg-[var(--gold)]/10" />}
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-gray-500 md:text-[11px]">
                                <a
                                    href={LEGAL_TERMS_URL_PLACEHOLDER}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="transition-colors hover:text-[var(--gold)]"
                                >
                                    Termos completos
                                </a>
                                <span className="text-gray-400">?</span>
                                <a
                                    href={LEGAL_PRIVACY_URL_PLACEHOLDER}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="transition-colors hover:text-[var(--gold)]"
                                >
                                    Privacidade completa
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>

            <style>{`
                .animate-pulse-slow {
                    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .terms-contract-shell {
                    isolation: isolate;
                }
                .terms-contract-card--sealing {
                    animation: contract-seal-card 820ms cubic-bezier(0.18, 0.84, 0.32, 1) forwards;
                    transform-origin: center center;
                }
                .terms-seal-shutter {
                    position: absolute;
                    left: 0;
                    right: 0;
                    height: 52%;
                    background:
                        linear-gradient(180deg, rgba(255, 247, 214, 0.96), rgba(230, 190, 95, 0.95) 58%, rgba(102, 70, 10, 0.98)),
                        radial-gradient(circle at center, rgba(255, 255, 255, 0.24), transparent 70%);
                    box-shadow: inset 0 0 0 1px rgba(255, 236, 170, 0.45);
                }
                .terms-seal-shutter--top {
                    top: 0;
                    transform: translateY(-110%);
                    border-radius: 24px 24px 0 0;
                    animation: contract-shutter-top 620ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                .terms-seal-shutter--bottom {
                    bottom: 0;
                    transform: translateY(110%);
                    border-radius: 0 0 24px 24px;
                    animation: contract-shutter-bottom 620ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                .terms-seal-emblem {
                    opacity: 0;
                    animation: contract-seal-emblem 720ms cubic-bezier(0.12, 0.9, 0.24, 1) forwards;
                }
                @keyframes contract-seal-card {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                        filter: blur(0);
                    }
                    38% {
                        transform: scale(0.985) translateY(2px);
                        opacity: 1;
                        filter: blur(0);
                    }
                    100% {
                        transform: scale(0.95) translateY(12px);
                        opacity: 0.08;
                        filter: blur(6px);
                    }
                }
                @keyframes contract-shutter-top {
                    0% { transform: translateY(-110%); }
                    100% { transform: translateY(0); }
                }
                @keyframes contract-shutter-bottom {
                    0% { transform: translateY(110%); }
                    100% { transform: translateY(0); }
                }
                @keyframes contract-seal-emblem {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -52%) scale(0.72);
                    }
                    45% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.04);
                    }
                    100% {
                        opacity: 0.96;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
            `}</style>
        </Portal>
    );
};

export const OfflineOverlay: React.FC<{ open: boolean }> = ({ open }) => {
    if (!open) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90 backdrop-blur-sm safe-area-top safe-area-bottom">
                <div className="mx-auto w-full max-w-sm space-y-3 p-6 text-center">
                    <div className="text-3xl">📡</div>
                    <h2 className="text-lg font-black tracking-wider text-white">Conectando ao servidor da Liga...</h2>
                    <p className="text-xs text-gray-400">Sem internet. Verifique sua conexão para continuar.</p>
                </div>
            </div>
        </Portal>
    );
};

export const ResetPasswordOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async () => {
        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;
            setSuccess(true);
            window.setTimeout(onClose, 2000);
        } catch (err: any) {
            setError(err.message || 'Erro ao redefinir senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[30000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
                <div className="relative mx-auto w-full max-w-sm space-y-6 overflow-hidden rounded-2xl border border-[var(--gold)]/30 bg-black/40 p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                    <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-50" />

                    <div className="space-y-2 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--gold)]/50 bg-black/60 shadow-[0_0_20px_rgba(184,134,11,0.2)]">
                            <OracleIcon className="h-10 w-10 animate-pulse-slow text-[var(--gold)]" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--gold)]">Redefinir Consciência</h2>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500">Digite sua nova chave de acesso</p>
                    </div>

                    {success ? (
                        <div className="animate-fade-in py-8 text-center">
                            <div className="mb-2 text-green-500">✓</div>
                            <p className="text-xs font-bold uppercase tracking-widest text-white">CONSCIÊNCIA RESTAURADA</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <input
                                type="password"
                                placeholder="Nova Senha"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white placeholder-gray-600 transition-colors focus:border-[var(--gold)] focus:outline-none"
                            />
                            {error && <p className="text-center text-[10px] font-bold uppercase tracking-tight text-red-500">{error}</p>}
                            <button
                                onClick={handleReset}
                                disabled={loading}
                                className="w-full rounded-xl bg-gradient-to-b from-[var(--gold)] to-[#8B6508] py-3 text-xs font-black tracking-[0.2em] text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? 'RESTAURANDO...' : 'ATUALIZAR CHAVE'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Portal>
    );
};


