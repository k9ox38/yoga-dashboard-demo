import { describe, expect, it } from "vitest";
import { classSessions, classTemplates, members, packageProducts } from "../../components/data";
import { buildSeedNotices, displayState } from "../../components/Notifications";
import { isMonthlyBookable } from "../cardStatus";
import { addDays, localDate } from "../dates";
import { demoReconRecords } from "../demoCommerce";
import {
  AT_RISK_DAYS,
  atRiskMembers,
  dataUpdatedStamp,
  lowestUpcomingFill,
  pendingRecon,
  periodRange,
  prepaidBalance,
  recentWeekLabels,
  recentlyActiveMembers,
} from "../reportMetrics";

describe("report periods", () => {
  const wed = new Date(2026, 10, 18, 15, 0, 0, 0);

  it("上月 is the previous calendar month, compared with the month before", () => {
    expect(periodRange("上月", wed)).toMatchObject({ start: "2026-10-01", end: "2026-10-31", label: "2026 年 10 月", compareLabel: "2026 年 9 月" });
    expect(periodRange("上月", new Date(2027, 0, 5, 12))).toMatchObject({ start: "2026-12-01", end: "2026-12-31", compareLabel: "2026 年 11 月" });
  });

  it("本周 starts on Monday and 本季度 covers the calendar quarter", () => {
    expect(periodRange("本周", wed)).toMatchObject({ start: "2026-11-16", end: "2026-11-22" });
    expect(periodRange("本季度", wed)).toMatchObject({ start: "2026-10-01", end: "2026-12-31", compareLabel: "2026 年第 3 季度" });
    expect(periodRange("本年", wed)).toMatchObject({ start: "2026-01-01", end: "2026-12-31", compareLabel: "2025 年" });
  });

  it("week labels end on the anchor's Monday and the data stamp rolls back before 08:00", () => {
    expect(recentWeekLabels(3, wed)).toEqual(["11/2", "11/9", "11/16"]);
    expect(dataUpdatedStamp(new Date(2026, 10, 18, 7, 59))).toBe("11-17 08:00");
    expect(dataUpdatedStamp(new Date(2026, 10, 18, 8, 0))).toBe("11-18 08:00");
  });
});

describe("member-derived report data agrees with the member seed", () => {
  const today = localDate();
  const risk = atRiskMembers(members, packageProducts, today);

  it("risk rows are real members with the same last-class date and card state", () => {
    expect(risk.length).toBeGreaterThan(0);
    for (const row of risk) {
      const member = members.find((item) => item.id === row.id);
      expect(member, row.name).toBeTruthy();
      expect(row.name).toBe(member!.name);
      expect(row.lastClass).toBe(member!.lastClass);
      expect(row.lastClass < addDays(today, -AT_RISK_DAYS)).toBe(true);
      const usable = isMonthlyBookable(member!, today) || member!.privateRemaining > 0;
      expect(row.status).toBe(usable ? "卡包有效" : "已过期");
    }
  });

  it("is stable over time because seeds are relative to today", () => {
    expect(risk.map((row) => row.name).sort()).toEqual(["何静", "沈宁", "许晨", "邓欣", "郑妍", "钱雅"].sort());
    expect(risk.map((row) => row.name)).not.toContain("苏晴");
    expect(recentlyActiveMembers(members, today).length + risk.length).toBeLessThanOrEqual(members.length);
  });

  it("prepaid balance counts every remaining private session", () => {
    const balance = prepaidBalance(members, packageProducts, today);
    expect(balance.privateSessions).toBe(members.reduce((sum, member) => sum + member.privateRemaining, 0));
    expect(balance.total).toBe(balance.privateValue + balance.passValue);
    expect(balance.total).toBeGreaterThan(0);
  });

  it("schedule and reconciliation alerts read the shared demo data", () => {
    const fill = lowestUpcomingFill(classSessions, classTemplates, today);
    expect(classTemplates.some((template) => template.name === fill?.className)).toBe(true);
    const recon = pendingRecon(demoReconRecords);
    expect(recon.count).toBe(demoReconRecords.filter((record) => record.matchStatus !== "已匹配").length);
  });
});

describe("notification seeds", () => {
  const anchor = new Date(2026, 10, 18, 7, 30, 0, 0); // before 08:00 local
  const today = localDate(anchor);
  const notices = buildSeedNotices(anchor);

  it("published notices are inside their display window; drafts are upcoming; archived ones ended", () => {
    for (const notice of notices) {
      if (notice.status === "已发布") expect(displayState(notice, today), notice.id).toBe("展示中");
      if (notice.status === "草稿") expect(notice.displayStart! > today, notice.id).toBe(true);
      if (notice.status === "已归档") expect(notice.displayEnd! < today, notice.id).toBe(true);
    }
  });

  it("timestamps are local minute stamps, not UTC ISO strings", () => {
    for (const notice of notices) {
      expect(notice.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
      if (notice.publishedAt) expect(notice.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    }
    expect(notices.find((notice) => notice.id === "n1")?.publishedAt).toBe("2026-11-16 10:00");
  });

  it("displayState handles each side of the window", () => {
    const window = { displayStart: "2026-11-20", displayEnd: "2026-11-30" };
    expect(displayState(window, "2026-11-19")).toBe("未开始");
    expect(displayState(window, "2026-11-20")).toBe("展示中");
    expect(displayState(window, "2026-11-30")).toBe("展示中");
    expect(displayState(window, "2026-12-01")).toBe("已结束");
  });
});
