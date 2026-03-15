import React, { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { SupabaseService } from '../services/SupabaseService';
import { saveClosedBetaGoogleRedirect } from '../utils/closedBetaAuth';
import { signOutAndClearSupabaseSession } from '../utils/authSession';
import { ensureClosedBetaUserProfile } from '../utils/closedBetaProfile';

export const ClosedBetaGoogleInviteModal: React.FC<{
  session: Session;
  onComplete: (session: Session) => void;
  onClose: () => void;
}> = ({ session, onComplete, onClose }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsSubmitting(true);
    setError(null);

    const deletionResult = await SupabaseService.deleteMyAccount({
      blockReentry: false,
      reason: 'closed_beta_google_invite_cancel',
    });
    if (!deletionResult.success) {
      console.error('Failed to delete provisional Google account after invite cancel:', deletionResult.error);
    }

    saveClosedBetaGoogleRedirect({
      mode: 'login',
      email: session.user.email || '',
      message: 'O acesso com Google foi encerrado porque o Bilhete Dourado nao foi validado. Quando tiver um bilhete, toque em Entrar com Google novamente.',
    });

    try {
      await signOutAndClearSupabaseSession('local');
    } catch (signOutError) {
      console.error('Failed to clear local Google session after invite cancel:', signOutError);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleValidateInvite = async () => {
    const normalizedInvite = inviteCode.trim();
    if (!normalizedInvite) {
      setError('Insira seu Bilhete Dourado.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const consumeResult = await SupabaseService.consumeGoldenInviteCodeDetailed(normalizedInvite, session.user.id);
      if (!consumeResult.success) {
        setError(SupabaseService.describeGoldenInviteConsumeError(consumeResult.error));
        setIsSubmitting(false);
        return;
      }

      const profileResult = await ensureClosedBetaUserProfile(session);
      if (!profileResult.success) {
        setError(profileResult.error || 'Nao consegui criar seu perfil depois de validar o bilhete.');
        setIsSubmitting(false);
        return;
      }

      onComplete(session);
    } catch (submitError: any) {
      setError(submitError?.message || 'Nao consegui validar seu acesso agora.');
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
            Insira seu Bilhete
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/68">
            Seu Google entrou, mas esta conta ainda nao foi liberada no beta. Valide o acesso com o Bilhete Dourado para continuar.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
            {session.user.email || 'Conta Google conectada'}
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            placeholder="Cole aqui seu Bilhete Dourado"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/28 focus:outline-none focus:border-[var(--skin-accent-color)]"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => void handleCancel()}
            disabled={isSubmitting}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={() => void handleValidateInvite()}
            disabled={isSubmitting}
            className="flex-1 rounded-2xl bg-[var(--skin-accent-color)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_0_20px_rgba(212,175,55,0.25)] disabled:opacity-60"
          >
            {isSubmitting ? 'Validando...' : 'Validar'}
          </button>
        </div>
      </div>
    </div>
  );
};
