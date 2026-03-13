import { UserProfile } from '../types';

export const FIRST_USE_ONBOARDING_VERSION = 'operational-v1';

export const FIRST_USE_ONBOARDING_EVENTS = {
  cycleCreated: 'glyph:first-use-cycle-created',
  arenaCreated: 'glyph:first-use-arena-created',
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
