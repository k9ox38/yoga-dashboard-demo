import { useState, useMemo } from "react";
import { RefreshCw, Upload, Zap, X, ChevronDown, Eraser, Eye, Link2, FileText } from "lucide-react";
import { demoReconRecords, ordersRefFromDemo, type DemoReconRecord } from "../lib/demoCommerce";
import { localDateTime } from "../lib/dates";

/* ─── Types ──────────────────────────────────────── */

type Channel     = "微信支付" | "银行" | "现金" | "其他";
type MatchStatus = "已匹配" | "未匹配" | "金额不符";

interface ReconRecord {
  id: string;
  channel: Channel;
  channelTradeNo: string;
  amount: number;
  currency: "CNY";
  tradeTime: string;
  matchStatus: MatchStatus;
  matchedOrderNo?: string;
  matchedAmount?: number;
  rawData: string;
}

type ModalState =
  | { kind: "none" }
  | { kind: "import" }
  | { kind: "detail";        record: ReconRecord }
  | { kind: "manual_match";  record: ReconRecord };

/* ─── Seed data ──────────────────────────────────── */

const SEED: ReconRecord[] = demoReconRecords.map((record: DemoReconRecord): ReconRecord => ({
  id: record.id,
  channel: record.channel,
  channelTradeNo: record.channelTradeNo,
  amount: record.amount,
  currency: record.currency,
  tradeTime: record.tradeTime,
  matchStatus: record.matchStatus,
  matchedOrderNo: record.matchedOrderNo,
  matchedAmount: record.matchedAmount,
  rawData: record.rawData,
}));


/* ─── Style maps ─────────────────────────────────── */

const statusBadge: Record<MatchStatus, string> = {
  "已匹配":   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "未匹配":   "bg-amber-50 text-amber-700 border border-amber-200",
  "金额不符": "bg-rose-50 text-rose-600 border border-rose-200",
};

const statusRowLeft: Record<MatchStatus, string> = {
  "已匹配":   "border-l-4 border-l-transparent",
  "未匹配":   "border-l-4 border-l-amber-400",
  "金额不符": "border-l-4 border-l-rose-400",
};

const statusRowBg: Record<MatchStatus, string> = {
  "已匹配":   "",
  "未匹配":   "bg-amber-50/30",
  "金额不符": "bg-rose-50/30",
};

const channelBadge: Record<Channel, string> = {
  "微信支付": "bg-teal-50 text-teal-700",
  "银行":     "bg-sky-50 text-sky-700",
  "现金":     "bg-stone-100 text-stone-600",
  "其他":     "bg-stone-100 text-stone-500",
};

/* ─── Matchable orders reference ─────────────────── */

const ORDERS_REF = ordersRefFromDemo();

/* ─── Main component ─────────────────────────────── */

