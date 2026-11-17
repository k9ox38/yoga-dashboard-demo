import { addDaysFromToday, localDate, recentMonthKeys, shiftLocalDateTime } from "./dates";
import { members, packageProducts } from "../components/data";

export type OrderStatus = "待支付" | "已支付" | "退款中" | "已退款" | "支付失败" | "已关闭";
export type PayChannel = "微信支付" | "现金" | "银行卡" | "其他";
export type ReconChannel = "微信支付" | "银行" | "现金" | "其他";
export type MatchStatus = "已匹配" | "未匹配" | "金额不符";

export type DemoOrder = {
  id: string;
  orderNo: string;
  memberId: string;
  userName: string;
  userPhone: string;
  packageId: string;
  packageName: string;
  packageCode: string;
  payChannel: PayChannel;
  totalAmount: number;
  pointsDeduction: number;
  actualAmount: number;
  pointsEarned: number;
  status: OrderStatus;
  transactionNo?: string;
  createdAt: string;
  paidAt?: string;
  refundedAt?: string;
  refundReason?: string;
  refundAmount?: number;
  remark?: string;
};

export type DemoReconRecord = {
  id: string;
  channel: ReconChannel;
  channelTradeNo: string;
  amount: number;
  currency: "CNY";
  tradeTime: string;
  matchStatus: MatchStatus;
  matchedOrderNo?: string;
  matchedAmount?: number;
  rawData: string;
};

type OrderSpec = {
  id: string;
  seq: string;
  memberId: string;
  packageId: string;
  payChannel: PayChannel;
  pointsDeduction?: number;
  status: OrderStatus;
  dayOffset: number;
  time: string;
  paidTime?: string;
  refundReason?: string;
  refundAmount?: number;
  refundDayOffset?: number;
  remark?: string;
  transactionNo?: string;
};

function orderNoFor(dayOffset: number, seq: string, today = new Date()): string {
  const day = addDaysFromToday(dayOffset, today).replace(/-/g, "");
  return `ORD-${day}-${seq}`;
}

function findMember(id: string) {
  const member = members.find((item) => item.id === id);
  if (!member) throw new Error(`Demo member missing: ${id}`);
  return member;
}

function findPackage(id: string) {
  const product = packageProducts.find((item) => item.id === id);
  if (!product) throw new Error(`Demo package missing: ${id}`);
  return product;
}

const ORDER_SPECS: OrderSpec[] = [
  { id: "o01", seq: "0001", memberId: "M000128", packageId: "p2", payChannel: "微信支付", status: "已支付", dayOffset: -2, time: "09:12:33", paidTime: "09:12:58", transactionNo: "4200002234567890" },
  { id: "o02", seq: "0007", memberId: "M000134", packageId: "p4", payChannel: "微信支付", pointsDeduction: 50, status: "已支付", dayOffset: -4, time: "14:22:10", paidTime: "14:22:45", transactionNo: "4200002234567891" },
  { id: "o03", seq: "0003", memberId: "M000140", packageId: "p5", payChannel: "银行卡", status: "待支付", dayOffset: -6, time: "16:05:44" },
  { id: "o04", seq: "0012", memberId: "M000132", packageId: "p1", payChannel: "现金", status: "退款中", dayOffset: -9, time: "11:30:00", paidTime: "11:30:00", refundReason: "学员个人原因无法继续上课，申请全额退款", refundAmount: 680, transactionNo: "CASH-DEMO-001" },
  { id: "o05", seq: "0009", memberId: "M000137", packageId: "p1", payChannel: "微信支付", status: "已退款", dayOffset: -14, time: "10:15:22", paidTime: "10:15:55", refundDayOffset: -14, refundReason: "课程不符合预期，协商退款", refundAmount: 680, transactionNo: "4200002234567892" },
  { id: "o06", seq: "0005", memberId: "M000130", packageId: "p2", payChannel: "微信支付", pointsDeduction: 100, status: "已支付", dayOffset: -16, time: "08:44:20", paidTime: "08:44:52", transactionNo: "4200002234567893" },
  { id: "o07", seq: "0002", memberId: "M000146", packageId: "p3", payChannel: "微信支付", pointsDeduction: 200, status: "已支付", dayOffset: -19, time: "19:33:10", paidTime: "19:33:48", transactionNo: "4200002234567894" },
  { id: "o08", seq: "0011", memberId: "M000149", packageId: "p4", payChannel: "现金", status: "已支付", dayOffset: -23, time: "10:22:00", paidTime: "10:22:00", transactionNo: "CASH-DEMO-002" },
  { id: "o09", seq: "0004", memberId: "M000133", packageId: "p2", payChannel: "微信支付", status: "支付失败", dayOffset: -28, time: "20:15:33" },
  { id: "o10", seq: "0008", memberId: "M000143", packageId: "p5", payChannel: "银行卡", pointsDeduction: 300, status: "已支付", dayOffset: -35, time: "07:08:44", paidTime: "07:09:12", transactionNo: "BANK-DEMO-001" },
  { id: "o11", seq: "0006", memberId: "M000128", packageId: "p1", payChannel: "微信支付", status: "已关闭", dayOffset: -40, time: "14:30:00", remark: "用户超时未支付，自动关闭（演示数据）" },
];

