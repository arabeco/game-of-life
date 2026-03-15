import React, { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { SupabaseService } from '../services/SupabaseService';
import { saveClosedBetaGoogleRedirect } from '../utils/closedBetaAuth';

const PROFILE_FLAG_TERMS_PENDING = '__flag_terms_pending_v1';

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

    const deletionResult = await SupabaseService.deleteMyAccount();
    if (!deletionResult.success) {
      console.error('Failed to delete provisional Google account after invite cancel:', deletionResult.error);
    }

    saveClosedBetaGoogleRedirect({
      mode: 'signup',
      email: session.user.email || '',
      message: 'O acesso com Google foi encerrado porque o Bilhete Dourado não foi validado.',
    });

    try {
      await supabase.auth.signOut({ scope: 'local' });
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
      const inviteRecord = await SupabaseService.checkGoldenInvite(normalizedInvite);
      if (!inviteRecord) {
        setError('Bilhete Dourado não encontrado.');
        setIsSubmitting(false);
        return;
      }

      if (inviteRecord.is_used) {
        setError('Bilhete Dourado já utilizado.');
        setIsSubmitting(false);
        return;
      }

      const consumedInvite = await SupabaseService.consumeGoldenInviteCode(normalizedInvite, session.user.id);
      if (!consumedInvite) {
        setError('Não consegui vincular esse Bilhete Dourado à sua conta.');
        setIsSubmitting(false);
        return;
      }

      const fallbackNickname = String(
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email?.split('@')[0] ||
        'Soberano'
      ).trim();

      const profilePayload = {
        id: session.user.id,
        email: session.user.email || '',
        nickname: fallbackNickname,
        app_mode: null,
        avatar_url: session.user.user_metadata?.avatar_url || `https://picsum.photos/seed/${session.user.id}/100/100`,
        border: 'default',
        level: 1,
        background_url: `https://picsum.photos/seed/bg-${session.user.id}/400/150`,
        is_online: true,
        visible_widgets: ['consciencia.lema'],
        skin: 'BASIC',
        unlocked_skins: { BASIC: true },
        unlocked_items: {
          bodyStyles: {},
          hairStyles: {
            cachos: true,
            medio_reto: true,
            grunge_longo: true,
            textured_crop: true,
          },
          outfits: {},
          head_under_items: {},
          helmets: {},
          head_over_items: {},
          artifacts: {},
          codexes: {},
          skins: {},
          borders: {},
          banners: {},
          glyphs: {},
          auras: {},
          orbs: {
            item_orb_1_002: true,
          },
          plates: {
            item_plate_1_001: true,
          },
          ornament: {},
          insignias: {},
          ui_skins: { BASIC: true },
        },
        completed_season_missions: [PROFILE_FLAG_TERMS_PENDING],
        nobility: { exp: 0, rankId: 'vagante' },
        wallet: { gold: 0, fragments: 0 },
        mood: 50,
        chests: [],
        starter_rewards_pending: true,
        vanguard_welcome_pending: false,
        vanguard_welcome_payload: {},
        role: 'user',
        is_premium: false,
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert([profilePayload], { onConflict: 'id' });

      if (profileError) {
        setError(profileError.message || 'Não consegui criar seu perfil depois de validar o bilhete.');
        setIsSubmitting(false);
        return;
      }

      onComplete(session);
    } catch (submitError: any) {
      setError(submitError?.message || 'Não consegui validar seu acesso agora.');
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
            Seu Google entrou, mas esta conta ainda não foi liberada no beta. Valide o acesso com o Bilhete Dourado para continuar.
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
