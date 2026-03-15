import React, { useEffect, useState } from 'react';

export type ClosedBetaInviteValidationResult = {
  success: boolean;
  error?: string;
  successMessage?: string;
  pendingMessage?: string;
  onSuccess?: () => void | Promise<void>;
  successDelayMs?: number;
};

export const ClosedBetaInviteModal: React.FC<{
  open: boolean;
  title?: string;
  description: string;
  emailLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void | Promise<void>;
  onValidateInvite: (inviteCode: string) => Promise<ClosedBetaInviteValidationResult>;
}> = ({
  open,
  title = 'Insira seu Bilhete',
  description,
  emailLabel,
  confirmLabel = 'Validar',
  cancelLabel = 'Cancelar',
  onCancel,
  onValidateInvite,
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setInviteCode('');
      setIsSubmitting(false);
      setError(null);
      setSuccessMessage(null);
      setPendingMessage(null);
    }
  }, [open]);

  if (!open) return null;

  const handleValidate = async () => {
    const normalizedInvite = inviteCode.trim();
    if (!normalizedInvite) {
      setError('Insira seu Bilhete Dourado.');
      setSuccessMessage(null);
      setPendingMessage(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setPendingMessage('Validando Bilhete Dourado...');

    try {
      const result = await onValidateInvite(normalizedInvite);
      if (!result.success) {
        setPendingMessage(null);
        setError(result.error || 'Bilhete negado.');
        return;
      }

      setPendingMessage(null);
      setSuccessMessage(result.successMessage || 'Bilhete aceito!');

      const delayMs = result.successDelayMs ?? 850;
      await new Promise(resolve => window.setTimeout(resolve, delayMs));
      await result.onSuccess?.();
    } catch (submitError: any) {
      setPendingMessage(null);
      setError(submitError?.message || 'Nao consegui validar seu acesso agora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setPendingMessage(null);
    try {
      await onCancel();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[30000] flex items-center justify-center bg-black/88 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-[1.75rem] border border-[var(--skin-accent-color)]/35 bg-[linear-gradient(180deg,rgba(18,14,8,0.98),rgba(5,5,7,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="mb-4">
          <div className="inline-flex rounded-full border border-[var(--skin-accent-color)]/25 bg-[var(--skin-accent-color)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--skin-accent-color)]">
            Bilhete Dourado
          </div>
          <h2 className="mt-3 text-lg font-black uppercase tracking-[0.12em] text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/68">
            {description}
          </p>
          {emailLabel && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/42">
              {emailLabel}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            placeholder="Cole aqui seu Bilhete Dourado"
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/28 focus:outline-none focus:border-[var(--skin-accent-color)] disabled:opacity-60"
          />
          {pendingMessage && (
            <p className="text-sm font-semibold text-[var(--skin-accent-color)]">
              {pendingMessage}
            </p>
          )}
          {successMessage && (
            <p className="text-sm font-semibold text-emerald-400">
              {successMessage}
            </p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => void handleCancel()}
            disabled={isSubmitting}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => void handleValidate()}
            disabled={isSubmitting}
            className="flex-1 rounded-2xl bg-[var(--skin-accent-color)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_0_20px_rgba(212,175,55,0.25)] disabled:opacity-60"
          >
            {isSubmitting ? 'Validando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