export function buildDemoOrders(today: Date = new Date()): DemoOrder[] {
  return ORDER_SPECS.map((spec) => {
    const member = findMember(spec.memberId);
    const product = findPackage(spec.packageId);
    const pointsDeduction = spec.pointsDeduction ?? 0;
    const totalAmount = product.price;
    const actualAmount = totalAmount - pointsDeduction;
    const createdAt = shiftLocalDateTime(spec.dayOffset, spec.time, today);
    const paidAt = spec.paidTime ? shiftLocalDateTime(spec.dayOffset, spec.paidTime, today) : undefined;
    const refundedAt = spec.status === "已退款"
      ? shiftLocalDateTime(spec.refundDayOffset ?? spec.dayOffset, "16:42:18", today)
      : undefined;
    return {
      id: spec.id,
      orderNo: orderNoFor(spec.dayOffset, spec.seq, today),
      memberId: member.id,
      userName: member.name,
      userPhone: member.phone,
      packageId: product.id,
      packageName: product.name,
      packageCode: product.code,
      payChannel: spec.payChannel,
      totalAmount,
      pointsDeduction,
      actualAmount,
      pointsEarned: ["已支付", "退款中"].includes(spec.status) ? Math.floor(actualAmount * 10) : 0,
      status: spec.status,
      transactionNo: spec.transactionNo,
      createdAt,
      paidAt,
      refundedAt,
      refundReason: spec.refundReason,
      refundAmount: spec.refundAmount,
      remark: spec.remark,
    };
  });
}

export const demoOrders = buildDemoOrders();

type ReconSpec = {
  id: string;
  channel: ReconChannel;
  channelTradeNo: string;
  amount: number;
  dayOffset: number;
  time: string;
  matchStatus: MatchStatus;
  matchedOrderId?: string;
  matchedAmount?: number;
};

