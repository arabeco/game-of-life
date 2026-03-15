import { UserProfile } from '../types';

export const FIRST_USE_ONBOARDING_VERSION = 'operational-v1';

export const FIRST_USE_ONBOARDING_EVENTS = {
  cycleSetupOpened: 'glyph:first-use-cycle-setup-opened',
  cycleNameCompleted: 'glyph:first-use-cycle-name-completed',
  cycleEndDateSelected: 'glyph:first-use-cycle-end-date-selected',
  cycleCreated: 'glyph:first-use-cycle-created',
  arenaModalOpened: 'glyph:first-use-arena-modal-opened',
  arenaAssetSelected: 'glyph:first-use-arena-asset-selected',
  arenaNameCompleted: 'glyph:first-use-arena-name-completed',
  arenaCreated: 'glyph:first-use-arena-created',
  actionModalOpened: 'glyph:first-use-action-modal-opened',
  actionNameCompleted: 'glyph:first-use-action-name-completed',
  actionTypeSelected: 'glyph:first-use-action-type-selected',
  actionRepetitionsAdjusted: 'glyph:first-use-action-repetitions-adjusted',
  actionDurationAdjusted: 'glyph:first-use-action-duration-adjusted',
  actionCreated: 'glyph:first-use-action-created',
} as const;

export const shouldAutoStartOnboarding = (profile?: UserProfile | null) => {
  if (!profile || profile.id === 'placeholder_user') return false;
  return !profile.onboardingCompletedAt && !profile.onboardingDismissedAt;
};

export const buildOnboardingStartPatch = (
  profile: UserProfile,
  startedAt: string = new Date().toISOString(),
): Partial<UserProfile> => ({
  onboardingVersion: FIRST_USE_ONBOARDING_VERSION,
  onboardingStartedAt: profile.onboardingStartedAt || startedAt,
});

export const buildOnboardingCompletePatch = (
  profile: UserProfile,
  completedAt: string = new Date().toISOString(),
): Partial<UserProfile> => ({
  onboardingVersion: FIRST_USE_ONBOARDING_VERSION,
  onboardingStartedAt: profile.onboardingStartedAt || completedAt,
  onboardingCompletedAt: completedAt,
});

export const buildOnboardingDismissPatch = (
  profile: UserProfile,
  dismissedAt: string = new Date().toISOString(),
): Partial<UserProfile> => ({
  onboardingVersion: FIRST_USE_ONBOARDING_VERSION,
  onboardingStartedAt: profile.onboardingStartedAt || dismissedAt,
  onboardingDismissedAt: dismissedAt,
});
