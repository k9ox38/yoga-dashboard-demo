import { describe, expect, it } from "vitest";
import { members, packageProducts } from "../../components/data";
import {
  buildDemoOrders,
  buildDemoReconRecords,
  buildMonthlyRevenue,
  currentMonthPaidRevenue,
  ordersRefFromDemo,
  paidRevenueTotal,
} from "../demoCommerce";
import { computeMonthlyStatus } from "../cardStatus";
import { localDate, recentMonthKeys } from "../dates";

describe("demo commerce coherence", () => {
  it("orders reference real members and package codes", () => {
    const orders = buildDemoOrders(new Date(2026, 10, 17));
    const memberIds = new Set(members.map((m) => m.id));
    const codes = new Set(packageProducts.map((p) => p.code));
    for (const order of orders) {
      expect(memberIds.has(order.memberId)).toBe(true);
      expect(codes.has(order.packageCode)).toBe(true);
      expect(order.userName).toBe(members.find((m) => m.id === order.memberId)?.name);
      expect(order.packageName).toBe(packageProducts.find((p) => p.id === order.packageId)?.name);
      expect(order.packageCode.startsWith("PKG-000")).toBe(true);
      expect(order.userName).not.toMatch(/王玲|赵一/);
    }
  });

  it("recon records match demo order numbers when linked", () => {
    const orders = buildDemoOrders(new Date(2026, 10, 17));
    const recon = buildDemoReconRecords(orders, new Date(2026, 10, 17));
    const byNo = Object.fromEntries(orders.map((o) => [o.orderNo, o]));
    for (const row of recon) {
      if (row.matchedOrderNo) {
        expect(byNo[row.matchedOrderNo]).toBeTruthy();
      }
    }
    expect(ordersRefFromDemo(orders).length).toBeGreaterThan(0);
  });

  it("monthly revenue is paid-order sums only; empty months are zero", () => {
    const anchor = new Date(2026, 10, 17);
    const orders = buildDemoOrders(anchor);
    const chart = buildMonthlyRevenue(orders, anchor);
    const months = recentMonthKeys(6, anchor);
    expect(chart).toHaveLength(6);
    expect(chart[chart.length - 1]?.month).toBe("11月");

    const paid = orders.filter((order) => order.status === "已支付");
    const byKey: Record<string, number> = {};
    for (const order of paid) {
      const stamp = (order.paidAt ?? order.createdAt).slice(0, 7);
      byKey[stamp] = (byKey[stamp] ?? 0) + order.actualAmount;
    }

    chart.forEach((bar, index) => {
      const key = months[index]?.key;
      expect(bar.revenue).toBe(byKey[key!] ?? 0);
    });

    const windowSum = chart.reduce((sum, bar) => sum + bar.revenue, 0);
    const paidInWindow = paid
      .filter((order) => {
        const stamp = (order.paidAt ?? order.createdAt).slice(0, 7);
        return months.some((month) => month.key === stamp);
      })
      .reduce((sum, order) => sum + order.actualAmount, 0);
    expect(windowSum).toBe(paidInWindow);
    expect(windowSum).toBeLessThanOrEqual(paidRevenueTotal(orders));

    // Months with no paid orders must stay at zero (no filler).
    const emptyKeys = months.filter((month) => !byKey[month.key]).map((month) => month.key);
    expect(emptyKeys.length).toBeGreaterThan(0);
    emptyKeys.forEach((key) => {
      const index = months.findIndex((month) => month.key === key);
      expect(chart[index]?.revenue).toBe(0);
    });

    expect(currentMonthPaidRevenue(orders, anchor)).toBe(chart[chart.length - 1]?.revenue);
  });
});

describe("member seed status agreement", () => {
  it("list status matches date helper for every seeded member", () => {
    const today = localDate();
    for (const member of members) {
      expect(member.monthlyStatus).toBe(computeMonthlyStatus(member, today));
      const pass = member.cards.find((card) => card.packageId === member.monthlyPackageId);
      if (pass?.expireAt) {
        expect(member.expiry).toBe(pass.expireAt);
      }
    }
  });
});
