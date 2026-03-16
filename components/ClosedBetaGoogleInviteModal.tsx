import React from 'react';
import type { Session } from '@supabase/supabase-js';
import { SupabaseService } from '../services/SupabaseService';
import { rememberClosedBetaGoogleAccess, saveClosedBetaGoogleRedirect } from '../utils/closedBetaAuth';
import { signOutAndClearSupabaseSession } from '../utils/authSession';
import { ensureClosedBetaUserProfile } from '../utils/closedBetaProfile';
import { ClosedBetaInviteModal } from './ClosedBetaInviteModal';

export const ClosedBetaGoogleInviteModal: React.FC<{
  session: Session;
  onComplete: (session: Session) => void;
  onClose: () => void;
}> = ({ session, onComplete, onClose }) => {
  const handleCancel = async () => {
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
    }

    onClose();
  };

  const handleValidateInvite = async (normalizedInvite: string) => {
    try {
      const consumeResult = await SupabaseService.consumeGoldenInviteCodeDetailed(normalizedInvite, session.user.id);
      if (!consumeResult.success) {
        return {
          success: false,
          error: SupabaseService.describeGoldenInviteConsumeError(consumeResult.error),
        };
      }

      const profileResult = await ensureClosedBetaUserProfile(session);
      if (!profileResult.success) {
        return {
          success: false,
          error: profileResult.error || 'Nao consegui criar seu perfil depois de validar o bilhete.',
        };
      }

      return {
        success: true,
        successMessage: 'Bilhete aceito! Liberando sua conta...',
        onSuccess: () => {
          rememberClosedBetaGoogleAccess(session.user.id, session.user.email);
          onComplete(session);
        },
      };
    } catch (submitError: any) {
      return {
        success: false,
        error: submitError?.message || 'Nao consegui validar seu acesso agora.',
      };
    }
  };

  return (
    <ClosedBetaInviteModal
      open={true}
      title="Insira seu Bilhete"
      description="Seu Google entrou, mas esta conta ainda nao foi liberada no beta. Valide o acesso com o Bilhete Dourado para continuar."
      emailLabel={session.user.email || 'Conta Google conectada'}
      onCancel={handleCancel}
      onValidateInvite={handleValidateInvite}
    />
  );
};
