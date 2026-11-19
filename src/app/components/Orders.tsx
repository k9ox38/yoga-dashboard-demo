import { useEffect, useState, useMemo } from "react";
import { Search, RefreshCw, Plus, X, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useStore } from "../store-context";
import { localDateTime } from "../lib/dates";
import { demoOrders, type DemoOrder } from "../lib/demoCommerce";
import { DateRangePicker } from "./DatePicker";

/* ─── Types ──────────────────────────────────────── */

type OrderStatus = "待支付" | "已支付" | "退款中" | "已退款" | "支付失败" | "已关闭";
type PayChannel  = "微信支付" | "现金" | "银行卡" | "其他";

interface Order {
  id: string; orderNo: string;
  userName: string; userPhone: string;
  packageName: string; packageCode: string;
  payChannel: PayChannel;
  totalAmount: number; pointsDeduction: number; actualAmount: number; pointsEarned: number;
  status: OrderStatus;
  transactionNo?: string;
  createdAt: string; paidAt?: string; refundedAt?: string;
  refundReason?: string; refundAmount?: number; remark?: string;
}

type ModalState =
  | { kind: "none" }
  | { kind: "offline" }
  | { kind: "confirm_pay";    order: Order }
  | { kind: "refund";         order: Order }
  | { kind: "confirm_refund"; order: Order }
  | { kind: "close_order";    order: Order };

/* ─── Seed data from shared store members/packages ─ */

function toOrder(demo: DemoOrder): Order {
  return {
    id: demo.id,
    orderNo: demo.orderNo,
    userName: demo.userName,
    userPhone: demo.userPhone,
    packageName: demo.packageName,
    packageCode: demo.packageCode,
    payChannel: demo.payChannel,
    totalAmount: demo.totalAmount,
    pointsDeduction: demo.pointsDeduction,
    actualAmount: demo.actualAmount,
    pointsEarned: demo.pointsEarned,
    status: demo.status,
    transactionNo: demo.transactionNo,
    createdAt: demo.createdAt,
    paidAt: demo.paidAt,
    refundedAt: demo.refundedAt,
    refundReason: demo.refundReason,
    refundAmount: demo.refundAmount,
    remark: demo.remark,
  };
}

const INIT_ORDERS: Order[] = demoOrders.map(toOrder);

/* ─── Style maps ─────────────────────────────────── */

const statusBadge: Record<OrderStatus, string> = {
  "待支付":   "bg-amber-50 text-amber-700 border border-amber-200",
  "已支付":   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "退款中":   "bg-sky-50 text-sky-700 border border-sky-200",
  "已退款":   "bg-stone-100 text-stone-500 border border-stone-200",
  "支付失败": "bg-rose-50 text-rose-600 border border-rose-200",
  "已关闭":   "bg-stone-100 text-stone-400 border border-stone-200",
};

/* ─── Main component ─────────────────────────────── */

