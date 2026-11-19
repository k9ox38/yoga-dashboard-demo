import { useState, useMemo } from "react";
import { Search, RefreshCw, Plus, Edit3, Eye, X, Info, Send, Archive } from "lucide-react";
import { addDaysFromToday, localDate, localDateTime, parseLocalDate, shiftLocalDateTime } from "../lib/dates";
import { DateField } from "./DatePicker";
import { SelectMenu } from "./SelectMenu";

/* ─── Types ──────────────────────────────────────── */

type NotifStatus  = "草稿" | "已发布" | "已归档";
type Priority     = "高" | "中" | "低";
type LinkType     = "不跳转" | "小程序页面" | "外部链接";

export interface Notif {
  id: string;
  title: string;
  content: string;
  status: NotifStatus;
  priority: Priority;
  displayPosition: string;
  publishedAt?: string;
  displayStart?: string;
  displayEnd?: string;
  updatedAt: string;
  linkType: LinkType;
  linkUrl?: string;
}

type ModalState =
  | { kind: "none" }
  | { kind: "edit"; notif: Notif | null }
  | { kind: "confirm_publish"; notif: Notif }
  | { kind: "confirm_archive"; notif: Notif };

/* ─── Seed data ──────────────────────────────────── */

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const cnDay = (day: string) => { const d = parseLocalDate(day); return `${d.getMonth() + 1}月${d.getDate()}日`; };
const cnWeekday = (day: string) => WEEKDAYS[parseLocalDate(day).getDay()];
/** Minute-precision local timestamp ("YYYY-MM-DD HH:mm"), never UTC. */
const nowStamp = () => localDateTime().slice(0, 16);

/** Demo notices dated relative to `today`, so published ones are always inside their display window. */
export function buildSeedNotices(today: Date = new Date()): Notif[] {
  const day = (offset: number) => addDaysFromToday(offset, today);
  const at = (offset: number, time: string) => shiftLocalDateTime(offset, `${time}:00`, today).slice(0, 16);
  const closure = day(10);
  const promoStart = day(-5);
  const promoEnd = day(25);
  const maintenance = day(7);
  const pointsStart = localDate(new Date(today.getFullYear(), today.getMonth() + 1, 1, 12));
  const pointsEnd = localDate(new Date(today.getFullYear(), today.getMonth() + 2, 0, 12));
  return [
    {
      id: "n1", title: `【重要】${cnDay(closure)}场馆维护暂停营业`,
      content: `因场地维护需要，${cnDay(closure)}（${cnWeekday(closure)}）全天暂停营业。已预约当日课程的会员将收到短信通知，课时不扣除。`,
      status: "已发布", priority: "高", displayPosition: "首页通知条",
      publishedAt: at(-2, "10:00"), displayStart: day(-2), displayEnd: closure,
      updatedAt: at(-2, "10:00"), linkType: "不跳转",
    },
    {
      id: "n2", title: "课时包限时 8 折",
      content: `${cnDay(promoStart)}起，所有课时包享受 8 折优惠，月卡不参与活动。活动有效期至 ${cnDay(promoEnd)}。`,
      status: "已发布", priority: "高", displayPosition: "首页通知条",
      publishedAt: at(-6, "09:00"), displayStart: promoStart, displayEnd: promoEnd,
      updatedAt: at(-6, "09:00"), linkType: "小程序页面", linkUrl: "/pages/packages/index",
    },
    {
      id: "n3", title: "「产前产后」课程开放预约",
      content: "谭美老师的产前产后温和练习课每周开课，每节限 12 人，名额有限，欢迎提前预约。",
      status: "已发布", priority: "中", displayPosition: "首页通知条",
      publishedAt: at(-7, "14:00"), displayStart: day(-7), displayEnd: day(21),
      updatedAt: at(-7, "14:00"), linkType: "小程序页面", linkUrl: "/pages/schedule/index",
    },
    {
      id: "n4", title: `系统维护通知 — ${cnDay(maintenance)}凌晨`,
      content: `小程序将于${cnDay(maintenance)}凌晨 2:00–4:00 进行系统维护，期间无法预约课程，请提前安排。`,
      status: "草稿", priority: "高", displayPosition: "首页通知条",
      displayStart: day(6), displayEnd: maintenance,
      updatedAt: at(-1, "16:30"), linkType: "不跳转",
    },
    {
      id: "n5", title: "会员积分规则更新说明",
      content: `自${cnDay(pointsStart)}起，购卡积分比例由原 1% 调整为 1.5%，推荐积分保持不变。请会员知悉。`,
      status: "草稿", priority: "中", displayPosition: "首页通知条",
      displayStart: pointsStart, displayEnd: pointsEnd,
      updatedAt: at(-2, "11:00"), linkType: "不跳转",
    },
    {
      id: "n6", title: "A 馆地板翻新，部分课程调整场地",
      content: `${cnDay(day(-33))}–${cnDay(day(-26))} 期间 A 馆地板翻新，部分课程改至 B 馆上课，请以小程序课表为准。`,
      status: "已归档", priority: "低", displayPosition: "首页通知条",
      publishedAt: at(-34, "09:00"), displayStart: day(-34), displayEnd: day(-26),
      updatedAt: at(-25, "09:00"), linkType: "不跳转",
    },
    {
      id: "n7", title: "课时包促销活动结束",
      content: `课时包特惠活动已于${cnDay(day(-50))}结束，感谢各位会员的参与与支持。`,
      status: "已归档", priority: "低", displayPosition: "首页通知条",
      publishedAt: at(-60, "10:00"), displayStart: day(-60), displayEnd: day(-50),
      updatedAt: at(-49, "10:00"), linkType: "不跳转",
    },
    {
      id: "n8", title: "新版小程序上线，体验全面升级",
      content: "新版小程序已正式上线，支持快速预约、积分查询、课表订阅等功能，欢迎体验并反馈意见。",
      status: "已归档", priority: "中", displayPosition: "首页通知条",
      publishedAt: at(-90, "09:00"), displayStart: day(-90), displayEnd: day(-61),
      updatedAt: at(-61, "18:00"), linkType: "外部链接", linkUrl: "https://example.com/release-notes",
    },
  ];
}

