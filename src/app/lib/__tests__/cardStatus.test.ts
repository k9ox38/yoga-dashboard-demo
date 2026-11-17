import { describe, expect, it } from "vitest";
import { computeMonthlyStatus, computePackCardStatus, isMonthlyBookable } from "../cardStatus";
import type { MemberCard, PackageProduct } from "../../components/data";

const baseMonthly = {
  monthlyPackageId: "p4",
  monthlyActivatedAt: "2026-09-18",
  monthlyRefunded: false,
  expiry: "2026-11-09",
  monthlyStatus: "有效" as const,
};

describe("computeMonthlyStatus", () => {
  it("marks expired cards as 已到期 even if seed status said 有效", () => {
    expect(computeMonthlyStatus(baseMonthly, "2026-11-17")).toBe("已到期");
  });

  it("keeps expiry day inclusive as 即将到期 or 有效", () => {
    expect(computeMonthlyStatus({ ...baseMonthly, expiry: "2026-11-17" }, "2026-11-17")).toBe("即将到期");
    expect(computeMonthlyStatus({ ...baseMonthly, expiry: "2026-12-20" }, "2026-11-17")).toBe("有效");
  });

  it("uses 即将到期 within 14 days", () => {
    expect(computeMonthlyStatus({ ...baseMonthly, expiry: "2026-11-20" }, "2026-11-17")).toBe("即将到期");
  });

  it("returns 待激活 when purchased but not activated", () => {
    expect(computeMonthlyStatus({
      monthlyPackageId: "p4",
      monthlyActivatedAt: undefined,
      monthlyRefunded: false,
      expiry: undefined,
      monthlyStatus: "待激活",
    }, "2026-11-17")).toBe("待激活");
  });
});

describe("isMonthlyBookable", () => {
  it("allows 即将到期 and blocks expired / frozen", () => {
    expect(isMonthlyBookable({ ...baseMonthly, expiry: "2026-11-20", monthlyFrozen: false, monthlyStatus: "即将到期" }, "2026-11-17")).toBe(true);
    expect(isMonthlyBookable({ ...baseMonthly, monthlyFrozen: false, monthlyStatus: "有效" }, "2026-11-17")).toBe(false);
    expect(isMonthlyBookable({ ...baseMonthly, expiry: "2026-12-01", monthlyFrozen: true, monthlyStatus: "有效" }, "2026-11-17")).toBe(false);
  });
});

describe("computePackCardStatus", () => {
  const pass: PackageProduct = {
    id: "p4", code: "PKG-0004", name: "月卡", type: "pass", scope: "group", price: 680,
    validDays: 30, dailyLimit: 1, status: "上架中", createdAt: "2026-01-10",
  };
  const pack: PackageProduct = {
    id: "p6", code: "PKG-0006", name: "私教 10 次课时包", type: "class_pack", scope: "private", price: 3200,
    sessions: 10, status: "上架中", createdAt: "2026-03-12",
  };

  it("agrees with date-based expiry inclusive semantics", () => {
    const card: MemberCard = {
      id: "c1", packageId: "p4", purchasedAt: "2026-09-18", activatedAt: "2026-09-18",
      expireAt: "2026-11-17", frozen: false, refunded: false, activities: [],
    };
    expect(computePackCardStatus(card, pass, "2026-11-17")).toBe("生效中");
    expect(computePackCardStatus({ ...card, expireAt: "2026-11-16" }, pass, "2026-11-17")).toBe("已过期");
  });

  it("marks depleted class packs as 已用完", () => {
    const card: MemberCard = {
      id: "c2", packageId: "p6", purchasedAt: "2026-09-18", activatedAt: "2026-09-18",
      remainingSessions: 0, totalSessions: 10, frozen: false, refunded: false, activities: [],
    };
    expect(computePackCardStatus(card, pack, "2026-11-17")).toBe("已用完");
  });
});
