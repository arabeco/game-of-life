import type { OracleContext, OracleMode } from '../types';
import {
  buildOracleHostVoiceDirective,
  deriveOracleHostOperationalState,
  ORACLE_STATE_FAMILY,
  type OracleHostOperationalState,
  type OracleHostSurface,
} from '../supabase/functions/_shared/oracle-host-voice.ts';

export type OracleSurface = OracleHostSurface;
export type OracleOperationalState = OracleHostOperationalState;

export const deriveOracleOperationalState = (context: OracleContext): OracleOperationalState =>
  deriveOracleHostOperationalState(context);

export const getOracleStateFamily = (state: OracleOperationalState): string => ORACLE_STATE_FAMILY[state];

export const buildOracleVoiceDirective = (
  context: OracleContext,
  surface: OracleSurface,
  mode: OracleMode = context.activeMode,
  recentLines: string[] = [],
): string => buildOracleHostVoiceDirective({
  context,
  surface,
  mode,
  recentLines,
});
