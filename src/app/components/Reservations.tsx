import { useState, type FormEvent } from "react";
import { CalendarDays, Users, UserRound, Clock3, Plus, Search, ChevronLeft, ChevronRight, Info, CheckCircle2, X } from "lucide-react";
import type { Reservation } from "./data";
import { useStore } from "../store-context";
import { MemberCardDrawer } from "./MemberCardDrawer";
import { DateRangePicker } from "./DatePicker";

const statusLabels: Record<Reservation["status"], string> = { 已确认: "已预约", 已签到: "已完成", 已取消: "已取消", 未到: "缺席" };
const statusStyles: Record<Reservation["status"], string> = {
  已确认: "bg-booking-soft text-emerald-700",
  已签到: "bg-emerald-100 text-emerald-800",
  已取消: "bg-slate-100 text-slate-600",
  未到: "bg-amber-100 text-amber-800",
};
const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const initialFilters = { start: "", end: "", type: "全部", teacher: "全部", status: "全部", keyword: "" };
const inputClass = "h-11 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15";
const primaryClass = "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-medium text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-40";

export function Reservations() {
  const { sessions, templates, instructors, members, reservations, addReservation, updateReservationStatus, canBook } = useStore();
  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [tab, setTab] = useState("全部预约");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<"create" | Reservation | null>(null);
  const [memberId, setMemberId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [notice, setNotice] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [audit, setAudit] = useState<Record<string, string>>({});
  const [cardMemberId, setCardMemberId] = useState<string | null>(null);
  const enrich = (record: Reservation) => {
    const session = sessions.find((item) => item.id === record.sessionId);
    const template = templates.find((item) => item.id === session?.classId);
    const member = members.find((item) => item.id === record.memberId);
    const benefit = record.status === "已取消" ? "无" : record.benefit;
    return { ...record, member: member?.name ?? record.member, session, memberInfo: member, teacher: session?.instructor ?? "—", type: template?.format === "私教" ? "私教课" : "小班课", benefit };
  };
  const rows = reservations.map(enrich);
  const today = localDate(new Date());
  const todayRows = rows.filter((item) => item.date === today && item.status !== "已取消");
  const stats = [
    { label: "今日预约", value: todayRows.length, icon: CalendarDays },
    { label: "小班课", value: todayRows.filter((item) => item.type === "小班课").length, icon: Users },
    { label: "私教课", value: todayRows.filter((item) => item.type === "私教课").length, icon: UserRound },
    { label: "待签到", value: todayRows.filter((item) => item.status === "已确认").length, icon: Clock3 },
  ];
  const filtered = rows.filter((item) =>
    (tab === "全部预约" || item.type === tab) &&
    (!filters.start || item.date >= filters.start) && (!filters.end || item.date <= filters.end) &&
    (filters.type === "全部" || item.type === filters.type) &&
    (filters.teacher === "全部" || item.teacher === filters.teacher) &&
    (filters.status === "全部" || item.status === filters.status) &&
    (!filters.keyword.trim() || `${item.member} ${item.memberInfo?.phone ?? ""}`.includes(filters.keyword.trim()))
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 5));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 5, currentPage * 5);
  const updateStatus = (id: string, status: Reservation["status"]) => {
    updateReservationStatus(id, status);
    setAudit((previous) => ({ ...previous, [id]: `${status === "已取消" ? "管理员取消预约" : "管理员签到"} · ${new Date().toLocaleString("zh-CN", { hour12: false })}` }));
    setCancelId(null);
    setNotice(status === "已取消" ? "预约已取消，操作记录已保留（当前页面）。" : "签到成功，预约状态已更新。 ");
  };
  const createBooking = (event: FormEvent) => {
    event.preventDefault();
    const member = members.find((item) => item.id === memberId);
    const session = sessions.find((item) => item.id === sessionId);
    if (!member || !session) return;
    const eligibility = canBook(member, session);
    if (!eligibility.ok) {
      setNotice(`${eligibility.reason}，请先办卡`);
      return;
    }
    if (reservations.some((item) => item.memberId === memberId && item.sessionId === sessionId && item.status !== "已取消")) {
      setNotice("该学员已预约此课程，请勿重复预约。");
      return;
    }
    const template = templates.find((item) => item.id === session.classId);
    addReservation({ id: crypto.randomUUID(), member: member.name, memberId, sessionId, className: template?.name ?? "课程", date: session.date, time: session.start, status: "已确认", benefit: eligibility.benefit, bookedAt: new Date().toLocaleString("zh-CN", { hour12: false }) });
    setDrawer(null);
    setDraft(initialFilters);
    setFilters(initialFilters);
    setTab("全部预约");
    setPage(1);
    setNotice("代学员预约成功，会员详情与排课名单已同步。");
  };
  const selected = typeof drawer === "object" && drawer ? enrich(reservations.find((item) => item.id === drawer.id) ?? drawer) : null;
  const bookingMember = members.find((member) => member.id === memberId);
  const bookingSession = sessions.find((session) => session.id === sessionId);
  const bookingEligibility = bookingMember && bookingSession ? canBook(bookingMember, bookingSession) : null;

  return (
    <div className="min-h-full space-y-5 bg-booking-canvas p-4 sm:p-5 font-['Noto_Sans_SC',sans-serif] text-slate-700 lg:p-7 xl:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div><h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">预约管理</h1><p className="mt-2 text-sm text-slate-500">查看预约、管理到课与取消记录</p></div>
        <button className={primaryClass} onClick={() => { setMemberId(""); setSessionId(""); setNotice(""); setDrawer("create"); }}><Plus className="size-5" />代学员预约</button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }, index) => <div key={label} className="flex min-w-0 items-center gap-3 rounded-xl border border-white bg-white p-4 sm:gap-5 sm:px-5 sm:py-6 xl:px-6">
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-full sm:size-16 ${index === 3 ? "bg-orange-50 text-amber-700" : "bg-booking-soft text-emerald-700"}`}><Icon className="size-5 sm:size-7" strokeWidth={1.7} /></div>
          <div className="min-w-0"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl sm:text-3xl font-semibold tabular-nums text-slate-950">{value}</p></div>
        </div>)}
      </div>

      <form className="space-y-5 rounded-xl bg-white p-5 xl:p-6" onSubmit={(event) => { event.preventDefault(); setFilters({ ...draft }); setPage(1); }}>
        <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-2 2xl:grid-cols-[1.65fr_1fr_1fr_1.1fr]">
          <div className="flex items-center gap-4"><span className="shrink-0 text-sm font-medium">日期</span><DateRangePicker ariaLabel="预约日期范围" presets={["今天", "昨天", "本周", "下周", "本月"]} from={draft.start} to={draft.end} onChange={(start, end) => setDraft({ ...draft, start, end })} className="h-11 min-w-0 flex-1 border-slate-200" /></div>
          <label className="flex items-center gap-4"><span className="shrink-0 text-sm">课程类型</span><select className={`${inputClass} flex-1`} value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>{["全部", "小班课", "私教课"].map((type) => <option key={type}>{type}</option>)}</select></label>
          <label className="flex items-center gap-4"><span className="shrink-0 text-sm">老师</span><select className={`${inputClass} flex-1`} value={draft.teacher} onChange={(event) => setDraft({ ...draft, teacher: event.target.value })}><option>全部</option>{instructors.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
          <label className="flex items-center gap-4"><span className="shrink-0 text-sm">预约状态</span><select className={`${inputClass} flex-1`} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}><option>全部</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4"><label className="flex w-full items-center gap-4 md:w-[52%]"><span className="shrink-0 text-sm">关键词</span><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3.5 size-4 text-slate-400" /><input className={`${inputClass} w-full pl-10`} placeholder="学员姓名 / 手机号" value={draft.keyword} onChange={(event) => setDraft({ ...draft, keyword: event.target.value })} /></div></label><div className="flex gap-3"><button type="submit" className={`${primaryClass} min-w-24`}>查询</button><button type="button" className={`${inputClass} min-w-24 hover:bg-slate-50`} onClick={() => { setDraft(initialFilters); setFilters(initialFilters); setPage(1); }}>重置</button></div></div>
      </form>

      {notice && <div role="status" className="flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800"><CheckCircle2 className="size-4 shrink-0" />{notice}</div>}

      <section className="overflow-hidden rounded-xl bg-white">
        <div role="tablist" aria-label="预约类型" className="flex gap-6 border-b border-slate-100 px-6">
          {["全部预约", "小班课", "私教课"].map((type) => <button role="tab" aria-selected={tab === type} key={type} onClick={() => { setTab(type); setPage(1); }} className={`border-b-[3px] px-2 py-5 text-sm transition ${tab === type ? "border-emerald-600 font-semibold text-emerald-700" : "border-transparent text-slate-600 hover:text-emerald-700"}`}>{type}</button>)}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-slate-50/90 text-slate-600"><tr>{["学员", "课程 / 类型", "上课时间", "老师", "权益处理", "预约状态", "操作"].map((heading) => <th key={heading} className="whitespace-nowrap px-5 py-4 font-medium first:pl-6">{heading}</th>)}</tr></thead>
            <tbody>{visible.map((record) => <tr key={record.id} className="border-b border-slate-100 transition hover:bg-slate-50/60">
              <td className="py-5 pl-6 pr-5"><div className="flex items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base text-slate-600">{record.member.slice(0, 1)}</div><div><p className="font-medium text-slate-900">{record.member}</p><p className="mt-1 text-xs text-slate-500">{record.memberInfo?.phone ?? "—"}</p></div></div></td>
              <td className="px-5 py-5"><div className="flex items-center gap-3 whitespace-nowrap"><span className="font-medium text-slate-800">{record.className}</span><span className={`rounded-lg px-2.5 py-1 text-xs ${record.type === "私教课" ? "bg-blue-50 text-blue-800" : "bg-booking-soft text-emerald-700"}`}>{record.type}</span></div></td>
              <td className="whitespace-nowrap px-5 py-5 tabular-nums">{record.date.slice(5, 7)}月{record.date.slice(8, 10)}日 {record.time}{record.session?.end ? ` – ${record.session.end}` : ""}</td>
              <td className="whitespace-nowrap px-5 py-5">{record.teacher}</td>
              <td className="whitespace-nowrap px-5 py-5">{record.benefit}</td>
              <td className="px-5 py-5"><span className={`inline-flex min-w-18 justify-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${statusStyles[record.status]}`}>{statusLabels[record.status]}</span></td>
              <td className="whitespace-nowrap px-5 py-5 text-emerald-700"><div className="flex items-center gap-3"><button className="hover:underline" onClick={() => { setNotice(""); setDrawer(record); }}>查看</button>{record.status === "已确认" && <><span className="text-slate-300">|</span><button className="hover:underline" onClick={() => updateStatus(record.id, "已签到")}>签到</button><span className="text-slate-300">|</span><button className="hover:underline" onClick={() => { setCancelId(record.id); setDrawer(record); }}>取消</button></>}</div></td>
            </tr>)}</tbody>
          </table>
          {visible.length === 0 && <div className="py-16 text-center text-sm text-slate-500">没有符合条件的预约，请调整筛选条件。</div>}
        </div>
        <div className="flex items-center justify-between gap-3 px-6 py-4"><span className="text-xs text-slate-500">共 {filtered.length} 条</span><nav aria-label="预约分页" className="flex gap-2"><button aria-label="上一页" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="flex size-8 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-35"><ChevronLeft className="size-4" /></button>{Array.from({ length: pages }, (_, index) => index + 1).map((number) => <button key={number} aria-label={`第 ${number} 页`} aria-current={number === currentPage ? "page" : undefined} onClick={() => setPage(number)} className={`size-8 rounded-md border text-xs ${number === currentPage ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 hover:bg-slate-50"}`}>{number}</button>)}<button aria-label="下一页" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className="flex size-8 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-35"><ChevronRight className="size-4" /></button></nav></div>
      </section>
      <p className="flex items-center gap-2 text-xs text-slate-500"><Info className="size-4 shrink-0" />管理员取消不受时间限制，操作将保留记录；所有操作会在当前应用会话内跨页面同步。</p>

      {drawer !== null && <div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="presentation" onMouseDown={() => { setDrawer(null); setCancelId(null); }}>
        <div role="dialog" aria-modal="true" aria-label={drawer === "create" ? "代学员预约" : "预约详情"} className="h-full w-full max-w-md overflow-y-auto bg-white shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between border-b border-slate-100 p-6"><div><div className="font-semibold text-slate-950">{drawer === "create" ? "代学员预约" : "预约详情"}</div><div className="mt-1 text-sm text-slate-500">{drawer === "create" ? "选择学员与已排课程，为学员创建预约。" : "查看课程信息与预约状态"}</div></div><button aria-label="关闭" className="flex size-8 items-center justify-center rounded-md hover:bg-slate-100" onClick={() => { setDrawer(null); setCancelId(null); }}><X className="size-4" /></button></div>
          {drawer === "create" ? <form onSubmit={createBooking} className="space-y-6 p-6"><label className="block space-y-2"><span className="text-sm">学员</span><select required value={memberId} onChange={(event) => { setMemberId(event.target.value); setNotice(""); }} className={`${inputClass} w-full`}><option value="">请选择学员</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.phone}{bookingSession && !canBook(member, bookingSession).ok ? ` · ${canBook(member, bookingSession).reason}` : ""}</option>)}</select></label><label className="block space-y-2"><span className="text-sm">课程 / 上课时间</span><select required value={sessionId} onChange={(event) => { setSessionId(event.target.value); setNotice(""); }} className={`${inputClass} w-full`}><option value="">请选择课程</option>{sessions.filter((session) => session.isVisible).map((session) => <option key={session.id} value={session.id}>{templates.find((template) => template.id === session.classId)?.name} · {session.date} {session.start}–{session.end}</option>)}</select></label>{(notice || (bookingEligibility && !bookingEligibility.ok)) && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div>{notice || `${bookingEligibility?.reason}，请先办卡`}</div>{bookingMember && bookingEligibility && !bookingEligibility.ok && <button type="button" className="mt-3 rounded-md bg-amber-800 px-4 py-2 text-white" onClick={() => setCardMemberId(memberId)}>去办卡</button>}</div>}{bookingEligibility?.ok && bookingMember && <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">本次预约将使用：{bookingEligibility.benefit === "扣次 1 次" ? `扣次 1 次（剩余 ${bookingMember.privateRemaining} 次）` : bookingEligibility.benefit}</div>}<button className={`${primaryClass} w-full`} type="submit" disabled={!bookingEligibility?.ok}>确认预约</button><p className="text-xs text-slate-500">预约会同步到会员详情与对应排课名单。</p></form> : selected && <div className="space-y-6 p-6"><div className="flex items-center gap-3"><div className="flex size-12 items-center justify-center rounded-full bg-booking-soft text-lg text-emerald-700">{selected.member.slice(0, 1)}</div><div><p className="font-medium">{selected.member}</p><p className="text-sm text-slate-500">{selected.memberInfo?.phone}</p></div></div><dl className="space-y-5 text-sm">{[["课程", selected.className], ["类型", selected.type], ["日期", selected.date], ["时间", `${selected.time}${selected.session?.end ? ` – ${selected.session.end}` : ""}`], ["老师", selected.teacher], ["权益处理", selected.benefit], ["预约时间", selected.bookedAt], ["预约状态", statusLabels[selected.status]]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd>{value}</dd></div>)}</dl>{audit[selected.id] && <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">{audit[selected.id]}</p>}{selected.status === "已确认" && (cancelId === selected.id ? <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-sm text-amber-900">确认取消该预约？操作将保留记录。</p><div className="flex gap-3"><button className="rounded-md bg-amber-800 px-4 py-2 text-sm text-white" onClick={() => updateStatus(selected.id, "已取消")}>确认取消</button><button className="px-3 text-sm" onClick={() => setCancelId(null)}>返回</button></div></div> : <div className="flex gap-3"><button className={`${primaryClass} flex-1`} onClick={() => updateStatus(selected.id, "已签到")}>签到</button><button className={inputClass} onClick={() => setCancelId(selected.id)}>取消预约</button></div>)}</div>}
        </div>
      </div>}
      {cardMemberId && members.find((member) => member.id === cardMemberId) && <MemberCardDrawer member={members.find((member) => member.id === cardMemberId)!} onClose={() => setCardMemberId(null)} onSuccess={(message) => { setNotice(message); setCardMemberId(null); }} />}
    </div>
  );
}
