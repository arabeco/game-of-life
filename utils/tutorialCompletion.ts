export const completedTutorialFlags = (flags: string[], level: number, sectionIds: readonly number[], globalFlag: string) => {
  const next = new Set(flags);
  next.add(`tutorial_level_${level}_completed`);
  const allCompleted = sectionIds.every(id => next.has(`tutorial_level_${id}_completed`));
  if (allCompleted) next.add(globalFlag);
  return { flags: Array.from(next), allCompleted };
};
