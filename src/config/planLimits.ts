export const PLAN_LIMITS = {
  free: {
    songs: 5,
  },
  basic: {
    songs: 50,
  },
  pro: {
    songs: -1, // unlimited
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;


export function getSongLimit(plan: PlanType): number {
  return PLAN_LIMITS[plan]?.songs ?? PLAN_LIMITS.free.songs;
}


export function hasReachedSongLimit(
  plan: PlanType,
  currentCount: number
): boolean {
  const limit = getSongLimit(plan);
  // -1 means unlimited
  return limit !== -1 && currentCount >= limit;
}
