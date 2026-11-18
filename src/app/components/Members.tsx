import { Fragment, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useLocation } from "react-router";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CreditCard,
  Info,
  Pencil,
  Plus,
  Search,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useStore } from "../store-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import type { ClassSession, ClassTemplate, Member, Reservation } from "./data";
import { localDate } from "../lib/dates";
import { computeMonthlyStatus } from "../lib/cardStatus";
import { MemberCardDrawer, type MemberPackagePreset } from "./MemberCardDrawer";

type MemberRecord = Member;
type ReservationRow = {
  id: string;
  course: string;
  time: string;
  status: "已预约" | "已完成" | "已取消" | "缺席";
  benefit: string;
  detail: string;
};
type DrawerState =
  | { type: "add" }
  | { type: "card"; memberId: string; preset?: MemberPackagePreset }
  | { type: "edit"; memberId: string }
  | { type: "book"; memberId: string }
  | null;

const cardClass = "rounded-xl border border-slate-100 bg-white";
const primaryButtonClass = "h-11 rounded-lg bg-emerald-600 px-6 text-white hover:bg-emerald-700";
const filterTriggerClass = "h-11 rounded-lg border-slate-200 bg-white";

function formatLocalDate(date: Date) {
  return localDate(date);
}

function SimpleSelect({ value, onChange, options, optionLabels, ariaLabel, className = "", name }: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  optionLabels?: Record<string, string>;
  ariaLabel: string;
  className?: string;
  name?: string;
}) {
  return (
    <select name={name} aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} className={`h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 ${className}`}>
      {options.map((option) => <option key={option} value={option}>{optionLabels?.[option] ?? option}</option>)}
    </select>
  );
}

function DrawerShell({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="presentation" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="h-full w-full max-w-md overflow-y-auto bg-white shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div><div className="font-semibold text-slate-950">{title}</div><div className="mt-1 text-sm text-slate-500">{description}</div></div>
          <Button type="button" variant="ghost" size="icon" aria-label="关闭" onClick={onClose}><X /></Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Member["monthlyStatus"] }) {
  const styles: Record<Member["monthlyStatus"], string> = {
    有效: "bg-emerald-50 text-emerald-700",
    待激活: "bg-amber-50 text-amber-700",
    即将到期: "bg-orange-50 text-orange-700",
    已到期: "bg-slate-100 text-slate-600",
    暂无月卡: "bg-transparent text-slate-600",
  };
  return <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>;
}

