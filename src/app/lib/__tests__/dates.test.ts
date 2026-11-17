import { describe, expect, it } from "vitest";
import { addDays, addDaysFromToday, daysUntil, localDate, parseLocalDate } from "../dates";

describe("local calendar dates", () => {
  it("formats local date without UTC shift near midnight Asia/Kuala_Lumpur", () => {
    // 2026-11-17 00:30 local: localDate must stay on the 17th.
    // In UTC+8 this instant is still 2026-11-16 in UTC; in UTC they match.
    const early = new Date(2026, 10, 17, 0, 30, 0, 0);
    expect(localDate(early)).toBe("2026-11-17");
    const utcDay = early.toISOString().slice(0, 10);
    if (early.getTimezoneOffset() < 0) {
      // East of UTC: local midnight can fall on the previous UTC calendar day.
      expect(utcDay).not.toBe(localDate(early));
    } else {
      expect(utcDay).toBe(localDate(early));
    }
  });

  it("addDays keeps calendar arithmetic across month boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-11-01", -1)).toBe("2026-10-31");
  });

  it("addDaysFromToday uses the provided local anchor", () => {
    const anchor = new Date(2026, 10, 17, 7, 0, 0, 0); // before 08:00 +08
    expect(addDaysFromToday(0, anchor)).toBe("2026-11-17");
    expect(addDaysFromToday(-1, anchor)).toBe("2026-11-16");
  });

  it("parseLocalDate uses noon local to avoid DST midnight issues", () => {
    const d = parseLocalDate("2026-11-17");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(10);
    expect(d.getDate()).toBe(17);
    expect(d.getHours()).toBe(12);
  });

  it("daysUntil treats expiry day as zero remaining (inclusive)", () => {
    expect(daysUntil("2026-11-17", "2026-11-17")).toBe(0);
    expect(daysUntil("2026-11-16", "2026-11-17")).toBe(-1);
    expect(daysUntil("2026-11-18", "2026-11-17")).toBe(1);
  });
});
