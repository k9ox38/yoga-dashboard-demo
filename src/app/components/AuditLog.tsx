import { useState, useMemo } from "react";
import { RefreshCw, X, ChevronDown, Eye, Shield, Activity, Users, Layers } from "lucide-react";
import { DateRangePicker } from "./DatePicker";
import { buildSeedNotices } from "./Notifications";
import { addDaysFromToday, shiftLocalDateTime } from "../lib/dates";

/* ─── Types ──────────────────────────────────────── */

type ActionType  = "创建" | "更新" | "删除" | "发布" | "归档" | "登录" | "导出" | "审核通过" | "审核拒绝";
type ObjectType  = "会员" | "教练" | "课程" | "排课" | "预约" | "套餐" | "订单" | "通知" | "系统配置";

interface LogEntry {
  id: string;
  actionType: ActionType;
  operator: string;
  operatorRole: string;
  objectType: ObjectType;
  objectId: string;
  timestamp: string;
  description: string;
  ip?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

/* ─── Seed data ──────────────────────────────────── */

/** Demo history relative to `today`, pointing at the members, orders, notices and sessions the other pages show. */
export function buildSeedLogs(today: Date = new Date()): LogEntry[] {
  const at = (days: number, time: string) => shiftLocalDateTime(days, time, today);
  const day = (days: number) => addDaysFromToday(days, today);
  const orderNo = (days: number, seq: string) => `ORD-${day(days).replace(/-/g, "")}-${seq}`;
  const notice = Object.fromEntries(buildSeedNotices(today).map((item) => [item.id, item.title]));
  const lastMonth = ((today.getMonth() + 11) % 12) + 1;
  const ip = "192.168.1.10";
  const rows: Array<Omit<LogEntry, "id" | "operator" | "operatorRole">> = [
    { actionType: "更新", objectType: "通知", objectId: "n4", timestamp: at(-1, "16:30:00"), description: `编辑草稿「${notice.n4}」`, before: { 维护时段: "待定" }, after: { 维护时段: "02:00–04:00" } },
    { actionType: "更新", objectType: "预约", objectId: "r5", timestamp: at(-1, "09:30:00"), description: "取消预约「苏晴 · 进阶强化」", before: { status: "已确认" }, after: { status: "已取消" } },
    { actionType: "登录", objectType: "系统配置", objectId: "SYS", timestamp: at(-1, "08:55:00"), description: "管理员登录系统", ip },
    { actionType: "发布", objectType: "通知", objectId: "n1", timestamp: at(-2, "10:00:00"), description: `发布通知「${notice.n1}」`, before: { status: "草稿" }, after: { status: "已发布" } },
    { actionType: "创建", objectType: "排课", objectId: "s6", timestamp: at(-3, "10:05:18"), description: `创建排课「产前产后 · ${day(2).slice(5)} 10:00」`, after: { classId: "t6", instructor: "谭美", date: day(2), start: "10:00", room: "B 馆" } },
    { actionType: "更新", objectType: "会员", objectId: "M000128", timestamp: at(-4, "16:00:00"), description: "更新会员「林晓」备注", before: { notes: "" }, after: { notes: "偏好晚间课程" } },
    { actionType: "发布", objectType: "通知", objectId: "n2", timestamp: at(-6, "09:00:00"), description: `发布通知「${notice.n2}」`, before: { status: "草稿" }, after: { status: "已发布" } },
    { actionType: "登录", objectType: "系统配置", objectId: "SYS", timestamp: at(-6, "08:50:00"), description: "管理员登录系统", ip },
    { actionType: "发布", objectType: "通知", objectId: "n3", timestamp: at(-7, "14:00:00"), description: `发布通知「${notice.n3}」`, before: { status: "草稿" }, after: { status: "已发布" } },
    { actionType: "导出", objectType: "会员", objectId: "BATCH", timestamp: at(-8, "10:30:22"), description: "导出会员列表，共 25 条记录", ip },
    { actionType: "更新", objectType: "订单", objectId: orderNo(-9, "0012"), timestamp: at(-9, "11:42:00"), description: "登记退款申请「苏晴 · 5 节体验包」", before: { status: "已支付" }, after: { status: "退款中" } },
    { actionType: "更新", objectType: "教练", objectId: "i5", timestamp: at(-12, "11:20:33"), description: "更新教练「苏菲娅」状态为禁用", before: { status: "启用" }, after: { status: "禁用" } },
    { actionType: "审核通过", objectType: "订单", objectId: orderNo(-14, "0009"), timestamp: at(-14, "15:10:00"), description: "审核通过退款申请「吴桐 · 5 节体验包」", before: { status: "退款中" }, after: { status: "已退款" } },
    { actionType: "导出", objectType: "订单", objectId: "BATCH", timestamp: at(-17, "11:30:00"), description: `导出订单列表（${lastMonth} 月月度对账）`, ip },
    { actionType: "更新", objectType: "套餐", objectId: "PKG-0007", timestamp: at(-20, "09:30:00"), description: "下架套餐「旧版 12 次卡」", before: { status: "上架中" }, after: { status: "已下架" } },
    { actionType: "创建", objectType: "订单", objectId: orderNo(-23, "0011"), timestamp: at(-23, "10:22:00"), description: "线下录入订单「月卡 · 蒋雯」", after: { userName: "蒋雯", packageName: "月卡", actualAmount: 680, payChannel: "现金" } },
    { actionType: "归档", objectType: "通知", objectId: "n6", timestamp: at(-25, "09:00:00"), description: `归档通知「${notice.n6}」`, before: { status: "已发布" }, after: { status: "已归档" } },
    { actionType: "删除", objectType: "排课", objectId: "s0", timestamp: at(-26, "18:45:22"), description: `删除排课「力量塑形 · ${day(-24).slice(5)} 18:00」`, before: { classId: "t7", instructor: "吴安雅", date: day(-24), start: "18:00" } },
    { actionType: "更新", objectType: "系统配置", objectId: "CFG-interval", timestamp: at(-30, "14:00:00"), description: "更新首页通知条轮播间隔：3 秒 → 4 秒", before: { key: "carousel_interval_ms", value: "3000" }, after: { key: "carousel_interval_ms", value: "4000" } },
    { actionType: "更新", objectType: "系统配置", objectId: "CFG-booking", timestamp: at(-33, "14:00:00"), description: "更新预约取消窗口：2 小时 → 4 小时", before: { key: "cancel_window_hours", value: "2" }, after: { key: "cancel_window_hours", value: "4" } },
    { actionType: "更新", objectType: "课程", objectId: "t3", timestamp: at(-40, "15:00:00"), description: "更新课程「深度放松」容量 15→18", before: { capacity: 15 }, after: { capacity: 18 } },
    { actionType: "更新", objectType: "套餐", objectId: "PKG-0005", timestamp: at(-45, "10:12:33"), description: "更新套餐「季卡」价格", before: { price: 2000 }, after: { price: 1800 } },
  ];
  return rows.map((row, index) => ({ id: `LOG-${String(index + 1).padStart(4, "0")}`, operator: "林梅", operatorRole: "馆长", ...row }));
}

/* ─── Style maps ─────────────────────────────────── */

const actionBadge: Record<ActionType, string> = {
  "创建":   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "更新":   "bg-sky-50 text-sky-700 border border-sky-200",
  "删除":   "bg-rose-50 text-rose-600 border border-rose-200",
  "发布":   "bg-teal-50 text-teal-700 border border-teal-200",
  "归档":   "bg-stone-100 text-stone-500 border border-stone-200",
  "登录":   "bg-indigo-50 text-indigo-700 border border-indigo-200",
  "导出":   "bg-amber-50 text-amber-700 border border-amber-200",
  "审核通过":"bg-emerald-50 text-emerald-700 border border-emerald-200",
  "审核拒绝":"bg-rose-50 text-rose-600 border border-rose-200",
};

const actionBar: Record<ActionType, string> = {
  "创建": "bg-emerald-500", "更新": "bg-sky-500", "删除": "bg-rose-500",
  "发布": "bg-teal-500",   "归档": "bg-stone-400","登录": "bg-indigo-500",
  "导出": "bg-amber-500",  "审核通过": "bg-emerald-400", "审核拒绝": "bg-rose-400",
};

const objBadge: Record<ObjectType, string> = {
  "会员":  "bg-sky-50 text-sky-700",
  "教练":  "bg-teal-50 text-teal-700",
  "课程":  "bg-emerald-50 text-emerald-700",
  "排课":  "bg-lime-50 text-lime-700",
  "预约":  "bg-violet-50 text-violet-700",
  "套餐":  "bg-fuchsia-50 text-fuchsia-700",
  "订单":  "bg-amber-50 text-amber-700",
  "通知":  "bg-blue-50 text-blue-700",
  "系统配置": "bg-stone-100 text-stone-600",
};

/* ─── Main component ─────────────────────────────── */

export function AuditLog() {
  const [logs]        = useState<LogEntry[]>(() => buildSeedLogs());
  const [detail, setDetail] = useState<LogEntry | null>(null);
  const [fAction, setFAction] = useState<"" | ActionType>("");
  const [fObject, setFObject] = useState<"" | ObjectType>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const filtered = useMemo(() => logs.filter((l) => {
    if (fAction && l.actionType  !== fAction) return false;
    if (fObject && l.objectType  !== fObject) return false;
    if (dateFrom && l.timestamp.slice(0, 10) < dateFrom) return false;
    if (dateTo   && l.timestamp.slice(0, 10) > dateTo)   return false;
    return true;
  }), [logs, fAction, fObject, dateFrom, dateTo]);

  /* Stats */
  const stats = useMemo(() => ({
    total:       filtered.length,
    operators:   new Set(filtered.map(l => l.operator)).size,
    actionTypes: new Set(filtered.map(l => l.actionType)).size,
    objectTypes: new Set(filtered.map(l => l.objectType)).size,
  }), [filtered]);

  /* Top action breakdown */
  const actionDist = useMemo(() => {
    const m: Partial<Record<ActionType, number>> = {};
    filtered.forEach(l => { m[l.actionType] = (m[l.actionType] ?? 0) + 1; });
    return Object.entries(m).sort((a, b) => (b[1] as number) - (a[1] as number)) as [ActionType, number][];
  }, [filtered]);

  const maxCount = actionDist[0]?.[1] ?? 1;

  return (
    <div className="p-8 space-y-5">

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Sel value={fAction} onChange={(v) => setFAction(v as "" | ActionType)}>
          <option value="">全部操作类型</option>
          {(["创建","更新","删除","发布","归档","登录","导出","审核通过","审核拒绝"] as ActionType[]).map(a => <option key={a}>{a}</option>)}
        </Sel>
        <Sel value={fObject} onChange={(v) => setFObject(v as "" | ObjectType)}>
          <option value="">全部对象类型</option>
          {(["会员","教练","课程","排课","预约","套餐","订单","通知","系统配置"] as ObjectType[]).map(o => <option key={o}>{o}</option>)}
        </Sel>
        <DateRangePicker from={dateFrom} to={dateTo} onChange={(from, to) => { setDateFrom(from); setDateTo(to); }} />
        <div className="flex-1" />
        <button onClick={() => { setFAction(""); setFObject(""); setDateFrom(""); setDateTo(""); }}
          className="h-9 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm text-stone-600 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> 重置
        </button>
      </div>

      {/* Stats + Top breakdown side-by-side */}
      <div className="grid grid-cols-[1fr_320px] gap-4">

        {/* Left: 4 stat cards, 2 × 2 so they fill the height of the distribution card */}
        <div>
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-4">
            <StatCard icon={<Activity className="w-4 h-4 text-white" />} accent="bg-stone-700" label="日志总数" value={String(stats.total)} />
            <StatCard icon={<Users className="w-4 h-4 text-white" />} accent="bg-indigo-600" label="操作人数" value={String(stats.operators)} />
            <StatCard icon={<Shield className="w-4 h-4 text-white" />} accent="bg-sky-600" label="操作类型" value={String(stats.actionTypes)} />
            <StatCard icon={<Layers className="w-4 h-4 text-white" />} accent="bg-teal-600" label="对象类型" value={String(stats.objectTypes)} />
          </div>
        </div>

        {/* Right: Action distribution */}
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="text-sm text-stone-900 mb-1">操作类型分布</div>
          <div className="text-xs text-stone-400 mb-4">按当前筛选范围统计</div>
          {actionDist.length === 0 ? (
            <div className="text-xs text-stone-400 py-4 text-center">无数据</div>
          ) : (
            <div className="space-y-2.5">
              {actionDist.slice(0, 9).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="w-16 text-xs text-stone-600 text-right shrink-0">{type}</span>
                  <div className="flex-1 h-5 bg-stone-100 rounded overflow-hidden">
                    <div
                      className={`h-full rounded transition-all ${actionBar[type]}`}
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-xs text-stone-400 text-right shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="grid grid-cols-[80px_80px_100px_80px_130px_148px_1fr_60px] px-4 py-2.5 bg-stone-50 border-b border-stone-100 text-xs text-stone-500">
          <div>ID</div>
          <div>操作类型</div>
          <div>操作人</div>
          <div>对象类型</div>
          <div>对象 ID</div>
          <div>操作时间</div>
          <div>操作说明</div>
          <div />
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-sm text-stone-400">无匹配日志记录</div>
            <div className="text-xs text-stone-300 mt-1">调整筛选条件后重试</div>
          </div>
        ) : filtered.map((l, idx) => (
          <div
            key={l.id}
            className={`grid grid-cols-[80px_80px_100px_80px_130px_148px_1fr_60px] items-center px-4 py-2.5 border-b border-stone-100 last:border-0 text-xs hover:bg-stone-50 transition-colors ${idx % 2 === 0 ? "" : "bg-stone-50/40"}`}
          >
            <span className="font-mono text-stone-400">{l.id.slice(-4)}</span>
            <span><Badge cls={actionBadge[l.actionType]}>{l.actionType}</Badge></span>
            <div>
              <div className="text-stone-700">{l.operator}</div>
              <div className="text-stone-400">{l.operatorRole}</div>
            </div>
            <span><span className={`text-xs px-1.5 py-0.5 rounded ${objBadge[l.objectType]}`}>{l.objectType}</span></span>
            <span className="font-mono text-stone-500 truncate pr-1">{l.objectId}</span>
            <span className="font-mono text-stone-500">{l.timestamp}</span>
            <span className="text-stone-600 truncate pr-2">{l.description}</span>
            <div className="flex justify-end">
              <button
                onClick={() => setDetail(l)}
                className="h-6 w-6 rounded border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-500"
              >
                <Eye className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          <span className="text-xs text-stone-400">共 {filtered.length} 条记录</span>
          <span className="text-xs text-stone-300">只读 · 审计日志不可编辑或删除</span>
        </div>
      </div>

      {/* Detail modal */}
      {detail && <DetailModal log={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

/* ─── Detail modal ───────────────────────────────── */

function DetailModal({ log: l, onClose }: { log: LogEntry; onClose: () => void }) {
  const hasBefore = l.before && Object.keys(l.before).length > 0;
  const hasAfter  = l.after  && Object.keys(l.after).length  > 0;
  const hasDiff   = hasBefore || hasAfter;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col max-h-[88vh] w-full max-w-2xl">

        {/* Dark header */}
        <div className="bg-stone-900 rounded-t-2xl px-6 py-5 flex items-start justify-between shrink-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-stone-300 text-xs">{l.id}</span>
              <Badge cls={actionBadge[l.actionType]}>{l.actionType}</Badge>
            </div>
            <div className="text-white">{l.description}</div>
            <div className="flex items-center gap-4 text-xs text-stone-400">
              <span className="font-mono">{l.timestamp}</span>
              {l.ip && <span>IP: {l.ip}</span>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stone-700 flex items-center justify-center text-stone-400 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto">
          {/* Basic info */}
          <div className="p-6 grid grid-cols-2 gap-x-10 gap-y-4 border-b border-stone-100">
            <DR label="操作人">{l.operator} <span className="text-stone-400 text-xs">{l.operatorRole}</span></DR>
            <DR label="操作类型"><Badge cls={actionBadge[l.actionType]}>{l.actionType}</Badge></DR>
            <DR label="对象类型"><span className={`text-xs px-2 py-0.5 rounded ${objBadge[l.objectType]}`}>{l.objectType}</span></DR>
            <DR label="对象 ID"><span className="font-mono text-xs text-stone-600">{l.objectId}</span></DR>
            <DR label="操作时间"><span className="font-mono text-xs">{l.timestamp}</span></DR>
            {l.ip && <DR label="来源 IP"><span className="font-mono text-xs">{l.ip}</span></DR>}
          </div>

          {/* Diff section */}
          {hasDiff && (
            <div className="p-6 space-y-4">
              <div className="text-xs text-stone-500 uppercase tracking-wide">变更数据</div>
              <div className={hasBefore && hasAfter ? "grid grid-cols-2 gap-4" : ""}>
                {hasBefore && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span className="text-xs text-stone-500">变更前</span>
                    </div>
                    <JsonBlock data={l.before!} theme="before" />
                  </div>
                )}
                {hasAfter && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs text-stone-500">{hasBefore ? "变更后" : "新建数据"}</span>
                    </div>
                    <JsonBlock data={l.after!} theme="after" />
                  </div>
                )}
              </div>
            </div>
          )}

          {!hasDiff && (
            <div className="px-6 py-8 text-center text-xs text-stone-400">此操作无结构化数据变更记录</div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 rounded-b-2xl flex items-center justify-between shrink-0">
          <span className="text-xs text-stone-400">审计日志只读，不可修改</span>
          <button onClick={onClose} className="h-9 px-5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-sm">关闭</button>
        </div>
      </div>
    </div>
  );
}

/* ─── JSON block ─────────────────────────────────── */

function JsonBlock({ data, theme }: { data: Record<string, unknown>; theme: "before" | "after" }) {
  const bg   = theme === "before" ? "bg-rose-950"    : "bg-stone-950";
  const dot  = theme === "before" ? "text-rose-300"  : "text-emerald-300";
  const str  = theme === "before" ? "text-rose-200"  : "text-emerald-200";

  const entries = Object.entries(data);

  return (
    <div className={`${bg} rounded-lg p-4 space-y-1.5`}>
      {entries.map(([key, val]) => (
        <div key={key} className="flex items-start gap-2 text-xs font-mono">
          <span className="text-stone-500 shrink-0">{key}</span>
          <span className="text-stone-600 shrink-0">:</span>
          <span className={typeof val === "number" ? "text-amber-300" : typeof val === "boolean" ? "text-violet-300" : `${dot} ${str}`}>
            {typeof val === "string" ? `"${val}"` : String(val)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Primitives ─────────────────────────────────── */

function StatCard({ icon, accent, label, value }: { icon: React.ReactNode; accent: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>{icon}</div>
      <div>
        <div className="text-xs text-stone-500">{label}</div>
        <div className="mt-0.5 text-2xl text-stone-900 leading-tight tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function Badge({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`text-xs px-1.5 py-0.5 rounded-full ${cls}`}>{children}</span>;
}

function Sel({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-3 pr-8 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
        {children}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
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
