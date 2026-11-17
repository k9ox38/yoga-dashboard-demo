import { daysUntil, localDate } from "./dates";
import type { Member, MemberCard, PackageProduct } from "../components/data";

export type MonthlyStatus = Member["monthlyStatus"];
export type PackCardStatus = "未激活" | "生效中" | "已过期" | "已用完" | "已退款";

const EXPIRING_SOON_DAYS = 14;

export type MonthlyFields = Pick<
  Member,
  "monthlyActivatedAt" | "monthlyRefunded" | "expiry" | "monthlyPackageId" | "monthlyStatus"
>;

/**
 * Derive list/detail monthly-card status from activation, local expiry (inclusive), and refund.
 * Freeze is shown separately and does not replace status text.
 */
export function computeMonthlyStatus(member: MonthlyFields, today: string = localDate()): MonthlyStatus {
  if (member.monthlyRefunded) return "暂无月卡";
  if (!member.monthlyActivatedAt) {
    return member.monthlyPackageId ? "待激活" : "暂无月卡";
  }
  if (!member.expiry) return "有效";
  const remaining = daysUntil(member.expiry, today);
  if (remaining < 0) return "已到期";
  if (remaining <= EXPIRING_SOON_DAYS) return "即将到期";
  return "有效";
}

/** Expiry day itself remains usable (inclusive). */
export function isExpiryActive(expireAt: string | undefined, today: string = localDate()): boolean {
  if (!expireAt) return true;
  return expireAt >= today;
}

export function isMonthlyBookable(member: Pick<Member, "monthlyFrozen" | "monthlyActivatedAt" | "monthlyRefunded" | "expiry" | "monthlyPackageId" | "monthlyStatus">, today: string = localDate()): boolean {
  if (member.monthlyFrozen || member.monthlyRefunded) return false;
  const status = computeMonthlyStatus(member, today);
  return (status === "有效" || status === "即将到期") && isExpiryActive(member.expiry, today);
}

export function computePackCardStatus(card: MemberCard, product: PackageProduct, today: string = localDate()): PackCardStatus {
  if (card.refunded) return "已退款";
  if (!card.activatedAt) return "未激活";
  if (card.expireAt && card.expireAt < today) return "已过期";
  if (product.type === "class_pack" && (card.remainingSessions ?? 0) === 0) return "已用完";
  return "生效中";
}

export function withDerivedMonthlyStatus<T extends MonthlyFields>(member: T, today: string = localDate()): T & { monthlyStatus: MonthlyStatus } {
  return { ...member, monthlyStatus: computeMonthlyStatus(member, today) };
}
