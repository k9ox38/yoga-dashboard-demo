import { describe, expect, it } from "vitest";
import { clampDifficulty, difficultyLabel } from "../difficulty";

describe("difficulty", () => {
  it("names each step of the 1–5 scale", () => {
    expect([1, 2, 3, 4, 5].map(difficultyLabel)).toEqual(["入门", "初级", "中级", "进阶", "高级"]);
  });

  it("keeps odd stored values on the scale", () => {
    expect(clampDifficulty(0)).toBe(1);
    expect(clampDifficulty(9)).toBe(5);
    expect(clampDifficulty(undefined)).toBe(3);
    expect(difficultyLabel(Number.NaN)).toBe("中级");
  });
});