const RECON_SPECS: ReconSpec[] = [
  { id: "r01", channel: "微信支付", channelTradeNo: "4200002234567890", amount: 1200, dayOffset: -2, time: "09:12:58", matchStatus: "已匹配", matchedOrderId: "o01", matchedAmount: 1200 },
  { id: "r02", channel: "微信支付", channelTradeNo: "4200002234567891", amount: 630, dayOffset: -4, time: "14:22:45", matchStatus: "已匹配", matchedOrderId: "o02", matchedAmount: 630 },
  { id: "r03", channel: "微信支付", channelTradeNo: "4200002234567895", amount: 680, dayOffset: -3, time: "11:34:20", matchStatus: "未匹配" },
  { id: "r04", channel: "银行", channelTradeNo: "BANK-DEMO-UNMATCH", amount: 1800, dayOffset: -3, time: "09:05:00", matchStatus: "未匹配" },
  { id: "r05", channel: "微信支付", channelTradeNo: "4200002234567892", amount: 660, dayOffset: -14, time: "10:15:55", matchStatus: "金额不符", matchedOrderId: "o05", matchedAmount: 680 },
  { id: "r06", channel: "银行", channelTradeNo: "BANK-DEMO-MISMATCH", amount: 1750, dayOffset: -12, time: "14:30:00", matchStatus: "金额不符", matchedOrderId: "o10", matchedAmount: 1500 },
  { id: "r07", channel: "微信支付", channelTradeNo: "4200002234567893", amount: 1100, dayOffset: -16, time: "08:44:52", matchStatus: "已匹配", matchedOrderId: "o06", matchedAmount: 1100 },
  { id: "r08", channel: "微信支付", channelTradeNo: "4200002234567894", amount: 2000, dayOffset: -19, time: "19:33:48", matchStatus: "已匹配", matchedOrderId: "o07", matchedAmount: 2000 },
  { id: "r09", channel: "现金", channelTradeNo: "CASH-DEMO-002", amount: 680, dayOffset: -23, time: "10:22:00", matchStatus: "已匹配", matchedOrderId: "o08", matchedAmount: 680 },
  { id: "r10", channel: "现金", channelTradeNo: "CASH-DEMO-001", amount: 680, dayOffset: -9, time: "11:30:00", matchStatus: "已匹配", matchedOrderId: "o04", matchedAmount: 680 },
  { id: "r11", channel: "现金", channelTradeNo: "CASH-DEMO-UNMATCH", amount: 2200, dayOffset: -1, time: "14:00:00", matchStatus: "未匹配" },
  { id: "r12", channel: "银行", channelTradeNo: "BANK-DEMO-001", amount: 1500, dayOffset: -35, time: "07:09:12", matchStatus: "已匹配", matchedOrderId: "o10", matchedAmount: 1500 },
  { id: "r13", channel: "微信支付", channelTradeNo: "4200002234567899", amount: 1200, dayOffset: -5, time: "16:22:33", matchStatus: "未匹配" },
  { id: "r14", channel: "其他", channelTradeNo: "OTH-DEMO-001", amount: 680, dayOffset: -7, time: "10:00:00", matchStatus: "已匹配", matchedOrderId: "o08", matchedAmount: 680 },
  { id: "r15", channel: "微信支付", channelTradeNo: "4200002234567897", amount: 1750, dayOffset: -6, time: "20:10:00", matchStatus: "金额不符", matchedOrderId: "o03", matchedAmount: 1800 },
];

export function buildDemoReconRecords(orders: DemoOrder[] = demoOrders, today: Date = new Date()): DemoReconRecord[] {
  const byId = Object.fromEntries(orders.map((order) => [order.id, order]));
  return RECON_SPECS.map((spec) => {
    const matched = spec.matchedOrderId ? byId[spec.matchedOrderId] : undefined;
    const tradeTime = shiftLocalDateTime(spec.dayOffset, spec.time, today);
    return {
      id: spec.id,
      channel: spec.channel,
      channelTradeNo: spec.channelTradeNo,
      amount: spec.amount,
      currency: "CNY",
      tradeTime,
      matchStatus: spec.matchStatus,
      matchedOrderNo: matched?.orderNo,
      matchedAmount: spec.matchedAmount ?? matched?.actualAmount,
      rawData: `${spec.channelTradeNo},${spec.amount.toFixed(2)},CNY,${tradeTime},${spec.matchStatus}`,
    };
  });
}

export const demoReconRecords = buildDemoReconRecords();

export function ordersRefFromDemo(orders: DemoOrder[] = demoOrders) {
  return orders
    .filter((order) => !["支付失败", "已关闭"].includes(order.status))
    .map((order) => ({ no: order.orderNo, amount: order.actualAmount }));
}

/** Near-6-month revenue bars relative to current month from 已支付 demo orders only; months with no paid orders are 0. */
export function buildMonthlyRevenue(
  orders: DemoOrder[] = demoOrders,
  anchor: Date = new Date(),
): Array<{ month: string; revenue: number }> {
  const months = recentMonthKeys(6, anchor);
  const paid = orders.filter((order) => order.status === "已支付");
  const byKey: Record<string, number> = {};
  for (const order of paid) {
    const stamp = (order.paidAt ?? order.createdAt).slice(0, 7);
    byKey[stamp] = (byKey[stamp] ?? 0) + order.actualAmount;
  }
  return months.map((month) => ({
    month: month.label,
    revenue: byKey[month.key] ?? 0,
  }));
}

export function paidRevenueTotal(orders: DemoOrder[] = demoOrders): number {
  return orders.filter((order) => order.status === "已支付").reduce((sum, order) => sum + order.actualAmount, 0);
}

export function currentMonthPaidRevenue(orders: DemoOrder[] = demoOrders, anchor: Date = new Date()): number {
  const key = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, "0")}`;
  return orders
    .filter((order) => order.status === "已支付" && (order.paidAt ?? order.createdAt).startsWith(key))
    .reduce((sum, order) => sum + order.actualAmount, 0);
}

export { localDate };
