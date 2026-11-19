import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import {
  CalendarCheck,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  MapPin,
  Phone,
  Star,
  UserRoundX,
  UsersRound,
  X,
} from "lucide-react";
import { useStore } from "../store-context";
import type { ClassSession } from "./data";
import { Button } from "./ui/button";
import { DateRangePicker } from "./DatePicker";

type Tab = "近期排课" | "历史课程" | "操作记录";

const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function InstructorDetail({ instructorId }: { instructorId: string }) {
  const {
    instructors,
    sessions,
    templates,
    reservations,
    openEditInstructor,
    openCreateSession,
    openEditSession,
    toggleInstructorStatus,
  } = useStore();
  const instructor = instructors.find((item) => item.id === instructorId);
  const [tab, setTab] = useState<Tab>("近期排课");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [courseType, setCourseType] = useState("全部");
  const [page, setPage] = useState(1);
  const [confirmStatus, setConfirmStatus] = useState(false);

  useEffect(() => {
    if (!confirmStatus) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmStatus(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [confirmStatus]);

  if (!instructor) return <Navigate to="/instructors" replace />;

  const today = localDate(new Date());
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const sevenDayKey = localDate(sevenDaysLater);
  const instructorSessions = sessions.filter((session) => session.instructor === instructor.name);
  const upcoming = instructorSessions.filter((session) => session.date >= today).sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  const history = instructorSessions.filter((session) => session.date < today).sort((a, b) => `${b.date}${b.start}`.localeCompare(`${a.date}${a.start}`));
  const nextSession = upcoming[0] ?? null;
  const futureSevenDays = upcoming.filter((session) => session.date <= sevenDayKey);
  const formatOf = (session: ClassSession) => templates.find((template) => template.id === session.classId)?.format ?? "团课";
  const classNameOf = (session: ClassSession) => templates.find((template) => template.id === session.classId)?.name ?? "未关联课程";
  const bookedOf = (session: ClassSession) => Math.max(session.booked, reservations.filter((reservation) => reservation.sessionId === session.id && reservation.status !== "已取消").length);
  const teachingTypes = Array.from(new Set(instructorSessions.map(formatOf)));
  const upcomingWithoutNext = upcoming.filter((session) => session.id !== nextSession?.id);
  const filteredUpcoming = upcomingWithoutNext.filter((session) =>
    (!dateFrom || session.date >= dateFrom) &&
    (!dateTo || session.date <= dateTo) &&
    (courseType === "全部" || formatOf(session) === courseType)
  );
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredUpcoming.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleUpcoming = filteredUpcoming.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const schedule = () => openCreateSession(undefined, undefined, undefined, undefined, instructor.name);
  const changeStatus = () => {
    toggleInstructorStatus(instructor.id);
    setConfirmStatus(false);
  };

  return (
    <div className="space-y-5 bg-stone-100 p-4 text-stone-700 sm:p-5 lg:p-8">
      <div className="flex items-center gap-2 text-sm"><Link to="/instructors" className="text-stone-500 hover:text-emerald-700">教练管理</Link><span className="text-stone-300">/</span><span className="font-medium text-stone-900">教练详情</span></div>

      <section className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-5">
          <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-teal-600 text-3xl font-semibold text-white shadow-sm">{instructor.name.slice(0, 1)}</div>
          <div><div className="flex items-center gap-3"><div className="text-2xl font-semibold text-stone-950">{instructor.name}</div><span className={`rounded-full px-2.5 py-1 text-xs ${instructor.status === "启用" ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{instructor.status}</span></div><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-500"><span className="flex items-center gap-1.5"><Phone className="size-4" />{instructor.phone}</span><span>工号：YS-{instructor.id.replace(/\D/g, "").padStart(4, "0")}</span></div></div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="h-10 border-stone-300" onClick={() => openEditInstructor(instructor)}><Edit3 className="size-4" />编辑资料</Button>
          <Button className="h-10 bg-emerald-600 text-white hover:bg-emerald-700" onClick={schedule}><CalendarPlus className="size-4" />新增排课</Button>
          <Button variant="outline" className="h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setConfirmStatus(true)}>{instructor.status === "启用" ? "停用教练" : "启用教练"}</Button>
        </div>
      </section>

      <div className="grid items-stretch gap-4 xl:grid-cols-[1fr_1.35fr]">
        <section className="h-full rounded-xl border border-stone-200 bg-white p-6">
          <div className="border-b border-stone-100 pb-4 text-lg font-semibold text-stone-900">教练资料</div>
          <div className="space-y-5 pt-5">
            <DetailRow label="授课类型"><div className="flex flex-wrap gap-1.5">{teachingTypes.length ? teachingTypes.map((type) => <Chip key={type}>{type === "团课" ? "小班课" : "私教课"}</Chip>) : <span className="text-stone-400">暂无授课记录</span>}</div></DetailRow>
            <DetailRow label="擅长课程"><div className="flex flex-wrap gap-1.5">{instructor.specialty.map((item) => <Chip key={item}>{item}</Chip>)}</div></DetailRow>
            <DetailRow label="教练简介"><div className="leading-6 text-stone-700">{instructor.bio || "暂无简介"}</div></DetailRow>
            <DetailRow label="小程序展示"><div className="text-stone-600">{instructor.status === "启用" ? "已对外展示，会员可查看教练资料与相关课程。" : "当前已停用，不在小程序端展示。"}</div></DetailRow>
          </div>
        </section>

        <section className="h-full rounded-xl border border-stone-200 bg-white p-6">
          <div className="border-b border-stone-100 pb-4 text-lg font-semibold text-stone-900">近期安排</div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <MiniStat label="未来 7 天课程数" value={futureSevenDays.length} />
            <MiniStat label="小班课数" value={futureSevenDays.filter((session) => formatOf(session) === "团课").length} />
            <MiniStat label="私教课数" value={futureSevenDays.filter((session) => formatOf(session) === "私教").length} />
          </div>
          <div className="mt-5">
            <div className="mb-2 text-xs text-stone-500">下一节课</div>
            {nextSession ? <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="font-medium text-stone-900">{classNameOf(nextSession)}</span><Chip>{formatOf(nextSession) === "团课" ? "小班课" : "私教课"}</Chip></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-600"><span className="flex items-center gap-1"><CalendarCheck className="size-3.5" />{nextSession.date}</span><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{nextSession.start}–{nextSession.end}</span><span className="flex items-center gap-1"><MapPin className="size-3.5" />{nextSession.room}</span><span className="flex items-center gap-1"><UsersRound className="size-3.5" />已约 {bookedOf(nextSession)} 人</span></div></div><Button variant="outline" className="h-8 shrink-0 border-emerald-200 bg-white text-xs text-emerald-700" onClick={() => openEditSession(nextSession)}>查看名单</Button></div></div> : <div className="rounded-xl border border-dashed border-stone-200 py-8 text-center text-sm text-stone-400">暂无待上课程</div>}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="flex gap-7 border-b border-stone-100 px-6">
          {(["近期排课", "历史课程", "操作记录"] as Tab[]).map((item) => <Button key={item} variant="ghost" onClick={() => { setTab(item); setPage(1); }} className={`h-14 rounded-none border-b-2 px-1 hover:bg-transparent ${tab === item ? "border-emerald-600 text-emerald-700" : "border-transparent text-stone-500"}`}>{item}</Button>)}
        </div>
        {tab === "近期排课" && <>
          <div className="flex flex-wrap items-center gap-3 border-b border-stone-100 px-6 py-4">
            <DateRangePicker direction="upcoming" ariaLabel="排课日期范围" from={dateFrom} to={dateTo} onChange={(from, to) => { setDateFrom(from); setDateTo(to); setPage(1); }} />
            <select aria-label="课程类型" value={courseType} onChange={(event) => { setCourseType(event.target.value); setPage(1); }} className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"><option>全部</option><option>团课</option><option>私教</option></select>
            {(dateFrom || dateTo || courseType !== "全部") && <Button variant="ghost" className="h-9 text-stone-500" onClick={() => { setDateFrom(""); setDateTo(""); setCourseType("全部"); setPage(1); }}>重置</Button>}
          </div>
          <SessionTable sessions={visibleUpcoming} classNameOf={classNameOf} formatOf={formatOf} bookedOf={bookedOf} onView={openEditSession} empty="暂无符合条件的近期排课" />
          <Pagination page={currentPage} pages={totalPages} total={filteredUpcoming.length} onChange={setPage} />
        </>}
        {tab === "历史课程" && <SessionTable sessions={history} classNameOf={classNameOf} formatOf={formatOf} bookedOf={bookedOf} onView={openEditSession} empty="暂无历史课程" history />}
        {tab === "操作记录" && <div className="p-6">{instructor.activities.length ? <div className="space-y-0">{instructor.activities.map((activity, index) => <div key={activity.id} className="relative flex gap-4 pb-7 last:pb-0"><div className="relative flex w-3 justify-center"><span className={`mt-1.5 size-2.5 rounded-full ${index === 0 ? "bg-emerald-600" : "bg-stone-300"}`} />{index < instructor.activities.length - 1 && <span className="absolute bottom-0 top-4 w-px bg-stone-200" />}</div><div><div className="text-sm font-medium text-stone-800">{activity.description}</div><div className="mt-1 text-xs text-stone-400">{activity.time} · {activity.actor}</div></div></div>)}</div> : <div className="py-12 text-center text-sm text-stone-400">暂无操作记录</div>}</div>}
      </section>

      {confirmStatus && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/40 p-4" onMouseDown={() => setConfirmStatus(false)}><div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white shadow-xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between border-b border-stone-100 p-5"><div><div className="font-semibold text-stone-900">{instructor.status === "启用" ? "停用教练" : "启用教练"}</div><div className="mt-1 text-xs text-stone-500">请确认本次状态变更</div></div><Button variant="ghost" size="icon" className="size-8" onClick={() => setConfirmStatus(false)}><X className="size-4" /></Button></div><div className="p-5"><div className="flex gap-3 rounded-lg bg-rose-50 p-4 text-sm leading-6 text-rose-800"><UserRoundX className="mt-1 size-5 shrink-0" /><span>停用前需先处理待上课场次，历史授课与预约记录保留</span></div></div><div className="flex justify-end gap-3 border-t border-stone-100 p-5"><Button variant="outline" onClick={() => setConfirmStatus(false)}>取消</Button><Button className={instructor.status === "启用" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-emerald-600 text-white hover:bg-emerald-700"} onClick={changeStatus}>确认{instructor.status === "启用" ? "停用" : "启用"}</Button></div></div></div>}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="mb-2 text-xs text-stone-400">{label}</div><div className="text-sm">{children}</div></div>;
}
function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs text-teal-700">{children}</span>;
}
function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-stone-50 px-3 py-4 text-center"><div className="text-xl font-semibold text-stone-900">{value}</div><div className="mt-1 text-[11px] text-stone-500">{label}</div></div>;
}

function SessionTable({ sessions, classNameOf, formatOf, bookedOf, onView, empty, history = false }: {
  sessions: ClassSession[];
  classNameOf: (session: ClassSession) => string;
  formatOf: (session: ClassSession) => string;
  bookedOf: (session: ClassSession) => number;
  onView: (session: ClassSession) => void;
  empty: string;
  history?: boolean;
}) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-stone-50 text-stone-500"><tr>{["课程", "时间", "教室", "已约人数", "状态", "操作"].map((item) => <th key={item} className="px-6 py-3 font-medium">{item}</th>)}</tr></thead><tbody>{sessions.map((session) => <tr key={session.id} className="border-t border-stone-100"><td className="px-6 py-4"><div className="font-medium text-stone-800">{classNameOf(session)}</div><div className="mt-1 text-xs text-stone-400">{formatOf(session) === "团课" ? "小班课" : "私教课"}</div></td><td className="px-6 py-4 tabular-nums text-stone-600">{session.date} {session.start}–{session.end}</td><td className="px-6 py-4 text-stone-600">{session.room}</td><td className="px-6 py-4 text-stone-600">{bookedOf(session)} 人</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${history ? "bg-stone-100 text-stone-500" : session.isVisible ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{history ? "已结束" : session.isVisible ? "待上课" : "未发布"}</span></td><td className="px-6 py-4"><Button variant="link" className="h-auto p-0 text-emerald-700" onClick={() => onView(session)}>查看名单</Button></td></tr>)}</tbody></table>{!sessions.length && <div className="py-14 text-center text-sm text-stone-400">{empty}</div>}</div>;
}

function Pagination({ page, pages, total, onChange }: { page: number; pages: number; total: number; onChange: (page: number) => void }) {
  return <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4"><span className="text-xs text-stone-400">共 {total} 节</span><div className="flex gap-2"><Button variant="outline" size="icon" className="size-8" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft className="size-4" /></Button>{Array.from({ length: pages }, (_, index) => index + 1).map((number) => <Button key={number} variant={number === page ? "default" : "outline"} size="icon" className={`size-8 ${number === page ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}`} onClick={() => onChange(number)}>{number}</Button>)}<Button variant="outline" size="icon" className="size-8" disabled={page === pages} onClick={() => onChange(page + 1)}><ChevronRight className="size-4" /></Button></div></div>;
}
