import { supabase } from '../supabaseClient';
import { UserProfile, GoldenInvite, SovereignConfig, Notification } from '../types';

// Serviço simples para conectar com tabelas existentes
export class SupabaseService {
  private static async getFunctionAuthHeaders(): Promise<Record<string, string>> {
    const { data, error } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    if (error || !accessToken) {
      throw new Error('Sessao autenticada ausente para chamar a funcao protegida.');
    }

    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  private static async readErrorContextBody(error: unknown): Promise<{ error?: string; details?: unknown } | null> {
    const response = (error as { context?: Response })?.context;
    if (!response) return null;

    try {
      const json = await response.clone().json();
      return typeof json === 'object' && json ? (json as { error?: string; details?: unknown }) : null;
    } catch {
      try {
        const text = await response.clone().text();
        return text ? { error: text } : null;
      } catch {
        return null;
      }
    }
  }

  private static shouldFallbackDeleteToRpc(error: unknown): boolean {
    const functionError = error as { name?: string; message?: string; context?: Response };
    const message = String(functionError?.message || '').toLowerCase();
    const name = String(functionError?.name || '').toLowerCase();
    const status = functionError?.context?.status ?? null;

    return (
      name.includes('functionsfetcherror') ||
      message.includes('failed to send a request') ||
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('functionsfetcherror') ||
      message.includes('forbidden') ||
      message.includes('not found') ||
      message.includes('404') ||
      message.includes('403') ||
      status === 403 ||
      status === 404
    );
  }

  private static mapGoldenInvite(row: any): GoldenInvite | null {
    if (!row?.id || !row?.code) return null;
    return {
      id: row.id,
      code: row.code,
      is_used: !!row.is_used,
      claimed_by_user_id: row.claimed_by_user_id ?? null,
      claimed_at: row.claimed_at ?? null,
      created_at: row.created_at,
    };
  }

  // --- Notifications System ---

  static async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return (data || []).map(n => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      content: n.content,
      read: n.read,
      createdAt: n.created_at,
      metadata: n.metadata ?? null,
    }));
  }

  static async markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
    }
  }

  static async createNotification(
    userId: string,
    type: Notification['type'],
    content: string,
    metadata: Notification['metadata'] = null,
  ): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        content,
        read: false,
        metadata,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      content: data.content,
      read: data.read,
      createdAt: data.created_at,
      metadata: data.metadata ?? null,
    };
  }

  // Garantir conta admin soberana
  static async ensureAdminAccount(): Promise<UserProfile | null> {
    try {
      const { data: existingAdmin } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'admin')
        .maybeSingle();

      if (existingAdmin) return existingAdmin as UserProfile;

      const sovereignConfig: SovereignConfig = {
        body: 'body_masc_1',
        skinTone: '#FDBCB4',
        hairStyle: 'short',
        hairColor: '#2C1810',
        outfit: 'royal_robes',
        head_under: 'none',
        helmet: 'none',
        head_over: 'crown',
        artifact: 'scepter',
        glyph: 'none',
        aura: 'none',
        orb: 'none'
      };

      const adminProfile = {
        email: 'soberano@gol.local',
        nickname: 'Soberano',
        sovereign: sovereignConfig,
        avatar_url: 'https://picsum.photos/seed/soberano/100/100',
        border: 'GOLD',
        level: 99,
        background_url: 'https://picsum.photos/seed/soberano-bg/400/150',
        is_online: true,
        visible_widgets: ['consciencia.lema', 'espiritualidade.sistema'],
        assets_visibility: 'all',
        mastery_visibility: 'all',
        skin: 'GOLD',
        unlocked_skins: {},
        unlocked_items: {
          bodyStyles: {},
          hairStyles: {},
          outfits: {},
          head_under_items: {},
          helmets: {},
          head_over_items: {},
          artifacts: {},
          codexes: {},
          skins: {},
          borders: {},
          glyphs: {},
          auras: {},
        },
        completed_season_missions: [],
        nobility: { exp: 999999, rankId: 'soberano' },
        mood: 100,
        chests: [
          { type: 'Comum', count: 99 },
          { type: 'Raro', count: 50 },
          { type: 'Épico', count: 25 },
          { type: 'Lendário', count: 10 }
        ],
        wallet: { gold: 99999, fragments: 99999 },
        inventory: [],
        role: 'admin',
        is_premium: true
      };

      const { data } = await supabase
        .from('user_profiles')
        .insert([adminProfile])
        .select()
        .single();

      return data as UserProfile;
    } catch (error) {
      console.error('Erro ao criar admin:', error);
      return null;
    }
  }

  // Sincronizar perfil
  static async syncUserProfile(profile: UserProfile): Promise<UserProfile | null> {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .upsert({
          id: profile.id,
          email: profile.email,
          nickname: profile.nickname,
          app_mode: profile.appMode || null,
          terms_version: profile.termsVersion || null,
          terms_accepted_at: profile.termsAcceptedAt || null,
          terms_accept_source: profile.termsAcceptSource || null,
          privacy_version: profile.privacyVersion || null,
          privacy_accepted_at: profile.privacyAcceptedAt || null,
          privacy_accept_source: profile.privacyAcceptSource || null,
          onboarding_version: profile.onboardingVersion || null,
          onboarding_started_at: profile.onboardingStartedAt || null,
          onboarding_completed_at: profile.onboardingCompletedAt || null,
          onboarding_dismissed_at: profile.onboardingDismissedAt || null,
          starter_rewards_pending: profile.starterRewardsPending ?? false,
          vanguard_welcome_pending: profile.vanguardWelcomePending ?? false,
          vanguard_welcome_shown_at: profile.vanguardWelcomeShownAt || null,
          vanguard_welcome_payload: profile.vanguardWelcomePayload ?? {},
          gold: profile.wallet?.gold ?? 0,
          fragments: profile.wallet?.fragments ?? 0,
          sovereign: profile.sovereign,
          avatar_url: profile.avatarUrl,
          border: profile.border,
          level: profile.level,
          background_url: profile.backgroundUrl,
          banner_url: profile.bannerUrl,
          is_online: profile.isOnline,
          visible_widgets: profile.visibleWidgets,
          assets_visibility: profile.assetsVisibility || 'all',
          mastery_visibility: profile.masteryVisibility || 'all',
          skin: profile.skin,
          unlocked_skins: profile.unlockedSkins,
          unlocked_items: profile.unlockedItems,
          completed_season_missions: profile.completedSeasonMissions,
          last_level_update: profile.lastLevelUpdate,
          nobility: profile.nobility,
          mood: profile.mood,
          chests: profile.chests,
          wallet: profile.wallet,
          is_premium: profile.isPremium ?? false
        })
        .select()
        .single();

      return data as UserProfile;
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      return null;
    }
  }

  // Buscar usuários
  static async searchUsers(query: string = ''): Promise<UserProfile[]> {
    try {
      let queryBuilder = supabase
        .from('user_profiles')
        .select('*')
        .order('nickname')
        .limit(20);

      if (query) {
        queryBuilder = queryBuilder.or(`nickname.ilike.%${query}%,email.ilike.%${query}%`);
      }

      const { data } = await queryBuilder;
      return (data || []).filter((profile: any) => profile.role !== 'admin' && profile.role !== 'gm') as UserProfile[];
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  }

  static async checkGoldenInvite(code: string): Promise<GoldenInvite | null> {
    const normalizedCode = code.trim();
    if (!normalizedCode) return null;

    try {
      const { data, error } = await supabase.rpc('check_golden_invite', {
        p_code: normalizedCode,
      });

      if (error) {
        console.error('Erro ao validar convite via RPC:', error);
        return null;
      }

      const invite = (data as any)?.invite;
      return this.mapGoldenInvite(invite);
    } catch (error) {
      console.error('Erro inesperado ao validar convite:', error);
      return null;
    }
  }

  static async consumeGoldenInviteCode(code: string, userId: string): Promise<GoldenInvite | null> {
    const normalizedCode = code.trim();
    if (!normalizedCode || !userId) return null;

    try {
      const { data, error } = await supabase.rpc('consume_golden_invite', {
        p_code: normalizedCode,
        p_user_id: userId,
      });

      if (error) {
        console.error('Erro ao consumir convite via RPC:', error);
        return null;
      }

      const invite = (data as any)?.invite;
      return this.mapGoldenInvite(invite);
    } catch (error) {
      console.error('Erro inesperado ao consumir convite:', error);
      return null;
    }
  }

  static async getClosedBetaAccessStatus(): Promise<{ authorized: boolean; hasInvite: boolean; hasProfile: boolean } | null> {
    try {
      const { data, error } = await supabase.rpc('get_closed_beta_access_status');

      if (error) {
        console.error('Erro ao validar sessao do beta fechado via RPC:', error);
        return null;
      }

      return {
        authorized: !!(data as any)?.authorized,
        hasInvite: !!(data as any)?.has_invite,
        hasProfile: !!(data as any)?.has_profile,
      };
    } catch (error) {
      console.error('Erro inesperado ao validar sessao do beta fechado:', error);
      return null;
    }
  }

  static async deleteMyAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      const headers = await this.getFunctionAuthHeaders();
      const { data, error } = await supabase.functions.invoke('account-delete', {
        headers,
        body: {},
      });

      if (!error) {
        if ((data as any)?.success === false) {
          return { success: false, error: (data as any)?.error || 'Nao foi possivel excluir a conta.' };
        }

        return { success: true };
      }

      console.error('Erro ao excluir conta via Edge Function:', error);
      const functionError = error as { message?: string; context?: Response };
      const functionErrorBody = await this.readErrorContextBody(error);
      const functionErrorMessage = String(functionError?.message || '');
      const responseStatus = functionError?.context?.status ?? null;
      const contextualMessage =
        (typeof functionErrorBody?.error === 'string' && functionErrorBody.error.trim())
          ? functionErrorBody.error
          : functionErrorMessage;
      const canFallbackToRpc = this.shouldFallbackDeleteToRpc(error);

      if (!canFallbackToRpc) {
        return {
          success: false,
          error: contextualMessage || (responseStatus ? `Não foi possível excluir a conta. HTTP ${responseStatus}.` : 'Não foi possível excluir a conta.'),
        };
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc('delete_my_account');
      if (rpcError) {
        console.error('Erro ao excluir conta via RPC:', rpcError);
        const rpcMessage = String(rpcError.message || '');
        if (
          rpcMessage.includes('Could not find the function public.delete_my_account') ||
          rpcMessage.includes('delete_my_account without parameters')
        ) {
          return {
            success: false,
            error: 'A exclusão caiu no plano B, mas a RPC delete_my_account() não está instalada neste projeto. Precisamos publicar a Edge Function account-delete corretamente ou rodar o SQL de suporte da exclusão.',
          };
        }

        return { success: false, error: rpcMessage || 'Não foi possível excluir a conta.' };
      }

      if ((rpcData as any)?.success === false) {
        return { success: false, error: (rpcData as any)?.error || 'Não foi possível excluir a conta.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro inesperado ao excluir conta:', error);
      return { success: false, error: (error as any)?.message || 'Não foi possível excluir a conta.' };
    }
  }
  static async getFeedbackReports(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('feedback_reports')
        .select(`
          *,
          user_profiles:user_id (nickname)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar relatórios de feedback:', error);
      return [];
    }
  }
}
