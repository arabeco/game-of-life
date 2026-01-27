// Contrato de payloads para Supabase (profiles.attributes / profiles.cosmetics)

export type AssetId =
  | "gratitude"
  | "spirit"
  | "mental"
  | "truth"
  | "inspiration"
  | "love"
  | "abundance"
  | "work"
  | "authenticity"
  | "physical";

export type SlotType = "type1" | "type2" | "type3" | "type4" | "type5";

export interface SlotType1Text {
  type: "type1";
  title: string;
  value: string;
}

export interface SlotType2Class {
  type: "type2";
  title: string;
  value: string;
  sub_value: string;
}

export interface SlotType3Square {
  type: "type3";
  title: string;
  image_url: string;
  caption: string;
}

export interface SlotType4Portrait {
  type: "type4";
  top_label: string;
  image_url: string;
  caption: string;
}

export interface SlotType5WheelPicker {
  type: "type5";
  title: string;
  current_value: string | number;
  options_list: (string | number)[];
}

export interface ProfileAttributes {
  gratitude: {
    level: number;
    motto_main: SlotType1Text;
    beliefs_list: SlotType1Text;
    flow_state_analysis: SlotType1Text;
  };
  spirit: {
    level: number;
    belief_system: SlotType1Text;
    entity_leader: SlotType3Square;
    entity_protector: SlotType3Square;
  };
  mental: {
    level: number;
    operational_philosophy: SlotType1Text;
    mental_status: SlotType5WheelPicker;
    vulnerability_desc: SlotType1Text;
  };
  truth: {
    level: number;
    mtp_mission: SlotType1Text;
    passive_traits: SlotType5WheelPicker;
    mbti_type: SlotType1Text;
    zodiac_sign: SlotType1Text;
    inspiration_slots: SlotType3Square[];
  };
  inspiration: {
    level: number;
    projects_list: SlotType3Square[];
  };
  love: {
    level: number;
    social_role_analysis: SlotType1Text;
    inner_circle: SlotType4Portrait[];
    war_brothers: SlotType4Portrait[];
  };
  abundance: {
    level: number;
    burn_rate_indicator: SlotType1Text;
    liquidity_sources: SlotType1Text;
    assets_slots: SlotType3Square[];
  };
  work: {
    level: number;
    primary_class: SlotType2Class;
    secondary_class: SlotType2Class;
    career_history: SlotType1Text;
  };
  authenticity: {
    level: number;
    hobbies_slots: SlotType3Square[];
  };
  physical: {
    level: number;
    shape_photo: SlotType4Portrait;
    physical_status: SlotType5WheelPicker;
    attributes_stats: SlotType2Class[];
  };
}

export interface ProfileCosmetics {
  banner_id: string;
  frame_id: string;
  color_theme: string;
  active_effects: string[];
}

export type MasteryMode = "oracle" | "sovereign";

export interface PlannerActionSlot {
  dateKey: string;
  hour?: number;
}

export interface PlannerAction {
  id: string;
  arenaId?: string;
  title: string;
  icon?: string;
  duration?: string;
  durationMinutes?: number;
  weekdays?: string[];
  weeklyTarget?: number | null;
  atemporal?: boolean;
  isPostponable?: boolean;
  status?: string;
  scheduledDayOffset?: number;
  scheduledHour?: number;
  scheduledMinute?: number;
  plannedSlots?: PlannerActionSlot[];
  completedHistory?: string[];
  completedAt?: string;
}

export interface ArenaData {
  id: string;
  title: string;
  description?: string;
  assetId?: string;
  icon?: string;
  completion?: number;
  targetCount?: number | null;
  completedCount?: number;
  quickDone?: boolean;
}

export interface PlayerDataProfile {
  nickname?: string;
  avatar?: string;
  banner?: string;
  widgetsVisible?: boolean[];
  profileCardTheme?: string;
  profileBorderTheme?: string;
  profileBorderImage?: string;
  moodLevel?: number;
  moodColor?: string;
}

export interface PlayerDataConfig {
  masteryMode?: MasteryMode;
  hud?: Record<string, unknown>;
  notifications?: Record<string, unknown>;
}

export interface PlayerData {
  version?: number;
  assets?: Record<string, unknown>;
  arenas?: ArenaData[];
  planner?: Record<string, unknown>;
  profile?: PlayerDataProfile;
  config?: PlayerDataConfig;
}
