import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export const PROFILE_FLAG_TERMS_PENDING = '__flag_terms_pending_v1';

export const buildClosedBetaProfilePayload = (session: Session) => {
  const fallbackNickname = String(
    session.user.user_metadata?.full_name ||
    session.user.user_metadata?.name ||
    session.user.email?.split('@')[0] ||
    'Soberano'
  ).trim();

  return {
    id: session.user.id,
    email: session.user.email || '',
    nickname: fallbackNickname,
    app_mode: null,
    avatar_url: session.user.user_metadata?.avatar_url || '',
    border: 'default',
    level: 1,
    gold: 0,
    fragments: 0,
    background_url: '',
    is_online: true,
    visible_widgets: [],
    asset_art_by_id: {},
    asset_widget_values: {},
    assets_visibility: 'nobody',
    mastery_visibility: 'friends',
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
    codex_creation_slots_purchased: 0,
    role: 'user',
    is_premium: false,
    premium_expires_at: null,
    premium_reward_pending: false,
    premium_reward_payload: {},
    exp_boost_multiplier: null,
    exp_boost_expires_at: null,
    exp_boost_product_id: null,
  };
};

export const ensureClosedBetaUserProfile = async (session: Session): Promise<{ success: boolean; error?: string }> => {
  try {
    const profilePayload = buildClosedBetaProfilePayload(session);
    const { error } = await supabase
      .from('user_profiles')
      .upsert([profilePayload], { onConflict: 'id' });

    if (error) {
      return {
        success: false,
        error: error.message || 'Nao consegui criar ou reparar o perfil dessa conta.',
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Nao consegui criar ou reparar o perfil dessa conta.',
    };
  }
};
