import { useState, useMemo } from "react";
import { RefreshCw, X, ChevronDown, Eye, Shield, Activity, Users, Layers } from "lucide-react";

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

const INIT: LogEntry[] = [
  { id:"LOG-0001", actionType:"创建",  operator:"林梅", operatorRole:"馆长", objectType:"课程",   objectId:"t8",            timestamp:"2026-06-22 09:12:33", description:"创建课程「一对一私教」",              after:{ id:"t8", name:"一对一私教", format:"私教", capacity:1 } },
  { id:"LOG-0002", actionType:"更新",  operator:"林梅", operatorRole:"馆长", objectType:"套餐",   objectId:"PKG-2605",      timestamp:"2026-06-21 16:30:10", description:"更新套餐「季卡」价格",                before:{ price:2000 }, after:{ price:1800 } },
  { id:"LOG-0003", actionType:"发布",  operator:"林梅", operatorRole:"馆长", objectType:"通知",   objectId:"n2",            timestamp:"2026-06-20 14:22:45", description:"发布通知「暑期特惠套餐上线」",          before:{ status:"草稿" }, after:{ status:"已发布" } },
  { id:"LOG-0004", actionType:"登录",  operator:"林梅", operatorRole:"馆长", objectType:"系统配置", objectId:"SYS",         timestamp:"2026-06-20 09:00:05", description:"管理员登录系统",                       ip:"192.168.1.10" },
  { id:"LOG-0005", actionType:"删除",  operator:"林梅", operatorRole:"馆长", objectType:"排课",   objectId:"s9",            timestamp:"2026-06-19 18:45:22", description:"删除排课「力量塑形 - 周五」",           before:{ classId:"t7", instructor:"吴安雅", date:"2026-06-21", start:"18:00" } },
  { id:"LOG-0006", actionType:"更新",  operator:"林梅", operatorRole:"馆长", objectType:"教练",   objectId:"i5",            timestamp:"2026-06-18 11:20:33", description:"更新教练「苏菲娅」状态为禁用",          before:{ status:"启用" }, after:{ status:"禁用" } },
  { id:"LOG-0007", actionType:"创建",  operator:"林梅", operatorRole:"馆长", objectType:"排课",   objectId:"s10",           timestamp:"2026-06-18 10:05:18", description:"创建排课「空中吊绳 - 周四 19:00」",     after:{ classId:"t5", instructor:"苏菲娅", date:"2026-06-19", start:"19:00", room:"空中阁楼" } },
  { id:"LOG-0008", actionType:"归档",  operator:"林梅", operatorRole:"馆长", objectType:"通知",   objectId:"n6",            timestamp:"2026-06-17 15:30:00", description:"归档通知「端午节放假通知」",            before:{ status:"已发布" }, after:{ status:"已归档" } },
  { id:"LOG-0009", actionType:"更新",  operator:"林梅", operatorRole:"馆长", objectType:"系统配置", objectId:"CFG-interval",timestamp:"2026-06-16 14:00:00", description:"更新首页通知条轮播间隔",               before:{ key:"carousel_interval_ms", value:"3000" }, after:{ key:"carousel_interval_ms", value:"4000" } },
  { id:"LOG-0010", actionType:"导出",  operator:"林梅", operatorRole:"馆长", objectType:"会员",   objectId:"BATCH",         timestamp:"2026-06-15 10:30:22", description:"导出会员列表，共 10 条记录",            ip:"192.168.1.10" },
  { id:"LOG-0011", actionType:"更新",  operator:"林梅", operatorRole:"馆长", objectType:"预约",   objectId:"r3",            timestamp:"2026-06-14 16:00:10", description:"手动更新预约「刘芳」状态为已签到",      before:{ status:"已确认" }, after:{ status:"已签到" } },
  { id:"LOG-0012", actionType:"创建",  operator:"林梅", operatorRole:"馆长", objectType:"订单",   objectId:"ORD-OFF-0601",  timestamp:"2026-06-13 11:00:00", description:"线下录入订单「月卡 - 韩雪」",           after:{ orderNo:"ORD-OFF-0601", userName:"韩雪", packageName:"月卡", actualAmount:680, payChannel:"现金" } },
  { id:"LOG-0013", actionType:"更新",  operator:"林梅", operatorRole:"馆长", objectType:"套餐",   objectId:"PKG-2506",      timestamp:"2026-06-12 09:30:00", description:"下架套餐「旧版次卡」",                  before:{ status:"上架中" }, after:{ status:"已下架" } },
  { id:"LOG-0014", actionType:"删除",  operator:"林梅", operatorRole:"馆长", objectType:"教练",   objectId:"i_temp",        timestamp:"2026-06-11 14:45:00", description:"删除教练档案「临时教练」",              before:{ name:"临时教练", phone:"130****0000", status:"禁用" } },
  { id:"LOG-0015", actionType:"更新",  operator:"林梅", operatorRole:"馆长", objectType:"会员",   objectId:"m6",            timestamp:"2026-06-10 10:00:00", description:"更新会员「韩雪」状态为已过期",          before:{ status:"活跃" }, after:{ status:"已过期" } },
  { id:"LOG-0016", actionType:"创建",  operator:"林梅", operatorRole:"馆长", objectType:"教练",   objectId:"i5",            timestamp:"2026-06-08 09:00:00", description:"新增教练「苏菲娅」",                    after:{ name:"苏菲娅", phone:"152****3318", bio:"舞者出身，空中吊绳课程专家", status:"启用" } },
  { id:"LOG-0017", actionType:"更新",  operator:"林梅", operatorRole:"馆长", objectType:"课程",   objectId:"t3",            timestamp:"2026-06-07 15:00:00", description:"更新课程「深度放松」容量 15→18",        before:{ capacity:15 }, after:{ capacity:18 } },
  { id:"LOG-0018", actionType:"导出",  operator:"林梅", operatorRole:"馆长", objectType:"订单",   objectId:"BATCH",         timestamp:"2026-06-06 11:30:00", description:"导出订单列表（5月月度财务报表）",       ip:"192.168.1.10" },
  { id:"LOG-0019", actionType:"登录",  operator:"林梅", operatorRole:"馆长", objectType:"系统配置", objectId:"SYS",         timestamp:"2026-06-05 08:55:00", description:"管理员登录系统",                       ip:"192.168.1.10" },
  { id:"LOG-0020", actionType:"更新",  operator:"林梅", operatorRole:"馆长", objectType:"系统配置", objectId:"CFG-booking", timestamp:"2026-06-04 14:00:00", description:"更新预约取消窗口：2 小时 → 4 小时",    before:{ key:"cancel_window_hours", value:"2" }, after:{ key:"cancel_window_hours", value:"4" } },
  { id:"LOG-0021", actionType:"审核通过",operator:"林梅",operatorRole:"馆长", objectType:"订单",  objectId:"ORD-20260615-0012",timestamp:"2026-06-15 12:10:00",description:"审核通过退款申请「刘芳 · 5节体验包」", before:{ status:"退款中" }, after:{ status:"已退款" } },
  { id:"LOG-0022", actionType:"更新",  operator:"林梅", operatorRole:"馆长", objectType:"预约",   objectId:"r5",            timestamp:"2026-06-11 09:30:00", description:"取消预约「陈博 · 进阶强化 06:30」",    before:{ status:"已确认" }, after:{ status:"已取消" } },
];

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
  const [logs]        = useState<LogEntry[]>(INIT);
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
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        <span className="text-stone-400 text-sm">—</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        <div className="flex-1" />
        <button onClick={() => { setFAction(""); setFObject(""); setDateFrom(""); setDateTo(""); }}
          className="h-9 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm text-stone-600 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> 重置
        </button>
      </div>

      {/* Stats + Top breakdown side-by-side */}
      <div className="grid grid-cols-[1fr_320px] gap-4 items-start">

        {/* Left: 4 stat cards */}
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
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
        <div className="grid grid-cols-[80px_80px_100px_80px_130px_148px_1fr_60px] px-4 py-2.5 bg-stone-900 text-xs text-stone-400">
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
    <div className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>{icon}</div>
      <div>
        <div className="text-xs text-stone-500">{label}</div>
        <div className="text-xl text-stone-900 leading-tight">{value}</div>
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
