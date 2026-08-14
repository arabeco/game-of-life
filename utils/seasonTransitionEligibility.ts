export const didProfileExistBeforeSeason = (
  profileCreatedAt: string | null | undefined,
  seasonStartDate: string,
): boolean => {
  if (!profileCreatedAt) return true;

  const profileCreatedTime = new Date(profileCreatedAt).getTime();
  const seasonStartTime = new Date(`${seasonStartDate}T00:00:00`).getTime();
  if (!Number.isFinite(profileCreatedTime) || !Number.isFinite(seasonStartTime)) return true;

  return profileCreatedTime < seasonStartTime;
};