export function Reconciliation() {
  const [records, setRecords] = useState<ReconRecord[]>(SEED);
  const [modal, setModal]     = useState<ModalState>({ kind: "none" });
  const [fChannel, setFChannel] = useState<"" | Channel>("");
  const [fStatus,  setFStatus]  = useState<"" | MatchStatus>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [autoMsg,  setAutoMsg]  = useState("");

  const filtered = useMemo(() => records.filter((r) => {
    if (fChannel && r.channel     !== fChannel) return false;
    if (fStatus  && r.matchStatus !== fStatus)  return false;
    if (dateFrom && r.tradeTime.slice(0,10) < dateFrom) return false;
    if (dateTo   && r.tradeTime.slice(0,10) > dateTo)   return false;
    return true;
  }), [records, fChannel, fStatus, dateFrom, dateTo]);

  const stats = useMemo(() => ({
    total:       filtered.length,
    matched:     filtered.filter(r => r.matchStatus === "已匹配").length,
    unmatched:   filtered.filter(r => r.matchStatus === "未匹配").length,
    mismatch:    filtered.filter(r => r.matchStatus === "金额不符").length,
  }), [filtered]);

  /* Auto-match */
  const autoMatch = () => {
    const matched: Record<string, string> = {};
    records.filter(r => r.matchStatus !== "未匹配").forEach(r => {
      if (r.matchedOrderNo) matched[r.matchedOrderNo] = r.id;
    });
    let count = 0;
    const next = records.map(r => {
      if (r.matchStatus !== "未匹配") return r;
      const order = ORDERS_REF.find(o => o.amount === r.amount && !matched[o.no]);
      if (!order) return r;
      matched[order.no] = r.id;
      count++;
      return { ...r, matchStatus: "已匹配" as MatchStatus, matchedOrderNo: order.no, matchedAmount: order.amount };
    });
    setRecords(next);
    setAutoMsg(count > 0 ? `自动匹配完成，共匹配 ${count} 条记录` : "未找到可自动匹配的记录");
    setTimeout(() => setAutoMsg(""), 3500);
  };

  /* Manual match */
  const doManualMatch = (record: ReconRecord, orderNo: string) => {
    const order = ORDERS_REF.find(o => o.no === orderNo);
    const status: MatchStatus = order
      ? (order.amount === record.amount ? "已匹配" : "金额不符")
      : "未匹配";
    setRecords(prev => prev.map(r => r.id === record.id
      ? { ...r, matchStatus: status, matchedOrderNo: order?.no, matchedAmount: order?.amount }
      : r
    ));
    setModal({ kind: "none" });
  };

  /* Import */
  const doImport = (channel: Channel, csv: string) => {
    const lines = csv.trim().split("\n").filter(l => l.trim());
    const now = localDateTime();
    const imported: ReconRecord[] = lines.map((line, i) => {
      const parts = line.split(",");
      return {
        id: `imp_${Date.now()}_${i}`,
        channel,
        channelTradeNo: parts[0]?.trim() ?? `IMP-${Date.now()}-${i}`,
        amount: parseFloat(parts[1]?.trim() ?? "0") || 0,
        currency: "CNY",
        tradeTime: parts[3]?.trim() ?? now,
        matchStatus: "未匹配",
        rawData: line.trim(),
      };
    });
    setRecords(prev => [...imported, ...prev]);
    setModal({ kind: "none" });
  };

  return (
    <div className="p-8 space-y-5">

      {/* Auto-match toast */}
      {autoMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg">
          {autoMsg}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Sel value={fChannel} onChange={(v) => setFChannel(v as "" | Channel)}>
          <option value="">全部渠道</option>
          {(["微信支付","银行","现金","其他"] as Channel[]).map(c => <option key={c}>{c}</option>)}
        </Sel>
        <Sel value={fStatus} onChange={(v) => setFStatus(v as "" | MatchStatus)}>
          <option value="">全部状态</option>
          {(["已匹配","未匹配","金额不符"] as MatchStatus[]).map(s => <option key={s}>{s}</option>)}
        </Sel>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        <span className="text-stone-400 text-sm">—</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        <div className="flex-1" />
        <button onClick={() => { setDateFrom(""); setDateTo(""); setFChannel(""); setFStatus(""); }}
          className="h-9 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm text-stone-600 flex items-center gap-1.5">
          <Eraser className="w-3.5 h-3.5" /> 清除范围
        </button>
        <button onClick={autoMatch}
          className="h-9 px-3 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-sm text-emerald-700 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> 自动匹配
        </button>
        <button onClick={() => setModal({ kind: "import" })}
          className="h-9 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-sm flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" /> 导入对账单
        </button>
        <button onClick={() => setRecords(SEED)}
          className="h-9 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm text-stone-500 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="总记录数" value={stats.total} sub="当前筛选范围" accent="bg-stone-700" />
        <StatCard label="已匹配"  value={stats.matched}   sub={`占比 ${stats.total ? ((stats.matched/stats.total)*100).toFixed(0) : 0}%`} accent="bg-emerald-600" highlight="emerald" />
        <StatCard label="未匹配"  value={stats.unmatched} sub="待处理" accent="bg-amber-500" highlight="amber" />
        <StatCard label="金额不符" value={stats.mismatch} sub="需人工核查" accent="bg-rose-500" highlight="rose" />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-stone-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-transparent" /> 无色边框 = 已匹配</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400" /> 左侧橙线 = 未匹配</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-400" /> 左侧红线 = 金额不符</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="grid grid-cols-[4px_80px_1fr_88px_44px_142px_90px_1fr_100px] px-4 py-2.5 bg-stone-900 text-xs text-stone-400">
          <div /><div>渠道</div><div>渠道流水号</div><div className="text-right">金额</div>
          <div>币种</div><div>交易时间</div><div>匹配状态</div><div>匹配订单</div><div />
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400">暂无匹配记录</div>
        ) : filtered.map((r) => (
          <div key={r.id}
            className={`grid grid-cols-[4px_80px_1fr_88px_44px_142px_90px_1fr_100px] items-center px-4 py-3 border-b border-stone-100 last:border-0 hover:brightness-95 transition-all ${statusRowLeft[r.matchStatus]} ${statusRowBg[r.matchStatus]}`}>
            {/* left border spacer - handled by border-l */}
            <div />
            {/* Channel */}
            <span><span className={`text-xs px-2 py-0.5 rounded ${channelBadge[r.channel]}`}>{r.channel}</span></span>
            {/* Trade no */}
            <span className="font-mono text-xs text-stone-600 truncate pr-2">{r.channelTradeNo}</span>
            {/* Amount */}
            <div className="text-right">
              <span className="text-sm text-stone-900">¥{r.amount.toLocaleString()}</span>
              {r.matchStatus === "金额不符" && r.matchedAmount && (
                <div className="text-xs text-rose-500">≠ ¥{r.matchedAmount.toLocaleString()}</div>
              )}
            </div>
            {/* Currency */}
            <span className="text-xs text-stone-400">{r.currency}</span>
            {/* Trade time */}
            <span className="text-xs text-stone-500 font-mono">{r.tradeTime}</span>
            {/* Status */}
            <span><span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[r.matchStatus]}`}>{r.matchStatus}</span></span>
            {/* Matched order */}
            <span className="text-xs font-mono text-stone-500 truncate pr-2">
              {r.matchedOrderNo ?? <span className="text-stone-300">—</span>}
            </span>
            {/* Actions */}
            <div className="flex items-center gap-1.5 justify-end">
              <button onClick={() => setModal({ kind: "detail", record: r })}
                className="h-7 px-2 rounded border border-stone-200 hover:bg-stone-100 text-xs text-stone-600 flex items-center gap-1">
                <Eye className="w-3 h-3" /> 详情
              </button>
              {r.matchStatus !== "已匹配" && (
                <button onClick={() => setModal({ kind: "manual_match", record: r })}
                  className="h-7 px-2 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs flex items-center gap-1">
                  <Link2 className="w-3 h-3" /> 匹配
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
          <span>共 {filtered.length} 条记录</span>
          <span>对账数据只读，匹配操作须经授权人员执行</span>
        </div>
      </div>

      {/* Modals */}
      {modal.kind === "import"       && <ImportModal onClose={() => setModal({ kind: "none" })} onSubmit={doImport} />}
      {modal.kind === "detail"       && <DetailModal record={modal.record} onClose={() => setModal({ kind: "none" })} onMatchClick={() => setModal({ kind: "manual_match", record: modal.record })} />}
      {modal.kind === "manual_match" && <ManualMatchModal record={modal.record} onClose={() => setModal({ kind: "none" })} onSubmit={(no) => doManualMatch(modal.record, no)} />}
    </div>
  );
}

/* ─── Import modal ───────────────────────────────── */

function ImportModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (ch: Channel, csv: string) => void }) {
  const [channel, setChannel] = useState<Channel>("微信支付");
  const [csv, setCsv] = useState("");
  const [err, setErr] = useState("");

  const handle = () => {
    if (!csv.trim()) { setErr("请粘贴 CSV 数据"); return; }
    onSubmit(channel, csv);
  };

  return (
    <Modal title="导入对账单" subtitle="支持批量导入渠道账单流水" onClose={onClose} wide>
      <div className="p-6 space-y-5">
        <MF label="渠道">
          <Sel value={channel} onChange={(v) => setChannel(v as Channel)} full>
            {(["微信支付","银行","现金","其他"] as Channel[]).map(c => <option key={c}>{c}</option>)}
          </Sel>
        </MF>

        <MF label="CSV 数据" error={err}>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={8}
            placeholder={"4200001234567901,1200.00,CNY,2026-06-22 10:00:00,SUCCESS\n4200001234567902,680.00,CNY,2026-06-22 11:30:00,SUCCESS"}
            className={`w-full px-3 py-2 rounded-lg border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none ${err ? "border-rose-300" : "border-stone-200 focus:border-emerald-500"}`}
          />
        </MF>

        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-2">
            <FileText className="w-3.5 h-3.5" /> CSV 格式说明
          </div>
          <div className="font-mono text-xs text-stone-500 space-y-0.5">
            <div className="text-stone-400">流水号, 金额, 币种, 交易时间, 状态</div>
            <div className="text-emerald-700">4200001234567890, 1200.00, CNY, 2026-06-22 09:12:58, SUCCESS</div>
            <div className="text-emerald-700">BANK-202606220001, 680.00, CNY, 2026-06-22 10:00:00, CREDIT</div>
          </div>
          <div className="text-xs text-stone-400 mt-2">第 1 列流水号、第 2 列金额为必填；时间格式 YYYY-MM-DD HH:mm:ss</div>
        </div>
      </div>
      <ModalFooter onClose={onClose} onSubmit={handle} label="导入" />
    </Modal>
  );
}

/* ─── Detail modal ───────────────────────────────── */

function DetailModal({ record: r, onClose, onMatchClick }: {
  record: ReconRecord; onClose: () => void; onMatchClick: () => void;
}) {
  const diff = r.matchStatus === "金额不符" && r.matchedAmount
    ? r.amount - r.matchedAmount
    : null;

  return (
    <Modal title="对账记录详情" subtitle={r.channelTradeNo} onClose={onClose} wide>
      <div className="p-6 space-y-5">
        {/* Status banner */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${statusBadge[r.matchStatus]}`}>
          <span className="font-medium">{r.matchStatus}</span>
          {r.matchStatus === "金额不符" && diff !== null && (
            <span className="text-xs">渠道金额与订单金额差异：{diff > 0 ? "+" : ""}{diff.toLocaleString()} 元</span>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-3.5">
          <DR label="渠道"><span className={`text-xs px-2 py-0.5 rounded ${channelBadge[r.channel]}`}>{r.channel}</span></DR>
          <DR label="币种">{r.currency}</DR>
          <DR label="渠道流水号"><span className="font-mono text-xs">{r.channelTradeNo}</span></DR>
          <DR label="交易时间"><span className="font-mono text-xs">{r.tradeTime}</span></DR>
          <DR label="渠道金额"><span className="text-stone-900">¥{r.amount.toLocaleString()}</span></DR>
          {r.matchedAmount !== undefined && (
            <DR label="订单金额">
              <span className={r.matchStatus === "金额不符" ? "text-rose-600" : "text-stone-900"}>
                ¥{r.matchedAmount.toLocaleString()}
              </span>
              {r.matchStatus === "金额不符" && (
                <span className="text-xs text-rose-500 ml-1">（差 {(r.amount - r.matchedAmount).toLocaleString()} 元）</span>
              )}
            </DR>
          )}
          <DR label="匹配订单">
            {r.matchedOrderNo
              ? <span className="font-mono text-xs text-stone-700">{r.matchedOrderNo}</span>
              : <span className="text-stone-300 text-xs">暂无匹配订单</span>
            }
          </DR>
        </div>

        {/* Raw data */}
        <div>
          <div className="text-xs text-stone-400 mb-2">原始数据</div>
          <pre className="bg-stone-950 text-stone-300 text-xs font-mono rounded-lg px-4 py-3 overflow-x-auto">{r.rawData}</pre>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 rounded-b-2xl flex items-center justify-between">
        <div>
          {r.matchStatus !== "已匹配" && (
            <button onClick={onMatchClick} className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> 手动匹配
            </button>
          )}
        </div>
        <button onClick={onClose} className="h-9 px-4 rounded-lg border border-stone-200 hover:bg-white text-sm">关闭</button>
      </div>
    </Modal>
  );
}

/* ─── Manual match modal ─────────────────────────── */

function ManualMatchModal({ record: r, onClose, onSubmit }: {
  record: ReconRecord; onClose: () => void; onSubmit: (orderNo: string) => void;
}) {
  const [orderNo, setOrderNo] = useState(r.matchedOrderNo ?? "");
  const [err, setErr] = useState("");

  const previewOrder = ORDERS_REF.find(o => o.no === orderNo.trim());

  const handle = () => {
    if (!orderNo.trim()) { setErr("请输入订单号"); return; }
    onSubmit(orderNo.trim());
  };

  return (
    <Modal title="手动匹配" subtitle={r.channelTradeNo} onClose={onClose}>
      <div className="p-6 space-y-5">
        {/* Record summary */}
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3.5 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div><span className="text-stone-400">流水号</span><div className="font-mono text-stone-700 mt-0.5">{r.channelTradeNo}</div></div>
          <div><span className="text-stone-400">对账金额</span><div className="text-stone-900 mt-0.5 text-sm">¥{r.amount.toLocaleString()}</div></div>
          <div><span className="text-stone-400">渠道</span><div className="mt-0.5"><span className={`px-1.5 py-0.5 rounded ${channelBadge[r.channel]}`}>{r.channel}</span></div></div>
          <div><span className="text-stone-400">当前状态</span><div className="mt-0.5"><span className={`px-1.5 py-0.5 rounded-full ${statusBadge[r.matchStatus]}`}>{r.matchStatus}</span></div></div>
        </div>

        <MF label="订单号" error={err}>
          <Sel value={orderNo} onChange={(v) => { setOrderNo(v); setErr(""); }} full>
            <option value="">— 选择或输入订单 —</option>
            {ORDERS_REF.map(o => (
              <option key={o.no} value={o.no}>{o.no}（¥{o.amount}）</option>
            ))}
          </Sel>
        </MF>

        {/* Preview */}
        {previewOrder && (
          <div className={`px-4 py-3 rounded-lg border text-sm ${
            previewOrder.amount === r.amount
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}>
            {previewOrder.amount === r.amount
              ? `✓ 金额匹配：订单金额 ¥${previewOrder.amount.toLocaleString()}，匹配后状态将变为「已匹配」`
              : `⚠ 金额不符：订单金额 ¥${previewOrder.amount.toLocaleString()}，差异 ${(r.amount - previewOrder.amount).toLocaleString()} 元，匹配后状态将变为「金额不符」`
            }
          </div>
        )}
      </div>
      <ModalFooter onClose={onClose} onSubmit={handle} label="确认匹配" />
    </Modal>
  );
}

/* ─── Primitives ─────────────────────────────────── */

function StatCard({ label, value, sub, accent, highlight }: {
  label: string; value: number; sub?: string; accent: string; highlight?: "emerald" | "amber" | "rose";
}) {
  const border = highlight === "emerald" ? "border-emerald-200" : highlight === "amber" ? "border-amber-200" : highlight === "rose" ? "border-rose-200" : "border-stone-200";
  return (
    <div className={`bg-white rounded-xl border p-5 ${border}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-stone-500">{label}</span>
        <div className={`w-2 h-2 rounded-full ${accent}`} />
      </div>
      <div className="text-3xl text-stone-900 font-light tracking-tight">{value}</div>
      {sub && <div className="text-xs text-stone-400 mt-1">{sub}</div>}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] w-full ${wide ? "max-w-2xl" : "max-w-lg"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 shrink-0">
          <div>
            <div className="text-stone-900">{title}</div>
            {subtitle && <div className="font-mono text-xs text-stone-400 mt-0.5">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onClose, onSubmit, label }: { onClose: () => void; onSubmit: () => void; label: string }) {
  return (
    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200 bg-stone-50 rounded-b-2xl shrink-0">
      <button onClick={onClose} className="h-9 px-4 rounded-lg border border-stone-200 hover:bg-white text-sm">取消</button>
      <button onClick={onSubmit} className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm">{label}</button>
    </div>
  );
}

function Sel({ value, onChange, children, full }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; full?: boolean;
}) {
  return (
    <div className={`relative ${full ? "w-full" : ""}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`${full ? "w-full" : ""} h-9 pl-3 pr-8 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500`}>
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

function DR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-stone-400">{label}</div>
      <div className="text-sm text-stone-800 mt-0.5 flex items-center gap-1.5">{children}</div>
    </div>
  );
}
