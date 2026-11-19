import { useEffect, useRef, useState } from "react";
import { X, Trash2, Star, Eye, EyeOff, Users, Plus, Search, CheckCircle2 } from "lucide-react";
import type { ClassSession, ClassTemplate, Instructor, Member, Reservation } from "./data";
import { ROOMS } from "./data";
import type { BookingEligibility } from "../store";
import { useStore } from "../store-context";
import { MemberCardDrawer } from "./MemberCardDrawer";
import { DateField } from "./DatePicker";

function makeEmpty(): ClassSession {
  return {
    id: "",
    classId: "",
    instructor: "",
    room: ROOMS[0],
    date: (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; })(),
    start: "09:00",
    end: "10:00",
    booked: 0,
    difficulty: 3,
    isVisible: true,
  };
}

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: ClassSession | null;
  templates: ClassTemplate[];
  instructors: Instructor[];
  onClose: () => void;
  onSubmit: (values: ClassSession) => void;
  onDelete?: (id: string) => void;
};

export function SessionModal({ open, mode, initial, templates, instructors, onClose, onSubmit, onDelete }: Props) {
  const [values, setValues] = useState<ClassSession>(makeEmpty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setValues({
        ...initial,
        instructor: initial.instructor || instructors[0]?.name || "",
        difficulty:  initial.difficulty  ?? 3,
        isVisible:   initial.isVisible   ?? true,
      });
    } else {
      setValues({ ...makeEmpty(), classId: templates[0]?.id ?? "", instructor: instructors[0]?.name ?? "" });
    }
    setErrors({});
  }, [open, initial, templates, instructors]);

  const set = <K extends keyof ClassSession>(k: K, v: ClassSession[K]) =>
    setValues((p) => ({ ...p, [k]: v }));

  const template = templates.find((t) => t.id === values.classId);

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!values.classId) e.classId = "请选择课程";
    if (!values.date)    e.date    = "请选择日期";
    if (values.start >= values.end) e.end = "结束时间需晚于开始时间";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSubmit({ ...values, id: values.id || `s_${Date.now()}` });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-stone-900/30 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 shrink-0">
          <div>
            <div className="text-stone-900 font-semibold">{mode === "create" ? "排课" : "编辑排课"}</div>
            <div className="text-xs text-stone-500 mt-0.5">为已有课程安排具体时间与教练</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          <Field label="选择课程" error={errors.classId}>
            <select value={values.classId} onChange={(e) => set("classId", e.target.value)} className={inputCls(errors.classId)}>
              <option value="">— 请选择 —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} · {t.format} · {t.level}</option>
              ))}
            </select>
          </Field>

          {template && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 space-y-0.5">
              <div>{template.description || "暂无描述"}</div>
              <div className="opacity-80">难度 {template.level} · 容量 {template.capacity} 人 · {template.format}</div>
            </div>
          )}

          <Field label="教练">
            <select value={values.instructor} onChange={(e) => set("instructor", e.target.value)} className={inputCls()}>
              {instructors.filter((i) => i.status === "启用").map((i) => (
                <option key={i.id} value={i.name}>{i.name}　{i.phone}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-4">
            <Field label="日期" error={errors.date}>
              <DateField ariaLabel="日期" value={values.date} onChange={(day) => set("date", day)} invalid={Boolean(errors.date)} />
            </Field>
            <Field label="开始时间">
              <input type="time" value={values.start} onChange={(e) => set("start", e.target.value)} className={inputCls()} />
            </Field>
            <Field label="结束时间" error={errors.end}>
              <input type="time" value={values.end} onChange={(e) => set("end", e.target.value)} className={inputCls(errors.end)} />
            </Field>
          </div>

          <div>
            <div className="text-xs text-stone-600 mb-2">难度</div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set("difficulty", n)}
                  className="p-0.5 rounded transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      n <= values.difficulty
                        ? "fill-amber-400 text-amber-400"
                        : "fill-stone-100 text-stone-300"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs text-stone-400">
                {["", "非常简单", "简单", "适中", "有挑战", "非常困难"][values.difficulty]}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-stone-200 px-4 py-3">
            <div className="flex items-center gap-2.5">
              {values.isVisible
                ? <Eye className="w-4 h-4 text-emerald-600" />
                : <EyeOff className="w-4 h-4 text-stone-400" />
              }
              <div>
                <div className="text-sm text-stone-900">对用户可见</div>
                <div className="text-xs text-stone-400">
                  {values.isVisible ? "会员可在小程序中看到并预约此课程" : "此课程对会员隐藏，不可预约"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => set("isVisible", !values.isVisible)}
              className={`relative w-10 h-5 rounded-full transition-colors ${values.isVisible ? "bg-emerald-600" : "bg-stone-200"}`}
            >
              <span className={`absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${values.isVisible ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* Student list */}
          <StudentList
            sessionId={values.id}
            capacity={template?.capacity}
            sessionMeta={template ? {
              className: template.name,
              date: values.date,
              start: values.start,
              end: values.end,
              instructor: values.instructor,
            } : undefined}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50 shrink-0">
          <div>
            {mode === "edit" && onDelete && initial && (
              <button onClick={() => { onDelete(initial.id); onClose(); }} className="h-9 px-3 rounded-lg text-rose-600 hover:bg-rose-50 text-sm flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> 取消该排课
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-9 px-4 rounded-lg border border-stone-200 hover:bg-white text-sm">取消</button>
            <button onClick={handleSubmit} className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
              {mode === "create" ? "排课" : "保存修改"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const STATUS_STYLE: Record<string, string> = {
  "已确认": "bg-emerald-50 text-emerald-700",
  "已签到": "bg-blue-50 text-blue-700",
  "已取消": "bg-stone-100 text-stone-400 line-through",
  "未到":   "bg-amber-50 text-amber-700",
};

const STATUS_ACTIONS: Record<string, { label: string; next: string }[]> = {
  "已确认": [{ label: "签到", next: "已签到" }, { label: "取消", next: "已取消" }],
  "已签到": [{ label: "撤销签到", next: "已确认" }, { label: "取消", next: "已取消" }],
  "已取消": [{ label: "恢复预约", next: "已确认" }],
  "未到":   [{ label: "补签到", next: "已签到" }, { label: "取消", next: "已取消" }],
};

/* ─── Proxy Booking Modal ─── */
type ProxyBookingModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (member: Member, note: string) => void;
  availableMembers: Member[];
  getEligibility: (member: Member) => BookingEligibility;
  session: { className: string; date: string; start: string; end: string; instructor: string; capacity: number; bookedCount: number };
};

function ProxyBookingModal({ open, onClose, onConfirm, availableMembers, getEligibility, session }: ProxyBookingModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [note, setNote] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [cardMember, setCardMember] = useState<Member | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQuery(""); setSelected(null); setNote(""); setShowDropdown(false); }
  }, [open]);

  useEffect(() => {
    if (!selected) return;
    const current = availableMembers.find((member) => member.id === selected.id);
    if (current && current !== selected) setSelected(current);
  }, [availableMembers, selected]);

  const filtered = availableMembers.filter((m) =>
    m.name.includes(query) || m.phone.includes(query)
  );

  const handleSelect = (m: Member) => {
    setSelected(m);
    setQuery(`${m.name} · ${m.phone}`);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const spotsLeft = session.capacity - session.bookedCount;

  const bookingEligibility = selected ? getEligibility(selected) : null;
  const eligibility = selected ? [
    { label: bookingEligibility?.ok ? bookingEligibility.benefit : bookingEligibility?.reason ?? "无法预约", ok: Boolean(bookingEligibility?.ok) },
    { label: "当天尚未预约小班课", ok: true },
    { label: `课程剩余 ${spotsLeft} 个名额`, ok: spotsLeft > 0 },
  ] : [];

  const canConfirm = selected && bookingEligibility?.ok && eligibility.every((e) => e.ok);

  const fmtDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <>
      {/* Scrim (above the drawer backdrop, below this modal) */}
      <div
        className={`fixed inset-0 z-[60] bg-stone-900/40 backdrop-blur-[2px] transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      {/* Modal card */}
      <div
        className={`fixed z-[70] inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[420px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${open ? "opacity-100 translate-y-0 sm:scale-100" : "opacity-0 translate-y-8 sm:scale-95 pointer-events-none"}`}
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <h2 className="text-base font-semibold text-stone-900">代学员预约</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5 space-y-4 flex-1">
          {/* Member search */}
          <div>
            <div className="text-xs text-stone-500 mb-1.5">选择学员</div>
            <div className="relative">
              <div className={`flex items-center gap-2 h-10 px-3 rounded-xl border bg-white transition-colors ${showDropdown ? "border-emerald-400 ring-2 ring-emerald-500/20" : "border-stone-200"}`}>
                <Search className="w-4 h-4 text-stone-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelected(null); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="搜索姓名或手机号"
                  className="flex-1 text-sm bg-transparent outline-none text-stone-900 placeholder:text-stone-400"
                />
                {query && (
                  <button onClick={handleClear} className="text-stone-400 hover:text-stone-600 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {showDropdown && query && (
                <>
                  <div className="fixed inset-0 z-[5]" onClick={() => setShowDropdown(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                    {filtered.length === 0 ? (
                      <div className="py-4 text-center text-xs text-stone-400">未找到匹配学员</div>
                    ) : (
                      filtered.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleSelect(m)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-700 shrink-0">
                            {m.name[0]}
                          </div>
                          <div>
                            <div className="text-sm text-stone-900">{m.name}</div>
                            <div className="text-xs text-stone-400">{m.phone}{getEligibility(m).ok ? "" : ` · ${getEligibility(m).reason}`}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Selected member card */}
          {selected && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-base font-semibold text-emerald-700 shrink-0">
                {selected.name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">{selected.name}</div>
                <div className="text-xs text-stone-400">{selected.phone}</div>
              </div>
            </div>
          )}

          {/* Eligibility checks */}
          {selected && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 space-y-2.5">
              <div className="text-xs font-medium text-stone-700">预约资格</div>
              {eligibility.map((e, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${e.ok ? "text-emerald-600" : "text-stone-300"}`} fill={e.ok ? "currentColor" : "none"} />
                  <span className={`text-sm ${e.ok ? "text-stone-800" : "text-stone-400"}`}>{e.label}</span>
                </div>
              ))}
              {bookingEligibility && !bookingEligibility.ok && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><div>{bookingEligibility.reason}，请先办卡</div><button type="button" className="mt-2 rounded-lg bg-amber-800 px-4 py-2 text-xs text-white hover:bg-amber-900" onClick={() => setCardMember(selected)}>去办卡</button></div>}
            </div>
          )}

          {/* Session info */}
          <div className="rounded-xl bg-stone-50 border border-stone-100 p-4">
            <div className="text-xs text-stone-400 mb-1">预约场次</div>
            <div className="text-sm font-semibold text-stone-900">{session.className}</div>
            <div className="text-xs text-stone-500 mt-0.5">
              {fmtDate(session.date)} {session.start}–{session.end} · {session.instructor}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="text-xs text-stone-500 mb-1.5">备注</div>
            <div className="relative">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                placeholder="填写备注（选填）"
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
              />
              <div className="absolute bottom-2 right-3 text-[11px] text-stone-400">{note.length}/200</div>
            </div>
          </div>
          {bookingEligibility?.ok && selected && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              本次预约将使用：{bookingEligibility.benefit === "扣次 1 次" ? `扣次 1 次（剩余 ${selected.privateRemaining} 次）` : bookingEligibility.benefit}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5 pt-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            取消
          </button>
          <button
            disabled={!canConfirm}
            onClick={() => { if (selected) { onConfirm(selected, note); onClose(); } }}
            className="flex-1 h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            确认预约
          </button>
        </div>
      </div>
      {cardMember && <MemberCardDrawer member={cardMember} onClose={() => setCardMember(null)} onSuccess={() => setCardMember(null)} />}
    </>
  );
}

/* ─── Student List ─── */
function StudentList({ sessionId, capacity, sessionMeta }: {
  sessionId: string;
  capacity?: number;
  sessionMeta?: { className: string; date: string; start: string; end: string; instructor: string };
}) {
  const { reservations, members, sessions, addReservation, updateReservationStatus, canBook } = useStore();
  const rows = reservations
    .filter((r) => r.sessionId === sessionId)
    .map((r) => ({ ...r, memberInfo: members.find((m) => m.id === r.memberId) }));

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [recentAddedIds, setRecentAddedIds] = useState<string[]>([]);
  const [proxyOpen, setProxyOpen] = useState(false);

  const changeStatus = (id: string, next: Reservation["status"]) => {
    updateReservationStatus(id, next);
    setOpenMenu(null);
  };

  const bookedMemberIds = new Set(rows.filter((r) => r.status !== "已取消").map((r) => r.memberId));
  const availableMembers = members.filter((m) => !bookedMemberIds.has(m.id));
  const activeCount = rows.filter((r) => r.status !== "已取消").length;
  const isFull = capacity != null && activeCount >= capacity;
  const currentSession = sessions.find((session) => session.id === sessionId);

  const handleConfirmProxy = (member: Member, _note: string) => {
    if (!sessionMeta || !currentSession) return;
    const eligibility = canBook(member, currentSession);
    if (!eligibility.ok) return;
    const id = crypto.randomUUID();
    addReservation({ id, memberId: member.id, member: member.name, sessionId, className: sessionMeta.className, date: sessionMeta.date, time: sessionMeta.start, status: "已确认", benefit: eligibility.benefit, bookedAt: new Date().toLocaleString("zh-CN", { hour12: false }) });
    setRecentAddedIds((previous) => [...previous, id]);
  };

  return (
    <>
      {proxyOpen && sessionMeta && (
        <ProxyBookingModal
          open={proxyOpen}
          onClose={() => setProxyOpen(false)}
          onConfirm={handleConfirmProxy}
          availableMembers={availableMembers}
          getEligibility={(member) => currentSession ? canBook(member, currentSession) : { ok: false, reason: "排课尚未保存", benefit: "无" }}
          session={{ ...sessionMeta, capacity: capacity ?? 999, bookedCount: activeCount }}
        />
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <Users className="w-3.5 h-3.5" />
            <span>已预约学员</span>
          </div>
          <div className="flex items-center gap-2">
            {capacity != null && (
              <span className="text-xs text-stone-400">{activeCount} / {capacity} 人</span>
            )}
            {sessionId && (
              <button
                type="button"
                disabled={isFull}
                onClick={() => setProxyOpen(true)}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-0.5 rounded-md hover:bg-emerald-50 transition-colors"
                title={isFull ? "课程已满" : "代学员预约"}
              >
                <Plus className="w-3 h-3" />
                <span>代学员预约</span>
              </button>
            )}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-200 py-6 flex flex-col items-center gap-1 text-stone-400">
            <Users className="w-5 h-5 opacity-40" />
            <span className="text-xs">暂无预约</span>
          </div>
        ) : (
          <div className="rounded-lg border border-stone-200 overflow-hidden">
            {rows.map((r, idx) => (
              <div
                key={r.id}
                className={`flex items-center gap-3 px-3 py-2.5 relative ${idx !== rows.length - 1 ? "border-b border-stone-100" : ""} ${recentAddedIds.includes(r.id) ? "bg-emerald-50/40" : ""}`}
              >
                <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-xs font-medium text-stone-600 shrink-0">
                  {r.memberInfo?.name?.[0] ?? r.member[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-stone-900 leading-tight">
                    {r.memberInfo?.name ?? r.member}
                    {recentAddedIds.includes(r.id) && (
                      <span className="ml-1.5 text-[10px] text-emerald-600 bg-emerald-100 px-1 py-0.5 rounded">新增</span>
                    )}
                  </div>
                  <div className="text-xs text-stone-400 truncate">{r.memberInfo?.monthlyStatus}{r.memberInfo?.privateRemaining ? ` · 私教 ${r.memberInfo.privateRemaining} 次` : ""} · {r.memberInfo?.phone}</div>
                </div>
                <div className="relative shrink-0">
                  <button
                    onClick={() => setOpenMenu(openMenu === r.id ? null : r.id)}
                    className={`text-xs px-1.5 py-0.5 rounded-full cursor-pointer select-none transition-opacity hover:opacity-70 ${STATUS_STYLE[r.status] ?? "bg-stone-100 text-stone-500"}`}
                  >
                    {r.status} ▾
                  </button>
                  {openMenu === r.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden min-w-[96px]">
                        {(STATUS_ACTIONS[r.status] ?? []).map((action) => (
                          <button
                            key={action.next}
                            onClick={() => changeStatus(r.id, action.next as Reservation["status"])}
                            className="w-full text-left text-xs px-3 py-2 hover:bg-stone-50 text-stone-700 whitespace-nowrap"
                          >
                            {action.label}
                          </button>
                        ))}
                        {(STATUS_ACTIONS[r.status] ?? []).length === 0 && (
                          <div className="text-xs px-3 py-2 text-stone-400">无可用操作</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-stone-600">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <div className="text-xs text-rose-600 mt-1">{error}</div>}
    </label>
  );
}

function inputCls(error?: string) {
  return `w-full h-9 px-3 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
    error ? "border-rose-300" : "border-stone-200 focus:border-emerald-500"
  }`;
}