function MemberDetail({ member, bookings, notice, onBack, onEdit, onCard, onBook }: {
  member: MemberRecord;
  bookings: ReservationRow[];
  notice: string;
  onBack: () => void;
  onEdit: () => void;
  onCard: (preset?: MemberPackagePreset) => void;
  onBook: () => void;
}) {
  const [activeTab, setActiveTab] = useState("预约记录");
  const [reservationStatus, setReservationStatus] = useState("全部状态");
  const [reservationPage, setReservationPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const tabs = ["预约记录", "购卡记录", "权益流水", "操作记录"];
  const filteredBookings = bookings.filter((item) => reservationStatus === "全部状态" || item.status === reservationStatus);
  const reservationPageSize = 3;
  const reservationPages = Math.max(1, Math.ceil(filteredBookings.length / reservationPageSize));
  const currentReservationPage = Math.min(reservationPage, reservationPages);
  const visibleBookings = filteredBookings.slice((currentReservationPage - 1) * reservationPageSize, currentReservationPage * reservationPageSize);

  return (
    <div className="min-h-full bg-booking-canvas p-5 font-['Noto_Sans_SC',sans-serif] text-slate-700 lg:p-7">
      <div className="mb-5 flex items-center gap-3 text-sm"><Button variant="ghost" className="h-auto px-0 text-slate-600 hover:bg-transparent hover:text-emerald-700" onClick={onBack}>会员管理</Button><span className="text-slate-400">/</span><span className="font-semibold text-slate-900">会员详情</span></div>
      <section className={`${cardClass} mb-4 flex flex-wrap items-center justify-between gap-5 px-5 py-5 lg:px-7`}>
        <div className="flex items-center gap-5"><div className="flex size-20 items-center justify-center rounded-full bg-booking-soft text-3xl font-medium text-emerald-700">{member.name.slice(0, 1)}</div><div><div className="flex flex-wrap items-center gap-3"><div className="text-2xl font-semibold text-slate-950">{member.name}</div>{member.wechat && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="size-3.5" />已绑定微信</span>}</div><div className="mt-1 text-sm text-slate-500">{member.phone} · 会员编号 {member.id}</div></div></div>
        <div className="flex flex-wrap gap-3"><Button variant="outline" className="h-11 rounded-lg border-slate-300 px-5" onClick={onEdit}><Pencil />编辑资料</Button><Button variant="outline" className="h-11 rounded-lg border-slate-300 px-5" onClick={onBook}><CalendarDays />代约课程</Button><Button className={primaryButtonClass} onClick={() => onCard()}><Plus />办理购卡</Button></div>
      </section>
      {notice && <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="size-4" />{notice}</div>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(280px,0.95fr)]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <section className={`${cardClass} p-5`}>
              <div className="flex items-center gap-4"><div className="flex size-14 items-center justify-center rounded-full bg-booking-soft text-emerald-700"><CalendarDays className="size-7" /></div><div className="text-lg font-semibold text-slate-900">小班课月卡</div><StatusPill status={member.monthlyStatus} />{member.monthlyFrozen && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">已冻结</span>}</div>
              <div className="mt-5 text-sm text-slate-500">有效期</div><div className="mt-1 text-xl font-semibold text-slate-950">{member.expiry ? `至 ${member.expiry}` : "暂无有效月卡"}</div><div className="mt-2 text-sm text-slate-500">办理后立即生效 · 月卡每天最多一节小班课</div>
              <div className="mt-5 flex items-center gap-2 rounded-lg bg-booking-soft px-4 py-3 text-sm text-emerald-700"><CalendarDays className="size-4" />预约与卡项权益实时联动</div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm"><span className="text-slate-500">支持月卡与季卡续费</span><Button variant="ghost" className="h-auto px-0 text-emerald-700 hover:bg-transparent" onClick={() => onCard("pass")}>办理续费 <ChevronRight /></Button></div>
            </section>
            <section className={`${cardClass} p-5`}>
              <div className="flex items-center gap-4"><div className="flex size-14 items-center justify-center rounded-full bg-booking-soft text-emerald-700"><UserRound className="size-7" /></div><div className="text-lg font-semibold text-slate-900">私教卡</div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{member.privateActivatedAt ? "无有效期" : "待激活"}</span>{member.privateFrozen && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">已冻结</span>}</div>
              <div className="mt-8 grid grid-cols-2 divide-x divide-slate-200 text-center"><div><div className="text-3xl font-semibold text-slate-950">{member.privateRemaining}<span className="ml-2 text-base font-normal">次</span></div><div className="mt-1 text-sm text-slate-500">可用次数</div></div><div><div className="text-3xl font-semibold text-slate-950">{member.frozen}<span className="ml-2 text-base font-normal">次</span></div><div className="mt-1 text-sm text-slate-500">预约冻结</div></div></div>
              <div className="mt-7 border-b border-slate-100 pb-5 text-sm text-slate-500">完成上课后扣次；取消或缺席不扣次</div><div className="flex justify-end pt-4"><Button variant="ghost" className="h-auto px-0 text-emerald-700 hover:bg-transparent" onClick={() => onCard("private")}>购买次数 <ChevronRight /></Button></div>
            </section>
          </div>
          <section className={`${cardClass} overflow-hidden`}>
            <div className="flex gap-7 border-b border-slate-100 px-5">{tabs.map((tab) => <Button key={tab} variant="ghost" onClick={() => setActiveTab(tab)} className={`h-14 rounded-none border-b-[3px] px-1 hover:bg-transparent ${activeTab === tab ? "border-emerald-600 font-semibold text-emerald-700" : "border-transparent text-slate-600"}`}>{tab}</Button>)}</div>
            {activeTab === "预约记录" ? <>
              <div className="px-5 py-3"><SimpleSelect value={reservationStatus} onChange={(value) => { setReservationStatus(value); setReservationPage(1); }} options={["全部状态", "已预约", "已完成"]} ariaLabel="预约状态" className="w-40" /></div>
              <div className="overflow-x-auto px-5"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{["课程", "上课时间", "预约状态", "权益处理", "操作"].map((item) => <th key={item} className="px-4 py-3 font-medium">{item}</th>)}</tr></thead>
                <tbody>{visibleBookings.map((item) => <Fragment key={item.id}>
                  <tr className="border-b border-slate-100"><td className="px-4 py-3">{item.course}</td><td className="px-4 py-3 tabular-nums">{item.time}</td><td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">{item.status}</span></td><td className="px-4 py-3">{item.benefit}</td><td className="px-4 py-3"><Button variant="link" className="h-auto p-0 text-emerald-700" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>{expandedId === item.id ? "收起" : "查看"}</Button></td></tr>
                  {expandedId === item.id && <tr className="bg-slate-50/80"><td colSpan={5} className="px-4 py-4 text-sm leading-6 text-slate-600"><div className="font-medium text-slate-800">预约明细</div><div className="mt-1">{item.detail}</div><div className="mt-1 text-xs text-slate-500">记录编号：{item.id} · 当前为前端 mock 数据</div></td></tr>}
                </Fragment>)}</tbody>
              </table></div>
              <div className="flex items-center justify-between px-5 py-4 text-sm text-slate-500"><span>共 {filteredBookings.length} 条记录</span><div className="flex gap-2"><Button size="icon" variant="outline" className="size-8" disabled={currentReservationPage === 1} onClick={() => setReservationPage(currentReservationPage - 1)}><ChevronLeft /></Button>{Array.from({ length: reservationPages }, (_, index) => index + 1).map((number) => <Button key={number} size="icon" variant={number === currentReservationPage ? "default" : "outline"} className={`size-8 ${number === currentReservationPage ? "bg-emerald-600 text-white" : ""}`} onClick={() => setReservationPage(number)}>{number}</Button>)}<Button size="icon" variant="outline" className="size-8" disabled={currentReservationPage === reservationPages} onClick={() => setReservationPage(currentReservationPage + 1)}><ChevronRight /></Button></div></div>
            </> : <div className="py-16 text-center text-sm text-slate-500">{activeTab}暂无更多记录</div>}
          </section>
        </div>
        <div className="space-y-4">
          <section className={`${cardClass} p-5`}><div className="flex items-center justify-between border-b border-slate-100 pb-4"><div className="text-lg font-semibold text-slate-900">基本资料</div><Button variant="ghost" className="h-auto px-0" onClick={onEdit}><Pencil />编辑</Button></div><dl className="mt-4 grid grid-cols-[6rem_1fr] gap-y-4 text-sm"><dt className="text-slate-500">姓名</dt><dd>{member.name}</dd><dt className="text-slate-500">手机号</dt><dd>{member.phone}</dd><dt className="text-slate-500">微信关联</dt><dd className={member.wechat ? "text-emerald-700" : ""}>{member.wechat ? "已验证绑定" : "未绑定"}</dd><dt className="text-slate-500">登记日期</dt><dd>{member.joinedAt}</dd><dt className="text-slate-500">登记方式</dt><dd>后台录入</dd></dl><div className="mt-5 border-t border-slate-100 pt-4"><div className="text-sm text-slate-500">备注</div><div className={`mt-2 text-sm ${member.notes ? "text-slate-800" : "text-slate-400"}`}>{member.notes || "暂无备注"}</div></div></section>
          <section className={`${cardClass} p-5`}><div className="border-b border-slate-100 pb-4 text-lg font-semibold text-slate-900">最近操作</div>{member.activities.length ? <div className="relative mt-5 space-y-7 pl-7 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px before:bg-slate-200">{member.activities.slice(0, 8).map((activity, index) => <div className="relative" key={activity.id}><span className={`absolute -left-[1.7rem] top-1 size-2.5 rounded-full ring-4 ring-white ${index === 0 ? "bg-emerald-600" : "bg-slate-400"}`} /><div className="text-sm text-slate-500">{activity.time}</div><div className="mt-2 text-sm font-medium text-slate-900">{activity.description}</div><div className="mt-1 text-xs text-slate-500">{activity.actor}</div></div>)}</div> : <div className="py-10 text-center text-sm text-slate-400">暂无操作记录</div>}</section>
        </div>
      </div>
    </div>
  );
}

function EditDrawer({ member, onClose, onConfirm }: { member: MemberRecord; onClose: () => void; onConfirm: (changes: Pick<MemberRecord, "name" | "phone" | "wechat" | "notes">) => void }) {
  const [wechat, setWechat] = useState(member.wechat ? "已绑定" : "未绑定");
  return <DrawerShell title="编辑会员资料" description="修改基本资料与会员备注。" onClose={onClose}><form className="space-y-5 p-6" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onConfirm({ name: String(form.get("name")), phone: String(form.get("phone")), wechat: wechat === "已绑定", notes: String(form.get("notes") ?? "") }); }}><div className="space-y-2"><div className="text-sm font-medium">姓名</div><Input name="name" required defaultValue={member.name} className="h-11 bg-white" /></div><div className="space-y-2"><div className="text-sm font-medium">手机号</div><Input name="phone" required defaultValue={member.phone} className="h-11 bg-white" /></div><div className="space-y-2"><div className="text-sm font-medium">微信绑定</div><SimpleSelect value={wechat} onChange={setWechat} options={["已绑定", "未绑定"]} ariaLabel="微信绑定" className="h-11 w-full" /></div><div className="space-y-2"><div className="text-sm font-medium">备注</div><Textarea name="notes" defaultValue={member.notes} placeholder="记录会员偏好或注意事项" className="min-h-24 bg-white" /></div><Button type="submit" className={`${primaryButtonClass} w-full`}>保存资料</Button></form></DrawerShell>;
}

function BookingDrawer({ member, sessions, templates, onClose, onConfirm, onGoCard }: { member: MemberRecord; sessions: ClassSession[]; templates: ClassTemplate[]; onClose: () => void; onConfirm: (sessionId: string) => void; onGoCard: () => void }) {
  const { canBook } = useStore();
  const visibleSessions = sessions.filter((session) => session.isVisible);
  const [sessionId, setSessionId] = useState(visibleSessions[0]?.id ?? "");
  const optionLabel = (session: ClassSession) => {
    const eligibility = canBook(member, session);
    return `${templates.find((item) => item.id === session.classId)?.name ?? "课程"} · ${session.date} ${session.start}–${session.end} · ${session.instructor}${eligibility.ok ? "" : ` · ${eligibility.reason}`}`;
  };
  const options = visibleSessions.map(optionLabel);
  const selectedSession = visibleSessions.find((item) => item.id === sessionId);
  const selectedLabel = selectedSession ? optionLabel(selectedSession) : "";
  const eligibility = selectedSession ? canBook(member, selectedSession) : { ok: false, reason: "请选择排课", benefit: "无" as const };
  return <DrawerShell title="代约课程" description={`从可见排课中为 ${member.name} 创建预约。`} onClose={onClose}><form className="space-y-5 p-6" onSubmit={(event) => { event.preventDefault(); if (sessionId && eligibility.ok) onConfirm(sessionId); }}><div className="space-y-2"><div className="text-sm font-medium">选择排课</div>{visibleSessions.length ? <SimpleSelect value={selectedLabel} onChange={(value) => setSessionId(visibleSessions.find((item) => optionLabel(item) === value)?.id ?? "")} options={options} ariaLabel="选择排课" className="h-11 w-full" /> : <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">暂无可预约排课</div>}</div>{!eligibility.ok && selectedSession && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div>{eligibility.reason}，请先办卡</div><Button type="button" className="mt-3 h-9 bg-amber-800 text-white hover:bg-amber-900" onClick={onGoCard}>去办卡</Button></div>}<div className="space-y-2"><div className="text-sm font-medium">预约备注</div><Textarea placeholder="选填，记录会员需求" className="min-h-24 bg-white" /></div>{eligibility.ok && <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">本次预约将使用：{eligibility.benefit === "扣次 1 次" ? `扣次 1 次（剩余 ${member.privateRemaining} 次）` : eligibility.benefit}</div>}<Button type="submit" disabled={!sessionId || !eligibility.ok} className={`${primaryButtonClass} w-full`}>确认代约</Button></form></DrawerShell>;
}

export function Members() {
  const location = useLocation();
  const {
    sessions,
    templates,
    members: storeMembers,
    reservations,
    addMember: storeAddMember,
    updateMember: storeUpdateMember,
    addReservation: storeAddReservation,
    canBook,
  } = useStore();
  const todayKey = localDate();
  const members = useMemo(
    () => storeMembers.map((member) => ({ ...member, monthlyStatus: computeMonthlyStatus(member, todayKey) })),
    [storeMembers, todayKey],
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [notice, setNotice] = useState("");
  const [keyword, setKeyword] = useState("");
  const [draftKeyword, setDraftKeyword] = useState("");
  const [status, setStatus] = useState("全部");
  const [wechat, setWechat] = useState("全部");
  const [quickFilter, setQuickFilter] = useState("全部会员");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const memberId = (location.state as { memberId?: string } | null)?.memberId;
    if (memberId) {
      setSelectedMemberId(memberId);
      setNotice("");
    }
  }, [location.key, location.state]);

  const filtered = useMemo(() => members.filter((member) => {
    const matchesKeyword = !keyword || `${member.name}${member.phone}`.includes(keyword);
    const matchesStatus = status === "全部" || member.monthlyStatus === status;
    const matchesWechat = wechat === "全部" || (wechat === "已绑定" ? member.wechat : !member.wechat);
    const matchesQuick = quickFilter === "全部会员" || (quickFilter === "月卡待激活" && member.monthlyStatus === "待激活") || (quickFilter === "月卡即将到期" && member.monthlyStatus === "即将到期") || (quickFilter === "私教次数不足" && member.privateRemaining < 3);
    return matchesKeyword && matchesStatus && matchesWechat && matchesQuick;
  }), [members, keyword, status, wechat, quickFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleMembers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;
  const drawerMember = drawer && "memberId" in drawer ? members.find((member) => member.id === drawer.memberId) : null;
  const today = new Date();
  const expiringSoon = members.filter((member) => {
    if (!member.expiry) return false;
    const days = (new Date(`${member.expiry}T12:00:00`).getTime() - new Date(`${formatLocalDate(today)}T12:00:00`).getTime()) / 86400000;
    return days >= 0 && days <= 7;
  }).length;
  const stats = [
    { label: "会员总数", value: members.length, icon: UsersRound, warm: false },
    { label: "有效月卡", value: members.filter((member) => member.monthlyStatus === "有效").length, icon: CalendarDays, warm: false },
    { label: "待激活月卡", value: members.filter((member) => member.monthlyStatus === "待激活").length, icon: CreditCard, warm: true },
    { label: "7天内到期", value: expiringSoon, icon: CircleAlert, warm: true },
  ];

  const addMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    if (!name || !phone) return;
    const nextNumber = Math.max(...members.map((member) => Number(member.id.slice(1)))) + 1;
    storeAddMember({ id: `M${String(nextNumber).padStart(6, "0")}`, name, phone, wechat: false, monthlyStatus: "暂无月卡", privateRemaining: 0, frozen: 0, joinedAt: formatLocalDate(new Date()), notes: "", activities: [], monthlyFrozen: false, monthlyRefunded: false, privateFrozen: false, privateRefunded: false, cardActivities: [], cards: [] });
    setDrawer(null);
    setNotice(`已成功新增会员 ${name}。`);
  };
  const confirmEdit = (memberId: string, changes: Pick<MemberRecord, "name" | "phone" | "wechat" | "notes">) => {
    storeUpdateMember(memberId, changes);
    setDrawer(null);
    setNotice("会员资料已保存。");
  };
  const confirmBooking = (memberId: string, sessionId: string) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return;
    const template = templates.find((item) => item.id === session.classId);
    const member = members.find((item) => item.id === memberId);
    if (!member) return;
    const eligibility = canBook(member, session);
    if (!eligibility.ok) return;
    const reservation: Reservation = { id: crypto.randomUUID(), member: member.name, memberId, sessionId, className: template?.name ?? "课程", date: session.date, time: session.start, status: "已确认", benefit: eligibility.benefit, bookedAt: new Date().toLocaleString("zh-CN", { hour12: false }) };
    storeAddReservation(reservation);
    setDrawer(null);
    setNotice("代约课程成功，预约记录已更新。");
  };
  const memberBookings: ReservationRow[] = selectedMember ? reservations
    .filter((reservation) => reservation.memberId === selectedMember.id)
    .map((reservation) => {
      const session = sessions.find((item) => item.id === reservation.sessionId);
      const template = templates.find((item) => item.id === session?.classId);
      const statusMap: Record<Reservation["status"], ReservationRow["status"]> = { 已确认: "已预约", 已签到: "已完成", 已取消: "已取消", 未到: "缺席" };
      return {
        id: reservation.id,
        course: `${reservation.className} / ${session?.instructor ?? "待定老师"}`,
        time: `${reservation.date.slice(5, 7)}月${reservation.date.slice(8, 10)}日 ${reservation.time}${session?.end ? ` – ${session.end}` : ""}`,
        status: statusMap[reservation.status],
        benefit: reservation.status === "已取消" ? "无" : reservation.benefit,
        detail: `预约时间：${reservation.bookedAt}；场地：${session?.room ?? "待定"}；当前状态：${statusMap[reservation.status]}。`,
      };
    }) : [];

  if (selectedMember) {
    return <>
      <MemberDetail member={selectedMember} bookings={memberBookings} notice={notice} onBack={() => { setSelectedMemberId(null); setNotice(""); }} onEdit={() => setDrawer({ type: "edit", memberId: selectedMember.id })} onCard={(preset) => setDrawer({ type: "card", memberId: selectedMember.id, preset })} onBook={() => setDrawer({ type: "book", memberId: selectedMember.id })} />
      {drawer?.type === "card" && drawerMember && <MemberCardDrawer member={drawerMember} preset={drawer.preset} onClose={() => setDrawer(null)} onSuccess={setNotice} />}
      {drawer?.type === "edit" && drawerMember && <EditDrawer member={drawerMember} onClose={() => setDrawer(null)} onConfirm={(changes) => confirmEdit(drawerMember.id, changes)} />}
      {drawer?.type === "book" && drawerMember && <BookingDrawer member={drawerMember} sessions={sessions} templates={templates} onClose={() => setDrawer(null)} onConfirm={(sessionId) => confirmBooking(drawerMember.id, sessionId)} onGoCard={() => setDrawer({ type: "card", memberId: drawerMember.id })} />}
    </>;
  }

  return (
    <div className="min-h-full space-y-5 bg-booking-canvas p-5 font-['Noto_Sans_SC',sans-serif] text-slate-700 lg:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="text-3xl font-semibold text-slate-950">会员管理</div><div className="mt-1 text-sm text-slate-500">查看会员资料、月卡状态与私教次数</div></div><Button className={primaryButtonClass} onClick={() => { setNotice(""); setDrawer({ type: "add" }); }}><Plus />新增会员</Button></div>
      {notice && <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="size-4" />{notice}</div>}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon, warm }) => <div key={label} className={`${cardClass} flex items-center gap-5 px-5 py-5`}><div className={`flex size-16 items-center justify-center rounded-full ${warm ? "bg-orange-50 text-amber-700" : "bg-booking-soft text-emerald-700"}`}><Icon className="size-7" strokeWidth={1.8} /></div><div><div className="text-sm text-slate-600">{label}</div><div className="mt-1 text-3xl font-semibold tabular-nums text-slate-950">{value}</div></div></div>)}</div>
      <section className={`${cardClass} p-5`}><div className="grid items-center gap-4 lg:grid-cols-[minmax(260px,1.45fr)_minmax(180px,0.8fr)_minmax(180px,0.8fr)_auto]"><div className="relative"><Search className="absolute left-4 top-3.5 size-4 text-slate-500" /><Input value={draftKeyword} onChange={(event) => setDraftKeyword(event.target.value)} placeholder="姓名 / 手机号" className="h-11 border-slate-200 bg-white pl-11" /></div><div className="flex items-center gap-3"><span className="shrink-0 text-sm font-medium">月卡状态:</span><SimpleSelect value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={["全部", "有效", "待激活", "即将到期", "已到期", "暂无月卡"]} ariaLabel="月卡状态" className={`w-full ${filterTriggerClass}`} /></div><div className="flex items-center gap-3"><span className="shrink-0 text-sm font-medium">微信绑定:</span><SimpleSelect value={wechat} onChange={(value) => { setWechat(value); setPage(1); }} options={["全部", "已绑定", "未绑定"]} ariaLabel="微信绑定" className={`w-full ${filterTriggerClass}`} /></div><div className="flex gap-3"><Button className={`${primaryButtonClass} min-w-24`} onClick={() => { setKeyword(draftKeyword.trim()); setPage(1); }}>查询</Button><Button variant="outline" className="h-11 min-w-24 rounded-lg border-slate-300" onClick={() => { setDraftKeyword(""); setKeyword(""); setStatus("全部"); setWechat("全部"); setQuickFilter("全部会员"); setPage(1); }}>重置</Button></div></div><div className="mt-4 flex flex-wrap gap-3">{["全部会员", "月卡待激活", "月卡即将到期", "私教次数不足"].map((item) => <Button key={item} onClick={() => { setQuickFilter(item); setPage(1); }} className={`h-9 rounded-full px-5 ${quickFilter === item ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{item}</Button>)}</div></section>
      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4"><div className="text-lg font-semibold text-slate-950">会员列表</div><div className="text-sm text-slate-500">共 {filtered.length} 位会员</div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{["会员", "微信绑定", "月卡状态", "私教次数", "最近上课", "操作"].map((heading) => <th key={heading} className="px-5 py-4 font-medium">{heading}</th>)}</tr></thead><tbody>{visibleMembers.map((member) => <tr key={member.id} className="border-b border-slate-100 transition hover:bg-slate-50/70"><td className="px-5 py-3"><div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-base text-slate-600">{member.name.slice(0, 1)}</div><div><div className="font-semibold text-slate-900">{member.name}</div><div className="mt-0.5 text-xs text-slate-500">{member.phone}</div></div></div></td><td className="px-5 py-3"><span className={`rounded-lg px-3 py-1 text-xs ${member.wechat ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{member.wechat ? "已绑定" : "未绑定"}</span></td><td className="px-5 py-3"><div className="flex items-center gap-2"><StatusPill status={member.monthlyStatus} />{member.expiry && <span className="text-xs text-slate-500">到期 {member.expiry}</span>}{member.monthlyStatus === "待激活" && <span className="text-xs text-slate-500">首次上课后起算</span>}{member.monthlyFrozen && <span className="text-xs text-blue-700">已冻结</span>}</div></td><td className="px-5 py-3">{member.privateRemaining ? <div><div className="text-slate-900">可用 {member.privateRemaining} 次</div><div className="mt-0.5 text-xs text-slate-500">冻结 {member.frozen} 次{member.privateFrozen ? " · 卡包已冻结" : ""}</div></div> : <span className="text-amber-700">已购卡，待激活</span>}</td><td className="px-5 py-3 tabular-nums text-slate-600">{member.lastClass ?? "—"}</td><td className="px-5 py-3"><div className="flex items-center gap-3 text-emerald-700"><Button variant="link" className="h-auto p-0 text-emerald-700" onClick={() => { setSelectedMemberId(member.id); setNotice(""); }}>查看</Button><span className="text-slate-300">|</span><Button variant="link" className="h-auto p-0 text-emerald-700" onClick={() => { setNotice(""); setDrawer({ type: "card", memberId: member.id }); }}>{member.monthlyStatus === "待激活" || member.monthlyStatus === "暂无月卡" ? "开卡" : member.monthlyStatus === "已到期" ? "续费" : "购卡续费"}</Button><span className="text-slate-300">|</span><Button variant="link" className="h-auto p-0 text-emerald-700" onClick={() => setSelectedMemberId(member.id)}>更多</Button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-500">没有符合条件的会员，请调整筛选条件。</div>}</div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><SimpleSelect value={String(pageSize)} onChange={(value) => { setPageSize(Number(value)); setPage(1); }} options={["10", "20"]} optionLabels={{ "10": "每页 10 条", "20": "每页 20 条" }} ariaLabel="每页条数" className="w-32" /><div className="flex gap-2"><Button variant="outline" size="icon" className="size-9" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft /></Button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <Button key={number} variant={currentPage === number ? "default" : "outline"} size="icon" onClick={() => setPage(number)} className={`size-9 ${currentPage === number ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}`}>{number}</Button>)}<Button variant="outline" size="icon" className="size-9" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight /></Button></div></div>
      </section>
      <div className="flex items-center gap-2 text-xs text-slate-500"><Info className="size-4" />当前显示每页 {pageSize} 条；手机号验证后关联微信账号，线下购卡由管理员登记。</div>
      {drawer?.type === "add" && <DrawerShell title="新增会员" description="录入会员基本资料，后续可继续办理卡项。" onClose={() => setDrawer(null)}><form onSubmit={addMember} className="space-y-5 p-6"><div className="space-y-2"><div className="text-sm font-medium">会员姓名</div><Input name="name" required placeholder="请输入姓名" className="h-11 bg-white" /></div><div className="space-y-2"><div className="text-sm font-medium">手机号</div><Input name="phone" required placeholder="请输入手机号" className="h-11 bg-white" /></div><Button type="submit" className={`${primaryButtonClass} w-full`}>确认新增</Button></form></DrawerShell>}
      {drawer?.type === "card" && drawerMember && <MemberCardDrawer member={drawerMember} preset={drawer.preset} onClose={() => setDrawer(null)} onSuccess={setNotice} />}
    </div>
  );
}
