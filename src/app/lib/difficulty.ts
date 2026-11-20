/*
 * Course difficulty, 1–5 stars, as the API stores it: a course has a default difficulty and
 * each scheduled class starts from it (and can be adjusted). Every page shows the same stars
 * and the same words.
 */

export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;

export const DIFFICULTY_LABELS = ["入门", "初级", "中级", "进阶", "高级"] as const;

export const DEFAULT_DIFFICULTY = 3;

/** Keeps a stored value on the 1–5 scale. */
export function clampDifficulty(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_DIFFICULTY;
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function difficultyLabel(value: number | null | undefined): string {
  return DIFFICULTY_LABELS[clampDifficulty(value) - 1];
}
