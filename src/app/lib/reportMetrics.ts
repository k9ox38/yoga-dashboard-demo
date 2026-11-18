import { addDays, daysBetween, localDate, parseLocalDate } from "./dates";
import { computeMonthlyStatus, isMonthlyBookable } from "./cardStatus";
import type { ClassSession, ClassTemplate, Member, PackageProduct } from "../components/data";
import type { DemoReconRecord } from "./demoCommerce";

/* ─── Report periods ─────────────────────────────── */

export const PERIOD_PRESETS = ["本周", "本月", "上月", "本季度", "本年"] as const;
export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export type PeriodRange = {
  preset: PeriodPreset;
  start: string;
  end: string;
  label: string;
  compareLabel: string;
};

const monthName = (date: Date) => `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
const monthDay = (day: string) => day.slice(5);
const noon = (year: number, month: number, day: number) => new Date(year, month, day, 12, 0, 0, 0);

/** Calendar range for a preset, relative to the local `today` (weeks start on Monday). */
export function periodRange(preset: PeriodPreset, today: Date = new Date()): PeriodRange {
  const todayKey = localDate(today);
  const y = today.getFullYear();
  const m = today.getMonth();
  switch (preset) {
    case "本周": {
      const start = addDays(todayKey, -((today.getDay() + 6) % 7));
      const end = addDays(start, 6);
      return { preset, start, end, label: `本周 ${monthDay(start)} – ${monthDay(end)}`, compareLabel: "上周" };
    }
    case "本月":
      return {
        preset,
        start: localDate(noon(y, m, 1)),
        end: localDate(noon(y, m + 1, 0)),
        label: `${monthName(noon(y, m, 1))}（截至 ${monthDay(todayKey)}）`,
        compareLabel: monthName(noon(y, m - 1, 1)),
      };
    case "上月":
      return {
        preset,
        start: localDate(noon(y, m - 1, 1)),
        end: localDate(noon(y, m, 0)),
        label: monthName(noon(y, m - 1, 1)),
        compareLabel: monthName(noon(y, m - 2, 1)),
      };
    case "本季度": {
      const q = Math.floor(m / 3);
      const prev = noon(y, q * 3 - 3, 1);
      return {
        preset,
        start: localDate(noon(y, q * 3, 1)),
        end: localDate(noon(y, q * 3 + 3, 0)),
        label: `${y} 年第 ${q + 1} 季度`,
        compareLabel: `${prev.getFullYear()} 年第 ${Math.floor(prev.getMonth() / 3) + 1} 季度`,
      };
    }
    case "本年":
      return { preset, start: `${y}-01-01`, end: `${y}-12-31`, label: `${y} 年`, compareLabel: `${y - 1} 年` };
  }
}

export function rangeText(range: Pick<PeriodRange, "start" | "end">): string {
  return range.start.slice(0, 4) === range.end.slice(0, 4)
    ? `${range.start} – ${monthDay(range.end)}`
    : `${range.start} – ${range.end}`;
}

/** Last day of the range that has already happened (charts never run into the future). */
export function rangeAnchor(range: Pick<PeriodRange, "end">, today: Date = new Date()): Date {
  const todayKey = localDate(today);
  return parseLocalDate(range.end < todayKey ? range.end : todayKey);
}

/** Monday-start labels (M/D) for the `count` weeks ending with the week containing `anchor`. */
export function recentWeekLabels(count: number, anchor: Date = new Date()): string[] {
  const anchorKey = localDate(anchor);
  const monday = addDays(anchorKey, -((anchor.getDay() + 6) % 7));
  return Array.from({ length: count }, (_, index) => {
    const day = parseLocalDate(addDays(monday, (index - count + 1) * 7));
    return `${day.getMonth() + 1}/${day.getDate()}`;
  });
}

/** Nightly batch runs at 08:00 local; before that the latest data is from yesterday. */
export function dataUpdatedStamp(now: Date = new Date()): string {
  const day = now.getHours() >= 8 ? localDate(now) : addDays(localDate(now), -1);
  return `${monthDay(day)} 08:00`;
}

/* ─── Member-derived metrics ─────────────────────── */

export const AT_RISK_DAYS = 30;

export type RiskStatus = "卡包有效" | "已过期";

export type RiskMember = {
  id: string;
  name: string;
  phone: string;
  lastClass: string;
  daysSince: number;
  status: RiskStatus;
  cards: Array<{ label: string; kind: "group" | "private" }>;
};

export function daysSinceLastClass(member: Pick<Member, "lastClass">, today: string = localDate()): number | undefined {
  return member.lastClass ? daysBetween(member.lastClass, today) : undefined;
}

function hasUsablePrivate(member: Member): boolean {
  return member.privateRemaining > 0 && !member.privateFrozen && !member.privateRefunded;
}

/** Members with a still-usable card or pack (same rule as the dashboard's 活跃会员 card). */
export function membersWithValidCards(members: Member[], today: string = localDate()): Member[] {
  return members.filter((member) => {
    const status = computeMonthlyStatus(member, today);
    return status === "有效" || status === "即将到期" || status === "待激活" || member.privateRemaining > 0;
  });
}

/** At least one class within the last AT_RISK_DAYS days. */
export function recentlyActiveMembers(members: Member[], today: string = localDate()): Member[] {
  return members.filter((member) => {
    const days = daysSinceLastClass(member, today);
    return days !== undefined && days <= AT_RISK_DAYS;
  });
}

/** Members who have attended before but not in the last AT_RISK_DAYS days, longest absence first. */
export function atRiskMembers(members: Member[], packages: PackageProduct[], today: string = localDate()): RiskMember[] {
  const productName = (id?: string) => packages.find((item) => item.id === id)?.name;
  return members
    .flatMap((member) => {
      const daysSince = daysSinceLastClass(member, today);
      if (daysSince === undefined || daysSince <= AT_RISK_DAYS || !member.lastClass) return [];
      const monthlyStatus = computeMonthlyStatus(member, today);
      const cards: RiskMember["cards"] = [];
      if (member.monthlyPackageId && monthlyStatus !== "暂无月卡") {
        cards.push({ label: `${productName(member.monthlyPackageId) ?? "月卡"} · ${monthlyStatus}`, kind: "group" });
      }
      if (member.privateRemaining > 0) {
        cards.push({ label: `私教剩 ${member.privateRemaining} 次`, kind: "private" });
      }
      const status: RiskStatus = isMonthlyBookable(member, today) || hasUsablePrivate(member) ? "卡包有效" : "已过期";
      return [{ id: member.id, name: member.name, phone: member.phone, lastClass: member.lastClass, daysSince, status, cards }];
    })
    .sort((a, b) => b.daysSince - a.daysSince);
}

export function lowPrivateBalanceMembers(members: Member[], max = 2): Member[] {
  return members.filter((member) => member.privateRemaining > 0 && member.privateRemaining <= max);
}

export function expiringPassMembers(members: Member[], today: string = localDate()): Member[] {
  return members
    .filter((member) => computeMonthlyStatus(member, today) === "即将到期")
    .sort((a, b) => (a.expiry ?? "").localeCompare(b.expiry ?? ""));
}

export type PrepaidBalance = {
  total: number;
  privateSessions: number;
  privateValue: number;
  activePasses: number;
  passValue: number;
};

/**
 * Unearned balance still owed to members: remaining private sessions at the pack's unit price,
 * plus the unused share of active passes (pending-activation passes count in full).
 */
export function prepaidBalance(members: Member[], packages: PackageProduct[], today: string = localDate()): PrepaidBalance {
  const product = (id?: string) => packages.find((item) => item.id === id);
  let privateSessions = 0;
  let privateValue = 0;
  let activePasses = 0;
  let passValue = 0;
  for (const member of members) {
    const privatePack = product(member.privatePackageId);
    if (member.privateRemaining > 0 && !member.privateRefunded) {
      privateSessions += member.privateRemaining;
      if (privatePack?.sessions) privateValue += (privatePack.price / privatePack.sessions) * member.privateRemaining;
    }
    const pass = product(member.monthlyPackageId);
    if (!pass?.validDays || member.monthlyRefunded) continue;
    const status = computeMonthlyStatus(member, today);
    if (status === "待激活") {
      activePasses += 1;
      passValue += pass.price;
    } else if (isMonthlyBookable(member, today) && member.expiry) {
      const daysLeft = Math.min(pass.validDays, daysBetween(today, member.expiry) + 1);
      activePasses += 1;
      passValue += (pass.price * daysLeft) / pass.validDays;
    }
  }
  privateValue = Math.round(privateValue);
  passValue = Math.round(passValue);
  return { total: privateValue + passValue, privateSessions, privateValue, activePasses, passValue };
}

/* ─── Schedule / reconciliation alerts ───────────── */

export type FillAlert = {
  className: string;
  instructor: string;
  date: string;
  start: string;
  booked: number;
  capacity: number;
  rate: number;
};

/** Lowest-booked visible group session in the next 7 days. */
export function lowestUpcomingFill(
  sessions: ClassSession[],
  templates: ClassTemplate[],
  today: string = localDate(),
): FillAlert | undefined {
  const lastDay = addDays(today, 6);
  const rows = sessions.flatMap((session) => {
    const template = templates.find((item) => item.id === session.classId);
    if (!template || template.format !== "团课" || !session.isVisible) return [];
    if (session.date < today || session.date > lastDay || template.capacity <= 0) return [];
    return [{
      className: template.name,
      instructor: session.instructor,
      date: session.date,
      start: session.start,
      booked: session.booked,
      capacity: template.capacity,
      rate: Math.round((session.booked / template.capacity) * 100),
    }];
  });
  return rows.sort((a, b) => a.rate - b.rate || a.date.localeCompare(b.date))[0];
}

export function pendingRecon(records: DemoReconRecord[]) {
  const pending = records.filter((record) => record.matchStatus !== "已匹配");
  return {
    count: pending.length,
    unmatched: pending.filter((record) => record.matchStatus === "未匹配").length,
    mismatched: pending.filter((record) => record.matchStatus === "金额不符").length,
    amount: pending.reduce((sum, record) => sum + record.amount, 0),
  };
}
