import { OracleMode, OraclePreferences } from '../types';
import { ORACLE_TONE_LABELS, type OracleSpeechTone } from './oracleSpeechLibrary';

export type OracleAttentionProfile = 'essencial' | 'equilibrado' | 'ativo';

export interface OracleModeConfig {
    id: OracleSpeechTone;
    name: string;
    pushProfile: OracleAttentionProfile;
}

// Perfil de push por tom de fala. Os tons sao os do oracleSpeechLibrary:
// neutro e o gratuito, coach/reflexivo/calmo sao Premium. Nao ha prompt de IA
// aqui - o Oraculo responde por cards escritos, nao por modelo.
const TONE_PUSH_PROFILE: Record<OracleSpeechTone, OracleAttentionProfile> = {
    neutro: 'equilibrado',
    coach: 'ativo',
    reflexivo: 'essencial',
    calmo: 'essencial',
};

export const ORACLE_MODE_CONFIGS: Record<OracleSpeechTone, OracleModeConfig> = {
    neutro: { id: 'neutro', name: ORACLE_TONE_LABELS.neutro.name, pushProfile: TONE_PUSH_PROFILE.neutro },
    coach: { id: 'coach', name: ORACLE_TONE_LABELS.coach.name, pushProfile: TONE_PUSH_PROFILE.coach },
    reflexivo: { id: 'reflexivo', name: ORACLE_TONE_LABELS.reflexivo.name, pushProfile: TONE_PUSH_PROFILE.reflexivo },
    calmo: { id: 'calmo', name: ORACLE_TONE_LABELS.calmo.name, pushProfile: TONE_PUSH_PROFILE.calmo },
};

// Mensagens antigas no banco ainda carregam modos que nao existem mais
// (tatico, estrategico, personalizado): caem no neutro.
export const getOracleModeConfig = (mode: OracleMode | OracleSpeechTone | null | undefined): OracleModeConfig =>
    ORACLE_MODE_CONFIGS[mode as OracleSpeechTone] || ORACLE_MODE_CONFIGS.neutro;

export const deriveLegacySentinelMode = (
    mode: OracleMode,
    iaEnabled = true,
): NonNullable<OraclePreferences['sentinelMode']> => {
    if (!iaEnabled) return 'nao_ia';
    if (mode === 'calmo' || mode === 'reflexivo') return 'apenas_necessarias';
    return 'soberano_ativo';
};