/** Whether a published notice is currently in its display window. */
export type DisplayState = "展示中" | "未开始" | "已结束";
export function displayState(n: Pick<Notif, "displayStart" | "displayEnd">, today: string = localDate()): DisplayState {
  if (n.displayStart && today < n.displayStart) return "未开始";
  if (n.displayEnd && today > n.displayEnd) return "已结束";
  return "展示中";
}

const displayStateBadge: Record<DisplayState, string> = {
  "展示中": "bg-emerald-50 text-emerald-700",
  "未开始": "bg-stone-100 text-stone-500",
  "已结束": "bg-amber-50 text-amber-700",
};

/* ─── Style maps ─────────────────────────────────── */

const statusBadge: Record<NotifStatus, string> = {
  "草稿":   "bg-amber-50 text-amber-700 border border-amber-200",
  "已发布": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "已归档": "bg-stone-100 text-stone-400 border border-stone-200",
};

const priorityBadge: Record<Priority, string> = {
  "高": "bg-rose-50 text-rose-600",
  "中": "bg-sky-50 text-sky-700",
  "低": "bg-stone-100 text-stone-500",
};

/* ─── Main component ─────────────────────────────── */

export function Notifications() {
  const [notifs, setNotifs]     = useState<Notif[]>(() => buildSeedNotices());
  const [modal, setModal]       = useState<ModalState>({ kind: "none" });
  const [search, setSearch]     = useState("");
  const [fStatus, setFStatus]   = useState<"" | NotifStatus>("");
  const [bannerInterval, setBannerInterval] = useState(4);
  const [justSaved, setJustSaved] = useState(false);
  const todayKey = localDate();

  const filtered = useMemo(() => notifs.filter((n) => {
    if (fStatus && n.status !== fStatus) return false;
    if (search && !n.title.includes(search) && !n.content.includes(search)) return false;
    return true;
  }), [notifs, search, fStatus]);

  /* Mutations */
  const upsert = (n: Notif) =>
    setNotifs(prev => prev.some(x => x.id === n.id) ? prev.map(x => x.id === n.id ? n : x) : [n, ...prev]);

  const publish = (n: Notif) => {
    const stamp = nowStamp();
    upsert({ ...n, status: "已发布", publishedAt: stamp, updatedAt: stamp });
    setModal({ kind: "none" });
  };

  const archive = (n: Notif) => {
    upsert({ ...n, status: "已归档", updatedAt: nowStamp() });
    setModal({ kind: "none" });
  };

  const changeInterval = (next: number) => {
    setBannerInterval(Math.min(30, Math.max(1, next)));
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题 / 内容"
            className="h-9 pl-8 pr-3 w-full sm:w-52 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>
        <Sel value={fStatus} onChange={(v) => setFStatus(v as "" | NotifStatus)}>
          <option value="">全部状态</option>
          {(["草稿","已发布","已归档"] as NotifStatus[]).map(s => <option key={s}>{s}</option>)}
        </Sel>
        <div className="flex-1" />
        <button onClick={() => { setNotifs(buildSeedNotices()); setSearch(""); setFStatus(""); }} className="h-9 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm text-stone-600 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> 刷新
        </button>
        <button onClick={() => setModal({ kind: "edit", notif: null })} className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 新增通知
        </button>
      </div>

      {/* Display guidance + auto-save interval */}
      <div className="flex flex-col items-start gap-2 rounded-lg bg-stone-100 px-4 py-2.5 sm:h-12 sm:flex-row sm:items-center sm:gap-4 sm:py-0">
        <div className="flex min-w-0 items-start gap-2 text-sm text-[#6B7280] sm:items-center">
          <Info className="mt-0.5 size-4 shrink-0 text-stone-400 sm:mt-0" />
          <span className="sm:truncate">只有已发布且在展示时间内的通知会出现在小程序首页，按优先级从高到低轮播。</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm text-[#6B7280] sm:ml-auto">
          <span>切换间隔</span>
          <div className="flex h-8 w-[120px] items-center overflow-hidden rounded-lg bg-white">
            <button type="button" disabled={bannerInterval <= 1} onClick={() => changeInterval(bannerInterval - 1)} className="h-full w-9 text-base text-stone-500 hover:bg-stone-50 disabled:opacity-35">−</button>
            <span className="flex-1 text-center font-medium tabular-nums text-stone-800">{bannerInterval}</span>
            <button type="button" disabled={bannerInterval >= 30} onClick={() => changeInterval(bannerInterval + 1)} className="h-full w-9 text-base text-stone-500 hover:bg-stone-50 disabled:opacity-35">+</button>
          </div>
          <span>秒</span>
          <span className={`w-14 text-xs text-[#6B7280] transition-opacity ${justSaved ? "opacity-100" : "opacity-0"}`}>已保存 ✓</span>
        </div>
      </div>

      {/* Table: scrolls sideways on narrow screens, with 操作 pinned on the right */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden"><div className="overflow-x-auto"><div className="min-w-[780px]">
        {/* Header */}
        <div className="grid grid-cols-[minmax(0,1fr)_100px_80px_230px_180px] px-4 py-2.5 bg-stone-50 border-b border-stone-100 text-xs text-stone-500">
          <div>标题</div><div>状态</div><div>优先级</div><div>展示时间范围</div><div className="sticky right-0 bg-stone-50 text-right">操作</div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-sm text-stone-400">暂无匹配通知</div>
            <div className="text-xs text-stone-300 mt-1">调整筛选条件或新增通知</div>
          </div>
        ) : filtered.map((n) => (
          <div key={n.id} className="group/row grid grid-cols-[minmax(0,1fr)_100px_80px_230px_180px] items-center px-4 py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
            <div className="pr-4 min-w-0">
              <div className="text-sm text-stone-900 truncate">{n.title}</div>
              <div className="text-xs text-[#6B7280] truncate mt-0.5">{n.content}…</div>
            </div>
            <span><Badge cls={statusBadge[n.status]}>{n.status}</Badge></span>
            <span><Badge cls={priorityBadge[n.priority]}>{n.priority}</Badge></span>
            <div className="group/time relative w-fit text-xs text-[#6B7280]">
              <span title={`发布于 ${n.publishedAt?.slice(0, 10) ?? "—"} · 更新于 ${n.updatedAt.slice(0, 10)}`}>{n.displayStart && n.displayEnd ? `${n.displayStart} – ${n.displayEnd}` : "—"}</span>
              {n.status === "已发布" && (() => { const state = displayState(n, todayKey); return <span className={`ml-2 rounded px-1.5 py-0.5 text-[11px] ${displayStateBadge[state]}`}>{state}</span>; })()}
              <div role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-3 py-2 text-xs text-white shadow-lg group-hover/time:block">
                发布于 {n.publishedAt?.slice(0, 10) ?? "—"} · 更新于 {n.updatedAt.slice(0, 10)}
              </div>
            </div>
            <div className="sticky right-0 flex items-center gap-1.5 justify-end bg-white transition-colors group-hover/row:bg-stone-50">
              <button
                onClick={() => setModal({ kind: "edit", notif: n })}
                className="h-7 px-2 rounded border border-stone-200 hover:bg-stone-100 text-xs text-stone-600 flex items-center gap-1"
              >
                {n.status === "已归档" ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                {n.status === "已归档" ? "查看" : "编辑"}
              </button>
              {n.status === "草稿" && (
                <button
                  onClick={() => setModal({ kind: "confirm_publish", notif: n })}
                  className="h-7 px-2 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs flex items-center gap-1"
                >
                  <Send className="w-3 h-3" /> 发布
                </button>
              )}
              {n.status === "已发布" && (
                <button
                  onClick={() => setModal({ kind: "confirm_archive", notif: n })}
                  className="h-7 px-2 rounded border border-stone-200 hover:bg-stone-100 text-xs text-stone-500 flex items-center gap-1"
                >
                  <Archive className="w-3 h-3" /> 归档
                </button>
              )}
            </div>
          </div>
        ))}
      </div></div></div>

      {/* Modals */}
      {modal.kind === "edit" && (
        <NotifModal
          initial={modal.notif}
          onClose={() => setModal({ kind: "none" })}
          onSubmit={(v) => { upsert(v); setModal({ kind: "none" }); }}
        />
      )}
      {modal.kind === "confirm_publish" && (
        <ConfirmModal
          title="发布通知"
          desc={`确认发布「${modal.notif.title}」？\n发布后通知将立即出现在首页通知条轮播中（如展示时间在范围内）。`}
          confirmLabel="确认发布"
          confirmCls="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClose={() => setModal({ kind: "none" })}
          onConfirm={() => publish(modal.notif)}
        />
      )}
      {modal.kind === "confirm_archive" && (
        <ConfirmModal
          title="归档通知"
          desc={`确认将「${modal.notif.title}」归档？\n归档后通知将从首页通知条移除，不再对用户展示。`}
          confirmLabel="确认归档"
          confirmCls="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClose={() => setModal({ kind: "none" })}
          onConfirm={() => archive(modal.notif)}
        />
      )}
    </div>
  );
}

/* ─── Notif edit modal ───────────────────────────── */

const emptyNotif = (): Omit<Notif, "id" | "updatedAt"> => ({
  title: "", content: "", status: "草稿", priority: "中",
  displayPosition: "首页通知条", publishedAt: undefined,
  displayStart: "", displayEnd: "", linkType: "不跳转", linkUrl: "",
});

function NotifModal({ initial, onClose, onSubmit }: {
  initial: Notif | null;
  onClose: () => void;
  onSubmit: (n: Notif) => void;
}) {
  const [v, setV] = useState(() => initial
    ? { ...initial }
    : { id: `n_${Date.now()}`, updatedAt: "", ...emptyNotif() }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isArchived = initial?.status === "已归档";

  const set = <K extends keyof Notif>(k: K, val: Notif[K]) => setV(p => ({ ...p, [k]: val }));

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!v.title.trim()) e.title = "请输入通知标题";
    if (!v.content.trim()) e.content = "请输入通知详情";
    if ((v.linkType !== "不跳转") && !v.linkUrl?.trim()) e.linkUrl = "请输入跳转地址";
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({ ...v, updatedAt: nowStamp() });
  };

  return (
    <Modal title={initial ? (isArchived ? "查看通知" : "编辑通知") : "新增通知"} subtitle={initial ? `最近更新 ${initial.updatedAt}` : undefined} onClose={onClose} wide>
      <div className="p-6 space-y-4">
        {isArchived && (
          <div className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-500">
            归档通知为只读状态，如需重新使用请先将状态改为草稿并保存。
          </div>
        )}

        <MF label="通知标题" error={errors.title}>
          <input value={v.title} onChange={(e) => set("title", e.target.value)} disabled={isArchived}
            placeholder="如：暑期特惠套餐上线，限时 8 折" className={inp(errors.title, isArchived)} />
        </MF>

        <MF label="通知详情" error={errors.content}>
          <textarea value={v.content} onChange={(e) => set("content", e.target.value)} disabled={isArchived}
            rows={3} placeholder="通知正文内容，将在小程序详情页展示"
            className={inp(errors.content, isArchived) + " h-auto py-2 resize-none"} />
        </MF>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <MF label="状态">
            <Sel value={v.status} onChange={(val) => set("status", val as NotifStatus)} disabled={isArchived} full>
              <option value="草稿">草稿</option>
              <option value="已发布">已发布</option>
            </Sel>
          </MF>
          <MF label="优先级">
            <div className="flex gap-1.5">
              {(["高","中","低"] as Priority[]).map(p => (
                <button key={p} type="button" disabled={isArchived}
                  onClick={() => set("priority", p)}
                  className={`flex-1 h-9 rounded-lg border text-xs transition-colors ${
                    v.priority === p
                      ? p === "高" ? "border-rose-300 bg-rose-50 text-rose-600"
                        : p === "中" ? "border-sky-300 bg-sky-50 text-sky-700"
                        : "border-stone-300 bg-stone-100 text-stone-500"
                      : "border-stone-200 text-stone-500 hover:bg-stone-50"
                  } disabled:opacity-60 disabled:cursor-default`}>
                  {p}
                </button>
              ))}
            </div>
          </MF>
          <MF label="展示位置">
            <input value={v.displayPosition} readOnly
              className="w-full h-9 px-3 rounded-lg border border-stone-100 bg-stone-50 text-sm text-stone-400 cursor-default" />
          </MF>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <MF label="发布时间" className="col-span-2 sm:col-span-1">
            <DateField ariaLabel="发布时间" value={v.publishedAt?.slice(0,10) ?? ""} disabled={isArchived}
              onChange={(day) => set("publishedAt", day)} />
          </MF>
          <MF label="开始展示">
            <DateField ariaLabel="开始展示" value={v.displayStart ?? ""} disabled={isArchived}
              onChange={(day) => set("displayStart", day)} />
          </MF>
          <MF label="结束展示">
            <DateField ariaLabel="结束展示" value={v.displayEnd ?? ""} disabled={isArchived}
              onChange={(day) => set("displayEnd", day)} />
          </MF>
        </div>

        <MF label="跳转类型">
          <div className="flex gap-1.5">
            {(["不跳转","小程序页面","外部链接"] as LinkType[]).map(t => (
              <button key={t} type="button" disabled={isArchived}
                onClick={() => { set("linkType", t); if (t === "不跳转") set("linkUrl", ""); }}
                className={`flex-1 h-9 rounded-lg border text-xs transition-colors ${
                  v.linkType === t
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                    : "border-stone-200 text-stone-500 hover:bg-stone-50"
                } disabled:opacity-60 disabled:cursor-default`}>
                {t}
              </button>
            ))}
          </div>
        </MF>

        {v.linkType !== "不跳转" && (
          <MF label={v.linkType === "小程序页面" ? "小程序路径" : "外部链接 URL"} error={errors.linkUrl}>
            <input value={v.linkUrl ?? ""} disabled={isArchived}
              onChange={(e) => set("linkUrl", e.target.value)}
              placeholder={v.linkType === "小程序页面" ? "/pages/packages/index" : "https://example.com/page"}
              className={inp(errors.linkUrl, isArchived)} />
          </MF>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200 bg-stone-50 rounded-b-2xl">
        <button onClick={onClose} className="h-9 px-4 rounded-lg border border-stone-200 hover:bg-white text-sm">
          {isArchived ? "关闭" : "取消"}
        </button>
        {!isArchived && (
          <button onClick={handleSubmit} className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
            {initial ? "保存修改" : "创建通知"}
          </button>
        )}
      </div>
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
            {subtitle && <div className="text-xs text-stone-400 font-mono mt-0.5">{subtitle}</div>}
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

function Badge({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{children}</span>;
}

function Sel({ value, onChange, children, full, disabled }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; full?: boolean; disabled?: boolean;
}) {
  return (
    <SelectMenu value={value} onValueChange={onChange} disabled={disabled}
      className={`text-stone-700 disabled:cursor-default disabled:bg-stone-50 disabled:text-stone-400 disabled:opacity-100 ${full ? "w-full" : ""}`}>
      {children}
    </SelectMenu>
  );
}

function MF({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block min-w-0 ${className ?? ""}`}>
      <span className="text-xs text-stone-600">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <div className="text-xs text-rose-600 mt-1">{error}</div>}
    </label>
  );
}

function inp(error?: string, disabled?: boolean) {
  return `w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
    disabled ? "bg-stone-50 border-stone-100 text-stone-400 cursor-default" :
    error ? "border-rose-300 bg-white" : "border-stone-200 bg-white focus:border-emerald-500"
  }`;
}
