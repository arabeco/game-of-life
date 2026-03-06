import { supabase } from '../supabaseClient';
import { UserProfile, GoldenInvite, SovereignConfig, Notification } from '../types';

// Serviço simples para conectar com tabelas existentes
export class SupabaseService {
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
      createdAt: n.created_at
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
          app_mode: profile.appMode || 'GAME',
          sovereign: profile.sovereign,
          avatar_url: profile.avatarUrl,
          border: profile.border,
          level: profile.level,
          background_url: profile.backgroundUrl,
          banner_url: profile.bannerUrl,
          is_online: profile.isOnline,
          visible_widgets: profile.visibleWidgets,
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

  // Gerar convite
  static async generateGoldenInvite(): Promise<GoldenInvite | null> {
    try {
      const code = `ouro${new Date().getFullYear()}${(Math.random() + 1).toString(36).substring(2, 10)}`;

      const { data } = await supabase
        .from('golden_invites')
        .insert([{ code, is_used: false }])
        .select()
        .single();

      return data as GoldenInvite;
    } catch (error) {
      console.error('Erro ao gerar convite:', error);
      return null;
    }
  }

  // Listar convites
  static async getGoldenInvites(): Promise<GoldenInvite[]> {
    try {
      const { data } = await supabase
        .from('golden_invites')
        .select('*')
        .order('created_at', { ascending: false });

      return (data || []) as GoldenInvite[];
    } catch (error) {
      console.error('Erro ao listar convites:', error);
      return [];
    }
  }

  static async getGoldenInviteByCode(code: string): Promise<GoldenInvite | null> {
    try {
      const { data, error } = await supabase
        .from('golden_invites')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (error || !data) return null;
      return data as GoldenInvite;
    } catch (error) {
      console.error('Erro ao buscar convite:', error);
      return null;
    }
  }

  static async consumeGoldenInvite(inviteId: string, userId: string): Promise<GoldenInvite | null> {
    try {
      const { data } = await supabase
        .from('golden_invites')
        .update({ is_used: true, claimed_by_user_id: userId, claimed_at: new Date().toISOString() })
        .eq('id', inviteId)
        .eq('is_used', false)
        .select()
        .single();

      return (data || null) as GoldenInvite | null;
    } catch (error) {
      console.error('Erro ao consumir convite:', error);
      return null;
    }
  }

  static async seedGoldenInvites(codes: string[]): Promise<GoldenInvite[]> {
    try {
      const { data: existing } = await supabase
        .from('golden_invites')
        .select('code');

      const existingCodes = new Set((existing || []).map((row: any) => row.code));
      const missing = codes.filter(code => !existingCodes.has(code));

      if (missing.length > 0) {
        await supabase
          .from('golden_invites')
          .insert(missing.map(code => ({ code, is_used: false })));
      }

      return await this.getGoldenInvites();
    } catch (error) {
      console.error('Erro ao aplicar convites iniciais:', error);
      return [];
    }
  }
}
