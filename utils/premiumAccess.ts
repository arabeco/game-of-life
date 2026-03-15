type PremiumLikeProfile = {
  isPremium?: boolean | null;
  role?: string | null;
};

export const isStaffRole = (role?: string | null): boolean => {
  const normalized = (role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'gm' || normalized === 'admin_gm';
};

export const hasPremiumAccess = (profile?: PremiumLikeProfile | null): boolean => {
  if (!profile) return false;
  return Boolean(profile.isPremium) || isStaffRole(profile.role);
};