export function Orders() {
  const { members, packages } = useStore();
  const memberOptions = members.map((member) => ({ name: member.name, phone: member.phone }));
  const packageOptions = packages.filter((item) => item.status === "上架中").map((item) => ({ code: item.code, name: item.name, price: item.price }));
  const [orders, setOrders]     = useState<Order[]>(INIT_ORDERS);
  const [modal, setModal]       = useState<ModalState>({ kind: "none" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [fStatus, setFStatus]   = useState<"" | OrderStatus>("");
  const [fChannel, setFChannel] = useState<"" | PayChannel>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");

  const filtered = useMemo(() => orders.filter((o) => {
    if (search && !o.orderNo.includes(search) && !o.userName.includes(search)) return false;
    if (fStatus  && o.status     !== fStatus)  return false;
    if (fChannel && o.payChannel !== fChannel) return false;
    if (dateFrom && o.createdAt.slice(0, 10) < dateFrom) return false;
    if (dateTo   && o.createdAt.slice(0, 10) > dateTo)   return false;
    return true;
  }), [orders, search, fStatus, fChannel, dateFrom, dateTo]);

  const stats = useMemo(() => ({
    total:         orders.length,
    revenue:       orders.filter(o => o.status === "已支付").reduce((s, o) => s + o.actualAmount, 0),
    pendingPay:    orders.filter(o => o.status === "待支付").length,
    pendingRefund: orders.filter(o => o.status === "退款中").length,
  }), [orders]);
  const selectedOrder = orders.find((order) => order.id === selectedId) ?? null;

  /* ── Mutations ── */
  const update = (id: string, patch: Partial<Order>) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));

  const confirmPay = (o: Order) => {
    update(o.id, { status: "已支付", paidAt: localDateTime(), transactionNo: `OFFLINE-${Date.now()}` });
    setModal({ kind: "none" });
  };
  const confirmRefund = (o: Order) => {
    update(o.id, { status: "已退款", refundedAt: localDateTime() });
    setModal({ kind: "none" });
  };
  const closeOrder = (o: Order) => {
    update(o.id, { status: "已关闭" });
    setModal({ kind: "none" });
  };
  const submitRefund = (o: Order, amount: number, reason: string) => {
    update(o.id, { status: "退款中", refundAmount: amount, refundReason: reason });
    setModal({ kind: "none" });
  };
  const submitOffline = (draft: Partial<Order>) => {
    const now = localDateTime();
    const pkg = packageOptions.find(p => p.code === draft.packageCode);
    const member = memberOptions.find(m => m.name === draft.userName);
    const newOrder: Order = {
      id: `o_${Date.now()}`,
      orderNo: `ORD-OFFLINE-${Date.now().toString().slice(-6)}`,
      userName:       draft.userName    ?? "",
      userPhone:      member?.phone     ?? "—",
      packageName:    pkg?.name         ?? "",
      packageCode:    draft.packageCode ?? "",
      payChannel:     draft.payChannel  ?? "现金",
      totalAmount:    draft.actualAmount ?? 0,
      pointsDeduction: draft.pointsDeduction ?? 0,
      actualAmount:   draft.actualAmount ?? 0,
      pointsEarned:   Math.floor((draft.actualAmount ?? 0) * 10),
      status:         "已支付",
      transactionNo:  `OFFLINE-${Date.now()}`,
      createdAt:      now,
      paidAt:         now,
      remark:         draft.remark,
    };
    setOrders(prev => [newOrder, ...prev]);
    setModal({ kind: "none" });
  };

  return (
    <div className="space-y-4 sm:space-y-5 p-4 sm:p-6 lg:p-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard selected={fStatus === "已支付"} onClick={() => setFStatus(fStatus === "已支付" ? "" : "已支付")} icon={<span className="text-base font-semibold leading-none text-white">¥</span>} accent="bg-emerald-600" label="总收入" value={`¥${stats.revenue.toLocaleString()}`} sub="已支付订单合计" />
        <StatCard selected={!fStatus} onClick={() => setFStatus("")} icon={<CheckCircle2 className="w-4 h-4 text-white" />} accent="bg-teal-500" label="总订单数" value={String(stats.total)} sub="全部状态" />
        <StatCard selected={fStatus === "待支付"} onClick={() => setFStatus(fStatus === "待支付" ? "" : "待支付")} icon={<Clock className="w-4 h-4 text-white" />} accent="bg-amber-500" label="待支付" value={String(stats.pendingPay)} sub="等待用户支付" />
        <StatCard selected={fStatus === "退款中"} onClick={() => setFStatus(fStatus === "退款中" ? "" : "退款中")} icon={<AlertCircle className="w-4 h-4 text-white" />} accent="bg-sky-500" label="退款中" value={String(stats.pendingRefund)} sub="退款处理中" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索订单号 / 用户"
            className="h-9 pl-8 pr-3 w-52 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>
        <Sel value={fStatus} onChange={(v) => setFStatus(v as "" | OrderStatus)}>
          <option value="">全部状态</option>
          {(["待支付","已支付","退款中","已退款","支付失败","已关闭"] as OrderStatus[]).map(s => <option key={s}>{s}</option>)}
        </Sel>
        <Sel value={fChannel} onChange={(v) => setFChannel(v as "" | PayChannel)}>
          <option value="">全部渠道</option>
          {(["微信支付","现金","银行卡","其他"] as PayChannel[]).map(c => <option key={c}>{c}</option>)}
        </Sel>
        <DateRangePicker from={dateFrom} to={dateTo} onChange={(from, to) => { setDateFrom(from); setDateTo(to); }} />
        <div className="flex-1" />
        <button onClick={() => setModal({ kind: "offline" })} className="h-9 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm text-stone-700 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> 线下录入
        </button>
        <button onClick={() => setOrders(INIT_ORDERS)} className="h-9 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm text-stone-600 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> 刷新
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          {/* Columns size to their content and share any spare width; the table only scrolls when the content itself is wider than the panel. */}
          <table className="w-full min-w-max text-left">
            <thead><tr className="whitespace-nowrap bg-stone-50 border-b border-stone-100 text-xs text-[#6B7280]">
              <th className="px-4 py-2.5 font-normal">订单号</th><th className="px-4 py-2.5 font-normal">用户</th><th className="px-4 py-2.5 font-normal">套餐</th><th className="px-4 py-2.5 font-normal">渠道</th><th className="px-4 py-2.5 text-right font-normal">实付金额</th><th className="py-2.5 pl-6 pr-4 font-normal">状态</th><th className="px-4 py-2.5 font-normal">创建时间</th><th className="sticky right-0 z-10 w-[110px] bg-stone-50 px-4 py-2.5 font-normal">操作</th>
            </tr></thead>
            <tbody>{filtered.map((o) => {
              const received = !["待支付", "支付失败", "已关闭"].includes(o.status);
              return <tr key={o.id} onClick={() => setSelectedId(o.id)} className="group h-[62px] cursor-pointer border-b border-stone-100 last:border-0 transition-colors hover:bg-[#f4fbf7]">
                <td className="px-4 py-3"><span className="whitespace-nowrap font-mono text-xs text-[#6B7280]">{o.orderNo}</span></td>
                <td className="px-4 py-3"><div className="whitespace-nowrap text-sm text-stone-900">{o.userName}</div><div className="whitespace-nowrap text-xs text-[#6B7280]">{o.userPhone}</div></td>
                <td className="px-4 py-3"><div title={o.packageName} className="max-w-[200px] truncate text-sm text-stone-700">{o.packageName}</div><div className="whitespace-nowrap font-mono text-xs text-[#6B7280]">{o.packageCode}</div></td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-700">{o.payChannel}</td>
                <td className="px-4 py-3 text-right tabular-nums">{received ? o.status === "已退款" ? <><div className="whitespace-nowrap text-sm font-medium text-[#6B7280] line-through">¥{o.actualAmount.toLocaleString()}</div><div className="mt-0.5 whitespace-nowrap text-right text-xs text-[#6B7280]">已退 ¥{(o.refundAmount ?? o.actualAmount).toLocaleString()}</div></> : <><div className="whitespace-nowrap text-sm font-semibold text-stone-900">¥{o.actualAmount.toLocaleString()}</div>{o.pointsDeduction > 0 && <div className="mt-0.5 whitespace-nowrap text-right text-xs text-[#6B7280]">积分 -¥{o.pointsDeduction.toLocaleString()}</div>}</> : <span className="text-sm text-[#6B7280]">—</span>}</td>
                <td className="py-3 pl-6 pr-4"><span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${statusBadge[o.status]}`}>{o.status}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-[#6B7280]">{o.createdAt.slice(0, 16)}</td>
                <td className="sticky right-0 w-[110px] bg-white px-3 py-3 transition-colors group-hover:bg-[#f4fbf7]"><div className="flex items-center justify-end gap-2 whitespace-nowrap">
                  {o.status === "待支付" && <button onClick={(event) => { event.stopPropagation(); setModal({ kind: "confirm_pay", order: o }); }} className="h-7 rounded bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-700">确认支付</button>}
                  {o.status === "退款中" && <button onClick={(event) => { event.stopPropagation(); setModal({ kind: "confirm_refund", order: o }); }} className="h-7 rounded bg-rose-600 px-2 text-xs text-white hover:bg-rose-700">确认退款</button>}
                  {o.status === "支付失败" && <button onClick={(event) => { event.stopPropagation(); setModal({ kind: "close_order", order: o }); }} className="h-7 px-1 text-xs text-stone-600 hover:text-stone-900">关闭</button>}
                  <ChevronRight className="size-4 shrink-0 text-stone-400" />
                </div></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="py-16 text-center text-sm text-[#6B7280]">暂无匹配订单</div>}
      </div>

      {/* Modals */}
      {selectedOrder && <OrderDetailDrawer order={selectedOrder} onClose={() => setSelectedId(null)} onAction={(action) => { if (action === "pay") setModal({ kind: "confirm_pay", order: selectedOrder }); else if (action === "refund") setModal({ kind: "refund", order: selectedOrder }); else if (action === "confirm_refund") setModal({ kind: "confirm_refund", order: selectedOrder }); else setModal({ kind: "close_order", order: selectedOrder }); }} />}
      {modal.kind === "offline"        && <OfflineOrderModal members={memberOptions} packages={packageOptions} onClose={() => setModal({ kind: "none" })} onSubmit={submitOffline} />}
      {modal.kind === "confirm_pay"    && <ConfirmModal title="确认支付" desc={`确认将订单 ${modal.order.orderNo} 标记为「已支付」？\n实付金额 ¥${modal.order.actualAmount.toLocaleString()}，将同时为用户激活对应卡包。`} confirmLabel="确认已支付" confirmCls="bg-emerald-600 hover:bg-emerald-700 text-white" onClose={() => setModal({ kind: "none" })} onConfirm={() => confirmPay(modal.order)} />}
      {modal.kind === "refund"         && <RefundModal order={modal.order} onClose={() => setModal({ kind: "none" })} onSubmit={(amount, reason) => submitRefund(modal.order, amount, reason)} />}
      {modal.kind === "confirm_refund" && <ConfirmModal title="确认退款" desc={`确认向 ${modal.order.userName} 退款 ¥${modal.order.actualAmount.toLocaleString()}？\n退款原因：${modal.order.refundReason ?? "—"}\n操作不可撤销，请确认无误。`} confirmLabel="确认退款" confirmCls="bg-rose-600 hover:bg-rose-700 text-white" onClose={() => setModal({ kind: "none" })} onConfirm={() => confirmRefund(modal.order)} />}
      {modal.kind === "close_order"    && <ConfirmModal title="关闭订单" desc={`确认关闭订单 ${modal.order.orderNo}？\n关闭后订单无法恢复，用户将无法继续支付。`} confirmLabel="确认关闭" confirmCls="bg-rose-600 hover:bg-rose-700 text-white" onClose={() => setModal({ kind: "none" })} onConfirm={() => closeOrder(modal.order)} />}
    </div>
  );
}

/* ─── Order detail drawer ────────────────────────── */

function OrderDetailDrawer({ order: o, onClose, onAction }: {
  order: Order; onClose: () => void;
  onAction: (a: "pay" | "refund" | "confirm_refund" | "close") => void;
}) {
  useEffect(() => {
    const handle = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 bg-stone-900/35" onMouseDown={onClose}>
      <aside role="dialog" aria-modal="true" aria-label="订单详情" className="animate-in slide-in-from-right absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-white shadow-2xl duration-300" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-stone-200 px-6 py-5">
          <div><div className="text-sm font-medium text-stone-900">订单详情</div><div className="mt-2 flex items-center gap-2"><span className="font-mono text-xs text-[#6B7280]">{o.orderNo}</span><span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge[o.status]}`}>{o.status}</span></div></div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100" aria-label="关闭"><X className="size-4" /></button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <section><div className="text-xs text-[#6B7280]">用户</div><div className="mt-2 text-sm font-medium text-stone-900">{o.userName}</div><div className="mt-1 text-xs text-[#6B7280]">{o.userPhone}</div></section>
          <section><div className="text-xs text-[#6B7280]">套餐</div><div className="mt-2 text-sm font-medium text-stone-900">{o.packageName}</div><div className="mt-1 font-mono text-xs text-[#6B7280]">{o.packageCode}</div></section>
          <section className="rounded-xl bg-stone-50 p-4"><div className="space-y-3 text-sm"><AmountRow label="原价" value={`¥${o.totalAmount.toLocaleString()}`} /><AmountRow label="积分抵扣" value={o.pointsDeduction ? `-¥${o.pointsDeduction.toLocaleString()}` : "—"} /><div className="border-t border-stone-200 pt-3"><AmountRow label="实付金额" value={`¥${o.actualAmount.toLocaleString()}`} bold /></div></div></section>
          <section><div className="text-xs text-[#6B7280]">支付渠道</div><div className="mt-2 text-sm text-stone-800">{o.payChannel}</div></section>
          <section><div className="mb-4 text-sm font-medium text-stone-900">订单进度</div><div className="relative space-y-6 pl-7 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-stone-200"><Timeline label="创建时间" time={o.createdAt} active />{o.paidAt && <Timeline label="支付时间" time={o.paidAt} />}{o.refundedAt && <Timeline label="退款时间" time={o.refundedAt} />}</div></section>
          {o.refundReason && <section className="rounded-lg border border-stone-200 p-4"><div className="text-xs text-[#6B7280]">退款原因</div><div className="mt-2 text-sm leading-6 text-stone-800">{o.refundReason}</div></section>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-stone-200 bg-stone-50 px-6 py-4">
          {o.status === "待支付"   && <button onClick={() => onAction("pay")}            className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm">确认支付</button>}
          {o.status === "已支付"   && <button onClick={() => onAction("refund")}         className="h-9 px-4 rounded-lg border border-rose-300 hover:bg-rose-50 text-sm text-rose-600">发起退款</button>}
          {o.status === "退款中"   && <button onClick={() => onAction("confirm_refund")} className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm">确认退款</button>}
          {o.status === "支付失败" && <button onClick={() => onAction("close")}          className="h-9 px-4 rounded-lg text-stone-600 hover:bg-stone-100 text-sm">关闭订单</button>}
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-sm">关闭</button>
        </div>
      </aside>
    </div>
  );
}

/* ─── Offline order modal ────────────────────────── */

function OfflineOrderModal({ members, packages, onClose, onSubmit }: {
  members: Array<{ name: string; phone: string }>;
  packages: Array<{ code: string; name: string; price: number }>;
  onClose: () => void;
  onSubmit: (d: Partial<Order>) => void;
}) {
  const [v, setV] = useState<{ userName: string; packageCode: string; payChannel: PayChannel; actualAmount: number; pointsDeduction: number; remark: string }>({
    userName: members[0]?.name ?? "", packageCode: packages[0]?.code ?? "", payChannel: "现金",
    actualAmount: packages[0]?.price ?? 0, pointsDeduction: 0, remark: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setPkg = (code: string) => {
    const pkg = packages.find(p => p.code === code);
    setV(p => ({ ...p, packageCode: code, actualAmount: pkg?.price ?? p.actualAmount }));
  };

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!v.userName)          e.userName = "请选择用户";
    if (!v.packageCode)       e.pkg = "请选择套餐";
    if (v.actualAmount <= 0)  e.amount = "实付金额需大于 0";
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit(v);
  };

  return (
    <Modal title="线下录入订单" subtitle="录入后订单状态自动标记为「已支付」" onClose={onClose}>
      <div className="p-6 space-y-4">
        <MF label="用户" error={errors.userName}>
          <Sel value={v.userName} onChange={(val) => setV(p => ({ ...p, userName: val }))} full>
            {members.map(m => <option key={m.name}>{m.name}</option>)}
          </Sel>
        </MF>
        <MF label="套餐产品" error={errors.pkg}>
          <Sel value={v.packageCode} onChange={setPkg} full>
            {packages.map(p => <option key={p.code} value={p.code}>{p.name}（¥{p.price}）</option>)}
          </Sel>
        </MF>
        <MF label="支付渠道">
          <Sel value={v.payChannel} onChange={(val) => setV(p => ({ ...p, payChannel: val as PayChannel }))} full>
            {(["微信支付","现金","银行卡","其他"] as PayChannel[]).map(c => <option key={c}>{c}</option>)}
          </Sel>
        </MF>
        <div className="grid grid-cols-2 gap-4">
          <MF label="实付金额（¥）" error={errors.amount}>
            <input type="number" min={0} value={v.actualAmount} onChange={(e) => setV(p => ({ ...p, actualAmount: Number(e.target.value) }))} className={inp(errors.amount)} />
          </MF>
          <MF label="积分抵扣（¥）">
            <input type="number" min={0} value={v.pointsDeduction} onChange={(e) => setV(p => ({ ...p, pointsDeduction: Number(e.target.value) }))} className={inp()} />
          </MF>
        </div>
        <MF label="备注">
          <textarea value={v.remark} onChange={(e) => setV(p => ({ ...p, remark: e.target.value }))} rows={2} className={inp() + " h-auto py-2 resize-none"} placeholder="可选，用于记录线下收款说明" />
        </MF>
      </div>
      <ModalFooter onClose={onClose} onSubmit={handleSubmit} label="录入订单" />
    </Modal>
  );
}

/* ─── Refund modal ───────────────────────────────── */

function RefundModal({ order: o, onClose, onSubmit }: { order: Order; onClose: () => void; onSubmit: (amount: number, reason: string) => void }) {
  const [amount, setAmount] = useState(o.actualAmount);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const handle = () => {
    if (amount <= 0 || amount > o.actualAmount) { setErr(`退款金额应在 0 至 ¥${o.actualAmount.toLocaleString()} 之间`); return; }
    if (!reason.trim()) { setErr("请填写退款原因"); return; }
    onSubmit(amount, reason);
  };
  return (
    <Modal title="发起退款" subtitle={`${o.userName} · ${o.packageName} · ¥${o.actualAmount.toLocaleString()}`} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          发起退款后订单状态将变更为「退款中」，需再次确认退款后方可完成。
        </div>
        <MF label="退款金额（¥）">
          <input autoFocus type="number" min={0.01} max={o.actualAmount} step={0.01} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={inp(err)} />
        </MF>
        <MF label="退款原因" error={err}>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className={inp(err) + " h-auto py-2 resize-none"} placeholder="请填写退款原因，将同步给用户" />
        </MF>
      </div>
      <ModalFooter onClose={onClose} onSubmit={handle} label="发起退款" cls="bg-rose-600 hover:bg-rose-700 text-white" />
    </Modal>
  );
}

/* ─── Confirm modal ──────────────────────────────── */

function ConfirmModal({ title, desc, confirmLabel, confirmCls, onClose, onConfirm }: {
  title: string; desc: string; confirmLabel: string; confirmCls: string;
  onClose: () => void; onConfirm: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="p-6">
        <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">{desc}</p>
      </div>
      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200 bg-stone-50 rounded-b-2xl">
        <button onClick={onClose} className="h-9 px-4 rounded-lg border border-stone-200 hover:bg-white text-sm">取消</button>
        <button onClick={onConfirm} className={`h-9 px-4 rounded-lg text-sm ${confirmCls}`}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

/* ─── Primitives ─────────────────────────────────── */

function StatCard({ icon, accent, label, value, sub, selected, onClick }: { icon: React.ReactNode; accent: string; label: string; value: string; sub: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={`rounded-xl border p-4 sm:p-5 flex w-full min-w-0 items-start gap-3 sm:gap-4 text-left transition-colors ${selected ? "border-emerald-500 bg-emerald-50/70" : "border-stone-200 bg-white hover:border-stone-300"}`}>
      <div className={`size-8 sm:size-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-stone-500">{label}</div>
        <div className="text-xl text-stone-900 mt-0.5">{value}</div>
        <div className="text-xs text-[#6B7280] mt-0.5">{sub}</div>
      </div>
    </button>
  );
}

function AmountRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className="flex items-center justify-between"><span className="text-[#6B7280]">{label}</span><span className={`tabular-nums ${bold ? "font-semibold text-stone-950" : "text-stone-700"}`}>{value}</span></div>;
}

function Timeline({ label, time, active }: { label: string; time: string; active?: boolean }) {
  return <div className="relative"><span className={`absolute -left-7 top-1 size-3 rounded-full ring-4 ring-white ${active ? "bg-emerald-600" : "bg-stone-400"}`} /><div className="text-sm text-stone-800">{label}</div><div className="mt-1 text-xs tabular-nums text-[#6B7280]">{time}</div></div>;
}

function Modal({ title, subtitle, onClose, children, wide }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const handle = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] w-full ${wide ? "max-w-2xl" : "max-w-lg"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 shrink-0">
          <div>
            <div className="text-stone-900">{title}</div>
            {subtitle && <div className="text-xs text-stone-400 font-mono mt-0.5">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onClose, onSubmit, label, cls = "bg-emerald-600 hover:bg-emerald-700 text-white" }: { onClose: () => void; onSubmit: () => void; label: string; cls?: string }) {
  return (
    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200 bg-stone-50 rounded-b-2xl shrink-0">
      <button onClick={onClose} className="h-9 px-4 rounded-lg border border-stone-200 hover:bg-white text-sm">取消</button>
      <button onClick={onSubmit} className={`h-9 px-4 rounded-lg text-sm ${cls}`}>{label}</button>
    </div>
  );
}

function Sel({ value, onChange, children, full }: { value: string; onChange: (v: string) => void; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`relative ${full ? "w-full" : ""}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${full ? "w-full" : ""} h-9 pl-3 pr-8 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500`}>
        {children}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

function MF({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-stone-600">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <div className="text-xs text-rose-600 mt-1">{error}</div>}
    </label>
  );
}

function DR({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs text-stone-400">{label}</div>
      <div className="text-sm text-stone-800 mt-0.5 flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function inp(error?: string) {
  return `w-full h-9 px-3 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${error ? "border-rose-300" : "border-stone-200 focus:border-emerald-500"}`;
}
